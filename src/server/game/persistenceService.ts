import { getDb, withTransaction } from '../db/client';
import { games, gamePlayers, gameEvents, gameStateSnapshots, users } from '../db/schema';
import { getRedisClient } from '../redis/client';
import { RedisKeys } from '../redis/keys';
import { DistributedLock } from '../redis/locks';
import { QueueRegistry } from '../queues/queueManager';
import { AuthoritativeGameSession } from './authoritativeEngine';
import { eq, desc } from 'drizzle-orm';
import { config, Logger } from '../config/env';

export class GamePersistenceService {
  private static memorySessions = new Map<string, AuthoritativeGameSession>();

  /**
   * Save active game state into Redis with TTL, or fallback to memory cache
   */
  static async saveActiveGameState(session: AuthoritativeGameSession): Promise<void> {
    this.memorySessions.set(session.gameId, session);

    const redis = getRedisClient();
    if (!redis) return;

    const key = RedisKeys.gameState(session.gameId);
    const ttlSeconds = session.status === 'COMPLETED' ? 3600 : 86400;

    try {
      const pipeline = redis.pipeline();
      pipeline.set(key, JSON.stringify(session), 'EX', ttlSeconds);
      pipeline.set(RedisKeys.gameVersion(session.gameId), session.version.toString(), 'EX', ttlSeconds);
      pipeline.set(RedisKeys.gameTurn(session.gameId), session.currentTurn, 'EX', ttlSeconds);
      await pipeline.exec();
    } catch (err) {
      Logger.warn(`Redis save skipped in fallback mode for ${session.gameId}`);
    }
  }

  /**
   * Get active game state from Redis, or fallback to memory cache, or recover from PostgreSQL
   */
  static async getGameState(gameId: string): Promise<AuthoritativeGameSession | null> {
    const redis = getRedisClient();
    if (redis) {
      try {
        const cached = await redis.get(RedisKeys.gameState(gameId));
        if (cached) {
          return JSON.parse(cached) as AuthoritativeGameSession;
        }
      } catch {
        // Fall through to memory
      }
    }

    if (this.memorySessions.has(gameId)) {
      return this.memorySessions.get(gameId)!;
    }

    // Recovery from PostgreSQL snapshot
    if (config.DATABASE_URL) {
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
    if (!config.DATABASE_URL) return;

    try {
      const db = getDb();
      await db.insert(gameEvents).values({
        id: `ev_${gameId}_${sequenceNumber}`,
        gameId,
        sequenceNumber,
        eventType,
        actorUserId,
        payload,
        gameVersion,
        serverTimestamp: new Date(),
      });
    } catch (err) {
      Logger.warn(`PostgreSQL appendGameEvent skipped: ${String(err)}`);
    }
  }

  /**
   * Create periodic game state snapshot in PostgreSQL
   */
  static async saveStateSnapshot(session: AuthoritativeGameSession): Promise<void> {
    if (!config.DATABASE_URL) return;

    try {
      const db = getDb();
      await db.insert(gameStateSnapshots).values({
        id: `snap_${session.gameId}_v${session.version}`,
        gameId: session.gameId,
        version: session.version,
        state: session as unknown as Record<string, unknown>,
        createdAt: new Date(),
      });
    } catch (err) {
      Logger.warn(`PostgreSQL saveStateSnapshot skipped: ${String(err)}`);
    }
  }

  /**
   * Atomically persist completed game in PostgreSQL and enqueue background jobs
   */
  static async finalizeGame(session: AuthoritativeGameSession): Promise<void> {
    const lockKey = RedisKeys.gameLock(session.gameId);

    await DistributedLock.withLock(lockKey, async () => {
      Logger.info(`Finalizing completed game ${session.gameId}`);
      const winnerPlayer = session.winner ? session.players[session.winner] : null;
      const winnerUserId = winnerPlayer?.id;

      // 1. Memory & Redis state update
      await this.saveActiveGameState(session);

      // 2. PostgreSQL persistence if available
      if (config.DATABASE_URL) {
        try {
          await withTransaction(async (client) => {
            // Update Game record
            await client.query(
              `UPDATE games SET status = 'COMPLETED', winner_user_id = $1, completed_at = NOW(), updated_at = NOW(), version = $2 WHERE id = $3`,
              [winnerUserId, session.version, session.gameId]
            );

            // Update players finish status
            for (const color of ['red', 'green', 'yellow', 'blue'] as const) {
              const p = session.players[color];
              if (p.isActive && !p.id.startsWith('bot-')) {
                const isWinner = color === session.winner;
                await client.query(
                  `UPDATE game_players SET status = 'FINISHED', finish_position = $1, final_score = $2 WHERE game_id = $3 AND user_id = $4`,
                  [isWinner ? 1 : 2, p.score, session.gameId, p.id]
                );
              }
            }

            // Record GAME_COMPLETED event
            await client.query(
              `INSERT INTO game_events (id, game_id, sequence_number, event_type, actor_user_id, payload, game_version, server_timestamp)
               VALUES ($1, $2, $3, 'GAME_COMPLETED', $4, $5, $6, NOW())
               ON CONFLICT (game_id, sequence_number) DO NOTHING`,
              [
                `ev_${session.gameId}_${session.sequenceNumber}`,
                session.gameId,
                session.sequenceNumber,
                winnerUserId,
                JSON.stringify({ winnerColor: session.winner, winnerUserId, completedAt: session.completedAt }),
                session.version,
              ]
            );
          });
        } catch (err) {
          Logger.warn(`PostgreSQL finalizeGame skipped in fallback mode: ${String(err)}`);
        }
      }

      // 3. Enqueue background jobs if BullMQ/Redis configured
      if (config.REDIS_URL || config.REDIS_HOST) {
        try {
          await QueueRegistry.getGameProcessingQueue().add(`process_game_${session.gameId}`, {
            type: 'GAME_COMPLETED',
            gameId: session.gameId,
            winnerUserId,
            finalState: session as unknown as Record<string, unknown>,
            timestamp: Date.now(),
          });

          await QueueRegistry.getLeaderboardQueue().add(`leaderboard_calc_${session.gameId}`, {
            type: 'RECALCULATE_RANKS',
            leaderboardType: 'GLOBAL',
            userId: winnerUserId,
          });
        } catch (err) {
          Logger.warn(`BullMQ queue dispatch skipped: ${String(err)}`);
        }
      }

      Logger.info(`Successfully finalized game session ${session.gameId}`);
    });
  }

  /**
   * Reconstitute game state from PostgreSQL if Redis fails
   */
  private static async recoverGameStateFromDb(gameId: string): Promise<AuthoritativeGameSession | null> {
    try {
      const db = getDb();
      const snapshots = await db
        .select()
        .from(gameStateSnapshots)
        .where(eq(gameStateSnapshots.gameId, gameId))
        .orderBy(desc(gameStateSnapshots.version))
        .limit(1);

      if (snapshots.length > 0) {
        const session = snapshots[0].state as unknown as AuthoritativeGameSession;
        Logger.info(`Reconstituted game ${gameId} from PostgreSQL snapshot v${session.version}`);
        await this.saveActiveGameState(session);
        return session;
      }
    } catch (err) {
      Logger.warn(`PostgreSQL recovery check skipped: ${String(err)}`);
    }
    return null;
  }
}
