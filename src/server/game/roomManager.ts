import { v4 as uuidv4 } from 'uuid';
import { getDbPool, isPostgresConfigured } from '../db/client';
import { getRedisClient } from '../redis/client';
import { ALL_MATCH_POOLS, GameMode, MatchPoolDefinition, findMatchPool } from './matchConfig';
import { MatchSettlementService } from '../wallet/matchSettlementService';
import { DistributedLock } from '../redis/locks';
import { Logger } from '../config/env';

export interface PublicLobbyRoom {
  roomId: string;
  matchCode: string;
  poolId: string;
  gameMode: GameMode;
  playerCount: number;
  entryFee: string;
  entryFeeUsdt: number;
  grossPrizePool: string;
  platformFee: string;
  netPrizePool: string;
  status: 'OPEN' | 'FILLING';
  joinedPlayers: number;
  maxPlayers: number;
  remainingSlots: number;
  fillPercentage: number;
  createdAt: string;
}

export class RoomManager {
  private static isInitialized = false;
  private static maintenanceInterval: NodeJS.Timeout | null = null;

  // In-memory fallback rooms store when PostgreSQL is offline
  private static memoryRooms: Map<string, any> = new Map();

  /**
   * Initializes match pools and demand-aware room replenishment loop
   */
  public static async initialize(): Promise<void> {
    Logger.info('Initializing Demand-Aware Automated Room Manager...');

    // 1. Seed pools into database
    await this.ensureMatchPoolsSeeded();

    // 2. Ensure initial baseline of joinable rooms
    await this.replenishJoinableRooms();

    // 3. Start background maintenance loop (every 10 seconds)
    if (!this.maintenanceInterval) {
      this.maintenanceInterval = setInterval(() => {
        this.runMaintenanceCycle().catch((err) => {
          Logger.warn(`Room maintenance cycle error: ${String(err)}`);
        });
      }, 10000);
    }

    this.isInitialized = true;
    Logger.info('Demand-Aware Room Manager initialized successfully.');
  }

  /**
   * Seed all deterministic match pools in PostgreSQL
   */
  public static async ensureMatchPoolsSeeded(): Promise<void> {
    if (!isPostgresConfigured()) return;
    const pool = getDbPool();
    if (!pool) return;

    const client = await pool.connect();
    try {
      for (const p of ALL_MATCH_POOLS) {
        await client.query(
          `INSERT INTO match_pools (
             id, pool_key, game_mode, player_count, entry_fee, rule_version,
             platform_fee_rate, is_active, min_buffer_rooms
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (pool_key) DO UPDATE SET
             platform_fee_rate = EXCLUDED.platform_fee_rate,
             is_active = EXCLUDED.is_active,
             updated_at = NOW()`,
          [
            p.poolId,
            p.poolKey,
            p.gameMode,
            p.playerCount,
            p.entryFee,
            p.ruleVersion,
            p.platformFeeRate,
            p.isActive,
            p.minBufferRooms,
          ]
        );
      }
      Logger.info(`Seeded ${ALL_MATCH_POOLS.length} deterministic match pools into PostgreSQL.`);
    } catch (err) {
      Logger.error('Failed to seed match pools', err);
    } finally {
      client.release();
    }
  }

  /**
   * Automatically creates joinable rooms for active pools if demand requires it
   */
  public static async replenishJoinableRooms(): Promise<void> {
    for (const poolDef of ALL_MATCH_POOLS) {
      if (!poolDef.isActive) continue;

      try {
        await this.ensurePoolHasJoinableRoom(poolDef);
      } catch (err) {
        Logger.warn(`Failed to replenish room for pool ${poolDef.poolKey}`, err);
      }
    }
  }

  /**
   * Checks if an active pool has at least 1 joinable room; if not, provisions a new one atomically
   */
  public static async ensurePoolHasJoinableRoom(poolDef: MatchPoolDefinition): Promise<string | null> {
    const lockKey = `lock:pool:replenish:${poolDef.poolId}`;

    return await DistributedLock.withLock(
      lockKey,
      async () => {
        if (isPostgresConfigured()) {
          const pool = getDbPool();
          if (pool) {
            const client = await pool.connect();
            try {
              // Count joinable rooms for this pool
              const res = await client.query(
                `SELECT id, status, joined_players, max_players
                 FROM matches
                 WHERE pool_id = $1 AND status IN ('OPEN', 'FILLING') AND joined_players < max_players
                 ORDER BY joined_players DESC, created_at ASC
                 LIMIT 1`,
                [poolDef.poolId]
              );

              if (res.rows.length > 0) {
                return res.rows[0].id;
              }

              // No joinable room exists, create a new OPEN room
              const matchId = `match_${poolDef.gameMode.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              const matchCode = `LUDO-${Math.floor(100000 + Math.random() * 900000)}`;
              const grossPool = (poolDef.playerCount * poolDef.entryFeeUsdt).toFixed(8);
              const platformFee = (poolDef.playerCount * poolDef.entryFeeUsdt * poolDef.platformFeeRate).toFixed(8);
              const netPrizePool = (parseFloat(grossPool) - parseFloat(platformFee)).toFixed(8);

              await client.query(
                `INSERT INTO matches (
                   id, match_code, pool_id, game_mode, player_count, entry_fee,
                   gross_prize_pool, platform_fee, net_prize_pool, status,
                   joined_players, max_players, server_seed
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'OPEN', 0, $10, $11)`,
                [
                  matchId,
                  matchCode,
                  poolDef.poolId,
                  poolDef.gameMode,
                  poolDef.playerCount,
                  poolDef.entryFee,
                  grossPool,
                  platformFee,
                  netPrizePool,
                  poolDef.playerCount,
                  uuidv4(),
                ]
              );

              Logger.info(`Provisioned new demand-aware match room ${matchId} (${matchCode}) for pool ${poolDef.poolKey}`);
              return matchId;
            } finally {
              client.release();
            }
          }
        }

        // Memory fallback
        const existing = Array.from(this.memoryRooms.values()).find(
          (r) => r.poolId === poolDef.poolId && (r.status === 'OPEN' || r.status === 'FILLING') && r.joinedPlayers < r.maxPlayers
        );
        if (existing) return existing.id;

        const newId = `mem_match_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        this.memoryRooms.set(newId, {
          id: newId,
          matchCode: `LUDO-${Math.floor(100000 + Math.random() * 900000)}`,
          poolId: poolDef.poolId,
          gameMode: poolDef.gameMode,
          playerCount: poolDef.playerCount,
          entryFee: poolDef.entryFee,
          status: 'OPEN',
          joinedPlayers: 0,
          maxPlayers: poolDef.playerCount,
          createdAt: new Date().toISOString(),
        });
        return newId;
      },
      4000
    );
  }

  /**
   * Query all joinable public rooms sorted by highest fill first
   */
  public static async getJoinableRooms(filters?: {
    gameMode?: GameMode;
    playerCount?: number;
    entryFee?: number;
  }): Promise<PublicLobbyRoom[]> {
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          let query = `
            SELECT m.*, p.pool_key, p.rule_version
            FROM matches m
            JOIN match_pools p ON m.pool_id = p.id
            WHERE m.status IN ('OPEN', 'FILLING') AND m.joined_players < m.max_players
          `;
          const params: any[] = [];

          if (filters?.gameMode) {
            params.push(filters.gameMode);
            query += ` AND m.game_mode = $${params.length}`;
          }
          if (filters?.playerCount) {
            params.push(filters.playerCount);
            query += ` AND m.player_count = $${params.length}`;
          }
          if (filters?.entryFee) {
            params.push(filters.entryFee.toFixed(8));
            query += ` AND m.entry_fee = $${params.length}`;
          }

          // Sort by nearest to start first (e.g. 3/4 before 1/4), then creation time
          query += ` ORDER BY m.joined_players DESC, m.created_at ASC LIMIT 50`;

          const res = await client.query(query, params);

          return res.rows.map((row) => {
            const joined = parseInt(row.joined_players, 10) || 0;
            const max = parseInt(row.max_players, 10) || 4;
            const feeNum = parseFloat(row.entry_fee || '1');

            return {
              roomId: row.id,
              matchCode: row.match_code,
              poolId: row.pool_id,
              gameMode: row.game_mode as GameMode,
              playerCount: max,
              entryFee: row.entry_fee,
              entryFeeUsdt: feeNum,
              grossPrizePool: row.gross_prize_pool || (max * feeNum).toFixed(8),
              platformFee: row.platform_fee || (max * feeNum * 0.1).toFixed(8),
              netPrizePool: row.net_prize_pool || (max * feeNum * 0.9).toFixed(8),
              status: row.status as 'OPEN' | 'FILLING',
              joinedPlayers: joined,
              maxPlayers: max,
              remainingSlots: Math.max(0, max - joined),
              fillPercentage: Math.round((joined / max) * 100),
              createdAt: new Date(row.created_at).toISOString(),
            };
          });
        } finally {
          client.release();
        }
      }
    }

    // Memory fallback
    return Array.from(this.memoryRooms.values())
      .filter((r) => {
        if (r.status !== 'OPEN' && r.status !== 'FILLING') return false;
        if (r.joinedPlayers >= r.maxPlayers) return false;
        if (filters?.gameMode && r.gameMode !== filters.gameMode) return false;
        if (filters?.playerCount && r.playerCount !== filters.playerCount) return false;
        if (filters?.entryFee && parseFloat(r.entryFee) !== filters.entryFee) return false;
        return true;
      })
      .map((r) => ({
        roomId: r.id,
        matchCode: r.matchCode,
        poolId: r.poolId,
        gameMode: r.gameMode,
        playerCount: r.playerCount,
        entryFee: r.entryFee,
        entryFeeUsdt: parseFloat(r.entryFee),
        grossPrizePool: (r.playerCount * parseFloat(r.entryFee)).toFixed(8),
        platformFee: (r.playerCount * parseFloat(r.entryFee) * 0.1).toFixed(8),
        netPrizePool: (r.playerCount * parseFloat(r.entryFee) * 0.9).toFixed(8),
        status: r.status,
        joinedPlayers: r.joinedPlayers,
        maxPlayers: r.maxPlayers,
        remainingSlots: r.maxPlayers - r.joinedPlayers,
        fillPercentage: Math.round((r.joinedPlayers / r.maxPlayers) * 100),
        createdAt: r.createdAt,
      }));
  }

  /**
   * Periodic background maintenance: Replenishes empty pools and cleans up stale abandoned rooms
   */
  private static async runMaintenanceCycle(): Promise<void> {
    await this.replenishJoinableRooms();
  }
}
