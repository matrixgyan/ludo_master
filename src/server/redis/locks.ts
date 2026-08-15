import { v4 as uuidv4 } from 'uuid';
import { getRedisClient } from './client';
import { Logger } from '../config/env';

/**
 * Distributed Locking via Redis with Memory Fallback for offline development
 */
export class DistributedLock {
  private static localLocks = new Map<string, { token: string; expiresAt: number }>();

  private static releaseLuaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  /**
   * Acquire a lock with a unique token and automatic TTL expiration
   */
  static async acquire(
    key: string,
    ttlMs: number = 5000,
    retryCount: number = 3,
    retryDelayMs: number = 100
  ): Promise<{ acquired: boolean; token: string | null }> {
    const redis = getRedisClient();
    const token = uuidv4();

    if (!redis) {
      // Memory fallback lock
      const existing = this.localLocks.get(key);
      const now = Date.now();
      if (!existing || existing.expiresAt <= now) {
        this.localLocks.set(key, { token, expiresAt: now + ttlMs });
        return { acquired: true, token };
      }
      return { acquired: false, token: null };
    }

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const result = await redis.set(key, token, 'PX', ttlMs, 'NX');
        if (result === 'OK') {
          return { acquired: true, token };
        }
      } catch {
        // Fallback to local memory lock on error
        const existing = this.localLocks.get(key);
        const now = Date.now();
        if (!existing || existing.expiresAt <= now) {
          this.localLocks.set(key, { token, expiresAt: now + ttlMs });
          return { acquired: true, token };
        }
        return { acquired: false, token: null };
      }

      if (attempt < retryCount) {
        await new Promise((res) => setTimeout(res, retryDelayMs));
      }
    }

    return { acquired: false, token: null };
  }

  /**
   * Safely release lock only if the token matches
   */
  static async release(key: string, token: string): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) {
      const existing = this.localLocks.get(key);
      if (existing && existing.token === token) {
        this.localLocks.delete(key);
        return true;
      }
      return false;
    }

    try {
      const result = await redis.eval(DistributedLock.releaseLuaScript, 1, key, token);
      return result === 1;
    } catch {
      const existing = this.localLocks.get(key);
      if (existing && existing.token === token) {
        this.localLocks.delete(key);
        return true;
      }
      return false;
    }
  }

  /**
   * Helper to execute an async action inside a distributed lock block
   */
  static async withLock<T>(
    key: string,
    action: () => Promise<T>,
    ttlMs: number = 5000,
    retryCount: number = 3
  ): Promise<T> {
    const { acquired, token } = await DistributedLock.acquire(key, ttlMs, retryCount);
    if (!acquired || !token) {
      throw new Error(`Failed to acquire lock for key: ${key}`);
    }

    try {
      return await action();
    } finally {
      await DistributedLock.release(key, token);
    }
  }
}
