import { Worker, Job } from 'bullmq';
import { LeaderboardJobData } from '../queueManager';
import { getRedisConfig } from '../../redis/client';
import { getDb } from '../../db/client';
import { leaderboards, playerStatistics } from '../../db/schema';
import { desc, sql } from 'drizzle-orm';
import { config, Logger } from '../../config/env';

export function createLeaderboardWorker(): Worker<LeaderboardJobData> {
  const worker = new Worker<LeaderboardJobData>(
    'leaderboardQueue',
    async (job: Job<LeaderboardJobData>) => {
      Logger.info(`Processing leaderboard job ${job.id} for type ${job.data.leaderboardType}`);
      const { leaderboardType } = job.data;
      const db = getDb();

      try {
        // Query top players ordered by games won and win rate
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

        Logger.info(`Leaderboard rankings updated for ${leaderboardType} (${topPlayers.length} players ranked)`);
      } catch (err) {
        Logger.error(`Leaderboard calculation failed for ${leaderboardType}`, err);
        throw err;
      }
    },
    {
      connection: getRedisConfig(),
      prefix: config.BULLMQ_PREFIX,
      concurrency: 2,
    }
  );

  worker.on('failed', (job, err) => {
    Logger.error(`Leaderboard job ${job?.id} failed: ${err.message}`, err);
  });

  return worker;
}
