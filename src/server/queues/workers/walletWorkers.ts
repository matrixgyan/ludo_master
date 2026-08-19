import { DepositService } from '../../wallet/depositService';
import { TreasuryService } from '../../wallet/treasuryService';
import { ReconciliationService } from '../../wallet/reconciliationService';
import { Logger } from '../../config/env';

export class WalletBackgroundWorkers {
  private static depositConfirmationTimer: NodeJS.Timeout | null = null;
  private static treasurySyncTimer: NodeJS.Timeout | null = null;
  private static reconciliationTimer: NodeJS.Timeout | null = null;
  private static isRunning = false;

  public static initialize(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    Logger.info('Starting Wallet Background Workers (Deposit Scanner, Confirmations, Treasury Monitor, Reconciliation)...');

    // 1. Deposit Confirmation Poller (every 6 seconds)
    this.depositConfirmationTimer = setInterval(async () => {
      try {
        await DepositService.refreshDepositConfirmations();
      } catch (err: any) {
        Logger.warn('Deposit confirmation worker notice', { error: err.message });
      }
    }, 6000);

    // 2. Treasury On-Chain Balances & Gas Poller (every 30 seconds)
    this.treasurySyncTimer = setInterval(async () => {
      try {
        await TreasuryService.syncAllNetworkTreasuries();
      } catch (err: any) {
        Logger.warn('Treasury sync worker notice', { error: err.message });
      }
    }, 30000);

    // Initial sync
    TreasuryService.syncAllNetworkTreasuries().catch(() => {});

    // 3. Automated Financial Reconciliation Audit (every 2 minutes)
    this.reconciliationTimer = setInterval(async () => {
      try {
        await ReconciliationService.runReconciliationAudit();
      } catch (err: any) {
        Logger.warn('Reconciliation audit worker notice', { error: err.message });
      }
    }, 120000);
  }

  public static shutdown(): void {
    if (this.depositConfirmationTimer) clearInterval(this.depositConfirmationTimer);
    if (this.treasurySyncTimer) clearInterval(this.treasurySyncTimer);
    if (this.reconciliationTimer) clearInterval(this.reconciliationTimer);
    this.isRunning = false;
    Logger.info('Wallet background workers stopped.');
  }
}
