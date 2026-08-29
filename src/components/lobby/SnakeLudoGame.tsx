import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  User,
  Coins,
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import { AdventureSnakeBoard } from '../ludo/adventure/AdventureSnakeBoard';
import { SnakeLudo3DDice } from '../ludo/adventure/SnakeLudo3DDice';
import {
  LADDER_MAP,
  SNAKE_MAP,
} from '../ludo/adventure/types';
import confetti from 'canvas-confetti';
import { usePlatformMode } from '../../hooks/usePlatformMode';

interface SnakeLudoGameProps {
  onBackToLobby: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  entryFee?: number;
  prizePool?: number;
  userName?: string;
  userAvatar?: string;
  playerCount?: number;
  onMatchWon?: (prize: number) => void;
}

export const SnakeLudoGame: React.FC<SnakeLudoGameProps> = ({
  onBackToLobby,
  isMuted,
  onToggleMute,
  entryFee = 0,
  prizePool = 0,
  userName = 'Player 1',
  userAvatar,
  playerCount = 2,
  onMatchWon,
}) => {
  const { platformMode } = usePlatformMode();
  const [player1Pos, setPlayer1Pos] = useState<number>(1);
  const [player2Pos, setPlayer2Pos] = useState<number>(1);
  const [currentTurn, setCurrentTurn] = useState<'p1' | 'p2'>('p1');
  const [diceVal, setDiceVal] = useState<number>(1);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isMovingPawn, setIsMovingPawn] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [highlightTile, setHighlightTile] = useState<number | null>(null);
  const [highlightLadderId, setHighlightLadderId] = useState<string | null>(null);
  const [highlightSnakeId, setHighlightSnakeId] = useState<string | null>(null);
  const [boardShake, setBoardShake] = useState<boolean>(false);
  const [actionAlert, setActionAlert] = useState<{
    text: string;
    type: 'ladder' | 'snake' | 'bonus' | 'neutral';
  } | null>(null);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Step-by-step pawn motion
  const movePawnStepByStep = async (
    player: 'p1' | 'p2',
    startPos: number,
    steps: number
  ) => {
    setIsMovingPawn(true);
    let curr = startPos;

    for (let i = 1; i <= steps; i++) {
      curr += 1;
      if (curr > 100) {
        curr = startPos;
        if (player === 'p1') setPlayer1Pos(curr);
        else setPlayer2Pos(curr);
        setActionAlert({
          text: 'Overshot! Exact roll needed for Tile 100',
          type: 'neutral',
        });
        SoundManager.play('turn');
        setIsMovingPawn(false);
        setTimeout(() => setActionAlert(null), 2500);
        return curr;
      }

      if (player === 'p1') setPlayer1Pos(curr);
      else setPlayer2Pos(curr);

      SoundManager.play('pawn-step');
      await sleep(160);
    }

    // Check if landed on a stair / ladder
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
      if (player === 'p1') setPlayer1Pos(curr);
      else setPlayer2Pos(curr);
      await sleep(300);
      setHighlightLadderId(null);
      setHighlightTile(null);
      setTimeout(() => setActionAlert(null), 2500);
    }
    // Check if ambushed by a snake
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
        if (player === 'p1') setPlayer1Pos(curr);
        else setPlayer2Pos(curr);
        await sleep(300);
        setHighlightSnakeId(null);
        setHighlightTile(null);
        setTimeout(() => setActionAlert(null), 2500);
      }
    }

    setIsMovingPawn(false);
    return curr;
  };

  // Roll Interactive Dice
  const handleRoll = async () => {
    if (isRolling || isMovingPawn || winner) return;

    SoundManager.play('dice-roll');
    setIsRolling(true);
    setActionAlert(null);

    const rolled = Math.floor(Math.random() * 6) + 1;
    setDiceVal(rolled);

    await sleep(780);
    setIsRolling(false);

    const isP1 = currentTurn === 'p1';
    const startPos = isP1 ? player1Pos : player2Pos;
    const finalPos = await movePawnStepByStep(currentTurn, startPos, rolled);

    // Reached Finish (Tile 100)
    if (finalPos === 100) {
      const winnerName = isP1 ? userName : 'Opponent';
      setWinner(winnerName);
      SoundManager.play('pawn-finish');
      confetti({
        particleCount: 180,
        spread: 95,
        origin: { y: 0.6 },
        colors: ['#A79E7B', '#DCCBA7', '#f59e0b', '#10b981', '#ffffff'],
      });

      if (isP1 && prizePool > 0) {
        onMatchWon?.(prizePool);
      }
      return;
    }

    // Extra Turn on 6
    if (rolled === 6) {
      setActionAlert({
        text: '🔥 Rolled a 6! Extra turn awarded!',
        type: 'bonus',
      });
      setTimeout(() => setActionAlert(null), 2200);
    } else {
      setCurrentTurn(isP1 ? 'p2' : 'p1');
    }
  };

  // Automatic roll for Opponent (P2) turn
  useEffect(() => {
    if (currentTurn === 'p2' && !winner && !isRolling && !isMovingPawn) {
      const timer = setTimeout(() => {
        handleRoll();
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, winner, isRolling, isMovingPawn]);

  const handleReset = () => {
    SoundManager.play('click');
    setPlayer1Pos(1);
    setPlayer2Pos(1);
    setCurrentTurn('p1');
    setWinner(null);
    setDiceVal(1);
    setHighlightLadderId(null);
    setHighlightSnakeId(null);
    setHighlightTile(null);
    setActionAlert(null);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0b0c0a] text-[#fef3c7] flex flex-col items-center justify-between p-2.5 sm:p-3 select-none overflow-hidden font-sans">
      {/* Subtle Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1f1d16] via-[#10100c] to-[#080806] pointer-events-none -z-20" />
      <div className="absolute inset-0 bg-[radial-gradient(#a79e7b12_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

      {/* Atmospheric Soft Warm Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#a79e7b]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#dccba7]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. CLEAN TOP BAR CONTROLS */}
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

        {/* Live Prize Pool Badge */}
        {prizePool > 0 ? (
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-400/60 px-3 py-1 rounded-full shadow-inner">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-xs font-black text-amber-200">
              PRIZE: {platformMode.currencySymbol}{prizePool.toFixed(2)} {platformMode.platformCurrency}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-[11px] font-bold text-stone-300">
            <span>Free Practice</span>
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

      {/* 2. ONLY ROUND PLAYER PROFILES */}
      <div className="w-full max-w-lg flex items-center justify-between px-2 py-1 z-20">
        {/* Player 1 Round Profile */}
        <div className="flex items-center gap-2.5">
          <div
            className={`relative rounded-full p-0.5 transition-all duration-300 ${
              currentTurn === 'p1'
                ? 'ring-2 sm:ring-[3px] ring-[#e05252] shadow-[0_0_16px_rgba(224,82,82,0.8)] scale-105'
                : 'ring-1 ring-white/20 opacity-75'
            }`}
          >
            {/* Round Avatar Circle */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#ef4444] via-[#b91c1c] to-[#450a0a] border border-[#fca5a5] flex items-center justify-center shadow-inner overflow-hidden">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-white drop-shadow" />
              )}
            </div>

            {/* Active Turn Pulsing Indicator */}
            {currentTurn === 'p1' && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white" />
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <span
              className={`text-xs sm:text-sm font-bold tracking-tight ${
                currentTurn === 'p1' ? 'text-[#fca5a5]' : 'text-stone-300'
              }`}
            >
              {userName}
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-[#dccba7]">
              Tile {player1Pos}
            </span>
          </div>
        </div>

        {/* Turn Status Minimal Badge */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-[#a79e7b]">
            {currentTurn === 'p1' ? `${userName}'s Turn` : "Opponent's Turn"}
          </span>
        </div>

        {/* Player 2 Round Profile */}
        <div className="flex items-center gap-2.5 flex-row-reverse">
          <div
            className={`relative rounded-full p-0.5 transition-all duration-300 ${
              currentTurn === 'p2'
                ? 'ring-2 sm:ring-[3px] ring-[#10b981] shadow-[0_0_16px_rgba(16,185,129,0.8)] scale-105'
                : 'ring-1 ring-white/20 opacity-75'
            }`}
          >
            {/* Round Avatar Circle */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#10b981] via-[#047857] to-[#064e3b] border border-[#6ee7b7] flex items-center justify-center shadow-inner overflow-hidden">
              <User className="w-6 h-6 text-white drop-shadow" />
            </div>

            {/* Active Turn Pulsing Indicator */}
            {currentTurn === 'p2' && (
              <span className="absolute -top-1 -left-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white" />
              </span>
            )}
          </div>

          <div className="flex flex-col items-end">
            <span
              className={`text-xs sm:text-sm font-bold tracking-tight ${
                currentTurn === 'p2' ? 'text-[#6ee7b7]' : 'text-stone-300'
              }`}
            >
              Opponent
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-[#dccba7]">
              Tile {player2Pos}
            </span>
          </div>
        </div>
      </div>

      {/* 3. MASTER BOARD */}
      <main className="relative w-full max-w-lg my-auto py-1 flex items-center justify-center">
        <AdventureSnakeBoard
          player1Pos={player1Pos}
          player2Pos={player2Pos}
          activeTurn={currentTurn}
          isMoving={isMovingPawn}
          highlightTile={highlightTile}
          highlightLadderId={highlightLadderId}
          highlightSnakeId={highlightSnakeId}
          boardShake={boardShake}
        />
      </main>

      {/* 4. ACTION EVENT TOAST */}
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

      {/* 5. FULLY 3D SMOOTH PHYSICAL DICE */}
      <footer className="w-full max-w-lg flex items-center justify-center py-2 z-20">
        <SnakeLudo3DDice
          value={diceVal}
          isRolling={isRolling}
          disabled={isMovingPawn || !!winner || currentTurn === 'p2'}
          currentTurn={currentTurn}
          onRoll={handleRoll}
        />
      </footer>

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
                    <span>+{platformMode.currencySymbol}{prizePool.toFixed(2)} {platformMode.platformCurrency} Credited!</span>
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

