import fs from 'fs';
import path from 'path';
import { getDbPool } from './client';
import { Logger } from '../config/env';

/**
 * Migration runner for Neon PostgreSQL.
 * Applies SQL migrations idempotently and records execution in `__ludo_migrations`.
 */
export async function runMigrations(): Promise<{ success: boolean; applied: string[]; error?: string }> {
  Logger.info('Starting PostgreSQL schema migrations...');
  const pool = getDbPool();
  const client = await pool.connect();
  const applied: string[] = [];

  try {
    // 1. Create migration ledger table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS __ludo_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Read all migration files from migrations directory
    const migrationsDir = path.join(process.cwd(), 'src/server/db/migrations');
    let files: string[] = [];
    if (fs.existsSync(migrationsDir)) {
      files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    }

    // 3. Query already applied migrations
    const res = await client.query('SELECT name FROM __ludo_migrations');
    const existing = new Set(res.rows.map((r) => r.name));

    for (const file of files) {
      if (!existing.has(file)) {
        Logger.info(`Applying migration: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO __ludo_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');

        applied.push(file);
        Logger.info(`Successfully applied migration: ${file}`);
      }
    }

    Logger.info(`Database migrations completed. Total newly applied: ${applied.length}`);
    return { success: true, applied };
  } catch (err: unknown) {
    await client.query('ROLLBACK').catch(() => {});
    const msg = err instanceof Error ? err.message : String(err);
    Logger.error('Database migration failed', err);
    return { success: false, applied, error: msg };
  } finally {
    client.release();
  }
}
