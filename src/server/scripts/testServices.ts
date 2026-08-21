import { checkPostgresHealth, isPostgresConfigured, getDbPool } from '../db/client';
import { checkRedisHealth, isRedisConfigured, getRedisClient } from '../redis/client';
import { checkR2Health, isR2Configured, uploadToR2, getObjectFromR2, deleteObjectFromR2 } from '../storage/r2Client';
import { Logger, config } from '../config/env';

export async function runServicesIntegrationDiagnostic(): Promise<{
  postgres: { configured: boolean; status: string; latencyMs: number; readWriteVerified?: boolean; error?: string };
  redis: { configured: boolean; status: string; latencyMs: number; readWriteVerified?: boolean; error?: string };
  cloudflareR2: { configured: boolean; status: string; latencyMs: number; bucket?: string; readWriteVerified?: boolean; error?: string };
}> {
  Logger.info('================================================================');
  Logger.info('RUNNING COMPREHENSIVE 3-SERVICE BACKEND CONNECTIVITY AUDIT');
  Logger.info('================================================================');

  // 1. Neon PostgreSQL Diagnostic
  const pgConfigured = isPostgresConfigured();
  const pgHealth = await checkPostgresHealth();
  let pgReadWriteVerified = false;

  if (pgHealth.status === 'healthy') {
    try {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          const testId = `diag_${Date.now()}`;
          await client.query('CREATE TEMP TABLE diag_test (id TEXT PRIMARY KEY, val TEXT, created_at TIMESTAMPTZ DEFAULT NOW())');
          await client.query('INSERT INTO diag_test (id, val) VALUES ($1, $2)', [testId, 'neon_ok']);
          const selectRes = await client.query('SELECT val FROM diag_test WHERE id = $1', [testId]);
          if (selectRes.rows[0]?.val === 'neon_ok') {
            pgReadWriteVerified = true;
          }
        } finally {
          client.release();
        }
      }
    } catch (err) {
      Logger.warn('Postgres temp table read/write warning', { error: String(err) });
    }
  }
  Logger.info(`1. Neon PostgreSQL: [${pgHealth.status.toUpperCase()}] latency: ${pgHealth.latencyMs}ms | R/W Verified: ${pgReadWriteVerified ? 'YES ✅' : 'NO ⚠️'} ${pgHealth.error ? `| error: ${pgHealth.error}` : ''}`);

  // 2. Redis / Upstash Diagnostic
  const redisConfigured = isRedisConfigured();
  const redisHealth = await checkRedisHealth();
  let redisReadWriteVerified = false;

  if (redisHealth.status === 'healthy') {
    try {
      const client = getRedisClient();
      if (client) {
        const testKey = `ludo:diag:${Date.now()}`;
        await client.set(testKey, 'redis_ok', 'EX', 10);
        const val = await client.get(testKey);
        await client.del(testKey);
        if (val === 'redis_ok') {
          redisReadWriteVerified = true;
        }
      }
    } catch (err) {
      Logger.warn('Redis read/write warning', { error: String(err) });
    }
  }
  Logger.info(`2. Redis / Upstash: [${redisHealth.status.toUpperCase()}] latency: ${redisHealth.latencyMs}ms | R/W Verified: ${redisReadWriteVerified ? 'YES ✅' : 'NO ⚠️'} ${redisHealth.error ? `| error: ${redisHealth.error}` : ''}`);

  // 3. Cloudflare R2 Diagnostic
  const r2Configured = isR2Configured();
  const r2Health = await checkR2Health();
  let r2ReadWriteVerified = false;

  if (r2Health.status === 'healthy') {
    try {
      const testKey = `diag/connectivity-test-${Date.now()}.json`;
      const testPayload = Buffer.from(JSON.stringify({ test: 'r2_connectivity', timestamp: new Date().toISOString() }));
      const uploadRes = await uploadToR2({
        key: testKey,
        buffer: testPayload,
        contentType: 'application/json',
        category: 'assets',
      });

      if (uploadRes && uploadRes.key) {
        const getRes = await getObjectFromR2(testKey);
        if (getRes) {
          await deleteObjectFromR2(testKey);
          r2ReadWriteVerified = true;
        }
      }
    } catch (err) {
      Logger.warn('Cloudflare R2 live upload/verify warning', { error: String(err) });
    }
  }
  Logger.info(`3. Cloudflare R2:   [${r2Health.status.toUpperCase()}] latency: ${r2Health.latencyMs}ms (Bucket: ${r2Health.bucket || config.R2_BUCKET_NAME || 'N/A'}) | Upload/Read/Delete: ${r2ReadWriteVerified ? 'YES ✅' : 'NO ⚠️'} ${r2Health.error ? `| error: ${r2Health.error}` : ''}`);

  Logger.info('================================================================');

  return {
    postgres: { configured: pgConfigured, readWriteVerified: pgReadWriteVerified, ...pgHealth },
    redis: { configured: redisConfigured, readWriteVerified: redisReadWriteVerified, ...redisHealth },
    cloudflareR2: { configured: r2Configured, readWriteVerified: r2ReadWriteVerified, ...r2Health },
  };
}

if (process.argv[1] && process.argv[1].includes('testServices')) {
  runServicesIntegrationDiagnostic()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
