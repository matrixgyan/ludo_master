import Redis, { RedisOptions } from 'ioredis';
import { config, Logger } from '../config/env';

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;
let connectionFailed = false;

export function isRedisConfigured(): boolean {
  return Boolean(config.REDIS_URL || config.REDIS_HOST);
}

export function getRedisConfig(): RedisOptions {
  if (config.REDIS_URL) {
    return {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 5) {
          connectionFailed = true;
          return null; // Stop retrying after 5 attempts
        }
        return Math.min(times * 200, 2000);
      },
    };
  }

  return {
    host: config.REDIS_HOST || '127.0.0.1',
    port: config.REDIS_PORT,
    username: config.REDIS_USERNAME || undefined,
    password: config.REDIS_PASSWORD || undefined,
    db: config.REDIS_DB,
    tls: config.REDIS_TLS ? {} : undefined,
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 5) {
        connectionFailed = true;
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  };
}

export function getRedisClient(): Redis | null {
  if (!isRedisConfigured() || connectionFailed) {
    return null;
  }

  if (!redisClient) {
    try {
      if (config.REDIS_URL) {
        redisClient = new Redis(config.REDIS_URL, getRedisConfig());
      } else if (config.REDIS_HOST) {
        redisClient = new Redis(getRedisConfig());
      }

      if (redisClient) {
        redisClient.on('connect', () => {
          connectionFailed = false;
          Logger.info('Redis client connected successfully');
        });

        redisClient.on('error', (err) => {
          // Suppress continuous error logs when offline
          if (!connectionFailed) {
            Logger.warn(`Redis connection unavailable: ${err.message}. Operating in fallback mode.`);
          }
          connectionFailed = true;
        });

        redisClient.on('close', () => {
          // Silent close handling
        });
      }
    } catch (err: unknown) {
      connectionFailed = true;
      Logger.warn('Failed to initialize Redis client', { error: String(err) });
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
      const opts = getRedisConfig();
      if (config.REDIS_URL) {
        redisSubscriber = new Redis(config.REDIS_URL, opts);
      } else if (config.REDIS_HOST) {
        redisSubscriber = new Redis(opts);
      }

      if (redisSubscriber) {
        redisSubscriber.on('connect', () => {
          Logger.info('Redis subscriber connected successfully');
        });

        redisSubscriber.on('error', () => {
          // Silent error handling for subscriber
        });
      }
    } catch {
      return null;
    }
  }
  return redisSubscriber;
}

/**
 * Health check test for Redis connection
 */
export async function checkRedisHealth(): Promise<{ status: 'healthy' | 'unhealthy' | 'unconfigured'; latencyMs: number; error?: string }> {
  if (!isRedisConfigured()) {
    return { status: 'unconfigured', latencyMs: 0 };
  }

  const start = Date.now();
  try {
    const client = getRedisClient();
    if (!client) {
      return { status: 'unhealthy', latencyMs: 0, error: 'Redis client not initialized' };
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
    Logger.info('Closing Redis main client...');
    promises.push(redisClient.quit().catch(() => 'OK'));
    redisClient = null;
  }
  if (redisSubscriber) {
    Logger.info('Closing Redis subscriber client...');
    promises.push(redisSubscriber.quit().catch(() => 'OK'));
    redisSubscriber = null;
  }
  await Promise.all(promises);
  connectionFailed = false;
  Logger.info('Redis connections closed.');
}
