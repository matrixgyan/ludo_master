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
  isSupreme?: boolean;
  scoreRank?: number;
}

const RING_COLORS: Record<PlayerColor, string> = {
  blue: 'from-blue-400 to-cyan-500 border-blue-300 shadow-blue-500/50',
  red: 'from-red-400 to-rose-600 border-red-300 shadow-red-500/50',
  green: 'from-green-400 to-emerald-600 border-green-300 shadow-green-500/50',
  yellow: 'from-amber-300 to-yellow-500 border-amber-200 shadow-yellow-500/50',
};

export const PlayerProfileHUD: React.FC<PlayerProfileHUDProps> = ({
  player,
  isTurn,
  position,
  onToggleMic,
  dice,
  onRollDice,
  turnTimeLeft = 30,
  isSupreme = true,
  scoreRank,
}) => {
  const isRight = position === 'top-right' || position === 'bottom-right';

  const handleMicClick = () => {
    SoundManager.play('mic-toggle');
    if (onToggleMic) onToggleMic(player.id);
  };

  return (
    <div
      className={`relative flex items-center gap-1.5 sm:gap-2 select-none ${
        isRight ? 'flex-row-reverse text-right' : 'flex-row text-left'
      }`}
    >
      {/* Avatar Circle Container with Active Turn Indicator & Live Score */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="relative">
          {isTurn && (
            <div className="absolute inset-[-3px] rounded-full border-2 border-amber-400 animate-pulse pointer-events-none z-0" />
          )}

          {/* Circular Avatar Frame - Clean Profile Picture Only */}
          <div
            className={`relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full p-0.5 bg-gradient-to-tr ${
              RING_COLORS[player.color]
            } shadow-lg border-2 overflow-hidden flex items-center justify-center`}
          >
            <img
              src={player.avatarUrl}
              alt={player.color}
              className="w-full h-full object-cover rounded-full bg-slate-800"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback avatar URL if image fails to load
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${player.color}`;
              }}
            />
          </div>

          {/* Mic / Voice Toggle Badge */}
          <button
            onClick={handleMicClick}
            className={`absolute -bottom-1 -right-1 z-20 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border border-white shadow-md transition-transform active:scale-90 ${
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
              className="absolute -top-1 -right-1 z-20 w-3.5 h-3.5 rounded-full bg-cyan-400 border border-white"
            >
              <Volume2 className="w-2.5 h-2.5 text-slate-900" />
            </motion.div>
          )}
        </div>

        {/* Live Score Tag Pill & Player Name */}
        <div className="flex flex-col items-center gap-0.5 mt-0.5">
          <div
            className={`flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black border shadow-md ${
              scoreRank === 1
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-yellow-200'
                : 'bg-black/75 text-amber-300 border-white/20'
            }`}
          >
            <span>⭐ {player.score ?? 0}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[9px] sm:text-[10px] font-bold text-white max-w-[60px] truncate drop-shadow">
              {player.name}
            </span>
            <span
              className={`text-[7px] font-black px-1 rounded-full ${
                player.isHuman
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700'
              }`}
            >
              {player.isHuman ? 'REAL' : 'BOT'}
            </span>
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
          isTurn={isTurn}
        />
      </div>
    </div>
  );
};
