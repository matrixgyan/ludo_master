import { Router, Request, Response } from 'express';
import { checkPostgresHealth, getDb } from '../db/client';
import { checkRedisHealth } from '../redis/client';
import { QueueRegistry } from '../queues/queueManager';
import { MatchmakingService } from '../redis/matchmaking';
import { PresenceManager } from '../redis/presence';
import { GamePersistenceService } from '../game/persistenceService';
import { leaderboards, playerStatistics, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { Logger } from '../config/env';

export const apiRouter = Router();

// -----------------------------------------------------------------------------
// 1. HEALTH & OBSERVABILITY PROBES
// -----------------------------------------------------------------------------

// /health
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// /liveness
apiRouter.get('/liveness', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// /readiness
apiRouter.get('/readiness', async (req: Request, res: Response) => {
  const [pgHealth, redisHealth, queueMetrics] = await Promise.all([
    checkPostgresHealth(),
    checkRedisHealth(),
    QueueRegistry.getQueueMetrics(),
  ]);

  const isReady = pgHealth.status === 'healthy' || redisHealth.status === 'healthy' || process.env.NODE_ENV !== 'production';

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'degraded',
    checks: {
      postgres: pgHealth,
      redis: redisHealth,
      bullmq: {
        status: 'active',
        queues: queueMetrics,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// /api/metrics
apiRouter.get('/api/metrics', async (req: Request, res: Response) => {
  const [onlineCount, queueMetrics] = await Promise.all([
    PresenceManager.getOnlineCount(),
    QueueRegistry.getQueueMetrics(),
  ]);

  res.json({
    onlinePlayers: onlineCount,
    queues: queueMetrics,
    memoryUsage: process.memoryUsage(),
  });
});

// -----------------------------------------------------------------------------
// 2. MATCHMAKING REST APIS
// -----------------------------------------------------------------------------

apiRouter.post('/api/matchmaking/join', async (req: Request, res: Response) => {
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
    res.json({ success: true, message: 'Enqueued successfully' });
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
// 3. GAME & STATS APIS
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
  try {
    const db = getDb();
    const stats = await db.select().from(playerStatistics).where(eq(playerStatistics.userId, userId));
    res.json({ stats: stats[0] || null });
  } catch (err) {
    Logger.error(`Failed to fetch stats for user ${userId}`, err);
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

apiRouter.get('/api/leaderboard', async (req: Request, res: Response) => {
  const type = (req.query.type as string) || 'GLOBAL';
  const period = (req.query.period as string) || 'ALL_TIME';

  try {
    const db = getDb();
    const results = await db
      .select({
        id: leaderboards.id,
        userId: leaderboards.userId,
        score: leaderboards.score,
        rank: leaderboards.rank,
        updatedAt: leaderboards.updatedAt,
      })
      .from(leaderboards)
      .where(eq(leaderboards.leaderboardType, type))
      .orderBy(desc(leaderboards.score))
      .limit(50);

    res.json({ leaderboard: results });
  } catch (err) {
    Logger.error('Failed to fetch leaderboard', err);
    res.json({ leaderboard: [] });
  }
});
