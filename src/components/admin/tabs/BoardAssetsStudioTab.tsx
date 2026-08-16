import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  Save,
  Eye,
  Palette,
  Crown,
  Zap,
  Check,
  Play,
  RefreshCw,
  Gem,
  LayoutGrid,
  Layers,
  Smartphone,
  CheckCheck,
  Flame,
} from 'lucide-react';
import {
  LOBBY_THEMES,
  BOARD_THEMES,
  DICE_SKINS,
  PAWN_SKINS,
} from '../../../game/themeRegistry';
import { PlayerColor } from '../../../types/game';
import { SoundManager } from '../../../audio/soundManager';

interface BoardAssetsStudioTabProps {
  token: string;
}

export const BoardAssetsStudioTab: React.FC<BoardAssetsStudioTabProps> = ({ token }) => {
  const [activeCategory, setActiveCategory] = useState<'lobbies' | 'boards' | 'dice' | 'pawns' | 'sandbox'>('lobbies');

  // Currently Selected / Active IDs
  const [activeLobbyId, setActiveLobbyId] = useState<string>('dubai_prestige_gold');
  const [activeBoardId, setActiveBoardId] = useState<string>('dubai_royal_sunset');
  const [activeDiceId, setActiveDiceId] = useState<string>('golden_high_roller');
  const [activePawnId, setActivePawnId] = useState<string>('royal_crowned');

  // Enabled lists for platform
  const [enabledLobbies, setEnabledLobbies] = useState<string[]>(LOBBY_THEMES.map((l) => l.id));
  const [enabledBoards, setEnabledBoards] = useState<string[]>(BOARD_THEMES.map((b) => b.id));
  const [enabledDice, setEnabledDice] = useState<string[]>(DICE_SKINS.map((d) => d.id));
  const [enabledPawns, setEnabledPawns] = useState<string[]>(PAWN_SKINS.map((p) => p.id));

  // Sandbox Live Test States
  const [sandboxTurnColor, setSandboxTurnColor] = useState<PlayerColor>('blue');
  const [sandboxDiceVal, setSandboxDiceVal] = useState<number>(6);
  const [isRollingSandboxDice, setIsRollingSandboxDice] = useState<boolean>(false);
  const [sandboxPawnBouncing, setSandboxPawnBouncing] = useState<string | null>(null);

  // Status & Notifications
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Fetch from server / local storage on mount
  useEffect(() => {
    const fetchThemeConfig = async () => {
      try {
        const res = await fetch('/api/admin/theme-assets');
        const data = await res.json();
        if (data.themeConfig) {
          if (data.themeConfig.activeLobbyId) setActiveLobbyId(data.themeConfig.activeLobbyId);
          if (data.themeConfig.activeBoardId) setActiveBoardId(data.themeConfig.activeBoardId);
          if (data.themeConfig.activeDiceId) setActiveDiceId(data.themeConfig.activeDiceId);
          if (data.themeConfig.activePawnId) setActivePawnId(data.themeConfig.activePawnId);
          if (data.themeConfig.enabledLobbies) setEnabledLobbies(data.themeConfig.enabledLobbies);
          if (data.themeConfig.enabledBoards) setEnabledBoards(data.themeConfig.enabledBoards);
          if (data.themeConfig.enabledDice) setEnabledDice(data.themeConfig.enabledDice);
          if (data.themeConfig.enabledPawns) setEnabledPawns(data.themeConfig.enabledPawns);
        }
      } catch {
        // Fallback to local storage
        const saved = localStorage.getItem('ludo_active_theme_config');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.activeLobbyId) setActiveLobbyId(parsed.activeLobbyId);
            if (parsed.activeBoardId) setActiveBoardId(parsed.activeBoardId);
            if (parsed.activeDiceId) setActiveDiceId(parsed.activeDiceId);
            if (parsed.activePawnId) setActivePawnId(parsed.activePawnId);
          } catch {}
        }
      }
    };

    fetchThemeConfig();
  }, []);

  const currentLobby = LOBBY_THEMES.find((l) => l.id === activeLobbyId) || LOBBY_THEMES[0];
  const currentBoard = BOARD_THEMES.find((b) => b.id === activeBoardId) || BOARD_THEMES[0];
  const currentDice = DICE_SKINS.find((d) => d.id === activeDiceId) || DICE_SKINS[0];
  const currentPawn = PAWN_SKINS.find((p) => p.id === activePawnId) || PAWN_SKINS[0];

  // Save to Backend and Local Storage
  const handleDeployToPlatform = async () => {
    setIsSaving(true);
    setSaveSuccess(null);

    const payload = {
      activeLobbyId,
      activeBoardId,
      activeDiceId,
      activePawnId,
      enabledLobbies,
      enabledBoards,
      enabledDice,
      enabledPawns,
      updatedAt: new Date().toISOString(),
    };

    try {
      // Save locally for instant preview sync across all tabs
      localStorage.setItem('ludo_active_theme_config', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('ludo_theme_changed', { detail: payload }));
      window.dispatchEvent(new CustomEvent('ludo_theme_updated', { detail: payload }));

      const res = await fetch('/api/admin/theme-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveSuccess('Live Platform Lobby, Board & Assets deployed successfully!');
        SoundManager.play('battle-horn');
        setTimeout(() => setSaveSuccess(null), 4000);
      }
    } catch {
      setSaveSuccess('Theme saved locally! (Backend sync fallback)');
      setTimeout(() => setSaveSuccess(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Roll Sandbox Dice Simulation
  const handleRollSandboxDice = () => {
    if (isRollingSandboxDice) return;
    setIsRollingSandboxDice(true);
    SoundManager.play('dice-roll');

    const rollInterval = setInterval(() => {
      setSandboxDiceVal(Math.floor(Math.random() * 6) + 1);
    }, 90);

    setTimeout(() => {
      clearInterval(rollInterval);
      const finalVal = Math.floor(Math.random() * 6) + 1;
      setSandboxDiceVal(finalVal);
      setIsRollingSandboxDice(false);
      SoundManager.play('dice-land');
      if (finalVal === 6) SoundManager.play('pawn-finish');
    }, 700);
  };

  return (
    <div className="space-y-6 select-none">
      {/* 1. TOP HERO BANNER & ACTIVE SELECTION STATUS */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#140a2b] via-[#1a103c] to-[#0d0722] border-2 border-amber-500/40 p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(251,191,36,0.6)] flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 fill-slate-950" />
                <span>Modular Platform Studio</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Broadcast Sync Active</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Lobby, Ludo Boards, Pawns & Dice Customizer
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Visually inspect, curate, and deploy official platform lobby environments, 3D Ludo boards, dice sets, and character pawn figurines in real-time across all players.
            </p>
          </div>

          {/* Action Deploy Button & Status */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setActiveCategory('sandbox')}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Live 3D Sandbox</span>
            </button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDeployToPlatform}
              disabled={isSaving}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-[0_6px_25px_rgba(251,191,36,0.6)] border border-yellow-200 flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Deploying...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 fill-slate-950" />
                  <span>Save & Deploy Live</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Live Active 4-Pill Badges Bar */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-3 border border-amber-500/30">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-md">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Lobby</div>
              <div className="text-sm font-black text-amber-300 truncate">{currentLobby.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-3 border border-amber-500/30">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Board</div>
              <div className="text-sm font-black text-amber-300 truncate">{currentBoard.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-3 border border-amber-500/30">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active 3D Dice</div>
              <div className="text-sm font-black text-amber-300 truncate">{currentDice.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-3 border border-amber-500/30">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Gem className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Pawns</div>
              <div className="text-sm font-black text-amber-300 truncate">{currentPawn.name}</div>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccess}</span>
          </motion.div>
        )}
      </div>

      {/* 2. CATEGORY SWITCHER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'lobbies', label: 'Lobby Environments', icon: LayoutGrid, count: LOBBY_THEMES.length },
          { id: 'boards', label: 'Ludo Boards', icon: Palette, count: BOARD_THEMES.length },
          { id: 'dice', label: 'Dice Sets', icon: Zap, count: DICE_SKINS.length },
          { id: 'pawns', label: 'Pawns & Figurines', icon: Gem, count: PAWN_SKINS.length },
          { id: 'sandbox', label: 'Interactive Live Sandbox', icon: Eye, highlight: true },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                SoundManager.play('click');
                setActiveCategory(tab.id as any);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-102'
                  : 'bg-[#101626] text-slate-300 hover:bg-[#182038] hover:text-white border border-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {tab.highlight && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. CATEGORY CONTENT VIEWS */}

      {/* =========================================================================
          VIEW A: LOBBY THEMES CATALOG WITH RICH VISUAL MOCKUPS
      ========================================================================= */}
      {activeCategory === 'lobbies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Select Live Game Platform Lobby Environment</span>
              <span className="text-xs text-slate-400 font-normal">({LOBBY_THEMES.length} Environments Available)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {LOBBY_THEMES.map((theme) => {
              const isSelected = activeLobbyId === theme.id;

              return (
                <motion.div
                  key={theme.id}
                  whileHover={{ y: -4 }}
                  className={`relative rounded-3xl overflow-hidden border-2 transition-all duration-300 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#18112e] border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.4)] ring-2 ring-amber-400/30'
                      : 'bg-[#0e1222] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Badge Tag */}
                  <div className="p-4 pb-2 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-amber-300 border border-amber-400/20">
                        {theme.category}
                      </span>
                      {theme.id === 'dubai_prestige_gold' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Current Default
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" /> Active Live
                      </span>
                    )}
                  </div>

                  {/* VISUAL LOBBY MINI MOCKUP CONTAINER */}
                  <div className="px-4 py-2">
                    <div
                      className={`relative w-full aspect-[4/3] max-w-[280px] mx-auto rounded-2xl p-2.5 border-2 ${theme.bodyBgClass} border-slate-700/60 shadow-2xl flex flex-col justify-between overflow-hidden`}
                      style={{ boxShadow: `0 8px 30px ${theme.accentGlow}` }}
                    >
                      {/* Atmosphere FX Overlay */}
                      {theme.atmosphere === 'grid' && (
                        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[linear-gradient(to_right,#06b6d420_1px,transparent_1px),linear-gradient(to_bottom,#06b6d420_1px,transparent_1px)] bg-[size:12px_12px]" />
                      )}
                      {theme.atmosphere === 'aurora' && (
                        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/40 via-teal-900/20 to-transparent" />
                      )}
                      {theme.atmosphere === 'bokeh' && (
                        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/30 via-amber-700/20 to-transparent" />
                      )}

                      {/* Mockup Mini Header */}
                      <div
                        className={`w-full py-1.5 px-2 rounded-xl ${theme.headerBorderClass} border flex items-center justify-between shadow-md z-10`}
                        style={{ background: theme.headerBgGradient }}
                      >
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded-md bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-[8px] font-black text-slate-950">
                            🎁
                          </div>
                          <span className="text-[9px] font-black text-amber-300">OPEN</span>
                        </div>
                        <div className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[9px] font-black text-amber-300">
                          $1,250
                        </div>
                      </div>

                      {/* Mockup Mini Lobby 3D Game Cards */}
                      <div className="space-y-1.5 my-auto z-10">
                        {/* Mini Card 1: Ludo Online Arena */}
                        <div className="w-full h-8 rounded-xl bg-gradient-to-r from-[#200b47] to-[#12052b] border border-amber-400/40 p-1 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-lg bg-amber-400 flex items-center justify-center text-[10px] font-black text-slate-950">
                              🎲
                            </div>
                            <div className="leading-none">
                              <div className="text-[9px] font-black text-white">LUDO ONLINE</div>
                              <div className="text-[7px] text-amber-400 font-semibold">PLAY FOR CASH</div>
                            </div>
                          </div>
                          <div className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-yellow-500 text-[8px] font-black text-slate-950">
                            PLAY
                          </div>
                        </div>

                        {/* Mini Card 2: Snake Ludo */}
                        <div className="w-full h-7 rounded-xl bg-gradient-to-r from-[#032b1d] to-[#01140e] border border-emerald-400/40 p-1 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-emerald-400 flex items-center justify-center text-[9px] font-black text-slate-950">
                              🐍
                            </div>
                            <div className="leading-none">
                              <div className="text-[8px] font-black text-white">SNAKE LUDO</div>
                            </div>
                          </div>
                          <div className="px-2 py-0.5 rounded-md bg-emerald-400 text-[7px] font-black text-slate-950">
                            ENTER
                          </div>
                        </div>
                      </div>

                      {/* Mockup Mini Curved Bottom Nav */}
                      <div
                        className={`w-full py-1 px-3 rounded-xl border ${theme.bottomNavBorder} flex items-center justify-around z-10`}
                        style={{ background: theme.bottomNavGradient }}
                      >
                        <span className="text-[8px] font-bold" style={{ color: theme.bottomNavActiveColor }}>● Home</span>
                        <span className="text-[8px] font-medium text-slate-400">Studio</span>
                        <span className="text-[8px] font-medium text-slate-400">Refer</span>
                        <span className="text-[8px] font-medium text-slate-400">Wallet</span>
                      </div>
                    </div>
                  </div>

                  {/* INFO & CONTROLS */}
                  <div className="p-4 pt-2 space-y-3">
                    <div>
                      <h4 className="text-sm font-black text-white">{theme.name}</h4>
                      <p className="text-xs text-slate-400 leading-snug mt-0.5">{theme.description}</p>
                    </div>

                    {/* Atmospheric Tag */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-[11px] font-mono text-slate-300">
                      <span className="text-slate-400">Atmosphere FX:</span>
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-amber-300 font-bold uppercase text-[9px]">
                        {theme.atmosphere}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          SoundManager.play('click');
                          setActiveLobbyId(theme.id);
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/30'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCheck className="w-4 h-4 text-slate-950" />
                            <span>Currently Active</span>
                          </>
                        ) : (
                          <>
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span>Set as Active Lobby</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW B: LUDO BOARDS CATALOG WITH RICH VISUAL PREVIEW CARDS
      ========================================================================= */}
      {activeCategory === 'boards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Select Official Ludo Board Theme</span>
              <span className="text-xs text-slate-400 font-normal">({BOARD_THEMES.length} Themes Available)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {BOARD_THEMES.map((theme) => {
              const isSelected = activeBoardId === theme.id;

              return (
                <motion.div
                  key={theme.id}
                  whileHover={{ y: -4 }}
                  className={`relative rounded-3xl overflow-hidden border-2 transition-all duration-300 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#18112e] border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.4)] ring-2 ring-amber-400/30'
                      : 'bg-[#0e1222] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Badge Tag */}
                  <div className="p-4 pb-2 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-amber-300 border border-amber-400/20">
                        {theme.category}
                      </span>
                      <span className="text-xs font-black text-white">{theme.name}</span>
                    </div>

                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" /> Active
                      </span>
                    )}
                  </div>

                  {/* VISUAL BOARD MINIATURE PREVIEW */}
                  <div className="px-4 py-2">
                    <div
                      className={`relative w-full aspect-square max-w-[240px] mx-auto rounded-2xl p-2 border-2 ${theme.bgBoardClass} ${theme.boardBorderClass} shadow-inner flex flex-col justify-between overflow-hidden`}
                      style={{ boxShadow: `0 4px 20px ${theme.boardGlowColor}` }}
                    >
                      {/* Top Row: Blue Home & Red Home */}
                      <div className="flex items-center justify-between w-full h-[36%]">
                        {/* Blue Home Base */}
                        <div
                          className="w-[36%] h-full rounded-xl border-2 flex items-center justify-center p-1"
                          style={{ background: theme.cornerBases.blue.bgGradient, borderColor: theme.cornerBases.blue.borderClass }}
                        >
                          <div className="grid grid-cols-2 gap-1 w-full h-full p-1 bg-white/20 rounded-lg">
                            <div className="rounded-full bg-white/80 shadow-sm" />
                            <div className="rounded-full bg-white/80 shadow-sm" />
                            <div className="rounded-full bg-white/80 shadow-sm" />
                            <div className="rounded-full bg-white/80 shadow-sm" />
                          </div>
                        </div>

                        {/* Red Home Stem (Vertical) */}
                        <div className="w-[24%] h-full flex flex-col items-center justify-center gap-0.5">
                          <div className={`w-full h-1/4 rounded-xs ${theme.startCells.red.bgClass}`} />
                          <div className={`w-full h-1/4 rounded-xs ${theme.stemColors.red.bgClass}`} />
                          <div className={`w-full h-1/4 rounded-xs ${theme.stemColors.red.bgClass}`} />
                          <div className={`w-full h-1/4 rounded-xs ${theme.stemColors.red.bgClass}`} />
                        </div>

                        {/* Red Home Base */}
                        <div
                          className="w-[36%] h-full rounded-xl border-2 flex items-center justify-center p-1"
                          style={{ background: theme.cornerBases.red.bgGradient, borderColor: theme.cornerBases.red.borderClass }}
                        >
                          <div className="grid grid-cols-2 gap-1 w-full h-full p-1 bg-white/20 rounded-lg">
                            <div className="rounded-full bg-white/80 shadow-sm" />
                            <div className="rounded-full bg-white/80 shadow-sm" />
                            <div className="rounded-full bg-white/80 shadow-sm" />
                            <div className="rounded-full bg-white/80 shadow-sm" />
                          </div>
                        </div>
                      </div>

                      {/* Middle Row: Blue Stem, Center Goal, Green Stem */}
                      <div className="flex items-center justify-between w-full h-[24%]">
                        {/* Blue Stem (Horizontal) */}
                        <div className="w-[36%] h-full flex items-center justify-center gap-0.5">
                          <div className={`w-1/4 h-full rounded-xs ${theme.startCells.blue.bgClass}`} />
                          <div className={`w-1/4 h-full rounded-xs ${theme.stemColors.blue.bgClass}`} />
                          <div className={`w-1/4 h-full rounded-xs ${theme.stemColors.blue.bgClass}`} />
                          <div className={`w-1/4 h-full rounded-xs ${theme.stemColors.blue.bgClass}`} />
                        </div>

                        {/* Center Goal 4-Way Triangle */}
                        <div
                          className="w-[24%] h-full rounded-lg border flex items-center justify-center shadow-md relative overflow-hidden"
                          style={{ background: theme.centerBgGradient }}
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-300" />
                        </div>

                        {/* Green Stem (Horizontal) */}
                        <div className="w-[36%] h-full flex items-center justify-center gap-0.5">
                          <div className={`w-1/4 h-full rounded-xs ${theme.stemColors.green.bgClass}`} />
                          <div className={`w-1/4 h-full rounded-xs ${theme.stemColors.green.bgClass}`} />
                          <div className={`w-1/4 h-full rounded-xs ${theme.stemColors.green.bgClass}`} />
                          <div className={`w-1/4 h-full rounded-xs ${theme.startCells.green.bgClass}`} />
                        </div>
                      </div>

                      {/* Bottom Row: Yellow Home & Green Home */}
                      <div className="flex items-center justify-between w-full h-[36%]">
                        {/* Yellow Home Base */}
                        <div
                          className="w-[36%] h-full rounded-xl border-2 flex items-center justify-center p-1"
                          style={{ background: theme.cornerBases.yellow.bgGradient, borderColor: theme.cornerBases.yellow.borderClass }}
                        >
                          <div className="grid grid-cols-2 gap-1 w-full h-full p-1 bg-white/20 rounded-lg">
                            <div className="rounded-full bg-white/80 shadow-sm" />
                            <div className="rounded-full bg-white/80 shadow-sm" />
                            <div className="rounded-full bg-white/80 shadow-sm" />
                            <div className="rounded-full bg-white/80 shadow-sm" />
                          </div>
                        </div>

                        {/* Yellow Home Stem (Vertical) */}
                        <div className="w-[24%] h-full flex flex-col items-center justify-center gap-0.5">
                          <div className={`w-full h-1/4 rounded-xs ${theme.stemColors.yellow.bgClass}`} />
                          <div className={`w-full h-1/4 rounded-xs ${theme.stemColors.yellow.bgClass}`} />
                          <div className={`w-full h-1/4 rounded-xs ${theme.stemColors.yellow.bgClass}`} />
                          <div className={`w-full h-1/4 rounded-xs ${theme.startCells.yellow.bgClass}`} />
                        </div>

                        {/* Green Home Base */}
                        <div
                          className="w-[36%] h-full rounded-xl border-2 flex items-center justify-center p-1"
                          style={{ background: theme.cornerBases.green.bgGradient, borderColor: theme.cornerBases.green.borderClass }}
                        >
                          <div className="grid grid-cols-2 gap-1 w-full h-full p-1 bg-white/20 rounded-lg">
                            <div className="rounded-full bg-white/80 shadow-sm" />
                            <div className="rounded-full bg-white/80 shadow-sm" />
                            <div className="rounded-full bg-white/80 shadow-sm" />
                            <div className="rounded-full bg-white/80 shadow-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* INFO & CONTROLS */}
                  <div className="p-4 pt-2 space-y-3">
                    <div>
                      <h4 className="text-sm font-black text-white">{theme.name}</h4>
                      <p className="text-xs text-slate-400 leading-snug mt-0.5">{theme.description}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                      <button
                        onClick={() => {
                          SoundManager.play('click');
                          setActiveBoardId(theme.id);
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/30'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCheck className="w-4 h-4 text-slate-950" />
                            <span>Currently Active</span>
                          </>
                        ) : (
                          <>
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span>Set as Active Board</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW C: 3D DICE SKINS CATALOG WITH ROLLED PIP PREVIEWS
      ========================================================================= */}
      {activeCategory === 'dice' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Select Official 3D Dice Skin Model</span>
              <span className="text-xs text-slate-400 font-normal">({DICE_SKINS.length} Models Available)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {DICE_SKINS.map((skin) => {
              const isSelected = activeDiceId === skin.id;

              return (
                <motion.div
                  key={skin.id}
                  whileHover={{ y: -4 }}
                  className={`relative rounded-3xl overflow-hidden border-2 transition-all duration-300 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#18112e] border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.4)] ring-2 ring-amber-400/30'
                      : 'bg-[#0e1222] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="p-4 pb-2 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-amber-300 border border-amber-400/20">
                        {skin.rarity}
                      </span>
                      <span className="text-xs font-black text-white">{skin.name}</span>
                    </div>

                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" /> Active
                      </span>
                    )}
                  </div>

                  {/* 3D DICE VISUAL PREVIEW CUBE */}
                  <div className="px-4 py-4 flex items-center justify-center">
                    <div
                      className="relative w-24 h-24 rounded-2xl border-2 flex items-center justify-center p-3 shadow-2xl transition-transform hover:scale-105"
                      style={{
                        background: skin.cubeBgGradient,
                        borderColor: skin.cubeBorderColor,
                        boxShadow: skin.cubeBoxShadow,
                      }}
                    >
                      {/* Pips for face 5 */}
                      <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-full h-full">
                        <div className="col-start-1 row-start-1 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: skin.pipColor }} />
                        <div className="col-start-3 row-start-1 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: skin.pipColor }} />
                        <div className="col-start-2 row-start-2 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: skin.pipColor }} />
                        <div className="col-start-1 row-start-3 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: skin.pipColor }} />
                        <div className="col-start-3 row-start-3 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: skin.pipColor }} />
                      </div>
                    </div>
                  </div>

                  {/* INFO & CONTROLS */}
                  <div className="p-4 pt-2 space-y-3">
                    <div>
                      <h4 className="text-sm font-black text-white">{skin.name}</h4>
                      <p className="text-xs text-slate-400 leading-snug mt-0.5">{skin.description}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                      <button
                        onClick={() => {
                          SoundManager.play('click');
                          setActiveDiceId(skin.id);
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/30'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCheck className="w-4 h-4 text-slate-950" />
                            <span>Currently Active</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>Set as Active Dice</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW D: PAWNS & FIGURINES CATALOG
      ========================================================================= */}
      {activeCategory === 'pawns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Select Official Pawn Figurine Collection</span>
              <span className="text-xs text-slate-400 font-normal">({PAWN_SKINS.length} Collections Available)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {PAWN_SKINS.map((skin) => {
              const isSelected = activePawnId === skin.id;

              return (
                <motion.div
                  key={skin.id}
                  whileHover={{ y: -4 }}
                  className={`relative rounded-3xl overflow-hidden border-2 transition-all duration-300 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#18112e] border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.4)] ring-2 ring-amber-400/30'
                      : 'bg-[#0e1222] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="p-4 pb-2 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-amber-300 border border-amber-400/20">
                        {skin.rarity}
                      </span>
                      <span className="text-xs font-black text-white">{skin.name}</span>
                    </div>

                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" /> Active
                      </span>
                    )}
                  </div>

                  {/* 4 COLOR PAWN FIGURINES DISPLAY */}
                  <div className="px-4 py-3 flex items-center justify-center gap-3">
                    {(['blue', 'red', 'green', 'yellow'] as PlayerColor[]).map((c) => {
                      const col = skin.colors[c];
                      return (
                        <div key={c} className="flex flex-col items-center gap-1">
                          <div
                            className={`w-9 h-11 rounded-t-full rounded-b-lg bg-gradient-to-t ${col.primaryGradient} border-2 shadow-lg flex items-center justify-center relative overflow-hidden`}
                            style={{ borderColor: col.borderColor }}
                          >
                            {skin.styleType === 'crowned' && <Crown className="w-3.5 h-3.5 text-amber-300" />}
                            {skin.styleType === 'crystal' && <Gem className="w-3 h-3 text-white" />}
                            {skin.styleType === 'mecha' && <Zap className="w-3 h-3 text-cyan-300" />}
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{c}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* INFO & CONTROLS */}
                  <div className="p-4 pt-2 space-y-3">
                    <div>
                      <h4 className="text-sm font-black text-white">{skin.name}</h4>
                      <p className="text-xs text-slate-400 leading-snug mt-0.5">{skin.description}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                      <button
                        onClick={() => {
                          SoundManager.play('click');
                          setActivePawnId(skin.id);
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/30'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCheck className="w-4 h-4 text-slate-950" />
                            <span>Currently Active</span>
                          </>
                        ) : (
                          <>
                            <Gem className="w-3.5 h-3.5 text-amber-400" />
                            <span>Set as Active Pawns</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW E: LIVE INTERACTIVE 3D SANDBOX
      ========================================================================= */}
      {activeCategory === 'sandbox' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Interactive Live Sandbox Environment</span>
              </h3>
              <p className="text-xs text-slate-400">
                Live simulation testing the deployed combination of Lobby: <strong className="text-amber-400">{currentLobby.name}</strong>, Board: <strong className="text-amber-400">{currentBoard.name}</strong>, Dice: <strong className="text-amber-400">{currentDice.name}</strong>, Pawns: <strong className="text-amber-400">{currentPawn.name}</strong>.
              </p>
            </div>

            {/* Turn Color Switcher in Sandbox */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-bold mr-1">Turn:</span>
              {(['blue', 'red', 'green', 'yellow'] as PlayerColor[]).map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    SoundManager.play('click');
                    setSandboxTurnColor(c);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                    sandboxTurnColor === c
                      ? 'bg-white text-slate-950 scale-105 shadow-md ring-2 ring-amber-400'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* MAIN SANDBOX SPLIT LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT 2 COLUMNS: INTERACTIVE BOARD PREVIEW */}
            <div className="lg:col-span-2 bg-[#0d0722] rounded-3xl border-2 border-violet-800/40 p-4 sm:p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
              <div
                className="absolute inset-0 blur-3xl pointer-events-none opacity-30"
                style={{ backgroundColor: currentBoard.boardGlowColor }}
              />

              {/* LUDO BOARD 15x15 MOCKUP RENDER */}
              <div
                className={`relative w-full max-w-[420px] aspect-square rounded-3xl p-3 border-4 ${currentBoard.bgBoardClass} ${currentBoard.boardBorderClass} shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col justify-between overflow-hidden`}
              >
                {/* Top Bases: Blue & Red */}
                <div className="flex items-center justify-between w-full h-[38%]">
                  {/* Blue Base with 4 Pawns */}
                  <div
                    className="w-[38%] h-full rounded-2xl border-2 flex items-center justify-center p-2 shadow-md relative"
                    style={{ background: currentBoard.cornerBases.blue.bgGradient, borderColor: currentBoard.cornerBases.blue.borderClass }}
                  >
                    <div className="grid grid-cols-2 gap-2 w-full h-full p-2 bg-white/25 rounded-xl">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={`b-${i}`}
                          whileHover={{ scale: 1.3, y: -4 }}
                          animate={sandboxPawnBouncing === `b-${i}` ? { y: [-6, 0, -6] } : {}}
                          onClick={() => {
                            SoundManager.play('pawn-step');
                            setSandboxPawnBouncing(`b-${i}`);
                            setTimeout(() => setSandboxPawnBouncing(null), 800);
                          }}
                          className="rounded-full flex items-center justify-center cursor-pointer relative"
                        >
                          <div className={`w-5 h-6 rounded-full bg-gradient-to-tr ${currentPawn.colors.blue.primaryGradient} border border-white/50 shadow-md flex items-center justify-center`}>
                            {currentPawn.styleType === 'crowned' && <Crown className="w-2 h-2 text-amber-300" />}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Red Home Stem Pathway */}
                  <div className="w-[20%] h-full flex flex-col items-center justify-between gap-1">
                    <div className={`w-full flex-1 rounded-sm ${currentBoard.startCells.red.bgClass} flex items-center justify-center text-[10px] text-white font-bold`}>★</div>
                    <div className={`w-full flex-1 rounded-sm ${currentBoard.stemColors.red.bgClass}`} />
                    <div className={`w-full flex-1 rounded-sm ${currentBoard.stemColors.red.bgClass}`} />
                    <div className={`w-full flex-1 rounded-sm ${currentBoard.stemColors.red.bgClass}`} />
                    <div className={`w-full flex-1 rounded-sm ${currentBoard.stemColors.red.bgClass}`} />
                  </div>

                  {/* Red Base with 4 Pawns */}
                  <div
                    className="w-[38%] h-full rounded-2xl border-2 flex items-center justify-center p-2 shadow-md relative"
                    style={{ background: currentBoard.cornerBases.red.bgGradient, borderColor: currentBoard.cornerBases.red.borderClass }}
                  >
                    <div className="grid grid-cols-2 gap-2 w-full h-full p-2 bg-white/25 rounded-xl">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={`r-${i}`}
                          whileHover={{ scale: 1.3, y: -4 }}
                          animate={sandboxPawnBouncing === `r-${i}` ? { y: [-6, 0, -6] } : {}}
                          onClick={() => {
                            SoundManager.play('pawn-step');
                            setSandboxPawnBouncing(`r-${i}`);
                            setTimeout(() => setSandboxPawnBouncing(null), 800);
                          }}
                          className="rounded-full flex items-center justify-center cursor-pointer"
                        >
                          <div className={`w-5 h-6 rounded-full bg-gradient-to-tr ${currentPawn.colors.red.primaryGradient} border border-white/50 shadow-md flex items-center justify-center`}>
                            {currentPawn.styleType === 'crowned' && <Crown className="w-2 h-2 text-amber-300" />}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Middle Stems & Center Goal */}
                <div className="flex items-center justify-between w-full h-[20%] my-1">
                  {/* Blue Stem */}
                  <div className="w-[38%] h-full flex items-center justify-between gap-1">
                    <div className={`h-full flex-1 rounded-sm ${currentBoard.startCells.blue.bgClass} flex items-center justify-center text-[10px] text-white font-bold`}>★</div>
                    <div className={`h-full flex-1 rounded-sm ${currentBoard.stemColors.blue.bgClass}`} />
                    <div className={`h-full flex-1 rounded-sm ${currentBoard.stemColors.blue.bgClass}`} />
                    <div className={`h-full flex-1 rounded-sm ${currentBoard.stemColors.blue.bgClass}`} />
                    <div className={`h-full flex-1 rounded-sm ${currentBoard.stemColors.blue.bgClass}`} />
                  </div>

                  {/* Center Crown Hub */}
                  <div
                    className="w-[20%] h-full rounded-xl border-2 border-amber-400 flex items-center justify-center shadow-lg relative overflow-hidden"
                    style={{ background: currentBoard.centerBgGradient }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    >
                      <Crown className="w-5 h-5 text-amber-300" />
                    </motion.div>
                  </div>

                  {/* Green Stem */}
                  <div className="w-[38%] h-full flex items-center justify-between gap-1">
                    <div className={`h-full flex-1 rounded-sm ${currentBoard.stemColors.green.bgClass}`} />
                    <div className={`h-full flex-1 rounded-sm ${currentBoard.stemColors.green.bgClass}`} />
                    <div className={`h-full flex-1 rounded-sm ${currentBoard.stemColors.green.bgClass}`} />
                    <div className={`h-full flex-1 rounded-sm ${currentBoard.stemColors.green.bgClass}`} />
                    <div className={`h-full flex-1 rounded-sm ${currentBoard.startCells.green.bgClass} flex items-center justify-center text-[10px] text-white font-bold`}>★</div>
                  </div>
                </div>

                {/* Bottom Bases: Yellow & Green */}
                <div className="flex items-center justify-between w-full h-[38%]">
                  {/* Yellow Base */}
                  <div
                    className="w-[38%] h-full rounded-2xl border-2 flex items-center justify-center p-2 shadow-md relative"
                    style={{ background: currentBoard.cornerBases.yellow.bgGradient, borderColor: currentBoard.cornerBases.yellow.borderClass }}
                  >
                    <div className="grid grid-cols-2 gap-2 w-full h-full p-2 bg-white/25 rounded-xl">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={`y-${i}`}
                          whileHover={{ scale: 1.3, y: -4 }}
                          animate={sandboxPawnBouncing === `y-${i}` ? { y: [-6, 0, -6] } : {}}
                          onClick={() => {
                            SoundManager.play('pawn-step');
                            setSandboxPawnBouncing(`y-${i}`);
                            setTimeout(() => setSandboxPawnBouncing(null), 800);
                          }}
                          className="rounded-full flex items-center justify-center cursor-pointer"
                        >
                          <div className={`w-5 h-6 rounded-full bg-gradient-to-tr ${currentPawn.colors.yellow.primaryGradient} border border-white/50 shadow-md flex items-center justify-center`}>
                            {currentPawn.styleType === 'crowned' && <Crown className="w-2 h-2 text-amber-300" />}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Yellow Home Stem */}
                  <div className="w-[20%] h-full flex flex-col items-center justify-between gap-1">
                    <div className={`w-full flex-1 rounded-sm ${currentBoard.stemColors.yellow.bgClass}`} />
                    <div className={`w-full flex-1 rounded-sm ${currentBoard.stemColors.yellow.bgClass}`} />
                    <div className={`w-full flex-1 rounded-sm ${currentBoard.stemColors.yellow.bgClass}`} />
                    <div className={`w-full flex-1 rounded-sm ${currentBoard.stemColors.yellow.bgClass}`} />
                    <div className={`w-full flex-1 rounded-sm ${currentBoard.startCells.yellow.bgClass} flex items-center justify-center text-[10px] text-white font-bold`}>★</div>
                  </div>

                  {/* Green Base */}
                  <div
                    className="w-[38%] h-full rounded-2xl border-2 flex items-center justify-center p-2 shadow-md relative"
                    style={{ background: currentBoard.cornerBases.green.bgGradient, borderColor: currentBoard.cornerBases.green.borderClass }}
                  >
                    <div className="grid grid-cols-2 gap-2 w-full h-full p-2 bg-white/25 rounded-xl">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={`g-${i}`}
                          whileHover={{ scale: 1.3, y: -4 }}
                          animate={sandboxPawnBouncing === `g-${i}` ? { y: [-6, 0, -6] } : {}}
                          onClick={() => {
                            SoundManager.play('pawn-step');
                            setSandboxPawnBouncing(`g-${i}`);
                            setTimeout(() => setSandboxPawnBouncing(null), 800);
                          }}
                          className="rounded-full flex items-center justify-center cursor-pointer"
                        >
                          <div className={`w-5 h-6 rounded-full bg-gradient-to-tr ${currentPawn.colors.green.primaryGradient} border border-white/50 shadow-md flex items-center justify-center`}>
                            {currentPawn.styleType === 'crowned' && <Crown className="w-2 h-2 text-amber-300" />}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: INTERACTIVE 3D DICE ROLLING TESTBED */}
            <div className="space-y-4">
              <div className="bg-[#101626] rounded-3xl border-2 border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-400 tracking-wide flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>3D Dice Roll Physics Sandbox</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{currentDice.name}</span>
                </div>

                {/* 3D Dice Display Box */}
                <div className="py-8 bg-black/50 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                  <div
                    className="absolute inset-0 blur-3xl pointer-events-none opacity-50"
                    style={{ backgroundColor: currentDice.glowAura }}
                  />

                  {/* Interactive Dice Cube */}
                  <motion.div
                    animate={
                      isRollingSandboxDice
                        ? { rotateX: [0, 360, 720], rotateY: [0, 360, 720], scale: [1, 1.2, 0.9, 1] }
                        : { y: [-3, 3, -3] }
                    }
                    transition={
                      isRollingSandboxDice
                        ? { duration: 0.6, repeat: Infinity, ease: 'linear' }
                        : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                    }
                    className="w-20 h-20 rounded-2xl border-2 flex items-center justify-center p-3 shadow-2xl relative cursor-pointer"
                    style={{
                      background: currentDice.cubeBgGradient,
                      borderColor: currentDice.cubeBorderColor,
                      boxShadow: currentDice.cubeBoxShadow,
                    }}
                    onClick={handleRollSandboxDice}
                  >
                    {/* Render exact pips for current sandbox value */}
                    <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-full h-full">
                      {/* Pip arrangement for numbers 1 to 6 */}
                      {sandboxDiceVal === 1 && (
                        <div className="col-start-2 row-start-2 w-3.5 h-3.5 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                      )}
                      {sandboxDiceVal === 2 && (
                        <>
                          <div className="col-start-1 row-start-1 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                          <div className="col-start-3 row-start-3 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                        </>
                      )}
                      {sandboxDiceVal === 3 && (
                        <>
                          <div className="col-start-1 row-start-1 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                          <div className="col-start-2 row-start-2 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                          <div className="col-start-3 row-start-3 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                        </>
                      )}
                      {sandboxDiceVal === 4 && (
                        <>
                          <div className="col-start-1 row-start-1 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                          <div className="col-start-3 row-start-1 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                          <div className="col-start-1 row-start-3 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                          <div className="col-start-3 row-start-3 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                        </>
                      )}
                      {sandboxDiceVal === 5 && (
                        <>
                          <div className="col-start-1 row-start-1 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                          <div className="col-start-3 row-start-1 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                          <div className="col-start-2 row-start-2 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                          <div className="col-start-1 row-start-3 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                          <div className="col-start-3 row-start-3 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                        </>
                      )}
                      {sandboxDiceVal === 6 && (
                        <>
                          <div className="col-start-1 row-start-1 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                          <div className="col-start-3 row-start-1 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                          <div className="col-start-1 row-start-2 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                          <div className="col-start-3 row-start-2 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                          <div className="col-start-1 row-start-3 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                          <div className="col-start-3 row-start-3 w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: currentDice.pipColor }} />
                        </>
                      )}
                    </div>
                  </motion.div>

                  <div className="mt-3 text-xs font-mono text-slate-400">
                    Current Rolled Value: <strong className="text-amber-300 font-bold">{sandboxDiceVal}</strong>
                  </div>
                </div>

                {/* Roll Simulation Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRollSandboxDice}
                  disabled={isRollingSandboxDice}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer uppercase"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{isRollingSandboxDice ? 'Rolling 3D Dice...' : 'Roll Test Dice'}</span>
                </motion.button>

                {/* Quick Pip Value Picker */}
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Quick Force Value (1-6):</div>
                  <div className="grid grid-cols-6 gap-1">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          SoundManager.play('click');
                          setSandboxDiceVal(num);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                          sandboxDiceVal === num
                            ? 'bg-amber-400 text-slate-950 shadow'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Deploy From Sandbox */}
              <button
                onClick={handleDeployToPlatform}
                disabled={isSaving}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Deploy This Combo to Live Players</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
