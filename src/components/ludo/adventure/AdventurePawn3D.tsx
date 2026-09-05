import React from 'react';
import { motion } from 'motion/react';
import { getTileCoordinates } from './types';

export interface AdventurePawn3DProps {
  player: 'p1' | 'p2' | 'p3' | 'p4';
  position: number;
  isActiveTurn: boolean;
  isMoving: boolean;
  hasCoOccupant?: boolean;
  coOccupantOffset?: { x: number; y: number };
}

export const AdventurePawn3D: React.FC<AdventurePawn3DProps> = ({
  player,
  position,
  isActiveTurn,
  isMoving,
  hasCoOccupant = false,
  coOccupantOffset,
}) => {
  const coords = getTileCoordinates(position);

  // Slight horizontal/vertical offset if pawns occupy the same tile
  let offsetX = 0;
  let offsetY = 0;

  if (coOccupantOffset) {
    offsetX = coOccupantOffset.x;
    offsetY = coOccupantOffset.y;
  } else if (hasCoOccupant) {
    if (player === 'p1') {
      offsetX = -1.8;
      offsetY = -1.8;
    } else if (player === 'p2') {
      offsetX = 1.8;
      offsetY = -1.8;
    } else if (player === 'p3') {
      offsetX = -1.8;
      offsetY = 1.8;
    } else {
      offsetX = 1.8;
      offsetY = 1.8;
    }
  }

  const leftPercent = coords.xPercent + offsetX;
  const topPercent = coords.yPercent + offsetY;

  // Pawn theme configurations: p1 = Yellow/Gold, p2 = Red, p3 = Blue, p4 = Green
  const pawnConfigs = {
    p1: {
      outerBg: 'from-[#fef08a] via-[#eab308] to-[#78350f]',
      outerBorder: 'border-[#fef08a]',
      innerRing: 'from-[#78350f] via-[#f59e0b] to-[#fef9c3]',
      innerBorder: 'border-[#fef08a]',
      core: 'from-[#fde047] to-[#b45309]',
      glow: '#eab308',
      haloBorder: 'border-yellow-300 shadow-[0_0_14px_#eab308]',
    },
    p2: {
      outerBg: 'from-[#fca5a5] via-[#dc2626] to-[#450a0a]',
      outerBorder: 'border-[#fca5a5]',
      innerRing: 'from-[#7f1d1d] via-[#ef4444] to-[#fee2e2]',
      innerBorder: 'border-[#fca5a5]',
      core: 'from-[#f87171] to-[#991b1b]',
      glow: '#ef4444',
      haloBorder: 'border-red-400 shadow-[0_0_14px_#ef4444]',
    },
    p3: {
      outerBg: 'from-[#bae6fd] via-[#2563eb] to-[#0c4a6e]',
      outerBorder: 'border-[#93c5fd]',
      innerRing: 'from-[#1e3a8a] via-[#60a5fa] to-[#e0f2fe]',
      innerBorder: 'border-[#bae6fd]',
      core: 'from-[#93c5fd] to-[#1d4ed8]',
      glow: '#3b82f6',
      haloBorder: 'border-blue-300 shadow-[0_0_14px_#3b82f6]',
    },
    p4: {
      outerBg: 'from-[#a7f3d0] via-[#059669] to-[#022c22]',
      outerBorder: 'border-[#6ee7b7]',
      innerRing: 'from-[#064e3b] via-[#34d399] to-[#d1fae5]',
      innerBorder: 'border-[#a7f3d0]',
      core: 'from-[#6ee7b7] to-[#047857]',
      glow: '#10b981',
      haloBorder: 'border-emerald-300 shadow-[0_0_14px_#10b981]',
    },
  };

  const currentTheme = pawnConfigs[player];

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

        {/* 2. 3D SCULPTED IDOL TOKEN */}
        <div className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br ${currentTheme.outerBg} border-2 ${currentTheme.outerBorder} shadow-[0_6px_16px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center`}>
          {/* Outer Sculpted Filigree Ring */}
          <div className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-tr ${currentTheme.innerRing} border ${currentTheme.innerBorder} shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] flex items-center justify-center`}>
            {/* Inner Glowing Core */}
            <div
              className={`w-2 h-2 rounded-full bg-gradient-to-br ${currentTheme.core} flex items-center justify-center`}
              style={{ boxShadow: `0 0 6px ${currentTheme.glow}` }}
            >
              {/* Specular White Glint */}
              <div className="w-0.5 h-0.5 rounded-full bg-white shadow-[0_0_2px_#fff]" />
            </div>
          </div>

          {/* Active Turn Radiant Halo */}
          {isActiveTurn && (
            <motion.div
              animate={{ scale: [1, 1.55, 1], opacity: [0.9, 0, 0.9] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute inset-0 rounded-full border-2 ${currentTheme.haloBorder} pointer-events-none`}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};
