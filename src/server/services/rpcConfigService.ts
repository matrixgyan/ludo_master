import { JsonRpcProvider } from 'ethers';
import { Logger } from '../config/env';
import { FileStorage } from '../storage/fileStorage';
import { NetworkRegistry } from '../wallet/registry';
import { BlockchainService } from '../wallet/blockchainService';

export interface NetworkRpcDetail {
  networkKey: string;
  name: string;
  chainId: number;
  env: 'mainnet' | 'testnet';
  currentActiveRpc: string;
  rpcUrls: string[];
  customRpcUrls: string[];
  nativeGasSymbol: string;
  explorerUrl: string;
  usdtContractAddress: string;
  usdtDecimals: number;
  requiredConfirmations: number;
  minDepositUsdt: string;
  minWithdrawalUsdt: string;
  withdrawalFeeUsdt: string;
  isDepositEnabled: boolean;
  isWithdrawalEnabled: boolean;
  isEnabled: boolean;
  status: 'healthy' | 'degraded' | 'error' | 'untested';
  latencyMs?: number;
  blockNumber?: number;
  lastTestedAt?: string;
  errorMessage?: string;
}

export interface RpcConfigStore {
  customRpcs: Record<string, string[]>;
  networkOverrides: Record<string, {
    usdtContractAddress?: string;
    requiredConfirmations?: number;
    minDepositUsdt?: string;
    minWithdrawalUsdt?: string;
    withdrawalFeeUsdt?: string;
    isDepositEnabled?: boolean;
    isWithdrawalEnabled?: boolean;
    isEnabled?: boolean;
  }>;
  lastUpdated: string;
}

const STORAGE_KEY = 'blockchain_rpc_configurations_v1';

export class RpcConfigService {
  private static cachedStore: RpcConfigStore | null = null;

  public static async getStore(): Promise<RpcConfigStore> {
    if (this.cachedStore) {
      return this.cachedStore;
    }

    try {
      const saved = await FileStorage.getItem<RpcConfigStore>(STORAGE_KEY);
      if (saved && saved.customRpcs) {
        this.cachedStore = saved;
      } else {
        this.cachedStore = {
          customRpcs: {},
          networkOverrides: {},
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch {
      this.cachedStore = {
        customRpcs: {},
        networkOverrides: {},
        lastUpdated: new Date().toISOString(),
      };
    }

    // Apply stored configs into NetworkRegistry
    this.applyStoreToRegistry(this.cachedStore);
    return this.cachedStore;
  }

  public static async saveStore(store: RpcConfigStore): Promise<void> {
    store.lastUpdated = new Date().toISOString();
    this.cachedStore = store;
    await FileStorage.setItem(STORAGE_KEY, store);
    this.applyStoreToRegistry(store);
    BlockchainService.clearProviders();
  }

  private static applyStoreToRegistry(store: RpcConfigStore): void {
    const allNetworks = NetworkRegistry.getAllSupportedNetworks();
    for (const net of allNetworks) {
      const custom = store.customRpcs[net.networkKey];
      if (custom && custom.length > 0) {
        // Prioritize custom admin configured RPCs at the front
        const validCustom = custom.filter((url) => typeof url === 'string' && url.trim().startsWith('http'));
        if (validCustom.length > 0) {
          net.rpcUrls = [...validCustom, ...net.rpcUrls.filter((u) => !validCustom.includes(u))];
        }
      }

      const overrides = store.networkOverrides[net.networkKey];
      if (overrides) {
        if (overrides.usdtContractAddress) net.usdtContractAddress = overrides.usdtContractAddress;
        if (overrides.requiredConfirmations !== undefined) net.requiredConfirmations = overrides.requiredConfirmations;
        if (overrides.minDepositUsdt !== undefined) net.minDepositUsdt = overrides.minDepositUsdt;
        if (overrides.minWithdrawalUsdt !== undefined) net.minWithdrawalUsdt = overrides.minWithdrawalUsdt;
        if (overrides.withdrawalFeeUsdt !== undefined) net.withdrawalFeeUsdt = overrides.withdrawalFeeUsdt;
        if (overrides.isDepositEnabled !== undefined) net.isDepositEnabled = overrides.isDepositEnabled;
        if (overrides.isWithdrawalEnabled !== undefined) net.isWithdrawalEnabled = overrides.isWithdrawalEnabled;
        if (overrides.isEnabled !== undefined) net.isEnabled = overrides.isEnabled;
      }
    }
  }

  public static async updateNetworkRpc(
    networkKey: string,
    primaryRpcUrl: string,
    fallbackUrls: string[] = []
  ): Promise<void> {
    const store = await this.getStore();
    const cleanPrimary = primaryRpcUrl.trim();
    const cleanFallbacks = fallbackUrls.map((u) => u.trim()).filter((u) => u && u.startsWith('http'));

    const list = [cleanPrimary, ...cleanFallbacks.filter((u) => u !== cleanPrimary)];
    store.customRpcs[networkKey] = list;

    await this.saveStore(store);
    Logger.info(`Updated custom RPC for network [${networkKey}] to: ${cleanPrimary}`);
  }

  public static async resetNetworkRpcToDefault(networkKey: string): Promise<void> {
    const store = await this.getStore();
    delete store.customRpcs[networkKey];
    await this.saveStore(store);
    NetworkRegistry.initialize();
    BlockchainService.clearProviders();
    Logger.info(`Reset network [${networkKey}] RPC to production defaults`);
  }

  public static async testRpcEndpoint(
    rpcUrl: string,
    expectedChainId?: number
  ): Promise<{
    success: boolean;
    latencyMs: number;
    chainId?: number;
    blockNumber?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      const provider = new JsonRpcProvider(rpcUrl.trim(), undefined, {
        staticNetwork: false,
        batchMaxCount: 1,
      });

      // Quick probe
      const [net, blockNum] = await Promise.all([
        provider.getNetwork(),
        provider.getBlockNumber(),
      ]);

      const chainId = Number(net.chainId);
      const latencyMs = Date.now() - startTime;

      if (expectedChainId && chainId !== expectedChainId) {
        return {
          success: false,
          latencyMs,
          chainId,
          blockNumber: blockNum,
          error: `Chain ID mismatch! Expected ${expectedChainId}, but RPC endpoint returned ${chainId}`,
        };
      }

      return {
        success: true,
        latencyMs,
        chainId,
        blockNumber: blockNum,
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        error: err?.message || 'Connection timeout or invalid RPC endpoint',
      };
    }
  }

  public static async getNetworkRpcDetails(): Promise<NetworkRpcDetail[]> {
    const store = await this.getStore();
    const networks = NetworkRegistry.getAllSupportedNetworks();
    const currentEnv = NetworkRegistry.getBlockchainEnv();

    const details: NetworkRpcDetail[] = [];

    for (const net of networks) {
      const customList = store.customRpcs[net.networkKey] || [];
      const primaryUrl = net.rpcUrls[0];

      details.push({
        networkKey: net.networkKey,
        name: net.name,
        chainId: net.chainId,
        env: currentEnv,
        currentActiveRpc: primaryUrl,
        rpcUrls: net.rpcUrls,
        customRpcUrls: customList,
        nativeGasSymbol: net.nativeGasToken.symbol,
        explorerUrl: net.explorerUrl,
        usdtContractAddress: net.usdtContractAddress,
        usdtDecimals: net.usdtDecimals,
        requiredConfirmations: net.requiredConfirmations,
        minDepositUsdt: net.minDepositUsdt,
        minWithdrawalUsdt: net.minWithdrawalUsdt,
        withdrawalFeeUsdt: net.withdrawalFeeUsdt,
        isDepositEnabled: net.isDepositEnabled,
        isWithdrawalEnabled: net.isWithdrawalEnabled,
        isEnabled: net.isEnabled,
        status: 'untested',
      });
    }

    return details;
  }
}
