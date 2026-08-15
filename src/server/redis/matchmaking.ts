import { getRedisClient } from './client';
import { RedisKeys } from './keys';
import { DistributedLock } from './locks';
import { Logger } from '../config/env';

export interface MatchmakingTicket {
  userId: string;
  username: string;
  avatarUrl?: string;
  mode: '2_PLAYER' | '4_PLAYER' | 'SNAKE_LUDO';
  enqueuedAt: number;
  matchedGameId?: string;
}

export class MatchmakingService {
  private static TICKET_TTL_SECONDS = 120;
  private static memoryQueue = new Map<string, MatchmakingTicket[]>();

  /**
   * Enqueue a player for matchmaking
   */
  static async enqueue(
    userId: string,
    username: string,
    mode: '2_PLAYER' | '4_PLAYER' | 'SNAKE_LUDO',
    avatarUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    const ticket: MatchmakingTicket = {
      userId,
      username,
      avatarUrl,
      mode,
      enqueuedAt: Date.now(),
    };

    const redis = getRedisClient();
    if (!redis) {
      const q = this.memoryQueue.get(mode) || [];
      const filtered = q.filter((t) => t.userId !== userId);
      filtered.push(ticket);
      this.memoryQueue.set(mode, filtered);
      return { success: true };
    }

    const queueKey = RedisKeys.matchmakingQueue(mode);
    const ticketKey = RedisKeys.matchmakingTicket(userId);

    try {
      const pipeline = redis.pipeline();
      pipeline.set(ticketKey, JSON.stringify(ticket), 'EX', MatchmakingService.TICKET_TTL_SECONDS);
      pipeline.zadd(queueKey, Date.now(), userId);
      await pipeline.exec();

      Logger.info(`User ${userId} joined matchmaking queue for mode ${mode}`);
      return { success: true };
    } catch (err) {
      // Memory fallback
      const q = this.memoryQueue.get(mode) || [];
      const filtered = q.filter((t) => t.userId !== userId);
      filtered.push(ticket);
      this.memoryQueue.set(mode, filtered);
      return { success: true };
    }
  }

  /**
   * Remove player from queue
   */
  static async cancel(userId: string, mode: string): Promise<boolean> {
    const q = this.memoryQueue.get(mode);
    if (q) {
      this.memoryQueue.set(
        mode,
        q.filter((t) => t.userId !== userId)
      );
    }

    const redis = getRedisClient();
    if (!redis) return true;

    try {
      const pipeline = redis.pipeline();
      pipeline.del(RedisKeys.matchmakingTicket(userId));
      pipeline.zrem(RedisKeys.matchmakingQueue(mode), userId);
      await pipeline.exec();
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Check queue and form matches atomically
   */
  static async tryMatch(mode: '2_PLAYER' | '4_PLAYER' | 'SNAKE_LUDO'): Promise<MatchmakingTicket[] | null> {
    const lockKey = RedisKeys.matchmakingLock(mode);
    const requiredPlayers = mode === '2_PLAYER' ? 2 : mode === '4_PLAYER' ? 4 : 2;

    return await DistributedLock.withLock(
      lockKey,
      async () => {
        const redis = getRedisClient();
        if (!redis) {
          const q = this.memoryQueue.get(mode) || [];
          if (q.length >= requiredPlayers) {
            const matched = q.slice(0, requiredPlayers);
            this.memoryQueue.set(mode, q.slice(requiredPlayers));
            return matched;
          }
          return null;
        }

        const queueKey = RedisKeys.matchmakingQueue(mode);

        try {
          const candidateUserIds = await redis.zrange(queueKey, 0, (requiredPlayers - 1) as unknown as string);
          if (candidateUserIds.length < requiredPlayers) {
            return null;
          }

          const tickets: MatchmakingTicket[] = [];
          for (const uid of candidateUserIds) {
            const ticketJson = await redis.get(RedisKeys.matchmakingTicket(uid));
            if (ticketJson) {
              tickets.push(JSON.parse(ticketJson));
            } else {
              await redis.zrem(queueKey, uid);
            }
          }

          if (tickets.length < requiredPlayers) {
            return null;
          }

          const popPipeline = redis.pipeline();
          for (const t of tickets) {
            popPipeline.zrem(queueKey, t.userId);
            popPipeline.del(RedisKeys.matchmakingTicket(t.userId));
          }
          await popPipeline.exec();

          return tickets;
        } catch {
          const q = this.memoryQueue.get(mode) || [];
          if (q.length >= requiredPlayers) {
            const matched = q.slice(0, requiredPlayers);
            this.memoryQueue.set(mode, q.slice(requiredPlayers));
            return matched;
          }
          return null;
        }
      },
      3000,
      1
    );
  }
}
