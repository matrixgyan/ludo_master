import { getRedisClient } from './client';
import { RedisKeys } from './keys';

export type PresenceStatus = 'ONLINE' | 'IN_LOBBY' | 'MATCHMAKING' | 'IN_GAME' | 'DISCONNECTED';

export interface UserPresenceData {
  userId: string;
  username: string;
  status: PresenceStatus;
  gameId?: string;
  lastHeartbeat: number;
}

export class PresenceManager {
  private static TTL_SECONDS = 45; // 45s heartbeat window
  private static memoryPresence = new Map<string, UserPresenceData>();

  /**
   * Heartbeat to mark player as active with specific presence state
   */
  static async heartbeat(
    userId: string,
    username: string,
    status: PresenceStatus,
    gameId?: string
  ): Promise<void> {
    const data: UserPresenceData = {
      userId,
      username,
      status,
      gameId,
      lastHeartbeat: Date.now(),
    };
    this.memoryPresence.set(userId, data);

    const redis = getRedisClient();
    if (!redis) return;

    const key = RedisKeys.userPresence(userId);
    try {
      const pipeline = redis.pipeline();
      pipeline.set(key, JSON.stringify(data), 'EX', PresenceManager.TTL_SECONDS);
      pipeline.sadd(RedisKeys.onlineUsersSet(), userId);
      await pipeline.exec();
    } catch {
      // Ignored in fallback mode
    }
  }

  /**
   * Retrieve current presence of a user
   */
  static async getPresence(userId: string): Promise<UserPresenceData | null> {
    const redis = getRedisClient();
    if (!redis) {
      return this.memoryPresence.get(userId) || null;
    }

    const key = RedisKeys.userPresence(userId);
    try {
      const val = await redis.get(key);
      if (!val) return this.memoryPresence.get(userId) || null;
      return JSON.parse(val) as UserPresenceData;
    } catch {
      return this.memoryPresence.get(userId) || null;
    }
  }

  /**
   * Set player explicitly as disconnected
   */
  static async setDisconnected(userId: string): Promise<void> {
    this.memoryPresence.delete(userId);
    const redis = getRedisClient();
    if (!redis) return;

    try {
      const pipeline = redis.pipeline();
      pipeline.del(RedisKeys.userPresence(userId));
      pipeline.srem(RedisKeys.onlineUsersSet(), userId);
      await pipeline.exec();
    } catch {
      // Ignored in fallback mode
    }
  }

  /**
   * Get total online user count
   */
  static async getOnlineCount(): Promise<number> {
    const redis = getRedisClient();
    if (!redis) {
      return this.memoryPresence.size;
    }

    try {
      return await redis.scard(RedisKeys.onlineUsersSet());
    } catch {
      return this.memoryPresence.size;
    }
  }
}
