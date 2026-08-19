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
} from 'lucide-react';

interface UsdtTreasuryCustodyTabProps {
  token: string;
}

export const UsdtTreasuryCustodyTab: React.FC<UsdtTreasuryCustodyTabProps> = ({ token }) => {
  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [reconciliationReport, setReconciliationReport] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

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

      if (oData.success) setOverviewData(oData);
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
      setBannerMsg(data.message || 'Updated status');
      fetchOverview();
    } catch (err: any) {
      setBannerMsg(`Error: ${err.message}`);
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
        setBannerMsg('Fresh reconciliation audit executed successfully!');
      }
    } catch (err: any) {
      setBannerMsg(`Audit Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div id="usdt-treasury-tab" className="space-y-6 animate-fadeIn">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#0a0e1a] border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Wallet className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">USDT Multi-Chain Custody & Treasury</h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 rounded-full">
                TESTNET FIRST
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live On-Chain Liquidity • Double-Entry Ledger • Automated Rebalancing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunReconciliation}
            disabled={actionLoading}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition flex items-center gap-1.5"
          >
            <FileCheck className="w-4 h-4 text-teal-400" />
            Run Audit
          </button>
          <button
            onClick={handleToggleEmergencyPause}
            disabled={actionLoading}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              overviewData?.isEmergencyPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-rose-600/90 hover:bg-rose-600 text-white'
            }`}
          >
            {overviewData?.isEmergencyPaused ? (
              <>
                <Play className="w-4 h-4" /> Resume Operations
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" /> Emergency Pause
              </>
            )}
          </button>
          <button
            onClick={fetchOverview}
            disabled={isLoading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {bannerMsg && (
        <div className="p-3.5 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-200 flex items-center justify-between">
          <span>{bannerMsg}</span>
          <button onClick={() => setBannerMsg(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* RECONCILIATION SUMMARY BANNER */}
      {reconciliationReport && (
        <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Double-Entry Financial Ledger Health</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Audited: {new Date(reconciliationReport.generatedAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl">
              <span className="text-xs text-slate-400">Total Treasury On-Chain Assets</span>
              <div className="text-xl font-bold text-white mt-1">
                ${Number(reconciliationReport.totalTreasuryAssetsUsdt).toFixed(2)} USDT
              </div>
            </div>
            <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl">
              <span className="text-xs text-slate-400">Total User Liabilities</span>
              <div className="text-xl font-bold text-slate-200 mt-1">
                ${Number(reconciliationReport.totalUserLiabilitiesUsdt).toFixed(2)} USDT
              </div>
            </div>
            <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl">
              <span className="text-xs text-slate-400">Ledger Reserve Margin</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                +${Number(reconciliationReport.differenceUsdt).toFixed(2)} USDT
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7 EVM CHAINS TREASURY GRID */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            7 Supported EVM Chains — Live On-Chain Vaults
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {overviewData?.treasuries?.length || 7} Networks Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {overviewData?.treasuries?.map((t: any) => (
            <div
              key={t.networkKey}
              className="p-5 bg-[#0a0e1a] border border-slate-800 hover:border-slate-700 rounded-2xl space-y-4 transition shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{t.name}</h4>
                  <span className="text-[11px] text-slate-500 font-mono">Chain ID: {t.chainId}</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    t.status === 'HEALTHY'
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                      : t.status === 'LOW_GAS'
                      ? 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                      : 'bg-rose-950/80 text-rose-400 border-rose-500/40'
                  }`}
                >
                  {t.status}
                </span>
              </div>

              {/* On-Chain Balances */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-teal-400" />
                    USDT Vault Balance:
                  </span>
                  <span className="font-bold text-white font-mono">{t.usdtBalance} USDT</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-amber-400" />
                    Native Gas Token:
                  </span>
                  <span className="font-bold text-slate-300 font-mono">
                    {t.nativeGasBalance} {t.nativeGasSymbol}
                  </span>
                </div>
              </div>

              {/* Address */}
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="truncate max-w-[200px]">{t.treasuryAddress}</span>
                <a
                  href={`https://sepolia.etherscan.io/address/${t.treasuryAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-500 hover:text-emerald-400 transition"
                  title="View on Explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
