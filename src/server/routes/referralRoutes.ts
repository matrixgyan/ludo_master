import { Router, Request, Response } from 'express';
import { ReferralService } from '../services/referralService';
import { Logger } from '../config/env';

export const referralRouter = Router();

// GET /api/referrals/user/:userId - Fetch user's referral code, statistics, and referee status
referralRouter.get('/api/referrals/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || 'user_guest_default';
    const profile = await ReferralService.getUserProfile(userId);
    res.json({
      success: true,
      profile,
    });
  } catch (err: any) {
    Logger.error('API Error in GET /api/referrals/user', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/referrals/user - Query param fallback
referralRouter.get('/api/referrals/user', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'user_guest_default';
    const profile = await ReferralService.getUserProfile(userId);
    res.json({
      success: true,
      profile,
    });
  } catch (err: any) {
    Logger.error('API Error in GET /api/referrals/user', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/referrals/apply - Link referee to referrer code with Anti-Fraud checks
referralRouter.post('/api/referrals/apply', async (req: Request, res: Response) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) {
      res.status(400).json({ success: false, error: 'User ID and referral code are required.' });
      return;
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const result = await ReferralService.applyReferralCode(userId, code, ipAddress);
    res.json(result);
  } catch (err: any) {
    Logger.warn(`API Error in POST /api/referrals/apply: ${err.message}`);
    res.status(400).json({ success: false, error: err.message || 'Failed to apply referral code' });
  }
});

// POST /api/referrals/event/deposit - Record user deposit for referral qualification
referralRouter.post('/api/referrals/event/deposit', async (req: Request, res: Response) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount) {
      res.status(400).json({ success: false, error: 'Missing userId or amount' });
      return;
    }

    await ReferralService.recordDepositEvent(userId, Number(amount));
    res.json({ success: true, message: 'Deposit referral event recorded' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/referrals/event/match - Record match completion for referral qualification
referralRouter.post('/api/referrals/event/match', async (req: Request, res: Response) => {
  try {
    const { userId, gameId } = req.body;
    if (!userId) {
      res.status(400).json({ success: false, error: 'Missing userId' });
      return;
    }

    await ReferralService.recordMatchPlayedEvent(userId, gameId);
    res.json({ success: true, message: 'Match referral event recorded' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/referrals - Get all system referrals for admin monitoring
referralRouter.get('/api/admin/referrals', async (_req: Request, res: Response) => {
  try {
    const all = await ReferralService.getAllReferrals();
    res.json({ success: true, referrals: all });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
