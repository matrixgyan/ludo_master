import { Router, Request, Response } from 'express';
import { TreasuryService } from '../wallet/treasuryService';
import { CrossChainRebalancingService } from '../wallet/crossChainRebalancingService';
import { ReconciliationService } from '../wallet/reconciliationService';
import { NetworkRegistry } from '../wallet/registry';
import { Logger } from '../config/env';

export const adminWalletRouter = Router();

/**
 * GET /api/admin/wallet/overview
 * System-wide overview of the custodial USDT wallet subsystem
 */
adminWalletRouter.get('/api/admin/wallet/overview', async (req: Request, res: Response) => {
  try {
    const treasuries = await TreasuryService.syncAllNetworkTreasuries();
    const isPaused = TreasuryService.isEmergencyPaused();
    const env = NetworkRegistry.getBlockchainEnv();
    const rebalances = CrossChainRebalancingService.getActiveRebalances();

    res.json({
      success: true,
      env,
      isEmergencyPaused: isPaused,
      supportedNetworksCount: treasuries.length,
      treasuries,
      activeRebalances: rebalances,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    Logger.error('Admin API Error /api/admin/wallet/overview', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/wallet/treasury
 * Live on-chain balance breakdown for USDT & Gas across 7 networks
 */
adminWalletRouter.get('/api/admin/wallet/treasury', async (req: Request, res: Response) => {
  try {
    const treasuries = await TreasuryService.syncAllNetworkTreasuries();
    res.json({ success: true, treasuries });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/wallet/reconciliation
 * Returns the latest automated reconciliation report
 */
adminWalletRouter.get('/api/admin/wallet/reconciliation', async (req: Request, res: Response) => {
  try {
    let report = ReconciliationService.getLastReport();
    if (!report) {
      report = await ReconciliationService.runReconciliationAudit();
    }
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/wallet/reconciliation/run
 * Triggers an immediate fresh reconciliation audit
 */
adminWalletRouter.post('/api/admin/wallet/reconciliation/run', async (req: Request, res: Response) => {
  try {
    const report = await ReconciliationService.runReconciliationAudit();
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/wallet/emergency/pause
 */
adminWalletRouter.post('/api/admin/wallet/emergency/pause', (req: Request, res: Response) => {
  try {
    const reason = req.body?.reason || 'Admin Emergency Action';
    TreasuryService.setEmergencyPause(true, reason);
    res.json({ success: true, isEmergencyPaused: true, message: 'Wallet operations paused' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/wallet/emergency/resume
 */
adminWalletRouter.post('/api/admin/wallet/emergency/resume', (req: Request, res: Response) => {
  try {
    TreasuryService.setEmergencyPause(false);
    res.json({ success: true, isEmergencyPaused: false, message: 'Wallet operations resumed' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
