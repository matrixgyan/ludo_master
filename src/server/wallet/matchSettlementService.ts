import { v4 as uuidv4 } from 'uuid';
import { getDbPool, isPostgresConfigured } from '../db/client';
import { LedgerService } from './ledgerService';
import { LedgerMath } from './ledgerMath';
import { DistributedLock } from '../redis/locks';
import { Logger } from '../config/env';

export interface SettlementPlayerResult {
  userId: string;
  rank: number;
  finalScore: number;
  tokensHome: number;
  capturesMade: number;
  totalDistanceMoved: number;
}

export interface MatchSettlementResult {
  settlementId: string;
  matchId: string;
  winnerUserId: string;
  grossPool: string;
  platformFee: string;
  prizePool: string;
  payoutTxId: string;
  status: 'COMPLETED' | 'ALREADY_SETTLED';
}

export interface MatchSettlementOptions {
  entryFee?: number | string;
  prizePool?: number | string;
  gameMode?: string;
  playerCount?: number;
  winnerName?: string;
  winnerColor?: string;
  playerUsernames?: Record<string, string>;
}

export class MatchSettlementService {
  /**
   * Settles an authoritative match outcome idempotently with complete double-entry ledger audit
   */
  public static async settleMatch(
    matchId: string,
    winnerUserId: string,
    playerResults: SettlementPlayerResult[],
    options?: MatchSettlementOptions
  ): Promise<MatchSettlementResult> {
    const lockKey = `lock:match:settle:${matchId}`;

    return await DistributedLock.withLock(
      lockKey,
      async () => {
        const idempotencyKey = `settle_match_${matchId}_${winnerUserId}`;
        Logger.info(`Starting double-entry match settlement for match ${matchId}, winner ${winnerUserId}`);

        if (isPostgresConfigured()) {
          const pool = getDbPool();
          if (pool) {
            const client = await pool.connect();
            try {
              await client.query('BEGIN');

              // 1. Check if already settled
              const existingSettlement = await client.query(
                `SELECT * FROM match_settlements WHERE match_id = $1 OR idempotency_key = $2 FOR UPDATE`,
                [matchId, idempotencyKey]
              );

              if (existingSettlement.rows.length > 0) {
                await client.query('COMMIT');
                Logger.info(`Match ${matchId} was already settled idempotently.`);
                const row = existingSettlement.rows[0];
                return {
                  settlementId: row.id,
                  matchId,
                  winnerUserId: row.winner_user_id,
                  grossPool: row.gross_pool,
                  platformFee: row.platform_fee,
                  prizePool: row.prize_pool,
                  payoutTxId: row.settlement_details?.payoutTxId || 'already_settled',
                  status: 'ALREADY_SETTLED',
                };
              }

              // 2. Fetch match record (or insert dynamically if not yet registered)
              let matchRes = await client.query(
                `SELECT * FROM matches WHERE id = $1 FOR UPDATE`,
                [matchId]
              );

              const requestedEntryFee = options?.entryFee !== undefined ? parseFloat(String(options.entryFee)) : 0;
              const requestedGameMode = options?.gameMode || 'ONLINE_ARENA';
              const requestedPlayerCount = options?.playerCount || Math.max(playerResults.length, 2);

              if (matchRes.rows.length === 0) {
                // Ensure pool exists
                const poolId = `pool_${requestedGameMode.toLowerCase()}_${requestedPlayerCount}p_${requestedEntryFee}u_v1`;
                await client.query(
                  `INSERT INTO match_pools (
                     id, pool_key, game_mode, player_count, entry_fee, rule_version,
                     platform_fee_rate, is_active, min_buffer_rooms
                   ) VALUES ($1, $2, $3, $4, $5, 'v1', 0.1000, true, 1)
                   ON CONFLICT (id) DO NOTHING`,
                  [
                    poolId,
                    `${requestedGameMode}:${requestedPlayerCount}:${requestedEntryFee}:v1`,
                    requestedGameMode,
                    requestedPlayerCount,
                    requestedEntryFee.toFixed(8),
                  ]
                );

                // Insert match
                await client.query(
                  `INSERT INTO matches (
                     id, match_code, pool_id, game_mode, player_count, entry_fee,
                     status, joined_players, max_players, started_at, created_at, updated_at
                   ) VALUES ($1, $2, $3, $4, $5, $6, 'RUNNING', $7, $8, NOW(), NOW(), NOW())
                   ON CONFLICT (id) DO NOTHING`,
                  [
                    matchId,
                    matchId.slice(0, 10),
                    poolId,
                    requestedGameMode,
                    requestedPlayerCount,
                    requestedEntryFee.toFixed(8),
                    playerResults.length,
                    requestedPlayerCount,
                  ]
                );

                // Insert player records
                const colors = ['red', 'green', 'yellow', 'blue'];
                for (let i = 0; i < playerResults.length; i++) {
                  const pr = playerResults[i];
                  const color = colors[i % colors.length];
                  // Ensure user exists in users table if guest or bot
                  if (pr.userId.startsWith('user_') || pr.userId.startsWith('guest_') || pr.userId.startsWith('bot_') || pr.userId.startsWith('opponent_')) {
                    const uName = options?.playerUsernames?.[pr.userId] || (pr.userId.startsWith('user_') || pr.userId.startsWith('guest_') ? `User_${pr.userId.slice(-5)}` : pr.userId);
                    await client.query(
                      `INSERT INTO users (id, username, display_name)
                       VALUES ($1, $2, $2)
                       ON CONFLICT (id) DO NOTHING`,
                      [pr.userId, uName]
                    );
                  }

                  await client.query(
                    `INSERT INTO match_players (
                       id, match_id, user_id, color, seat_index, entry_fee, status
                     ) VALUES ($1, $2, $3, $4, $5, $6, 'JOINED')
                     ON CONFLICT DO NOTHING`,
                    [
                      `mp_${matchId}_${pr.userId}`,
                      matchId,
                      pr.userId,
                      color,
                      i,
                      requestedEntryFee.toFixed(8),
                    ]
                  );
                }

                matchRes = await client.query(
                  `SELECT * FROM matches WHERE id = $1 FOR UPDATE`,
                  [matchId]
                );
              }

              const matchRow = matchRes.rows[0];
              const entryFee = matchRow?.entry_fee || requestedEntryFee.toFixed(8);
              const playerCount = matchRow?.player_count || playerResults.length || 2;

              // 3. Fetch match players
              const playersRes = await client.query(
                `SELECT * FROM match_players WHERE match_id = $1 FOR UPDATE`,
                [matchId]
              );

              const actualPlayerCount = playersRes.rows.length || playerCount;
              let grossPool = LedgerMath.multiply(entryFee, actualPlayerCount);
              const platformFeeRate = 0.10; // 10%
              let platformFee = LedgerMath.multiply(grossPool, platformFeeRate);
              let netPrizePool = LedgerMath.subtract(grossPool, platformFee);

              if (options?.prizePool !== undefined && parseFloat(String(options.prizePool)) > 0) {
                netPrizePool = parseFloat(String(options.prizePool)).toFixed(8);
                grossPool = (parseFloat(netPrizePool) / 0.9).toFixed(8);
                platformFee = (parseFloat(grossPool) - parseFloat(netPrizePool)).toFixed(8);
              }

              // 4. Update player records with rankings & scores
              for (const result of playerResults) {
                const isWinner = result.userId === winnerUserId || result.rank === 1;
                const payout = isWinner ? netPrizePool : '0.00000000';

                await client.query(
                  `UPDATE match_players
                   SET final_rank = $1,
                       final_score = $2,
                       tokens_home = $3,
                       captures_made = $4,
                       total_distance_moved = $5,
                       prize_payout = $6,
                       status = 'FINISHED'
                   WHERE match_id = $7 AND user_id = $8`,
                  [
                    result.rank,
                    result.finalScore,
                    result.tokensHome,
                    result.capturesMade,
                    result.totalDistanceMoved,
                    payout,
                    matchId,
                    result.userId,
                  ]
                );
              }

              // 5. Release and settle locked entry fees for real human players through the ledger (paid matches only)
              if (parseFloat(entryFee) > 0) {
                const allPlayersList = playersRes.rows.length > 0 ? playersRes.rows : playerResults.map((pr) => ({ user_id: pr.userId }));
                for (const player of allPlayersList) {
                  const playerUserId = player.user_id;
                  const isRealHuman = !playerUserId.startsWith('bot_') && !playerUserId.startsWith('ai_') && !playerUserId.startsWith('opponent_bot');
                  if (isRealHuman) {
                    const deductIdemp = `settle_entry_deduct_${matchId}_${playerUserId}`;
                    try {
                      // Check if locked transaction exists
                      const lockCheck = await client.query(
                        `SELECT id FROM ledger_transactions WHERE idempotency_key = $1 LIMIT 1`,
                        [`lock_entry_${matchId}_${playerUserId}`]
                      );

                      if (lockCheck.rows.length > 0) {
                        // Finalize withdrawal of locked fee
                        await LedgerService.settleWithdrawal(playerUserId, entryFee, '0.00000000', deductIdemp);
                      } else {
                        // Check if user has sufficient available balance before locking
                        const userW = await LedgerService.getUserWallet(playerUserId);
                        if (parseFloat(userW.availableBalance || '0') >= parseFloat(entryFee)) {
                          await LedgerService.lockFundsForWithdrawal(playerUserId, entryFee, `lock_entry_${matchId}_${playerUserId}`);
                          await LedgerService.settleWithdrawal(playerUserId, entryFee, '0.00000000', deductIdemp);
                        }
                      }
                    } catch (deductErr) {
                      Logger.warn(`Notice during entry fee settlement for ${playerUserId}:`, deductErr);
                    }
                  }
                }
              }

              // 6. Credit winner with net prize pool (if winner is a real human player)
              let payoutTxId: string | null = null;
              const isWinnerHuman = !winnerUserId.startsWith('bot_') && !winnerUserId.startsWith('ai_') && !winnerUserId.startsWith('opponent_bot');
              if (parseFloat(netPrizePool) > 0 && isWinnerHuman) {
                const payoutResult = await LedgerService.creditDeposit(
                  winnerUserId,
                  netPrizePool,
                  `payout_${matchId}_${winnerUserId}`,
                  {
                    matchId,
                    type: 'MATCH_WIN_PAYOUT',
                    grossPool,
                    platformFee,
                    netPrizePool,
                  }
                );
                payoutTxId = payoutResult.transactionId;
              }

              // 7. Record platform fee collection in platform revenue account
              if (parseFloat(platformFee) > 0) {
                const feeTxId = `fee_tx_${uuidv4()}`;
                await client.query(
                  `INSERT INTO ledger_transactions (id, idempotency_key, tx_type, description, metadata)
                   VALUES ($1, $2, 'PLATFORM_FEE', $3, $4)
                   ON CONFLICT DO NOTHING`,
                  [
                    feeTxId,
                    `platform_fee_${matchId}`,
                    `Platform fee collected for match ${matchId}`,
                    JSON.stringify({ matchId, feeAmount: platformFee }),
                  ]
                );
              }

              // 8. Insert immutable match settlement record
              const settlementId = `stl_${uuidv4()}`;
              await client.query(
                `INSERT INTO match_settlements (
                   id, match_id, idempotency_key, gross_pool, platform_fee, prize_pool,
                   winner_user_id, status, settlement_details, processed_at
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'COMPLETED', $8, NOW())`,
                [
                  settlementId,
                  matchId,
                  idempotencyKey,
                  grossPool,
                  platformFee,
                  netPrizePool,
                  winnerUserId,
                  JSON.stringify({
                    payoutTxId,
                    playerResults,
                    platformFeeRate,
                  }),
                ]
              );

              // 9. Update match status to SETTLED
              await client.query(
                `UPDATE matches
                 SET status = 'SETTLED',
                     winner_user_id = $1,
                     gross_prize_pool = $2,
                     platform_fee = $3,
                     net_prize_pool = $4,
                     completed_at = COALESCE(completed_at, NOW()),
                     settled_at = NOW(),
                     updated_at = NOW()
                 WHERE id = $5`,
                [winnerUserId, grossPool, platformFee, netPrizePool, matchId]
              );

              await client.query('COMMIT');
              Logger.info(`Match ${matchId} settled successfully! Winner: ${winnerUserId}, Net Prize: ${netPrizePool} USDT`);

              // 10. Update match history records (outside financial transaction block)
              try {
                const allPlayersList = playersRes.rows.length > 0 ? playersRes.rows : playerResults.map((pr) => ({ user_id: pr.userId }));
                for (const player of allPlayersList) {
                  const isWinner = player.user_id === winnerUserId;
                  const playerRes = playerResults.find((r) => r.userId === player.user_id);
                  await client.query(
                    `INSERT INTO match_history (id, user_id, game_id, mode, result, score, tokens_home)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT DO NOTHING`,
                    [
                      `mh_${uuidv4()}`,
                      player.user_id,
                      matchId,
                      matchRow?.game_mode || requestedGameMode,
                      isWinner ? 'WON' : 'LOST',
                      playerRes?.finalScore || 0,
                      playerRes?.tokensHome || 0,
                    ]
                  );
                }
              } catch (histErr) {
                Logger.warn('Match history audit notice in settlement', { error: histErr });
              }

              return {
                settlementId,
                matchId,
                winnerUserId,
                grossPool,
                platformFee,
                prizePool: netPrizePool,
                payoutTxId: payoutTxId || 'none',
                status: 'COMPLETED',
              };
            } catch (err) {
              await client.query('ROLLBACK');
              Logger.error(`Match settlement failed for ${matchId}`, err);
              throw err;
            } finally {
              client.release();
            }
          }
        }

        // Memory fallback settlement
        const entryFeeNum = options?.entryFee !== undefined ? parseFloat(String(options.entryFee)) : 1;
        const prizePoolNum = options?.prizePool !== undefined ? parseFloat(String(options.prizePool)) : entryFeeNum * 1.8;
        const grossPool = (prizePoolNum / 0.9).toFixed(8);
        const platformFee = (parseFloat(grossPool) - prizePoolNum).toFixed(8);
        const netPrizePool = prizePoolNum.toFixed(8);

        const isWinnerHuman = !winnerUserId.startsWith('bot_') && !winnerUserId.startsWith('ai_') && !winnerUserId.startsWith('opponent_bot');
        let payoutTxId = 'mem_payout_none';

        if (isWinnerHuman && prizePoolNum > 0) {
          const payout = await LedgerService.creditDeposit(
            winnerUserId,
            netPrizePool,
            `payout_${matchId}_${winnerUserId}`,
            { matchId, grossPool, platformFee }
          );
          payoutTxId = payout.transactionId;
        }

        return {
          settlementId: `mem_stl_${uuidv4()}`,
          matchId,
          winnerUserId,
          grossPool,
          platformFee,
          prizePool: netPrizePool,
          payoutTxId,
          status: 'COMPLETED',
        };
      },
      8000
    );
  }

  /**
   * Refunds all participants if a match is cancelled or failed to fill
   */
  public static async refundMatch(matchId: string, reason: string): Promise<void> {
    const lockKey = `lock:match:refund:${matchId}`;

    await DistributedLock.withLock(lockKey, async () => {
      Logger.info(`Processing refunds for match ${matchId}. Reason: ${reason}`);

      if (isPostgresConfigured()) {
        const pool = getDbPool();
        if (pool) {
          const client = await pool.connect();
          try {
            await client.query('BEGIN');

            const matchRes = await client.query(`SELECT * FROM matches WHERE id = $1 FOR UPDATE`, [matchId]);
            if (matchRes.rows.length === 0) return;

            const matchRow = matchRes.rows[0];
            if (matchRow.status === 'SETTLED' || matchRow.status === 'CANCELLED') {
              await client.query('COMMIT');
              return;
            }

            const playersRes = await client.query(
              `SELECT * FROM match_players WHERE match_id = $1 FOR UPDATE`,
              [matchId]
            );

            for (const player of playersRes.rows) {
              const refundIdemp = `refund_${matchId}_${player.user_id}`;
              await LedgerService.refundWithdrawal(
                player.user_id,
                player.entry_fee,
                refundIdemp,
                `Match ${matchId} refund: ${reason}`
              );

              await client.query(
                `UPDATE match_players SET status = 'REFUNDED' WHERE match_id = $1 AND user_id = $2`,
                [matchId, player.user_id]
              );
            }

            await client.query(
              `UPDATE matches SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1`,
              [matchId]
            );

            await client.query('COMMIT');
            Logger.info(`Match ${matchId} refunded successfully.`);
          } catch (err) {
            await client.query('ROLLBACK');
            Logger.error(`Match refund failed for ${matchId}`, err);
            throw err;
          } finally {
            client.release();
          }
        }
      }
    });
  }
}
