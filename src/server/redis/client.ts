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
let isDegraded = false;
let degradedUntil = 0;
let degradedReason = '';
let lastDegradedLogTime = 0;

export function isRedisConfigured(): boolean {
  return Boolean(
    config.REDIS_URL &&
    config.REDIS_URL.trim().length > 0 &&
    !config.REDIS_URL.includes('samplepassword')
  );
}

export function isRedisDegraded(): boolean {
  if (isDegraded && Date.now() < degradedUntil) {
    return true;
  }
  if (isDegraded && Date.now() >= degradedUntil) {
    isDegraded = false;
    degradedReason = '';
  }
  return false;
}

export function isRedisAvailable(): boolean {
  return isRedisConfigured() && !isRedisDegraded();
}

export function isQuotaExceededError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
  return (
    msg.includes('max requests limit exceeded') ||
    msg.includes('err max requests limit') ||
    msg.includes('limit: 500000') ||
    msg.includes('quota exceeded') ||
    msg.includes('max request limit') ||
    msg.includes('oom command not allowed')
  );
}

export function markRedisDegraded(reason: string, durationMs = 300000): void {
  isDegraded = true;
  degradedUntil = Date.now() + durationMs;
  degradedReason = reason;

  const now = Date.now();
  if (now - lastDegradedLogTime > 60000) {
    lastDegradedLogTime = now;
    Logger.warn(
      `Redis / Upstash entered degraded mode: ${reason}. Seamlessly falling back to robust in-memory coordination.`
    );
  }
}

export function reportRedisError(err: unknown, context?: string): void {
  const errMsg = err instanceof Error ? err.message : String(err || '');
  lastConnectionError = errMsg;

  if (isQuotaExceededError(err)) {
    markRedisDegraded(`Upstash quota limit reached: ${errMsg}`, 5 * 60 * 1000);
  } else {
    const now = Date.now();
    if (now - lastDegradedLogTime > 60000) {
      lastDegradedLogTime = now;
      Logger.warn(`Redis operation notice ${context ? `(${context})` : ''}: ${errMsg}`);
    }
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
          if (times > 3 || isRedisDegraded()) {
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

export function getRedisClient(bypassCircuitBreaker = false): Redis | null {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!bypassCircuitBreaker && isRedisDegraded()) {
    return null;
  }

  if (!globalThis.__ludo_redis_client) {
    try {
      const client = new Redis(config.REDIS_URL!, getRedisConfig());

      client.on('connect', () => {
        lastConnectionError = null;
        if (!isRedisDegraded()) {
          Logger.info('Redis / Upstash client connected successfully');
        }
      });

      client.on('ready', () => {
        lastConnectionError = null;
      });

      client.on('error', (err: any) => {
        reportRedisError(err, 'client listener');
      });

      globalThis.__ludo_redis_client = client;
    } catch (err: any) {
      reportRedisError(err, 'client instantiation');
      return null;
    }
  }
  return globalThis.__ludo_redis_client;
}

export function getRedisSubscriber(bypassCircuitBreaker = false): Redis | null {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!bypassCircuitBreaker && isRedisDegraded()) {
    return null;
  }

  if (!globalThis.__ludo_redis_sub) {
    try {
      const sub = new Redis(config.REDIS_URL!, getRedisConfig());

      sub.on('connect', () => {
        if (!isRedisDegraded()) {
          Logger.info('Redis subscriber connected successfully');
        }
      });

      sub.on('error', (err: any) => {
        reportRedisError(err, 'subscriber listener');
      });

      globalThis.__ludo_redis_sub = sub;
    } catch (err: any) {
      reportRedisError(err, 'subscriber instantiation');
      return null;
    }
  }
  return globalThis.__ludo_redis_sub;
}

/**
 * Health check test for Redis / Upstash connection
 */
export async function checkRedisHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unconfigured';
  latencyMs: number;
  error?: string;
}> {
  if (!isRedisConfigured()) {
    return { status: 'unconfigured', latencyMs: 0 };
  }

  if (isRedisDegraded()) {
    return {
      status: 'degraded',
      latencyMs: 0,
      error: degradedReason || 'Redis in degraded mode (using in-memory fallback)',
    };
  }

  const start = Date.now();
  try {
    const client = getRedisClient(true);
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
    reportRedisError(err, 'health check');
    return {
      status: isQuotaExceededError(err) ? 'degraded' : 'unhealthy',
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
