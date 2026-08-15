import { Worker, Job } from 'bullmq';
import { GameProcessingJobData } from '../queueManager';
import { getRedisConfig } from '../../redis/client';
import { getDb } from '../../db/client';
import { playerStatistics, games, gamePlayers } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { config, Logger } from '../../config/env';

export function createGameProcessingWorker(): Worker<GameProcessingJobData> {
  const worker = new Worker<GameProcessingJobData>(
    'gameProcessingQueue',
    async (job: Job<GameProcessingJobData>) => {
      Logger.info(`Processing game job ${job.id} of type ${job.data.type} for game ${job.data.gameId}`);
      const { type, gameId, winnerUserId } = job.data;

      if (type === 'GAME_COMPLETED') {
        const db = getDb();
        try {
          // Fetch players of this game
          const players = await db.select().from(gamePlayers).where(eq(gamePlayers.gameId, gameId));

          for (const p of players) {
            const isWinner = p.userId === winnerUserId;
            // Update or Insert Player Statistics
            await db
              .insert(playerStatistics)
              .values({
                id: `stats_${p.userId}`,
                userId: p.userId,
                gamesPlayed: 1,
                gamesWon: isWinner ? 1 : 0,
                gamesLost: isWinner ? 0 : 1,
                gamesAbandoned: 0,
                winRate: isWinner ? '100.00' : '0.00',
              })
              .onConflictDoUpdate({
                target: playerStatistics.userId,
                set: {
                  gamesPlayed: sql`${playerStatistics.gamesPlayed} + 1`,
                  gamesWon: isWinner ? sql`${playerStatistics.gamesWon} + 1` : playerStatistics.gamesWon,
                  gamesLost: !isWinner ? sql`${playerStatistics.gamesLost} + 1` : playerStatistics.gamesLost,
                  winRate: sql`ROUND(((${playerStatistics.gamesWon} + ${isWinner ? 1 : 0})::numeric / (${playerStatistics.gamesPlayed} + 1)::numeric) * 100, 2)`,
                  updatedAt: new Date(),
                },
              });
          }

          Logger.info(`Successfully updated player statistics for completed game ${gameId}`);
        } catch (err) {
          Logger.error(`Failed to process player statistics for game ${gameId}`, err);
          throw err; // Trigger BullMQ retry
        }
      }
    },
    {
      connection: getRedisConfig(),
      prefix: config.BULLMQ_PREFIX,
      concurrency: config.BULLMQ_CONCURRENCY,
    }
  );

  worker.on('failed', (job, err) => {
    Logger.error(`Game processing job ${job?.id} failed with error: ${err.message}`, err);
  });

  return worker;
}
