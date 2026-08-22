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
let isQuotaExceeded = false;
let quotaExceededResetTime = 0;
let consecutiveErrors = 0;

export function isRedisConfigured(): boolean {
  return Boolean(
    config.REDIS_URL &&
    config.REDIS_URL.trim().length > 0 &&
    !config.REDIS_URL.includes('samplepassword')
  );
}

export function isRedisAvailable(): boolean {
  if (!isRedisConfigured()) {
    return false;
  }
  if (isQuotaExceeded) {
    if (Date.now() < quotaExceededResetTime) {
      return false;
    }
    // Attempt re-probe after backoff window
    isQuotaExceeded = false;
    consecutiveErrors = 0;
  }
  return true;
}

/**
 * Report an error encountered during a Redis operation to automatically trigger backoff
 */
export function reportRedisError(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  lastConnectionError = msg;

  const isLimitError =
    msg.includes('max requests limit exceeded') ||
    msg.includes('ERR max requests limit') ||
    msg.includes('quota') ||
    msg.includes('OVER_LIMIT') ||
    msg.includes('daily request limit') ||
    msg.includes('OOM');

  if (isLimitError) {
    if (!isQuotaExceeded) {
      Logger.warn('⚡ Upstash / Redis max requests quota reached. Safely falling back to in-memory state.');
    }
    isQuotaExceeded = true;
    quotaExceededResetTime = Date.now() + 5 * 60 * 1000; // 5-minute backoff
    return;
  }

  consecutiveErrors++;
  if (consecutiveErrors >= 5) {
    isQuotaExceeded = true;
    quotaExceededResetTime = Date.now() + 60 * 1000; // 1-minute backoff for intermittent network drops
  }
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
  if (!isRedisAvailable()) {
    return null;
  }

  if (!globalThis.__ludo_redis_client) {
    try {
      const client = new Redis(config.REDIS_URL!, getRedisConfig());

      client.on('connect', () => {
        lastConnectionError = null;
        consecutiveErrors = 0;
        Logger.info('Redis / Upstash client connected successfully');
      });

      client.on('ready', () => {
        lastConnectionError = null;
        consecutiveErrors = 0;
      });

      client.on('error', (err: any) => {
        reportRedisError(err);
      });

      globalThis.__ludo_redis_client = client;
    } catch (err: any) {
      reportRedisError(err);
      return null;
    }
  }
  return globalThis.__ludo_redis_client;
}

export function getRedisSubscriber(): Redis | null {
  if (!isRedisAvailable()) {
    return null;
  }

  if (!globalThis.__ludo_redis_sub) {
    try {
      const sub = new Redis(config.REDIS_URL!, getRedisConfig());

      sub.on('connect', () => {
        Logger.info('Redis subscriber connected successfully');
      });

      sub.on('error', (err: any) => {
        reportRedisError(err);
      });

      globalThis.__ludo_redis_sub = sub;
    } catch (err: any) {
      reportRedisError(err);
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

  if (isQuotaExceeded) {
    return {
      status: 'unhealthy',
      latencyMs: 0,
      error: 'Upstash / Redis max requests quota reached (active memory fallback)',
    };
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
    reportRedisError(err);
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
