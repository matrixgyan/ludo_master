import React from 'react';
import { motion } from 'motion/react';
import { User } from 'lucide-react';
import { SnakeLudo3DDice } from './SnakeLudo3DDice';

export interface SnakePlayerSeatProps {
  playerId: 'p1' | 'p2' | 'p3' | 'p4';
  name: string;
  avatar?: string;
  position: number;
  isActiveTurn: boolean;
  isRolling: boolean;
  diceValue: number;
  disabled: boolean;
  turnTimeLeft: number;
  totalTurnTime: number;
  strikes: number; // 0, 1, 2, 3
  consecutiveSixes: number; // 0, 1, 2
  onRoll: () => void;
  isOpponent?: boolean;
}

export const SnakePlayerSeat: React.FC<SnakePlayerSeatProps> = ({
  playerId,
  name,
  avatar,
  position,
  isActiveTurn,
  isRolling,
  diceValue,
  disabled,
  turnTimeLeft,
  totalTurnTime,
  strikes,
  consecutiveSixes,
  onRoll,
  isOpponent = false,
}) => {
  const isP1 = playerId === 'p1';
  const progressRatio = Math.max(0, Math.min(1, turnTimeLeft / totalTurnTime));

  // Color mappings
  const themeColors = isP1
    ? {
        border: 'border-red-500/80',
        ring: 'ring-red-500',
        bg: 'from-red-600 via-red-800 to-red-950',
        glow: 'shadow-[0_0_12px_rgba(239,68,68,0.7)]',
        timerStroke: '#ef4444',
      }
    : {
        border: 'border-emerald-500/80',
        ring: 'ring-emerald-500',
        bg: 'from-emerald-600 via-emerald-800 to-emerald-950',
        glow: 'shadow-[0_0_12px_rgba(16,185,129,0.7)]',
        timerStroke: '#10b981',
      };

  // Timer SVG parameters
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div
      id={`snake-player-seat-${playerId}`}
      className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${
        isActiveTurn ? 'scale-[1.03] opacity-100' : 'opacity-65 grayscale-[25%]'
      }`}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP: PLAYER PROFILE (Avatar with timer, Name & Tile)        */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 bg-transparent p-0 m-0 border-0">
        {/* Avatar with Circular Countdown Ring */}
        <div className="relative flex items-center justify-center">
          {isActiveTurn && (
            <svg
              className="absolute -inset-1 w-[46px] h-[46px] -rotate-90 pointer-events-none z-10"
              viewBox="0 0 46 46"
            >
              <circle
                cx="23"
                cy="23"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="2"
              />
              <circle
                cx="23"
                cy="23"
                r={radius}
                fill="none"
                stroke={turnTimeLeft <= 3 ? '#f43f5e' : themeColors.timerStroke}
                strokeWidth="2.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-200"
              />
            </svg>
          )}

          {/* Avatar Disc */}
          <div
            className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full p-0.5 transition-all duration-300 ${
              isActiveTurn
                ? `ring-1.5 ${themeColors.ring} ${themeColors.glow}`
                : 'ring-1 ring-white/20'
            }`}
          >
            <div
              className={`w-full h-full rounded-full bg-gradient-to-br ${themeColors.bg} border ${themeColors.border} flex items-center justify-center overflow-hidden shadow-inner`}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow" />
              )}
            </div>

            {/* Active Turn Dot */}
            {isActiveTurn && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 z-20">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isP1 ? 'bg-red-400' : 'bg-emerald-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 border border-white ${
                    isP1 ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                />
              </span>
            )}
          </div>
        </div>

        {/* Player Name, Position, and Strikes */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1">
            <span
              className={`text-xs font-bold truncate max-w-[70px] sm:max-w-[90px] ${
                isActiveTurn ? 'text-[#fef3c7]' : 'text-stone-300'
              }`}
            >
              {name}
            </span>
            {consecutiveSixes > 0 && (
              <span
                className="px-1 py-0.2 rounded text-[8px] font-black bg-amber-500/20 border border-amber-400/60 text-amber-300"
                title={`${consecutiveSixes} consecutive sixes`}
              >
                6x{consecutiveSixes}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px]">
            <span className="font-mono text-stone-300">
              Tile <span className="text-[#fef08a] font-bold">{position}</span>
            </span>
            {isActiveTurn && (
              <span
                className={`font-mono font-black ${
                  turnTimeLeft <= 3 ? 'text-rose-400 animate-pulse' : 'text-amber-300'
                }`}
              >
                {turnTimeLeft}s
              </span>
            )}
          </div>

          {/* Strike Dots */}
          <div className="flex items-center gap-0.5 mt-0.5">
            {[0, 1, 2].map((idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx < strikes
                    ? 'bg-rose-500 shadow-[0_0_4px_#f43f5e]'
                    : 'bg-stone-700 border border-stone-600'
                }`}
                title={`Strike ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. BOTTOM: DEDICATED 3D DICE (Directly below Profile Header)  */}
      {/* ------------------------------------------------------------- */}
      <div className="relative flex flex-col items-center">
        <SnakeLudo3DDice
          value={diceValue}
          isRolling={isRolling && isActiveTurn}
          disabled={disabled || isOpponent}
          isActiveTurn={isActiveTurn}
          playerTheme={playerId}
          onRoll={onRoll}
          size={38}
        />

        {/* Floating Roll Tooltip for Human Player */}
        {isActiveTurn && !isOpponent && !disabled && !isRolling && (
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-3 px-2 py-0.2 rounded-full bg-gradient-to-r from-red-600 to-amber-600 border border-yellow-300 text-[8px] font-black text-white shadow-md uppercase tracking-wider whitespace-nowrap pointer-events-none z-30"
          >
            Roll
          </motion.div>
        )}
      </div>
    </div>
  );
};
