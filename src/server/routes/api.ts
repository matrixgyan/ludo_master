import { Router, Request, Response } from 'express';
import multer from 'multer';
import { checkPostgresHealth } from '../db/client';
import { checkRedisHealth } from '../redis/client';
import { checkR2Health, uploadToR2, generatePresignedUploadUrl, getObjectFromR2, deleteObjectFromR2 } from '../storage/r2Client';
import { MatchmakingService } from '../redis/matchmaking';
import { PresenceManager } from '../redis/presence';
import { GamePersistenceService } from '../game/persistenceService';
import { QueueRegistry } from '../queues/queueManager';
import { rateLimiter } from '../redis/rateLimit';
import { getServicesStatusSummary, Logger } from '../config/env';

export const apiRouter = Router();

// Multer in-memory storage configuration for direct R2 uploads (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// -----------------------------------------------------------------------------
// 1. HEALTH & OBSERVABILITY PROBES
// -----------------------------------------------------------------------------

// /health and /api/health - Comprehensive multi-service status
apiRouter.get(['/health', '/api/health'], async (req: Request, res: Response) => {
  const [pgHealth, redisHealth, r2Health, queueMetrics] = await Promise.all([
    checkPostgresHealth(),
    checkRedisHealth(),
    checkR2Health(),
    QueueRegistry.getQueueMetrics(),
  ]);

  const services = getServicesStatusSummary();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    services: {
      neonPostgres: {
        ...services.neonPostgres,
        ...pgHealth,
      },
      redisUpstash: {
        ...services.redis,
        ...redisHealth,
      },
      cloudflareR2: {
        ...services.cloudflareR2,
        ...r2Health,
      },
    },
    bullmqQueues: queueMetrics,
  });
});

// /liveness - Kubernetes/Container liveness probe
apiRouter.get('/liveness', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// /readiness - Ready when services don't have hard crashing errors
apiRouter.get('/readiness', async (req: Request, res: Response) => {
  const [pgHealth, redisHealth, r2Health] = await Promise.all([
    checkPostgresHealth(),
    checkRedisHealth(),
    checkR2Health(),
  ]);

  const isHealthy =
    pgHealth.status !== 'unhealthy' &&
    redisHealth.status !== 'unhealthy' &&
    r2Health.status !== 'unhealthy';

  if (isHealthy) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: { postgres: pgHealth.status, redis: redisHealth.status, r2: r2Health.status },
    });
  } else {
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      checks: { postgres: pgHealth.status, redis: redisHealth.status, r2: r2Health.status },
    });
  }
});

// /api/metrics
apiRouter.get('/api/metrics', async (req: Request, res: Response) => {
  const onlineCount = await PresenceManager.getOnlineCount();
  const queueMetrics = await QueueRegistry.getQueueMetrics();
  res.json({
    onlinePlayers: onlineCount,
    memoryUsage: process.memoryUsage(),
    queues: queueMetrics,
  });
});

// -----------------------------------------------------------------------------
// 2. MATCHMAKING REST APIS (Backed by Redis)
// -----------------------------------------------------------------------------

apiRouter.post('/api/matchmaking/join', rateLimiter({ maxRequests: 20, windowSeconds: 60 }), async (req: Request, res: Response) => {
  const { userId, username, mode, avatarUrl } = req.body;
  if (!userId || !username) {
    res.status(400).json({ error: 'Missing userId or username' });
    return;
  }

  const result = await MatchmakingService.enqueue(
    userId,
    username,
    mode || '2_PLAYER',
    avatarUrl
  );

  if (result.success) {
    res.json({ success: true, message: 'Enqueued successfully into matchmaking pool' });
  } else {
    res.status(500).json({ error: result.error });
  }
});

apiRouter.post('/api/matchmaking/cancel', async (req: Request, res: Response) => {
  const { userId, mode } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }

  const success = await MatchmakingService.cancel(userId, mode || '2_PLAYER');
  res.json({ success });
});

// -----------------------------------------------------------------------------
// 3. GAME & STATS APIS (Backed by Neon PostgreSQL)
// -----------------------------------------------------------------------------

apiRouter.get('/api/games/:gameId', async (req: Request, res: Response) => {
  const { gameId } = req.params;
  const state = await GamePersistenceService.getGameState(gameId);
  if (!state) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }
  res.json({ state });
});

apiRouter.get('/api/player/stats/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const stats = await GamePersistenceService.getPlayerStats(userId);
  res.json({ stats: stats || { userId, gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: '0.00' } });
});

apiRouter.get('/api/player/history/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const history = await GamePersistenceService.getPlayerMatchHistory(userId);
  res.json({ history });
});

apiRouter.get('/api/leaderboard', async (req: Request, res: Response) => {
  const type = (req.query.type as string) || 'GLOBAL';
  const leaderboard = await GamePersistenceService.getLeaderboard(type);
  res.json({ leaderboard });
});

// -----------------------------------------------------------------------------
// 4. CLOUDFLARE R2 OBJECT STORAGE APIS
// -----------------------------------------------------------------------------

// Direct Multipart File Upload to Cloudflare R2
apiRouter.post(
  '/api/storage/upload',
  upload.single('file'),
  rateLimiter({ maxRequests: 30, windowSeconds: 60 }),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file provided' });
        return;
      }

      const userId = (req.body.userId as string) || undefined;
      const category = (req.body.category as any) || 'images';

      const result = await uploadToR2({
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        userId,
        category,
      });

      res.status(201).json({
        success: true,
        file: result,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      Logger.error('R2 upload failed', err);
      res.status(500).json({ error: errMsg });
    }
  }
);

// Presigned Upload URL generation for Direct Browser-to-R2 Upload
apiRouter.post('/api/storage/presigned-upload', async (req: Request, res: Response) => {
  try {
    const { key, contentType, expiresInSeconds } = req.body;
    if (!key || !contentType) {
      res.status(400).json({ error: 'Missing key or contentType' });
      return;
    }

    const result = await generatePresignedUploadUrl({
      key,
      contentType,
      expiresInSeconds: expiresInSeconds || 300,
    });

    res.json(result);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errMsg });
  }
});

// Public download / proxy stream for R2 stored object
apiRouter.get('/api/storage/file/:key(*)', async (req: Request, res: Response) => {
  try {
    const key = req.params.key;
    const file = await getObjectFromR2(key);

    if (!file) {
      res.status(404).json({ error: 'Object not found in storage' });
      return;
    }

    res.setHeader('Content-Type', file.contentType);
    if (file.contentLength) {
      res.setHeader('Content-Length', file.contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    file.stream.pipe(res);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errMsg });
  }
});

// Delete file from R2
apiRouter.delete('/api/storage/file/:key(*)', async (req: Request, res: Response) => {
  try {
    const key = req.params.key;
    const success = await deleteObjectFromR2(key);
    res.json({ success });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errMsg });
  }
});
