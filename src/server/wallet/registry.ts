import { getAddress, isAddress } from 'ethers';
import { SupportedNetworkConfig, BlockchainEnv } from './types';
import { Logger } from '../config/env';

/**
 * Hardcoded registry of the 7 supported EVM networks.
 * Current Phase: TESTNET ONLY.
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
    // Official / Authoritative Sepolia USDT Contract
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
    // BSC Testnet official Binance-pegged USDT
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

  public static getBlockchainEnv(): BlockchainEnv {
    const env = (process.env.BLOCKCHAIN_ENV || 'testnet').toLowerCase();
    if (env !== 'testnet') {
      // Hard safety constraint: Refuse mainnet at this phase
      throw new Error(
        `[SECURITY ERROR] BLOCKCHAIN_ENV="${env}" is forbidden. This platform is currently locked to TESTNET ONLY for safety.`
      );
    }
    return 'testnet';
  }

  public static initialize(): void {
    if (this.isInitialized) return;

    const currentEnv = this.getBlockchainEnv();
    Logger.info(`Initializing Blockchain Network Registry in [${currentEnv.toUpperCase()}] mode`);

    for (const [key, config] of Object.entries(BASE_TESTNET_REGISTRY)) {
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
      this.networks.set(String(config.chainId), validatedConfig); // Also index by chainId
    }

    this.isInitialized = true;
    Logger.info(`Blockchain Network Registry loaded 7 hardcoded testnet networks securely.`);
  }

  public static getAllSupportedNetworks(): SupportedNetworkConfig[] {
    this.ensureInitialized();
    // Return only unique network configurations
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
      throw new Error(`[NETWORK REGISTRY ERROR] Network "${keyOrChainId}" is not in the hardcoded 7 supported EVM networks.`);
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
