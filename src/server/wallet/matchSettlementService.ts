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

export class MatchSettlementService {
  /**
   * Settles an authoritative match outcome idempotently with complete double-entry ledger audit
   */
  public static async settleMatch(
    matchId: string,
    winnerUserId: string,
    playerResults: SettlementPlayerResult[]
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

              // 2. Fetch match record
              const matchRes = await client.query(
                `SELECT * FROM matches WHERE id = $1 FOR UPDATE`,
                [matchId]
              );

              if (matchRes.rows.length === 0) {
                throw new Error(`Match ${matchId} not found for settlement`);
              }

              const matchRow = matchRes.rows[0];
              const entryFee = matchRow.entry_fee || '1.00000000';
              const playerCount = matchRow.player_count || playerResults.length || 2;

              // 3. Fetch match players
              const playersRes = await client.query(
                `SELECT * FROM match_players WHERE match_id = $1 FOR UPDATE`,
                [matchId]
              );

              const actualPlayerCount = playersRes.rows.length || playerCount;
              const grossPool = LedgerMath.multiply(entryFee, actualPlayerCount);
              const platformFeeRate = 0.10; // 10%
              const platformFee = LedgerMath.multiply(grossPool, platformFeeRate);
              const netPrizePool = LedgerMath.subtract(grossPool, platformFee);

              // 4. Update player records with rankings & scores
              for (const result of playerResults) {
                const isWinner = result.userId === winnerUserId;
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

              // 5. Release and settle locked entry fees for all players through the ledger
              for (const player of playersRes.rows) {
                const playerUserId = player.user_id;
                // Finalize withdrawal of locked fee
                const deductIdemp = `settle_entry_deduct_${matchId}_${playerUserId}`;
                await LedgerService.settleWithdrawal(playerUserId, entryFee, '0.00000000', deductIdemp);
              }

              // 6. Credit winner with net prize pool
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

              // 7. Record platform fee collection in platform revenue account
              const platformAccId = await LedgerService.getOrCreateAccount('PLATFORM_TREASURY', 'PLATFORM_REVENUE' as any);
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
                    payoutTxId: payoutResult.transactionId,
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
                for (const player of playersRes.rows) {
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
                      matchRow.game_mode,
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
                payoutTxId: payoutResult.transactionId,
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
        const grossPool = '2.00000000';
        const platformFee = '0.20000000';
        const netPrizePool = '1.80000000';
        const payout = await LedgerService.creditDeposit(
          winnerUserId,
          netPrizePool,
          `payout_${matchId}_${winnerUserId}`,
          { matchId, grossPool, platformFee }
        );

        return {
          settlementId: `mem_stl_${uuidv4()}`,
          matchId,
          winnerUserId,
          grossPool,
          platformFee,
          prizePool: netPrizePool,
          payoutTxId: payout.transactionId,
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
