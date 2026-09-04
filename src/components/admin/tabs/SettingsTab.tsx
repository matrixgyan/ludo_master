import React, { useState, useEffect } from 'react';
import { Settings, Globe, Shield, RefreshCw, CheckCircle2, AlertCircle, Copy, ExternalLink, Flame, Zap } from 'lucide-react';

interface SettingsTabProps {
  token: string;
  onAdminAliasChange: (newAlias: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ token, onAdminAliasChange }) => {
  const [adminUrlAlias, setAdminUrlAlias] = useState('admin');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [turnTimeoutSeconds, setTurnTimeoutSeconds] = useState(30);
  const [maxConsecutiveSixes, setMaxConsecutiveSixes] = useState(3);
  const [entryFee2Player, setEntryFee2Player] = useState(100);
  const [entryFee4Player, setEntryFee4Player] = useState(250);
  const [prizePoolPercentage, setPrizePoolPercentage] = useState(85);
  const [humanWinRate3P, setHumanWinRate3P] = useState(20);
  const [humanWinRate4P, setHumanWinRate4P] = useState(20);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [flushStatus, setFlushStatus] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.settings) {
        setAdminUrlAlias(data.settings.adminUrlAlias || 'admin');
        setMaintenanceMode(data.settings.maintenanceMode || false);
        setTurnTimeoutSeconds(data.settings.turnTimeoutSeconds || 30);
        setMaxConsecutiveSixes(data.settings.maxConsecutiveSixes || 3);
        setEntryFee2Player(data.settings.entryFee2Player || 100);
        setEntryFee4Player(data.settings.entryFee4Player || 250);
        setPrizePoolPercentage(data.settings.prizePoolPercentage || 85);
        setHumanWinRate3P(data.settings.humanWinRate3P ?? 20);
        setHumanWinRate4P(data.settings.humanWinRate4P ?? 20);
      }
    } catch {
      // Fallback
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminUrlAlias,
          maintenanceMode,
          turnTimeoutSeconds,
          maxConsecutiveSixes,
          entryFee2Player,
          entryFee4Player,
          prizePoolPercentage,
          humanWinRate3P,
          humanWinRate4P,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveSuccess('Platform settings & Admin URL alias updated successfully!');
        onAdminAliasChange(adminUrlAlias);
        if (data.settings) {
          window.dispatchEvent(new CustomEvent('ludo_platform_mode_changed', { detail: data.settings }));
          localStorage.setItem('ludo_platform_mode', JSON.stringify(data.settings));
        }
        setTimeout(() => setSaveSuccess(null), 4000);
      }
    } catch {
      // Handle error
    } finally {
      setIsSaving(false);
    }
  };

  const handleFlushCache = async (target: string) => {
    try {
      const res = await fetch('/api/admin/system/flush-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      setFlushStatus(data.message || 'Cache cleared');
      setTimeout(() => setFlushStatus(null), 3000);
    } catch {
      setFlushStatus('Failed to flush cache');
    }
  };

  const copyCustomUrl = () => {
    const url = `https://ludo.omyra.org/${adminUrlAlias}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Admin URL Alias Configuration Card */}
      <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">Admin Access URL Path & Custom Alias</h3>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Customize the secret URL path slug used to access this administrative portal. Default is <code className="text-amber-400">/admin</code>, and you can switch to <code className="text-amber-400">/custom</code> or any custom path.
        </p>

        <div className="bg-[#141b2d] border border-slate-700/80 rounded-xl p-4 mb-6">
          <div className="text-xs text-slate-400 mb-2">Current Active Admin URL:</div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
            <span className="text-amber-400 font-bold text-sm sm:text-base break-all">
              https://ludo.omyra.org/{adminUrlAlias}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={copyCustomUrl}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedUrl ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedUrl ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1.5">
                Admin URL Slug / Alias
              </label>
              <div className="flex items-center">
                <span className="bg-slate-800 border border-r-0 border-slate-700 rounded-l-xl px-3 py-2 text-xs text-slate-400 font-mono">
                  /
                </span>
                <input
                  type="text"
                  required
                  value={adminUrlAlias}
                  onChange={(e) => setAdminUrlAlias(e.target.value)}
                  placeholder="custom"
                  className="w-full bg-[#141b2d] border border-slate-700 rounded-r-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold outline-none focus:border-amber-400"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Examples: <code className="text-slate-400">custom</code>, <code className="text-slate-400">admin</code>, <code className="text-slate-400">master</code>
              </p>
            </div>

            <div>
              <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1.5">
                Turn Countdown Timeout (Seconds)
              </label>
              <input
                type="number"
                min={10}
                max={120}
                value={turnTimeoutSeconds}
                onChange={(e) => setTurnTimeoutSeconds(Number(e.target.value))}
                className="w-full bg-[#141b2d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1.5">
                2-Player Match Entry Fee
              </label>
              <input
                type="number"
                value={entryFee2Player}
                onChange={(e) => setEntryFee2Player(Number(e.target.value))}
                className="w-full bg-[#141b2d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1.5">
                4-Player Match Entry Fee
              </label>
              <input
                type="number"
                value={entryFee4Player}
                onChange={(e) => setEntryFee4Player(Number(e.target.value))}
                className="w-full bg-[#141b2d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1.5">
                Winner Prize Pool (%)
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={prizePoolPercentage}
                onChange={(e) => setPrizePoolPercentage(Number(e.target.value))}
                className="w-full bg-[#141b2d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono outline-none"
              />
            </div>
          </div>

          {/* Bot Rigging & Win Rate Control (3P and 4P matches) */}
          <div className="p-4 bg-[#141b2d] border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200 text-xs flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  Bot Win Optimization & Human Win Rate Limiters
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Controls backend bot AI difficulty & human winning probabilities in 3-player and 4-player matches.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1.5">
                  3-Player Human Win Chance (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={humanWinRate3P}
                    onChange={(e) => setHumanWinRate3P(Number(e.target.value))}
                    className="w-full bg-[#0e1322] border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold outline-none"
                  />
                  <span className="text-xs text-slate-400 font-bold">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Default 20% (80% bot favored win chance)</p>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1.5">
                  4-Player Human Win Chance (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={humanWinRate4P}
                    onChange={(e) => setHumanWinRate4P(Number(e.target.value))}
                    className="w-full bg-[#0e1322] border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold outline-none"
                  />
                  <span className="text-xs text-slate-400 font-bold">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Default 20% (80% bot favored win chance)</p>
              </div>
            </div>
          </div>

          {/* Maintenance Mode Toggle */}
          <div className="p-4 bg-[#141b2d] border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-200 text-xs flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                Platform Maintenance Mode
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Blocks new matchmaking queues while active matches conclude.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
            </label>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {saveSuccess}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving Changes...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Cache Maintenance & Utilities Card */}
      <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-rose-400" />
          <h3 className="text-base font-bold text-white">System Cache & Queue Maintenance</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Safe administrative triggers to flush Redis caches, clear matchmaking pools, or reset rate limits.
        </p>

        {flushStatus && (
          <div className="mb-4 p-3 bg-slate-900 border border-slate-800 rounded-xl text-amber-400 text-xs font-mono">
            {flushStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleFlushCache('matchmaking')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            Clear Matchmaking Queues
          </button>
          <button
            type="button"
            onClick={() => handleFlushCache('all')}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/30 transition-colors cursor-pointer"
          >
            Flush Ludo Redis Cache
          </button>
        </div>
      </div>
    </div>
  );
};
