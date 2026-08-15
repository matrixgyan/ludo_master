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
}

export class MatchmakingService {
  private static localQueues = new Map<string, MatchmakingTicket[]>();

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
    if (redis) {
      const lockKey = RedisKeys.matchmakingLock(mode);
      try {
        return await DistributedLock.withLock(lockKey, async () => {
          const queueKey = RedisKeys.matchmakingQueue(mode);
          const ticketKey = RedisKeys.playerTicket(userId);

          // Save ticket and push user ID with timestamp score into sorted set
          const pipeline = redis.pipeline();
          pipeline.set(ticketKey, JSON.stringify(ticket), 'EX', 180);
          pipeline.zadd(queueKey, Date.now(), userId);
          await pipeline.exec();

          Logger.info(`User ${userId} (${username}) enqueued in Redis queue ${mode}`);
          return { success: true };
        });
      } catch (err) {
        Logger.warn(`Redis matchmaking enqueue error for ${userId}: ${String(err)}`);
      }
    }

    // Local fallback
    const list = this.localQueues.get(mode) || [];
    const filtered = list.filter((t) => t.userId !== userId);
    filtered.push(ticket);
    this.localQueues.set(mode, filtered);
    return { success: true };
  }

  static async cancel(userId: string, mode: string): Promise<boolean> {
    const redis = getRedisClient();
    if (redis) {
      try {
        const pipeline = redis.pipeline();
        pipeline.zrem(RedisKeys.matchmakingQueue(mode), userId);
        pipeline.del(RedisKeys.playerTicket(userId));
        await pipeline.exec();
        return true;
      } catch (err) {
        Logger.warn(`Failed to cancel matchmaking for ${userId}: ${String(err)}`);
      }
    }

    const list = this.localQueues.get(mode);
    if (list) {
      this.localQueues.set(mode, list.filter((t) => t.userId !== userId));
    }
    return true;
  }

  static async tryMatch(mode: '2_PLAYER' | '4_PLAYER' | 'SNAKE_LUDO'): Promise<MatchmakingTicket[] | null> {
    const requiredPlayers = mode === '2_PLAYER' ? 2 : mode === '4_PLAYER' ? 4 : 2;
    const redis = getRedisClient();

    if (redis) {
      const lockKey = RedisKeys.matchmakingLock(mode);
      try {
        return await DistributedLock.withLock(lockKey, async () => {
          const queueKey = RedisKeys.matchmakingQueue(mode);
          const candidateUserIds = (await (redis as any).zrange(queueKey, 0, requiredPlayers - 1)) as string[];

          if (candidateUserIds.length < requiredPlayers) {
            return null;
          }

          const matchedTickets: MatchmakingTicket[] = [];
          for (const uId of candidateUserIds) {
            const raw = await redis.get(RedisKeys.playerTicket(uId));
            if (raw) {
              matchedTickets.push(JSON.parse(raw) as MatchmakingTicket);
            }
          }

          if (matchedTickets.length === requiredPlayers) {
            const pipeline = redis.pipeline();
            for (const ticket of matchedTickets) {
              pipeline.zrem(queueKey, ticket.userId);
              pipeline.del(RedisKeys.playerTicket(ticket.userId));
            }
            await pipeline.exec();
            Logger.info(`Formed match for ${mode} with ${matchedTickets.length} players via Redis`);
            return matchedTickets;
          }

          return null;
        });
      } catch (err) {
        Logger.warn(`Error during match attempt for ${mode}: ${String(err)}`);
      }
    }

    // Local fallback
    const list = this.localQueues.get(mode) || [];
    if (list.length >= requiredPlayers) {
      const matched = list.slice(0, requiredPlayers);
      this.localQueues.set(mode, list.slice(requiredPlayers));
      return matched;
    }
    return null;
  }
}
