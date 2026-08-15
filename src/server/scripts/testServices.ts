import { checkPostgresHealth, isPostgresConfigured } from '../db/client';
import { checkRedisHealth, isRedisConfigured } from '../redis/client';
import { checkR2Health, isR2Configured } from '../storage/r2Client';
import { Logger } from '../config/env';

export async function runServicesIntegrationDiagnostic(): Promise<{
  postgres: { configured: boolean; status: string; latencyMs: number; error?: string };
  redis: { configured: boolean; status: string; latencyMs: number; error?: string };
  cloudflareR2: { configured: boolean; status: string; latencyMs: number; bucket?: string; error?: string };
}> {
  Logger.info('================================================================');
  Logger.info('RUNNING THREE SERVICES INTEGRATION DIAGNOSTIC');
  Logger.info('================================================================');

  // 1. Neon PostgreSQL Check
  const pgConfigured = isPostgresConfigured();
  const pgHealth = await checkPostgresHealth();
  Logger.info(`1. Neon PostgreSQL: [${pgHealth.status.toUpperCase()}] latency: ${pgHealth.latencyMs}ms ${pgHealth.error ? `error: ${pgHealth.error}` : ''}`);

  // 2. Redis / Upstash Check
  const redisConfigured = isRedisConfigured();
  const redisHealth = await checkRedisHealth();
  Logger.info(`2. Redis / Upstash: [${redisHealth.status.toUpperCase()}] latency: ${redisHealth.latencyMs}ms ${redisHealth.error ? `error: ${redisHealth.error}` : ''}`);

  // 3. Cloudflare R2 Check
  const r2Configured = isR2Configured();
  const r2Health = await checkR2Health();
  Logger.info(`3. Cloudflare R2:   [${r2Health.status.toUpperCase()}] latency: ${r2Health.latencyMs}ms (Bucket: ${r2Health.bucket || 'N/A'}) ${r2Health.error ? `error: ${r2Health.error}` : ''}`);

  Logger.info('================================================================');

  return {
    postgres: { configured: pgConfigured, ...pgHealth },
    redis: { configured: redisConfigured, ...redisHealth },
    cloudflareR2: { configured: r2Configured, ...r2Health },
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
