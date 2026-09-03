import React from 'react';
import { motion } from 'motion/react';
import { Player, PlayerColor, DiceState } from '../../../types/game';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { SoundManager } from '../../../audio/soundManager';
import { LudoDice } from '../dice/LudoDice';

interface PlayerProfileHUDProps {
  player: Player;
  isTurn: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onToggleMic?: (playerId: string) => void;
  dice: DiceState;
  onRollDice: () => void;
  turnTimeLeft?: number;
  totalTurnTime?: number;
  strikes?: number;
  maxStrikes?: number;
  isSupreme?: boolean;
  scoreRank?: number;
}

const RING_COLORS: Record<PlayerColor, string> = {
  blue: 'from-blue-400 to-cyan-500 border-blue-300 shadow-blue-500/50',
  red: 'from-red-400 to-rose-600 border-red-300 shadow-red-500/50',
  green: 'from-green-400 to-emerald-600 border-green-300 shadow-green-500/50',
  yellow: 'from-amber-300 to-yellow-500 border-amber-200 shadow-yellow-500/50',
};

const TIMER_STROKE_COLORS: Record<PlayerColor, string> = {
  blue: '#3b82f6',
  red: '#ef4444',
  green: '#10b981',
  yellow: '#eab308',
};

export const PlayerProfileHUD: React.FC<PlayerProfileHUDProps> = ({
  player,
  isTurn,
  position,
  onToggleMic,
  dice,
  onRollDice,
  turnTimeLeft = 10,
  totalTurnTime = 10,
  strikes = 0,
  maxStrikes = 3,
  isSupreme = true,
  scoreRank,
}) => {
  const isRight = position === 'top-right' || position === 'bottom-right';

  const handleMicClick = () => {
    SoundManager.play('mic-toggle');
    if (onToggleMic) onToggleMic(player.id);
  };

  const progressRatio = Math.max(0, Math.min(1, turnTimeLeft / totalTurnTime));
  const radius = 22;
  const circumference = 2 * Math.PI * radius; // ~138.23
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div
      className={`relative flex items-center gap-1.5 sm:gap-2 select-none ${
        isRight ? 'flex-row-reverse text-right' : 'flex-row text-left'
      }`}
    >
      {/* Avatar Circle Container with Active Turn Indicator, Progress Ring & Live Score */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="relative flex items-center justify-center">
          {/* Circular Countdown Progress Ring - exact same speed and styling as Snake Ludo */}
          {isTurn && (
            <svg
              className="absolute -inset-1.5 w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] -rotate-90 pointer-events-none z-20 overflow-visible"
              viewBox="0 0 50 50"
            >
              <circle
                cx="25"
                cy="25"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="2.5"
              />
              <circle
                cx="25"
                cy="25"
                r={radius}
                fill="none"
                stroke={turnTimeLeft <= 3 ? '#f43f5e' : TIMER_STROKE_COLORS[player.color]}
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-200"
                style={{
                  filter: turnTimeLeft <= 3 ? 'drop-shadow(0 0 6px #f43f5e)' : undefined,
                }}
              />
            </svg>
          )}

          {/* Circular Avatar Frame */}
          <div
            className={`relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full p-0.5 bg-gradient-to-tr ${
              RING_COLORS[player.color]
            } shadow-lg border-2 overflow-hidden flex items-center justify-center transition-transform ${
              isTurn ? 'scale-[1.02]' : 'opacity-85'
            }`}
          >
            <img
              src={player.avatarUrl}
              alt={player.color}
              className="w-full h-full object-cover rounded-full bg-slate-800"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${player.color}`;
              }}
            />
          </div>

          {/* Mic / Voice Toggle Badge */}
          <button
            onClick={handleMicClick}
            className={`absolute -bottom-1 -right-1 z-30 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border border-white shadow-md transition-transform active:scale-90 ${
              player.isMuted ? 'bg-slate-700 text-slate-300' : 'bg-green-500 text-white'
            }`}
            title={player.isMuted ? 'Unmute' : 'Mute'}
          >
            {player.isMuted ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
          </button>

          {/* Active Speaking Soundwave Indicator */}
          {player.isSpeaking && (
            <motion.div
              animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute -top-1 -right-1 z-30 w-3.5 h-3.5 rounded-full bg-cyan-400 border border-white"
            >
              <Volume2 className="w-2.5 h-2.5 text-slate-900" />
            </motion.div>
          )}
        </div>

        {/* Live Score Tag Pill & Player Name */}
        <div className="flex flex-col items-center gap-0.5">
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black border shadow-md ${
              scoreRank === 1
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-yellow-200'
                : 'bg-black/75 text-amber-300 border-white/20'
            }`}
          >
            <span>⭐ {player.score ?? 0}</span>
            {isTurn && (
              <span
                className={`ml-0.5 font-mono font-black text-[9px] ${
                  turnTimeLeft <= 3 ? 'text-rose-400 animate-pulse' : 'text-emerald-300'
                }`}
              >
                {turnTimeLeft}s
              </span>
            )}
          </div>

          {/* Life Cycle (3 Strikes / Missed Turns) Feature */}
          <div
            className="flex items-center gap-1 mt-0.5"
            title={`Life Cycle: ${Math.max(0, maxStrikes - strikes)} of ${maxStrikes} Lives Left`}
          >
            {Array.from({ length: maxStrikes }).map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                  idx < strikes
                    ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e] border border-rose-300 scale-110'
                    : 'bg-stone-800 border border-stone-600'
                }`}
                title={`Strike ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Integrated Profile 3D Dice with Turn Timer */}
      <div className="flex items-center">
        <LudoDice
          dice={dice}
          activeColor={player.color}
          onRoll={onRollDice}
          disabled={!isTurn || !dice.canRoll}
          size="compact"
          turnTimeLeft={turnTimeLeft}
          totalTurnTime={totalTurnTime}
          isTurn={isTurn}
        />
      </div>
    </div>
  );
};
