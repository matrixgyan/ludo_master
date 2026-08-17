import React from 'react';
import { motion } from 'motion/react';
import { TileData, LADDER_MAP, SNAKE_MAP } from './types';

interface AdventureTileProps {
  tile: TileData;
  isHighlighted?: boolean;
  isInspected?: boolean;
  onClick?: () => void;
}

export const AdventureTile: React.FC<AdventureTileProps> = ({
  tile,
  isHighlighted = false,
  isInspected = false,
  onClick,
}) => {
  const { number, row, col } = tile;
  // Checkerboard pattern matching the screenshot:
  // (row + col) % 2 === 1 => Muted Olive Green (#A79E7B) (e.g. Tile 1 at r=9,c=0, Tile 3, 5, 7, 9, 99, 91)
  // (row + col) % 2 === 0 => Light Beige (#DCCBA7) (e.g. Tile 2 at r=9,c=1, Tile 4, 6, 8, 10, 100, 98)
  const isOlive = (row + col) % 2 === 1;
  const ladder = LADDER_MAP[number];
  const snake = SNAKE_MAP[number];

  return (
    <motion.div
      id={`adventure-tile-${number}`}
      onClick={onClick}
      whileHover={{ scale: 1.03, zIndex: 20 }}
      whileTap={{ scale: 0.97 }}
      className={`relative w-full h-full select-none cursor-pointer transition-all duration-150 flex items-center justify-center overflow-hidden border-[0.5px] border-[#8a8064]/50 ${
        isOlive
          ? 'bg-[#A79E7B]'
          : 'bg-[#DCCBA7]'
      } ${
        isHighlighted
          ? 'ring-2 sm:ring-[3px] ring-amber-400 ring-inset shadow-[0_0_15px_rgba(251,191,36,0.85)] z-20'
          : isInspected
          ? 'ring-2 ring-white/90 ring-inset bg-white/25 z-10'
          : ''
      }`}
      style={{
        backgroundColor: isOlive ? '#A79E7B' : '#DCCBA7',
      }}
    >
      {/* 1. REALISTIC VINTAGE PARCHMENT / LINEN TEXTURE OVERLAY */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.08) 100%), radial-gradient(rgba(70,55,30,0.12) 1px, transparent 0)`,
          backgroundSize: '100% 100%, 4px 4px',
        }}
      />

      {/* Subtle organic aged paper grain variation */}
      {number % 5 === 0 && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#2b2416]/[0.03] to-transparent pointer-events-none" />
      )}

      {/* 2. CENTERED CLASSICAL SERIF NUMBER (EXACT SCREENSHOT STYLE) */}
      <span
        className="relative z-10 font-serif font-medium text-[#2d271c] sm:text-base md:text-lg text-xs leading-none tracking-tight select-none drop-shadow-[0_0.5px_0.5px_rgba(255,255,255,0.3)]"
        style={{
          fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
        }}
      >
        {number}
      </span>

      {/* 3. DISCREET GAMEPLAY BADGE (FOR LADDER OR SNAKE DESTINATION) */}
      {ladder && (
        <div className="absolute top-0.5 right-0.5 z-10 flex items-center gap-0.5 px-0.5 py-0.2 rounded bg-[#2e4726]/80 text-[#d8f3dc] text-[6.5px] sm:text-[8px] font-sans font-bold leading-none pointer-events-none shadow-sm">
          <span>🪜</span>
          <span>{ladder.dest}</span>
        </div>
      )}
      {snake && (
        <div className="absolute top-0.5 right-0.5 z-10 flex items-center gap-0.5 px-0.5 py-0.2 rounded bg-[#661d28]/80 text-[#ffe3e3] text-[6.5px] sm:text-[8px] font-sans font-bold leading-none pointer-events-none shadow-sm">
          <span>🐍</span>
          <span>{snake.dest}</span>
        </div>
      )}

      {/* 4. SUBTLE TILE BEVEL */}
      <div className="absolute inset-0 border border-white/20 pointer-events-none" />
    </motion.div>
  );
};

