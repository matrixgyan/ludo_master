import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ManualPaymentService } from '../services/manualPaymentService';
import { platformSettings } from '../routes/adminApi';
import { Logger } from '../config/env';

export const manualPaymentRouter = Router();

function resolveUserId(req: Request): string {
  const headerUser = req.headers['x-user-id'] as string;
  const queryUser = req.query.userId as string;
  return headerUser || queryUser || 'user_guest_default';
}

/**
 * GET /api/manual-payments/gateways
 * Public endpoint to fetch active payment methods configured by admin
 */
manualPaymentRouter.get('/api/manual-payments/gateways', async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const gateways = await ManualPaymentService.getActiveGateways();
    res.json({
      success: true,
      currency: platformSettings.platformCurrency || 'INR',
      currencySymbol: platformSettings.currencySymbol || '₹',
      gateways,
    });
  } catch (err: any) {
    Logger.error('Failed to get payment gateways', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/manual-payments/deposit
 * User submits manual deposit proof with UTR / Reference No.
 */
const SubmitDepositSchema = z.object({
  gatewayId: z.string(),
  amount: z.string(),
  utrNumber: z.string().min(4, 'UTR / Reference Number must be valid'),
  senderName: z.string().optional(),
  senderUpiOrAccount: z.string().optional(),
  screenshotUrl: z.string().optional(),
});

// Support both /deposits/submit and /deposit /deposits endpoints
manualPaymentRouter.post(['/api/manual-payments/deposit', '/api/manual-payments/deposits/submit'], async (req: Request, res: Response) => {
  try {
    const userId = (req.body.userId as string) || resolveUserId(req);
    const body = SubmitDepositSchema.parse(req.body);

    const deposit = await ManualPaymentService.submitDepositRequest({
      userId,
      gatewayId: body.gatewayId,
      amount: body.amount,
      currency: platformSettings.platformCurrency || 'INR',
      utrNumber: body.utrNumber,
      senderName: body.senderName,
      senderUpiOrAccount: body.senderUpiOrAccount,
      screenshotUrl: body.screenshotUrl,
    });

    res.json({
      success: true,
      message: 'Deposit request submitted successfully! Your balance will update immediately once verified by Admin.',
      deposit,
    });
  } catch (err: any) {
    Logger.error('Error submitting manual deposit', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/manual-payments/deposits & /api/manual-payments/deposits/user
 * User fetches their deposit history
 */
manualPaymentRouter.get(['/api/manual-payments/deposits', '/api/manual-payments/deposits/user'], async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const deposits = await ManualPaymentService.getUserDeposits(userId);
    res.json({ success: true, deposits });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/manual-payments/withdraw & /api/manual-payments/withdrawals/request
 * User requests manual withdrawal (UPI / Bank)
 */
const SubmitWithdrawalSchema = z.object({
  amount: z.string(),
  payoutMethod: z.enum(['UPI', 'BANK_TRANSFER']),
  payoutUpiId: z.string().optional(),
  payoutAccountNumber: z.string().optional(),
  payoutIfscCode: z.string().optional(),
  payoutAccountName: z.string().optional(),
  payoutBankName: z.string().optional(),
});

manualPaymentRouter.post(['/api/manual-payments/withdraw', '/api/manual-payments/withdrawals/request'], async (req: Request, res: Response) => {
  try {
    const userId = (req.body.userId as string) || resolveUserId(req);
    const body = SubmitWithdrawalSchema.parse(req.body);

    if (body.payoutMethod === 'UPI' && !body.payoutUpiId?.trim()) {
      res.status(400).json({ success: false, error: 'UPI ID is required for UPI payout' });
      return;
    }

    if (body.payoutMethod === 'BANK_TRANSFER' && (!body.payoutAccountNumber?.trim() || !body.payoutIfscCode?.trim())) {
      res.status(400).json({ success: false, error: 'Account Number and IFSC Code are required for Bank Transfer' });
      return;
    }

    const withdrawal = await ManualPaymentService.requestWithdrawal({
      userId,
      amount: body.amount,
      currency: platformSettings.platformCurrency || 'INR',
      payoutMethod: body.payoutMethod,
      payoutUpiId: body.payoutUpiId,
      payoutAccountNumber: body.payoutAccountNumber,
      payoutIfscCode: body.payoutIfscCode,
      payoutAccountName: body.payoutAccountName,
      payoutBankName: body.payoutBankName,
    });

    res.json({
      success: true,
      message: 'Withdrawal request submitted! Funds will be transferred to your account by Admin.',
      withdrawal,
    });
  } catch (err: any) {
    Logger.error('Error submitting manual withdrawal', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/manual-payments/withdrawals & /api/manual-payments/withdrawals/user
 * User fetches their withdrawal history
 */
manualPaymentRouter.get(['/api/manual-payments/withdrawals', '/api/manual-payments/withdrawals/user'], async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const withdrawals = await ManualPaymentService.getUserWithdrawals(userId);
    res.json({ success: true, withdrawals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * ==========================================
 * ADMIN API ENDPOINTS FOR MANUAL PAYMENT
 * ==========================================
 */

// Admin: Get All Gateways
manualPaymentRouter.get('/api/admin/manual-payments/gateways', async (req: Request, res: Response) => {
  try {
    const gateways = await ManualPaymentService.getAllGateways();
    res.json({ success: true, gateways });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Create / Update Gateway
manualPaymentRouter.post('/api/admin/manual-payments/gateways', async (req: Request, res: Response) => {
  try {
    const gateway = await ManualPaymentService.saveGateway(req.body);
    res.json({ success: true, gateway, message: 'Payment gateway saved successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Admin: Delete Gateway
manualPaymentRouter.delete('/api/admin/manual-payments/gateways/:id', async (req: Request, res: Response) => {
  try {
    await ManualPaymentService.deleteGateway(req.params.id);
    res.json({ success: true, message: 'Gateway removed' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Get All Deposits for Verification Queue
manualPaymentRouter.get('/api/admin/manual-payments/deposits', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const deposits = await ManualPaymentService.getAllDepositRequests(status);
    res.json({ success: true, deposits });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Verify Deposit (Approve & Credit Balance OR Reject)
manualPaymentRouter.post('/api/admin/manual-payments/deposits/:id/verify', async (req: Request, res: Response) => {
  try {
    const { action, adminNotes, reviewedBy } = req.body;
    if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
      res.status(400).json({ success: false, error: 'Action must be APPROVE or REJECT' });
      return;
    }

    const result = await ManualPaymentService.verifyDeposit(
      req.params.id,
      action,
      adminNotes,
      reviewedBy || 'SuperAdmin'
    );

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Admin: Get All Withdrawals Queue
manualPaymentRouter.get('/api/admin/manual-payments/withdrawals', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const withdrawals = await ManualPaymentService.getAllWithdrawalRequests(status);
    res.json({ success: true, withdrawals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Process Withdrawal (Approve with Ref OR Reject & Refund)
manualPaymentRouter.post('/api/admin/manual-payments/withdrawals/:id/process', async (req: Request, res: Response) => {
  try {
    const { action, payoutReference, adminNotes, reviewedBy } = req.body;
    if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
      res.status(400).json({ success: false, error: 'Action must be APPROVE or REJECT' });
      return;
    }

    const result = await ManualPaymentService.processWithdrawal(
      req.params.id,
      action,
      payoutReference,
      adminNotes,
      reviewedBy || 'SuperAdmin'
    );

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
