import { v4 as uuidv4 } from 'uuid';
import { LedgerService } from './ledgerService';
import { LedgerMath } from './ledgerMath';
import { Logger } from '../config/env';

export class GameSettlementService {
  /**
   * Locks entry fee for a participant entering a USDT tournament/match
   */
  public static async lockGameEntryFee(
    userId: string,
    gameId: string,
    entryFeeUsdt: string
  ): Promise<{ transactionId: string }> {
    const idempotencyKey = `game_entry_${gameId}_${userId}`;
    Logger.info(`Settlement: Locking entry fee of ${entryFeeUsdt} USDT for user ${userId} in game ${gameId}`);

    return await LedgerService.lockFundsForWithdrawal(userId, entryFeeUsdt, idempotencyKey);
  }

  /**
   * Settles prize pool to the authoritative winner and collects platform fee
   */
  public static async settleGamePrizePool(params: {
    gameId: string;
    winnerUserId: string;
    totalPrizePoolUsdt: string;
    platformRakePercent: number; // e.g. 0.10 for 10%
  }): Promise<{ transactionId: string; winnerPrize: string; platformFee: string }> {
    const rakeFactor = params.platformRakePercent || 0.10;
    const platformFee = LedgerMath.multiply(params.totalPrizePoolUsdt, rakeFactor);
    const winnerPrize = LedgerMath.subtract(params.totalPrizePoolUsdt, platformFee);

    const idempotencyKey = `game_payout_${params.gameId}_${params.winnerUserId}`;

    // Credit winner available balance
    const creditResult = await LedgerService.creditDeposit(
      params.winnerUserId,
      winnerPrize,
      idempotencyKey,
      {
        gameId: params.gameId,
        type: 'GAME_WIN_PAYOUT',
        totalPool: params.totalPrizePoolUsdt,
        platformFee,
      }
    );

    Logger.info(`Settlement: Game ${params.gameId} settled. Winner ${params.winnerUserId} credited ${winnerPrize} USDT (Fee: ${platformFee})`);

    return {
      transactionId: creditResult.transactionId,
      winnerPrize,
      platformFee,
    };
  }

  /**
   * Refunds match entry fees if game is cancelled
   */
  public static async refundGameEntry(
    userId: string,
    gameId: string,
    entryFeeUsdt: string,
    reason: string
  ): Promise<{ transactionId: string }> {
    const idempotencyKey = `game_refund_${gameId}_${userId}`;
    return await LedgerService.refundWithdrawal(userId, entryFeeUsdt, idempotencyKey, reason);
  }
}
