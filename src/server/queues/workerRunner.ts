import { Worker } from 'bullmq';
import { createGameProcessingWorker } from './workers/gameProcessingWorker';
import { createLeaderboardWorker } from './workers/leaderboardWorker';
import { WalletBackgroundWorkers } from './workers/walletWorkers';
import { isRedisAvailable, reportRedisError } from '../redis/client';
import { Logger } from '../config/env';

export class BackgroundWorkerManager {
  private static workers: Worker[] = [];
  private static isInitialized = false;

  static initialize(): void {
    // Start wallet background services (deposit confirmations, treasury sync, reconciliation)
    WalletBackgroundWorkers.initialize();

    if (this.isInitialized) return;

    if (!isRedisAvailable()) {
      Logger.info('Redis not available or degraded. BullMQ background workers will run in-memory.');
      return;
    }

    try {
      this.workers.push(createGameProcessingWorker());
      this.workers.push(createLeaderboardWorker());
      this.isInitialized = true;
      Logger.info(`Started ${this.workers.length} production background BullMQ workers`);
    } catch (err) {
      reportRedisError(err, 'initialize background workers');
    }
  }

  static async shutdown(): Promise<void> {
    Logger.info('Shutting down background workers...');
    WalletBackgroundWorkers.shutdown();
    for (const worker of this.workers) {
      await worker.close().catch(() => {});
    }
    this.workers = [];
    this.isInitialized = false;
  }
}
