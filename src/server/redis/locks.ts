import { getRedisClient, reportRedisError } from './client';
import { Logger } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

/**
 * Distributed Lock backed by Redis with atomic Lua release and local lock fallback
 */
export class DistributedLock {
  private static localLocks = new Map<string, { token: string; expiresAt: number }>();

  static async acquire(key: string, ttlMs = 5000): Promise<string | null> {
    const now = Date.now();
    const token = uuidv4();

    // 1. Try Redis lock if Redis is healthy and available
    const redis = getRedisClient();
    if (redis) {
      try {
        const result = await redis.set(key, token, 'PX', ttlMs, 'NX');
        if (result === 'OK') {
          return `redis:${token}`;
        }
        return null;
      } catch (err) {
        reportRedisError(err, `lock acquire on ${key}`);
        // Fall through to in-memory lock
      }
    }

    // 2. Local in-memory lock fallback
    const current = this.localLocks.get(key);
    if (current && current.expiresAt > now) {
      return null;
    }

    this.localLocks.set(key, { token, expiresAt: now + ttlMs });
    return `local:${token}`;
  }

  static async release(key: string, token: string): Promise<boolean> {
    if (!token) return true;

    if (token.startsWith('redis:')) {
      const rawToken = token.slice('redis:'.length);
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
          const result = await redis.eval(luaScript, 1, key, rawToken);
          return result === 1;
        } catch (err) {
          reportRedisError(err, `lock release on ${key}`);
        }
      }
    } else {
      const rawToken = token.slice('local:'.length);
      const current = this.localLocks.get(key);
      if (current && current.token === rawToken) {
        this.localLocks.delete(key);
      }
    }

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
      throw new Error(`Failed to acquire lock for resource: ${key}`);
    }

    try {
      return await action();
    } finally {
      await this.release(key, token).catch(() => {});
    }
  }
}
