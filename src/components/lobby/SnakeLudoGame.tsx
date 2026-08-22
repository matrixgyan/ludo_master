import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  User,
  Coins,
  Sparkles,
  X,
  Award,
  Flame,
  Info,
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import { AdventureSnakeBoard, BoardPlayerItem } from '../ludo/adventure/AdventureSnakeBoard';
import { SnakeLudo3DDice } from '../ludo/adventure/SnakeLudo3DDice';
import { AdventurePawnColor } from '../ludo/adventure/AdventurePawn3D';
import {
  LADDER_MAP,
  SNAKE_MAP,
} from '../ludo/adventure/types';
import { PlayerConfig } from './LudoModeSelectorModal';
import confetti from 'canvas-confetti';

export interface SnakePlayerState {
  id: string; // 'p1' | 'p2' | 'p3' | 'p4'
  name: string;
  avatarUrl?: string;
  color: AdventurePawnColor;
  isHuman: boolean;
  position: number; // 1 to 100
  lastDiceVal: number;
  isRolling: boolean;
  totalMatches: number;
  matchesWon: number;
  matchesLost: number;
}

interface SnakeLudoGameProps {
  onBackToLobby: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  entryFee?: number;
  prizePool?: number;
  userName?: string;
  userAvatar?: string;
  playerCount?: number; // 2 | 3 | 4
  playersConfig?: PlayerConfig[];
  onMatchWon?: (prize: number) => void;
}

const DEFAULT_AVATARS: Record<AdventurePawnColor, string> = {
  red: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  green: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  yellow: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  blue: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
};

const DEFAULT_CAREER_STATS: Record<
  string,
  { total: number; won: number; lost: number }
> = {
  p1: { total: 28, won: 18, lost: 10 },
  p2: { total: 34, won: 19, lost: 15 },
  p3: { total: 22, won: 11, lost: 11 },
  p4: { total: 40, won: 23, lost: 17 },
};

const COLOR_RING_CLASSES: Record<AdventurePawnColor, { ring: string; shadow: string; border: string; text: string; bgGrad: string }> = {
  red: {
    ring: 'ring-[#ef4444]',
    shadow: 'shadow-[0_0_14px_rgba(239,68,68,0.7)]',
    border: 'border-[#fca5a5]',
    text: 'text-[#fca5a5]',
    bgGrad: 'from-[#ef4444] via-[#b91c1c] to-[#450a0a]',
  },
  green: {
    ring: 'ring-[#10b981]',
    shadow: 'shadow-[0_0_14px_rgba(16,185,129,0.7)]',
    border: 'border-[#6ee7b7]',
    text: 'text-[#6ee7b7]',
    bgGrad: 'from-[#10b981] via-[#047857] to-[#064e3b]',
  },
  yellow: {
    ring: 'ring-[#eab308]',
    shadow: 'shadow-[0_0_14px_rgba(234,179,8,0.7)]',
    border: 'border-[#fde047]',
    text: 'text-[#fde047]',
    bgGrad: 'from-[#eab308] via-[#a16207] to-[#451a03]',
  },
  blue: {
    ring: 'ring-[#3b82f6]',
    shadow: 'shadow-[0_0_14px_rgba(59,130,246,0.7)]',
    border: 'border-[#93c5fd]',
    text: 'text-[#93c5fd]',
    bgGrad: 'from-[#3b82f6] via-[#1d4ed8] to-[#172554]',
  },
};

export const SnakeLudoGame: React.FC<SnakeLudoGameProps> = ({
  onBackToLobby,
  isMuted,
  onToggleMute,
  entryFee = 0,
  prizePool = 0,
  userName = 'Player 1',
  userAvatar,
  playerCount = 2,
  playersConfig,
  onMatchWon,
}) => {
  const actualPlayerCount = Math.max(2, Math.min(4, playerCount));

  // Initialize Players dynamically for 2, 3, or 4 players with realistic career stats
  const initialPlayers: SnakePlayerState[] = useMemo(() => {
    const colorOrder: AdventurePawnColor[] = ['red', 'green', 'yellow', 'blue'];
    const defaultNames = [userName || 'Player 1', 'Player 2', 'Player 3', 'Player 4'];

    const list: SnakePlayerState[] = [];
    for (let i = 0; i < actualPlayerCount; i++) {
      const color = colorOrder[i];
      const customCfg = playersConfig?.[i];
      const isHuman = i === 0;
      const pName = customCfg?.name || (isHuman ? userName : defaultNames[i]);
      const pAvatar = isHuman ? userAvatar : (customCfg?.avatarUrl || DEFAULT_AVATARS[color]);
      const playerId = `p${i + 1}`;
      const defaultStats = DEFAULT_CAREER_STATS[playerId] || { total: 25, won: 14, lost: 11 };

      list.push({
        id: playerId,
        name: pName,
        avatarUrl: pAvatar,
        color,
        isHuman,
        position: 1,
        lastDiceVal: 1,
        isRolling: false,
        totalMatches: defaultStats.total,
        matchesWon: defaultStats.won,
        matchesLost: defaultStats.lost,
      });
    }
    return list;
  }, [actualPlayerCount, userName, userAvatar, playersConfig]);

  const [players, setPlayers] = useState<SnakePlayerState[]>(initialPlayers);
  const [currentTurnIdx, setCurrentTurnIdx] = useState<number>(0);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0); // Official Ludo 3-sixes rule tracker
  const [isMovingPawn, setIsMovingPawn] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [highlightTile, setHighlightTile] = useState<number | null>(null);
  const [highlightLadderId, setHighlightLadderId] = useState<string | null>(null);
  const [highlightSnakeId, setHighlightSnakeId] = useState<string | null>(null);
  const [boardShake, setBoardShake] = useState<boolean>(false);
  const [selectedPlayerForNote, setSelectedPlayerForNote] = useState<SnakePlayerState | null>(null);
  const [actionAlert, setActionAlert] = useState<{
    text: string;
    type: 'ladder' | 'snake' | 'bonus' | 'neutral';
  } | null>(null);

  // Sync initial players when player count changes
  useEffect(() => {
    setPlayers(initialPlayers);
    setCurrentTurnIdx(0);
    setConsecutiveSixes(0);
    setWinner(null);
    setHighlightLadderId(null);
    setHighlightSnakeId(null);
    setHighlightTile(null);
    setActionAlert(null);
    setSelectedPlayerForNote(null);
  }, [initialPlayers]);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Step-by-step pawn movement engine
  const movePawnStepByStep = async (
    playerIdx: number,
    startPos: number,
    steps: number
  ) => {
    setIsMovingPawn(true);
    let curr = startPos;

    for (let i = 1; i <= steps; i++) {
      curr += 1;
      if (curr > 100) {
        curr = startPos;
        setPlayers((prev) => {
          const updated = [...prev];
          updated[playerIdx] = { ...updated[playerIdx], position: curr };
          return updated;
        });
        setActionAlert({
          text: 'Overshot! Exact roll needed for Tile 100',
          type: 'neutral',
        });
        SoundManager.play('turn');
        setIsMovingPawn(false);
        setTimeout(() => setActionAlert(null), 2500);
        return curr;
      }

      setPlayers((prev) => {
        const updated = [...prev];
        updated[playerIdx] = { ...updated[playerIdx], position: curr };
        return updated;
      });

      SoundManager.play('pawn-step');
      await sleep(160);
    }

    // Check if landed on a ladder/stairway
    const ladder = LADDER_MAP[curr];
    if (ladder) {
      setHighlightLadderId(ladder.id);
      setHighlightTile(ladder.dest);
      setActionAlert({
        text: `⚡ Climbed ${ladder.name} to Tile ${ladder.dest}!`,
        type: 'ladder',
      });
      setBoardShake(true);
      SoundManager.play('pawn-finish');
      await sleep(550);
      setBoardShake(false);
      curr = ladder.dest;

      setPlayers((prev) => {
        const updated = [...prev];
        updated[playerIdx] = { ...updated[playerIdx], position: curr };
        return updated;
      });

      await sleep(300);
      setHighlightLadderId(null);
      setHighlightTile(null);
      setTimeout(() => setActionAlert(null), 2500);
    }
    // Check if landed on a dangerous snake
    else {
      const snake = SNAKE_MAP[curr];
      if (snake) {
        setHighlightSnakeId(snake.id);
        setHighlightTile(snake.dest);
        setActionAlert({
          text: `🐍 Snake Ambush! Slid to Tile ${snake.dest}`,
          type: 'snake',
        });
        setBoardShake(true);
        SoundManager.play('pawn-capture');
        await sleep(550);
        setBoardShake(false);
        curr = snake.dest;

        setPlayers((prev) => {
          const updated = [...prev];
          updated[playerIdx] = { ...updated[playerIdx], position: curr };
          return updated;
        });

        await sleep(300);
        setHighlightSnakeId(null);
        setHighlightTile(null);
        setTimeout(() => setActionAlert(null), 2500);
      }
    }

    setIsMovingPawn(false);
    return curr;
  };

  // Roll dice for active player with official Ludo 6s rules (Max 2 consecutive bonus rolls, 3rd six forfeits turn)
  const handleRoll = useCallback(
    async (playerIdx: number) => {
      const activeP = players[playerIdx];
      if (!activeP || activeP.isRolling || isMovingPawn || winner) return;

      SoundManager.play('dice-roll');
      setActionAlert(null);

      // Generate fair roll with Ludo 6 rules
      let rolled: number;
      if (consecutiveSixes >= 2) {
        // Player already has 2 consecutive sixes in this turn.
        // In Ludo, rolling a 3rd six in a row is a foul that cancels the move and ends the turn.
        // We generate a normal roll. If it lands on 6, the official 3-sixes foul triggers.
        const testRoll = Math.floor(Math.random() * 6) + 1;
        rolled = testRoll;
      } else {
        rolled = Math.floor(Math.random() * 6) + 1;
      }

      // Start rolling animation for this player's dice
      setPlayers((prev) => {
        const updated = [...prev];
        updated[playerIdx] = {
          ...updated[playerIdx],
          isRolling: true,
          lastDiceVal: rolled,
        };
        return updated;
      });

      await sleep(750);

      // Finish dice roll
      setPlayers((prev) => {
        const updated = [...prev];
        updated[playerIdx] = {
          ...updated[playerIdx],
          isRolling: false,
          lastDiceVal: rolled,
        };
        return updated;
      });

      // 🛑 OFFICIAL LUDO RULE: THREE CONSECUTIVE SIXES FOUL
      // If a player rolls three sixes in a single turn, the 3rd six is forfeited and turn passes to next player.
      if (rolled === 6 && consecutiveSixes >= 2) {
        SoundManager.play('turn');
        setActionAlert({
          text: `🚫 3 Consecutive 6s! Turn forfeited by Ludo rule.`,
          type: 'neutral',
        });
        setConsecutiveSixes(0);
        setTimeout(() => setActionAlert(null), 3000);
        setCurrentTurnIdx((prev) => (prev + 1) % players.length);
        return;
      }

      const startPos = activeP.position;
      const finalPos = await movePawnStepByStep(playerIdx, startPos, rolled);

      // Reached Tile 100 (Winner)
      if (finalPos === 100) {
        setWinner(activeP.name);
        SoundManager.play('pawn-finish');
        confetti({
          particleCount: 180,
          spread: 95,
          origin: { y: 0.6 },
          colors: ['#A79E7B', '#DCCBA7', '#f59e0b', '#10b981', '#ffffff'],
        });

        if (activeP.isHuman && prizePool > 0) {
          onMatchWon?.(prizePool);
        }
        return;
      }

      // Bonus turn on 6 (Allowed for 1st and 2nd consecutive six)
      if (rolled === 6) {
        setConsecutiveSixes((prev) => prev + 1);
        const nextSixCount = consecutiveSixes + 1;
        setActionAlert({
          text:
            nextSixCount === 1
              ? `🔥 ${activeP.name} rolled a 6! Extra turn awarded!`
              : `🔥 ${activeP.name} rolled a 2nd 6! One more bonus turn!`,
          type: 'bonus',
        });
        setTimeout(() => setActionAlert(null), 2400);
        // Keep turn on same player!
      } else {
        // Normal non-6 roll: reset streak and advance turn
        setConsecutiveSixes(0);
        setCurrentTurnIdx((prev) => (prev + 1) % players.length);
      }
    },
    [players, isMovingPawn, winner, prizePool, onMatchWon, consecutiveSixes]
  );

  // Automated roll for AI opponents
  useEffect(() => {
    const activePlayer = players[currentTurnIdx];
    if (
      activePlayer &&
      !activePlayer.isHuman &&
      !winner &&
      !activePlayer.isRolling &&
      !isMovingPawn
    ) {
      const timer = setTimeout(() => {
        handleRoll(currentTurnIdx);
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [currentTurnIdx, winner, players, isMovingPawn, handleRoll]);

  const handleReset = () => {
    SoundManager.play('click');
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        position: 1,
        lastDiceVal: 1,
        isRolling: false,
      }))
    );
    setCurrentTurnIdx(0);
    setConsecutiveSixes(0);
    setWinner(null);
    setHighlightLadderId(null);
    setHighlightSnakeId(null);
    setHighlightTile(null);
    setActionAlert(null);
    setSelectedPlayerForNote(null);
  };

  const boardPlayers: BoardPlayerItem[] = useMemo(() => {
    return players.map((p) => ({
      id: p.id,
      color: p.color,
      position: p.position,
    }));
  }, [players]);

  const activePlayer = players[currentTurnIdx] || players[0];

  return (
    <div className="relative min-h-screen w-full bg-[#0b0c0a] text-[#fef3c7] flex flex-col items-center justify-between p-2 sm:p-3 select-none overflow-hidden font-sans">
      {/* Subtle Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1f1d16] via-[#10100c] to-[#080806] pointer-events-none -z-20" />
      <div className="absolute inset-0 bg-[radial-gradient(#a79e7b12_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

      {/* Atmospheric Soft Warm Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#a79e7b]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#dccba7]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. TOP BAR CONTROLS */}
      <header className="w-full max-w-lg flex items-center justify-between py-1 z-20">
        <button
          onClick={() => {
            SoundManager.play('click');
            onBackToLobby();
          }}
          className="flex items-center gap-1.5 bg-[#1a1812]/90 hover:bg-[#28251c] border border-[#a79e7b]/40 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#e8dfc8] shadow-md transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 text-[#dccba7] group-hover:-translate-x-0.5 transition-transform" />
          <span>Lobby</span>
        </button>

        {/* Live Prize Pool / Mode Badge */}
        {prizePool > 0 ? (
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-400/60 px-3 py-1 rounded-full shadow-inner">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-xs font-black text-amber-200">
              PRIZE: ${prizePool.toFixed(2)} USDT
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-[11px] font-bold text-stone-300">
            <span>{actualPlayerCount}P Arena</span>
          </div>
        )}

        {/* Audio & Reset Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onToggleMute}
            className="w-8 h-8 rounded-full bg-[#1a1812]/90 border border-[#a79e7b]/40 flex items-center justify-center text-[#e8dfc8] hover:text-white transition-colors cursor-pointer shadow-md"
            title="Toggle Audio"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#dccba7]" />
            )}
          </button>
          <button
            onClick={handleReset}
            className="w-8 h-8 rounded-full bg-[#1a1812]/90 border border-[#a79e7b]/40 flex items-center justify-center text-[#e8dfc8] hover:text-white transition-colors cursor-pointer shadow-md"
            title="Restart Game"
          >
            <RotateCcw className="w-4 h-4 text-[#dccba7]" />
          </button>
        </div>
      </header>

      {/* 2. MASTER BOARD */}
      <main className="relative w-full max-w-lg my-auto py-1 flex items-center justify-center">
        <AdventureSnakeBoard
          players={boardPlayers}
          activePlayerIndex={currentTurnIdx}
          isMoving={isMovingPawn}
          highlightTile={highlightTile}
          highlightLadderId={highlightLadderId}
          highlightSnakeId={highlightSnakeId}
          boardShake={boardShake}
        />
      </main>

      {/* 3. ACTION EVENT TOAST */}
      <div className="h-6 flex items-center justify-center z-20">
        <AnimatePresence>
          {actionAlert && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              className={`px-4 py-0.5 rounded-full text-xs font-black shadow-xl backdrop-blur-md border ${
                actionAlert.type === 'ladder'
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-emerald-900/50'
                  : actionAlert.type === 'snake'
                  ? 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-rose-900/50'
                  : actionAlert.type === 'bonus'
                  ? 'bg-amber-950/90 border-amber-400 text-amber-200 shadow-amber-900/50'
                  : 'bg-black/90 border-stone-600 text-stone-200'
              }`}
            >
              {actionAlert.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. BOTTOM PLAYER PROFILES (ENLARGED & CLICKABLE FOR STICKY NOTE) & INDIVIDUAL 3D DICE */}
      <footer className="w-full max-w-lg z-20 pt-1 pb-2 px-1">
        <div
          className={`w-full grid gap-1.5 sm:gap-2.5 ${
            players.length === 2
              ? 'grid-cols-2'
              : players.length === 3
              ? 'grid-cols-3'
              : 'grid-cols-4'
          }`}
        >
          {players.map((p, idx) => {
            const isTurn = currentTurnIdx === idx;
            const styleCfg = COLOR_RING_CLASSES[p.color];
            const diceSize = players.length === 4 ? 'sm' : 'normal';

            return (
              <div
                key={p.id}
                className={`relative rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex flex-col items-center justify-between transition-all duration-300 ${
                  isTurn
                    ? 'bg-[#15130d]/60 backdrop-blur-sm'
                    : 'bg-transparent opacity-85'
                }`}
              >
                {/* Active Player Status Pill */}
                {isTurn && (
                  <span className="absolute -top-2 px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/90 text-amber-300 shadow-sm flex items-center gap-0.5">
                    {consecutiveSixes > 0 && <Flame className="w-2.5 h-2.5 text-amber-400 animate-bounce" />}
                    {p.isHuman ? 'Turn' : 'AI'}
                  </span>
                )}

                {/* Top of card: Clickable Round Player Avatar & Tile Info (Opens Sticky Note) */}
                <button
                  type="button"
                  onClick={() => {
                    SoundManager.play('click');
                    setSelectedPlayerForNote(p);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 w-full justify-center text-left bg-transparent border-0 outline-none cursor-pointer group p-1 rounded-xl hover:bg-white/5 transition-all"
                  title="Click to view Player Record Sticky Note"
                >
                  {/* Enlarged Round Profile Picture */}
                  <div
                    className={`relative rounded-full p-0.5 transition-all duration-300 flex-shrink-0 group-hover:scale-105 ${
                      isTurn ? `${styleCfg.ring} ${styleCfg.shadow} ring-2 scale-105` : 'ring-1 ring-white/20'
                    }`}
                  >
                    <div
                      className={`rounded-full bg-gradient-to-br ${styleCfg.bgGrad} ${styleCfg.border} border flex items-center justify-center shadow-inner overflow-hidden ${
                        players.length === 4
                          ? 'w-9 h-9 sm:w-10 sm:h-10'
                          : players.length === 3
                          ? 'w-10 h-10 sm:w-12 sm:h-12'
                          : 'w-12 h-12 sm:w-14 sm:h-14'
                      }`}
                    >
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-white drop-shadow" />
                      )}
                    </div>

                    {/* Active Pulsing Indicator Dot */}
                    {isTurn && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 border border-white" />
                      </span>
                    )}
                  </div>

                  {/* Player Name and Tile */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-xs sm:text-sm font-bold truncate group-hover:text-amber-300 transition-colors ${
                          isTurn ? styleCfg.text : 'text-stone-200'
                        }`}
                        title={p.name}
                      >
                        {p.name}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-[#dccba7] truncate">
                      Tile {p.position}
                    </span>
                  </div>
                </button>

                {/* Bottom of card: Individual 3D Dice */}
                <div className="mt-1 flex items-center justify-center w-full">
                  <SnakeLudo3DDice
                    value={p.lastDiceVal}
                    isRolling={p.isRolling}
                    disabled={isMovingPawn || !!winner}
                    color={p.color}
                    isActiveTurn={isTurn}
                    isHuman={p.isHuman}
                    size={diceSize}
                    onRoll={() => handleRoll(idx)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </footer>

      {/* 5. PLAYER STICKY NOTE MODAL (PERCENTAGE RECORD & STATS) */}
      <AnimatePresence>
        {selectedPlayerForNote && (
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedPlayerForNote(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -6, y: 30 }}
              animate={{ scale: 1, opacity: 1, rotate: -1.5, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 4, y: 20 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="relative w-full max-w-[290px] bg-gradient-to-b from-[#fef08a] via-[#fef9c3] to-[#fef08a] text-[#451a03] p-5 pt-6 rounded-md shadow-[0_20px_40px_rgba(0,0,0,0.6),0_1px_3px_rgba(0,0,0,0.2)] border-t-[6px] border-amber-400 font-sans select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Realistic Thumbtack / Pin at the Top */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-red-500 via-rose-600 to-rose-900 border-2 border-white shadow-[0_3px_6px_rgba(0,0,0,0.5)] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedPlayerForNote(null)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-200/80 hover:bg-amber-300 text-amber-900 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Sticky Note Title & Avatar Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-amber-300/80">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500 shadow-md flex-shrink-0 bg-amber-100">
                  {selectedPlayerForNote.avatarUrl ? (
                    <img
                      src={selectedPlayerForNote.avatarUrl}
                      alt={selectedPlayerForNote.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-amber-900 m-auto" />
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                    {selectedPlayerForNote.isHuman ? 'User Record' : 'AI Challenger'}
                  </span>
                  <h3 className="text-base font-black text-amber-950 truncate">
                    {selectedPlayerForNote.name}
                  </h3>
                  <span className="text-[11px] font-bold text-amber-800">
                    Tile Position: {selectedPlayerForNote.position}
                  </span>
                </div>
              </div>

              {/* Match Won / Loss Percentage Record Section */}
              {(() => {
                const total = selectedPlayerForNote.totalMatches || 1;
                const won = selectedPlayerForNote.matchesWon || 0;
                const lost = selectedPlayerForNote.matchesLost || 0;
                const winRate = ((won / total) * 100).toFixed(1);
                const lossRate = ((lost / total) * 100).toFixed(1);

                return (
                  <div className="py-3 space-y-2.5">
                    {/* Total matches banner */}
                    <div className="flex justify-between items-center bg-amber-200/60 px-2.5 py-1 rounded text-xs font-bold text-amber-950">
                      <span>Total Snake Matches:</span>
                      <span className="font-mono font-black">{total} Matches</span>
                    </div>

                    {/* Win percentage card */}
                    <div className="flex items-center justify-between bg-emerald-100 border border-emerald-300/80 px-2.5 py-1.5 rounded shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold text-emerald-900">Matches Won</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-800">{won}</span>
                        <span className="ml-1 text-xs font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
                          {winRate}%
                        </span>
                      </div>
                    </div>

                    {/* Loss percentage card */}
                    <div className="flex items-center justify-between bg-rose-100 border border-rose-300/80 px-2.5 py-1.5 rounded shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <X className="w-4 h-4 text-rose-700" />
                        <span className="text-xs font-bold text-rose-900">Matches Lost</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-rose-800">{lost}</span>
                        <span className="ml-1 text-xs font-black px-1.5 py-0.5 rounded bg-rose-600 text-white shadow-xs">
                          {lossRate}%
                        </span>
                      </div>
                    </div>

                    {/* Visual Comparison Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-black text-amber-900">
                        <span>Win Rate ({winRate}%)</span>
                        <span>Loss Rate ({lossRate}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden flex bg-rose-300 shadow-inner">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${winRate}%` }}
                        />
                        <div
                          className="h-full bg-rose-500 transition-all duration-500"
                          style={{ width: `${lossRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Note Footer */}
              <div className="pt-2 border-t border-amber-300/80 text-center">
                <p className="text-[10px] italic font-semibold text-amber-800">
                  📌 Tap anywhere outside to close note
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. VICTORY MODAL */}
      <AnimatePresence>
        {winner && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-sm bg-gradient-to-b from-[#262117] via-[#17140e] to-[#0a0906] border-2 border-[#DCCBA7] rounded-3xl p-6 text-center text-white shadow-[0_0_50px_rgba(220,203,167,0.4)] space-y-4"
            >
              <Trophy className="w-16 h-16 text-[#DCCBA7] mx-auto animate-bounce filter drop-shadow-[0_4px_20px_rgba(220,203,167,0.8)]" />

              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#A79E7B] font-black">
                  CHAMPION
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#fef3c7] mt-1">
                  {winner} Won!
                </h2>
                <p className="text-xs text-[#dccba7] mt-1">
                  Reached Tile 100 first and claimed victory!
                </p>

                {prizePool > 0 && winner === userName && (
                  <div className="mt-3 py-2 px-4 bg-emerald-950/80 border border-emerald-400/60 rounded-xl flex items-center justify-center gap-2 text-emerald-300 font-black text-sm">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span>+${prizePool.toFixed(2)} USDT Credited!</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#DCCBA7] to-[#A79E7B] text-[#1c1810] font-sans font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  Play Again
                </button>
                <button
                  onClick={onBackToLobby}
                  className="flex-1 py-3 rounded-2xl bg-[#1f1b13] border border-[#A79E7B]/50 text-[#fef3c7] font-bold text-sm hover:bg-[#2c271b] active:scale-95 transition-all cursor-pointer"
                >
                  Lobby
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

