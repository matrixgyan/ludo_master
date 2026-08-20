import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TreasuryService } from '../wallet/treasuryService';
import { CrossChainRebalancingService } from '../wallet/crossChainRebalancingService';
import { ReconciliationService } from '../wallet/reconciliationService';
import { NetworkRegistry } from '../wallet/registry';
import { BlockchainService } from '../wallet/blockchainService';
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
    const adminFees = NetworkRegistry.getAdminServiceFeeConfig();
    const networks = NetworkRegistry.getAllSupportedNetworks();

    // Get live gas estimates
    const gasEstimates = await Promise.all(
      networks.map((n) => BlockchainService.estimateGasFee(n.networkKey, 'erc20_transfer'))
    );

    res.json({
      success: true,
      env,
      isEmergencyPaused: isPaused,
      adminServiceFee: adminFees,
      supportedNetworksCount: treasuries.length,
      treasuries,
      gasEstimates,
      activeRebalances: rebalances,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    Logger.error('Admin API Error /api/admin/wallet/overview', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/wallet/mode
 * 1-Click Toggle between Production Mainnet and Testnet
 */
const SetWalletModeSchema = z.object({
  env: z.enum(['mainnet', 'testnet']),
});

adminWalletRouter.post('/api/admin/wallet/mode', async (req: Request, res: Response) => {
  try {
    const { env } = SetWalletModeSchema.parse(req.body);
    
    // Switch environment in NetworkRegistry
    NetworkRegistry.setBlockchainEnv(env);
    // Invalidate cached RPC providers
    BlockchainService.clearProviders();

    Logger.info(`Admin switched wallet mode to: ${env.toUpperCase()}`);

    const networks = NetworkRegistry.getAllSupportedNetworks();
    res.json({
      success: true,
      env,
      message: `Wallet mode successfully switched to ${env.toUpperCase()}`,
      networksCount: networks.length,
      networks: networks.map((n) => ({
        key: n.networkKey,
        name: n.name,
        chainId: n.chainId,
        env: n.env,
        usdtContract: n.usdtContractAddress,
      })),
    });
  } catch (err: any) {
    Logger.error('Error switching wallet mode', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/wallet/fees/config
 * Configures Platform Admin Service Fee
 */
const UpdateAdminFeeSchema = z.object({
  feePercent: z.number().min(0).max(20),
  minFeeUsdt: z.string(),
});

adminWalletRouter.post('/api/admin/wallet/fees/config', (req: Request, res: Response) => {
  try {
    const { feePercent, minFeeUsdt } = UpdateAdminFeeSchema.parse(req.body);
    NetworkRegistry.setAdminServiceFeeConfig(feePercent, minFeeUsdt);
    res.json({
      success: true,
      message: `Admin service fee updated to ${feePercent}% (min ${minFeeUsdt} USDT)`,
      adminServiceFee: NetworkRegistry.getAdminServiceFeeConfig(),
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
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
