import http from 'http';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { config, Logger, getServicesStatusSummary } from './src/server/config/env';
import { app, initializeDatabaseOnce } from './src/server/app';
import { wsServerInstance } from './src/server/websocket/wsServer';
import { closeDbPool } from './src/server/db/client';
import { closeRedis } from './src/server/redis/client';
import { BackgroundWorkerManager } from './src/server/queues/workerRunner';
import { QueueRegistry } from './src/server/queues/queueManager';
import { RoomManager } from './src/server/game/roomManager';
import { ReconnectService } from './src/server/game/reconnectService';
import { RpcConfigService } from './src/server/services/rpcConfigService';

async function bootstrap() {
  const server = http.createServer(app);
  const PORT = config.PORT || 3000;

  // 1. Attach WebSocket Server
  wsServerInstance.initialize(server);

  // 2. Mount Vite middleware for development, or static files in production
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

  // 3. Start HTTP + WS listener on port 3000 immediately
  server.listen(PORT, '0.0.0.0', () => {
    Logger.info(`🚀 Ludo World Master Server running on http://0.0.0.0:${PORT}`);
    const services = getServicesStatusSummary();
    Logger.info(`  • Neon PostgreSQL: ${services.neonPostgres.message}`);
    Logger.info(`  • Redis / Upstash: ${services.redis.message}`);
    Logger.info(`  • Cloudflare R2:   ${services.cloudflareR2.message}`);
  });

  // 4. Initialize Database Tables, RPC configs, workers, and rooms asynchronously
  (async () => {
    await initializeDatabaseOnce();
    await RpcConfigService.getStore().catch((err) => Logger.warn('RPC store load notice', err));
    BackgroundWorkerManager.initialize();
    await RoomManager.initialize().catch((err) => Logger.warn('RoomManager init error', err));
    await ReconnectService.runStartupRecovery().catch((err) => Logger.warn('Recovery error', err));
  })().catch((err) => {
    Logger.warn('Background services initialization notice:', err);
  });

  // 5. Graceful Shutdown Handlers
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
