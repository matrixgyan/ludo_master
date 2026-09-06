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
  private static memoryWalletSummary: Map<string, { available: string; locked: string; total: string; depositBalance: string; winningBalance: string; status: 'ACTIVE' | 'FROZEN' | 'SUSPENDED' }> = new Map();

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
            `INSERT INTO users (id, username, display_name) VALUES ($1, $1, $1) ON CONFLICT (id) DO NOTHING`,
            [userId]
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
            let depBal = row.deposit_balance || '0.00000000';
            let winBal = row.winning_balance || '0.00000000';
            if (parseFloat(avail) > 0 && parseFloat(depBal) === 0 && parseFloat(winBal) === 0) {
              depBal = avail;
            }

            return {
              userId,
              asset: 'USDT',
              availableBalance: avail,
              lockedBalance: locked,
              totalBalance: total,
              depositBalance: depBal,
              winningBalance: winBal,
              formattedAvailable: LedgerMath.formatDollar(avail),
              formattedTotal: LedgerMath.formatDollar(total),
              formattedDeposit: LedgerMath.formatDollar(depBal),
              formattedWinning: LedgerMath.formatDollar(winBal),
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
        depositBalance: '0.00000000',
        winningBalance: '0.00000000',
        status: 'ACTIVE',
      });
    }

    const mem = this.memoryWalletSummary.get(userId)!;
    let memDep = mem.depositBalance || '0.00000000';
    let memWin = mem.winningBalance || '0.00000000';
    if (parseFloat(mem.available) > 0 && parseFloat(memDep) === 0 && parseFloat(memWin) === 0) {
      memDep = mem.available;
      mem.depositBalance = memDep;
    }

    return {
      userId,
      asset: 'USDT',
      availableBalance: mem.available,
      lockedBalance: mem.locked,
      totalBalance: LedgerMath.add(mem.available, mem.locked),
      depositBalance: memDep,
      winningBalance: memWin,
      formattedAvailable: LedgerMath.formatDollar(mem.available),
      formattedTotal: LedgerMath.formatDollar(LedgerMath.add(mem.available, mem.locked)),
      formattedDeposit: LedgerMath.formatDollar(memDep),
      formattedWinning: LedgerMath.formatDollar(memWin),
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
             VALUES ($1, $2, 'DEPOSIT', $3, $4)
             ON CONFLICT (idempotency_key) DO NOTHING`,
            [txId, idempotencyKey, `Deposit of ${amountUsdt} USDT`, JSON.stringify(metadata || {})]
          );

          // 1. Ensure user row exists in users table
          await client.query(
            `INSERT INTO users (id, username, display_name) VALUES ($1, $1, $1) ON CONFLICT (id) DO NOTHING`,
            [userId]
          );

          // 2. Ensure wallet_accounts row exists with UPSERT
          const isMatchWin = (metadata as any)?.type === 'MATCH_WIN_PAYOUT';
          if (isMatchWin) {
            await client.query(
              `INSERT INTO wallet_accounts (id, user_id, asset, available_balance, locked_balance, total_balance, deposit_balance, winning_balance, status)
               VALUES ($1, $2, 'USDT', $3, '0.00000000', $3, '0.00000000', $3, 'ACTIVE')
               ON CONFLICT (user_id) DO UPDATE
               SET available_balance = wallet_accounts.available_balance + EXCLUDED.available_balance,
                   total_balance = wallet_accounts.total_balance + EXCLUDED.total_balance,
                   winning_balance = COALESCE(wallet_accounts.winning_balance, 0) + EXCLUDED.winning_balance,
                   updated_at = NOW()`,
              [`w_${uuidv4()}`, userId, amountUsdt]
            );
          } else {
            await client.query(
              `INSERT INTO wallet_accounts (id, user_id, asset, available_balance, locked_balance, total_balance, deposit_balance, winning_balance, status)
               VALUES ($1, $2, 'USDT', $3, '0.00000000', $3, $3, '0.00000000', 'ACTIVE')
               ON CONFLICT (user_id) DO UPDATE
               SET available_balance = wallet_accounts.available_balance + EXCLUDED.available_balance,
                   total_balance = wallet_accounts.total_balance + EXCLUDED.total_balance,
                   deposit_balance = COALESCE(wallet_accounts.deposit_balance, 0) + EXCLUDED.deposit_balance,
                   updated_at = NOW()`,
              [`w_${uuidv4()}`, userId, amountUsdt]
            );
          }

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
        } catch (err: any) {
          await client.query('ROLLBACK').catch(() => {});
          if (err.code === '23505' || err.message?.includes('ledger_transactions_idempotency_key_key')) {
            const existing = await pool.query(
              `SELECT id FROM ledger_transactions WHERE idempotency_key = $1 LIMIT 1`,
              [idempotencyKey]
            );
            if (existing.rows.length > 0) {
              const w = await this.getUserWallet(userId);
              return { transactionId: existing.rows[0].id, newAvailableBalance: w.availableBalance };
            }
          }
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

    const isMatchWin = (metadata as any)?.type === 'MATCH_WIN_PAYOUT';
    const w = await this.getUserWallet(userId);
    const newAvail = LedgerMath.add(w.availableBalance, amountUsdt);
    const currentMem = this.memoryWalletSummary.get(userId)!;
    const newDep = isMatchWin
      ? (currentMem.depositBalance || '0.00000000')
      : LedgerMath.add(currentMem.depositBalance || '0.00000000', amountUsdt);
    const newWin = isMatchWin
      ? LedgerMath.add(currentMem.winningBalance || '0.00000000', amountUsdt)
      : (currentMem.winningBalance || '0.00000000');

    this.memoryWalletSummary.set(userId, {
      ...currentMem,
      available: newAvail,
      total: LedgerMath.add(newAvail, w.lockedBalance),
      depositBalance: newDep,
      winningBalance: newWin,
    });

    Logger.info(`[Memory Ledger] Credited ${isMatchWin ? 'winnings' : 'deposit'} of ${amountUsdt} USDT to user ${userId}`);
    return { transactionId: txId, newAvailableBalance: newAvail };
  }

  /**
   * Locks funds for entry fees or generic operations (deducts from deposit first, then winning)
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

          // Atomic check and lock: deduct from deposit_balance first, then winning_balance
          const updateRes = await client.query(
            `UPDATE wallet_accounts
             SET available_balance = available_balance - $1,
                 locked_balance = locked_balance + $1,
                 deposit_balance = CASE
                   WHEN COALESCE(deposit_balance, 0) >= $1 THEN deposit_balance - $1
                   ELSE 0.00000000
                 END,
                 winning_balance = CASE
                   WHEN COALESCE(deposit_balance, 0) >= $1 THEN winning_balance
                   ELSE GREATEST(0.00000000, winning_balance - ($1 - COALESCE(deposit_balance, 0)))
                 END,
                 updated_at = NOW()
             WHERE user_id = $2 AND available_balance >= $1
             RETURNING available_balance, locked_balance`,
            [amountUsdt, userId]
          );

          if (updateRes.rows.length === 0) {
            throw new Error(`Insufficient available USDT balance. Requested: ${amountUsdt}`);
          }

          const txId = `ltx_${uuidv4()}`;
          await client.query(
            `INSERT INTO ledger_transactions (id, idempotency_key, tx_type, description)
             VALUES ($1, $2, 'WITHDRAWAL_LOCK', $3)`,
            [txId, idempotencyKey, `Locked ${amountUsdt} USDT for match/withdrawal`]
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

    // Memory Lock: deduct from deposit first, then winning
    const txId = `ltx_${uuidv4()}`;
    const newAvail = LedgerMath.subtract(w.availableBalance, amountUsdt);
    const newLocked = LedgerMath.add(w.lockedBalance, amountUsdt);
    const currentMem = this.memoryWalletSummary.get(userId)!;
    const currentDepNum = parseFloat(currentMem.depositBalance || '0');
    const reqNum = parseFloat(amountUsdt);
    let newDepStr = currentMem.depositBalance || '0.00000000';
    let newWinStr = currentMem.winningBalance || '0.00000000';
    if (currentDepNum >= reqNum) {
      newDepStr = (currentDepNum - reqNum).toFixed(8);
    } else {
      newDepStr = '0.00000000';
      const remaining = reqNum - currentDepNum;
      const currentWinNum = parseFloat(currentMem.winningBalance || '0');
      newWinStr = Math.max(0, currentWinNum - remaining).toFixed(8);
    }

    this.memoryWalletSummary.set(userId, {
      ...currentMem,
      available: newAvail,
      locked: newLocked,
      depositBalance: newDepStr,
      winningBalance: newWinStr,
    });

    return { transactionId: txId };
  }

  /**
   * Specifically locks WINNING funds for a pending withdrawal
   * Strict Real-Money Gaming Directives:
   * 1. Minimum withdrawal is ₹100
   * 2. Deposited balance is BLOCKED from withdrawal (ONLY winning amount can be withdrawn)
   * 3. 5% platform withdrawal fee is calculated and locked in real time
   */
  public static async lockWinningFundsForWithdrawal(
    userId: string,
    amountUsdt: string,
    idempotencyKey: string
  ): Promise<{ transactionId: string; feeAmount: string; netAmount: string }> {
    const numAmount = parseFloat(amountUsdt);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Invalid withdrawal amount');
    }
    if (numAmount < 100) {
      throw new Error('Minimum withdrawal amount is ₹100.00 of winnings balance.');
    }

    const w = await this.getUserWallet(userId);
    const winningBal = parseFloat(w.winningBalance || '0.00000000');
    const depositBal = parseFloat(w.depositBalance || '0.00000000');

    if (winningBal < numAmount) {
      throw new Error(
        `Cannot withdraw deposited balance. Only winning amount is eligible for withdrawal. Your Winning Balance is ₹${winningBal.toFixed(2)}, Deposited Balance is ₹${depositBal.toFixed(2)}. Play matches to win withdrawable cash!`
      );
    }

    const feeNum = parseFloat((numAmount * 0.05).toFixed(2));
    const netNum = parseFloat((numAmount - feeNum).toFixed(2));
    const feeAmount = feeNum.toFixed(2);
    const netAmount = netNum.toFixed(2);

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
            return { transactionId: existing.rows[0].id, feeAmount, netAmount };
          }

          const updateRes = await client.query(
            `UPDATE wallet_accounts
             SET available_balance = available_balance - $1,
                 winning_balance = winning_balance - $1,
                 locked_balance = locked_balance + $1,
                 updated_at = NOW()
             WHERE user_id = $2 AND winning_balance >= $1 AND available_balance >= $1
             RETURNING available_balance, winning_balance, locked_balance`,
            [amountUsdt, userId]
          );

          if (updateRes.rows.length === 0) {
            throw new Error(`Insufficient winning balance for withdrawal. Requested: ₹${numAmount.toFixed(2)}`);
          }

          const txId = `ltx_${uuidv4()}`;
          await client.query(
            `INSERT INTO ledger_transactions (id, idempotency_key, tx_type, description, metadata)
             VALUES ($1, $2, 'WITHDRAWAL_LOCK', $3, $4)`,
            [
              txId,
              idempotencyKey,
              `Locked ₹${amountUsdt} winning funds for withdrawal (5% fee: ₹${feeAmount}, net: ₹${netAmount})`,
              JSON.stringify({ feeAmount, netAmount, grossAmount: amountUsdt, feePercent: 5 }),
            ]
          );

          await client.query('COMMIT');
          return { transactionId: txId, feeAmount, netAmount };
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      }
    }

    // Memory lock
    const txId = `ltx_${uuidv4()}`;
    const newAvail = LedgerMath.subtract(w.availableBalance, amountUsdt);
    const newWin = LedgerMath.subtract(w.winningBalance || '0.00000000', amountUsdt);
    const newLocked = LedgerMath.add(w.lockedBalance, amountUsdt);
    const currentMem = this.memoryWalletSummary.get(userId)!;
    this.memoryWalletSummary.set(userId, {
      ...currentMem,
      available: newAvail,
      winningBalance: newWin,
      locked: newLocked,
      total: LedgerMath.add(newAvail, newLocked),
    });

    return { transactionId: txId, feeAmount, netAmount };
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
