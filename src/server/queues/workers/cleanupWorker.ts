import { Worker, Job } from 'bullmq';
import { CleanupJobData } from '../queueManager';
import { getRedisConfig, getRedisClient } from '../../redis/client';
import { RedisKeys } from '../../redis/keys';
import { config, Logger } from '../../config/env';

export function createCleanupWorker(): Worker<CleanupJobData> {
  const worker = new Worker<CleanupJobData>(
    'cleanupQueue',
    async (job: Job<CleanupJobData>) => {
      Logger.info(`Running periodic cleanup job ${job.id} of type ${job.data.type}`);
      const redis = getRedisClient();

      try {
        const modes = ['2_PLAYER', '4_PLAYER', 'SNAKE_LUDO'];
        const twoMinutesAgo = Date.now() - 120 * 1000;

        // Clean expired tickets from matchmaking sorted sets
        for (const mode of modes) {
          const queueKey = RedisKeys.matchmakingQueue(mode);
          const removed = await redis.zremrangebyscore(queueKey, '-inf', twoMinutesAgo);
          if (removed > 0) {
            Logger.info(`Cleaned ${removed} expired tickets from ${mode} queue`);
          }
        }
      } catch (err) {
        Logger.error('Cleanup worker encountered error', err);
        throw err;
      }
    },
    {
      connection: getRedisConfig(),
      prefix: config.BULLMQ_PREFIX,
      concurrency: 1,
    }
  );

  return worker;
}
