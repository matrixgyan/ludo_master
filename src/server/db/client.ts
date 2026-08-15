import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { config, Logger } from '../config/env';

const { Pool } = pg;

// Serverless-friendly global singleton caching across Vercel Lambda invocations
declare global {
  // eslint-disable-next-line no-var
  var __ludo_pg_pool: pg.Pool | undefined;
  // eslint-disable-next-line no-var
  var __ludo_drizzle_db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

export function isPostgresConfigured(): boolean {
  return Boolean(config.DATABASE_URL && config.DATABASE_URL.trim().length > 0);
}

export function getDbPool(): pg.Pool | null {
  if (!isPostgresConfigured()) {
    return null;
  }

  if (!globalThis.__ludo_pg_pool) {
    const rawUrl = config.DATABASE_URL || '';
    const isLocal = rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1');

    // Clean connection string to prevent pg library SSL mode alias deprecation warnings
    // We explicitly supply the SSL configuration object below.
    let cleanConnectionString = rawUrl;
    try {
      const parsed = new URL(rawUrl);
      if (parsed.searchParams.has('sslmode')) {
        parsed.searchParams.delete('sslmode');
      }
      cleanConnectionString = parsed.toString();
    } catch {
      cleanConnectionString = rawUrl;
    }

    globalThis.__ludo_pg_pool = new Pool({
      connectionString: cleanConnectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      min: 0, // Serverless scale-to-zero friendly
      max: config.IS_VERCEL ? 3 : 10,
      idleTimeoutMillis: 10000, // Reclaim idle clients before serverless gateway drops
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    // Catch idle serverless disconnects gracefully without crashing
    globalThis.__ludo_pg_pool.on('error', (err: any) => {
      const errMsg = err?.message || String(err);
      if (
        errMsg.includes('Connection terminated unexpectedly') ||
        errMsg.includes('Connection terminated due to connection timeout') ||
        err?.code === 'ECONNRESET' ||
        err?.code === '57P01'
      ) {
        Logger.info('Idle PostgreSQL client socket recycled cleanly by serverless gateway.');
        return;
      }
      Logger.warn('Neon PostgreSQL pool notice', { error: errMsg });
    });
  }
  return globalThis.__ludo_pg_pool;
}

export function getDb(): ReturnType<typeof drizzle<typeof schema>> | null {
  if (!globalThis.__ludo_drizzle_db) {
    const p = getDbPool();
    if (p) {
      globalThis.__ludo_drizzle_db = drizzle(p, { schema });
    }
  }
  return globalThis.__ludo_drizzle_db || null;
}

/**
 * Health check test probe for Neon PostgreSQL
 */
export async function checkPostgresHealth(): Promise<{
  status: 'healthy' | 'unhealthy' | 'unconfigured';
  latencyMs: number;
  error?: string;
}> {
  if (!isPostgresConfigured()) {
    return { status: 'unconfigured', latencyMs: 0 };
  }

  const start = Date.now();
  try {
    const p = getDbPool();
    if (!p) {
      return { status: 'unconfigured', latencyMs: 0 };
    }
    const client = await p.connect();
    try {
      const res = await client.query('SELECT 1 as alive, NOW() as current_time');
      const latencyMs = Date.now() - start;
      return {
        status: res.rows.length > 0 ? 'healthy' : 'unhealthy',
        latencyMs,
      };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);
    Logger.warn('Neon PostgreSQL health probe failed', { error: errorMsg });
    return {
      status: 'unhealthy',
      latencyMs,
      error: errorMsg,
    };
  }
}

/**
 * Executes an atomic transaction on PostgreSQL with rollback on failure
 */
export async function withTransaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const p = getDbPool();
  if (!p) {
    throw new Error('Neon PostgreSQL is not configured');
  }

  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    Logger.error('PostgreSQL transaction rolled back', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Graceful shutdown of database connection pool
 */
export async function closeDbPool(): Promise<void> {
  if (globalThis.__ludo_pg_pool) {
    Logger.info('Closing Neon PostgreSQL pool...');
    await globalThis.__ludo_pg_pool.end().catch(() => {});
    globalThis.__ludo_pg_pool = undefined;
    globalThis.__ludo_drizzle_db = undefined;
  }
}
