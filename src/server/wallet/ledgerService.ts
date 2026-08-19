import { v4 as uuidv4 } from 'uuid';
import { getDbPool, isPostgresConfigured } from '../db/client';
import { LedgerMath } from './ledgerMath';
import { LedgerAccountType, UserWalletSummary } from './types';
import { Logger } from '../config/env';

// In-Memory fallback store for when PostgreSQL is not configured
interface MemoryAccount {
  id: string;
  accountType: LedgerAccountType;
  ownerId: string;
  balance: string;
}

interface MemoryTransaction {
  id: string;
  idempotencyKey: string;
  txType: string;
  description: string;
  metadata: any;
  createdAt: Date;
}

interface MemoryEntry {
  id: string;
  transactionId: string;
  accountId: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: string;
  balanceAfter: string;
  createdAt: Date;
}

export class LedgerService {
  private static memoryAccounts: Map<string, MemoryAccount> = new Map(); // key: `${ownerId}_${accountType}`
  private static memoryTransactions: Map<string, MemoryTransaction> = new Map(); // key: idempotencyKey
  private static memoryEntries: MemoryEntry[] = [];
  private static memoryWalletSummary: Map<string, { available: string; locked: string; total: string; status: 'ACTIVE' | 'FROZEN' | 'SUSPENDED' }> = new Map();

  /**
   * Helper to ensure ledger accounts exist for an owner
   */
  public static async getOrCreateAccount(ownerId: string, accountType: LedgerAccountType): Promise<string> {
    const key = `${ownerId}_${accountType}`;

    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          const res = await client.query(
            `SELECT id FROM ledger_accounts WHERE owner_id = $1 AND account_type = $2 LIMIT 1`,
            [ownerId, accountType]
          );
          if (res.rows.length > 0) {
            return res.rows[0].id;
          }

          const newId = `acc_${uuidv4()}`;
          await client.query(
            `INSERT INTO ledger_accounts (id, account_type, owner_id, asset, balance)
             VALUES ($1, $2, $3, 'USDT', '0.00000000')
             ON CONFLICT DO NOTHING`,
            [newId, accountType, ownerId]
          );
          return newId;
        } finally {
          client.release();
        }
      }
    }

    if (!this.memoryAccounts.has(key)) {
      const acc: MemoryAccount = {
        id: `mem_acc_${uuidv4()}`,
        accountType,
        ownerId,
        balance: '0.00000000',
      };
      this.memoryAccounts.set(key, acc);
    }
    return this.memoryAccounts.get(key)!.id;
  }

  /**
   * Retrieves the Unified USDT Wallet balance for a user
   */
  public static async getUserWallet(userId: string): Promise<UserWalletSummary> {
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          // 1. Ensure user row exists in users table
          await client.query(
            `INSERT INTO users (id, username) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
            [userId, `User_${userId.slice(0, 6)}`]
          );

          // 2. Fetch or create wallet_accounts
          let res = await client.query(
            `SELECT * FROM wallet_accounts WHERE user_id = $1 LIMIT 1`,
            [userId]
          );

          if (res.rows.length === 0) {
            const walletId = `w_${uuidv4()}`;
            await client.query(
              `INSERT INTO wallet_accounts (id, user_id, asset, available_balance, locked_balance, total_balance, status)
               VALUES ($1, $2, 'USDT', '0.00000000', '0.00000000', '0.00000000', 'ACTIVE')
               ON CONFLICT (user_id) DO NOTHING`,
              [walletId, userId]
            );
            res = await client.query(`SELECT * FROM wallet_accounts WHERE user_id = $1 LIMIT 1`, [userId]);
          }

          if (res.rows.length > 0) {
            const row = res.rows[0];
            const avail = row.available_balance || '0.00000000';
            const locked = row.locked_balance || '0.00000000';
            const total = LedgerMath.add(avail, locked);

            return {
              userId,
              asset: 'USDT',
              availableBalance: avail,
              lockedBalance: locked,
              totalBalance: total,
              formattedAvailable: LedgerMath.formatDollar(avail),
              formattedTotal: LedgerMath.formatDollar(total),
              status: row.status || 'ACTIVE',
              updatedAt: new Date(row.updated_at || Date.now()).toISOString(),
            };
          }
        } catch (err) {
          Logger.warn('Postgres query fallback for getUserWallet', { userId });
        } finally {
          client.release();
        }
      }
    }

    // In-Memory fallback
    if (!this.memoryWalletSummary.has(userId)) {
      this.memoryWalletSummary.set(userId, {
        available: '0.00000000',
        locked: '0.00000000',
        total: '0.00000000',
        status: 'ACTIVE',
      });
    }

    const mem = this.memoryWalletSummary.get(userId)!;
    return {
      userId,
      asset: 'USDT',
      availableBalance: mem.available,
      lockedBalance: mem.locked,
      totalBalance: LedgerMath.add(mem.available, mem.locked),
      formattedAvailable: LedgerMath.formatDollar(mem.available),
      formattedTotal: LedgerMath.formatDollar(LedgerMath.add(mem.available, mem.locked)),
      status: mem.status,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Processes an incoming deposit: Credits the user's unified available balance, debits platform treasury asset
   */
  public static async creditDeposit(
    userId: string,
    amountUsdt: string,
    idempotencyKey: string,
    metadata?: Record<string, unknown>
  ): Promise<{ transactionId: string; newAvailableBalance: string }> {
    // Check if already processed
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // Idempotency check
          const existing = await client.query(
            `SELECT id FROM ledger_transactions WHERE idempotency_key = $1 LIMIT 1`,
            [idempotencyKey]
          );
          if (existing.rows.length > 0) {
            await client.query('COMMIT');
            const w = await this.getUserWallet(userId);
            return { transactionId: existing.rows[0].id, newAvailableBalance: w.availableBalance };
          }

          const userAccId = await this.getOrCreateAccount(userId, 'USER_AVAILABLE');
          const treasuryAccId = await this.getOrCreateAccount('SYSTEM', 'PLATFORM_TREASURY');

          const txId = `ltx_${uuidv4()}`;
          await client.query(
            `INSERT INTO ledger_transactions (id, idempotency_key, tx_type, description, metadata)
             VALUES ($1, $2, 'DEPOSIT', $3, $4)`,
            [txId, idempotencyKey, `Deposit of ${amountUsdt} USDT`, JSON.stringify(metadata || {})]
          );

          // Update user wallet available balance
          await client.query(
            `UPDATE wallet_accounts
             SET available_balance = available_balance + $1,
                 total_balance = total_balance + $1,
                 updated_at = NOW()
             WHERE user_id = $2`,
            [amountUsdt, userId]
          );

          // Fetch updated balance for entry audit
          const updatedW = await client.query(
            `SELECT available_balance FROM wallet_accounts WHERE user_id = $1`,
            [userId]
          );
          const newAvail = updatedW.rows[0]?.available_balance || amountUsdt;

          // Record entries: CREDIT user, DEBIT treasury
          await client.query(
            `INSERT INTO ledger_entries (id, transaction_id, account_id, entry_type, amount, asset, balance_after)
             VALUES 
             ($1, $2, $3, 'CREDIT', $4, 'USDT', $5),
             ($6, $2, $7, 'DEBIT', $4, 'USDT', '0.00000000')`,
            [`le_${uuidv4()}`, txId, userAccId, amountUsdt, newAvail, `le_${uuidv4()}`, treasuryAccId]
          );

          await client.query('COMMIT');
          Logger.info(`Ledger: Credited deposit of ${amountUsdt} USDT to user ${userId}`, { txId, idempotencyKey });
          return { transactionId: txId, newAvailableBalance: newAvail };
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      }
    }

    // In-memory execution
    if (this.memoryTransactions.has(idempotencyKey)) {
      const tx = this.memoryTransactions.get(idempotencyKey)!;
      const w = await this.getUserWallet(userId);
      return { transactionId: tx.id, newAvailableBalance: w.availableBalance };
    }

    const txId = `ltx_${uuidv4()}`;
    this.memoryTransactions.set(idempotencyKey, {
      id: txId,
      idempotencyKey,
      txType: 'DEPOSIT',
      description: `Deposit of ${amountUsdt} USDT`,
      metadata,
      createdAt: new Date(),
    });

    const w = await this.getUserWallet(userId);
    const newAvail = LedgerMath.add(w.availableBalance, amountUsdt);
    this.memoryWalletSummary.set(userId, {
      ...this.memoryWalletSummary.get(userId)!,
      available: newAvail,
      total: LedgerMath.add(newAvail, w.lockedBalance),
    });

    Logger.info(`[Memory Ledger] Credited deposit of ${amountUsdt} USDT to user ${userId}`);
    return { transactionId: txId, newAvailableBalance: newAvail };
  }

  /**
   * Locks funds for a pending withdrawal
   */
  public static async lockFundsForWithdrawal(
    userId: string,
    amountUsdt: string,
    idempotencyKey: string
  ): Promise<{ transactionId: string }> {
    const w = await this.getUserWallet(userId);
    if (LedgerMath.isGreaterThan(amountUsdt, w.availableBalance)) {
      throw new Error(`Insufficient available USDT balance. Requested: ${amountUsdt}, Available: ${w.availableBalance}`);
    }

    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          const existing = await client.query(
            `SELECT id FROM ledger_transactions WHERE idempotency_key = $1 LIMIT 1`,
            [idempotencyKey]
          );
          if (existing.rows.length > 0) {
            await client.query('COMMIT');
            return { transactionId: existing.rows[0].id };
          }

          // Atomic check and lock
          const updateRes = await client.query(
            `UPDATE wallet_accounts
             SET available_balance = available_balance - $1,
                 locked_balance = locked_balance + $1,
                 updated_at = NOW()
             WHERE user_id = $2 AND available_balance >= $1
             RETURNING available_balance, locked_balance`,
            [amountUsdt, userId]
          );

          if (updateRes.rows.length === 0) {
            throw new Error('Insufficient funds or concurrent withdrawal detected');
          }

          const txId = `ltx_${uuidv4()}`;
          await client.query(
            `INSERT INTO ledger_transactions (id, idempotency_key, tx_type, description)
             VALUES ($1, $2, 'WITHDRAWAL_LOCK', $3)`,
            [txId, idempotencyKey, `Locked ${amountUsdt} USDT for withdrawal`]
          );

          await client.query('COMMIT');
          return { transactionId: txId };
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      }
    }

    // Memory Lock
    const txId = `ltx_${uuidv4()}`;
    const newAvail = LedgerMath.subtract(w.availableBalance, amountUsdt);
    const newLocked = LedgerMath.add(w.lockedBalance, amountUsdt);
    this.memoryWalletSummary.set(userId, {
      ...this.memoryWalletSummary.get(userId)!,
      available: newAvail,
      locked: newLocked,
    });

    return { transactionId: txId };
  }

  /**
   * Finalizes a completed withdrawal: Settles the locked funds from the user wallet
   */
  public static async settleWithdrawal(
    userId: string,
    amountUsdt: string,
    feeUsdt: string,
    idempotencyKey: string
  ): Promise<{ transactionId: string }> {
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          await client.query(
            `UPDATE wallet_accounts
             SET locked_balance = locked_balance - $1,
                 total_balance = total_balance - $1,
                 updated_at = NOW()
             WHERE user_id = $2`,
            [amountUsdt, userId]
          );

          const txId = `ltx_${uuidv4()}`;
          await client.query(
            `INSERT INTO ledger_transactions (id, idempotency_key, tx_type, description)
             VALUES ($1, $2, 'WITHDRAWAL_SETTLE', $3)
             ON CONFLICT (idempotency_key) DO NOTHING`,
            [txId, idempotencyKey, `Settled withdrawal of ${amountUsdt} USDT (Fee: ${feeUsdt})`]
          );

          await client.query('COMMIT');
          return { transactionId: txId };
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      }
    }

    // Memory settlement
    const w = await this.getUserWallet(userId);
    const newLocked = LedgerMath.subtract(w.lockedBalance, amountUsdt);
    this.memoryWalletSummary.set(userId, {
      ...this.memoryWalletSummary.get(userId)!,
      locked: newLocked,
      total: LedgerMath.add(w.availableBalance, newLocked),
    });

    return { transactionId: `ltx_${uuidv4()}` };
  }

  /**
   * Refunds a failed withdrawal back to the user's available balance
   */
  public static async refundWithdrawal(
    userId: string,
    amountUsdt: string,
    idempotencyKey: string,
    reason?: string
  ): Promise<{ transactionId: string }> {
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          await client.query(
            `UPDATE wallet_accounts
             SET locked_balance = locked_balance - $1,
                 available_balance = available_balance + $1,
                 updated_at = NOW()
             WHERE user_id = $2`,
            [amountUsdt, userId]
          );

          const txId = `ltx_${uuidv4()}`;
          await client.query(
            `INSERT INTO ledger_transactions (id, idempotency_key, tx_type, description, metadata)
             VALUES ($1, $2, 'WITHDRAWAL_REFUND', $3, $4)`,
            [txId, idempotencyKey, `Refunded withdrawal of ${amountUsdt} USDT`, JSON.stringify({ reason })]
          );

          await client.query('COMMIT');
          return { transactionId: txId };
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      }
    }

    // Memory Refund
    const w = await this.getUserWallet(userId);
    const newLocked = LedgerMath.subtract(w.lockedBalance, amountUsdt);
    const newAvail = LedgerMath.add(w.availableBalance, amountUsdt);
    this.memoryWalletSummary.set(userId, {
      ...this.memoryWalletSummary.get(userId)!,
      locked: newLocked,
      available: newAvail,
    });

    return { transactionId: `ltx_${uuidv4()}` };
  }
}
