import { Worker } from 'bullmq';
import { createGameProcessingWorker } from './workers/gameProcessingWorker';
import { createLeaderboardWorker } from './workers/leaderboardWorker';
import { createCleanupWorker } from './workers/cleanupWorker';
import { createNotificationWorker } from './workers/notificationWorker';
import { createEmailWorker } from './workers/emailWorker';
import { createBlockchainWorker } from './workers/blockchainWorker';
import { isRedisConfigured } from '../redis/client';
import { Logger } from '../config/env';

export class WorkerManager {
  private static workers: Worker[] = [];

  static startAll(): void {
    if (this.workers.length > 0) return;
    if (!isRedisConfigured()) {
      Logger.info('Redis is not configured. BullMQ background workers will not start in local preview mode.');
      return;
    }

    Logger.info('Starting BullMQ background workers...');
    try {
      this.workers.push(createGameProcessingWorker());
      this.workers.push(createLeaderboardWorker());
      this.workers.push(createCleanupWorker());
      this.workers.push(createNotificationWorker());
      this.workers.push(createEmailWorker());
      this.workers.push(createBlockchainWorker());
      Logger.info(`Successfully started ${this.workers.length} BullMQ workers.`);
    } catch (err) {
      Logger.warn('Failed to initialize one or more BullMQ workers (Redis offline)', { error: String(err) });
    }
  }

  static async stopAll(): Promise<void> {
    if (this.workers.length === 0) return;
    Logger.info('Stopping all BullMQ background workers...');
    const closePromises = this.workers.map((w) => w.close().catch(() => {}));
    await Promise.all(closePromises);
    this.workers = [];
    Logger.info('All BullMQ workers stopped cleanly.');
  }
}
