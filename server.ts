import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { config, Logger, getServicesStatusSummary } from './src/server/config/env';
import { apiRouter } from './src/server/routes/api';
import { adminRouter } from './src/server/routes/adminApi';
import { wsServerInstance } from './src/server/websocket/wsServer';
import { ensureDatabaseTables } from './src/server/db/migrator';
import { closeDbPool } from './src/server/db/client';
import { closeRedis } from './src/server/redis/client';
import { BackgroundWorkerManager } from './src/server/queues/workerRunner';
import { QueueRegistry } from './src/server/queues/queueManager';

async function bootstrap() {
  const app = express();
  const server = http.createServer(app);
  const PORT = config.PORT || 3000;

  app.use(express.json());

  // 1. Initialize PostgreSQL Database Tables if configured
  await ensureDatabaseTables();

  // 2. Initialize BullMQ Background Workers if Redis is configured
  BackgroundWorkerManager.initialize();

  // 3. Mount API & Admin & Health routes
  app.use(apiRouter);
  app.use(adminRouter);

  // 4. Attach WebSocket Server
  wsServerInstance.initialize(server);

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
    Logger.info(`🚀 Ludo World Master Server running on http://0.0.0.0:${PORT}`);
    const services = getServicesStatusSummary();
    Logger.info(`  • Neon PostgreSQL: ${services.neonPostgres.message}`);
    Logger.info(`  • Redis / Upstash: ${services.redis.message}`);
    Logger.info(`  • Cloudflare R2:   ${services.cloudflareR2.message}`);
  });

  // 7. Graceful Shutdown Handlers
  let isShuttingDown = false;
  async function gracefulShutdown(signal: string) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    Logger.info(`Received ${signal}. Initiating graceful shutdown of all services...`);

    await wsServerInstance.close();
    await BackgroundWorkerManager.shutdown();
    await QueueRegistry.closeAll();
    await closeRedis();
    await closeDbPool();

    server.close(() => {
      Logger.info('HTTP server closed. Exiting process cleanly.');
      process.exit(0);
    });

    setTimeout(() => {
      Logger.warn('Graceful shutdown timeout exceeded. Forcing exit.');
      process.exit(1);
    }, 5000);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  Logger.error('Fatal error during server bootstrap', err);
  process.exit(1);
});
