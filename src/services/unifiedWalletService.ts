export interface SupportedNetwork {
  networkKey: string;
  name: string;
  chainId: number;
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
  feeAmount: string;
  netAmount: string;
  minWithdrawal: string;
  isExecutable: boolean;
}

export const DEFAULT_SUPPORTED_NETWORKS: SupportedNetwork[] = [
  {
    networkKey: 'optimism',
    name: 'Optimism Sepolia',
    chainId: 11155420,
    nativeGasToken: { symbol: 'ETH', name: 'Optimism Sepolia Ether', decimals: 18 },
    usdtContractAddress: '0x5FD84259d66Cd46123540766Be93DFE6D43130D7',
    usdtDecimals: 6,
    requiredConfirmations: 2,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '5.00',
    withdrawalFeeUsdt: '0.50',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
  },
  {
    networkKey: 'ethereum',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    nativeGasToken: { symbol: 'ETH', name: 'Sepolia Ether', decimals: 18 },
    usdtContractAddress: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
    usdtDecimals: 6,
    requiredConfirmations: 2,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '5.00',
    withdrawalFeeUsdt: '1.00',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    explorerUrl: 'https://sepolia.etherscan.io',
  },
  {
    networkKey: 'arbitrum',
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    nativeGasToken: { symbol: 'ETH', name: 'Arbitrum Sepolia Ether', decimals: 18 },
    usdtContractAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    usdtDecimals: 6,
    requiredConfirmations: 2,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '5.00',
    withdrawalFeeUsdt: '0.50',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    explorerUrl: 'https://sepolia.arbiscan.io',
  },
  {
    networkKey: 'bsc',
    name: 'BNB Smart Chain Testnet',
    chainId: 97,
    nativeGasToken: { symbol: 'tBNB', name: 'Testnet BNB', decimals: 18 },
    usdtContractAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
    usdtDecimals: 18,
    requiredConfirmations: 3,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '5.00',
    withdrawalFeeUsdt: '0.50',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    explorerUrl: 'https://testnet.bscscan.com',
  },
  {
    networkKey: 'polygon',
    name: 'Polygon Amoy Testnet',
    chainId: 80002,
    nativeGasToken: { symbol: 'POL', name: 'Polygon Testnet Token', decimals: 18 },
    usdtContractAddress: '0x1Fd430BC26E5FE9152b1ebB8f86f3f090c29Fa4a',
    usdtDecimals: 6,
    requiredConfirmations: 3,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '5.00',
    withdrawalFeeUsdt: '0.50',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    explorerUrl: 'https://amoy.polygonscan.com',
  },
  {
    networkKey: 'base',
    name: 'Base Sepolia',
    chainId: 84532,
    nativeGasToken: { symbol: 'ETH', name: 'Base Sepolia Ether', decimals: 18 },
    usdtContractAddress: '0xEEE24A06f47738f657a7E38B31c4f4a34b22c60f',
    usdtDecimals: 6,
    requiredConfirmations: 2,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '5.00',
    withdrawalFeeUsdt: '0.50',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    explorerUrl: 'https://sepolia.basescan.org',
  },
  {
    networkKey: 'avalanche',
    name: 'Avalanche Fuji',
    chainId: 43113,
    nativeGasToken: { symbol: 'AVAX', name: 'Avalanche Testnet AVAX', decimals: 18 },
    usdtContractAddress: '0x5425890298aed601595a70ab815c96711a31bc65',
    usdtDecimals: 6,
    requiredConfirmations: 2,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '5.00',
    withdrawalFeeUsdt: '0.50',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    explorerUrl: 'https://testnet.snowtrace.io',
  },
];

const API_BASE = '';

export class UnifiedWalletService {
  private static cachedNetworks: SupportedNetwork[] = DEFAULT_SUPPORTED_NETWORKS;
  private static depositAddressCache: Map<string, DepositInfo> = new Map();
  private static cachedWalletData: Map<string, UserWalletData> = new Map();

  public static getCachedNetworks(): SupportedNetwork[] {
    return this.cachedNetworks;
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
        return data.networks;
      }
    } catch (err) {
      console.warn('Using cached network registry:', err);
    }
    return this.cachedNetworks;
  }

  public static async fetchDepositAddress(userId: string, networkKey: string): Promise<DepositInfo> {
    const cacheKey = `${userId}_${networkKey}`;
    if (this.depositAddressCache.has(cacheKey)) {
      // Return cached instantly and refresh in background
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
    
    // Cache for all EVM networks if address is shared
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
}
