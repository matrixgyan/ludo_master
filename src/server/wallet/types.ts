import { z } from 'zod';

export type BlockchainEnv = 'testnet' | 'mainnet';

export type LedgerAccountType = 
  | 'USER_AVAILABLE'
  | 'USER_LOCKED'
  | 'PLATFORM_TREASURY'
  | 'PLATFORM_FEE'
  | 'GAME_ESCROW'
  | 'CROSS_CHAIN_ROUTING'
  | 'COLD_STORAGE';

export type LedgerEntryType = 'DEBIT' | 'CREDIT';

export type DepositStatus = 
  | 'DETECTED'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'REORGED'
  | 'RECONCILIATION_REQUIRED';

export type WithdrawalStatus = 
  | 'PENDING'
  | 'QUEUED'
  | 'REBALANCING'
  | 'SIGNING'
  | 'BROADCAST'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'REJECTED'
  | 'REQUIRES_REVIEW';

export type CrossChainRebalanceStatus =
  | 'CREATED'
  | 'QUOTED'
  | 'APPROVED'
  | 'SUBMITTED'
  | 'SOURCE_CONFIRMED'
  | 'DESTINATION_PENDING'
  | 'DESTINATION_CONFIRMED'
  | 'LIQUIDITY_AVAILABLE'
  | 'FAILED'
  | 'EXPIRED'
  | 'REQUIRES_REVIEW'
  | 'COMPLETED';

export type BlockchainTxType = 
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'REBALANCE'
  | 'GAS_SWEEP'
  | 'TREASURY_TRANSFER';

export interface SupportedNetworkConfig {
  networkKey: string;
  name: string;
  chainId: number;
  env: BlockchainEnv;
  rpcUrls: string[];
  explorerUrl: string;
  nativeGasToken: {
    symbol: string;
    name: string;
    decimals: number;
  };
  usdtContractAddress: string;
  usdtDecimals: number;
  requiredConfirmations: number;
  minDepositUsdt: string;
  minWithdrawalUsdt: string;
  withdrawalFeeUsdt: string;
  isDepositEnabled: boolean;
  isWithdrawalEnabled: boolean;
  isEnabled: boolean;
}

export interface UserWalletSummary {
  userId: string;
  asset: 'USDT';
  availableBalance: string; // String-encoded fixed decimal (e.g. "80.000000")
  lockedBalance: string;
  totalBalance: string;
  formattedAvailable: string; // e.g. "$80.00"
  formattedTotal: string;
  status: 'ACTIVE' | 'FROZEN' | 'SUSPENDED';
  updatedAt: string;
}

export interface DepositRecord {
  id: string;
  userId: string;
  networkKey: string;
  chainId: number;
  txHash: string;
  logIndex: number;
  fromAddress: string;
  toAddress: string;
  tokenContract: string;
  rawAmount: string;
  amount: string; // Human-readable USDT (e.g. "10.000000")
  confirmations: number;
  requiredConfirmations: number;
  status: DepositStatus;
  blockNumber: number;
  createdAt: string;
  confirmedAt?: string;
  explorerUrl: string;
}

export interface WithdrawalRecord {
  id: string;
  userId: string;
  networkKey: string;
  chainId: number;
  destinationAddress: string;
  amount: string; // Gross amount requested
  feeAmount: string; // Platform fee
  netAmount: string; // Amount broadcast on-chain
  status: WithdrawalStatus;
  txHash?: string;
  nonce?: number;
  blockNumber?: number;
  confirmations?: number;
  requiredConfirmations: number;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
  explorerUrl?: string;
}

export interface TreasuryBalanceInfo {
  networkKey: string;
  name: string;
  chainId: number;
  treasuryAddress: string;
  usdtBalance: string;
  usdtDecimals: number;
  nativeGasBalance: string;
  nativeGasSymbol: string;
  minLiquidityThresholdUsdt: string;
  targetLiquidityUsdt: string;
  status: 'HEALTHY' | 'LOW_LIQUIDITY' | 'LOW_GAS' | 'CRITICAL';
  lastSyncedAt: string;
}

export interface ReconciliationReport {
  id: string;
  status: 'BALANCED' | 'DISCREPANCY_FOUND' | 'RESOLVED';
  totalUserLiabilitiesUsdt: string;
  totalTreasuryAssetsUsdt: string;
  differenceUsdt: string;
  activeDepositsCount: number;
  activeWithdrawalsCount: number;
  ledgerEntriesCount: number;
  discrepancies: Array<{
    type: string;
    details: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  generatedAt: string;
}
