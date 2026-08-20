import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { LedgerService } from '../wallet/ledgerService';
import { DepositService } from '../wallet/depositService';
import { WithdrawalService } from '../wallet/withdrawalService';
import { NetworkRegistry } from '../wallet/registry';
import { BlockchainService } from '../wallet/blockchainService';
import { CrossChainRebalancingService } from '../wallet/crossChainRebalancingService';
import { Logger } from '../config/env';

export const walletRouter = Router();

// Middleware to extract user ID from header or query or fallback
function resolveUserId(req: Request): string {
  const headerUser = req.headers['x-user-id'] as string;
  const queryUser = req.query.userId as string;
  return headerUser || queryUser || 'user_guest_default';
}

/**
 * GET /api/wallet
 * Returns the unified USDT wallet balance and status
 */
walletRouter.get('/api/wallet', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const wallet = await LedgerService.getUserWallet(userId);
    res.json({ success: true, wallet, env: NetworkRegistry.getBlockchainEnv() });
  } catch (err: any) {
    Logger.error('API Error in GET /api/wallet', err);
    res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
});

/**
 * GET /api/wallet/networks
 * Returns list of 7 supported EVM networks (filtered by active Mainnet or Testnet mode)
 */
walletRouter.get('/api/wallet/networks', async (req: Request, res: Response) => {
  try {
    const networks = NetworkRegistry.getAllSupportedNetworks();
    const adminConfig = NetworkRegistry.getAdminServiceFeeConfig();
    res.json({
      success: true,
      env: NetworkRegistry.getBlockchainEnv(),
      adminServiceFee: adminConfig,
      networks: networks.map((net) => ({
        networkKey: net.networkKey,
        name: net.name,
        chainId: net.chainId,
        env: net.env,
        nativeGasToken: net.nativeGasToken,
        usdtContractAddress: net.usdtContractAddress,
        usdtDecimals: net.usdtDecimals,
        requiredConfirmations: net.requiredConfirmations,
        minDepositUsdt: net.minDepositUsdt,
        minWithdrawalUsdt: net.minWithdrawalUsdt,
        withdrawalFeeUsdt: net.withdrawalFeeUsdt,
        isDepositEnabled: net.isDepositEnabled,
        isWithdrawalEnabled: net.isWithdrawalEnabled,
        explorerUrl: net.explorerUrl,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/wallet/gas-estimate
 * Returns real-time gas fee estimates for network(s)
 */
walletRouter.get('/api/wallet/gas-estimate', async (req: Request, res: Response) => {
  try {
    const networkKey = req.query.networkKey as string;
    const actionType = (req.query.actionType as any) || 'erc20_transfer';

    if (networkKey) {
      const estimate = await BlockchainService.estimateGasFee(networkKey, actionType);
      res.json({ success: true, estimate });
    } else {
      const networks = NetworkRegistry.getAllSupportedNetworks();
      const estimates = await Promise.all(
        networks.map((n) => BlockchainService.estimateGasFee(n.networkKey, actionType))
      );
      res.json({ success: true, estimates });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/wallet/cross-chain-quote
 * Returns dynamic cross-chain bridge & relayer fee estimate
 */
walletRouter.get('/api/wallet/cross-chain-quote', async (req: Request, res: Response) => {
  try {
    const source = (req.query.source as string) || 'optimism';
    const dest = (req.query.dest as string) || 'ethereum';
    const amount = (req.query.amount as string) || '10.00';

    const quote = await CrossChainRebalancingService.getRebalanceQuote(source, dest, amount);
    res.json({ success: true, quote });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/wallet/deposit/address
 * Returns the custodial deposit address for the user on the chosen network
 */
walletRouter.get('/api/wallet/deposit/address', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const networkKey = (req.query.networkKey as string) || 'optimism';
    const depositInfo = await DepositService.getUserDepositAddress(userId, networkKey);
    res.json({ success: true, depositInfo, env: NetworkRegistry.getBlockchainEnv() });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/wallet/deposits
 * Returns deposit history for the user
 */
walletRouter.get('/api/wallet/deposits', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const deposits = await DepositService.getUserDeposits(userId);
    res.json({ success: true, deposits });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/wallet/deposits/track
 * Allows client to report a newly broadcast USDT transfer for real-time tracking
 */
const TrackDepositSchema = z.object({
  networkKey: z.string(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid Ethereum transaction hash format'),
  amount: z.string().optional(),
});

walletRouter.post('/api/wallet/deposits/track', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const body = TrackDepositSchema.parse(req.body);

    const netConfig = NetworkRegistry.getNetwork(body.networkKey);
    const receipt = await BlockchainService.getTransactionReceipt(body.networkKey, body.txHash);
    const userDepositAddr = (await DepositService.getUserDepositAddress(userId, body.networkKey)).address;

    const record = await DepositService.recordDetectedDeposit({
      userId,
      networkKey: netConfig.networkKey,
      txHash: body.txHash,
      logIndex: 0,
      fromAddress: '0x0000000000000000000000000000000000000000',
      toAddress: userDepositAddr,
      tokenContract: netConfig.usdtContractAddress,
      rawAmount: '0',
      amount: body.amount || '10.00000000',
      blockNumber: receipt.blockNumber || 0,
    });

    res.json({ success: true, deposit: record });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/wallet/withdrawals/quote
 * Calculates fee and net receive amount for a withdrawal
 */
const WithdrawalQuoteSchema = z.object({
  networkKey: z.string(),
  amountUsdt: z.string(),
});

walletRouter.post('/api/wallet/withdrawals/quote', (req: Request, res: Response) => {
  try {
    const { networkKey, amountUsdt } = WithdrawalQuoteSchema.parse(req.body);
    const quote = WithdrawalService.calculateQuote(networkKey, amountUsdt);
    res.json({ success: true, quote });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/wallet/withdrawals
 * Submits a real withdrawal request
 */
const CreateWithdrawalSchema = z.object({
  networkKey: z.string(),
  destinationAddress: z.string(),
  amountUsdt: z.string(),
});

walletRouter.post('/api/wallet/withdrawals', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const body = CreateWithdrawalSchema.parse(req.body);

    const withdrawal = await WithdrawalService.requestWithdrawal({
      userId,
      networkKey: body.networkKey,
      destinationAddress: body.destinationAddress,
      amountUsdt: body.amountUsdt,
    });

    res.json({ success: true, withdrawal });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/wallet/withdrawals
 * Returns withdrawal history for the user
 */
walletRouter.get('/api/wallet/withdrawals', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const withdrawals = await WithdrawalService.getUserWithdrawals(userId);
    res.json({ success: true, withdrawals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
