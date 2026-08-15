import { Worker } from 'bullmq';
import { createGameProcessingWorker } from './workers/gameProcessingWorker';
import { createLeaderboardWorker } from './workers/leaderboardWorker';
import { isRedisConfigured } from '../redis/client';
import { Logger } from '../config/env';

export class BackgroundWorkerManager {
  private static workers: Worker[] = [];
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;

    if (!isRedisConfigured()) {
      Logger.info('Redis not configured. Background BullMQ workers will not be started.');
      return;
    }

    try {
      this.workers.push(createGameProcessingWorker());
      this.workers.push(createLeaderboardWorker());
      this.isInitialized = true;
      Logger.info(`Started ${this.workers.length} production background BullMQ workers`);
    } catch (err) {
      Logger.warn(`Failed to initialize background workers: ${String(err)}`);
    }
  }

  static async shutdown(): Promise<void> {
    Logger.info('Shutting down background workers...');
    for (const worker of this.workers) {
      await worker.close().catch(() => {});
    }
    this.workers = [];
    this.isInitialized = false;
  }
}
