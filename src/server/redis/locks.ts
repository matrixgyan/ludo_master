import { getRedisClient } from './client';
import { Logger } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

/**
 * Distributed Lock backed by Redis with atomic Lua release and local lock fallback
 */
export class DistributedLock {
  private static localLocks = new Map<string, Promise<void>>();

  static async acquire(key: string, ttlMs = 5000): Promise<string | null> {
    const redis = getRedisClient();
    const token = uuidv4();

    if (redis) {
      try {
        const result = await redis.set(key, token, 'PX', ttlMs, 'NX');
        if (result === 'OK') {
          return token;
        }
        return null;
      } catch (err) {
        Logger.warn(`Redis lock acquire error on key ${key}: ${String(err)}`);
      }
    }

    // Local in-memory lock fallback when Redis is absent
    if (this.localLocks.has(key)) {
      return null;
    }
    this.localLocks.set(key, Promise.resolve());
    return token;
  }

  static async release(key: string, token: string): Promise<boolean> {
    const redis = getRedisClient();

    if (redis) {
      // Atomic release Lua script
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      try {
        const result = await redis.eval(luaScript, 1, key, token);
        return result === 1;
      } catch (err) {
        Logger.warn(`Redis lock release error on key ${key}: ${String(err)}`);
      }
    }

    this.localLocks.delete(key);
    return true;
  }

  static async withLock<T>(
    key: string,
    action: () => Promise<T>,
    ttlMs = 5000,
    retryCount = 3,
    retryDelayMs = 150
  ): Promise<T> {
    let token: string | null = null;
    for (let i = 0; i < retryCount; i++) {
      token = await this.acquire(key, ttlMs);
      if (token) break;
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }

    if (!token) {
      throw new Error(`Failed to acquire distributed lock for resource: ${key}`);
    }

    try {
      return await action();
    } finally {
      await this.release(key, token);
    }
  }
}
