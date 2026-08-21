import { getDbPool, isPostgresConfigured } from '../db/client';
import { GamePersistenceService } from './persistenceService';
import { LudoSupremeEngine, AuthoritativeSupremeSession } from './ludoSupremeEngine';
import { AuthoritativeLudoEngine, AuthoritativeGameSession } from './authoritativeEngine';
import { MatchSettlementService } from '../wallet/matchSettlementService';
import { GameMode } from './matchConfig';
import { Logger } from '../config/env';

export interface AuthoritativeReconnectState {
  matchId: string;
  gameMode: string;
  status: string;
  serverTime: number;
  remainingSeconds: number; // For Ludo Supreme 5-min timer
  currentTurn: string;
  turnNumber: number;
  dice: {
    value: number;
    hasRolled: boolean;
    canRoll: boolean;
    movablePawnIds: string[];
  };
  players: any;
  scoreLedger?: any[];
  winnerUserId?: string;
  sequenceNumber: number;
}

export class ReconnectService {
  private static supremeSessions: Map<string, AuthoritativeSupremeSession> = new Map();

  public static setSupremeSession(matchId: string, session: AuthoritativeSupremeSession): void {
    this.supremeSessions.set(matchId, session);
  }

  public static getSupremeSession(matchId: string): AuthoritativeSupremeSession | undefined {
    return this.supremeSessions.get(matchId);
  }

  /**
   * Recovers full authoritative match state for a reconnecting player
   */
  public static async getMatchAuthoritativeState(
    matchId: string,
    userId: string
  ): Promise<AuthoritativeReconnectState | null> {
    // 1. Check Ludo Supreme in-memory session first
    const supremeSession = this.supremeSessions.get(matchId);
    if (supremeSession) {
      const now = Date.now();
      const isExpired = LudoSupremeEngine.checkTimerExpiry(supremeSession);
      const remainingSeconds = Math.max(0, Math.floor((supremeSession.endsAt - now) / 1000));

      const activePlayer = supremeSession.players[supremeSession.currentTurn];
      const movablePawnIds = activePlayer && supremeSession.dice.hasRolled
        ? LudoSupremeEngine.getMovablePawns(activePlayer, supremeSession.dice.value)
        : [];

      // Update player last seen
      const reconnectingPlayer = Object.values(supremeSession.players).find((p) => p.id === userId);
      if (reconnectingPlayer) {
        reconnectingPlayer.lastScoreTimestamp = now;
      }

      return {
        matchId,
        gameMode: 'LUDO_SUPREME',
        status: supremeSession.status,
        serverTime: now,
        remainingSeconds,
        currentTurn: supremeSession.currentTurn,
        turnNumber: supremeSession.turnNumber,
        dice: {
          value: supremeSession.dice.value,
          hasRolled: supremeSession.dice.hasRolled,
          canRoll: supremeSession.dice.canRoll,
          movablePawnIds,
        },
        players: supremeSession.players,
        scoreLedger: supremeSession.scoreLedger.slice(-20), // Last 20 audit events
        winnerUserId: supremeSession.winnerUserId,
        sequenceNumber: supremeSession.sequenceNumber,
      };
    }

    // 2. Check Online Arena persistent state
    const arenaSession = await GamePersistenceService.getGameState(matchId);
    if (arenaSession) {
      const activePlayer = arenaSession.players[arenaSession.currentTurn];
      const movablePawnIds = activePlayer && arenaSession.dice.hasRolled
        ? AuthoritativeLudoEngine.getMovablePawns(activePlayer, arenaSession.dice.value)
        : [];

      return {
        matchId,
        gameMode: 'ONLINE_ARENA',
        status: arenaSession.status,
        serverTime: Date.now(),
        remainingSeconds: 0, // Arena has no countdown timer
        currentTurn: arenaSession.currentTurn,
        turnNumber: arenaSession.turnNumber,
        dice: {
          value: arenaSession.dice.value,
          hasRolled: arenaSession.dice.hasRolled,
          canRoll: arenaSession.dice.canRoll,
          movablePawnIds,
        },
        players: arenaSession.players,
        winnerUserId: arenaSession.winner ? arenaSession.players[arenaSession.winner]?.id : undefined,
        sequenceNumber: arenaSession.sequenceNumber,
      };
    }

    // 3. Fallback to PostgreSQL database query
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          const matchRes = await client.query(`SELECT * FROM matches WHERE id = $1`, [matchId]);
          if (matchRes.rows.length === 0) return null;

          const matchRow = matchRes.rows[0];
          const playersRes = await client.query(`SELECT * FROM match_players WHERE match_id = $1`, [matchId]);

          const playersMap: any = {};
          for (const p of playersRes.rows) {
            playersMap[p.color] = {
              id: p.user_id,
              name: `Player ${p.color.toUpperCase()}`,
              color: p.color,
              score: p.final_score || 0,
              isActive: true,
              pawns: [],
            };
          }

          const remainingSeconds = matchRow.ends_at
            ? Math.max(0, Math.floor((new Date(matchRow.ends_at).getTime() - Date.now()) / 1000))
            : 0;

          return {
            matchId,
            gameMode: matchRow.game_mode,
            status: matchRow.status,
            serverTime: Date.now(),
            remainingSeconds,
            currentTurn: matchRow.current_turn_color || 'red',
            turnNumber: matchRow.turn_number || 1,
            dice: {
              value: 6,
              hasRolled: false,
              canRoll: true,
              movablePawnIds: [],
            },
            players: playersMap,
            winnerUserId: matchRow.winner_user_id,
            sequenceNumber: 1,
          };
        } finally {
          client.release();
        }
      }
    }

    return null;
  }

  /**
   * System Startup Recovery: Restores running matches and handles expired games
   */
  public static async runStartupRecovery(): Promise<void> {
    if (!isPostgresConfigured()) return;
    const pool = getDbPool();
    if (!pool) return;

    const client = await pool.connect();
    try {
      Logger.info('Running Match Server Startup Recovery...');
      const runningMatches = await client.query(
        `SELECT * FROM matches WHERE status IN ('STARTING', 'RUNNING')`
      );

      for (const row of runningMatches.rows) {
        if (row.game_mode === GameMode.LUDO_SUPREME && row.ends_at) {
          const endsAtMs = new Date(row.ends_at).getTime();
          if (Date.now() >= endsAtMs) {
            Logger.info(`Recovery: Match ${row.id} expired during downtime. Processing settlement...`);
            // Settle expired match
            const playersRes = await client.query(
              `SELECT * FROM match_players WHERE match_id = $1 ORDER BY final_score DESC`,
              [row.id]
            );

            if (playersRes.rows.length > 0) {
              const winner = playersRes.rows[0].user_id;
              await MatchSettlementService.settleMatch(
                row.id,
                winner,
                playersRes.rows.map((p, idx) => ({
                  userId: p.user_id,
                  rank: idx + 1,
                  finalScore: p.final_score || 0,
                  tokensHome: p.tokens_home || 0,
                  capturesMade: p.captures_made || 0,
                  totalDistanceMoved: p.total_distance_moved || 0,
                }))
              ).catch((err) => {
                Logger.error(`Recovery settlement failed for ${row.id}`, err);
              });
            }
          }
        }
      }
      Logger.info(`Startup Recovery checked ${runningMatches.rows.length} active match records.`);
    } catch (err) {
      Logger.error('Startup recovery error', err);
    } finally {
      client.release();
    }
  }
}
