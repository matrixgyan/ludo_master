import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  TileData,
  LADDER_MAP,
  SNAKE_MAP,
  ADVENTURE_LADDERS,
  ADVENTURE_SNAKES,
} from './types';
import { AdventureTile } from './AdventureTile';
import { RealisticStairs } from './RealisticStairs';
import { RealisticSnakes } from './RealisticSnakes';
import { AdventurePawn3D } from './AdventurePawn3D';

export interface AdventureSnakeBoardProps {
  player1Pos: number;
  player2Pos: number;
  activeTurn: 'p1' | 'p2';
  isMoving?: boolean;
  highlightTile?: number | null;
  highlightLadderId?: string | null;
  highlightSnakeId?: string | null;
  boardShake?: boolean;
  onTileClick?: (tileNumber: number) => void;
}

export const AdventureSnakeBoard: React.FC<AdventureSnakeBoardProps> = ({
  player1Pos,
  player2Pos,
  activeTurn,
  isMoving = false,
  highlightTile = null,
  highlightLadderId = null,
  highlightSnakeId = null,
  boardShake = false,
  onTileClick,
}) => {
  // Generate 100 individual tile objects with full coordinates and metadata
  const tiles: TileData[] = useMemo(() => {
    const list: TileData[] = [];
    for (let r = 0; r < 10; r++) {
      const rowFromBottom = 9 - r;
      const isRowEven = rowFromBottom % 2 === 0;
      for (let c = 0; c < 10; c++) {
        const tileNum = isRowEven
          ? rowFromBottom * 10 + c + 1
          : rowFromBottom * 10 + (9 - c) + 1;

        const ladder = LADDER_MAP[tileNum];
        const snake = SNAKE_MAP[tileNum];

        list.push({
          number: tileNum,
          row: r,
          col: c,
          xPercent: c * 10 + 5,
          yPercent: r * 10 + 5,
          stoneType:
            tileNum === 100
              ? 'gold_altar'
              : tileNum === 1
              ? 'start_portal'
              : (r + c) % 2 === 0
              ? 'muted_olive'
              : 'light_beige',
          ladderDest: ladder?.dest,
          snakeDest: snake?.dest,
        });
      }
    }
    return list;
  }, []);

  const hasCoOccupant = player1Pos === player2Pos;

  return (
    <motion.div
      id="adventure-snake-board"
      animate={
        boardShake
          ? {
              x: [0, -8, 8, -6, 6, -3, 3, 0],
              y: [0, 5, -5, 4, -4, 2, -2, 0],
            }
          : { x: 0, y: 0 }
      }
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="relative w-full aspect-square max-w-[540px] mx-auto select-none rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-[#1e1913] shadow-[0_25px_70px_rgba(0,0,0,0.95)] border-2 border-[#382d20]"
    >
      {/* 1. ANTIQUE ORNATE GILDED FILIGREE BORDER FRAME (INSPIRED BY SCREENSHOT) */}
      <div className="absolute inset-1 sm:inset-1.5 rounded-lg pointer-events-none z-20 border-[3px] sm:border-4 border-[#78613d] shadow-[inset_0_1px_2px_rgba(255,230,160,0.5),0_1px_4px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Repeating antique gold damask / scrollwork filigree texture band */}
        <div 
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(218,185,115,0.4) 0%, rgba(95,73,38,0.7) 100%), repeating-linear-gradient(45deg, rgba(255,235,170,0.15) 0px, rgba(255,235,170,0.15) 2px, transparent 2px, transparent 6px), repeating-linear-gradient(-45deg, rgba(120,95,50,0.25) 0px, rgba(120,95,50,0.25) 2px, transparent 2px, transparent 6px)`,
            backgroundSize: '100% 100%, 8px 8px, 8px 8px',
          }}
        />
        {/* Inner gold hairline rim */}
        <div className="absolute inset-0.5 border border-[#dfc68b]/70 rounded-[4px] pointer-events-none" />
      </div>

      {/* Ornate Brass Corner Inlays */}
      <div className="absolute top-2 left-2 w-4 h-4 sm:w-5 sm:h-5 border-t-2 border-l-2 border-[#fef08a] rounded-tl pointer-events-none z-30 opacity-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
      <div className="absolute top-2 right-2 w-4 h-4 sm:w-5 sm:h-5 border-t-2 border-r-2 border-[#fef08a] rounded-tr pointer-events-none z-30 opacity-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
      <div className="absolute bottom-2 left-2 w-4 h-4 sm:w-5 sm:h-5 border-b-2 border-l-2 border-[#fef08a] rounded-bl pointer-events-none z-30 opacity-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
      <div className="absolute bottom-2 right-2 w-4 h-4 sm:w-5 sm:h-5 border-b-2 border-r-2 border-[#fef08a] rounded-br pointer-events-none z-30 opacity-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />

      {/* 2. MASTER RECESSED 10x10 TILES CONTAINER */}
      <div className="relative w-full h-full rounded sm:rounded-md overflow-hidden shadow-[inset_0_2px_12px_rgba(0,0,0,0.75)] border border-[#443625] bg-[#A79E7B]">
        {/* 10x10 SEAMLESS TILES GRID (MUTED OLIVE GREEN #A79E7B & LIGHT BEIGE #DCCBA7) */}
        <div className="relative w-full h-full grid grid-cols-10 grid-rows-10 gap-0 z-10">
          {tiles.map((tile) => (
            <AdventureTile
              key={tile.number}
              tile={tile}
              isHighlighted={highlightTile === tile.number}
              onClick={() => onTileClick?.(tile.number)}
            />
          ))}
        </div>

        {/* 3. REALISTIC PROCEDURAL STAIRS & SUSPENSION LADDERS OVERLAY */}
        <RealisticStairs highlightId={highlightLadderId} />

        {/* 4. REALISTIC LIVING SERPENTS & PIT TRAPS OVERLAY */}
        <RealisticSnakes highlightId={highlightSnakeId} />

        {/* 5. SEPARATE 3D ADVENTURER PAWNS LAYER */}
        <AdventurePawn3D
          player="p1"
          position={player1Pos}
          isActiveTurn={activeTurn === 'p1'}
          isMoving={isMoving}
          hasCoOccupant={hasCoOccupant}
        />
        <AdventurePawn3D
          player="p2"
          position={player2Pos}
          isActiveTurn={activeTurn === 'p2'}
          isMoving={isMoving}
          hasCoOccupant={hasCoOccupant}
        />
      </div>
    </motion.div>
  );
};
