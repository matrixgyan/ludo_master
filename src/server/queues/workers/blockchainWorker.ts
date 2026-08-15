import { Worker, Job } from 'bullmq';
import { BlockchainJobData } from '../queueManager';
import { getRedisConfig } from '../../redis/client';
import { config, Logger } from '../../config/env';

/**
 * Blockchain Queue Worker Infrastructure
 * Ready for future EVM/USDT indexers and confirmation workers.
 * Note: Performs no fake operations or mock transactions.
 */
export function createBlockchainWorker(): Worker<BlockchainJobData> {
  const worker = new Worker<BlockchainJobData>(
    'blockchainQueue',
    async (job: Job<BlockchainJobData>) => {
      Logger.info(`Blockchain infrastructure worker polled job ${job.id} of type ${job.data.type}`);
    },
    {
      connection: getRedisConfig(),
      prefix: config.BULLMQ_PREFIX,
      concurrency: 2,
    }
  );

  return worker;
}
