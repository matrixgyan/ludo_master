import { NetworkRegistry } from './registry';
import { ServerCustodyManager } from './custody';
import { BlockchainService } from './blockchainService';
import { TreasuryBalanceInfo } from './types';
import { LedgerMath } from './ledgerMath';
import { Logger } from '../config/env';

export class TreasuryService {
  private static emergencyPaused = false;
  private static cachedTreasuries: Map<string, TreasuryBalanceInfo> = new Map();
  private static lastGlobalSync: number = 0;

  public static isEmergencyPaused(): boolean {
    return this.emergencyPaused;
  }

  public static setEmergencyPause(paused: boolean, reason?: string): void {
    this.emergencyPaused = paused;
    Logger.warn(`EMERGENCY PAUSE STATUS UPDATED: ${paused ? 'PAUSED' : 'ACTIVE'}`, { reason });
  }

  /**
   * Syncs real on-chain treasury balances for all 7 networks
   */
  public static async syncAllNetworkTreasuries(): Promise<TreasuryBalanceInfo[]> {
    const networks = NetworkRegistry.getAllSupportedNetworks();
    const treasuryAddress = ServerCustodyManager.getTreasuryAddress();
    const results: TreasuryBalanceInfo[] = [];

    for (const net of networks) {
      try {
        const [usdt, gas] = await Promise.all([
          BlockchainService.getUsdtBalance(net.networkKey, treasuryAddress),
          BlockchainService.getNativeGasBalance(net.networkKey, treasuryAddress),
        ]);

        const minThreshold = '10.00000000';
        const targetLiquidity = '100.00000000';

        let status: 'HEALTHY' | 'LOW_LIQUIDITY' | 'LOW_GAS' | 'CRITICAL' = 'HEALTHY';
        if (Number(gas.formattedBalance) < 0.001) {
          status = 'LOW_GAS';
        } else if (LedgerMath.isGreaterThan(minThreshold, usdt.formattedBalance)) {
          status = 'LOW_LIQUIDITY';
        }

        const info: TreasuryBalanceInfo = {
          networkKey: net.networkKey,
          name: net.name,
          chainId: net.chainId,
          treasuryAddress,
          usdtBalance: usdt.formattedBalance,
          usdtDecimals: net.usdtDecimals,
          nativeGasBalance: gas.formattedBalance,
          nativeGasSymbol: net.nativeGasToken.symbol,
          minLiquidityThresholdUsdt: minThreshold,
          targetLiquidityUsdt: targetLiquidity,
          status,
          lastSyncedAt: new Date().toISOString(),
        };

        this.cachedTreasuries.set(net.networkKey, info);
        results.push(info);
      } catch (err: any) {
        Logger.warn(`Failed syncing treasury on ${net.name}`, { error: err.message });
      }
    }

    this.lastGlobalSync = Date.now();
    return results;
  }

  /**
   * Gets cached or fresh treasury info for a specific network
   */
  public static async getTreasuryInfo(networkKey: string): Promise<TreasuryBalanceInfo> {
    const net = NetworkRegistry.getNetwork(networkKey);
    const cached = this.cachedTreasuries.get(net.networkKey);

    if (cached && Date.now() - this.lastGlobalSync < 30000) {
      return cached;
    }

    const treasuryAddress = ServerCustodyManager.getTreasuryAddress();
    const [usdt, gas] = await Promise.all([
      BlockchainService.getUsdtBalance(net.networkKey, treasuryAddress),
      BlockchainService.getNativeGasBalance(net.networkKey, treasuryAddress),
    ]);

    const info: TreasuryBalanceInfo = {
      networkKey: net.networkKey,
      name: net.name,
      chainId: net.chainId,
      treasuryAddress,
      usdtBalance: usdt.formattedBalance,
      usdtDecimals: net.usdtDecimals,
      nativeGasBalance: gas.formattedBalance,
      nativeGasSymbol: net.nativeGasToken.symbol,
      minLiquidityThresholdUsdt: '10.00000000',
      targetLiquidityUsdt: '100.00000000',
      status: 'HEALTHY',
      lastSyncedAt: new Date().toISOString(),
    };

    this.cachedTreasuries.set(net.networkKey, info);
    return info;
  }

  /**
   * Checks if the treasury on a destination network has enough USDT liquidity to fulfill a withdrawal
   */
  public static async hasSufficientLiquidity(networkKey: string, requiredAmountUsdt: string): Promise<boolean> {
    const info = await this.getTreasuryInfo(networkKey);
    return LedgerMath.isGreaterThanOrEqual(info.usdtBalance, requiredAmountUsdt);
  }
}
