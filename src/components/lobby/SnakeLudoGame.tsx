import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Trophy, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import confetti from 'canvas-confetti';

interface SnakeLudoGameProps {
  onBackToLobby: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

// Snake and ladder mappings (start -> end)
const LADDERS: Record<number, number> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
};

const SNAKES: Record<number, number> = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 78,
};

export const SnakeLudoGame: React.FC<SnakeLudoGameProps> = ({
  onBackToLobby,
  isMuted,
  onToggleMute,
}) => {
  const [player1Pos, setPlayer1Pos] = useState<number>(1);
  const [player2Pos, setPlayer2Pos] = useState<number>(1);
  const [currentTurn, setCurrentTurn] = useState<'p1' | 'p2'>('p1');
  const [diceVal, setDiceVal] = useState<number>(1);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [logMessage, setLogMessage] = useState<string>("ROLL THE DICE TO CLIMB TO 100!");
  const [winner, setWinner] = useState<string | null>(null);

  // Roll dice and move pawn
  const handleRoll = () => {
    if (isRolling || winner) return;

    SoundManager.play('dice-roll');
    setIsRolling(true);

    const rolled = Math.floor(Math.random() * 6) + 1;
    setDiceVal(rolled);

    setTimeout(() => {
      setIsRolling(false);
      SoundManager.play('pawn-step');

      const isP1 = currentTurn === 'p1';
      const currentPos = isP1 ? player1Pos : player2Pos;
      let nextPos = currentPos + rolled;

      if (nextPos > 100) {
        nextPos = currentPos; // Overshot 100
        setLogMessage(`${isP1 ? 'Player 1' : 'Player 2'} needs exact roll for 100!`);
      } else {
        // Check ladder
        if (LADDERS[nextPos]) {
          const ladderTo = LADDERS[nextPos];
          setLogMessage(`LADDER CLIMBED! Up from ${nextPos} to ${ladderTo}!`);
          SoundManager.play('pawn-finish');
          nextPos = ladderTo;
        }
        // Check snake
        else if (SNAKES[nextPos]) {
          const snakeTo = SNAKES[nextPos];
          setLogMessage(`OUCH! BITTEN BY A SNAKE! Down from ${nextPos} to ${snakeTo}!`);
          SoundManager.play('pawn-capture');
          nextPos = snakeTo;
        } else {
          setLogMessage(`${isP1 ? 'Player 1' : 'Player 2'} moved to tile ${nextPos}`);
        }
      }

      if (isP1) {
        setPlayer1Pos(nextPos);
        if (nextPos === 100) {
          setWinner('Player 1');
          SoundManager.play('pawn-finish');
          confetti({ particleCount: 100, spread: 80 });
          return;
        }
        // Pass turn if not 6
        if (rolled !== 6) {
          setCurrentTurn('p2');
        } else {
          setLogMessage('ROLLED 6! BONUS TURN!');
        }
      } else {
        setPlayer2Pos(nextPos);
        if (nextPos === 100) {
          setWinner('Player 2');
          SoundManager.play('pawn-finish');
          confetti({ particleCount: 100, spread: 80 });
          return;
        }
        // Pass turn if not 6
        if (rolled !== 6) {
          setCurrentTurn('p1');
        } else {
          setLogMessage('ROLLED 6! BONUS TURN!');
        }
      }
    }, 600);
  };

  // Bot automation for P2
  useEffect(() => {
    if (currentTurn === 'p2' && !winner && !isRolling) {
      const timer = setTimeout(() => {
        handleRoll();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, winner, isRolling]);

  const handleReset = () => {
    setPlayer1Pos(1);
    setPlayer2Pos(1);
    setCurrentTurn('p1');
    setWinner(null);
    setLogMessage("NEW GAME STARTED! ROLL TO 100.");
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-[#061c12] via-[#0b2b1d] to-[#040e09] text-white flex flex-col items-center justify-between p-3 select-none">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between py-2 px-1">
        <button
          onClick={() => {
            SoundManager.play('click');
            onBackToLobby();
          }}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Lobby</span>
        </button>

        <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-400/40 px-3 py-1 rounded-full text-xs font-extrabold text-emerald-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Snake Ludo Arena</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleReset}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white"
            title="Reset Match"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Players Status HUD */}
      <div className="w-full max-w-md grid grid-cols-2 gap-2 my-1">
        {/* Player 1 (Blue) */}
        <div
          className={`p-2.5 rounded-2xl border transition-all ${
            currentTurn === 'p1'
              ? 'bg-blue-900/60 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-[1.02]'
              : 'bg-white/5 border-white/10 opacity-70'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-blue-300">You (Player 1)</span>
            <span className="font-black text-amber-300">Tile {player1Pos}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-blue-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${player1Pos}%` }}
            />
          </div>
        </div>

        {/* Player 2 (Emerald Snake Bot) */}
        <div
          className={`p-2.5 rounded-2xl border transition-all ${
            currentTurn === 'p2'
              ? 'bg-emerald-900/60 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-[1.02]'
              : 'bg-white/5 border-white/10 opacity-70'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-300">Snake Bot (P2)</span>
            <span className="font-black text-amber-300">Tile {player2Pos}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${player2Pos}%` }}
            />
          </div>
        </div>
      </div>

      {/* 10x10 Snakes & Ladders Board Grid */}
      <div className="relative w-full max-w-[370px] aspect-square bg-[#05170e] border-2 border-emerald-400/40 rounded-2xl p-2 shadow-2xl grid grid-cols-10 grid-rows-10 gap-0.5 my-auto">
        {/* Render 100 numbered tiles with snake/ladder highlights */}
        {Array.from({ length: 100 }).map((_, i) => {
          // Snake & ladder zigzag numbering from bottom-left (1) to top-left (100)
          const row = 9 - Math.floor(i / 10);
          const isRowEven = row % 2 === 1;
          const col = isRowEven ? 9 - (i % 10) : i % 10;
          const tileNumber = row * 10 + col + 1;

          const isP1Here = player1Pos === tileNumber;
          const isP2Here = player2Pos === tileNumber;
          const isLadderStart = !!LADDERS[tileNumber];
          const isSnakeHead = !!SNAKES[tileNumber];

          return (
            <div
              key={tileNumber}
              className={`relative rounded-[3px] flex items-center justify-center text-[7.5px] font-bold select-none ${
                (row + col) % 2 === 0 ? 'bg-emerald-950/60' : 'bg-emerald-900/40'
              } ${
                isLadderStart
                  ? 'border border-amber-400/80 bg-amber-950/40 text-amber-300'
                  : isSnakeHead
                  ? 'border border-rose-500/80 bg-rose-950/40 text-rose-300'
                  : 'text-slate-400'
              }`}
            >
              <span className="opacity-60">{tileNumber}</span>

              {/* Ladder Icon */}
              {isLadderStart && <span className="absolute text-[8px] -top-0.5 right-0.5">🪜</span>}
              {/* Snake Icon */}
              {isSnakeHead && <span className="absolute text-[8px] -top-0.5 right-0.5">🐍</span>}

              {/* Player 1 Pawn */}
              {isP1Here && (
                <motion.div
                  layoutId="p1-pawn"
                  className="absolute inset-0.5 rounded-full bg-blue-500 border border-white shadow-[0_0_6px_rgba(59,130,246,0.9)] z-20"
                />
              )}

              {/* Player 2 Pawn */}
              {isP2Here && (
                <motion.div
                  layoutId="p2-pawn"
                  className="absolute inset-0.5 rounded-full bg-emerald-400 border border-white shadow-[0_0_6px_rgba(52,211,153,0.9)] z-20"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Status Bar */}
      <div className="w-full max-w-md text-center py-1.5 px-3 bg-white/5 border border-white/10 rounded-xl my-1 text-xs font-bold text-emerald-200">
        {logMessage}
      </div>

      {/* Bottom Dice Roll Controls */}
      <div className="w-full max-w-md flex items-center justify-center gap-4 py-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isRolling || currentTurn === 'p2' || !!winner}
          onClick={handleRoll}
          className={`flex items-center gap-3 px-8 py-3 rounded-full font-black text-base shadow-xl transition-all ${
            currentTurn === 'p1' && !winner
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-[0_4px_16px_rgba(251,191,36,0.5)] cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
          }`}
        >
          {/* Animated 3D Dice */}
          <div
            className={`w-9 h-9 rounded-xl bg-slate-900 border-2 border-amber-300 text-amber-300 flex items-center justify-center text-lg font-black ${
              isRolling ? 'animate-spin' : ''
            }`}
          >
            {diceVal}
          </div>
          <span>{isRolling ? 'Rolling...' : currentTurn === 'p1' ? 'Roll Dice 🎲' : "Bot's Turn..."}</span>
        </motion.button>
      </div>

      {/* Winner Overlay */}
      {winner && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-gradient-to-b from-emerald-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 text-center text-white shadow-2xl"
          >
            <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce mb-2" />
            <h2 className="text-3xl font-black text-white">{winner} Wins!</h2>
            <p className="text-sm text-emerald-200 mt-1 mb-5">Reached tile 100 first!</p>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl bg-amber-400 text-slate-950 font-black"
              >
                Play Again
              </button>
              <button
                onClick={onBackToLobby}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold"
              >
                Lobby
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
