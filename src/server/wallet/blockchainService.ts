import { JsonRpcProvider, Contract, parseUnits, formatUnits, getAddress, isAddress, formatEther } from 'ethers';
import { NetworkRegistry } from './registry';
import { ServerCustodyManager } from './custody';
import { SupportedNetworkConfig } from './types';
import { Logger } from '../config/env';

// Standard Minimal ERC-20 ABI for USDT operations
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

export interface GasEstimateResult {
  networkKey: string;
  chainId: number;
  gasPriceGwei: string;
  estimatedGasUnits: number;
  nativeGasFee: string;
  nativeGasSymbol: string;
  estimatedUsdtFee: string;
  lastUpdated: string;
}

export class BlockchainService {
  private static providers: Map<string, JsonRpcProvider> = new Map();

  /**
   * Clears cached providers (e.g. when admin toggles Mainnet / Testnet mode)
   */
  public static clearProviders(): void {
    this.providers.clear();
  }

  /**
   * Returns a connected JsonRpcProvider for the specified network with static network configuration
   */
  public static getProvider(networkKeyOrChainId: string | number, rpcIndex = 0): JsonRpcProvider {
    const config = NetworkRegistry.getNetwork(networkKeyOrChainId);
    const env = NetworkRegistry.getBlockchainEnv();
    const key = `${env}_${config.networkKey}_${rpcIndex}`;

    if (!this.providers.has(key)) {
      const urls = config.rpcUrls;
      const rpcUrl = urls[rpcIndex % urls.length] || urls[0];
      const provider = new JsonRpcProvider(rpcUrl, config.chainId, {
        staticNetwork: true,
        batchMaxCount: 1,
      });
      this.providers.set(key, provider);
    }

    return this.providers.get(key)!;
  }

  /**
   * Executes an RPC action with automatic multi-endpoint failover
   */
  private static async executeWithFailover<T>(
    networkKey: string,
    action: (provider: JsonRpcProvider) => Promise<T>
  ): Promise<T> {
    const config = NetworkRegistry.getNetwork(networkKey);
    let lastError: any = null;

    for (let i = 0; i < config.rpcUrls.length; i++) {
      try {
        const provider = this.getProvider(networkKey, i);
        return await action(provider);
      } catch (err: any) {
        lastError = err;
        // If it's a deterministic contract error, don't retry other RPCs
        if (
          err?.code === 'BAD_DATA' ||
          err?.message?.includes('could not decode result data') ||
          err?.message?.includes('CALL_EXCEPTION')
        ) {
          throw err;
        }
      }
    }
    throw lastError;
  }

  /**
   * Real-time Gas Estimation across all 7 EVM networks
   */
  public static async estimateGasFee(
    networkKey: string,
    actionType: 'erc20_transfer' | 'native_transfer' | 'deposit' | 'rebalance' = 'erc20_transfer'
  ): Promise<GasEstimateResult> {
    const config = NetworkRegistry.getNetwork(networkKey);
    
    // Standard EVM Gas limits for operations
    const gasUnitsMap: Record<string, number> = {
      erc20_transfer: 65000,
      native_transfer: 21000,
      deposit: 65000,
      rebalance: 130000,
    };
    const estimatedGasUnits = gasUnitsMap[actionType] || 65000;

    try {
      return await this.executeWithFailover(networkKey, async (provider) => {
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || feeData.maxFeePerGas || parseUnits('20', 'gwei');
        const gasPriceGwei = (Number(gasPrice) / 1e9).toFixed(3);
        
        const totalNativeWei = BigInt(estimatedGasUnits) * gasPrice;
        const nativeGasFee = formatEther(totalNativeWei);

        // Native token approximate USDT price conversion (conservative production estimates)
        const tokenPricesInUsdt: Record<string, number> = {
          ETH: 3000,
          BNB: 600,
          POL: 0.50,
          AVAX: 30,
          tBNB: 600,
        };
        const unitPrice = tokenPricesInUsdt[config.nativeGasToken.symbol] || 1;
        const estimatedUsdtFee = (parseFloat(nativeGasFee) * unitPrice).toFixed(4);

        return {
          networkKey: config.networkKey,
          chainId: config.chainId,
          gasPriceGwei,
          estimatedGasUnits,
          nativeGasFee,
          nativeGasSymbol: config.nativeGasToken.symbol,
          estimatedUsdtFee,
          lastUpdated: new Date().toISOString(),
        };
      });
    } catch (err: any) {
      Logger.warn(`Gas fee estimation fallback on ${config.name}`, { error: err?.message });
      return {
        networkKey: config.networkKey,
        chainId: config.chainId,
        gasPriceGwei: '25.000',
        estimatedGasUnits,
        nativeGasFee: '0.0015',
        nativeGasSymbol: config.nativeGasToken.symbol,
        estimatedUsdtFee: config.withdrawalFeeUsdt,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetches real on-chain USDT balance for any address with resilient failover
   */
  public static async getUsdtBalance(networkKey: string, address: string): Promise<{ rawBalance: bigint; formattedBalance: string }> {
    const config = NetworkRegistry.getNetwork(networkKey);
    const checksumAddress = NetworkRegistry.normalizeAddress(address);

    try {
      return await this.executeWithFailover(networkKey, async (provider) => {
        const contract = new Contract(config.usdtContractAddress, ERC20_ABI, provider);
        const rawBalance: bigint = await contract.balanceOf(checksumAddress);
        const formattedBalance = formatUnits(rawBalance, config.usdtDecimals);
        return { rawBalance, formattedBalance };
      });
    } catch (err: any) {
      // Gracefully handle RPC disconnects
      return { rawBalance: 0n, formattedBalance: '0.00' };
    }
  }

  /**
   * Fetches real native gas balance (ETH, BNB, POL, AVAX) for any address with resilient failover
   */
  public static async getNativeGasBalance(networkKey: string, address: string): Promise<{ rawBalance: bigint; formattedBalance: string }> {
    const config = NetworkRegistry.getNetwork(networkKey);
    const checksumAddress = NetworkRegistry.normalizeAddress(address);

    try {
      return await this.executeWithFailover(networkKey, async (provider) => {
        const rawBalance = await provider.getBalance(checksumAddress);
        const formattedBalance = formatUnits(rawBalance, config.nativeGasToken.decimals);
        return { rawBalance, formattedBalance };
      });
    } catch (err: any) {
      return { rawBalance: 0n, formattedBalance: '0.00' };
    }
  }

  /**
   * Fetches the current latest block number for a chain with failover
   */
  public static async getLatestBlockNumber(networkKey: string): Promise<number> {
    try {
      return await this.executeWithFailover(networkKey, async (provider) => {
        return await provider.getBlockNumber();
      });
    } catch {
      return 0;
    }
  }

  /**
   * Checks the status and confirmation count of a transaction
   */
  public static async getTransactionReceipt(networkKey: string, txHash: string): Promise<{
    status: number | null;
    confirmations: number;
    blockNumber: number | null;
    gasUsed?: string;
  }> {
    try {
      return await this.executeWithFailover(networkKey, async (provider) => {
        const receipt = await provider.getTransactionReceipt(txHash);

        if (!receipt) {
          return { status: null, confirmations: 0, blockNumber: null };
        }

        const currentBlock = await provider.getBlockNumber();
        const confirmations = currentBlock >= receipt.blockNumber ? currentBlock - receipt.blockNumber + 1 : 0;

        return {
          status: receipt.status,
          confirmations,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        };
      });
    } catch {
      return { status: null, confirmations: 0, blockNumber: null };
    }
  }

  /**
   * Broadcasts a real ERC-20 USDT transfer from platform treasury to a destination address
   */
  public static async broadcastUsdtTransfer(
    networkKey: string,
    destinationAddress: string,
    amountUsdt: string
  ): Promise<{ txHash: string; nonce: number; blockNumber?: number }> {
    const config = NetworkRegistry.getNetwork(networkKey);
    const checksumDestination = NetworkRegistry.normalizeAddress(destinationAddress);
    const provider = this.getProvider(networkKey);
    const signer = ServerCustodyManager.getSignerForNetwork(provider);

    // Parse amount using network-specific USDT decimals
    const parsedAmount = parseUnits(amountUsdt, config.usdtDecimals);

    // Connect contract with signer
    const contract = new Contract(config.usdtContractAddress, ERC20_ABI, signer);

    Logger.info(`Broadcasting real USDT withdrawal transaction on ${config.name} (${config.env.toUpperCase()})`, {
      destination: checksumDestination,
      amount: amountUsdt,
      contract: config.usdtContractAddress,
    });

    const tx = await contract.transfer(checksumDestination, parsedAmount);
    Logger.info(`Withdrawal transaction submitted to mempool on ${config.name}`, {
      txHash: tx.hash,
      nonce: tx.nonce,
    });

    return {
      txHash: tx.hash,
      nonce: tx.nonce,
    };
  }

  /**
   * Scans for USDT Transfer events for a specific block range
   */
  public static async scanTransferEvents(
    networkKey: string,
    fromBlock: number,
    toBlock: number
  ): Promise<Array<{
    txHash: string;
    logIndex: number;
    from: string;
    to: string;
    rawAmount: bigint;
    amount: string;
    blockNumber: number;
  }>> {
    const config = NetworkRegistry.getNetwork(networkKey);
    const provider = this.getProvider(networkKey);
    const contract = new Contract(config.usdtContractAddress, ERC20_ABI, provider);

    try {
      const filter = contract.filters.Transfer();
      const events = await contract.queryFilter(filter, fromBlock, toBlock);

      return events.map((event: any) => {
        const from = getAddress(event.args[0]);
        const to = getAddress(event.args[1]);
        const rawAmount: bigint = event.args[2];
        const amount = formatUnits(rawAmount, config.usdtDecimals);

        return {
          txHash: event.transactionHash,
          logIndex: event.index,
          from,
          to,
          rawAmount,
          amount,
          blockNumber: event.blockNumber,
        };
      });
    } catch (err: any) {
      Logger.warn(`Event scanning warning on ${config.name} blocks [${fromBlock}-${toBlock}]`, {
        error: err.message,
      });
      return [];
    }
  }
}
