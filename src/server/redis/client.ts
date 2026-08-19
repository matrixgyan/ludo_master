import Redis, { RedisOptions } from 'ioredis';
import { config, Logger } from '../config/env';

// Serverless-friendly global singleton caching across Vercel Lambda invocations
declare global {
  // eslint-disable-next-line no-var
  var __ludo_redis_client: Redis | undefined;
  // eslint-disable-next-line no-var
  var __ludo_redis_sub: Redis | undefined;
}

let lastConnectionError: string | null = null;

export function isRedisConfigured(): boolean {
  return Boolean(
    config.REDIS_URL &&
    config.REDIS_URL.trim().length > 0 &&
    !config.REDIS_URL.includes('samplepassword')
  );
}

export function getRedisConfig(): RedisOptions {
  if (isRedisConfigured() && config.REDIS_URL) {
    try {
      const url = new URL(config.REDIS_URL);
      return {
        host: url.hostname,
        port: Number(url.port) || (url.protocol === 'rediss:' ? 6379 : 6379),
        password: url.password ? decodeURIComponent(url.password) : undefined,
        username: url.username ? decodeURIComponent(url.username) : undefined,
        lazyConnect: true,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        enableOfflineQueue: false,
        connectTimeout: 10000,
        commandTimeout: 8000,
        tls: url.protocol === 'rediss:' || config.REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
        retryStrategy(times) {
          if (times > 3) {
            return null;
          }
          return Math.min(times * 300, 2000);
        },
      };
    } catch {
      // Fallback below
    }
  }

  return {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    commandTimeout: 5000,
    retryStrategy() {
      return null;
    },
  };
}

export function getRedisClient(): Redis | null {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!globalThis.__ludo_redis_client) {
    try {
      const client = new Redis(config.REDIS_URL!, getRedisConfig());

      client.on('connect', () => {
        lastConnectionError = null;
        Logger.info('Redis / Upstash client connected successfully');
      });

      client.on('ready', () => {
        lastConnectionError = null;
      });

      client.on('error', (err: any) => {
        lastConnectionError = err?.message || String(err);
        Logger.warn('Redis client error notice', { error: lastConnectionError });
      });

      globalThis.__ludo_redis_client = client;
    } catch (err: any) {
      lastConnectionError = err?.message || String(err);
      return null;
    }
  }
  return globalThis.__ludo_redis_client;
}

export function getRedisSubscriber(): Redis | null {
  if (!isRedisConfigured()) {
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
      return { 
        status: 'unhealthy', 
        latencyMs: 0, 
        error: lastConnectionError || 'Could not instantiate Redis client' 
      };
    }

    if (client.status !== 'ready' && client.status !== 'connect') {
      try {
        await client.connect();
      } catch (connErr: any) {
        // If already connecting or connected, ignore
        if (!connErr?.message?.includes('already connecting') && !connErr?.message?.includes('ready')) {
          // continue to ping test
        }
      }
    }

    const pong = await Promise.race([
      client.ping(),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Redis ping timeout (5s)')), 5000))
    ]);

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
  lastConnectionError = null;
}
