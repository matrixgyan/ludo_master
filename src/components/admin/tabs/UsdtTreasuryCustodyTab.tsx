import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Pause,
  Play,
  FileCheck,
  Fuel,
  Coins,
  Radio,
  Sliders,
  Zap,
  Globe,
  Lock,
  ArrowRightLeft,
} from 'lucide-react';
import { NetworkLogo } from '../../wallet/NetworkLogo';
import { UnifiedWalletService } from '../../../services/unifiedWalletService';

interface UsdtTreasuryCustodyTabProps {
  token: string;
}

export const UsdtTreasuryCustodyTab: React.FC<UsdtTreasuryCustodyTabProps> = ({ token }) => {
  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [reconciliationReport, setReconciliationReport] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin Fee Config state
  const [feePercent, setFeePercent] = useState<number>(1.0);
  const [minFeeUsdt, setMinFeeUsdt] = useState<string>('0.10');
  const [isSavingFee, setIsSavingFee] = useState<boolean>(false);

  // Cross-Chain Quote Simulator state
  const [simSourceNet, setSimSourceNet] = useState<string>('optimism');
  const [simDestNet, setSimDestNet] = useState<string>('ethereum');
  const [simAmount, setSimAmount] = useState<string>('50.00');
  const [simQuote, setSimQuote] = useState<any | null>(null);
  const [isSimulatingQuote, setIsSimulatingQuote] = useState<boolean>(false);

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, recRes] = await Promise.all([
        fetch('/api/admin/wallet/overview', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/wallet/reconciliation', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const oData = await overviewRes.json();
      const rData = await recRes.json();

      if (oData.success) {
        setOverviewData(oData);
        if (oData.adminServiceFee) {
          setFeePercent(oData.adminServiceFee.feePercent);
          setMinFeeUsdt(oData.adminServiceFee.minFeeUsdt);
        }
      }
      if (rData.success) setReconciliationReport(rData.report);
    } catch (err: any) {
      console.error('Error loading treasury overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 15000);
    return () => clearInterval(interval);
  }, [token]);

  // 1-Click Mode Switcher
  const handleSwitchMode = async (targetEnv: 'mainnet' | 'testnet') => {
    if (overviewData?.env === targetEnv) return;
    setActionLoading(true);
    try {
      const data = await UnifiedWalletService.setAdminWalletMode(token, targetEnv);
      setBannerMsg({
        type: 'success',
        text: `Wallet successfully switched to ${targetEnv.toUpperCase()} mode! All 7 chains re-indexed.`,
      });
      fetchOverview();
    } catch (err: any) {
      setBannerMsg({
        type: 'error',
        text: `Failed to switch mode: ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleEmergencyPause = async () => {
    if (!overviewData) return;
    setActionLoading(true);
    const endpoint = overviewData.isEmergencyPaused
      ? '/api/admin/wallet/emergency/resume'
      : '/api/admin/wallet/emergency/pause';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setBannerMsg({
        type: 'success',
        text: data.message || 'Updated status',
      });
      fetchOverview();
    } catch (err: any) {
      setBannerMsg({
        type: 'error',
        text: `Error: ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunReconciliation = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/wallet/reconciliation/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setReconciliationReport(data.report);
        setBannerMsg({
          type: 'success',
          text: 'Fresh automated reconciliation audit executed successfully!',
        });
      }
    } catch (err: any) {
      setBannerMsg({
        type: 'error',
        text: `Audit Error: ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAdminFees = async () => {
    setIsSavingFee(true);
    try {
      const res = await fetch('/api/admin/wallet/fees/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feePercent: Number(feePercent),
          minFeeUsdt: minFeeUsdt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBannerMsg({
          type: 'success',
          text: data.message,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setBannerMsg({
        type: 'error',
        text: `Failed saving fees: ${err.message}`,
      });
    } finally {
      setIsSavingFee(false);
    }
  };

  const handleSimulateQuote = async () => {
    setIsSimulatingQuote(true);
    try {
      const quote = await UnifiedWalletService.fetchCrossChainQuote(simSourceNet, simDestNet, simAmount);
      setSimQuote(quote);
    } catch (err: any) {
      setBannerMsg({
        type: 'error',
        text: `Simulation error: ${err.message}`,
      });
    } finally {
      setIsSimulatingQuote(false);
    }
  };

  const currentEnv = overviewData?.env || 'mainnet';
  const isMainnet = currentEnv === 'mainnet';

  return (
    <div id="usdt-treasury-tab" className="space-y-6 animate-fadeIn pb-12">
      {/* 1. TOP 1-CLICK MODE SWITCHER BANNER */}
      <div className={`p-6 rounded-2xl border transition-all duration-300 ${
        isMainnet 
          ? 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border-emerald-500/40 shadow-xl shadow-emerald-950/30'
          : 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-orange-950/70 border-amber-500/40 shadow-xl shadow-amber-950/30'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-xs font-black tracking-wider uppercase rounded-full flex items-center gap-1.5 ${
                isMainnet
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 animate-pulse'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-400/40'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isMainnet ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {isMainnet ? 'LIVE MAINNET PRODUCTION MODE' : 'TESTNET EXPERIMENTAL MODE'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {overviewData?.supportedNetworksCount || 7} EVM Chains Active
              </span>
            </div>

            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Globe className="w-6 h-6 text-teal-400" />
              1-Click Blockchain Environment Switcher
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {isMainnet
                ? 'Your wallet is currently operating on LIVE PRODUCTION MAINNET. Real USDT tokens and real on-chain gas are required for all user deposits and withdrawals.'
                : 'Your wallet is currently operating on TESTNET (Sepolia / Amoy / Fuji). Safe for simulated testing without spending real funds.'}
            </p>
          </div>

          {/* 1-CLICK TOGGLE BUTTONS */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-2 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => handleSwitchMode('mainnet')}
              disabled={actionLoading || isMainnet}
              className={`px-5 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                isMainnet
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Zap className="w-4 h-4" />
              PRODUCTION MAINNET
            </button>

            <button
              onClick={() => handleSwitchMode('testnet')}
              disabled={actionLoading || !isMainnet}
              className={`px-5 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                !isMainnet
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              TESTNET MODE
            </button>
          </div>
        </div>
      </div>

      {/* BANNER NOTIFICATION */}
      {bannerMsg && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 animate-fadeIn ${
          bannerMsg.type === 'success'
            ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
        }`}>
          <span>{bannerMsg.text}</span>
          <button onClick={() => setBannerMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* QUICK ACTIONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#0a0e1a] border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunReconciliation}
            disabled={actionLoading}
            className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition flex items-center gap-2"
          >
            <FileCheck className="w-4 h-4 text-teal-400" />
            Run Reconciliation Audit
          </button>
          <button
            onClick={handleToggleEmergencyPause}
            disabled={actionLoading}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
              overviewData?.isEmergencyPaused
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500'
                : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border-amber-600/40'
            }`}
          >
            {overviewData?.isEmergencyPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {overviewData?.isEmergencyPaused ? 'Resume Wallet System' : 'Emergency Pause All'}
          </button>
        </div>

        <button
          onClick={fetchOverview}
          disabled={isLoading}
          className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Live Data
        </button>
      </div>

      {/* 2. ADMIN SERVICE FEE & CROSS-CHAIN BRIDGE SIMULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ADMIN SERVICE FEE CONFIG */}
        <div className="p-5 bg-[#0a0e1a] border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-500/40 flex items-center justify-center">
                <Coins className="w-4 h-4 text-teal-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Admin Platform Service Fee</h3>
            </div>
            <span className="text-xs font-semibold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-500/30">
              Active: {feePercent}% (min ${minFeeUsdt})
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Set the platform revenue fee deducted from on-chain withdrawals and cross-chain transactions.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Service Fee Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={feePercent}
                onChange={(e) => setFeePercent(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Minimum Fee (USDT)</label>
              <input
                type="text"
                value={minFeeUsdt}
                onChange={(e) => setMinFeeUsdt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <button
            onClick={handleSaveAdminFees}
            disabled={isSavingFee}
            className="w-full py-2 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition"
          >
            {isSavingFee ? 'Saving Fee Settings...' : 'Update Platform Service Fee'}
          </button>
        </div>

        {/* CROSS-CHAIN FEE SIMULATOR */}
        <div className="p-5 bg-[#0a0e1a] border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Cross-Chain Fee & Gas Calculator</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Simulate Routing</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Source Network</label>
              <select
                value={simSourceNet}
                onChange={(e) => setSimSourceNet(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="optimism">Optimism</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="ethereum">Ethereum</option>
                <option value="bsc">BNB Chain</option>
                <option value="polygon">Polygon</option>
                <option value="base">Base</option>
                <option value="avalanche">Avalanche</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Destination</label>
              <select
                value={simDestNet}
                onChange={(e) => setSimDestNet(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="ethereum">Ethereum</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="optimism">Optimism</option>
                <option value="bsc">BNB Chain</option>
                <option value="polygon">Polygon</option>
                <option value="base">Base</option>
                <option value="avalanche">Avalanche</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Amount (USDT)</label>
              <input
                type="text"
                value={simAmount}
                onChange={(e) => setSimAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleSimulateQuote}
            disabled={isSimulatingQuote}
            className="w-full py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition"
          >
            {isSimulatingQuote ? 'Estimating...' : 'Calculate Cross-Chain Fees'}
          </button>

          {simQuote && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Relayer Bridge Fee:</span>
                <span className="text-amber-400">{simQuote.bridgeFeeUsdt} USDT</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Admin Service Fee ({feePercent}%):</span>
                <span className="text-teal-400">{simQuote.adminServiceFeeUsdt} USDT</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-1 border-t border-slate-800">
                <span>Net Received:</span>
                <span className="text-emerald-400">{simQuote.netDestinationAmountUsdt} USDT</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. LIVE TREASURY LIQUIDITY & GAS RESERVES ACROSS 7 EVM CHAINS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" />
            Live Liquidity & Gas Rates (7 EVM Networks)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Mode: {currentEnv.toUpperCase()}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(overviewData?.treasuries || []).map((t: any) => {
            const gasEstimate = overviewData?.gasEstimates?.find((g: any) => g.networkKey === t.networkKey);

            return (
              <div
                key={t.networkKey}
                className="p-4 bg-[#0a0e1a] border border-slate-800 rounded-2xl space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <NetworkLogo networkKey={t.networkKey} size="md" />
                    <div>
                      <h4 className="text-sm font-bold text-white capitalize">{t.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Chain ID: {t.chainId}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    t.status === 'HEALTHY'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                  }`}>
                    {t.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/50">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Treasury USDT</p>
                    <p className="text-xs font-bold text-emerald-400 font-mono truncate">
                      {parseFloat(t.usdtBalance).toFixed(2)} USDT
                    </p>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/50">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Gas Fuel ({t.nativeGasSymbol})</p>
                    <p className="text-xs font-bold text-amber-400 font-mono truncate">
                      {parseFloat(t.nativeGasBalance).toFixed(4)}
                    </p>
                  </div>
                </div>

                {gasEstimate && (
                  <div className="text-[10px] font-mono text-slate-400 bg-slate-950/50 p-2 rounded-xl border border-slate-800/40 flex justify-between">
                    <span>Gas: {gasEstimate.gasPriceGwei} Gwei</span>
                    <span className="text-slate-300">~${gasEstimate.estimatedUsdtFee}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. RECONCILIATION AUDIT REPORT */}
      {reconciliationReport && (
        <div className="p-5 bg-[#0a0e1a] border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Automated Ledger Reconciliation</h3>
            </div>
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
              reconciliationReport.status === 'BALANCED'
                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-950 text-rose-400 border-rose-500/30'
            }`}>
              {reconciliationReport.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-[10px]">User Balances</p>
              <p className="text-white font-bold">${reconciliationReport.totalUserBalances}</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-[10px]">On-Chain Treasury</p>
              <p className="text-white font-bold">${reconciliationReport.totalOnChainTreasury}</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-[10px]">Game Escrow</p>
              <p className="text-white font-bold">${reconciliationReport.totalGameEscrow || '0.00'}</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-[10px]">Discrepancy</p>
              <p className={`font-bold ${reconciliationReport.discrepancy === '0.00000000' ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${reconciliationReport.discrepancy}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
