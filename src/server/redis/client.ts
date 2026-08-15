import Redis, { RedisOptions } from 'ioredis';
import { config, Logger } from '../config/env';

// Serverless-friendly global singleton caching across Vercel Lambda invocations
declare global {
  // eslint-disable-next-line no-var
  var __ludo_redis_client: Redis | undefined;
  // eslint-disable-next-line no-var
  var __ludo_redis_sub: Redis | undefined;
}

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
    connectTimeout: 5000,
    commandTimeout: 4000,
    // Automatic TLS support for Upstash rediss:// or Cloud Redis
    tls: config.REDIS_URL?.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    retryStrategy(times) {
      if (times > (config.IS_VERCEL ? 1 : 3)) {
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

  if (!globalThis.__ludo_redis_client) {
    try {
      const client = new Redis(config.REDIS_URL!, getRedisConfig());

      client.on('connect', () => {
        connectionFailed = false;
        Logger.info('Redis / Upstash client connected successfully');
      });

      client.on('error', (err: any) => {
        if (!connectionFailed) {
          Logger.warn('Redis connection notice: operating in standalone mode until reachable', {
            error: err?.message,
          });
        }
        connectionFailed = true;
      });

      globalThis.__ludo_redis_client = client;
    } catch {
      connectionFailed = true;
      return null;
    }
  }
  return globalThis.__ludo_redis_client;
}

export function getRedisSubscriber(): Redis | null {
  if (!isRedisConfigured() || connectionFailed) {
    return null;
  }

  if (!globalThis.__ludo_redis_sub) {
    try {
      const sub = new Redis(config.REDIS_URL!, getRedisConfig());

      sub.on('connect', () => {
        Logger.info('Redis subscriber connected successfully');
      });

      sub.on('error', () => {
        // Silent error handler for pub/sub channel
      });

      globalThis.__ludo_redis_sub = sub;
    } catch {
      return null;
    }
  }
  return globalThis.__ludo_redis_sub;
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
  if (globalThis.__ludo_redis_client) {
    promises.push(globalThis.__ludo_redis_client.quit().catch(() => 'OK'));
    globalThis.__ludo_redis_client = undefined;
  }
  if (globalThis.__ludo_redis_sub) {
    promises.push(globalThis.__ludo_redis_sub.quit().catch(() => 'OK'));
    globalThis.__ludo_redis_sub = undefined;
  }
  await Promise.all(promises);
  connectionFailed = false;
}
