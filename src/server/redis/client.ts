import Redis, { RedisOptions } from 'ioredis';
import { config, Logger } from '../config/env';

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;
let connectionFailed = false;

export function isRedisConfigured(): boolean {
  return Boolean(
    config.REDIS_URL &&
    config.REDIS_URL.trim().length > 0 &&
    !config.REDIS_URL.includes('samplepassword')
  );
}

export function getRedisConfig(): RedisOptions {
  return {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    // Automatic TLS support for Upstash rediss:// or Cloud Redis
    tls: config.REDIS_URL?.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    retryStrategy(times) {
      if (times > 3) {
        connectionFailed = true;
        return null;
      }
      return Math.min(times * 100, 1000);
    },
  };
}

export function getRedisClient(): Redis | null {
  if (!isRedisConfigured() || connectionFailed) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(config.REDIS_URL!, getRedisConfig());

      redisClient.on('connect', () => {
        connectionFailed = false;
        Logger.info('Redis / Upstash client connected successfully');
      });

      redisClient.on('error', (err: any) => {
        if (!connectionFailed) {
          Logger.warn('Redis connection notice: operating in standalone mode until reachable', {
            error: err?.message,
          });
        }
        connectionFailed = true;
      });
    } catch {
      connectionFailed = true;
      return null;
    }
  }
  return redisClient;
}

export function getRedisSubscriber(): Redis | null {
  if (!isRedisConfigured() || connectionFailed) {
    return null;
  }

  if (!redisSubscriber) {
    try {
      redisSubscriber = new Redis(config.REDIS_URL!, getRedisConfig());

      redisSubscriber.on('connect', () => {
        Logger.info('Redis subscriber connected successfully');
      });

      redisSubscriber.on('error', () => {
        // Silent error handler for pub/sub channel
      });
    } catch {
      return null;
    }
  }
  return redisSubscriber;
}

/**
 * Health check test for Redis / Upstash connection
 */
export async function checkRedisHealth(): Promise<{
  status: 'healthy' | 'unhealthy' | 'unconfigured';
  latencyMs: number;
  error?: string;
}> {
  if (!isRedisConfigured()) {
    return { status: 'unconfigured', latencyMs: 0 };
  }

  const start = Date.now();
  try {
    const client = getRedisClient();
    if (!client) {
      return { status: 'unconfigured', latencyMs: 0 };
    }
    if (client.status !== 'ready' && client.status !== 'connecting' && client.status !== 'connect') {
      await client.connect().catch(() => {});
    }
    const pong = await client.ping();
    const latencyMs = Date.now() - start;
    return {
      status: pong === 'PONG' ? 'healthy' : 'unhealthy',
      latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    return {
      status: 'unhealthy',
      latencyMs,
      error: msg,
    };
  }
}

/**
 * Graceful shutdown of Redis connections
 */
export async function closeRedis(): Promise<void> {
  const promises: Promise<string>[] = [];
  if (redisClient) {
    promises.push(redisClient.quit().catch(() => 'OK'));
    redisClient = null;
  }
  if (redisSubscriber) {
    promises.push(redisSubscriber.quit().catch(() => 'OK'));
    redisSubscriber = null;
  }
  await Promise.all(promises);
  connectionFailed = false;
}
