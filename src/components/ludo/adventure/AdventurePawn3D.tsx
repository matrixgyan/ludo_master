import React from 'react';
import { motion } from 'motion/react';
import { getTileCoordinates } from './types';

export interface AdventurePawn3DProps {
  player: 'p1' | 'p2';
  position: number;
  isActiveTurn: boolean;
  isMoving: boolean;
  hasCoOccupant?: boolean;
}

export const AdventurePawn3D: React.FC<AdventurePawn3DProps> = ({
  player,
  position,
  isActiveTurn,
  isMoving,
  hasCoOccupant = false,
}) => {
  const coords = getTileCoordinates(position);

  // Slight horizontal offset if both pawns occupy the same tile
  const offsetX = hasCoOccupant ? (player === 'p1' ? -1.8 : 1.8) : 0;
  const offsetY = hasCoOccupant ? (player === 'p1' ? -1.8 : 1.8) : 0;

  const leftPercent = coords.xPercent + offsetX;
  const topPercent = coords.yPercent + offsetY;

  const isP1 = player === 'p1';

  return (
    <motion.div
      id={`adventure-pawn-${player}`}
      className="absolute w-7 h-7 sm:w-8 sm:h-8 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-center select-none"
      animate={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        scale: isMoving && isActiveTurn ? 1.4 : 1,
        y: isMoving && isActiveTurn ? -12 : 0,
      }}
      transition={{
        left: { type: 'spring', damping: 20, stiffness: 280 },
        top: { type: 'spring', damping: 20, stiffness: 280 },
        scale: { duration: 0.16 },
        y: { duration: 0.16 },
      }}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* 1. DYNAMIC MULTI-LAYER 3D GROUND SHADOW */}
        <div
          className={`absolute bottom-0 w-6 h-3 bg-black/85 rounded-full blur-[2px] transition-all duration-200 ${
            isMoving && isActiveTurn
              ? 'scale-60 opacity-30 translate-y-3'
              : 'scale-100 opacity-80'
          }`}
        />
        <div
          className={`absolute bottom-0 w-3 h-1.5 bg-black rounded-full blur-[1px] ${
            isMoving && isActiveTurn ? 'opacity-20' : 'opacity-90'
          }`}
        />

        {/* 2. PLAYER 1: GOLDEN SUN GOD & RUBY EXPLORER IDOL */}
        {isP1 ? (
          <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#ffd700] via-[#dc2626] to-[#450a0a] border-2 border-[#fef08a] shadow-[0_6px_16px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center">
            {/* Outer Sculpted Gold Filigree Ring */}
            <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-tr from-[#92400e] via-[#fbbf24] to-[#fef08a] border border-[#fef08a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] flex items-center justify-center">
              {/* Inner Glowing Ruby Core */}
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#f87171] to-[#991b1b] shadow-[0_0_6px_#ef4444] flex items-center justify-center">
                {/* Specular White Glint */}
                <div className="w-0.5 h-0.5 rounded-full bg-white shadow-[0_0_2px_#fff]" />
              </div>
            </div>

            {/* Active Turn Radiant Fire Halo */}
            {isActiveTurn && (
              <motion.div
                animate={{ scale: [1, 1.55, 1], opacity: [0.9, 0, 0.9] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full border-2 border-amber-300 shadow-[0_0_14px_#f59e0b] pointer-events-none"
              />
            )}
          </div>
        ) : (
          /* 3. PLAYER 2: OBSIDIAN & JADE JAGUAR TOTEM */
          <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#a7f3d0] via-[#059669] to-[#022c22] border-2 border-[#6ee7b7] shadow-[0_6px_16px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center">
            {/* Outer Sculpted Emerald Filigree Ring */}
            <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-tr from-[#064e3b] via-[#34d399] to-[#d1fae5] border border-[#a7f3d0] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] flex items-center justify-center">
              {/* Inner Glowing Jade Core */}
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#6ee7b7] to-[#047857] shadow-[0_0_6px_#10b981] flex items-center justify-center">
                {/* Specular White Glint */}
                <div className="w-0.5 h-0.5 rounded-full bg-white shadow-[0_0_2px_#fff]" />
              </div>
            </div>

            {/* Active Turn Radiant Emerald Halo */}
            {isActiveTurn && (
              <motion.div
                animate={{ scale: [1, 1.55, 1], opacity: [0.9, 0, 0.9] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full border-2 border-emerald-300 shadow-[0_0_14px_#10b981] pointer-events-none"
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
