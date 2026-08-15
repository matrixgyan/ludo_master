import { Worker, Job } from 'bullmq';
import { GameProcessingJobData } from '../queueManager';
import { getRedisConfig } from '../../redis/client';
import { getDb, isPostgresConfigured } from '../../db/client';
import { playerStatistics, matchHistory, gamePlayers } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { Logger } from '../../config/env';

export function createGameProcessingWorker(): Worker<GameProcessingJobData> {
  const worker = new Worker<GameProcessingJobData>(
    'gameProcessingQueue',
    async (job: Job<GameProcessingJobData>) => {
      Logger.info(`Processing game job ${job.id} for game ${job.data.gameId}`);
      const { type, gameId, winnerUserId, finalState } = job.data;

      if (type === 'GAME_COMPLETED' && isPostgresConfigured()) {
        const db = getDb();
        if (!db) return;

        try {
          // Fetch players of this game
          const players = await db.select().from(gamePlayers).where(eq(gamePlayers.gameId, gameId));

          for (const p of players) {
            const isWinner = p.userId === winnerUserId;
            // 1. Update or Insert Player Statistics
            await db
              .insert(playerStatistics)
              .values({
                id: `stats_${p.userId}`,
                userId: p.userId,
                gamesPlayed: 1,
                gamesWon: isWinner ? 1 : 0,
                gamesLost: isWinner ? 0 : 1,
                gamesAbandoned: 0,
                totalCaptures: 0,
                tokensReachedHome: p.tokensHome || 0,
                winRate: isWinner ? '100.00' : '0.00',
              })
              .onConflictDoUpdate({
                target: playerStatistics.userId,
                set: {
                  gamesPlayed: sql`${playerStatistics.gamesPlayed} + 1`,
                  gamesWon: isWinner ? sql`${playerStatistics.gamesWon} + 1` : playerStatistics.gamesWon,
                  gamesLost: !isWinner ? sql`${playerStatistics.gamesLost} + 1` : playerStatistics.gamesLost,
                  tokensReachedHome: sql`${playerStatistics.tokensReachedHome} + ${p.tokensHome || 0}`,
                  winRate: sql`ROUND(((${playerStatistics.gamesWon} + ${isWinner ? 1 : 0})::numeric / (${playerStatistics.gamesPlayed} + 1)::numeric) * 100, 2)`,
                  updatedAt: new Date(),
                },
              });

            // 2. Record Match History entry
            await db.insert(matchHistory).values({
              id: `mh_${gameId}_${p.userId}`,
              userId: p.userId,
              gameId,
              mode: (finalState as any)?.mode || '2_PLAYER',
              result: isWinner ? 'WON' : 'LOST',
              score: p.finalScore || 0,
              tokensHome: p.tokensHome || 0,
              playedAt: new Date(),
            });
          }

          Logger.info(`Successfully recorded player statistics and match history for game ${gameId}`);
        } catch (err) {
          Logger.error(`Failed to process player statistics for game ${gameId}`, err);
          throw err;
        }
      }
    },
    {
      connection: getRedisConfig(),
      prefix: 'ludo_prod',
      concurrency: 3,
    }
  );

  worker.on('error', (err) => {
    Logger.warn(`Game processing worker notice: ${err.message}`);
  });

  return worker;
}
