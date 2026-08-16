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
} from 'lucide-react';
import {
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
  const [activeCategory, setActiveCategory] = useState<'boards' | 'dice' | 'pawns' | 'sandbox'>('boards');

  // Currently Selected / Active IDs
  const [activeBoardId, setActiveBoardId] = useState<string>('dubai_royal_sunset');
  const [activeDiceId, setActiveDiceId] = useState<string>('golden_high_roller');
  const [activePawnId, setActivePawnId] = useState<string>('royal_crowned');

  // Enabled lists for platform
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
          setActiveBoardId(data.themeConfig.activeBoardId || 'dubai_royal_sunset');
          setActiveDiceId(data.themeConfig.activeDiceId || 'golden_high_roller');
          setActivePawnId(data.themeConfig.activePawnId || 'royal_crowned');
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
            if (parsed.activeBoardId) setActiveBoardId(parsed.activeBoardId);
            if (parsed.activeDiceId) setActiveDiceId(parsed.activeDiceId);
            if (parsed.activePawnId) setActivePawnId(parsed.activePawnId);
          } catch {}
        }
      }
    };

    fetchThemeConfig();
  }, []);

  const currentBoard = BOARD_THEMES.find((b) => b.id === activeBoardId) || BOARD_THEMES[0];
  const currentDice = DICE_SKINS.find((d) => d.id === activeDiceId) || DICE_SKINS[0];
  const currentPawn = PAWN_SKINS.find((p) => p.id === activePawnId) || PAWN_SKINS[0];

  // Save to Backend and Local Storage
  const handleDeployToPlatform = async () => {
    setIsSaving(true);
    setSaveSuccess(null);

    const payload = {
      activeBoardId,
      activeDiceId,
      activePawnId,
      enabledBoards,
      enabledDice,
      enabledPawns,
    };

    try {
      // Save locally for instant preview sync
      localStorage.setItem('ludo_active_theme_config', JSON.stringify(payload));
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
        setSaveSuccess('Live Platform Theme & Assets deployed successfully!');
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
                <span>Executive Asset Studio</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                ● Live Sync Ready
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Ludo Boards, Pawns & Dice Customizer
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Visually inspect, curate, and configure official 3D Ludo boards, dice models, and character pawns for all players across the platform.
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

        {/* Live Active Pill Badges Bar */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-3 border border-amber-500/30">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Board Theme</div>
              <div className="text-sm font-black text-amber-300">{currentBoard.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-3 border border-amber-500/30">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active 3D Dice Skin</div>
              <div className="text-sm font-black text-amber-300">{currentDice.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-3 border border-amber-500/30">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Gem className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Pawn Figurines</div>
              <div className="text-sm font-black text-amber-300">{currentPawn.name}</div>
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
          VIEW A: LUDO BOARDS CATALOG WITH RICH VISUAL PREVIEW CARDS
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
              const isEnabled = enabledBoards.includes(theme.id);

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

                  {/* Palette Swatches & Description */}
                  <div className="p-4 space-y-2.5">
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {theme.description}
                    </p>

                    {/* 4 Player Stem Swatches */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">Palettes:</span>
                      <span className="w-4 h-4 rounded-full border border-white/40 shadow" style={{ backgroundColor: theme.stemColors.blue.hex }} title="Blue Pathway" />
                      <span className="w-4 h-4 rounded-full border border-white/40 shadow" style={{ backgroundColor: theme.stemColors.red.hex }} title="Red Pathway" />
                      <span className="w-4 h-4 rounded-full border border-white/40 shadow" style={{ backgroundColor: theme.stemColors.green.hex }} title="Green Pathway" />
                      <span className="w-4 h-4 rounded-full border border-white/40 shadow" style={{ backgroundColor: theme.stemColors.yellow.hex }} title="Yellow Pathway" />
                    </div>

                    {/* Action Select & Test Button */}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          SoundManager.play('click');
                          setActiveBoardId(theme.id);
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Active Default</span>
                          </>
                        ) : (
                          <span>Set as Active Board</span>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          SoundManager.play('click');
                          setActiveBoardId(theme.id);
                          setActiveCategory('sandbox');
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                        title="Test in 3D Live Sandbox"
                      >
                        <Play className="w-4 h-4 fill-current text-cyan-400" />
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
          VIEW B: DICE SKINS CATALOG WITH INTERACTIVE 3D ROLLING PREVIEWS
      ========================================================================= */}
      {activeCategory === 'dice' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Select Official 3D Dice Set</span>
              <span className="text-xs text-slate-400 font-normal">({DICE_SKINS.length} Dice Models Available)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {DICE_SKINS.map((dice) => {
              const isSelected = activeDiceId === dice.id;

              return (
                <motion.div
                  key={dice.id}
                  whileHover={{ y: -4 }}
                  className={`relative rounded-3xl overflow-hidden border-2 transition-all duration-300 flex flex-col justify-between p-5 ${
                    isSelected
                      ? 'bg-[#18112e] border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.4)] ring-2 ring-amber-400/30'
                      : 'bg-[#0e1222] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          dice.rarity === 'Legendary'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                            : dice.rarity === 'Epic'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                            : dice.rarity === 'Rare'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                            : 'bg-slate-700/40 text-slate-300'
                        }`}
                      >
                        {dice.rarity}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{dice.material}</span>
                    </div>

                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> Active
                      </span>
                    )}
                  </div>

                  {/* INTERACTIVE 3D DICE RENDER BOX */}
                  <div className="my-3 py-6 flex items-center justify-center bg-black/40 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div
                      className="absolute inset-0 blur-2xl pointer-events-none opacity-40"
                      style={{ backgroundColor: dice.glowAura }}
                    />

                    {/* 3D Dice Face Preview (Face 6 representation) */}
                    <motion.div
                      whileHover={{ rotateY: 25, rotateX: -20, scale: 1.1 }}
                      animate={{ y: [-2, 2, -2] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center p-2.5 relative shadow-2xl cursor-pointer"
                      style={{
                        background: dice.cubeBgGradient,
                        borderColor: dice.cubeBorderColor,
                        boxShadow: dice.cubeBoxShadow,
                      }}
                      onClick={() => SoundManager.play('dice-roll')}
                    >
                      {/* 6 pips arrangement */}
                      <div className="grid grid-cols-2 grid-rows-3 gap-1.5 w-full h-full">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="w-2.5 h-2.5 rounded-full mx-auto"
                            style={{
                              backgroundColor: dice.pipColor,
                              boxShadow: dice.pipShadow,
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {/* Details & Actions */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-black text-white">{dice.name}</h4>
                      <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">{dice.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          SoundManager.play('click');
                          setActiveDiceId(dice.id);
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Active Default</span>
                          </>
                        ) : (
                          <span>Set as Active Dice</span>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          SoundManager.play('click');
                          setActiveDiceId(dice.id);
                          setActiveCategory('sandbox');
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                        title="Roll Test in 3D Sandbox"
                      >
                        <Play className="w-4 h-4 fill-current text-cyan-400" />
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
          VIEW C: PAWNS & CHARACTERS CATALOG WITH ALL 4 PLAYER COLOR RAYS
      ========================================================================= */}
      {activeCategory === 'pawns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Select Official Character Pawns & Figurines</span>
              <span className="text-xs text-slate-400 font-normal">({PAWN_SKINS.length} Pawn Sets Available)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {PAWN_SKINS.map((pawn) => {
              const isSelected = activePawnId === pawn.id;

              return (
                <motion.div
                  key={pawn.id}
                  whileHover={{ y: -4 }}
                  className={`relative rounded-3xl overflow-hidden border-2 transition-all duration-300 flex flex-col justify-between p-5 ${
                    isSelected
                      ? 'bg-[#18112e] border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.4)] ring-2 ring-amber-400/30'
                      : 'bg-[#0e1222] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          pawn.rarity === 'Legendary'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                            : pawn.rarity === 'Epic'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                            : pawn.rarity === 'Rare'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                            : 'bg-slate-700/40 text-slate-300'
                        }`}
                      >
                        {pawn.rarity}
                      </span>
                      <span className="text-xs text-slate-400 font-mono uppercase">{pawn.styleType}</span>
                    </div>

                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> Active
                      </span>
                    )}
                  </div>

                  {/* 4 COLOR PAWNS PREVIEW BAR */}
                  <div className="my-3 py-4 px-3 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-around">
                    {(['blue', 'red', 'green', 'yellow'] as PlayerColor[]).map((c) => {
                      const col = pawn.colors[c];
                      return (
                        <motion.div
                          key={c}
                          whileHover={{ scale: 1.25, y: -4 }}
                          onClick={() => SoundManager.play('pawn-step')}
                          className="flex flex-col items-center gap-1 cursor-pointer"
                        >
                          {/* 3D Pawn Figurine Shape */}
                          <div className="relative w-8 h-10 flex flex-col items-center">
                            {/* Crown / Top Topper */}
                            {pawn.styleType === 'crowned' && (
                              <Crown className="w-3 h-3 text-amber-300 absolute -top-2 z-20" />
                            )}
                            {pawn.styleType === 'crystal' && (
                              <Gem className="w-2.5 h-2.5 text-white absolute -top-1.5 z-20" />
                            )}

                            {/* Head Sphere */}
                            <div
                              className={`w-4 h-4 rounded-full bg-gradient-to-tr ${col.primaryGradient} border border-white/40 shadow-sm relative z-10`}
                            >
                              <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-white/70" />
                            </div>

                            {/* Neck Collar */}
                            <div className="w-2.5 h-1 bg-amber-400 rounded-xs -my-0.5 z-15 shadow-xs" />

                            {/* Base Body Skirt */}
                            <div
                              className={`w-6 h-5 rounded-b-xl rounded-t-sm bg-gradient-to-b ${col.primaryGradient} border border-white/30 shadow-md relative`}
                              style={{ boxShadow: `0 3px 10px ${col.glowColor}` }}
                            >
                              <div className="absolute inset-x-1 bottom-0.5 h-1 rounded-full bg-white/30" />
                            </div>
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 capitalize">{c}</span>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Details & Actions */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-black text-white">{pawn.name}</h4>
                      <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">{pawn.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          SoundManager.play('click');
                          setActivePawnId(pawn.id);
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Active Default</span>
                          </>
                        ) : (
                          <span>Set as Active Pawn</span>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          SoundManager.play('click');
                          setActivePawnId(pawn.id);
                          setActiveCategory('sandbox');
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                        title="Test in 3D Sandbox"
                      >
                        <Play className="w-4 h-4 fill-current text-cyan-400" />
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
          VIEW D: INTERACTIVE LIVE 3D ARENA SANDBOX TESTBED
      ========================================================================= */}
      {activeCategory === 'sandbox' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#11162a] p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                <span>Real-Time 3D Arena Live Sandbox</span>
              </h3>
              <p className="text-xs text-slate-400">
                Interactive preview testing the active combination of Board: <strong className="text-amber-400">{currentBoard.name}</strong>, Dice: <strong className="text-amber-400">{currentDice.name}</strong>, Pawns: <strong className="text-amber-400">{currentPawn.name}</strong>.
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
