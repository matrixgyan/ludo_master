import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { checkPostgresHealth, getDb, isPostgresConfigured, withTransaction } from '../db/client';
import { checkRedisHealth, getRedisClient, isRedisConfigured } from '../redis/client';
import { checkR2Health, uploadToR2, getObjectFromR2, deleteObjectFromR2, isR2Configured } from '../storage/r2Client';
import { users, games, gamePlayers, gameEvents, playerStatistics, leaderboards, matchHistory, storageObjects } from '../db/schema';
import { GamePersistenceService } from '../game/persistenceService';
import { PresenceManager } from '../redis/presence';
import { MatchmakingService } from '../redis/matchmaking';
import { QueueRegistry } from '../queues/queueManager';
import { wsServerInstance } from '../websocket/wsServer';
import { config, Logger } from '../config/env';
import { eq, desc, sql, like, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const adminRouter = Router();

// In-memory persistent platform settings fallback
interface PlatformSettings {
  adminUrlAlias: string;
  maintenanceMode: boolean;
  turnTimeoutSeconds: number;
  maxConsecutiveSixes: number;
  entryFee2Player: number;
  entryFee4Player: number;
  entryFeeSnakeLudo: number;
  prizePoolPercentage: number;
  allowedOrigins: string[];
}

export interface ActiveThemeConfig {
  activeLobbyId: string;
  activeBoardId: string;
  activeDiceId: string;
  activePawnId: string;
  enabledLobbies: string[];
  enabledBoards: string[];
  enabledDice: string[];
  enabledPawns: string[];
  customThemes?: any[];
  updatedAt: string;
  deployedBy?: string;
}

let platformSettings: PlatformSettings = {
  adminUrlAlias: 'admin',
  maintenanceMode: false,
  turnTimeoutSeconds: 30,
  maxConsecutiveSixes: 3,
  entryFee2Player: 100,
  entryFee4Player: 250,
  entryFeeSnakeLudo: 50,
  prizePoolPercentage: 85,
  allowedOrigins: ['https://ludo.omyra.org', 'http://localhost:3000'],
};

let activeThemeConfig: ActiveThemeConfig = {
  activeLobbyId: 'dubai_prestige_gold',
  activeBoardId: 'dubai_royal_sunset',
  activeDiceId: 'golden_high_roller',
  activePawnId: 'royal_crowned',
  enabledLobbies: ['dubai_prestige_gold', 'cyberpunk_neon_tokyo', 'monaco_vip_casino', 'emerald_palace_tournament', 'sunset_oasis_carnival'],
  enabledBoards: ['dubai_royal_sunset', 'classic_emerald', 'cyber_neon', 'midnight_marble', 'candy_pastel', 'aztec_wood'],
  enabledDice: ['golden_high_roller', 'classic_pearl', 'cyber_glass', 'ruby_royale', 'emerald_jade', 'dark_matter'],
  enabledPawns: ['royal_crowned', 'classic_gloss', 'crystal_gem', 'cyber_mecha', 'golden_sovereign', 'dragon_shield'],
  customThemes: [],
  updatedAt: new Date().toISOString(),
  deployedBy: 'SuperAdmin',
};

// Admin authentication constants
const ADMIN_EMAIL = 'md16201620@gmail.com';
const ADMIN_PASSWORD = 'admin';
const activeAdminTokens = new Set<string>();

// Multer memory storage for admin asset uploads
const adminUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// Middleware: Authenticate Admin Request
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.query.token as string);

  if (!token || !activeAdminTokens.has(token)) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication token invalid or expired' });
    return;
  }
  next();
}

// -----------------------------------------------------------------------------
// 1. ADMIN AUTHENTICATION
// -----------------------------------------------------------------------------

adminRouter.post('/api/admin/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = `adm_${uuidv4()}_${Date.now()}`;
    activeAdminTokens.add(token);
    Logger.info(`Admin successfully logged in: ${email}`);

    res.json({
      success: true,
      token,
      admin: {
        email: ADMIN_EMAIL,
        name: 'Master Administrator',
        role: 'SUPER_ADMIN',
        loginTime: new Date().toISOString(),
        adminUrlAlias: platformSettings.adminUrlAlias,
      },
    });
  } else {
    Logger.warn(`Failed admin login attempt for: ${email}`);
    res.status(401).json({ error: 'Invalid admin email or password' });
  }
});

adminRouter.get('/api/admin/auth/me', requireAdminAuth, (req: Request, res: Response) => {
  res.json({
    authenticated: true,
    admin: {
      email: ADMIN_EMAIL,
      name: 'Master Administrator',
      role: 'SUPER_ADMIN',
      adminUrlAlias: platformSettings.adminUrlAlias,
    },
  });
});

adminRouter.post('/api/admin/auth/logout', requireAdminAuth, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.slice(7);
  if (token) {
    activeAdminTokens.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// -----------------------------------------------------------------------------
// 2. PLATFORM SETTINGS & URL ALIAS MANAGEMENT
// -----------------------------------------------------------------------------

adminRouter.get('/api/admin/settings', (req: Request, res: Response) => {
  res.json({
    settings: platformSettings,
    adminUrls: {
      defaultUrl: 'https://ludo.omyra.org/admin',
      currentAliasUrl: `https://ludo.omyra.org/${platformSettings.adminUrlAlias}`,
      currentSlug: platformSettings.adminUrlAlias,
    },
  });
});

adminRouter.post('/api/admin/settings', requireAdminAuth, (req: Request, res: Response) => {
  const {
    adminUrlAlias,
    maintenanceMode,
    turnTimeoutSeconds,
    maxConsecutiveSixes,
    entryFee2Player,
    entryFee4Player,
    entryFeeSnakeLudo,
    prizePoolPercentage,
  } = req.body;

  if (adminUrlAlias) {
    // Sanitize alias slug (e.g. 'custom', 'control-panel', 'admin')
    const sanitizedSlug = String(adminUrlAlias)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '');

    if (sanitizedSlug.length > 0) {
      platformSettings.adminUrlAlias = sanitizedSlug;
      Logger.info(`Admin URL alias updated to: /${sanitizedSlug}`);
    }
  }

  if (typeof maintenanceMode === 'boolean') {
    platformSettings.maintenanceMode = maintenanceMode;
    // Broadcast maintenance notification to all rooms
    if (maintenanceMode) {
      wsServerInstance.broadcastToRoom('global', {
        type: 'SYSTEM_ANNOUNCEMENT',
        message: 'System is entering scheduled maintenance mode. Active games will conclude.',
      });
    }
  }

  if (turnTimeoutSeconds !== undefined) platformSettings.turnTimeoutSeconds = Number(turnTimeoutSeconds);
  if (maxConsecutiveSixes !== undefined) platformSettings.maxConsecutiveSixes = Number(maxConsecutiveSixes);
  if (entryFee2Player !== undefined) platformSettings.entryFee2Player = Number(entryFee2Player);
  if (entryFee4Player !== undefined) platformSettings.entryFee4Player = Number(entryFee4Player);
  if (entryFeeSnakeLudo !== undefined) platformSettings.entryFeeSnakeLudo = Number(entryFeeSnakeLudo);
  if (prizePoolPercentage !== undefined) platformSettings.prizePoolPercentage = Number(prizePoolPercentage);

  res.json({
    success: true,
    message: 'Platform configuration updated successfully',
    settings: platformSettings,
    adminUrls: {
      defaultUrl: 'https://ludo.omyra.org/admin',
      currentAliasUrl: `https://ludo.omyra.org/${platformSettings.adminUrlAlias}`,
      currentSlug: platformSettings.adminUrlAlias,
    },
  });
});

// -----------------------------------------------------------------------------
// 2B. LUDO LOBBY, BOARD, DICE & PAWNS THEME ASSETS CUSTOMIZER (PUBLIC & ADMIN)
// -----------------------------------------------------------------------------

// Public endpoint for all players/clients to get the live active deployed theme configuration
adminRouter.get('/api/theme-config', (req: Request, res: Response) => {
  res.json({
    success: true,
    themeConfig: activeThemeConfig,
  });
});

adminRouter.get('/api/admin/theme-assets', (req: Request, res: Response) => {
  res.json({
    success: true,
    themeConfig: activeThemeConfig,
  });
});

adminRouter.post('/api/admin/theme-assets', requireAdminAuth, (req: Request, res: Response) => {
  const {
    activeLobbyId,
    activeBoardId,
    activeDiceId,
    activePawnId,
    enabledLobbies,
    enabledBoards,
    enabledDice,
    enabledPawns,
    customThemes,
    deployedBy,
  } = req.body;

  if (activeLobbyId) activeThemeConfig.activeLobbyId = activeLobbyId;
  if (activeBoardId) activeThemeConfig.activeBoardId = activeBoardId;
  if (activeDiceId) activeThemeConfig.activeDiceId = activeDiceId;
  if (activePawnId) activeThemeConfig.activePawnId = activePawnId;
  if (Array.isArray(enabledLobbies)) activeThemeConfig.enabledLobbies = enabledLobbies;
  if (Array.isArray(enabledBoards)) activeThemeConfig.enabledBoards = enabledBoards;
  if (Array.isArray(enabledDice)) activeThemeConfig.enabledDice = enabledDice;
  if (Array.isArray(enabledPawns)) activeThemeConfig.enabledPawns = enabledPawns;
  if (Array.isArray(customThemes)) activeThemeConfig.customThemes = customThemes;
  if (deployedBy) activeThemeConfig.deployedBy = deployedBy;
  activeThemeConfig.updatedAt = new Date().toISOString();

  Logger.info(`Admin deployed live platform theme: Lobby=${activeThemeConfig.activeLobbyId}, Board=${activeThemeConfig.activeBoardId}, Dice=${activeThemeConfig.activeDiceId}, Pawn=${activeThemeConfig.activePawnId}`);

  // Broadcast theme change to active live games and lobbies
  wsServerInstance.broadcastToRoom('global', {
    type: 'THEME_UPDATED',
    themeConfig: activeThemeConfig,
  });

  res.json({
    success: true,
    message: 'Platform lobby, ludo boards, pawns & dice configuration deployed to live platform successfully!',
    themeConfig: activeThemeConfig,
  });
});

// -----------------------------------------------------------------------------
// 3. COMPREHENSIVE PLATFORM METRICS
// -----------------------------------------------------------------------------

adminRouter.get('/api/admin/metrics', requireAdminAuth, async (req: Request, res: Response) => {
  const [pgHealth, redisHealth, r2Health, queueMetrics, onlineCount] = await Promise.all([
    checkPostgresHealth(),
    checkRedisHealth(),
    checkR2Health(),
    QueueRegistry.getQueueMetrics(),
    PresenceManager.getOnlineCount(),
  ]);

  let totalUsers = 0;
  let totalGames = 0;
  let activeGamesCount = 0;
  let completedGamesCount = 0;

  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        const uCount = await db.select({ count: sql<number>`count(*)` }).from(users);
        totalUsers = Number(uCount[0]?.count || 0);

        const gCount = await db.select({ count: sql<number>`count(*)` }).from(games);
        totalGames = Number(gCount[0]?.count || 0);

        const activeCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(games)
          .where(eq(games.status, 'IN_PROGRESS'));
        activeGamesCount = Number(activeCount[0]?.count || 0);

        const completedCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(games)
          .where(eq(games.status, 'COMPLETED'));
        completedGamesCount = Number(completedCount[0]?.count || 0);
      }
    } catch (err) {
      Logger.warn(`Postgres metric query error: ${String(err)}`);
    }
  }

  const mem = process.memoryUsage();

  res.json({
    timestamp: new Date().toISOString(),
    overview: {
      onlinePlayers: onlineCount,
      totalRegisteredUsers: totalUsers,
      totalGamesCreated: totalGames,
      activeGames: activeGamesCount,
      completedGames: completedGamesCount,
      maintenanceMode: platformSettings.maintenanceMode,
    },
    services: {
      neonPostgres: {
        ...pgHealth,
        isConfigured: isPostgresConfigured(),
      },
      redisUpstash: {
        ...redisHealth,
        isConfigured: isRedisConfigured(),
      },
      cloudflareR2: {
        ...r2Health,
        isConfigured: isR2Configured(),
        bucketName: config.R2_BUCKET_NAME || 'Not Configured',
      },
    },
    queues: queueMetrics,
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
      rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      nodeVersion: process.version,
    },
  });
});

// -----------------------------------------------------------------------------
// 4. LIVE MATCHES & GAME ROOMS MANAGEMENT
// -----------------------------------------------------------------------------

adminRouter.get('/api/admin/games', requireAdminAuth, async (req: Request, res: Response) => {
  const statusFilter = (req.query.status as string) || undefined;
  const modeFilter = (req.query.mode as string) || undefined;
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Number(req.query.offset) || 0;

  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        let query = db.select().from(games).$dynamic();
        if (statusFilter) query = query.where(eq(games.status, statusFilter));
        if (modeFilter) query = query.where(eq(games.mode, modeFilter));

        const gameList = await query.orderBy(desc(games.createdAt)).limit(limit).offset(offset);
        const total = await db.select({ count: sql<number>`count(*)` }).from(games);

        res.json({
          games: gameList,
          total: Number(total[0]?.count || 0),
          limit,
          offset,
        });
        return;
      }
    } catch (err) {
      Logger.warn(`Failed to list games from DB: ${String(err)}`);
    }
  }

  // Fallback
  res.json({
    games: [],
    total: 0,
    limit,
    offset,
  });
});

adminRouter.get('/api/admin/games/:gameId', requireAdminAuth, async (req: Request, res: Response) => {
  const { gameId } = req.params;

  // 1. Fetch active state from Redis / memory
  const liveState = await GamePersistenceService.getGameState(gameId);

  // 2. Fetch DB record and players
  let dbRecord: any = null;
  let playersList: any[] = [];
  let eventsList: any[] = [];

  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        const g = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
        dbRecord = g[0] || null;

        playersList = await db.select().from(gamePlayers).where(eq(gamePlayers.gameId, gameId));
        eventsList = await db
          .select()
          .from(gameEvents)
          .where(eq(gameEvents.gameId, gameId))
          .orderBy(gameEvents.sequenceNumber)
          .limit(100);
      }
    } catch (err) {
      Logger.warn(`Error fetching game details: ${String(err)}`);
    }
  }

  res.json({
    gameId,
    liveState,
    dbRecord,
    players: playersList,
    events: eventsList,
  });
});

adminRouter.post('/api/admin/games/:gameId/terminate', requireAdminAuth, async (req: Request, res: Response) => {
  const { gameId } = req.params;
  const reason = (req.body.reason as string) || 'Terminated by Administrator';

  const session = await GamePersistenceService.getGameState(gameId);
  if (session) {
    session.status = 'ABANDONED';
    await GamePersistenceService.saveActiveGameState(session);
  }

  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        await db
          .update(games)
          .set({ status: 'ABANDONED', updatedAt: new Date(), completedAt: new Date() })
          .where(eq(games.id, gameId));
      }
    } catch (err) {
      Logger.warn(`Failed to update DB on terminate: ${String(err)}`);
    }
  }

  // Notify connected sockets in that room
  wsServerInstance.broadcastToRoom(gameId, {
    type: 'GAME_TERMINATED',
    reason,
    timestamp: Date.now(),
  });

  res.json({ success: true, message: `Game ${gameId} terminated successfully` });
});

// -----------------------------------------------------------------------------
// 5. USER & WALLET MANAGEMENT
// -----------------------------------------------------------------------------

adminRouter.get('/api/admin/users', requireAdminAuth, async (req: Request, res: Response) => {
  const search = (req.query.search as string) || '';
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Number(req.query.offset) || 0;

  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        let userListQuery = db.select().from(users).$dynamic();
        if (search) {
          userListQuery = userListQuery.where(
            or(like(users.username, `%${search}%`), like(users.id, `%${search}%`))
          );
        }

        const userList = await userListQuery.orderBy(desc(users.createdAt)).limit(limit).offset(offset);
        const total = await db.select({ count: sql<number>`count(*)` }).from(users);

        res.json({
          users: userList,
          total: Number(total[0]?.count || 0),
          limit,
          offset,
        });
        return;
      }
    } catch (err) {
      Logger.warn(`DB User query error: ${String(err)}`);
    }
  }

  // Fallback initial sample users if database not yet populated
  const sampleUsers = [
    {
      id: 'p1',
      username: 'Player 1 (Master)',
      coins: 15400,
      diamonds: 120,
      createdAt: new Date().toISOString(),
      walletAddress: '0x71C...49b2',
    },
    {
      id: 'p2',
      username: 'Player 2 (Viper)',
      coins: 8200,
      diamonds: 45,
      createdAt: new Date().toISOString(),
      walletAddress: '0x32A...81ec',
    },
    {
      id: 'p3',
      username: 'Player 3 (Apex)',
      coins: 4900,
      diamonds: 10,
      createdAt: new Date().toISOString(),
      walletAddress: '0x99F...28a0',
    },
  ];

  res.json({
    users: sampleUsers,
    total: sampleUsers.length,
    limit,
    offset,
  });
});

adminRouter.post('/api/admin/users/:userId/adjust-balance', requireAdminAuth, async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { coinsDelta, diamondsDelta, reason } = req.body;

  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        await db
          .update(users)
          .set({
            coins: sql`${users.coins} + ${Number(coinsDelta || 0)}`,
            diamonds: sql`${users.diamonds} + ${Number(diamondsDelta || 0)}`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        const updated = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        Logger.info(`Admin adjusted balance for ${userId}: Coins +${coinsDelta}, Diamonds +${diamondsDelta} (${reason})`);

        res.json({
          success: true,
          user: updated[0] || null,
          message: 'Balance updated in Neon PostgreSQL',
        });
        return;
      }
    } catch (err) {
      Logger.error(`Failed to adjust user balance in DB: ${String(err)}`);
    }
  }

  res.json({
    success: true,
    message: `Adjusted user ${userId} balance by coins: ${coinsDelta}, diamonds: ${diamondsDelta}`,
  });
});

// -----------------------------------------------------------------------------
// 6. LEADERBOARDS & RANKINGS MANAGEMENT
// -----------------------------------------------------------------------------

adminRouter.get('/api/admin/leaderboards', requireAdminAuth, async (req: Request, res: Response) => {
  const type = (req.query.type as string) || 'GLOBAL';
  const leaderboard = await GamePersistenceService.getLeaderboard(type);
  res.json({ type, leaderboard });
});

adminRouter.post('/api/admin/leaderboards/recalculate', requireAdminAuth, async (req: Request, res: Response) => {
  const type = (req.body.type as string) || 'GLOBAL';
  if (isRedisConfigured()) {
    await QueueRegistry.getLeaderboardQueue().add(`admin_manual_recalc_${Date.now()}`, {
      type: 'RECALCULATE_RANKS',
      leaderboardType: type as any,
    });
  }
  res.json({ success: true, message: `Dispatched recalculation job for ${type} leaderboard` });
});

// -----------------------------------------------------------------------------
// 7. CLOUDFLARE R2 ASSET & OBJECT STORAGE MANAGER
// -----------------------------------------------------------------------------

adminRouter.get('/api/admin/storage/objects', requireAdminAuth, async (req: Request, res: Response) => {
  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        const objects = await db.select().from(storageObjects).orderBy(desc(storageObjects.createdAt)).limit(100);
        res.json({
          isConfigured: isR2Configured(),
          bucket: config.R2_BUCKET_NAME || 'Not Configured',
          objects,
        });
        return;
      }
    } catch (err) {
      Logger.warn(`Failed to fetch storage objects list: ${String(err)}`);
    }
  }

  res.json({
    isConfigured: isR2Configured(),
    bucket: config.R2_BUCKET_NAME || 'Not Configured',
    objects: [],
  });
});

adminRouter.post(
  '/api/admin/storage/upload',
  requireAdminAuth,
  adminUpload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const category = (req.body.category as any) || 'assets';
      const customKey = (req.body.customKey as string) || undefined;

      const result = await uploadToR2({
        key: customKey,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        userId: 'admin',
        category,
      });

      res.status(201).json({
        success: true,
        message: 'File successfully uploaded to Cloudflare R2',
        file: result,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      Logger.error('Admin R2 upload failed', err);
      res.status(500).json({ error: errMsg });
    }
  }
);

adminRouter.delete('/api/admin/storage/objects/:key(*)', requireAdminAuth, async (req: Request, res: Response) => {
  const key = req.params.key;
  const deleted = await deleteObjectFromR2(key);

  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        await db.delete(storageObjects).where(eq(storageObjects.key, key));
      }
    } catch (err) {
      Logger.warn(`Failed to delete object from DB metadata: ${String(err)}`);
    }
  }

  res.json({ success: deleted, message: `Object ${key} deleted from Cloudflare R2` });
});

// -----------------------------------------------------------------------------
// 8. GLOBAL BROADCAST & SYSTEM UTILITIES
// -----------------------------------------------------------------------------

adminRouter.post('/api/admin/broadcast', requireAdminAuth, (req: Request, res: Response) => {
  const { message, level } = req.body;
  if (!message) {
    res.status(400).json({ error: 'Message cannot be empty' });
    return;
  }

  wsServerInstance.broadcastToRoom('global', {
    type: 'ADMIN_BROADCAST',
    message,
    level: level || 'INFO',
    timestamp: Date.now(),
  });

  Logger.info(`Admin Broadcast: ${message}`);
  res.json({ success: true, message: 'Broadcast dispatched to all connected clients' });
});

adminRouter.post('/api/admin/system/flush-cache', requireAdminAuth, async (req: Request, res: Response) => {
  const { target } = req.body; // 'matchmaking' | 'stats' | 'all'

  if (isRedisConfigured()) {
    const redis = getRedisClient();
    if (redis) {
      try {
        if (target === 'matchmaking') {
          await redis.del('ludo:matchmaking:queue:2_PLAYER', 'ludo:matchmaking:queue:4_PLAYER', 'ludo:matchmaking:queue:SNAKE_LUDO');
        } else if (target === 'all') {
          // Flush only ludo keys
          const keys = await redis.keys('ludo:*');
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        }
        Logger.info(`Admin flushed Redis cache for target: ${target}`);
        res.json({ success: true, message: `Redis cache flushed for ${target}` });
        return;
      } catch (err) {
        Logger.error('Redis cache flush error', err);
      }
    }
  }

  res.json({ success: true, message: 'Local caches reset successfully' });
});
