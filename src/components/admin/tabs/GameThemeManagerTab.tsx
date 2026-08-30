import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  Dice5,
  Crown,
  Grid,
  RefreshCw,
  Eye,
  Sliders,
  Radio,
  Save,
  Palette,
  ShieldAlert,
} from 'lucide-react';
import {
  BOARD_THEMES,
  DICE_SKINS,
  PAWN_SKINS,
  BoardThemeDefinition,
  DiceSkinDefinition,
  PawnSkinDefinition,
  getActiveThemeConfig,
  saveLocalThemeConfig,
} from '../../../game/themeRegistry';
import { SoundManager } from '../../../audio/soundManager';

interface GameThemeManagerTabProps {
  token: string;
}

export const GameThemeManagerTab: React.FC<GameThemeManagerTabProps> = ({ token }) => {
  // Current active selections
  const initialTheme = getActiveThemeConfig();
  const [activeBoardId, setActiveBoardId] = useState<string>(initialTheme.activeBoardId);
  const [activeDiceId, setActiveDiceId] = useState<string>(initialTheme.activeDiceId);
  const [activePawnId, setActivePawnId] = useState<string>(initialTheme.activePawnId);

  // Sub-section tab for viewing/switching
  const [activeSection, setActiveSection] = useState<'boards' | 'dice' | 'pawns'>('boards');

  // Saving / Deploying status
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccessMessage, setDeploySuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 3D Dice Test Roll State
  const [testDiceValue, setTestDiceValue] = useState<number>(6);
  const [isRollingDice, setIsRollingDice] = useState<boolean>(false);
  const [diceRotation, setDiceRotation] = useState<{ x: number; y: number }>({ x: 0, y: -180 });

  // Fetch live deployed theme from server on mount
  useEffect(() => {
    const fetchLiveConfig = async () => {
      try {
        const res = await fetch('/api/theme-config');
        if (res.ok) {
          const data = await res.json();
          if (data.themeConfig) {
            if (data.themeConfig.activeBoardId) setActiveBoardId(data.themeConfig.activeBoardId);
            if (data.themeConfig.activeDiceId) setActiveDiceId(data.themeConfig.activeDiceId);
            if (data.themeConfig.activePawnId) setActivePawnId(data.themeConfig.activePawnId);
          }
        }
      } catch (err) {
        console.error('Failed to load server theme config:', err);
      }
    };
    fetchLiveConfig();
  }, []);

  const currentBoard = BOARD_THEMES.find((b) => b.id === activeBoardId) || BOARD_THEMES[0];
  const currentDice = DICE_SKINS.find((d) => d.id === activeDiceId) || DICE_SKINS[0];
  const currentPawn = PAWN_SKINS.find((p) => p.id === activePawnId) || PAWN_SKINS[0];

  // Test Roll Simulation
  const handleTestRoll = () => {
    if (isRollingDice) return;
    setIsRollingDice(true);
    SoundManager.play('dice-roll');

    const rollVal = Math.floor(Math.random() * 6) + 1;
    setTestDiceValue(rollVal);

    // Target rotation angles for faces 1-6
    const rotations: Record<number, { x: number; y: number }> = {
      1: { x: 0, y: 0 },
      2: { x: 0, y: -90 },
      3: { x: -90, y: 0 },
      4: { x: 90, y: 0 },
      5: { x: 0, y: 90 },
      6: { x: 0, y: -180 },
    };

    const target = rotations[rollVal] || { x: 0, y: 0 };
    setDiceRotation({
      x: target.x + 720,
      y: target.y + 720,
    });

    setTimeout(() => {
      setIsRollingDice(false);
      SoundManager.play('dice-land');
    }, 600);
  };

  // Deploy configuration globally to server and all live players
  const handleDeployTheme = async (
    newBoardId = activeBoardId,
    newDiceId = activeDiceId,
    newPawnId = activePawnId
  ) => {
    setIsDeploying(true);
    setDeploySuccessMessage(null);
    setErrorMessage(null);

    try {
      // 1. Save locally for instant preview in client
      saveLocalThemeConfig({
        activeBoardId: newBoardId,
        activeDiceId: newDiceId,
        activePawnId: newPawnId,
      });

      // 2. Deploy to backend server API
      const res = await fetch('/api/admin/theme-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          activeBoardId: newBoardId,
          activeDiceId: newDiceId,
          activePawnId: newPawnId,
          deployedBy: 'Super Admin',
        }),
      });

      if (res.ok) {
        setDeploySuccessMessage(
          'Visual assets successfully applied & broadcasted to all live matches and players!'
        );
        SoundManager.play('game-win');
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.message || 'Failed to save to server, applied locally.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error updating theme assets.');
    } finally {
      setIsDeploying(false);
      setTimeout(() => setDeploySuccessMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Quick Deploy Bar */}
      <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-black text-amber-400 uppercase tracking-wider">
              Visual Asset Engine
            </span>
            <span className="text-xs font-semibold text-slate-400">Live Match Customizer</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
            <Palette className="w-6 h-6 text-amber-400" />
            Applied Ludo Board, Dice & Pawns
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Inspect the live visual assets currently rendered across game matches. Select different board styles, 3D dice materials, or pawn sets and apply them instantly to all active players.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => handleDeployTheme(activeBoardId, activeDiceId, activePawnId)}
            disabled={isDeploying}
            className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {isDeploying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Applying to Live Games...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Deploy Across Live Platform</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {deploySuccessMessage && (
        <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-4 text-emerald-300 text-xs font-semibold flex items-center gap-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{deploySuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-950/60 border border-rose-500/50 rounded-xl p-4 text-rose-300 text-xs font-semibold flex items-center gap-3 shadow-lg">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. CURRENT APPLIED ASSETS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Applied Board Card */}
        <div
          onClick={() => setActiveSection('boards')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            activeSection === 'boards'
              ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/50 shadow-lg'
              : 'bg-[#0a0e1a] border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-amber-400" />
              Current Applied Board
            </span>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
              ACTIVE
            </span>
          </div>
          <div className="text-base font-black text-white">{currentBoard.name}</div>
          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{currentBoard.description}</div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/20"
                style={{ background: currentBoard.cornerBases.red.glow }}
                title="Red Base"
              />
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/20"
                style={{ background: currentBoard.cornerBases.blue.glow }}
                title="Blue Base"
              />
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/20"
                style={{ background: currentBoard.cornerBases.green.glow }}
                title="Green Base"
              />
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/20"
                style={{ background: currentBoard.cornerBases.yellow.glow }}
                title="Yellow Base"
              />
            </div>
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              Change Board &rarr;
            </span>
          </div>
        </div>

        {/* Applied Dice Card */}
        <div
          onClick={() => setActiveSection('dice')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            activeSection === 'dice'
              ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/50 shadow-lg'
              : 'bg-[#0a0e1a] border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Dice5 className="w-3.5 h-3.5 text-amber-400" />
              Current Applied Dice
            </span>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
              ACTIVE
            </span>
          </div>
          <div className="text-base font-black text-white">{currentDice.name}</div>
          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{currentDice.material}</div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Rarity: {currentDice.rarity}
            </span>
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              Change Dice &rarr;
            </span>
          </div>
        </div>

        {/* Applied Pawns Card */}
        <div
          onClick={() => setActiveSection('pawns')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            activeSection === 'pawns'
              ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/50 shadow-lg'
              : 'bg-[#0a0e1a] border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Current Applied Pawns
            </span>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
              ACTIVE
            </span>
          </div>
          <div className="text-base font-black text-white">{currentPawn.name}</div>
          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{currentPawn.description}</div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Style: {currentPawn.styleType}
            </span>
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              Change Pawns &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* 3. LIVE TESTBED & VISUAL PREVIEW STAGE */}
      <div className="bg-[#0a0e1a] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              Interactive 3D Sandbox
            </span>
            <h3 className="text-base font-black text-white">Live Visual Match Stage Preview</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestRoll}
              disabled={isRollingDice}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
            >
              <Dice5 className="w-4 h-4" />
              <span>Test Roll 3D Dice (Rolled: {testDiceValue})</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Miniature Board Representation (5 cols) */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-400 mb-2">
              Board Preview: <strong className="text-white">{currentBoard.name}</strong>
            </span>
            <div
              className={`w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-4 p-2 shadow-2xl relative overflow-hidden flex flex-col justify-between ${currentBoard.boardBorderClass}`}
              style={{
                boxShadow: `0 0 35px ${currentBoard.boardGlowColor}`,
              }}
            >
              {/* Corner 1: Red Base */}
              <div className="flex justify-between w-full">
                <div
                  className="w-20 h-20 rounded-xl p-1.5 border-2 flex items-center justify-center shadow-md relative"
                  style={{
                    background: currentBoard.cornerBases.red.bgGradient,
                    borderColor: currentBoard.cornerBases.red.glow,
                  }}
                >
                  <div className="w-full h-full rounded-lg bg-black/20 grid grid-cols-2 gap-1 p-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="rounded-full border border-white/40 flex items-center justify-center"
                        style={{ background: currentPawn.colors.red.glowColor }}
                      >
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Corner 2: Green Base */}
                <div
                  className="w-20 h-20 rounded-xl p-1.5 border-2 flex items-center justify-center shadow-md relative"
                  style={{
                    background: currentBoard.cornerBases.green.bgGradient,
                    borderColor: currentBoard.cornerBases.green.glow,
                  }}
                >
                  <div className="w-full h-full rounded-lg bg-black/20 grid grid-cols-2 gap-1 p-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="rounded-full border border-white/40 flex items-center justify-center"
                        style={{ background: currentPawn.colors.green.glowColor }}
                      >
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Center Goal Pyramid */}
              <div
                className="w-16 h-16 rounded-xl mx-auto flex items-center justify-center border-2 border-amber-400 shadow-lg text-[10px] font-black text-amber-300"
                style={{ background: currentBoard.centerBgGradient }}
              >
                GOAL
              </div>

              {/* Corner 3: Blue Base & Corner 4: Yellow Base */}
              <div className="flex justify-between w-full">
                <div
                  className="w-20 h-20 rounded-xl p-1.5 border-2 flex items-center justify-center shadow-md relative"
                  style={{
                    background: currentBoard.cornerBases.blue.bgGradient,
                    borderColor: currentBoard.cornerBases.blue.glow,
                  }}
                >
                  <div className="w-full h-full rounded-lg bg-black/20 grid grid-cols-2 gap-1 p-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="rounded-full border border-white/40 flex items-center justify-center"
                        style={{ background: currentPawn.colors.blue.glowColor }}
                      >
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="w-20 h-20 rounded-xl p-1.5 border-2 flex items-center justify-center shadow-md relative"
                  style={{
                    background: currentBoard.cornerBases.yellow.bgGradient,
                    borderColor: currentBoard.cornerBases.yellow.glow,
                  }}
                >
                  <div className="w-full h-full rounded-lg bg-black/20 grid grid-cols-2 gap-1 p-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="rounded-full border border-white/40 flex items-center justify-center"
                        style={{ background: currentPawn.colors.yellow.glowColor }}
                      >
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3D Dice Showcase & 4 Pawns Showcase (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* 3D Interactive Dice Showcase */}
            <div className="bg-[#0e131f] border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Active 3D Dice Model
                </span>
                <div className="text-sm font-black text-white">{currentDice.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{currentDice.description}</div>
              </div>

              {/* 3D Dice Element */}
              <div
                onClick={handleTestRoll}
                className="w-16 h-16 rounded-2xl flex items-center justify-center cursor-pointer relative shadow-xl hover:scale-105 transition-transform shrink-0"
                style={{
                  background: currentDice.cubeBgGradient,
                  border: `2px solid ${currentDice.cubeBorderColor}`,
                  boxShadow: currentDice.cubeBoxShadow,
                }}
                title="Click to roll test dice"
              >
                <motion.div
                  animate={{
                    rotate: isRollingDice ? [0, 180, 360, 540, 720] : 0,
                    scale: isRollingDice ? [1, 1.25, 0.95, 1.1, 1] : 1,
                  }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="flex items-center justify-center text-xl font-black"
                  style={{ color: currentDice.pipColor }}
                >
                  {testDiceValue}
                </motion.div>
              </div>
            </div>

            {/* 4-Color Pawns Showcase */}
            <div className="bg-[#0e131f] border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Active 4-Player Pawns
                  </span>
                  <div className="text-sm font-black text-white">{currentPawn.name}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentPawn.rarity}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                {(['red', 'blue', 'green', 'yellow'] as const).map((color) => (
                  <div
                    key={color}
                    className="bg-[#0a0e1a] border border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="w-8 h-10 rounded-t-full rounded-b-md border-2 relative flex items-center justify-center shadow-lg"
                      style={{
                        background: `linear-gradient(180deg, ${currentPawn.colors[color].highlight} 0%, ${currentPawn.colors[color].borderColor} 100%)`,
                        borderColor: currentPawn.colors[color].borderColor,
                        boxShadow: `0 0 12px ${currentPawn.colors[color].glowColor}`,
                      }}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/60 mb-2"
                        style={{ background: currentPawn.colors[color].capColor }}
                      />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-300">
                      {color}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SWITCHER SECTION (TABS: BOARDS, DICE, PAWNS) */}
      <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl">
        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-slate-800/80 gap-2 mb-6">
          <button
            onClick={() => setActiveSection('boards')}
            className={`px-4 py-3 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
              activeSection === 'boards'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>1. Switch Ludo Boards ({BOARD_THEMES.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('dice')}
            className={`px-4 py-3 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
              activeSection === 'dice'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dice5 className="w-4 h-4" />
            <span>2. Switch 3D Dice ({DICE_SKINS.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('pawns')}
            className={`px-4 py-3 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
              activeSection === 'pawns'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>3. Switch Pawns Set ({PAWN_SKINS.length})</span>
          </button>
        </div>

        {/* SECTION 1: LUDO BOARDS */}
        {activeSection === 'boards' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Click any board below to select it, then click <strong>Apply Board to Live Matches</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {BOARD_THEMES.map((board) => {
                const isSelected = activeBoardId === board.id;
                return (
                  <div
                    key={board.id}
                    className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/40 shadow-xl'
                        : 'bg-[#0a0e1a] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {board.category}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> CURRENT APPLIED
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-white">{board.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {board.description}
                      </p>

                      {/* Color Palette Swatches */}
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">Corner Bases:</span>
                        <div className="flex items-center gap-1.5">
                          {(['red', 'blue', 'green', 'yellow'] as const).map((col) => (
                            <div
                              key={col}
                              className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                              style={{ background: board.cornerBases[col].glow }}
                              title={`${col} corner`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      {isSelected ? (
                        <button
                          disabled
                          className="w-full py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Currently Applied
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveBoardId(board.id);
                            handleDeployTheme(board.id, activeDiceId, activePawnId);
                          }}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>Apply Board to Live Matches</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 2: 3D DICE */}
        {activeSection === 'dice' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Choose the 3D dice material and pip styling rendered when players roll during match turns.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DICE_SKINS.map((dice) => {
                const isSelected = activeDiceId === dice.id;
                return (
                  <div
                    key={dice.id}
                    className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/40 shadow-xl'
                        : 'bg-[#0a0e1a] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {dice.rarity}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> CURRENT APPLIED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-md font-black text-lg"
                          style={{
                            background: dice.cubeBgGradient,
                            borderColor: dice.cubeBorderColor,
                            color: dice.pipColor,
                            boxShadow: dice.cubeBoxShadow,
                          }}
                        >
                          6
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">{dice.name}</h4>
                          <span className="text-[11px] font-bold text-amber-400">{dice.material}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                        {dice.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      {isSelected ? (
                        <button
                          disabled
                          className="w-full py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Currently Applied
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveDiceId(dice.id);
                            handleDeployTheme(activeBoardId, dice.id, activePawnId);
                          }}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>Apply Dice to Live Matches</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 3: PAWNS */}
        {activeSection === 'pawns' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Choose the 3D piece models and crowned badges rendered on the board for all 4 players.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PAWN_SKINS.map((pawn) => {
                const isSelected = activePawnId === pawn.id;
                return (
                  <div
                    key={pawn.id}
                    className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/40 shadow-xl'
                        : 'bg-[#0a0e1a] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {pawn.rarity} &bull; Style: {pawn.styleType}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> CURRENT APPLIED
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-white">{pawn.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {pawn.description}
                      </p>

                      {/* 4-Color Swatch Display */}
                      <div className="mt-3 grid grid-cols-4 gap-1.5 p-2 bg-[#05070d] rounded-xl border border-slate-800">
                        {(['red', 'blue', 'green', 'yellow'] as const).map((c) => (
                          <div key={c} className="flex flex-col items-center gap-1">
                            <div
                              className="w-5 h-7 rounded-t-full rounded-b-xs border"
                              style={{
                                background: pawn.colors[c].borderColor,
                                borderColor: pawn.colors[c].highlight,
                                boxShadow: `0 0 6px ${pawn.colors[c].glowColor}`,
                              }}
                            />
                            <span className="text-[8px] font-bold uppercase text-slate-400">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      {isSelected ? (
                        <button
                          disabled
                          className="w-full py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Currently Applied
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setActivePawnId(pawn.id);
                            handleDeployTheme(activeBoardId, activeDiceId, pawn.id);
                          }}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>Apply Pawns to Live Matches</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
