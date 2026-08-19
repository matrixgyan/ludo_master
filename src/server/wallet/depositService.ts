import { v4 as uuidv4 } from 'uuid';
import { getDbPool, isPostgresConfigured } from '../db/client';
import { NetworkRegistry } from './registry';
import { ServerCustodyManager } from './custody';
import { BlockchainService } from './blockchainService';
import { LedgerService } from './ledgerService';
import { DepositRecord, DepositStatus } from './types';
import { Logger } from '../config/env';

export class DepositService {
  private static memoryDeposits: Map<string, DepositRecord> = new Map(); // key: `${chainId}_${txHash}_${logIndex}`

  /**
   * Retrieves or assigns the user's multi-chain deposit address
   */
  public static async getUserDepositAddress(userId: string, networkKey: string): Promise<{
    networkKey: string;
    chainId: number;
    address: string;
    usdtContractAddress: string;
    minDeposit: string;
    requiredConfirmations: number;
    explorerUrl: string;
  }> {
    const config = NetworkRegistry.getNetwork(networkKey);
    const { address, derivationIndex } = ServerCustodyManager.getUserDepositAddress(userId);

    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          await client.query(
            `INSERT INTO wallet_addresses (id, user_id, network_key, address, derivation_index)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, network_key) DO NOTHING`,
            [`wa_${uuidv4()}`, userId, config.networkKey, address, derivationIndex]
          );
        } catch (err) {
          Logger.warn('Database address mapping fallback', { userId, networkKey });
        } finally {
          client.release();
        }
      }
    }

    return {
      networkKey: config.networkKey,
      chainId: config.chainId,
      address,
      usdtContractAddress: config.usdtContractAddress,
      minDeposit: `${config.minDepositUsdt} USDT`,
      requiredConfirmations: config.requiredConfirmations,
      explorerUrl: `${config.explorerUrl}/address/${address}`,
    };
  }

  /**
   * Records an on-chain detected USDT deposit and triggers confirmation tracking
   */
  public static async recordDetectedDeposit(params: {
    userId: string;
    networkKey: string;
    txHash: string;
    logIndex: number;
    fromAddress: string;
    toAddress: string;
    tokenContract: string;
    rawAmount: string;
    amount: string;
    blockNumber: number;
  }): Promise<DepositRecord> {
    const config = NetworkRegistry.getNetwork(params.networkKey);
    const key = `${config.chainId}_${params.txHash.toLowerCase()}_${params.logIndex}`;

    const receipt = await BlockchainService.getTransactionReceipt(config.networkKey, params.txHash);
    const confirmations = receipt.confirmations;
    const isConfirmed = confirmations >= config.requiredConfirmations;
    const status: DepositStatus = isConfirmed ? 'CONFIRMED' : 'CONFIRMING';

    const depositRecord: DepositRecord = {
      id: `dep_${uuidv4()}`,
      userId: params.userId,
      networkKey: config.networkKey,
      chainId: config.chainId,
      txHash: params.txHash,
      logIndex: params.logIndex,
      fromAddress: params.fromAddress,
      toAddress: params.toAddress,
      tokenContract: params.tokenContract,
      rawAmount: params.rawAmount,
      amount: params.amount,
      confirmations,
      requiredConfirmations: config.requiredConfirmations,
      status,
      blockNumber: params.blockNumber,
      createdAt: new Date().toISOString(),
      confirmedAt: isConfirmed ? new Date().toISOString() : undefined,
      explorerUrl: `${config.explorerUrl}/tx/${params.txHash}`,
    };

    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          await client.query(
            `INSERT INTO deposits (
              id, user_id, network_key, chain_id, tx_hash, log_index,
              from_address, to_address, token_contract, raw_amount, amount,
              confirmations, required_confirmations, status, block_number,
              created_at, confirmed_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), $16
            )
            ON CONFLICT (chain_id, tx_hash, log_index) 
            DO UPDATE SET 
              confirmations = EXCLUDED.confirmations,
              status = EXCLUDED.status,
              confirmed_at = COALESCE(deposits.confirmed_at, EXCLUDED.confirmed_at),
              updated_at = NOW()`,
            [
              depositRecord.id,
              depositRecord.userId,
              depositRecord.networkKey,
              depositRecord.chainId,
              depositRecord.txHash,
              depositRecord.logIndex,
              depositRecord.fromAddress,
              depositRecord.toAddress,
              depositRecord.tokenContract,
              depositRecord.rawAmount,
              depositRecord.amount,
              depositRecord.confirmations,
              depositRecord.requiredConfirmations,
              depositRecord.status,
              depositRecord.blockNumber,
              isConfirmed ? new Date() : null,
            ]
          );
        } finally {
          client.release();
        }
      }
    }

    this.memoryDeposits.set(key, depositRecord);

    // If already confirmed, credit the double-entry ledger immediately
    if (isConfirmed) {
      const idempotencyKey = `dep_${config.chainId}_${params.txHash}_${params.logIndex}`;
      await LedgerService.creditDeposit(params.userId, params.amount, idempotencyKey, {
        networkKey: config.networkKey,
        chainId: config.chainId,
        txHash: params.txHash,
        blockNumber: params.blockNumber,
      });
    }

    return depositRecord;
  }

  /**
   * Refreshes confirmation count for pending deposits
   */
  public static async refreshDepositConfirmations(): Promise<number> {
    let updatedCount = 0;

    for (const [key, deposit] of this.memoryDeposits.entries()) {
      if (deposit.status === 'DETECTED' || deposit.status === 'CONFIRMING') {
        try {
          const receipt = await BlockchainService.getTransactionReceipt(deposit.networkKey, deposit.txHash);
          deposit.confirmations = receipt.confirmations;

          if (receipt.confirmations >= deposit.requiredConfirmations) {
            deposit.status = 'CONFIRMED';
            deposit.confirmedAt = new Date().toISOString();

            // Credit the ledger
            const idempotencyKey = `dep_${deposit.chainId}_${deposit.txHash}_${deposit.logIndex}`;
            await LedgerService.creditDeposit(deposit.userId, deposit.amount, idempotencyKey, {
              networkKey: deposit.networkKey,
              chainId: deposit.chainId,
              txHash: deposit.txHash,
            });

            updatedCount++;
            Logger.info(`Deposit confirmed and credited to ledger`, {
              txHash: deposit.txHash,
              userId: deposit.userId,
              amount: deposit.amount,
            });
          }
        } catch (err) {
          Logger.warn(`Error checking confirmations for deposit ${deposit.txHash}`);
        }
      }
    }

    return updatedCount;
  }

  /**
   * Fetches deposit history for a user
   */
  public static async getUserDeposits(userId: string): Promise<DepositRecord[]> {
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          const res = await client.query(
            `SELECT * FROM deposits WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
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
                txHash: row.tx_hash,
                logIndex: row.log_index,
                fromAddress: row.from_address,
                toAddress: row.to_address,
                tokenContract: row.token_contract,
                rawAmount: row.raw_amount,
                amount: row.amount,
                confirmations: row.confirmations,
                requiredConfirmations: row.required_confirmations,
                status: row.status,
                blockNumber: row.block_number,
                createdAt: new Date(row.created_at).toISOString(),
                confirmedAt: row.confirmed_at ? new Date(row.confirmed_at).toISOString() : undefined,
                explorerUrl: `${netConfig.explorerUrl}/tx/${row.tx_hash}`,
              };
            });
          }
        } catch (err) {
          Logger.warn('Database query fallback for getUserDeposits', { userId });
        } finally {
          client.release();
        }
      }
    }

    // In-memory fallback
    const userDeposits: DepositRecord[] = [];
    for (const deposit of this.memoryDeposits.values()) {
      if (deposit.userId === userId) {
        userDeposits.push(deposit);
      }
    }
    return userDeposits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
