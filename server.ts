import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { config, Logger } from './src/server/config/env';
import { apiRouter } from './src/server/routes/api';
import { wsServerInstance } from './src/server/websocket/wsServer';
import { WorkerManager } from './src/server/queues/workerRunner';
import { runMigrations } from './src/server/db/migrator';
import { closeDbPool } from './src/server/db/client';
import { closeRedis } from './src/server/redis/client';
import { QueueRegistry } from './src/server/queues/queueManager';

async function bootstrap() {
  const app = express();
  const server = http.createServer(app);
  const PORT = config.PORT || 3000;

  app.use(express.json());

  // 1. Mount API & Health routes first
  app.use(apiRouter);

  // 2. Attach WebSocket Server
  wsServerInstance.initialize(server);

  // 3. Initialize Database Migrations if DATABASE_URL is provided
  if (config.DATABASE_URL) {
    try {
      await runMigrations();
    } catch (err) {
      Logger.error('Failed to run database migrations during startup', err);
    }
  } else {
    Logger.info('No DATABASE_URL provided. Skipping auto-migration on boot.');
  }

  // 4. Start BullMQ background workers if Redis is configured
  try {
    WorkerManager.startAll();
  } catch (err) {
    Logger.warn('Skipping BullMQ background workers startup', { error: String(err) });
  }

  // 5. Mount Vite middleware for development, or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 6. Start HTTP + WS listener on port 3000
  server.listen(PORT, '0.0.0.0', () => {
    Logger.info(`🚀 Production Ludo Server running on http://0.0.0.0:${PORT} [Node: ${process.version}, PID: ${process.pid}]`);
  });

  // 7. Graceful Shutdown Handlers
  let isShuttingDown = false;
  async function gracefulShutdown(signal: string) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    Logger.info(`Received ${signal}. Initiating graceful shutdown...`);

    // 1. Close WebSocket server
    await wsServerInstance.close();

    // 2. Stop BullMQ workers & queues
    await WorkerManager.stopAll();
    await QueueRegistry.closeAll();

    // 3. Close Redis connections
    await closeRedis();

    // 4. Close PostgreSQL connection pool
    await closeDbPool();

    // 5. Close HTTP server
    server.close(() => {
      Logger.info('HTTP server closed. Exiting process.');
      process.exit(0);
    });

    // Force exit after 10s timeout
    setTimeout(() => {
      Logger.warn('Graceful shutdown timeout exceeded. Forcing exit.');
      process.exit(1);
    }, 10000);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  Logger.error('Fatal error during server bootstrap', err);
  process.exit(1);
});
