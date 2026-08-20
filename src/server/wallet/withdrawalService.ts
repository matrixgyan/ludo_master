import { v4 as uuidv4 } from 'uuid';
import { getDbPool, isPostgresConfigured } from '../db/client';
import { NetworkRegistry } from './registry';
import { BlockchainService } from './blockchainService';
import { LedgerService } from './ledgerService';
import { TreasuryService } from './treasuryService';
import { CrossChainRebalancingService } from './crossChainRebalancingService';
import { LedgerMath } from './ledgerMath';
import { WithdrawalRecord, WithdrawalStatus } from './types';
import { Logger } from '../config/env';

export class WithdrawalService {
  private static memoryWithdrawals: Map<string, WithdrawalRecord> = new Map();

  /**
   * Calculates fee and net receive amount for a withdrawal quote with full admin and gas fee breakdown
   */
  public static calculateQuote(networkKey: string, amountUsdt: string): {
    networkKey: string;
    amount: string;
    networkGasFee: string;
    adminServiceFee: string;
    feeAmount: string;
    netAmount: string;
    minWithdrawal: string;
    isExecutable: boolean;
  } {
    const config = NetworkRegistry.getNetwork(networkKey);
    const minWithdrawal = config.minWithdrawalUsdt;
    const networkGasFee = config.withdrawalFeeUsdt;

    // Dynamic Admin Service Fee calculation
    const adminConfig = NetworkRegistry.getAdminServiceFeeConfig();
    const rawAdminFee = (parseFloat(amountUsdt) * (adminConfig.feePercent / 100)).toFixed(8);
    const adminServiceFee = parseFloat(rawAdminFee) < parseFloat(adminConfig.minFeeUsdt)
      ? adminConfig.minFeeUsdt
      : rawAdminFee;

    const totalFeeAmount = LedgerMath.add(networkGasFee, adminServiceFee);

    if (!LedgerMath.isGreaterThanOrEqual(amountUsdt, minWithdrawal)) {
      return {
        networkKey: config.networkKey,
        amount: amountUsdt,
        networkGasFee,
        adminServiceFee,
        feeAmount: totalFeeAmount,
        netAmount: '0.00000000',
        minWithdrawal,
        isExecutable: false,
      };
    }

    const netAmount = LedgerMath.subtract(amountUsdt, totalFeeAmount);
    return {
      networkKey: config.networkKey,
      amount: amountUsdt,
      networkGasFee,
      adminServiceFee,
      feeAmount: totalFeeAmount,
      netAmount: LedgerMath.isGreaterThan(netAmount, '0') ? netAmount : '0.00000000',
      minWithdrawal,
      isExecutable: LedgerMath.isGreaterThan(netAmount, '0'),
    };
  }

  /**
   * Initiates a withdrawal request and moves through the custody pipeline
   */
  public static async requestWithdrawal(params: {
    userId: string;
    networkKey: string;
    destinationAddress: string;
    amountUsdt: string;
  }): Promise<WithdrawalRecord> {
    if (TreasuryService.isEmergencyPaused()) {
      throw new Error('Withdrawals are temporarily paused for system maintenance.');
    }

    const config = NetworkRegistry.getNetwork(params.networkKey);
    if (!config.isWithdrawalEnabled) {
      throw new Error(`Withdrawals on ${config.name} are currently disabled.`);
    }

    const checksumDestination = NetworkRegistry.normalizeAddress(params.destinationAddress);
    const quote = this.calculateQuote(params.networkKey, params.amountUsdt);

    if (!quote.isExecutable) {
      throw new Error(`Minimum withdrawal on ${config.name} is ${config.minWithdrawalUsdt} USDT`);
    }

    const withdrawalId = `wdr_${uuidv4()}`;
    const idempotencyKey = `wdr_lock_${withdrawalId}`;

    // 1. Lock funds in Double-Entry Ledger
    await LedgerService.lockFundsForWithdrawal(params.userId, params.amountUsdt, idempotencyKey);

    const record: WithdrawalRecord = {
      id: withdrawalId,
      userId: params.userId,
      networkKey: config.networkKey,
      chainId: config.chainId,
      destinationAddress: checksumDestination,
      amount: params.amountUsdt,
      feeAmount: quote.feeAmount,
      netAmount: quote.netAmount,
      status: 'QUEUED',
      confirmations: 0,
      requiredConfirmations: config.requiredConfirmations,
      createdAt: new Date().toISOString(),
      explorerUrl: undefined,
    };

    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          await client.query(
            `INSERT INTO withdrawals (
              id, user_id, network_key, chain_id, destination_address,
              amount, fee_amount, net_amount, status, required_confirmations,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
            [
              record.id,
              record.userId,
              record.networkKey,
              record.chainId,
              record.destinationAddress,
              record.amount,
              record.feeAmount,
              record.netAmount,
              record.status,
              record.requiredConfirmations,
            ]
          );
        } finally {
          client.release();
        }
      }
    }

    this.memoryWithdrawals.set(withdrawalId, record);
    Logger.info(`Withdrawal request ${withdrawalId} queued successfully for ${params.userId}`);

    // Asynchronously dispatch the execution pipeline
    this.processWithdrawalPipeline(withdrawalId).catch((err) => {
      Logger.error(`Error in withdrawal pipeline for ${withdrawalId}`, err);
    });

    return record;
  }

  /**
   * Executes the on-chain signing and broadcast pipeline
   */
  public static async processWithdrawalPipeline(withdrawalId: string): Promise<void> {
    const record = this.memoryWithdrawals.get(withdrawalId);
    if (!record || record.status === 'CONFIRMED' || record.status === 'FAILED') return;

    try {
      const config = NetworkRegistry.getNetwork(record.networkKey);

      // Check Treasury Liquidity
      const hasLiquidity = await TreasuryService.hasSufficientLiquidity(record.networkKey, record.netAmount);

      if (!hasLiquidity) {
        record.status = 'REBALANCING';
        Logger.info(`Low liquidity on ${record.networkKey} treasury. Triggering automated cross-chain rebalance...`);
        await CrossChainRebalancingService.initiateRebalance('ethereum', record.networkKey, '50.00000000');
      }

      // Mark SIGNING and BROADCAST
      record.status = 'SIGNING';
      const broadcastResult = await BlockchainService.broadcastUsdtTransfer(
        record.networkKey,
        record.destinationAddress,
        record.netAmount
      );

      record.txHash = broadcastResult.txHash;
      record.nonce = broadcastResult.nonce;
      record.status = 'BROADCAST';
      record.explorerUrl = `${config.explorerUrl}/tx/${broadcastResult.txHash}`;

      if (isPostgresConfigured()) {
        const pool = getDbPool();
        if (pool) {
          const client = await pool.connect();
          try {
            await client.query(
              `UPDATE withdrawals 
               SET status = $1, tx_hash = $2, nonce = $3, updated_at = NOW()
               WHERE id = $4`,
              [record.status, record.txHash, record.nonce, record.id]
            );
          } finally {
            client.release();
          }
        }
      }

      Logger.info(`Withdrawal ${record.id} broadcast to blockchain. TX: ${record.txHash}`);

      // Start Confirmation Monitor
      this.monitorWithdrawalConfirmation(record.id).catch((err) => {
        Logger.error(`Confirmation monitor error for ${record.id}`, err);
      });
    } catch (err: any) {
      Logger.error(`Withdrawal pipeline failed for ${withdrawalId}`, err);
      record.status = 'FAILED';
      record.failureReason = err.message || 'On-chain broadcast error';

      // Refund user in Double-Entry Ledger
      const refundKey = `wdr_refund_${withdrawalId}`;
      await LedgerService.refundWithdrawal(record.userId, record.amount, refundKey, record.failureReason);
    }
  }

  /**
   * Monitors on-chain transaction receipt until finality
   */
  private static async monitorWithdrawalConfirmation(withdrawalId: string): Promise<void> {
    const record = this.memoryWithdrawals.get(withdrawalId);
    if (!record || !record.txHash) return;

    let attempts = 0;
    const maxAttempts = 30;

    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts || record.status === 'CONFIRMED' || record.status === 'FAILED') {
        clearInterval(interval);
        return;
      }

      try {
        const receipt = await BlockchainService.getTransactionReceipt(record.networkKey, record.txHash!);
        record.confirmations = receipt.confirmations;
        record.blockNumber = receipt.blockNumber || undefined;

        if (receipt.confirmations >= record.requiredConfirmations) {
          clearInterval(interval);
          record.status = 'CONFIRMED';
          record.completedAt = new Date().toISOString();

          // Settle funds in Double-Entry Ledger
          const settleKey = `wdr_settle_${withdrawalId}`;
          await LedgerService.settleWithdrawal(record.userId, record.amount, record.feeAmount, settleKey);

          Logger.info(`Withdrawal ${withdrawalId} confirmed and settled on ${record.networkKey}`);
        }
      } catch (err) {
        Logger.warn(`Polling receipt warning for withdrawal ${withdrawalId}`);
      }
    }, 4000);
  }

  /**
   * Fetches withdrawal history for a user
   */
  public static async getUserWithdrawals(userId: string): Promise<WithdrawalRecord[]> {
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          const res = await client.query(
            `SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
            [userId]
          );

          if (res.rows.length > 0) {
            return res.rows.map((row) => {
              const netConfig = NetworkRegistry.getNetwork(row.network_key);
              return {
                id: row.id,
                userId: row.user_id,
                networkKey: row.network_key,
                chainId: row.chain_id,
                destinationAddress: row.destination_address,
                amount: row.amount,
                feeAmount: row.fee_amount,
                netAmount: row.net_amount,
                status: row.status,
                txHash: row.tx_hash,
                nonce: row.nonce,
                blockNumber: row.block_number,
                confirmations: row.confirmations,
                requiredConfirmations: row.required_confirmations,
                failureReason: row.failure_reason,
                createdAt: new Date(row.created_at).toISOString(),
                completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
                explorerUrl: row.tx_hash ? `${netConfig.explorerUrl}/tx/${row.tx_hash}` : undefined,
              };
            });
          }
        } catch (err) {
          Logger.warn('Database query fallback for getUserWithdrawals', { userId });
        } finally {
          client.release();
        }
      }
    }

    // In-memory fallback
    const list: WithdrawalRecord[] = [];
    for (const w of this.memoryWithdrawals.values()) {
      if (w.userId === userId) {
        list.push(w);
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
