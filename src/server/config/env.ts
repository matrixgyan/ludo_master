import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Production environment schema strictly validating the 3 requested services
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  IS_VERCEL: z.boolean().default(false),

  // 1. Neon PostgreSQL
  DATABASE_URL: z.string().optional(),

  // 2. Redis / Upstash
  REDIS_URL: z.string().optional(),

  // 3. Cloudflare R2 Object Storage (supports R2_* and CLOUDFLARE_R2_*)
  R2_ENDPOINT: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),

  // Optional AI / Gemini integration
  GEMINI_API_KEY: z.string().optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

function parseEnv(): AppConfig {
  const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);

  // 1. Resolve Neon PostgreSQL Database URL
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRESQL_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.DIRECT_URL;

  // 2. Resolve Redis / Upstash Connection URL
  const redisUrl =
    process.env.REDIS_URL ||
    process.env.REDIS_TLS_URL ||
    process.env.UPSTASH_REDIS_URL ||
    process.env.KV_URL;

  // 3. Resolve Cloudflare R2 Storage credentials & endpoint
  const accountId =
    process.env.R2_ACCOUNT_ID ||
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
    process.env.ACCOUNT_ID;

  const r2Endpoint =
    process.env.R2_ENDPOINT ||
    process.env.CLOUDFLARE_R2_ENDPOINT ||
    process.env.CLOUDFLARE_ENDPOINT ||
    process.env.AWS_ENDPOINT_URL_S3 ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  const r2AccessKeyId =
    process.env.R2_ACCESS_KEY_ID ||
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    process.env.CLOUDFLARE_ACCESS_KEY_ID ||
    process.env.R2_KEY_ID ||
    process.env.CLOUDFLARE_KEY_ID ||
    process.env.R2_KEY ||
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.ACCESS_KEY_ID;

  const r2SecretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY ||
    process.env.R2_SECRET_KEY ||
    process.env.CLOUDFLARE_SECRET_KEY ||
    process.env.R2_SECRET ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.SECRET_ACCESS_KEY;

  const r2BucketName =
    process.env.R2_BUCKET_NAME ||
    process.env.CLOUDFLARE_R2_BUCKET_NAME ||
    process.env.CLOUDFLARE_BUCKET_NAME ||
    process.env.CLOUDFLARE_R2_BUCKET ||
    process.env.CLOUDFLARE_BUCKET ||
    process.env.R2_BUCKET ||
    process.env.AWS_BUCKET_NAME ||
    process.env.BUCKET_NAME;

  const raw = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    IS_VERCEL: isVercel,

    DATABASE_URL: databaseUrl,
    REDIS_URL: redisUrl,

    R2_ENDPOINT: r2Endpoint,
    R2_ACCESS_KEY_ID: r2AccessKeyId,
    R2_SECRET_ACCESS_KEY: r2SecretAccessKey,
    R2_BUCKET_NAME: r2BucketName,

    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  };

  const result = envSchema.safeParse(raw);
  if (!result.success) {
    console.error('❌ Environment configuration validation warning:', result.error.format());
    return envSchema.parse(raw);
  }
  return result.data;
}

export const config = parseEnv();

// Structured Logger
export class Logger {
  static info(message: string, meta?: unknown) {
    if (meta instanceof Error) {
      console.log(`[INFO] [${new Date().toISOString()}] ${message} - ${meta.message}`);
    } else if (meta !== undefined && meta !== null) {
      console.log(`[INFO] [${new Date().toISOString()}] ${message}`, typeof meta === 'object' ? JSON.stringify(meta) : String(meta));
    } else {
      console.log(`[INFO] [${new Date().toISOString()}] ${message}`);
    }
  }

  static warn(message: string, meta?: unknown) {
    if (meta instanceof Error) {
      console.warn(`[WARN] [${new Date().toISOString()}] ${message} - ${meta.message}`, meta.stack ? `\nStack: ${meta.stack}` : '');
    } else if (meta !== undefined && meta !== null) {
      console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, typeof meta === 'object' ? JSON.stringify(meta) : String(meta));
    } else {
      console.warn(`[WARN] [${new Date().toISOString()}] ${message}`);
    }
  }

  static error(message: string, error?: unknown, meta?: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error || '');
    const stack = error instanceof Error ? error.stack : undefined;
    const metaStr = meta ? (typeof meta === 'object' ? JSON.stringify(meta) : String(meta)) : '';
    console.error(
      `[ERROR] [${new Date().toISOString()}] ${message}${errMessage ? ` - ${errMessage}` : ''}`,
      metaStr,
      stack ? `\nStack: ${stack}` : ''
    );
  }

  static debug(message: string, meta?: unknown) {
    if (config.NODE_ENV !== 'production') {
      if (meta instanceof Error) {
        console.debug(`[DEBUG] [${new Date().toISOString()}] ${message} - ${meta.message}`);
      } else if (meta !== undefined && meta !== null) {
        console.debug(`[DEBUG] [${new Date().toISOString()}] ${message}`, typeof meta === 'object' ? JSON.stringify(meta) : String(meta));
      } else {
        console.debug(`[DEBUG] [${new Date().toISOString()}] ${message}`);
      }
    }
  }
}

/**
 * Validates configured status of the 3 external production services
 */
export function getServicesStatusSummary(): {
  neonPostgres: { configured: boolean; message: string };
  redis: { configured: boolean; message: string };
  cloudflareR2: { configured: boolean; message: string };
} {
  const hasPg = Boolean(config.DATABASE_URL && config.DATABASE_URL.trim().length > 0);
  const hasRedis = Boolean(config.REDIS_URL && config.REDIS_URL.trim().length > 0);
  const hasR2 = Boolean(
    config.R2_ENDPOINT &&
    config.R2_ACCESS_KEY_ID &&
    config.R2_SECRET_ACCESS_KEY &&
    config.R2_BUCKET_NAME
  );

  return {
    neonPostgres: {
      configured: hasPg,
      message: hasPg ? 'DATABASE_URL detected' : 'DATABASE_URL not configured',
    },
    redis: {
      configured: hasRedis,
      message: hasRedis ? 'REDIS_URL detected' : 'REDIS_URL not configured',
    },
    cloudflareR2: {
      configured: hasR2,
      message: hasR2
        ? `R2 configured (bucket: ${config.R2_BUCKET_NAME})`
        : 'R2 environment variables incomplete',
    },
  };
}
