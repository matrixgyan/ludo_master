import { pgTable, text, timestamp, integer, boolean, jsonb, numeric, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users, ledgerTransactions } from './schema';

// -----------------------------------------------------------------------------
// 1. PAYMENT GATEWAYS (Admin Managed UPI / Bank / QR / Custom Channels)
// -----------------------------------------------------------------------------
export const paymentGateways = pgTable('payment_gateways', {
  id: text('id').primaryKey(), // e.g. 'gw_upi_googlepay', 'gw_bank_hdfc'
  type: text('type').notNull(), // 'UPI' | 'BANK_TRANSFER' | 'QR_CODE' | 'WALLET' | 'CUSTOM'
  title: text('title').notNull(), // e.g. 'UPI Direct (GPay, PhonePe, Paytm)'
  accountHolderName: text('account_holder_name').notNull(),
  upiId: text('upi_id'),
  accountNumber: text('account_number'),
  ifscCode: text('ifsc_code'),
  bankName: text('bank_name'),
  branchName: text('branch_name'),
  qrCodeUrl: text('qr_code_url'),
  minDepositAmount: numeric('min_deposit_amount', { precision: 28, scale: 8 }).notNull().default('100.00'),
  maxDepositAmount: numeric('max_deposit_amount', { precision: 28, scale: 8 }).notNull().default('100000.00'),
  depositInstructions: text('deposit_instructions'),
  isEnabled: boolean('is_enabled').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// 2. MANUAL FIAT DEPOSIT REQUESTS (User Submissions -> Admin Verification)
// -----------------------------------------------------------------------------
export const manualDepositRequests = pgTable('manual_deposit_requests', {
  id: text('id').primaryKey(), // e.g. 'mdep_xxx'
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  gatewayId: text('gateway_id').notNull().references(() => paymentGateways.id),
  amount: numeric('amount', { precision: 28, scale: 8 }).notNull(),
  currency: text('currency').notNull().default('INR'),
  utrNumber: text('utr_number').notNull(), // 12-digit transaction reference / UTR
  senderName: text('sender_name'),
  senderUpiOrAccount: text('sender_upi_or_account'),
  screenshotUrl: text('screenshot_url'),
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNotes: text('admin_notes'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  ledgerTxId: text('ledger_tx_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userStatusIdx: index('manual_deposits_user_status_idx').on(table.userId, table.status),
  utrIdx: index('manual_deposits_utr_idx').on(table.utrNumber),
}));

// -----------------------------------------------------------------------------
// 3. MANUAL FIAT WITHDRAWAL REQUESTS (User Requests -> Admin Approval & Payout)
// -----------------------------------------------------------------------------
export const manualWithdrawalRequests = pgTable('manual_withdrawal_requests', {
  id: text('id').primaryKey(), // e.g. 'mwith_xxx'
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 28, scale: 8 }).notNull(),
  currency: text('currency').notNull().default('INR'),
  payoutMethod: text('payout_method').notNull(), // 'UPI' | 'BANK_TRANSFER'
  payoutUpiId: text('payout_upi_id'),
  payoutAccountNumber: text('payout_account_number'),
  payoutIfscCode: text('payout_ifsc_code'),
  payoutAccountName: text('payout_account_name'),
  payoutBankName: text('payout_bank_name'),
  feeAmount: numeric('fee_amount', { precision: 28, scale: 8 }).notNull().default('0.00'),
  netAmount: numeric('net_amount', { precision: 28, scale: 8 }).notNull(),
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'APPROVED' | 'PROCESSED' | 'REJECTED'
  payoutReference: text('payout_reference'), // Bank UTR or IMPS Ref provided by Admin upon transfer
  payoutReceiptUrl: text('payout_receipt_url'),
  adminNotes: text('admin_notes'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  ledgerTxId: text('ledger_tx_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userWithdrawalIdx: index('manual_withdrawals_user_status_idx').on(table.userId, table.status),
}));
