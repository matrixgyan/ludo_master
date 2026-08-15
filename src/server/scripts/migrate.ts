import { runMigrations } from '../db/migrator';
import { closeDbPool } from '../db/client';
import { Logger } from '../config/env';

async function main() {
  Logger.info('--- Running Neon PostgreSQL Migration CLI ---');
  const result = await runMigrations();
  if (result.success) {
    Logger.info(`✅ Migrations completed successfully. Applied: ${result.applied.join(', ') || 'None (Already up to date)'}`);
  } else {
    Logger.error(`❌ Migration failed: ${result.error}`);
    process.exitCode = 1;
  }
  await closeDbPool();
}

main().catch((err) => {
  Logger.error('Fatal migration script error', err);
  process.exit(1);
});
