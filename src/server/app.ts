import express, { Request, Response, NextFunction } from 'express';
import { apiRouter } from './routes/api';
import { adminRouter } from './routes/adminApi';
import { walletRouter } from './routes/walletRoutes';
import { adminWalletRouter } from './routes/adminWalletRoutes';
import { manualPaymentRouter } from './routes/manualPaymentRoutes';
import { storageRouter } from './routes/storageRoutes';
import { matchApiRouter } from './routes/matchApi';
import { notificationRouter } from './routes/notificationRoutes';
import { referralRouter } from './routes/referralRoutes';
import { themeConfigRouter } from './routes/themeConfigRoutes';
import { ensureDatabaseTables } from './db/migrator';
import { isPostgresConfigured } from './db/client';
import { SettingsStore } from './storage/settingsStore';
import { Logger } from './config/env';

// Track if database schema migration has already been executed in this process instance
let isDbSchemaInitialized = false;
let dbInitPromise: Promise<void> | null = null;

export async function initializeDatabaseOnce(): Promise<void> {
  if (isDbSchemaInitialized || !isPostgresConfigured()) {
    return;
  }
  if (!dbInitPromise) {
    dbInitPromise = ensureDatabaseTables()
      .then(async () => {
        isDbSchemaInitialized = true;
        // Load persistent settings directly from PostgreSQL
        await SettingsStore.initializeFromDb();
      })
      .catch((err) => {
        dbInitPromise = null;
        const msg = err?.message || String(err);
        if (!msg.includes('Connection terminated due to connection timeout') && !msg.includes('timeout')) {
          Logger.warn('Database initialization status notice', { error: msg });
        }
      });
  }
  return dbInitPromise;
}

export function createApp(): express.Application {
  const app = express();

  // Basic security and parsing middlewares
  app.disable('x-powered-by');

  // CORS Headers for API & cross-origin frontend requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Body parsers
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // On-demand non-blocking database initialization check
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!isDbSchemaInitialized && isPostgresConfigured()) {
      initializeDatabaseOnce().catch(() => {});
    }
    next();
  });

  // Mount API and Admin router endpoints
  app.use(apiRouter);
  app.use(matchApiRouter);
  app.use(adminRouter);
  app.use(walletRouter);
  app.use(adminWalletRouter);
  app.use(manualPaymentRouter);
  app.use(storageRouter);
  app.use(notificationRouter);
  app.use(referralRouter);
  app.use(themeConfigRouter);

  // Global fallback error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    Logger.error('Unhandled server error in request pipeline', err, {
      path: req.path,
      method: req.method,
    });
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

// Default exportable singleton instance for Vercel and Express server
export const app = createApp();
