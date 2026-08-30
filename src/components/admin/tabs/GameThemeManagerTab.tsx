import React, { useState, useEffect } from 'react';
import {
  Palette,
  CheckCircle2,
  Dice5,
  Crown,
  Grid,
  RefreshCw,
  Save,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { LudoBoard } from '../../ludo/board/LudoBoard';
import { LudoDice } from '../../ludo/dice/LudoDice';
import { LudoPawn } from '../../ludo/pawns/LudoPawn';
import {
  BOARD_THEMES,
  DICE_SKINS,
  PAWN_SKINS,
  getActiveThemeConfig,
  saveLocalThemeConfig,
} from '../../../game/themeRegistry';
import { HOME_SLOTS, getPawnGridCoord } from '../../../game/boardGeometry';
import { Pawn, PlayerColor, DiceState } from '../../../types/game';
import { SoundManager } from '../../../audio/soundManager';

interface GameThemeManagerTabProps {
  token: string;
}

export const GameThemeManagerTab: React.FC<GameThemeManagerTabProps> = ({ token }) => {
  // Current active selections
  const [themeState, setThemeState] = useState(() => getActiveThemeConfig());
  const [activeBoardId, setActiveBoardId] = useState<string>(themeState.activeBoardId);
  const [activeDiceId, setActiveDiceId] = useState<string>(themeState.activeDiceId);
  const [activePawnId, setActivePawnId] = useState<string>(themeState.activePawnId);

  // Sub-section tab for viewing/switching
  const [activeSection, setActiveSection] = useState<'boards' | 'dice' | 'pawns'>('boards');

  // Real Ludo Dice State for the live interactive 3D dice component
  const [diceState, setDiceState] = useState<DiceState>({
    value: 6,
    isRolling: false,
    hasRolled: false,
    canRoll: true,
  });
  const [activeDiceColor, setActiveDiceColor] = useState<PlayerColor>('red');

  // Real Pawns State placed on authentic board coordinates
  const [allPawns, setAllPawns] = useState<Pawn[]>(() => {
    const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
    const pawns: Pawn[] = [];

    colors.forEach((color) => {
      // 2 pawns in home base, 2 pawns out on the track
      [0, 1, 2, 3].map((idx) => {
        if (idx < 2) {
          const homeCoords = HOME_SLOTS[color][idx];
          pawns.push({
            id: `${color}-${idx}`,
            playerId: `player-${color}`,
            color,
            pawnIndex: idx,
            state: 'home',
            pathStep: -1,
            gridX: homeCoords.x,
            gridY: homeCoords.y,
          });
        } else {
          // Out on track
          const step = idx === 2 ? 0 : 8;
          const coord = getPawnGridCoord(color, idx, step);
          pawns.push({
            id: `${color}-${idx}`,
            playerId: `player-${color}`,
            color,
            pawnIndex: idx,
            state: 'path',
            pathStep: step,
            gridX: coord.x,
            gridY: coord.y,
          });
        }
      });
    });

    return pawns;
  });

  const [selectedPawnId, setSelectedPawnId] = useState<string | null>('red-2');
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>('red');

  // Saving / Deploying status
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccessMessage, setDeploySuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
            saveLocalThemeConfig({
              activeBoardId: data.themeConfig.activeBoardId || activeBoardId,
              activeDiceId: data.themeConfig.activeDiceId || activeDiceId,
              activePawnId: data.themeConfig.activePawnId || activePawnId,
            });
            setThemeState(getActiveThemeConfig());
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

  // Roll Real 3D LudoDice Component
  const handleRollRealDice = () => {
    if (diceState.isRolling) return;

    SoundManager.play('dice-roll');
    setDiceState((prev) => ({ ...prev, isRolling: true, canRoll: false }));

    const rollVal = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      setDiceState({
        value: rollVal,
        isRolling: false,
        hasRolled: true,
        canRoll: true,
      });
      SoundManager.play('dice-land');
    }, 650);
  };

  // Click on a real pawn on the real board
  const handlePawnClick = (pawn: Pawn) => {
    setSelectedPawnId(pawn.id);
    setCurrentTurn(pawn.color);
    setActiveDiceColor(pawn.color);
    SoundManager.play('pawn-step');
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

    // 1. Immediately apply to local game engine so all components update
    saveLocalThemeConfig({
      activeBoardId: newBoardId,
      activeDiceId: newDiceId,
      activePawnId: newPawnId,
    });
    setThemeState(getActiveThemeConfig());

    try {
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
          deployedBy: 'Executive Admin',
        }),
      });

      if (res.ok) {
        setDeploySuccessMessage(
          'Visual assets successfully applied to the live match engine and broadcasted to all active players!'
        );
        SoundManager.play('score-double');
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.message || 'Applied locally, could not persist to server.');
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
      {/* 1. Header & Live Global Controls */}
      <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-black text-amber-400 uppercase tracking-wider">
              Production Game Assets Engine
            </span>
            <span className="text-xs font-semibold text-slate-400">Live LudoBoard &bull; LudoDice &bull; LudoPawn</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
            <Palette className="w-6 h-6 text-amber-400" />
            Applied Ludo Board, Dice & Pawns Manager
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Control the actual production Ludo Board, 3D Dice and Pawns rendered in active game matches. Any change selected here applies directly to all players across the platform.
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
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Category: {currentBoard.category}
            </span>
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              Switch Board &rarr;
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
              Current Applied 3D Dice
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
              Switch Dice &rarr;
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
              Switch Pawns &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* 3. REAL PRODUCTION GAME ASSET STAGE (Exact LudoBoard, Exact LudoDice, Exact LudoPawn) */}
      <div className="bg-[#0a0e1a] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Direct Engine View
              </span>
              <span className="text-xs text-slate-400">Actual Game Components Mounted Live</span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              Live Applied Ludo Board & Real 3D Dice Canvas
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Interactive Color:</span>
            {(['red', 'blue', 'green', 'yellow'] as PlayerColor[]).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCurrentTurn(c);
                  setActiveDiceColor(c);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  currentTurn === c
                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
          {/* Real LudoBoard Component (7 cols) */}
          <div className="xl:col-span-7 flex flex-col items-center justify-center p-2 bg-[#05070d] rounded-2xl border border-slate-800/80 shadow-2xl">
            <div className="w-full max-w-[460px] aspect-square relative flex items-center justify-center">
              {/* Mounted Real Production LudoBoard */}
              <LudoBoard
                pawns={allPawns}
                currentTurn={currentTurn}
                selectedPawnId={selectedPawnId}
                movablePawnIds={['red-2', 'blue-2', 'green-2', 'yellow-2']}
                onPawnClick={handlePawnClick}
                activeColors={['red', 'blue', 'green', 'yellow']}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              Real 15x15 LudoBoard Component rendered with active board theme <strong className="text-amber-400">{currentBoard.name}</strong> and pawn skin <strong className="text-amber-400">{currentPawn.name}</strong>.
            </p>
          </div>

          {/* Real LudoDice and Real Pawns Showcase (5 cols) */}
          <div className="xl:col-span-5 space-y-6">
            {/* Real 3D LudoDice Component Container */}
            <div className="bg-[#0e131f] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Live 3D Dice Component
                  </span>
                  <h4 className="text-base font-black text-white">{currentDice.name}</h4>
                  <p className="text-xs text-slate-400">{currentDice.description}</p>
                </div>

                <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-900 border border-slate-800 text-amber-400">
                  Value: {diceState.value}
                </span>
              </div>

              {/* Mounted Real Production LudoDice */}
              <div className="flex flex-col sm:flex-row items-center justify-around gap-4 bg-[#05070d] p-6 rounded-xl border border-slate-800/80">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Normal Size (56px)
                  </span>
                  <LudoDice
                    dice={diceState}
                    activeColor={activeDiceColor}
                    onRoll={handleRollRealDice}
                    size="normal"
                    isTurn={true}
                  />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    HUD Size (34px)
                  </span>
                  <LudoDice
                    dice={diceState}
                    activeColor={activeDiceColor}
                    onRoll={handleRollRealDice}
                    size="compact"
                    isTurn={true}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleRollRealDice}
                    disabled={diceState.isRolling}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                  >
                    <Dice5 className="w-4 h-4" />
                    <span>Roll Real 3D Dice</span>
                  </button>
                  <span className="text-[10px] text-center text-slate-500">
                    Click cube or button to roll
                  </span>
                </div>
              </div>
            </div>

            {/* Real 4-Player LudoPawn Components Container */}
            <div className="bg-[#0e131f] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Live Pawns Components
                  </span>
                  <h4 className="text-base font-black text-white">{currentPawn.name}</h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentPawn.rarity}
                </span>
              </div>

              {/* Mounted Real Production LudoPawn Components for all 4 colors */}
              <div className="grid grid-cols-4 gap-3 bg-[#05070d] p-4 rounded-xl border border-slate-800/80">
                {(['red', 'blue', 'green', 'yellow'] as PlayerColor[]).map((color) => (
                  <div
                    key={color}
                    onClick={() => {
                      setSelectedPawnId(`${color}-sample`);
                      SoundManager.play('pawn-step');
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedPawnId === `${color}-sample`
                        ? 'bg-slate-800/80 border-amber-500/80 ring-1 ring-amber-400'
                        : 'bg-[#0a0e1a] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-12 h-14 relative flex items-center justify-center">
                      <LudoPawn
                        id={`${color}-sample`}
                        color={color}
                        pawnIndex={0}
                        pathStep={color === 'red' ? 12 : 0}
                        isSelected={selectedPawnId === `${color}-sample`}
                        isMovable={true}
                        sizePx={36}
                      />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-300 mt-1">
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
                Select any board theme below to instantly update the live engine and apply it to all players.
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
                Choose the 3D dice material and finish applied during match turns.
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
