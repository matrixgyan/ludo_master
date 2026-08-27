import { v4 as uuidv4 } from 'uuid';
import { getDb, isPostgresConfigured, withTransaction } from '../db/client';
import { paymentGateways, manualDepositRequests, manualWithdrawalRequests } from '../db/manualPaymentSchema';
import { users, walletAccounts, ledgerAccounts, ledgerTransactions, ledgerEntries } from '../db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { Logger } from '../config/env';

export interface PaymentGatewayItem {
  id: string;
  type: 'UPI' | 'BANK_TRANSFER' | 'QR_CODE' | 'WALLET' | 'CUSTOM';
  title: string;
  accountHolderName: string;
  upiId?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branchName?: string;
  qrCodeUrl?: string;
  minDepositAmount: string;
  maxDepositAmount: string;
  depositInstructions?: string;
  isEnabled: boolean;
  displayOrder: number;
}

export interface ManualDepositItem {
  id: string;
  userId: string;
  gatewayId: string;
  gatewayTitle?: string;
  amount: string;
  currency: string;
  utrNumber: string;
  senderName?: string;
  senderUpiOrAccount?: string;
  screenshotUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface ManualWithdrawalItem {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  payoutMethod: 'UPI' | 'BANK_TRANSFER';
  payoutUpiId?: string;
  payoutAccountNumber?: string;
  payoutIfscCode?: string;
  payoutAccountName?: string;
  payoutBankName?: string;
  feeAmount: string;
  netAmount: string;
  status: 'PENDING' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
  payoutReference?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

// In-memory fallback stores for high resilience and immediate responsiveness
let inMemoryGateways: PaymentGatewayItem[] = [
  {
    id: 'gw_upi_instant',
    type: 'UPI',
    title: 'UPI Instant (GPay / PhonePe / Paytm / BHIM)',
    accountHolderName: 'Ludo Supreme Arena',
    upiId: 'ludosupreme@upi',
    minDepositAmount: '50.00',
    maxDepositAmount: '50000.00',
    depositInstructions: 'Transfer via any UPI App, enter 12-digit UTR/Ref No. and submit for instant verification.',
    isEnabled: true,
    displayOrder: 1,
  },
  {
    id: 'gw_bank_neft',
    type: 'BANK_TRANSFER',
    title: 'Direct Bank Transfer (IMPS / NEFT / RTGS)',
    accountHolderName: 'Ludo Gaming Hub Pvt Ltd',
    accountNumber: '9182348572910',
    ifscCode: 'HDFC0001234',
    bankName: 'HDFC Bank',
    branchName: 'Corporate Branch',
    minDepositAmount: '500.00',
    maxDepositAmount: '500000.00',
    depositInstructions: 'Transfer funds to the verified account and submit the bank transaction UTR reference.',
    isEnabled: true,
    displayOrder: 2,
  },
  {
    id: 'gw_qr_code',
    type: 'QR_CODE',
    title: 'Scan QR & Pay (All UPI Apps)',
    accountHolderName: 'Ludo Arena Official',
    upiId: 'ludoarena@icici',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=ludoarena@icici&pn=LudoArena&cu=INR',
    minDepositAmount: '100.00',
    maxDepositAmount: '100000.00',
    depositInstructions: 'Scan the dynamic QR code with any UPI app and input the generated 12-digit UTR.',
    isEnabled: true,
    displayOrder: 3,
  },
];

let inMemoryDeposits: ManualDepositItem[] = [];
let inMemoryWithdrawals: ManualWithdrawalItem[] = [];

export class ManualPaymentService {
  /**
   * ==========================================
   * 1. PAYMENT GATEWAYS MANAGEMENT
   * ==========================================
   */
  public static async getActiveGateways(): Promise<PaymentGatewayItem[]> {
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          const list = await db
            .select()
            .from(paymentGateways)
            .where(eq(paymentGateways.isEnabled, true))
            .orderBy(paymentGateways.displayOrder);
          if (list.length > 0) {
            return list as any;
          }
        }
      } catch (err) {
        Logger.warn(`Postgres getActiveGateways failed, using cache: ${String(err)}`);
      }
    }
    return inMemoryGateways.filter((g) => g.isEnabled);
  }

  public static async getAllGateways(): Promise<PaymentGatewayItem[]> {
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          const list = await db.select().from(paymentGateways).orderBy(paymentGateways.displayOrder);
          if (list.length > 0) {
            return list as any;
          }
        }
      } catch (err) {
        Logger.warn(`Postgres getAllGateways failed, using cache: ${String(err)}`);
      }
    }
    return inMemoryGateways;
  }

  public static async saveGateway(gateway: Partial<PaymentGatewayItem>): Promise<PaymentGatewayItem> {
    const id = gateway.id || `gw_${uuidv4().slice(0, 8)}`;
    const completeItem: PaymentGatewayItem = {
      id,
      type: gateway.type || 'UPI',
      title: gateway.title || 'Payment Gateway',
      accountHolderName: gateway.accountHolderName || 'Platform Treasury',
      upiId: gateway.upiId || '',
      accountNumber: gateway.accountNumber || '',
      ifscCode: gateway.ifscCode || '',
      bankName: gateway.bankName || '',
      branchName: gateway.branchName || '',
      qrCodeUrl: gateway.qrCodeUrl || '',
      minDepositAmount: gateway.minDepositAmount || '50.00',
      maxDepositAmount: gateway.maxDepositAmount || '100000.00',
      depositInstructions: gateway.depositInstructions || '',
      isEnabled: gateway.isEnabled !== undefined ? gateway.isEnabled : true,
      displayOrder: gateway.displayOrder || 0,
    };

    // Update Memory
    const existingIdx = inMemoryGateways.findIndex((g) => g.id === id);
    if (existingIdx >= 0) {
      inMemoryGateways[existingIdx] = completeItem;
    } else {
      inMemoryGateways.push(completeItem);
    }

    // Update Postgres
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          await db
            .insert(paymentGateways)
            .values({
              ...completeItem,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: paymentGateways.id,
              set: {
                ...completeItem,
                updatedAt: new Date(),
              },
            });
        }
      } catch (err) {
        Logger.warn(`Postgres saveGateway error: ${String(err)}`);
      }
    }

    return completeItem;
  }

  public static async deleteGateway(id: string): Promise<boolean> {
    inMemoryGateways = inMemoryGateways.filter((g) => g.id !== id);
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          await db.delete(paymentGateways).where(eq(paymentGateways.id, id));
        }
      } catch (err) {
        Logger.warn(`Postgres deleteGateway error: ${String(err)}`);
      }
    }
    return true;
  }

  /**
   * ==========================================
   * 2. MANUAL DEPOSITS (SUBMIT & VERIFICATION)
   * ==========================================
   */
  public static async submitDepositRequest(data: {
    userId: string;
    gatewayId: string;
    amount: string;
    currency?: string;
    utrNumber: string;
    senderName?: string;
    senderUpiOrAccount?: string;
    screenshotUrl?: string;
  }): Promise<ManualDepositItem> {
    const id = `mdep_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const gateway = inMemoryGateways.find((g) => g.id === data.gatewayId);

    const deposit: ManualDepositItem = {
      id,
      userId: data.userId,
      gatewayId: data.gatewayId,
      gatewayTitle: gateway?.title || 'Direct Deposit',
      amount: parseFloat(data.amount).toFixed(2),
      currency: data.currency || 'INR',
      utrNumber: data.utrNumber.trim(),
      senderName: data.senderName?.trim() || '',
      senderUpiOrAccount: data.senderUpiOrAccount?.trim() || '',
      screenshotUrl: data.screenshotUrl || '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    inMemoryDeposits.unshift(deposit);

    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          await db.insert(manualDepositRequests).values({
            id: deposit.id,
            userId: deposit.userId,
            gatewayId: deposit.gatewayId,
            amount: deposit.amount,
            currency: deposit.currency,
            utrNumber: deposit.utrNumber,
            senderName: deposit.senderName,
            senderUpiOrAccount: deposit.senderUpiOrAccount,
            screenshotUrl: deposit.screenshotUrl,
            status: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } catch (err) {
        Logger.warn(`Postgres submitDepositRequest error: ${String(err)}`);
      }
    }

    Logger.info(`[MANUAL DEPOSIT] User ${data.userId} submitted UTR: ${data.utrNumber} for ${deposit.amount} ${deposit.currency}`);
    return deposit;
  }

  public static async getUserDeposits(userId: string): Promise<ManualDepositItem[]> {
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          const list = await db
            .select()
            .from(manualDepositRequests)
            .where(eq(manualDepositRequests.userId, userId))
            .orderBy(desc(manualDepositRequests.createdAt));
          if (list.length > 0) {
            return list as any;
          }
        }
      } catch (err) {
        Logger.warn(`Postgres getUserDeposits error: ${String(err)}`);
      }
    }
    return inMemoryDeposits.filter((d) => d.userId === userId);
  }

  public static async getAllDepositRequests(status?: string): Promise<ManualDepositItem[]> {
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          let query = db.select().from(manualDepositRequests).$dynamic();
          if (status && status !== 'ALL') {
            query = query.where(eq(manualDepositRequests.status, status));
          }
          const list = await query.orderBy(desc(manualDepositRequests.createdAt)).limit(100);
          return list as any;
        }
      } catch (err) {
        Logger.warn(`Postgres getAllDepositRequests error: ${String(err)}`);
      }
    }
    if (status && status !== 'ALL') {
      return inMemoryDeposits.filter((d) => d.status === status);
    }
    return inMemoryDeposits;
  }

  /**
   * Admin 1-Click Verification & Instant Account Crediting
   */
  public static async verifyDeposit(
    depositId: string,
    action: 'APPROVE' | 'REJECT',
    adminNotes?: string,
    reviewedBy?: string
  ): Promise<{ success: boolean; deposit: ManualDepositItem; error?: string }> {
    const deposit = inMemoryDeposits.find((d) => d.id === depositId);
    if (!deposit) {
      throw new Error(`Deposit request ${depositId} not found`);
    }

    if (deposit.status !== 'PENDING') {
      throw new Error(`Deposit is already ${deposit.status}`);
    }

    deposit.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    deposit.adminNotes = adminNotes || (action === 'APPROVE' ? 'Verified by Administrator' : 'Rejected by Administrator');
    deposit.reviewedBy = reviewedBy || 'SuperAdmin';
    deposit.reviewedAt = new Date().toISOString();

    if (action === 'APPROVE') {
      // Credit user balance atomically
      const { LedgerService } = await import('../wallet/ledgerService');
      const numAmount = parseFloat(deposit.amount);
      if (!isNaN(numAmount) && numAmount > 0) {
        await LedgerService.creditDeposit(
          deposit.userId,
          numAmount.toFixed(8),
          `manual_dep_${deposit.id}`,
          {
            utrNumber: deposit.utrNumber,
            currency: deposit.currency,
            notes: deposit.adminNotes,
          }
        );
      }
    }

    // Persist to Postgres
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          await db
            .update(manualDepositRequests)
            .set({
              status: deposit.status,
              adminNotes: deposit.adminNotes,
              reviewedBy: deposit.reviewedBy,
              reviewedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(manualDepositRequests.id, depositId));
        }
      } catch (err) {
        Logger.warn(`Postgres verifyDeposit error: ${String(err)}`);
      }
    }

    Logger.info(`[ADMIN DEPOSIT VERIFY] Deposit ${depositId} marked as ${deposit.status} by ${reviewedBy}`);
    return { success: true, deposit };
  }

  /**
   * ==========================================
   * 3. MANUAL WITHDRAWALS (REQUEST & SETTLEMENT)
   * ==========================================
   */
  public static async requestWithdrawal(data: {
    userId: string;
    amount: string;
    currency?: string;
    payoutMethod: 'UPI' | 'BANK_TRANSFER';
    payoutUpiId?: string;
    payoutAccountNumber?: string;
    payoutIfscCode?: string;
    payoutAccountName?: string;
    payoutBankName?: string;
  }): Promise<ManualWithdrawalItem> {
    const numAmount = parseFloat(data.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Invalid withdrawal amount');
    }

    // Lock user balance upfront to prevent double-spending
    const { LedgerService } = await import('../wallet/ledgerService');
    const userWallet = await LedgerService.getUserWallet(data.userId);
    const available = parseFloat(userWallet.availableBalance);

    if (available < numAmount) {
      throw new Error(`Insufficient balance. Available: ₹${available.toFixed(2)}, Requested: ₹${numAmount.toFixed(2)}`);
    }

    const id = `mwith_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const feeAmount = '0.00';
    const netAmount = numAmount.toFixed(2);

    // Lock funds in ledger
    await LedgerService.lockFundsForWithdrawal(data.userId, numAmount.toFixed(8), `manual_with_lock_${id}`);

    const withdrawal: ManualWithdrawalItem = {
      id,
      userId: data.userId,
      amount: numAmount.toFixed(2),
      currency: data.currency || 'INR',
      payoutMethod: data.payoutMethod,
      payoutUpiId: data.payoutUpiId || '',
      payoutAccountNumber: data.payoutAccountNumber || '',
      payoutIfscCode: data.payoutIfscCode || '',
      payoutAccountName: data.payoutAccountName || '',
      payoutBankName: data.payoutBankName || '',
      feeAmount,
      netAmount,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    inMemoryWithdrawals.unshift(withdrawal);

    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          await db.insert(manualWithdrawalRequests).values({
            id: withdrawal.id,
            userId: withdrawal.userId,
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            payoutMethod: withdrawal.payoutMethod,
            payoutUpiId: withdrawal.payoutUpiId,
            payoutAccountNumber: withdrawal.payoutAccountNumber,
            payoutIfscCode: withdrawal.payoutIfscCode,
            payoutAccountName: withdrawal.payoutAccountName,
            payoutBankName: withdrawal.payoutBankName,
            feeAmount: withdrawal.feeAmount,
            netAmount: withdrawal.netAmount,
            status: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } catch (err) {
        Logger.warn(`Postgres requestWithdrawal error: ${String(err)}`);
      }
    }

    Logger.info(`[MANUAL WITHDRAWAL] User ${data.userId} requested ₹${numAmount.toFixed(2)} via ${data.payoutMethod}`);
    return withdrawal;
  }

  public static async getUserWithdrawals(userId: string): Promise<ManualWithdrawalItem[]> {
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          const list = await db
            .select()
            .from(manualWithdrawalRequests)
            .where(eq(manualWithdrawalRequests.userId, userId))
            .orderBy(desc(manualWithdrawalRequests.createdAt));
          if (list.length > 0) {
            return list as any;
          }
        }
      } catch (err) {
        Logger.warn(`Postgres getUserWithdrawals error: ${String(err)}`);
      }
    }
    return inMemoryWithdrawals.filter((w) => w.userId === userId);
  }

  public static async getAllWithdrawalRequests(status?: string): Promise<ManualWithdrawalItem[]> {
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          let query = db.select().from(manualWithdrawalRequests).$dynamic();
          if (status && status !== 'ALL') {
            query = query.where(eq(manualWithdrawalRequests.status, status));
          }
          const list = await query.orderBy(desc(manualWithdrawalRequests.createdAt)).limit(100);
          return list as any;
        }
      } catch (err) {
        Logger.warn(`Postgres getAllWithdrawalRequests error: ${String(err)}`);
      }
    }
    if (status && status !== 'ALL') {
      return inMemoryWithdrawals.filter((w) => w.status === status);
    }
    return inMemoryWithdrawals;
  }

  public static async processWithdrawal(
    withdrawalId: string,
    action: 'APPROVE' | 'REJECT',
    payoutReference?: string,
    adminNotes?: string,
    reviewedBy?: string
  ): Promise<{ success: boolean; withdrawal: ManualWithdrawalItem }> {
    const withdrawal = inMemoryWithdrawals.find((w) => w.id === withdrawalId);
    if (!withdrawal) {
      throw new Error(`Withdrawal request ${withdrawalId} not found`);
    }

    if (withdrawal.status !== 'PENDING') {
      throw new Error(`Withdrawal is already ${withdrawal.status}`);
    }

    withdrawal.status = action === 'APPROVE' ? 'PROCESSED' : 'REJECTED';
    withdrawal.payoutReference = payoutReference || (action === 'APPROVE' ? 'DIRECT_BANK_TRANSFER' : '');
    withdrawal.adminNotes = adminNotes || (action === 'APPROVE' ? 'Payout processed successfully' : 'Rejected by Admin, balance refunded');
    withdrawal.reviewedBy = reviewedBy || 'SuperAdmin';
    withdrawal.reviewedAt = new Date().toISOString();

    if (action === 'APPROVE') {
      // Settle locked funds from user wallet
      const { LedgerService } = await import('../wallet/ledgerService');
      const numAmount = parseFloat(withdrawal.amount);
      if (!isNaN(numAmount) && numAmount > 0) {
        await LedgerService.settleWithdrawal(
          withdrawal.userId,
          numAmount.toFixed(8),
          withdrawal.feeAmount || '0.00000000',
          `manual_with_settle_${withdrawalId}`
        );
      }
    } else if (action === 'REJECT') {
      // Refund balance back to user available balance
      const { LedgerService } = await import('../wallet/ledgerService');
      const numAmount = parseFloat(withdrawal.amount);
      if (!isNaN(numAmount) && numAmount > 0) {
        await LedgerService.refundWithdrawal(
          withdrawal.userId,
          numAmount.toFixed(8),
          `manual_with_refund_${withdrawalId}`,
          withdrawal.adminNotes
        );
      }
    }

    // Persist to Postgres
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          await db
            .update(manualWithdrawalRequests)
            .set({
              status: withdrawal.status,
              payoutReference: withdrawal.payoutReference,
              adminNotes: withdrawal.adminNotes,
              reviewedBy: withdrawal.reviewedBy,
              reviewedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(manualWithdrawalRequests.id, withdrawalId));
        }
      } catch (err) {
        Logger.warn(`Postgres processWithdrawal error: ${String(err)}`);
      }
    }

    Logger.info(`[ADMIN WITHDRAWAL VERIFY] Withdrawal ${withdrawalId} marked as ${withdrawal.status} by ${reviewedBy}`);
    return { success: true, withdrawal };
  }
}
