import { getAddress, isAddress } from 'ethers';
import { SupportedNetworkConfig, BlockchainEnv } from './types';
import { Logger } from '../config/env';

/**
 * Hardcoded registry of the 7 supported EVM networks in PRODUCTION MAINNET mode.
 * Authoritative, verified Tether USD (USDT) contracts & production RPCs.
 */
const BASE_MAINNET_REGISTRY: Record<string, SupportedNetworkConfig> = {
  ethereum: {
    networkKey: 'ethereum',
    name: 'Ethereum Mainnet',
    chainId: 1,
    env: 'mainnet',
    rpcUrls: [
      process.env.ETH_MAINNET_RPC || 'https://eth.llamarpc.com',
      'https://ethereum-rpc.publicnode.com',
      'https://rpc.ankr.com/eth',
      'https://1.rpc.thirdweb.com',
      'https://cloudflare-eth.com',
    ],
    explorerUrl: 'https://etherscan.io',
    nativeGasToken: {
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
    },
    // Official Tether USD (USDT) on Ethereum Mainnet
    usdtContractAddress: process.env.ETH_MAINNET_USDT_CONTRACT || '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    usdtDecimals: 6,
    requiredConfirmations: 12,
    minDepositUsdt: '5.00',
    minWithdrawalUsdt: '10.00',
    withdrawalFeeUsdt: '3.50',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true,
  },
  arbitrum: {
    networkKey: 'arbitrum',
    name: 'Arbitrum One',
    chainId: 42161,
    env: 'mainnet',
    rpcUrls: [
      process.env.ARB_MAINNET_RPC || 'https://arb1.arbitrum.io/rpc',
      'https://arbitrum-one-rpc.publicnode.com',
      'https://rpc.ankr.com/arbitrum',
      'https://42161.rpc.thirdweb.com',
    ],
    explorerUrl: 'https://arbiscan.io',
    nativeGasToken: {
      symbol: 'ETH',
      name: 'Arbitrum Ether',
      decimals: 18,
    },
    // Official Native Tether USD (USDT) on Arbitrum One
    usdtContractAddress: process.env.ARB_MAINNET_USDT_CONTRACT || '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    usdtDecimals: 6,
    requiredConfirmations: 20,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.30',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true,
  },
  bsc: {
    networkKey: 'bsc',
    name: 'BNB Smart Chain',
    chainId: 56,
    env: 'mainnet',
    rpcUrls: [
      process.env.BSC_MAINNET_RPC || 'https://bsc-dataseed.binance.org',
      'https://bsc-rpc.publicnode.com',
      'https://rpc.ankr.com/bsc',
      'https://56.rpc.thirdweb.com',
    ],
    explorerUrl: 'https://bscscan.com',
    nativeGasToken: {
      symbol: 'BNB',
      name: 'BNB Token',
      decimals: 18,
    },
    // Official Binance-pegged BSC-USD (USDT)
    usdtContractAddress: process.env.BSC_MAINNET_USDT_CONTRACT || '0x55d398326f99059fF775485246999027B3197955',
    usdtDecimals: 18,
    requiredConfirmations: 15,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.30',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true,
  },
  polygon: {
    networkKey: 'polygon',
    name: 'Polygon PoS',
    chainId: 137,
    env: 'mainnet',
    rpcUrls: [
      process.env.POLYGON_MAINNET_RPC || 'https://polygon-rpc.com',
      'https://polygon-bor-rpc.publicnode.com',
      'https://rpc.ankr.com/polygon',
      'https://137.rpc.thirdweb.com',
    ],
    explorerUrl: 'https://polygonscan.com',
    nativeGasToken: {
      symbol: 'POL',
      name: 'Polygon Ecosystem Token',
      decimals: 18,
    },
    // Official PoS Tether USD (USDT) on Polygon
    usdtContractAddress: process.env.POLYGON_MAINNET_USDT_CONTRACT || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    usdtDecimals: 6,
    requiredConfirmations: 30,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.25',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true,
  },
  base: {
    networkKey: 'base',
    name: 'Base Mainnet',
    chainId: 8453,
    env: 'mainnet',
    rpcUrls: [
      process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org',
      'https://base-rpc.publicnode.com',
      'https://rpc.ankr.com/base',
      'https://8453.rpc.thirdweb.com',
    ],
    explorerUrl: 'https://basescan.org',
    nativeGasToken: {
      symbol: 'ETH',
      name: 'Base Ether',
      decimals: 18,
    },
    // Official Native Tether USD (USDT) on Base
    usdtContractAddress: process.env.BASE_MAINNET_USDT_CONTRACT || '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    usdtDecimals: 6,
    requiredConfirmations: 15,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.25',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true,
  },
  optimism: {
    networkKey: 'optimism',
    name: 'Optimism Mainnet',
    chainId: 10,
    env: 'mainnet',
    rpcUrls: [
      process.env.OP_MAINNET_RPC || 'https://mainnet.optimism.io',
      'https://optimism-rpc.publicnode.com',
      'https://rpc.ankr.com/optimism',
      'https://10.rpc.thirdweb.com',
    ],
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeGasToken: {
      symbol: 'ETH',
      name: 'Optimism Ether',
      decimals: 18,
    },
    // Official Native Tether USD (USDT) on Optimism
    usdtContractAddress: process.env.OP_MAINNET_USDT_CONTRACT || '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    usdtDecimals: 6,
    requiredConfirmations: 15,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.25',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true,
  },
  avalanche: {
    networkKey: 'avalanche',
    name: 'Avalanche C-Chain',
    chainId: 43114,
    env: 'mainnet',
    rpcUrls: [
      process.env.AVAX_MAINNET_RPC || 'https://api.avax.network/ext/bc/C/rpc',
      'https://avalanche-c-chain-rpc.publicnode.com',
      'https://rpc.ankr.com/avalanche',
      'https://43114.rpc.thirdweb.com',
    ],
    explorerUrl: 'https://snowtrace.io',
    nativeGasToken: {
      symbol: 'AVAX',
      name: 'Avalanche Token',
      decimals: 18,
    },
    // Official Native Tether USD (USDt) on Avalanche C-Chain
    usdtContractAddress: process.env.AVAX_MAINNET_USDT_CONTRACT || '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    usdtDecimals: 6,
    requiredConfirmations: 12,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.30',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true,
  },
};

/**
 * Hardcoded registry of the 7 supported EVM networks in TESTNET mode.
 */
const BASE_TESTNET_REGISTRY: Record<string, SupportedNetworkConfig> = {
  ethereum: {
    networkKey: 'ethereum',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    env: 'testnet',
    rpcUrls: [
      process.env.ETH_SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com',
      'https://rpc.sepolia.org',
      'https://sepolia.drpc.org',
      'https://11155111.rpc.thirdweb.com',
    ],
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeGasToken: {
      symbol: 'ETH',
      name: 'Sepolia Ether',
      decimals: 18,
    },
    usdtContractAddress: process.env.SEPOLIA_USDT_CONTRACT || '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
    usdtDecimals: 6,
    requiredConfirmations: 2,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.50',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true,
  },
  arbitrum: {
    networkKey: 'arbitrum',
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    env: 'testnet',
    rpcUrls: [
      process.env.ARB_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
      'https://arbitrum-sepolia-rpc.publicnode.com',
      'https://arbitrum-sepolia.drpc.org',
      'https://421614.rpc.thirdweb.com',
    ],
    explorerUrl: 'https://sepolia.arbiscan.io',
    nativeGasToken: {
      symbol: 'ETH',
      name: 'Arbitrum Sepolia Ether',
      decimals: 18,
    },
    usdtContractAddress: process.env.ARB_SEPOLIA_USDT_CONTRACT || '0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d',
    usdtDecimals: 6,
    requiredConfirmations: 3,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.20',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true,
  },
  bsc: {
    networkKey: 'bsc',
    name: 'BNB Smart Chain Testnet',
    chainId: 97,
    env: 'testnet',
    rpcUrls: [
      process.env.BSC_TESTNET_RPC || 'https://bsc-testnet-rpc.publicnode.com',
      'https://data-seed-prebsc-1-s1.binance.org:8545',
      'https://bsc-testnet.public.blastapi.io',
    ],
    explorerUrl: 'https://testnet.bscscan.com',
    nativeGasToken: {
      symbol: 'tBNB',
      name: 'Testnet BNB',
      decimals: 18,
    },
    usdtContractAddress: process.env.BSC_TESTNET_USDT_CONTRACT || '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
    usdtDecimals: 18,
    requiredConfirmations: 3,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.25',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true,
  },
  polygon: {
    networkKey: 'polygon',
    name: 'Polygon Amoy Testnet',
    chainId: 80002,
    env: 'testnet',
    rpcUrls: [
      process.env.POLYGON_AMOY_RPC || 'https://polygon-amoy-bor-rpc.publicnode.com',
      'https://rpc.ankr.com/polygon_amoy',
      'https://polygon-amoy.drpc.org',
      'https://80002.rpc.thirdweb.com',
    ],
    explorerUrl: 'https://amoy.polygonscan.com',
    nativeGasToken: {
      symbol: 'POL',
      name: 'Polygon Ecosystem Token',
      decimals: 18,
    },
    usdtContractAddress: process.env.POLYGON_AMOY_USDT_CONTRACT || '0x1fdE0eCc619726f4cA597887C9F39F18361B144a',
    usdtDecimals: 6,
    requiredConfirmations: 5,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.15',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true,
  },
  base: {
    networkKey: 'base',
    name: 'Base Sepolia',
    chainId: 84532,
    env: 'testnet',
    rpcUrls: [
      process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
      'https://base-sepolia-rpc.publicnode.com',
      'https://base-sepolia.drpc.org',
      'https://84532.rpc.thirdweb.com',
    ],
    explorerUrl: 'https://sepolia.basescan.org',
    nativeGasToken: {
      symbol: 'ETH',
      name: 'Base Sepolia Ether',
      decimals: 18,
    },
    usdtContractAddress: process.env.BASE_SEPOLIA_USDT_CONTRACT || '0x7a8c6c5E3f7bC6A4dC9Eb7A6B5393d258169993E',
    usdtDecimals: 6,
    requiredConfirmations: 3,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.20',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true,
  },
  optimism: {
    networkKey: 'optimism',
    name: 'Optimism Sepolia',
    chainId: 11155420,
    env: 'testnet',
    rpcUrls: [
      process.env.OP_SEPOLIA_RPC || 'https://sepolia.optimism.io',
      'https://optimism-sepolia-rpc.publicnode.com',
      'https://op-sepolia.drpc.org',
      'https://11155420.rpc.thirdweb.com',
    ],
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
    nativeGasToken: {
      symbol: 'ETH',
      name: 'Optimism Sepolia Ether',
      decimals: 18,
    },
    usdtContractAddress: process.env.OP_SEPOLIA_USDT_CONTRACT || '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    usdtDecimals: 6,
    requiredConfirmations: 3,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.20',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true,
  },
  avalanche: {
    networkKey: 'avalanche',
    name: 'Avalanche Fuji',
    chainId: 43113,
    env: 'testnet',
    rpcUrls: [
      process.env.AVAX_FUJI_RPC || 'https://api.avax-test.network/ext/bc/C/rpc',
      'https://avalanche-fuji-c-chain-rpc.publicnode.com',
      'https://avalanche-fuji.drpc.org',
      'https://43113.rpc.thirdweb.com',
    ],
    explorerUrl: 'https://testnet.snowtrace.io',
    nativeGasToken: {
      symbol: 'AVAX',
      name: 'Avalanche Token',
      decimals: 18,
    },
    usdtContractAddress: process.env.AVAX_FUJI_USDT_CONTRACT || '0xAb5C49580294Aff77670F839ea425f5b78ab3Ae7',
    usdtDecimals: 6,
    requiredConfirmations: 2,
    minDepositUsdt: '1.00',
    minWithdrawalUsdt: '2.00',
    withdrawalFeeUsdt: '0.25',
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true,
  },
};

export class NetworkRegistry {
  private static networks: Map<string, SupportedNetworkConfig> = new Map();
  private static isInitialized = false;
  // Production default is mainnet, dynamically switchable at runtime with 1 click
  private static activeEnv: BlockchainEnv = (process.env.BLOCKCHAIN_ENV as BlockchainEnv) || 'mainnet';
  private static adminServiceFeePercent: number = 1.0; // 1% admin service fee default
  private static minAdminServiceFeeUsdt: string = '0.10';

  public static getBlockchainEnv(): BlockchainEnv {
    return this.activeEnv;
  }

  /**
   * 1-Click Environment Switcher for Admin Panel
   * Allows instant hot-swapping between Production Mainnet and Testnet mode
   */
  public static setBlockchainEnv(env: BlockchainEnv): void {
    if (env !== 'mainnet' && env !== 'testnet') {
      throw new Error(`Invalid environment mode: ${env}. Must be 'mainnet' or 'testnet'.`);
    }
    this.activeEnv = env;
    this.isInitialized = false;
    this.initialize();
    Logger.warn(`🚀 [WALLET MODE SWITCH] System active blockchain mode set to [${env.toUpperCase()}]`);
  }

  public static getAdminServiceFeeConfig(): { feePercent: number; minFeeUsdt: string } {
    return {
      feePercent: this.adminServiceFeePercent,
      minFeeUsdt: this.minAdminServiceFeeUsdt,
    };
  }

  public static setAdminServiceFeeConfig(feePercent: number, minFeeUsdt: string): void {
    if (feePercent < 0 || feePercent > 20) {
      throw new Error('Admin service fee percent must be between 0% and 20%');
    }
    this.adminServiceFeePercent = feePercent;
    this.minAdminServiceFeeUsdt = minFeeUsdt;
    Logger.info(`Updated Admin Service Fee: ${feePercent}% (min ${minFeeUsdt} USDT)`);
  }

  public static initialize(): void {
    this.networks.clear();
    const currentEnv = this.getBlockchainEnv();
    const sourceRegistry = currentEnv === 'mainnet' ? BASE_MAINNET_REGISTRY : BASE_TESTNET_REGISTRY;

    Logger.info(`Initializing Blockchain Network Registry in [${currentEnv.toUpperCase()}] mode`);

    for (const [key, config] of Object.entries(sourceRegistry)) {
      const rawContract = (config.usdtContractAddress || '').trim().toLowerCase();
      // Validate contract address format
      if (!isAddress(rawContract)) {
        throw new Error(`[CONFIG ERROR] Invalid USDT contract address for network ${key}: ${config.usdtContractAddress}`);
      }

      const checksummedContract = getAddress(rawContract);
      const validatedConfig: SupportedNetworkConfig = {
        ...config,
        usdtContractAddress: checksummedContract,
      };

      this.networks.set(key, validatedConfig);
      this.networks.set(String(config.chainId), validatedConfig); // Index by chainId as well
    }

    this.isInitialized = true;
    Logger.info(`Blockchain Network Registry loaded 7 networks successfully in [${currentEnv.toUpperCase()}] mode.`);
  }

  public static getAllSupportedNetworks(): SupportedNetworkConfig[] {
    this.ensureInitialized();
    // Return only unique network configurations (filter out numeric chainId aliases)
    const unique = new Map<string, SupportedNetworkConfig>();
    for (const [key, config] of this.networks.entries()) {
      if (isNaN(Number(key))) {
        unique.set(key, config);
      }
    }
    return Array.from(unique.values());
  }

  public static getNetwork(keyOrChainId: string | number): SupportedNetworkConfig {
    this.ensureInitialized();
    const config = this.networks.get(String(keyOrChainId).toLowerCase());
    if (!config) {
      throw new Error(`[NETWORK REGISTRY ERROR] Network "${keyOrChainId}" is not in the supported EVM networks for ${this.activeEnv}.`);
    }
    return config;
  }

  public static getNetworkByChainId(chainId: number): SupportedNetworkConfig {
    return this.getNetwork(chainId);
  }

  public static isChainSupported(chainId: number): boolean {
    this.ensureInitialized();
    return this.networks.has(String(chainId));
  }

  public static normalizeAddress(address: string): string {
    const raw = (address || '').trim().toLowerCase();
    if (!isAddress(raw)) {
      throw new Error(`Invalid EVM address: ${address}`);
    }
    return getAddress(raw);
  }

  private static ensureInitialized(): void {
    if (!this.isInitialized) {
      this.initialize();
    }
  }
}
