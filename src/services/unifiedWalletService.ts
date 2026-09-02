export interface SupportedNetwork {
  networkKey: string;
  name: string;
  chainId: number;
  env?: 'mainnet' | 'testnet';
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
  explorerUrl: string;
}

export interface UserWalletData {
  userId: string;
  asset: 'USDT';
  availableBalance: string;
  lockedBalance: string;
  totalBalance: string;
  formattedAvailable: string;
  formattedTotal: string;
  status: 'ACTIVE' | 'FROZEN' | 'SUSPENDED';
  updatedAt: string;
}

export interface DepositInfo {
  networkKey: string;
  chainId: number;
  address: string;
  usdtContractAddress: string;
  minDeposit: string;
  requiredConfirmations: number;
  explorerUrl: string;
}

export interface DepositItem {
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
  amount: string;
  confirmations: number;
  requiredConfirmations: number;
  status: 'DETECTED' | 'CONFIRMING' | 'CONFIRMED' | 'REJECTED' | 'REORGED';
  blockNumber: number;
  createdAt: string;
  confirmedAt?: string;
  explorerUrl: string;
}

export interface WithdrawalItem {
  id: string;
  userId: string;
  networkKey: string;
  chainId: number;
  destinationAddress: string;
  amount: string;
  feeAmount: string;
  netAmount: string;
  status: 'PENDING' | 'QUEUED' | 'REBALANCING' | 'SIGNING' | 'BROADCAST' | 'CONFIRMING' | 'CONFIRMED' | 'FAILED' | 'REJECTED';
  txHash?: string;
  nonce?: number;
  blockNumber?: number;
  confirmations?: number;
  requiredConfirmations: number;
  failureReason?: string;
  createdAt: string;
  completedAt?: string;
  explorerUrl?: string;
}

export interface WithdrawalQuote {
  networkKey: string;
  amount: string;
  networkGasFee?: string;
  adminServiceFee?: string;
  feeAmount: string;
  netAmount: string;
  minWithdrawal: string;
  isExecutable: boolean;
}

export interface GasEstimateItem {
  networkKey: string;
  chainId: number;
  gasPriceGwei: string;
  estimatedGasUnits: number;
  nativeGasFee: string;
  nativeGasSymbol: string;
  estimatedUsdtFee: string;
  lastUpdated: string;
}

export interface CrossChainQuoteData {
  quoteId: string;
  sourceNetworkKey: string;
  destNetworkKey: string;
  amountUsdt: string;
  bridgeFeeUsdt: string;
  adminServiceFeeUsdt: string;
  totalFeeUsdt: string;
  netDestinationAmountUsdt: string;
  estimatedDurationSeconds: number;
  provider: string;
}

export const DEFAULT_MAINNET_NETWORKS: SupportedNetwork[] = [
  {
    networkKey: 'optimism',
    name: 'Optimism Mainnet',
    chainId: 10,
    env: 'mainnet',
    nativeGasToken: { symbol: 'ETH', name: 'Optimism Ether', decimals: 18 },
    usdtContractAddress: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    usdtDecimals: 6,
    requiredConfirmations: 15,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.25',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    explorerUrl: 'https://optimistic.etherscan.io',
  },
  {
    networkKey: 'ethereum',
    name: 'Ethereum Mainnet',
    chainId: 1,
    env: 'mainnet',
    nativeGasToken: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    usdtContractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    usdtDecimals: 6,
    requiredConfirmations: 12,
    minDepositUsdt: '5.00',
    minWithdrawalUsdt: '10.00',
    withdrawalFeeUsdt: '3.50',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    explorerUrl: 'https://etherscan.io',
  },
  {
    networkKey: 'arbitrum',
    name: 'Arbitrum One',
    chainId: 42161,
    env: 'mainnet',
    nativeGasToken: { symbol: 'ETH', name: 'Arbitrum Ether', decimals: 18 },
    usdtContractAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    usdtDecimals: 6,
    requiredConfirmations: 20,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.30',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    explorerUrl: 'https://arbiscan.io',
  },
  {
    networkKey: 'bsc',
    name: 'BNB Smart Chain',
    chainId: 56,
    env: 'mainnet',
    nativeGasToken: { symbol: 'BNB', name: 'BNB Token', decimals: 18 },
    usdtContractAddress: '0x55d398326f99059fF775485246999027B3197955',
    usdtDecimals: 18,
    requiredConfirmations: 15,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.30',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    explorerUrl: 'https://bscscan.com',
  },
  {
    networkKey: 'polygon',
    name: 'Polygon PoS',
    chainId: 137,
    env: 'mainnet',
    nativeGasToken: { symbol: 'POL', name: 'Polygon Ecosystem Token', decimals: 18 },
    usdtContractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    usdtDecimals: 6,
    requiredConfirmations: 30,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.25',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    explorerUrl: 'https://polygonscan.com',
  },
  {
    networkKey: 'base',
    name: 'Base Mainnet',
    chainId: 8453,
    env: 'mainnet',
    nativeGasToken: { symbol: 'ETH', name: 'Base Ether', decimals: 18 },
    usdtContractAddress: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    usdtDecimals: 6,
    requiredConfirmations: 15,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.25',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    explorerUrl: 'https://basescan.org',
  },
  {
    networkKey: 'avalanche',
    name: 'Avalanche C-Chain',
    chainId: 43114,
    env: 'mainnet',
    nativeGasToken: { symbol: 'AVAX', name: 'Avalanche Token', decimals: 18 },
    usdtContractAddress: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    usdtDecimals: 6,
    requiredConfirmations: 12,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.30',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    explorerUrl: 'https://snowtrace.io',
  },
];

export const DEFAULT_SUPPORTED_NETWORKS = DEFAULT_MAINNET_NETWORKS;

const API_BASE = '';

export class UnifiedWalletService {
  private static cachedNetworks: SupportedNetwork[] = DEFAULT_MAINNET_NETWORKS;
  private static activeEnv: 'mainnet' | 'testnet' = 'mainnet';
  private static depositAddressCache: Map<string, DepositInfo> = new Map();
  private static cachedWalletData: Map<string, UserWalletData> = new Map();

  public static getCachedNetworks(): SupportedNetwork[] {
    return this.cachedNetworks;
  }

  public static getActiveEnv(): 'mainnet' | 'testnet' {
    return this.activeEnv;
  }

  public static getCachedDepositAddress(userId: string, networkKey: string): DepositInfo | null {
    return this.depositAddressCache.get(`${userId}_${networkKey}`) || null;
  }

  public static getCachedWallet(userId: string): UserWalletData | null {
    return this.cachedWalletData.get(userId) || null;
  }

  private static getHeaders(userId?: string): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (userId) {
      headers['x-user-id'] = userId;
    }
    return headers;
  }

  public static async fetchWallet(userId: string): Promise<UserWalletData> {
    try {
      const res = await fetch(`${API_BASE}/api/wallet?userId=${encodeURIComponent(userId)}`, {
        headers: this.getHeaders(userId),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch wallet');
      if (data.env) {
        this.activeEnv = data.env;
      }
      this.cachedWalletData.set(userId, data.wallet);
      return data.wallet;
    } catch (err) {
      if (this.cachedWalletData.has(userId)) {
        return this.cachedWalletData.get(userId)!;
      }
      throw err;
    }
  }

  public static async fetchNetworks(): Promise<SupportedNetwork[]> {
    try {
      const res = await fetch(`${API_BASE}/api/wallet/networks`);
      const data = await res.json();
      if (data.success && Array.isArray(data.networks) && data.networks.length > 0) {
        this.cachedNetworks = data.networks;
        if (data.env) {
          this.activeEnv = data.env;
        }
        return data.networks;
      }
    } catch (err) {
      console.warn('Using cached network registry:', err);
    }
    return this.cachedNetworks;
  }

  public static async fetchGasEstimates(): Promise<GasEstimateItem[]> {
    try {
      const res = await fetch(`${API_BASE}/api/wallet/gas-estimate`);
      const data = await res.json();
      if (data.success && Array.isArray(data.estimates)) {
        return data.estimates;
      }
    } catch (err) {
      console.warn('Failed to fetch live gas estimates:', err);
    }
    return [];
  }

  public static async fetchCrossChainQuote(source: string, dest: string, amount: string): Promise<CrossChainQuoteData> {
    const res = await fetch(
      `${API_BASE}/api/wallet/cross-chain-quote?source=${encodeURIComponent(source)}&dest=${encodeURIComponent(dest)}&amount=${encodeURIComponent(amount)}`
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch cross chain quote');
    return data.quote;
  }

  public static async fetchDepositAddress(userId: string, networkKey: string): Promise<DepositInfo> {
    const cacheKey = `${userId}_${networkKey}`;
    if (this.depositAddressCache.has(cacheKey)) {
      const cached = this.depositAddressCache.get(cacheKey)!;
      this.fetchDepositAddressRemote(userId, networkKey).catch(() => {});
      return cached;
    }

    return this.fetchDepositAddressRemote(userId, networkKey);
  }

  private static async fetchDepositAddressRemote(userId: string, networkKey: string): Promise<DepositInfo> {
    const cacheKey = `${userId}_${networkKey}`;
    const res = await fetch(
      `${API_BASE}/api/wallet/deposit/address?userId=${encodeURIComponent(userId)}&networkKey=${encodeURIComponent(networkKey)}`,
      { headers: this.getHeaders(userId) }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch deposit address');
    
    if (data.env) {
      this.activeEnv = data.env;
    }

    const info: DepositInfo = data.depositInfo;
    this.depositAddressCache.set(cacheKey, info);

    // Warm-up cache for all other networks using the same custodial address
    for (const net of this.cachedNetworks) {
      const otherKey = `${userId}_${net.networkKey}`;
      if (!this.depositAddressCache.has(otherKey)) {
        this.depositAddressCache.set(otherKey, {
          networkKey: net.networkKey,
          chainId: net.chainId,
          address: info.address,
          usdtContractAddress: net.usdtContractAddress,
          minDeposit: `${net.minDepositUsdt} USDT`,
          requiredConfirmations: net.requiredConfirmations,
          explorerUrl: `${net.explorerUrl}/address/${info.address}`,
        });
      }
    }

    return info;
  }

  public static async fetchDeposits(userId: string): Promise<DepositItem[]> {
    const res = await fetch(`${API_BASE}/api/wallet/deposits?userId=${encodeURIComponent(userId)}`, {
      headers: this.getHeaders(userId),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch deposits');
    return data.deposits || [];
  }

  public static async trackDeposit(userId: string, networkKey: string, txHash: string, amount?: string): Promise<DepositItem> {
    const res = await fetch(`${API_BASE}/api/wallet/deposits/track`, {
      method: 'POST',
      headers: this.getHeaders(userId),
      body: JSON.stringify({ networkKey, txHash, amount }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to track deposit');
    return data.deposit;
  }

  public static async quoteWithdrawal(networkKey: string, amountUsdt: string): Promise<WithdrawalQuote> {
    const res = await fetch(`${API_BASE}/api/wallet/withdrawals/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ networkKey, amountUsdt }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to get withdrawal quote');
    return data.quote;
  }

  public static async requestWithdrawal(
    userId: string,
    networkKey: string,
    destinationAddress: string,
    amountUsdt: string
  ): Promise<WithdrawalItem> {
    const res = await fetch(`${API_BASE}/api/wallet/withdrawals`, {
      method: 'POST',
      headers: this.getHeaders(userId),
      body: JSON.stringify({ networkKey, destinationAddress, amountUsdt }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to submit withdrawal');
    return data.withdrawal;
  }

  public static async fetchWithdrawals(userId: string): Promise<WithdrawalItem[]> {
    const res = await fetch(`${API_BASE}/api/wallet/withdrawals?userId=${encodeURIComponent(userId)}`, {
      headers: this.getHeaders(userId),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch withdrawals');
    return data.withdrawals || [];
  }

  /**
   * Pre-locks entry fee from user ledger for real cash match entry
   */
  public static async lockMatchEntry(params: {
    userId: string;
    username?: string;
    matchId?: string;
    gameMode: string;
    playerCount: number;
    entryFee: number;
    prizePool: number;
  }): Promise<{ success: boolean; matchId: string; lockedFee: number }> {
    const res = await fetch(`${API_BASE}/api/matches/lock-entry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': params.userId,
      },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to lock match entry fee');
    }
    return data;
  }

  /**
   * Settles match outcome authoritatively: debits entry fee from loser, credits net prize pool to winner
   */
  public static async settleMatchOutcome(params: {
    matchId: string;
    gameMode?: string;
    winnerUserId: string;
    winnerName?: string;
    winnerColor?: string;
    entryFee?: number;
    prizePool?: number;
    playerCount?: number;
    playerResults?: Array<{
      userId: string;
      username?: string;
      rank: number;
      finalScore?: number;
      tokensHome?: number;
      capturesMade?: number;
      totalDistanceMoved?: number;
      isHuman?: boolean;
    }>;
    playerUsernames?: Record<string, string>;
  }): Promise<{
    success: boolean;
    settlementId: string;
    matchId: string;
    winnerUserId: string;
    grossPool: string;
    platformFee: string;
    prizePool: string;
    payoutTxId: string;
    userBalance?: string;
  }> {
    const res = await fetch(`${API_BASE}/api/matches/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': params.winnerUserId,
      },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to settle match outcome');
    }
    return data;
  }

  /**
   * Admin API: 1-Click Mode Switcher
   */
  public static async setAdminWalletMode(token: string, env: 'mainnet' | 'testnet'): Promise<any> {
    const res = await fetch(`${API_BASE}/api/admin/wallet/mode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ env }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to switch wallet mode');
    this.activeEnv = env;
    this.depositAddressCache.clear();
    return data;
  }
}
