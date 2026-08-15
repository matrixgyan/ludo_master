import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { config, Logger } from '../config/env';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDbPool(): pg.Pool {
  if (!pool) {
    if (!config.DATABASE_URL) {
      if (config.NODE_ENV === 'production') {
        throw new Error('DATABASE_URL environment variable is required in production.');
      }
      Logger.warn('DATABASE_URL is not set. Operating in offline/degraded mode.');
    }

    pool = new Pool({
      connectionString: config.DATABASE_URL,
      ssl: config.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
      min: config.DB_POOL_MIN,
      max: config.DB_POOL_MAX,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      Logger.error('Unexpected error on idle PostgreSQL client pool', err);
    });
  }
  return pool;
}

export function getDb() {
  if (!db) {
    const p = getDbPool();
    db = drizzle(p, { schema });
  }
  return db;
}

/**
 * Health check test for PostgreSQL connection
 */
export async function checkPostgresHealth(): Promise<{ status: 'healthy' | 'unhealthy'; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const p = getDbPool();
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
    Logger.error('PostgreSQL health check failed', err);
    return {
      status: 'unhealthy',
      latencyMs,
      error: errorMsg,
    };
  }
}

/**
 * Executes an atomic transaction on PostgreSQL with automatic rollback on error
 */
export async function withTransaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const p = getDbPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    Logger.error('PostgreSQL transaction rolled back due to error', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Graceful shutdown of database pool
 */
export async function closeDbPool(): Promise<void> {
  if (pool) {
    Logger.info('Closing PostgreSQL connection pool...');
    await pool.end();
    pool = null;
    db = null;
    Logger.info('PostgreSQL connection pool closed.');
  }
}
