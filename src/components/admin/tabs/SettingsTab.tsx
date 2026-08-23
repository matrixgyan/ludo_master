import React, { useState, useEffect } from 'react';
import {
  Settings,
  Globe,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Flame,
  Zap,
  Gauge,
  DollarSign,
  Plus,
  Trash2,
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  Sliders,
  Check,
  Award,
} from 'lucide-react';
import {
  PlatformGameSettings,
  DEFAULT_PLATFORM_SETTINGS,
  MatchPoolTier,
  DEFAULT_MATCH_POOLS_2P,
  DEFAULT_MATCH_POOLS_3P,
  DEFAULT_MATCH_POOLS_4P,
  DEFAULT_MATCH_POOLS_SNAKE,
} from '../../../types/settings';
import { saveLocalGameSettings } from '../../../hooks/useGameSettings';

interface SettingsTabProps {
  token: string;
  onAdminAliasChange: (newAlias: string) => void;
}

type FeePoolTab = '2P' | '3P' | '4P' | 'SNAKE';

export const SettingsTab: React.FC<SettingsTabProps> = ({ token, onAdminAliasChange }) => {
  const [settings, setSettings] = useState<PlatformGameSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [activeFeeTab, setActiveFeeTab] = useState<FeePoolTab>('2P');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [flushStatus, setFlushStatus] = useState<string | null>(null);

  // New Tier Modal / Input State
  const [showAddTierModal, setShowAddTierModal] = useState(false);
  const [newTierTitle, setNewTierTitle] = useState('');
  const [newTierFee, setNewTierFee] = useState<number>(15);
  const [newTierTag, setNewTierTag] = useState('High Stakes');
  const [newTierIsHot, setNewTierIsHot] = useState(false);
  const [newTierColor, setNewTierColor] = useState<'red' | 'yellow' | 'green' | 'blue'>('yellow');

  // Interactive Live Animation Preview State
  const [previewPawnPos, setPreviewPawnPos] = useState(0);
  const [isPreviewRunning, setIsPreviewRunning] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.settings) {
        setSettings({
          ...DEFAULT_PLATFORM_SETTINGS,
          ...data.settings,
        });
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Live test preview animation loop
  const triggerPawnSpeedTest = (speedMs: number) => {
    if (isPreviewRunning) return;
    setIsPreviewRunning(true);
    setPreviewPawnPos(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setPreviewPawnPos(step % 6);
      if (step >= 12) {
        clearInterval(interval);
        setIsPreviewRunning(false);
      }
    }, speedMs);
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveSuccess('Platform settings, pawn movement speeds & entry fees saved and broadcast live!');
        saveLocalGameSettings(settings);
        onAdminAliasChange(settings.adminUrlAlias);
        setTimeout(() => setSaveSuccess(null), 4000);
      } else {
        setSaveError(data.error || 'Failed to save settings');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Network error saving settings');
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
    const url = `https://ludo.omyra.org/${settings.adminUrlAlias}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Helper to get active pool list for the selected tab
  const getActivePoolList = (): MatchPoolTier[] => {
    if (activeFeeTab === '2P') return settings.matchPools2P || DEFAULT_MATCH_POOLS_2P;
    if (activeFeeTab === '3P') return settings.matchPools3P || DEFAULT_MATCH_POOLS_3P;
    if (activeFeeTab === '4P') return settings.matchPools4P || DEFAULT_MATCH_POOLS_4P;
    return settings.matchPoolsSnake || DEFAULT_MATCH_POOLS_SNAKE;
  };

  const updateActivePoolList = (updatedList: MatchPoolTier[]) => {
    if (activeFeeTab === '2P') {
      setSettings((prev) => ({ ...prev, matchPools2P: updatedList }));
    } else if (activeFeeTab === '3P') {
      setSettings((prev) => ({ ...prev, matchPools3P: updatedList }));
    } else if (activeFeeTab === '4P') {
      setSettings((prev) => ({ ...prev, matchPools4P: updatedList }));
    } else {
      setSettings((prev) => ({ ...prev, matchPoolsSnake: updatedList }));
    }
  };

  const handleDeleteTier = (index: number) => {
    const list = [...getActivePoolList()];
    list.splice(index, 1);
    updateActivePoolList(list);
  };

  const handleAddTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTierTitle.trim()) return;

    const newTier: MatchPoolTier = {
      title: newTierTitle.trim(),
      fee: Number(newTierFee),
      tag: newTierTag.trim() || undefined,
      isHot: newTierIsHot,
      colorName: newTierColor,
    };

    const list = [...getActivePoolList(), newTier];
    // Sort numerically by fee
    list.sort((a, b) => a.fee - b.fee);
    updateActivePoolList(list);

    setNewTierTitle('');
    setNewTierFee(15);
    setShowAddTierModal(false);
  };

  const handleResetPoolsToDefault = () => {
    if (activeFeeTab === '2P') {
      setSettings((prev) => ({ ...prev, matchPools2P: DEFAULT_MATCH_POOLS_2P }));
    } else if (activeFeeTab === '3P') {
      setSettings((prev) => ({ ...prev, matchPools3P: DEFAULT_MATCH_POOLS_3P }));
    } else if (activeFeeTab === '4P') {
      setSettings((prev) => ({ ...prev, matchPools4P: DEFAULT_MATCH_POOLS_4P }));
    } else {
      setSettings((prev) => ({ ...prev, matchPoolsSnake: DEFAULT_MATCH_POOLS_SNAKE }));
    }
  };

  // Helper for Net Prize calculation
  const getNetPrize = (fee: number, count: number) => {
    if (fee === 0) return '$0.00 (Free Practice)';
    const gross = fee * count;
    const net = gross * ((settings.prizePoolPercentage || 90) / 100);
    return `$${net.toFixed(2)} USDT`;
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Action Bar & Save Notification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0e131f] border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white leading-tight">
              Live Platform Configuration & Game Control Center
            </h2>
            <p className="text-xs text-slate-400">
              Manage pawn movement speeds, match entry fee tiers, game timers & admin routing.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSaveSettings()}
          disabled={isSaving}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{isSaving ? 'Deploying...' : 'Save & Deploy Live'}</span>
        </button>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ----------------------------------------------------------------------------- */}
      {/* 1. PAWN MOVEMENT SPEEDS CONTROL CENTER */}
      {/* ----------------------------------------------------------------------------- */}
      <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Pawns Movement Speed Management</h3>
              <p className="text-xs text-slate-400">
                Configure exact step hop animation durations (in milliseconds) for Ludo and Snake Ludo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => triggerPawnSpeedTest(settings.ludoPawnSpeedMs)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-amber-400" />
            <span>Test Animation Live</span>
          </button>
        </div>

        {/* Live Interactive Hop Simulator Visualizer */}
        <div className="mb-6 p-4 rounded-xl bg-[#141b2d] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#0a0e1a] p-2 rounded-xl border border-slate-700/80">
              {[0, 1, 2, 3, 4, 5].map((tileIdx) => {
                const isCurrent = previewPawnPos === tileIdx;
                return (
                  <div
                    key={tileIdx}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 scale-110 shadow-lg shadow-amber-500/40 ring-2 ring-amber-300'
                        : 'bg-slate-800/80 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isCurrent ? '♟️' : tileIdx + 1}
                  </div>
                );
              })}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-200">
                {isPreviewRunning ? 'Simulating Hop Speed...' : 'Live Hop Visualizer'}
              </div>
              <div className="text-[11px] text-amber-400 font-mono">
                Ludo: {settings.ludoPawnSpeedMs}ms • Snake: {settings.snakeLudoPawnSpeedMs}ms
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => triggerPawnSpeedTest(settings.ludoPawnSpeedMs)}
              disabled={isPreviewRunning}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              Test Ludo Speed
            </button>
            <button
              type="button"
              onClick={() => triggerPawnSpeedTest(settings.snakeLudoPawnSpeedMs)}
              disabled={isPreviewRunning}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              Test Snake Speed
            </button>
          </div>
        </div>

        {/* Speed Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Ludo Match (Classic / Arena) Speed */}
          <div className="p-4 rounded-xl bg-[#141b2d] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Classic Ludo Pawn Movement Speed
                </span>
                <span className="text-[10px] text-slate-400">Step hop interval for standard Ludo boards</span>
              </div>
              <span className="text-sm font-black font-mono text-amber-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                {settings.ludoPawnSpeedMs} ms
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Hyper ⚡', ms: 140 },
                { label: 'Fast 🏎️', ms: 220 },
                { label: 'Normal 🎯', ms: 320 },
                { label: 'Smooth 🎬', ms: 480 },
              ].map((preset) => {
                const isSelected = settings.ludoPawnSpeedMs === preset.ms;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, ludoPawnSpeedMs: preset.ms }))}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Range Slider & Manual Input */}
            <div className="pt-2">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={80}
                  max={800}
                  step={10}
                  value={settings.ludoPawnSpeedMs}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, ludoPawnSpeedMs: Number(e.target.value) }))
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <input
                  type="number"
                  min={50}
                  max={2000}
                  value={settings.ludoPawnSpeedMs}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      ludoPawnSpeedMs: Math.max(50, Number(e.target.value)),
                    }))
                  }
                  className="w-20 bg-[#0a0e1a] border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-400 font-mono font-bold text-center outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>80ms (Ultra Fast)</span>
                <span>320ms (Standard)</span>
                <span>800ms (Slow)</span>
              </div>
            </div>
          </div>

          {/* 2. Snake Ludo Match Speed */}
          <div className="p-4 rounded-xl bg-[#141b2d] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Snake Ludo Pawn Movement Speed
                </span>
                <span className="text-[10px] text-slate-400">Step hop interval for 100-tile Snake Ludo board</span>
              </div>
              <span className="text-sm font-black font-mono text-emerald-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                {settings.snakeLudoPawnSpeedMs} ms
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Blaze ⚡', ms: 90 },
                { label: 'Snappy 🏎️', ms: 160 },
                { label: 'Normal 🎯', ms: 240 },
                { label: 'Relaxed 🐢', ms: 360 },
              ].map((preset) => {
                const isSelected = settings.snakeLudoPawnSpeedMs === preset.ms;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, snakeLudoPawnSpeedMs: preset.ms }))}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Range Slider & Manual Input */}
            <div className="pt-2">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={50}
                  max={600}
                  step={10}
                  value={settings.snakeLudoPawnSpeedMs}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, snakeLudoPawnSpeedMs: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <input
                  type="number"
                  min={50}
                  max={2000}
                  value={settings.snakeLudoPawnSpeedMs}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      snakeLudoPawnSpeedMs: Math.max(50, Number(e.target.value)),
                    }))
                  }
                  className="w-20 bg-[#0a0e1a] border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-mono font-bold text-center outline-none focus:border-emerald-400"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>50ms (Blazing)</span>
                <span>160ms (Snappy)</span>
                <span>600ms (Relaxed)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------------------- */}
      {/* 2. MATCH ENTRY FEES & PRIZE POOL MANAGER */}
      {/* ----------------------------------------------------------------------------- */}
      <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">All Match Entry Fees & Arena Tiers</h3>
              <p className="text-xs text-slate-400">
                Full authority to manage, add, edit, or delete match entry fees across all game modes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetPoolsToDefault}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Mode Defaults</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddTierModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Entry Tier</span>
            </button>
          </div>
        </div>

        {/* Global Financial Parameters: Platform Fee Rake & Winner Payout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-xl bg-[#141b2d] border border-slate-800">
          <div>
            <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1.5">
              Winner Prize Payout (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={50}
                max={100}
                value={settings.prizePoolPercentage}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    prizePoolPercentage: Number(e.target.value),
                    platformFeePercentage: 100 - Number(e.target.value),
                  }))
                }
                className="w-full bg-[#0a0e1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold outline-none focus:border-amber-400"
              />
              <span className="text-xs font-mono text-slate-400">%</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Default 90% net prize pool to the match winner</p>
          </div>

          <div>
            <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1.5">
              Platform Fee Rake (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={50}
                value={settings.platformFeePercentage}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    platformFeePercentage: Number(e.target.value),
                    prizePoolPercentage: 100 - Number(e.target.value),
                  }))
                }
                className="w-full bg-[#0a0e1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold outline-none focus:border-emerald-400"
              />
              <span className="text-xs font-mono text-slate-400">%</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Default 10% platform hosting rake</p>
          </div>

          <div>
            <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1.5">
              Active Tier Count
            </label>
            <div className="bg-[#0a0e1a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono font-bold flex items-center justify-between">
              <span>{getActivePoolList().length} Live Tiers</span>
              <span className="text-amber-400">Mode: {activeFeeTab}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Instant sync to all player lobbies</p>
          </div>
        </div>

        {/* Mode Selector Tabs for Entry Fee Pools */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4 overflow-x-auto">
          {[
            { id: '2P', label: '2-Player Duels (1v1)', count: settings.matchPools2P?.length || 7 },
            { id: '3P', label: '3-Player Arenas (Trio)', count: settings.matchPools3P?.length || 7 },
            { id: '4P', label: '4-Player Rumble (Royal)', count: settings.matchPools4P?.length || 7 },
            { id: 'SNAKE', label: 'Snake Ludo Matches', count: settings.matchPoolsSnake?.length || 7 },
          ].map((tab) => {
            const isActive = activeFeeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFeeTab(tab.id as FeePoolTab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-[#141b2d] text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-slate-950 text-amber-400 font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Entry Fee Tiers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#141b2d] text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-3 rounded-l-xl">Tier Title</th>
                <th className="p-3">Entry Fee ($ USDT)</th>
                <th className="p-3">Net Winner Prize</th>
                <th className="p-3">Badge / Tag</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {getActivePoolList().map((tier, idx) => {
                const playersCount = activeFeeTab === '2P' ? 2 : activeFeeTab === '3P' ? 3 : 4;
                const netPrize = getNetPrize(tier.fee, playersCount);

                return (
                  <tr key={`${tier.fee}-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            tier.colorName === 'red'
                              ? 'bg-rose-500'
                              : tier.colorName === 'green'
                              ? 'bg-emerald-500'
                              : tier.colorName === 'blue'
                              ? 'bg-sky-500'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span className="font-bold text-slate-100">{tier.title}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-400">
                      {tier.fee === 0 ? 'FREE ($0.00)' : `$${tier.fee.toFixed(2)} USDT`}
                    </td>
                    <td className="p-3 font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{netPrize}</span>
                    </td>
                    <td className="p-3">
                      {tier.tag && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                          {tier.tag}
                        </span>
                      )}
                      {tier.isHot && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                          HOT
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active Live</span>
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteTier(idx)}
                        disabled={getActivePoolList().length <= 1}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-30"
                        title="Delete Tier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------------------------------------------------------------------- */}
      {/* 3. PLATFORM RULES, TIMEOUTS & URL SLUG */}
      {/* ----------------------------------------------------------------------------- */}
      <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-base font-black text-white">Platform Game Rules & Custom URL Slug</h3>
            <p className="text-xs text-slate-400">
              Configure turn timers, dice rules, and customize the administrative URL path.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1.5">
              Turn Countdown Timeout (Seconds)
            </label>
            <input
              type="number"
              min={10}
              max={120}
              value={settings.turnTimeoutSeconds}
              onChange={(e) => setSettings((prev) => ({ ...prev, turnTimeoutSeconds: Number(e.target.value) }))}
              className="w-full bg-[#141b2d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono outline-none focus:border-amber-400"
            />
            <p className="text-[10px] text-slate-500 mt-1">Seconds allowed per player turn (Default: 30s)</p>
          </div>

          <div>
            <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1.5">
              Max Consecutive 6s Forfeit Rule
            </label>
            <input
              type="number"
              min={2}
              max={5}
              value={settings.maxConsecutiveSixes}
              onChange={(e) => setSettings((prev) => ({ ...prev, maxConsecutiveSixes: Number(e.target.value) }))}
              className="w-full bg-[#141b2d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono outline-none focus:border-amber-400"
            />
            <p className="text-[10px] text-slate-500 mt-1">Official Ludo 3-consecutive-sixes forfeiture limit</p>
          </div>

          <div>
            <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1.5">
              Admin URL Access Slug
            </label>
            <div className="flex items-center">
              <span className="bg-slate-800 border border-r-0 border-slate-700 rounded-l-xl px-3 py-2 text-xs text-slate-400 font-mono">
                /
              </span>
              <input
                type="text"
                required
                value={settings.adminUrlAlias}
                onChange={(e) => setSettings((prev) => ({ ...prev, adminUrlAlias: e.target.value }))}
                placeholder="admin"
                className="w-full bg-[#141b2d] border border-slate-700 rounded-r-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold outline-none focus:border-amber-400"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Example: <code className="text-slate-400">admin</code> or <code className="text-slate-400">custom</code></p>
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
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings((prev) => ({ ...prev, maintenanceMode: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
          </label>
        </div>
      </div>

      {/* ----------------------------------------------------------------------------- */}
      {/* 4. CACHE & QUEUE MAINTENANCE */}
      {/* ----------------------------------------------------------------------------- */}
      <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-rose-400" />
          <h3 className="text-base font-black text-white">System Cache & Matchmaking Maintenance</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Safe administrative triggers to flush Redis matchmaking pools, clear stalled queues, or reset cache.
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
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            Clear Matchmaking Queues
          </button>
          <button
            type="button"
            onClick={() => handleFlushCache('all')}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/30 transition-colors cursor-pointer"
          >
            Flush Ludo Redis Cache
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------------------- */}
      {/* MODAL: ADD NEW ENTRY FEE TIER */}
      {/* ----------------------------------------------------------------------------- */}
      {showAddTierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0e131f] border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Add New Match Entry Tier ({activeFeeTab})
              </h3>
              <button
                onClick={() => setShowAddTierModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTier} className="space-y-4">
              <div>
                <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1">
                  Tier Title Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Champions League"
                  value={newTierTitle}
                  onChange={(e) => setNewTierTitle(e.target.value)}
                  className="w-full bg-[#141b2d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1">
                    Entry Fee ($ USDT)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={newTierFee}
                    onChange={(e) => setNewTierFee(Number(e.target.value))}
                    className="w-full bg-[#141b2d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1">
                    Tag / Label (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pro, VIP"
                    value={newTierTag}
                    onChange={(e) => setNewTierTag(e.target.value)}
                    className="w-full bg-[#141b2d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1">
                    Color Accent
                  </label>
                  <select
                    value={newTierColor}
                    onChange={(e) => setNewTierColor(e.target.value as any)}
                    className="w-full bg-[#141b2d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none"
                  >
                    <option value="yellow">Yellow (Golden)</option>
                    <option value="red">Red (Royal)</option>
                    <option value="green">Green (Emerald)</option>
                    <option value="blue">Blue (Sapphire)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isHotCheck"
                    checked={newTierIsHot}
                    onChange={(e) => setNewTierIsHot(e.target.checked)}
                    className="accent-rose-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="isHotCheck" className="text-xs text-slate-300 font-bold cursor-pointer">
                    Show HOT Badge 🔥
                  </label>
                </div>
              </div>

              <div className="p-3 bg-[#141b2d] rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
                Net Prize Payout:{' '}
                <span className="text-emerald-400 font-bold">
                  {getNetPrize(
                    newTierFee,
                    activeFeeTab === '2P' ? 2 : activeFeeTab === '3P' ? 3 : 4
                  )}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTierModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black shadow-md hover:from-amber-400"
                >
                  Add Entry Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
