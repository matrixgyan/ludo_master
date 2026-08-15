import { Queue, QueueOptions } from 'bullmq';
import { getRedisConfig, isRedisConfigured } from '../redis/client';
import { Logger } from '../config/env';

function createQueueOptions(): QueueOptions {
  return {
    connection: getRedisConfig(),
    prefix: 'ludo_prod',
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        age: 3600,
        count: 1000,
      },
      removeOnFail: {
        age: 86400,
        count: 5000,
      },
    },
  };
}

function createDummyQueue<T>(name: string): Queue<T> {
  return {
    name,
    add: async (jobName: string, data: T) => {
      return { id: `mock-${Date.now()}`, name: jobName, data } as any;
    },
    getJobCounts: async () => ({ waiting: 0, active: 0, failed: 0, completed: 0, delayed: 0, paused: 0 }),
    close: async () => {},
    on: () => {},
  } as unknown as Queue<T>;
}

function safeInstantiateQueue<T>(name: string): Queue<T> {
  if (!isRedisConfigured()) {
    return createDummyQueue<T>(name);
  }
  try {
    const q = new Queue<T>(name, createQueueOptions());
    q.on('error', (err) => {
      Logger.warn(`BullMQ queue ${name} notice: ${err.message}`);
    });
    return q;
  } catch (err) {
    Logger.warn(`Falling back to memory queue for ${name}`);
    return createDummyQueue<T>(name);
  }
}

export interface GameProcessingJobData {
  type: 'GAME_COMPLETED' | 'GAME_ABANDONED';
  gameId: string;
  winnerUserId?: string;
  finalState?: Record<string, unknown>;
  timestamp: number;
}

export interface LeaderboardJobData {
  type: 'RECALCULATE_RANKS';
  leaderboardType: 'GLOBAL' | 'DAILY' | 'WEEKLY';
  userId?: string;
}

export interface CleanupJobData {
  type: 'CLEANUP_STALE_MATCHMAKING';
}

export class QueueRegistry {
  private static gameProcessingQueue: Queue<GameProcessingJobData> | null = null;
  private static leaderboardQueue: Queue<LeaderboardJobData> | null = null;
  private static cleanupQueue: Queue<CleanupJobData> | null = null;

  static getGameProcessingQueue(): Queue<GameProcessingJobData> {
    if (!this.gameProcessingQueue) {
      this.gameProcessingQueue = safeInstantiateQueue<GameProcessingJobData>('gameProcessingQueue');
    }
    return this.gameProcessingQueue;
  }

  static getLeaderboardQueue(): Queue<LeaderboardJobData> {
    if (!this.leaderboardQueue) {
      this.leaderboardQueue = safeInstantiateQueue<LeaderboardJobData>('leaderboardQueue');
    }
    return this.leaderboardQueue;
  }

  static getCleanupQueue(): Queue<CleanupJobData> {
    if (!this.cleanupQueue) {
      this.cleanupQueue = safeInstantiateQueue<CleanupJobData>('cleanupQueue');
    }
    return this.cleanupQueue;
  }

  static async getQueueMetrics(): Promise<Record<string, { waiting: number; active: number; failed: number }>> {
    if (!isRedisConfigured()) {
      return {
        gameProcessing: { waiting: 0, active: 0, failed: 0 },
        leaderboard: { waiting: 0, active: 0, failed: 0 },
        cleanup: { waiting: 0, active: 0, failed: 0 },
      };
    }

    const queues = [
      { name: 'gameProcessing', q: this.getGameProcessingQueue() },
      { name: 'leaderboard', q: this.getLeaderboardQueue() },
      { name: 'cleanup', q: this.getCleanupQueue() },
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
      } catch {
        metrics[item.name] = { waiting: 0, active: 0, failed: 0 };
      }
    }
    return metrics;
  }

  static async closeAll(): Promise<void> {
    const queues = [this.gameProcessingQueue, this.leaderboardQueue, this.cleanupQueue];
    for (const q of queues) {
      if (q) {
        await q.close().catch(() => {});
      }
    }
    this.gameProcessingQueue = null;
    this.leaderboardQueue = null;
    this.cleanupQueue = null;
  }
}
