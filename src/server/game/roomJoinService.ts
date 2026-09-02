import { v4 as uuidv4 } from 'uuid';
import { getDbPool, isPostgresConfigured } from '../db/client';
import { DistributedLock } from '../redis/locks';
import { LedgerService } from '../wallet/ledgerService';
import { LedgerMath } from '../wallet/ledgerMath';
import { GameMode, PlayerCount, findMatchPool } from './matchConfig';
import { RoomManager } from './roomManager';
import { Logger } from '../config/env';

export interface JoinMatchRequest {
  userId: string;
  username: string;
  gameMode: GameMode;
  playerCount: PlayerCount;
  entryFee: number | string;
  roomId?: string; // Optional: specify exact room, or let system match into highest filled joinable room
}

export interface JoinMatchResponse {
  success: boolean;
  matchId: string;
  matchCode: string;
  gameMode: GameMode;
  playerCount: number;
  entryFee: string;
  color: string;
  seatIndex: number;
  status: 'OPEN' | 'FILLING' | 'FULL' | 'STARTING';
  joinedPlayers: number;
  maxPlayers: number;
  grossPrizePool: string;
  netPrizePool: string;
  reservationTxId: string;
  startedAt?: string;
  endsAt?: string;
}

const PLAYER_COLORS_4P = ['red', 'green', 'yellow', 'blue'];
const PLAYER_COLORS_2P = ['red', 'blue'];
const PLAYER_COLORS_3P = ['red', 'green', 'yellow'];

export class RoomJoinService {
  /**
   * Atomically joins or provisions a match room with double-entry wallet reservation
   */
  public static async joinMatch(req: JoinMatchRequest): Promise<JoinMatchResponse> {
    const feeNumber = typeof req.entryFee === 'string' ? parseFloat(req.entryFee) : req.entryFee;
    const feeStr = feeNumber.toFixed(8);

    // 1. Verify pool exists
    const poolDef = findMatchPool(req.gameMode, req.playerCount, feeNumber);
    if (!poolDef) {
      throw new Error(`Invalid match configuration: Mode ${req.gameMode}, ${req.playerCount} players, fee ${req.entryFee}`);
    }

    // 2. Find target room or provision one
    let targetRoomId = req.roomId;
    if (!targetRoomId) {
      // Find highest filled joinable room in this pool
      const joinableRooms = await RoomManager.getJoinableRooms({
        gameMode: req.gameMode,
        playerCount: req.playerCount,
        entryFee: feeNumber,
      });

      if (joinableRooms.length > 0) {
        targetRoomId = joinableRooms[0].roomId;
      } else {
        // Automatically provision a new room
        const newRoomId = await RoomManager.ensurePoolHasJoinableRoom(poolDef);
        if (!newRoomId) {
          throw new Error('Failed to provision match room');
        }
        targetRoomId = newRoomId;
      }
    }

    const roomLockKey = `lock:room:join:${targetRoomId}`;
    const userLockKey = `lock:user:join:${req.userId}`;

    // 3. Execute atomic join under distributed room + user lock
    return await DistributedLock.withLock(userLockKey, async () => {
      return await DistributedLock.withLock(roomLockKey, async () => {
        Logger.info(`Atomic Join: User ${req.userId} joining match ${targetRoomId}`);

        if (isPostgresConfigured()) {
          const pool = getDbPool();
          if (pool) {
            const client = await pool.connect();
            let reservationTxId: string | null = null;

            try {
              await client.query('BEGIN');

              // A. Verify room status & capacity
              const roomRes = await client.query(
                `SELECT * FROM matches WHERE id = $1 FOR UPDATE`,
                [targetRoomId]
              );

              if (roomRes.rows.length === 0) {
                throw new Error(`Match room ${targetRoomId} not found`);
              }

              const matchRow = roomRes.rows[0];
              if (matchRow.status !== 'OPEN' && matchRow.status !== 'FILLING') {
                throw new Error(`Match room is no longer open for joining (Status: ${matchRow.status})`);
              }

              const joinedCount = parseInt(matchRow.joined_players, 10);
              const maxCount = parseInt(matchRow.max_players, 10);

              if (joinedCount >= maxCount) {
                throw new Error('Match room is already full');
              }

              // B. Check if user is already joined in this room
              const existingPlayer = await client.query(
                `SELECT * FROM match_players WHERE match_id = $1 AND user_id = $2`,
                [targetRoomId, req.userId]
              );

              if (existingPlayer.rows.length > 0) {
                const ep = existingPlayer.rows[0];
                await client.query('COMMIT');
                return {
                  success: true,
                  matchId: targetRoomId!,
                  matchCode: matchRow.match_code,
                  gameMode: matchRow.game_mode,
                  playerCount: maxCount,
                  entryFee: matchRow.entry_fee,
                  color: ep.color,
                  seatIndex: ep.seat_index,
                  status: matchRow.status,
                  joinedPlayers: joinedCount,
                  maxPlayers: maxCount,
                  grossPrizePool: matchRow.gross_prize_pool,
                  netPrizePool: matchRow.net_prize_pool,
                  reservationTxId: ep.reservation_tx_id || 'existing',
                  startedAt: matchRow.started_at?.toISOString(),
                  endsAt: matchRow.ends_at?.toISOString(),
                };
              }

              // C. Check user wallet balance & lock entry fee (for paid matches)
              if (feeNumber > 0) {
                const userWallet = await LedgerService.getUserWallet(req.userId);
                if (LedgerMath.isLessThan(userWallet.availableBalance, feeStr)) {
                  throw new Error(
                    `Insufficient USDT balance. Required: ${feeStr} USDT, Available: ${userWallet.availableBalance} USDT`
                  );
                }

                // D. Execute Double-Entry Entry Fee Lock
                const reserveIdemp = `reserve_${targetRoomId}_${req.userId}`;
                const lockResult = await LedgerService.lockFundsForWithdrawal(req.userId, feeStr, reserveIdemp);
                reservationTxId = lockResult.transactionId;
              } else {
                reservationTxId = `free_res_${uuidv4().slice(0, 8)}`;
              }

              // E. Assign Color and Seat Index
              const existingPlayersRes = await client.query(
                `SELECT color, seat_index FROM match_players WHERE match_id = $1`,
                [targetRoomId]
              );

              const usedColors = new Set(existingPlayersRes.rows.map((r) => r.color));
              const usedSeats = new Set(existingPlayersRes.rows.map((r) => r.seat_index));

              const colorPalette =
                maxCount === 2 ? PLAYER_COLORS_2P : maxCount === 3 ? PLAYER_COLORS_3P : PLAYER_COLORS_4P;

              const assignedColor = colorPalette.find((c) => !usedColors.has(c)) || 'red';
              let assignedSeat = 0;
              for (let s = 0; s < maxCount; s++) {
                if (!usedSeats.has(s)) {
                  assignedSeat = s;
                  break;
                }
              }

              // F. Insert match_players record
              await client.query(
                `INSERT INTO users (id, username, display_name) VALUES ($1, $2, $2) ON CONFLICT (id) DO NOTHING`,
                [req.userId, req.username || `User_${req.userId.slice(0, 6)}`]
              );

              const matchPlayerId = `mp_${targetRoomId}_${req.userId}`;
              await client.query(
                `INSERT INTO match_players (
                   id, match_id, user_id, color, seat_index, entry_fee, reservation_tx_id, status
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'JOINED')`,
                [
                  matchPlayerId,
                  targetRoomId,
                  req.userId,
                  assignedColor,
                  assignedSeat,
                  feeStr,
                  reservationTxId,
                ]
              );

              // G. Increment room occupancy & transition state machine
              const newJoinedCount = joinedCount + 1;
              let newStatus: 'OPEN' | 'FILLING' | 'FULL' | 'STARTING' = 'FILLING';
              let startedAt: Date | null = null;
              let endsAt: Date | null = null;

              if (newJoinedCount === maxCount) {
                newStatus = 'STARTING';
                startedAt = new Date();
                if (matchRow.game_mode === GameMode.LUDO_SUPREME) {
                  // Exactly 5 minutes (300 seconds) from start
                  endsAt = new Date(startedAt.getTime() + 300 * 1000);
                }
              }

              await client.query(
                `UPDATE matches
                 SET joined_players = $1,
                     status = $2,
                     started_at = COALESCE(started_at, $3),
                     ends_at = COALESCE(ends_at, $4),
                     updated_at = NOW()
                 WHERE id = $5`,
                [newJoinedCount, newStatus, startedAt, endsAt, targetRoomId]
              );

              await client.query('COMMIT');
              Logger.info(`User ${req.userId} successfully joined match ${targetRoomId}. New status: ${newStatus}`);

              // If match is now starting, immediately trigger demand-aware replenishment of an open room
              if (newStatus === 'STARTING') {
                RoomManager.ensurePoolHasJoinableRoom(poolDef).catch((err) => {
                  Logger.warn('Auto replenishment trigger notice', err);
                });
              }

              // Anti-Fraud Referral Trigger: Check if user has a pending referral condition 2
              try {
                const { ReferralService } = await import('../services/referralService');
                ReferralService.recordMatchPlayedEvent(req.userId, targetRoomId).catch(() => {});
              } catch {
                // ignore
              }

              return {
                success: true,
                matchId: targetRoomId!,
                matchCode: matchRow.match_code,
                gameMode: matchRow.game_mode,
                playerCount: maxCount,
                entryFee: matchRow.entry_fee,
                color: assignedColor,
                seatIndex: assignedSeat,
                status: newStatus,
                joinedPlayers: newJoinedCount,
                maxPlayers: maxCount,
                grossPrizePool: matchRow.gross_prize_pool,
                netPrizePool: matchRow.net_prize_pool,
                reservationTxId,
                startedAt: startedAt?.toISOString(),
                endsAt: endsAt?.toISOString(),
              };
            } catch (err) {
              await client.query('ROLLBACK');
              // Safety refund if reservation occurred before crash
              if (reservationTxId && feeNumber > 0) {
                await LedgerService.refundWithdrawal(
                  req.userId,
                  feeStr,
                  `rollback_${targetRoomId}_${req.userId}`,
                  'Atomic join failure rollback'
                ).catch(() => {});
              }
              if (err?.message?.includes('Insufficient USDT balance')) {
                Logger.warn(`Atomic join balance check for user ${req.userId} in match ${targetRoomId}: ${err.message}`);
              } else {
                Logger.error(`Atomic join error for user ${req.userId} in match ${targetRoomId}`, err);
              }
              throw err;
            } finally {
              client.release();
            }
          }
        }

        // Memory fallback
        return {
          success: true,
          matchId: targetRoomId!,
          matchCode: `LUDO-${Math.floor(100000 + Math.random() * 900000)}`,
          gameMode: req.gameMode,
          playerCount: req.playerCount,
          entryFee: feeStr,
          color: 'red',
          seatIndex: 0,
          status: 'FILLING',
          joinedPlayers: 1,
          maxPlayers: req.playerCount,
          grossPrizePool: (req.playerCount * feeNumber).toFixed(8),
          netPrizePool: (req.playerCount * feeNumber * 0.9).toFixed(8),
          reservationTxId: `mem_res_${uuidv4()}`,
        };
      }, 5000);
    }, 5000);
  }

  /**
   * Leave a match before it starts and release the wallet reservation
   */
  public static async leaveMatch(matchId: string, userId: string): Promise<boolean> {
    const roomLockKey = `lock:room:join:${matchId}`;

    return await DistributedLock.withLock(roomLockKey, async () => {
      if (isPostgresConfigured()) {
        const pool = getDbPool();
        if (pool) {
          const client = await pool.connect();
          try {
            await client.query('BEGIN');

            const matchRes = await client.query(`SELECT * FROM matches WHERE id = $1 FOR UPDATE`, [matchId]);
            if (matchRes.rows.length === 0) return false;

            const matchRow = matchRes.rows[0];
            if (matchRow.status !== 'OPEN' && matchRow.status !== 'FILLING') {
              throw new Error('Cannot leave match that has already started');
            }

            const playerRes = await client.query(
              `SELECT * FROM match_players WHERE match_id = $1 AND user_id = $2`,
              [matchId, userId]
            );

            if (playerRes.rows.length === 0) return false;
            const playerRow = playerRes.rows[0];

            // 1. Delete player record
            await client.query(`DELETE FROM match_players WHERE match_id = $1 AND user_id = $2`, [matchId, userId]);

            // 2. Decrement room count
            const newCount = Math.max(0, parseInt(matchRow.joined_players, 10) - 1);
            const newStatus = newCount === 0 ? 'OPEN' : 'FILLING';

            await client.query(
              `UPDATE matches SET joined_players = $1, status = $2, updated_at = NOW() WHERE id = $3`,
              [newCount, newStatus, matchId]
            );

            // 3. Refund wallet reservation
            if (parseFloat(playerRow.entry_fee || '0') > 0) {
              const refundIdemp = `leave_refund_${matchId}_${userId}`;
              await LedgerService.refundWithdrawal(
                userId,
                playerRow.entry_fee,
                refundIdemp,
                `Player left lobby match ${matchId}`
              );
            }

            await client.query('COMMIT');
            Logger.info(`User ${userId} left match ${matchId} and entry fee ${playerRow.entry_fee} was refunded.`);
            return true;
          } catch (err) {
            await client.query('ROLLBACK');
            Logger.error(`Leave match error for user ${userId} in match ${matchId}`, err);
            throw err;
          } finally {
            client.release();
          }
        }
      }
      return true;
    });
  }
}
