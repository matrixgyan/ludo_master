import { getRedisClient } from './client';
import { RedisKeys } from './keys';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

export class RateLimiter {
  private static localLimits = new Map<string, { count: number; expiresAt: number }>();

  /**
   * Check rate limit using Redis sliding window / counter with memory fallback
   */
  static async check(
    action: string,
    identifier: string,
    limit: number = 20,
    windowSeconds: number = 10
  ): Promise<RateLimitResult> {
    const redis = getRedisClient();
    const key = RedisKeys.rateLimit(action, identifier);

    if (!redis) {
      const now = Date.now();
      const item = this.localLimits.get(key);
      if (!item || item.expiresAt <= now) {
        this.localLimits.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
        return { allowed: true, remaining: limit - 1, resetSeconds: windowSeconds };
      }

      item.count += 1;
      const remaining = Math.max(0, limit - item.count);
      const resetSeconds = Math.ceil((item.expiresAt - now) / 1000);
      return { allowed: item.count <= limit, remaining, resetSeconds };
    }

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      const ttl = await redis.ttl(key);
      const remaining = Math.max(0, limit - current);

      return {
        allowed: current <= limit,
        remaining,
        resetSeconds: ttl > 0 ? ttl : windowSeconds,
      };
    } catch {
      return { allowed: true, remaining: 1, resetSeconds: windowSeconds };
    }
  }
}
