import { Request, Response, NextFunction } from 'express';
import { getRedisClient, reportRedisError } from './client';
import { RedisKeys } from './keys';
import { Logger } from '../config/env';

/**
 * Redis-backed sliding window rate limiter middleware
 */
export function rateLimiter(options: { maxRequests: number; windowSeconds: number }) {
  const localHits = new Map<string, { count: number; resetAt: number }>();

  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `ip:${ip}:${req.path}`;
    const now = Date.now();

    const redis = getRedisClient();
    if (redis) {
      const redisKey = RedisKeys.rateLimit(key);
      try {
        const count = await redis.incr(redisKey);
        if (count === 1) {
          await redis.expire(redisKey, options.windowSeconds);
        }

        if (count > options.maxRequests) {
          const ttl = await redis.ttl(redisKey);
          res.setHeader('Retry-After', ttl);
          res.status(429).json({
            error: 'Too many requests. Please slow down.',
            retryAfterSeconds: ttl,
          });
          return;
        }

        res.setHeader('X-RateLimit-Limit', options.maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - count));
        next();
        return;
      } catch (err) {
        reportRedisError(err, `rateLimiter for ${key}`);
      }
    }

    // Local fallback limiter
    const record = localHits.get(key);
    if (!record || record.resetAt <= now) {
      localHits.set(key, { count: 1, resetAt: now + options.windowSeconds * 1000 });
      next();
      return;
    }

    record.count++;
    if (record.count > options.maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.status(429).json({
        error: 'Too many requests. Please slow down.',
        retryAfterSeconds: retryAfter,
      });
      return;
    }

    next();
  };
}
