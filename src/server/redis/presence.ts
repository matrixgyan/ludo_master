import { getRedisClient, reportRedisError } from './client';
import { RedisKeys } from './keys';
import { Logger } from '../config/env';

export type PresenceStatus = 'ONLINE' | 'IN_LOBBY' | 'MATCHMAKING' | 'IN_GAME' | 'DISCONNECTED';

export interface UserPresenceData {
  userId: string;
  username: string;
  status: PresenceStatus;
  gameId?: string;
  lastHeartbeat: number;
}

export class PresenceManager {
  private static localPresence = new Map<string, UserPresenceData>();

  /**
   * Register or update user presence heartbeat
   */
  static async heartbeat(
    userId: string,
    username: string,
    status: PresenceStatus,
    gameId?: string
  ): Promise<void> {
    const presenceData: UserPresenceData = {
      userId,
      username,
      status,
      gameId,
      lastHeartbeat: Date.now(),
    };

    this.localPresence.set(userId, presenceData);

    const redis = getRedisClient();
    if (!redis) return;

    const key = RedisKeys.userPresence(userId);
    try {
      const pipeline = redis.pipeline();
      pipeline.set(key, JSON.stringify(presenceData), 'EX', 45); // 45s TTL
      pipeline.zadd(RedisKeys.onlineUsers(), Date.now(), userId);
      await pipeline.exec();
    } catch (err) {
      reportRedisError(err);
    }
  }

  /**
   * Get user presence data
   */
  static async getPresence(userId: string): Promise<UserPresenceData | null> {
    const redis = getRedisClient();
    if (redis) {
      try {
        const raw = await redis.get(RedisKeys.userPresence(userId));
        if (raw) {
          return JSON.parse(raw) as UserPresenceData;
        }
      } catch (err) {
        reportRedisError(err);
      }
    }
    return this.localPresence.get(userId) || null;
  }

  /**
   * Mark user as disconnected
   */
  static async setDisconnected(userId: string): Promise<void> {
    this.localPresence.delete(userId);

    const redis = getRedisClient();
    if (!redis) return;

    try {
      const pipeline = redis.pipeline();
      pipeline.del(RedisKeys.userPresence(userId));
      pipeline.zrem(RedisKeys.onlineUsers(), userId);
      await pipeline.exec();
    } catch (err) {
      reportRedisError(err);
    }
  }

  /**
   * Get total online player count
   */
  static async getOnlineCount(): Promise<number> {
    const redis = getRedisClient();
    if (redis) {
      try {
        const twoMinutesAgo = Date.now() - 120000;
        await redis.zremrangebyscore(RedisKeys.onlineUsers(), '-inf', twoMinutesAgo);
        return await redis.zcard(RedisKeys.onlineUsers());
      } catch (err) {
        reportRedisError(err);
      }
    }
    return this.localPresence.size;
  }
}
