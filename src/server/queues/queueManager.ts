import { Queue, QueueOptions } from 'bullmq';
import { getRedisConfig, isRedisConfigured } from '../redis/client';
import { config, Logger } from '../config/env';

// Base queue options with standard retry backoff and telemetry
function createQueueOptions(): QueueOptions {
  return {
    connection: getRedisConfig(),
    prefix: config.BULLMQ_PREFIX,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        age: 3600, // 1 hour
        count: 1000,
      },
      removeOnFail: {
        age: 86400, // 24 hours
        count: 5000,
      },
    },
  };
}

// In-memory dummy queue stub for when Redis is unconfigured
function createDummyQueue<T>(name: string): Queue<T> {
  return {
    name,
    add: async (jobName: string, data: T) => {
      return { id: `mock-${Date.now()}`, name: jobName, data } as any;
    },
    getJobCounts: async () => ({ waiting: 0, active: 0, failed: 0, completed: 0, delayed: 0, paused: 0 }),
    close: async () => {},
  } as unknown as Queue<T>;
}

// 1. Email Queue
export interface EmailJobData {
  type: 'WELCOME' | 'PASSWORD_RESET' | 'VERIFICATION' | 'SECURITY_ALERT';
  to: string;
  subject: string;
  payload: Record<string, unknown>;
}

// 2. Notification Queue
export interface NotificationJobData {
  type: 'GAME_RESULT' | 'PLAYER_INVITATION' | 'FRIEND_REQUEST' | 'SYSTEM_ALERT';
  recipientUserId: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

// 3. Game Processing Queue
export interface GameProcessingJobData {
  type: 'GAME_COMPLETED' | 'GAME_ABANDONED' | 'EVENT_AGGREGATION' | 'SNAPSHOT_CREATION';
  gameId: string;
  winnerUserId?: string;
  finalState?: Record<string, unknown>;
  timestamp: number;
}

// 4. Leaderboard Queue
export interface LeaderboardJobData {
  type: 'RECALCULATE_RANKS' | 'UPDATE_PLAYER_SCORE' | 'PERIODIC_ROLLOVER';
  leaderboardType: 'GLOBAL' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  userId?: string;
  scoreDelta?: number;
  period?: string;
}

// 5. Cleanup Queue
export interface CleanupJobData {
  type: 'CLEANUP_MATCHMAKING' | 'CLEANUP_STALE_GAMES' | 'PURGE_OLD_SNAPSHOTS';
  maxAgeHours?: number;
}

// 6. Blockchain Queue (Web3 Infrastructure shell - NO fake transactions)
export interface BlockchainJobData {
  type: 'MONITOR_CONFIRMATIONS' | 'INDEX_BLOCK' | 'CHECK_TX_RECEIPT';
  network: string;
  chainId: number;
  transactionHash?: string;
}

// Global Queue Registry
export class QueueRegistry {
  private static emailQueue: Queue<EmailJobData> | null = null;
  private static notificationQueue: Queue<NotificationJobData> | null = null;
  private static gameProcessingQueue: Queue<GameProcessingJobData> | null = null;
  private static leaderboardQueue: Queue<LeaderboardJobData> | null = null;
  private static cleanupQueue: Queue<CleanupJobData> | null = null;
  private static blockchainQueue: Queue<BlockchainJobData> | null = null;

  static getEmailQueue(): Queue<EmailJobData> {
    if (!this.emailQueue) {
      this.emailQueue = isRedisConfigured()
        ? new Queue<EmailJobData>('emailQueue', createQueueOptions())
        : createDummyQueue<EmailJobData>('emailQueue');
    }
    return this.emailQueue;
  }

  static getNotificationQueue(): Queue<NotificationJobData> {
    if (!this.notificationQueue) {
      this.notificationQueue = isRedisConfigured()
        ? new Queue<NotificationJobData>('notificationQueue', createQueueOptions())
        : createDummyQueue<NotificationJobData>('notificationQueue');
    }
    return this.notificationQueue;
  }

  static getGameProcessingQueue(): Queue<GameProcessingJobData> {
    if (!this.gameProcessingQueue) {
      this.gameProcessingQueue = isRedisConfigured()
        ? new Queue<GameProcessingJobData>('gameProcessingQueue', createQueueOptions())
        : createDummyQueue<GameProcessingJobData>('gameProcessingQueue');
    }
    return this.gameProcessingQueue;
  }

  static getLeaderboardQueue(): Queue<LeaderboardJobData> {
    if (!this.leaderboardQueue) {
      this.leaderboardQueue = isRedisConfigured()
        ? new Queue<LeaderboardJobData>('leaderboardQueue', createQueueOptions())
        : createDummyQueue<LeaderboardJobData>('leaderboardQueue');
    }
    return this.leaderboardQueue;
  }

  static getCleanupQueue(): Queue<CleanupJobData> {
    if (!this.cleanupQueue) {
      this.cleanupQueue = isRedisConfigured()
        ? new Queue<CleanupJobData>('cleanupQueue', createQueueOptions())
        : createDummyQueue<CleanupJobData>('cleanupQueue');
    }
    return this.cleanupQueue;
  }

  static getBlockchainQueue(): Queue<BlockchainJobData> {
    if (!this.blockchainQueue) {
      this.blockchainQueue = isRedisConfigured()
        ? new Queue<BlockchainJobData>('blockchainQueue', createQueueOptions())
        : createDummyQueue<BlockchainJobData>('blockchainQueue');
    }
    return this.blockchainQueue;
  }

  /**
   * Health metrics for all active BullMQ queues
   */
  static async getQueueMetrics(): Promise<Record<string, { waiting: number; active: number; failed: number }>> {
    if (!isRedisConfigured()) {
      return {
        email: { waiting: 0, active: 0, failed: 0 },
        notification: { waiting: 0, active: 0, failed: 0 },
        gameProcessing: { waiting: 0, active: 0, failed: 0 },
        leaderboard: { waiting: 0, active: 0, failed: 0 },
        cleanup: { waiting: 0, active: 0, failed: 0 },
        blockchain: { waiting: 0, active: 0, failed: 0 },
      };
    }

    const queues = [
      { name: 'email', q: this.getEmailQueue() },
      { name: 'notification', q: this.getNotificationQueue() },
      { name: 'gameProcessing', q: this.getGameProcessingQueue() },
      { name: 'leaderboard', q: this.getLeaderboardQueue() },
      { name: 'cleanup', q: this.getCleanupQueue() },
      { name: 'blockchain', q: this.getBlockchainQueue() },
    ];

    const metrics: Record<string, { waiting: number; active: number; failed: number }> = {};
    for (const item of queues) {
      try {
        const counts = await item.q.getJobCounts('waiting', 'active', 'failed');
        metrics[item.name] = {
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          failed: counts.failed || 0,
        };
      } catch (err) {
        metrics[item.name] = { waiting: 0, active: 0, failed: 0 };
      }
    }
    return metrics;
  }

  /**
   * Graceful close of all queues
   */
  static async closeAll(): Promise<void> {
    const queues = [
      this.emailQueue,
      this.notificationQueue,
      this.gameProcessingQueue,
      this.leaderboardQueue,
      this.cleanupQueue,
      this.blockchainQueue,
    ];

    Logger.info('Closing BullMQ queues...');
    for (const q of queues) {
      if (q) {
        await q.close().catch(() => {});
      }
    }
    this.emailQueue = null;
    this.notificationQueue = null;
    this.gameProcessingQueue = null;
    this.leaderboardQueue = null;
    this.cleanupQueue = null;
    this.blockchainQueue = null;
  }
}
