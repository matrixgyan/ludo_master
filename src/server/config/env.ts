import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  APP_URL: z.string().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:3000/api'),
  NEXT_PUBLIC_API_URL: z.string().default('http://localhost:3000/api'),
  WS_URL: z.string().default('ws://localhost:3000/ws'),
  NEXT_PUBLIC_WS_URL: z.string().default('ws://localhost:3000/ws'),

  // PostgreSQL (Neon)
  DATABASE_URL: z.string().optional(),
  DB_POOL_MIN: z.coerce.number().default(2),
  DB_POOL_MAX: z.coerce.number().default(20),

  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z.coerce.boolean().default(false),
  REDIS_DB: z.coerce.number().default(0),

  // BullMQ
  BULLMQ_PREFIX: z.string().default('ludo_queue'),
  BULLMQ_CONCURRENCY: z.coerce.number().default(5),

  // Secrets & IDs
  GAME_SERVER_ID: z.string().default(`game-node-${process.pid}`),
  GAME_SERVER_SECRET: z.string().default('default-game-server-secret-dev'),
  SESSION_SECRET: z.string().default('default-session-secret-dev'),
  INTERNAL_API_SECRET: z.string().default('default-internal-api-secret-dev'),
  GEMINI_API_KEY: z.string().optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

function parseEnv(): AppConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Environment configuration validation failed:');
    result.error.issues.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    // In production, fail-fast
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Fatal: Invalid environment configuration in production mode.');
    }
  }
  return result.success ? result.data : envSchema.parse({});
}

export const config = parseEnv();

// Safe logger that strips secrets
export class Logger {
  private static sanitize(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') return obj;
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'database_url', 'redis_url', 'auth'];
    const sanitized = { ...(obj as Record<string, unknown>) };
    for (const k of Object.keys(sanitized)) {
      if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
        sanitized[k] = '[REDACTED]';
      } else if (typeof sanitized[k] === 'object' && sanitized[k] !== null) {
        sanitized[k] = Logger.sanitize(sanitized[k]);
      }
    }
    return sanitized;
  }

  static info(message: string, meta?: Record<string, unknown>) {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, meta ? JSON.stringify(Logger.sanitize(meta)) : '');
  }

  static warn(message: string, meta?: Record<string, unknown>) {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, meta ? JSON.stringify(Logger.sanitize(meta)) : '');
  }

  static error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    const errMessage = error instanceof Error ? error.message : String(error || '');
    const stack = error instanceof Error ? error.stack : undefined;
    console.error(
      `[ERROR] [${new Date().toISOString()}] ${message} - ${errMessage}`,
      meta ? JSON.stringify(Logger.sanitize(meta)) : '',
      stack ? `\nStack: ${stack}` : ''
    );
  }

  static debug(message: string, meta?: Record<string, unknown>) {
    if (config.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] [${new Date().toISOString()}] ${message}`, meta ? JSON.stringify(Logger.sanitize(meta)) : '');
    }
  }
}
