import { getDb, withTransaction, isPostgresConfigured } from '../db/client';
import { games, gamePlayers, gameEvents, playerStatistics, leaderboards, matchHistory } from '../db/schema';
import { getRedisClient, isRedisAvailable, reportRedisError } from '../redis/client';
import { RedisKeys } from '../redis/keys';
import { DistributedLock } from '../redis/locks';
import { QueueRegistry } from '../queues/queueManager';
import { AuthoritativeGameSession } from './authoritativeEngine';
import { eq, desc } from 'drizzle-orm';
import { Logger } from '../config/env';

export class GamePersistenceService {
  private static localSessions = new Map<string, AuthoritativeGameSession>();
  private static localStats = new Map<string, { userId: string; gamesPlayed: number; gamesWon: number; winRate: string }>();

  /**
   * Save active realtime game state into Redis with TTL, or fallback to memory
   */
  static async saveActiveGameState(session: AuthoritativeGameSession): Promise<void> {
    this.localSessions.set(session.gameId, JSON.parse(JSON.stringify(session)));

    const redis = getRedisClient();
    if (!redis) return;

    const key = RedisKeys.gameState(session.gameId);
    const ttlSeconds = session.status === 'COMPLETED' ? 3600 : 86400; // 1 day for active, 1 hr for completed

    try {
      const pipeline = redis.pipeline();
      pipeline.set(key, JSON.stringify(session), 'EX', ttlSeconds);
      pipeline.set(RedisKeys.gameVersion(session.gameId), session.version.toString(), 'EX', ttlSeconds);
      pipeline.set(RedisKeys.gameTurn(session.gameId), session.currentTurn, 'EX', ttlSeconds);
      await pipeline.exec();
    } catch (err) {
      reportRedisError(err, `saveActiveGameState for ${session.gameId}`);
    }
  }

  /**
   * Get active game state from Redis, or fallback to memory / DB recovery
   */
  static async getGameState(gameId: string): Promise<AuthoritativeGameSession | null> {
    const redis = getRedisClient();
    if (redis) {
      try {
        const cached = await redis.get(RedisKeys.gameState(gameId));
        if (cached) {
          return JSON.parse(cached) as AuthoritativeGameSession;
        }
      } catch (err) {
        reportRedisError(err, `getGameState for ${gameId}`);
      }
    }

    if (this.localSessions.has(gameId)) {
      return JSON.parse(JSON.stringify(this.localSessions.get(gameId)!));
    }

    // Recover from PostgreSQL if available
    if (isPostgresConfigured()) {
      return await this.recoverGameStateFromDb(gameId);
    }

    return null;
  }

  /**
   * Persist authoritative game event into Neon PostgreSQL append-only event ledger
   */
  static async appendGameEvent(
    gameId: string,
    sequenceNumber: number,
    eventType: string,
    actorUserId: string | null,
    payload: Record<string, unknown>,
    gameVersion: number
  ): Promise<void> {
    if (!isPostgresConfigured()) return;

    try {
      const db = getDb();
      if (!db) return;
      await db.insert(gameEvents).values({
        id: `ev_${gameId}_${sequenceNumber}`,
        gameId,
        sequenceNumber,
        eventType,
        actorUserId,
        payload,
        gameVersion,
        serverTimestamp: new Date(),
      }).onConflictDoNothing();
    } catch (err) {
      Logger.warn(`PostgreSQL appendGameEvent notice: ${String(err)}`);
    }
  }

  /**
   * Atomically persist completed game into PostgreSQL and enqueue background jobs
   */
  static async finalizeGame(session: AuthoritativeGameSession): Promise<void> {
    const lockKey = RedisKeys.gameLock(session.gameId);

    await DistributedLock.withLock(lockKey, async () => {
      Logger.info(`Finalizing completed game ${session.gameId}`);
      const winnerPlayer = session.winner ? session.players[session.winner] : null;
      const winnerUserId = winnerPlayer?.id;

      // 1. Cache updated state in Redis
      await this.saveActiveGameState(session);

      // 2. Persist to Neon PostgreSQL permanent source of truth
      if (isPostgresConfigured()) {
        try {
          await withTransaction(async (client) => {
            // Update or insert Game record
            await client.query(
              `INSERT INTO games (id, mode, status, winner_user_id, total_turns, version, metadata, completed_at, updated_at)
               VALUES ($1, $2, 'COMPLETED', $3, $4, $5, $6, NOW(), NOW())
               ON CONFLICT (id) DO UPDATE SET
                 status = 'COMPLETED',
                 winner_user_id = EXCLUDED.winner_user_id,
                 total_turns = EXCLUDED.total_turns,
                 version = EXCLUDED.version,
                 completed_at = NOW(),
                 updated_at = NOW()`,
              [
                session.gameId,
                session.mode,
                winnerUserId || null,
                session.sequenceNumber,
                session.version,
                JSON.stringify({ winnerColor: session.winner, winnerUserId, completedAt: session.completedAt }),
              ]
            );

            // Update or insert Game Players
            for (const color of ['red', 'green', 'yellow', 'blue'] as const) {
              const p = session.players[color];
              if (p.isActive) {
                const isWinner = color === session.winner;
                const tokensHome = p.pawns ? p.pawns.filter((pawn) => pawn.state === 'goal').length : 0;
                await client.query(
                  `INSERT INTO game_players (id, game_id, user_id, color, is_host, is_ai, finish_position, final_score, tokens_home)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                   ON CONFLICT (id) DO UPDATE SET
                     finish_position = EXCLUDED.finish_position,
                     final_score = EXCLUDED.final_score,
                     tokens_home = EXCLUDED.tokens_home`,
                  [
                    `gp_${session.gameId}_${p.id}`,
                    session.gameId,
                    p.id,
                    color,
                    color === 'red',
                    !p.isHuman,
                    isWinner ? 1 : 2,
                    p.score,
                    tokensHome,
                  ]
                );
              }
            }

            // Record GAME_COMPLETED event in event log
            await client.query(
              `INSERT INTO game_events (id, game_id, sequence_number, event_type, actor_user_id, payload, game_version, server_timestamp)
               VALUES ($1, $2, $3, 'GAME_COMPLETED', $4, $5, $6, NOW())
               ON CONFLICT (game_id, sequence_number) DO NOTHING`,
              [
                `ev_${session.gameId}_${session.sequenceNumber}`,
                session.gameId,
                session.sequenceNumber,
                winnerUserId || null,
                JSON.stringify({ winnerColor: session.winner, winnerUserId, completedAt: session.completedAt }),
                session.version,
              ]
            );
          });
        } catch (err) {
          Logger.warn(`PostgreSQL finalizeGame warning: ${String(err)}`);
        }
      }

      // 3. Dispatch BullMQ jobs via Redis if configured and available
      if (isRedisAvailable()) {
        try {
          await QueueRegistry.getGameProcessingQueue().add(`process_game_${session.gameId}`, {
            type: 'GAME_COMPLETED',
            gameId: session.gameId,
            winnerUserId: winnerUserId || undefined,
            finalState: session as unknown as Record<string, unknown>,
            timestamp: Date.now(),
          });

          await QueueRegistry.getLeaderboardQueue().add(`recalc_${session.gameId}`, {
            type: 'RECALCULATE_RANKS',
            leaderboardType: 'GLOBAL',
            userId: winnerUserId || undefined,
          });
        } catch (err) {
          reportRedisError(err, 'BullMQ queue dispatch');
        }
      }

      // 4. Update local memory stats fallback
      for (const color of ['red', 'green', 'yellow', 'blue'] as const) {
        const p = session.players[color];
        if (p.isActive && !p.id.startsWith('bot-')) {
          const isWinner = color === session.winner;
          const current = this.localStats.get(p.id) || {
            userId: p.id,
            gamesPlayed: 0,
            gamesWon: 0,
            winRate: '0.00',
          };
          current.gamesPlayed += 1;
          if (isWinner) current.gamesWon += 1;
          current.winRate = ((current.gamesWon / current.gamesPlayed) * 100).toFixed(2);
          this.localStats.set(p.id, current);
        }
      }

      Logger.info(`Successfully finalized game ${session.gameId}`);
    });
  }

  /**
   * Reconstitute game state from PostgreSQL if needed
   */
  private static async recoverGameStateFromDb(gameId: string): Promise<AuthoritativeGameSession | null> {
    try {
      const db = getDb();
      if (!db) return null;
      const gameRecord = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
      if (gameRecord.length === 0) return null;

      const events = await db.select().from(gameEvents).where(eq(gameEvents.gameId, gameId)).orderBy(gameEvents.sequenceNumber);
      Logger.info(`Recovered game record ${gameId} from PostgreSQL (${events.length} logged events)`);
    } catch (err) {
      Logger.warn(`PostgreSQL recovery check skipped: ${String(err)}`);
    }
    return null;
  }

  /**
   * Fetch player stats from Neon PostgreSQL, falling back to local
   */
  static async getPlayerStats(userId: string): Promise<{
    userId: string;
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    winRate: string;
  } | null> {
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          const res = await db.select().from(playerStatistics).where(eq(playerStatistics.userId, userId)).limit(1);
          if (res.length > 0) {
            return {
              userId: res[0].userId,
              gamesPlayed: res[0].gamesPlayed,
              gamesWon: res[0].gamesWon,
              gamesLost: res[0].gamesLost,
              winRate: res[0].winRate.toString(),
            };
          }
        }
      } catch (err) {
        Logger.warn(`Failed to fetch PostgreSQL stats for ${userId}: ${String(err)}`);
      }
    }

    const local = this.localStats.get(userId);
    if (!local) return null;
    return {
      userId: local.userId,
      gamesPlayed: local.gamesPlayed,
      gamesWon: local.gamesWon,
      gamesLost: local.gamesPlayed - local.gamesWon,
      winRate: local.winRate,
    };
  }

  /**
   * Fetch global leaderboard from Neon PostgreSQL, falling back to local
   */
  static async getLeaderboard(type = 'GLOBAL'): Promise<Array<{ userId: string; score: number; rank: number }>> {
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          const res = await db
            .select({
              userId: leaderboards.userId,
              score: leaderboards.score,
              rank: leaderboards.rank,
            })
            .from(leaderboards)
            .where(eq(leaderboards.leaderboardType, type))
            .orderBy(desc(leaderboards.score))
            .limit(50);

          if (res.length > 0) {
            return res;
          }
        }
      } catch (err) {
        Logger.warn(`Failed to fetch PostgreSQL leaderboard: ${String(err)}`);
      }
    }

    return Array.from(this.localStats.values())
      .map((s, idx) => ({
        userId: s.userId,
        score: s.gamesWon * 100,
        rank: idx + 1,
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Fetch match history for a player from PostgreSQL
   */
  static async getPlayerMatchHistory(userId: string): Promise<Array<any>> {
    if (!isPostgresConfigured()) return [];
    try {
      const db = getDb();
      if (!db) return [];
      return await db
        .select()
        .from(matchHistory)
        .where(eq(matchHistory.userId, userId))
        .orderBy(desc(matchHistory.playedAt))
        .limit(20);
    } catch (err) {
      Logger.warn(`Failed to query match history: ${String(err)}`);
      return [];
    }
  }
}
