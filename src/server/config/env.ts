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

  const raw = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    IS_VERCEL: isVercel,

    // Neon PostgreSQL resolution
    DATABASE_URL: process.env.DATABASE_URL,

    // Redis / Upstash resolution
    REDIS_URL: process.env.REDIS_URL,

    // Cloudflare R2 resolution
    R2_ENDPOINT:
      process.env.R2_ENDPOINT ||
      process.env.CLOUDFLARE_R2_ENDPOINT ||
      process.env.AWS_ENDPOINT_URL_S3,
    R2_ACCESS_KEY_ID:
      process.env.R2_ACCESS_KEY_ID ||
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
      process.env.AWS_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY:
      process.env.R2_SECRET_ACCESS_KEY ||
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
      process.env.AWS_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME:
      process.env.R2_BUCKET_NAME ||
      process.env.CLOUDFLARE_R2_BUCKET ||
      process.env.R2_BUCKET ||
      process.env.AWS_BUCKET_NAME,

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
  static info(message: string, meta?: Record<string, unknown>) {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  static warn(message: string, meta?: Record<string, unknown>) {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  static error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    const errMessage = error instanceof Error ? error.message : String(error || '');
    const stack = error instanceof Error ? error.stack : undefined;
    console.error(
      `[ERROR] [${new Date().toISOString()}] ${message} - ${errMessage}`,
      meta ? JSON.stringify(meta) : '',
      stack ? `\nStack: ${stack}` : ''
    );
  }

  static debug(message: string, meta?: Record<string, unknown>) {
    if (config.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] [${new Date().toISOString()}] ${message}`, meta ? JSON.stringify(meta) : '');
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
