import React from 'react';
import { motion } from 'motion/react';
import { getTileCoordinates } from './types';

export type AdventurePawnColor = 'red' | 'green' | 'yellow' | 'blue';

export interface AdventurePawn3DProps {
  player?: 'p1' | 'p2' | 'p3' | 'p4' | string;
  color?: AdventurePawnColor;
  position: number;
  isActiveTurn: boolean;
  isMoving: boolean;
  hasCoOccupant?: boolean;
  occupantIndex?: number;
  totalOccupants?: number;
}

export const AdventurePawn3D: React.FC<AdventurePawn3DProps> = ({
  player = 'p1',
  color = 'red',
  position,
  isActiveTurn,
  isMoving,
  hasCoOccupant = false,
  occupantIndex = 0,
  totalOccupants = 1,
}) => {
  const coords = getTileCoordinates(position);

  // Dynamic radial/corner offset when multiple pawns occupy the same tile
  let offsetX = 0;
  let offsetY = 0;

  if (hasCoOccupant || totalOccupants > 1) {
    if (totalOccupants === 2 || (hasCoOccupant && totalOccupants <= 2)) {
      offsetX = occupantIndex === 0 ? -1.8 : 1.8;
      offsetY = occupantIndex === 0 ? -1.8 : 1.8;
    } else if (totalOccupants === 3) {
      if (occupantIndex === 0) {
        offsetX = -1.8;
        offsetY = -1.8;
      } else if (occupantIndex === 1) {
        offsetX = 1.8;
        offsetY = -1.8;
      } else {
        offsetX = 0;
        offsetY = 1.8;
      }
    } else if (totalOccupants >= 4) {
      if (occupantIndex === 0) {
        offsetX = -1.8;
        offsetY = -1.8;
      } else if (occupantIndex === 1) {
        offsetX = 1.8;
        offsetY = -1.8;
      } else if (occupantIndex === 2) {
        offsetX = -1.8;
        offsetY = 1.8;
      } else {
        offsetX = 1.8;
        offsetY = 1.8;
      }
    }
  }

  const leftPercent = coords.xPercent + offsetX;
  const topPercent = coords.yPercent + offsetY;

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

        {/* 2. THEMED 3D TOTEM BY COLOR */}
        {color === 'red' && (
          /* RED: GOLDEN SUN GOD & RUBY EXPLORER IDOL */
          <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#ffd700] via-[#dc2626] to-[#450a0a] border-2 border-[#fef08a] shadow-[0_6px_16px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center">
            <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-tr from-[#92400e] via-[#fbbf24] to-[#fef08a] border border-[#fef08a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#f87171] to-[#991b1b] shadow-[0_0_6px_#ef4444] flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-white shadow-[0_0_2px_#fff]" />
              </div>
            </div>
            {isActiveTurn && (
              <motion.div
                animate={{ scale: [1, 1.55, 1], opacity: [0.9, 0, 0.9] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full border-2 border-amber-300 shadow-[0_0_14px_#f59e0b] pointer-events-none"
              />
            )}
          </div>
        )}

        {color === 'green' && (
          /* GREEN: OBSIDIAN & JADE JAGUAR TOTEM */
          <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#a7f3d0] via-[#059669] to-[#022c22] border-2 border-[#6ee7b7] shadow-[0_6px_16px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center">
            <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-tr from-[#064e3b] via-[#34d399] to-[#d1fae5] border border-[#a7f3d0] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#6ee7b7] to-[#047857] shadow-[0_0_6px_#10b981] flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-white shadow-[0_0_2px_#fff]" />
              </div>
            </div>
            {isActiveTurn && (
              <motion.div
                animate={{ scale: [1, 1.55, 1], opacity: [0.9, 0, 0.9] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full border-2 border-emerald-300 shadow-[0_0_14px_#10b981] pointer-events-none"
              />
            )}
          </div>
        )}

        {color === 'yellow' && (
          /* YELLOW: ANCIENT TOPAZ & AMBER SUN TOTEM */
          <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#fef08a] via-[#eab308] to-[#713f12] border-2 border-[#fef08a] shadow-[0_6px_16px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center">
            <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-tr from-[#854d0e] via-[#facc15] to-[#fef9c3] border border-[#fde047] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#fef08a] to-[#ca8a04] shadow-[0_0_6px_#eab308] flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-white shadow-[0_0_2px_#fff]" />
              </div>
            </div>
            {isActiveTurn && (
              <motion.div
                animate={{ scale: [1, 1.55, 1], opacity: [0.9, 0, 0.9] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full border-2 border-yellow-300 shadow-[0_0_14px_#eab308] pointer-events-none"
              />
            )}
          </div>
        )}

        {color === 'blue' && (
          /* BLUE: PLATINUM & SAPPHIRE SERPENT TOTEM */
          <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#93c5fd] via-[#2563eb] to-[#172554] border-2 border-[#bfdbfe] shadow-[0_6px_16px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center">
            <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-tr from-[#1e3a8a] via-[#60a5fa] to-[#dbeafe] border border-[#93c5fd] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#93c5fd] to-[#1d4ed8] shadow-[0_0_6px_#3b82f6] flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-white shadow-[0_0_2px_#fff]" />
              </div>
            </div>
            {isActiveTurn && (
              <motion.div
                animate={{ scale: [1, 1.55, 1], opacity: [0.9, 0, 0.9] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full border-2 border-cyan-300 shadow-[0_0_14px_#38bdf8] pointer-events-none"
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
