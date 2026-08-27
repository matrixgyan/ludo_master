import { Worker, Job } from 'bullmq';
import { LeaderboardJobData } from '../queueManager';
import { getRedisConfig, reportRedisError } from '../../redis/client';
import { getDb, isPostgresConfigured } from '../../db/client';
import { leaderboards, playerStatistics } from '../../db/schema';
import { desc } from 'drizzle-orm';
import { Logger } from '../../config/env';

export function createLeaderboardWorker(): Worker<LeaderboardJobData> {
  const worker = new Worker<LeaderboardJobData>(
    'leaderboardQueue',
    async (job: Job<LeaderboardJobData>) => {
      Logger.info(`Processing leaderboard recalculation for ${job.data.leaderboardType}`);
      const { leaderboardType } = job.data;

      if (!isPostgresConfigured()) return;
      const db = getDb();
      if (!db) return;

      try {
        const topPlayers = await db
          .select({
            userId: playerStatistics.userId,
            gamesWon: playerStatistics.gamesWon,
          })
          .from(playerStatistics)
          .orderBy(desc(playerStatistics.gamesWon))
          .limit(100);

        let rank = 1;
        for (const player of topPlayers) {
          const score = player.gamesWon * 100;
          await db
            .insert(leaderboards)
            .values({
              id: `lb_${leaderboardType}_ALL_TIME_${player.userId}`,
              leaderboardType,
              period: 'ALL_TIME',
              userId: player.userId,
              score,
              rank,
            })
            .onConflictDoUpdate({
              target: [leaderboards.leaderboardType, leaderboards.period, leaderboards.userId],
              set: {
                score,
                rank,
                updatedAt: new Date(),
              },
            });
          rank++;
        }

        Logger.info(`Leaderboard rankings updated for ${leaderboardType}`);
      } catch (err) {
        Logger.error(`Leaderboard calculation failed: ${String(err)}`);
      }
    },
    {
      connection: getRedisConfig(),
      prefix: 'ludo_prod',
      concurrency: 2,
    }
  );

  worker.on('error', (err) => {
    reportRedisError(err, 'leaderboard worker');
  });

  return worker;
}
