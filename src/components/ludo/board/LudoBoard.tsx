import React from 'react';
import { motion } from 'motion/react';
import { PlayerColor, Pawn } from '../../../types/game';
import { getPawnGridCoord, isSafeCell, BOARD_GRID_SIZE } from '../../../game/boardGeometry';
import { LudoPawn } from '../pawns/LudoPawn';
import { AngelFlightOverlay, AngelFlightData } from '../effects/AngelFlightOverlay';

interface LudoBoardProps {
  pawns: Pawn[];
  currentTurn: PlayerColor;
  selectedPawnId: string | null;
  movablePawnIds: string[];
  bouncingCellKey?: string | null;
  steppingPawnId?: string | null;
  activeAngelFlight?: AngelFlightData | null;
  onAngelFlightComplete?: (flightId: string) => void;
  onPawnClick: (pawn: Pawn) => void;
  activeColors?: PlayerColor[];
}

export const LudoBoard: React.FC<LudoBoardProps> = ({
  pawns,
  selectedPawnId,
  movablePawnIds,
  bouncingCellKey,
  steppingPawnId,
  activeAngelFlight,
  onAngelFlightComplete,
  onPawnClick,
  activeColors = ['blue', 'red', 'green', 'yellow'],
}) => {
  // Render individual grid cell
  const renderCell = (x: number, y: number) => {
    // 1. Home Bases (6x6 Corners)
    if (x < 6 && y < 6) return null;
    if (x > 8 && y < 6) return null;
    if (x > 8 && y > 8) return null;
    if (x < 6 && y > 8) return null;

    // 2. Center Goal (3x3 Center)
    if (x >= 6 && x <= 8 && y >= 6 && y <= 8) return null;

    const cellKey = `${x}-${y}`;
    const isBouncing = bouncingCellKey === cellKey;

    // 3. Colored Home Stretch Stems
    let cellBg = 'bg-[#fcfaf7]';
    let borderColor = 'border-[#d4ceca]';

    // Stem Colors matching screenshot
    if (y === 7 && x >= 1 && x <= 5) {
      cellBg = 'bg-[#38bdf8]'; // Blue Stem
      borderColor = 'border-[#0284c7]';
    } else if (x === 7 && y >= 1 && y <= 5) {
      cellBg = 'bg-[#ff6b81]'; // Red/Pink Stem
      borderColor = 'border-[#e11d48]';
    } else if (y === 7 && x >= 9 && x <= 13) {
      cellBg = 'bg-[#22c55e]'; // Green Stem
      borderColor = 'border-[#15803d]';
    } else if (x === 7 && y >= 9 && y <= 13) {
      cellBg = 'bg-[#fb923c]'; // Orange/Yellow Stem
      borderColor = 'border-[#c2410c]';
    }

    // Start Cells with Hazard Stripes
    const isBlueStart = x === 1 && y === 6;
    const isRedStart = x === 8 && y === 1;
    const isGreenStart = x === 13 && y === 8;
    const isYellowStart = x === 6 && y === 13;

    const isHazardCell = isBlueStart || isRedStart || isGreenStart || isYellowStart;

    if (isBlueStart) {
      cellBg = 'bg-[#0284c7]';
      borderColor = 'border-[#0369a1]';
    } else if (isRedStart) {
      cellBg = 'bg-[#e11d48]';
      borderColor = 'border-[#be123c]';
    } else if (isGreenStart) {
      cellBg = 'bg-[#15803d]';
      borderColor = 'border-[#166534]';
    } else if (isYellowStart) {
      cellBg = 'bg-[#ea580c]';
      borderColor = 'border-[#c2410c]';
    }

    const isSafe = isSafeCell({ x, y });

    return (
      <motion.div
        key={`cell-${x}-${y}`}
        animate={
          isBouncing
            ? {
                y: [0, -8, -1, -4, 0],
                scaleX: [1, 1.28, 0.82, 1.12, 0.95, 1],
                scaleY: [1, 0.72, 1.28, 0.88, 1.05, 1],
                boxShadow: [
                  'inset 0 1px 2px rgba(255,255,255,0.7), 0 2px 4px rgba(0,0,0,0.15)',
                  'inset 0 2px 4px rgba(255,255,255,0.9), 0 14px 22px rgba(0,0,0,0.45)',
                  'inset 0 1px 2px rgba(255,255,255,0.7), 0 4px 8px rgba(0,0,0,0.25)',
                  'inset 0 1px 2px rgba(255,255,255,0.7), 0 2px 4px rgba(0,0,0,0.15)',
                ],
                zIndex: 25,
              }
            : { y: 0, scaleX: 1, scaleY: 1, zIndex: 1 }
        }
        transition={{
          duration: 0.45,
          ease: [0.34, 1.56, 0.64, 1], // Jelly elastic spring bounce
        }}
        className={`relative w-full h-full border ${borderColor} ${cellBg} flex items-center justify-center overflow-visible rounded-[4px] sm:rounded-[5px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),0_1px_2px_rgba(0,0,0,0.12)]`}
        style={{
          gridColumnStart: x + 1,
          gridRowStart: y + 1,
        }}
      >
        {/* Jelly Splash Impact Ring */}
        {isBouncing && (
          <motion.div
            initial={{ scale: 0.2, opacity: 1 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute inset-[-4px] rounded-xl border-3 border-amber-300 bg-amber-300/30 pointer-events-none z-30"
          />
        )}

        {/* Hazard Stripe Tile Overlay */}
        {isHazardCell && (
          <div
            className="absolute inset-0 z-0 opacity-80 rounded-sm overflow-hidden"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, #fbbf24, #fbbf24 6px, #1e293b 6px, #1e293b 12px)',
            }}
          />
        )}

        {/* Shield Icon for Safe Tiles (Non-Start) */}
        {isSafe && !isHazardCell && (
          <div className="z-10 opacity-70 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-500 fill-slate-300">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4z" />
            </svg>
          </div>
        )}
      </motion.div>
    );
  };

  // Group pawns by location to offset stacked pawns
  const pawnsByCoord: Record<string, Pawn[]> = {};
  pawns.forEach((p) => {
    const coord = getPawnGridCoord(p.color, p.pawnIndex, p.pathStep);
    const key = `${coord.x.toFixed(1)}-${coord.y.toFixed(1)}`;
    if (!pawnsByCoord[key]) pawnsByCoord[key] = [];
    pawnsByCoord[key].push(p);
  });

  return (
    <div className="relative w-full aspect-square max-w-[700px] sm:max-w-[780px] md:max-w-[840px] mx-auto p-0.5 sm:p-1 select-none">
      {/* Outer Ceramic/Lavender Board Frame */}
      <div
        className="relative w-full h-full rounded-[2rem] sm:rounded-[2.5rem] p-1 sm:p-2 shadow-[0_22px_45px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #e0e7ff 0%, #c7d2fe 40%, #93c5fd 100%)',
          border: '4px solid #f1f5f9',
          boxShadow:
            '0 24px 50px rgba(0,0,0,0.55), inset 0 4px 8px rgba(255,255,255,0.95), inset 0 -6px 12px rgba(71,85,105,0.4)',
        }}
      >
        {/* Board Surface Grid Container with Cell Gaps */}
        <div
          className="relative w-full h-full rounded-[1.4rem] sm:rounded-[1.8rem] bg-[#cbd5e1] grid grid-cols-15 grid-rows-15 p-[1.5px] sm:p-[2px] gap-[1.5px] sm:gap-[2px] border-2 sm:border-3 border-[#94a3b8] overflow-hidden shadow-2xl"
          style={{
            gridTemplateColumns: `repeat(${BOARD_GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${BOARD_GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {/* 1. Render Grid Cells */}
          {Array.from({ length: 15 }).map((_, r) =>
            Array.from({ length: 15 }).map((_, c) => renderCell(c, r))
          )}

          {/* 2. TOP-LEFT RESORT CORNER (BLUE BASE) */}
          <div
            className="col-span-6 row-span-6 relative overflow-hidden bg-[#e0f2fe] border-b-2 border-r-2 border-[#bae6fd]"
            style={{ gridColumn: '1 / span 6', gridRow: '1 / span 6' }}
          >
            {/* Sandy resort background */}
            <div className="absolute inset-0 bg-[#fde68a] opacity-60" />
            
            {/* Resort Decors: Swimming Pool, Burj Tower, Palm Trees */}
            <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {/* Turquoise Pool */}
              <polygon points="120,30 180,30 160,80 100,70" fill="#38bdf8" stroke="#ffffff" strokeWidth="3" />
              <polygon points="125,35 175,35 158,75 105,66" fill="#7dd3fc" />
              {/* Pool Lounge chairs */}
              <rect x="135" y="42" width="12" height="18" rx="2" fill="#fb923c" />
              <rect x="152" y="42" width="12" height="18" rx="2" fill="#fb923c" />

              {/* 3D Burj Al Arab Tower Landmark */}
              <g transform="translate(30, 20) scale(0.7)">
                {/* Tower shadow */}
                <ellipse cx="40" cy="90" rx="30" ry="10" fill="#000000" opacity="0.2" />
                {/* Main Curved Sail Tower */}
                <path d="M 20 85 C 20 40, 45 5, 75 10 C 50 25, 40 60, 45 85 Z" fill="#ffffff" stroke="#0284c7" strokeWidth="3" />
                <path d="M 32 85 C 32 50, 48 25, 68 20 C 52 32, 45 60, 45 85 Z" fill="#38bdf8" />
                {/* Cross structural struts */}
                <line x1="26" y1="65" x2="42" y2="65" stroke="#0284c7" strokeWidth="2" />
                <line x1="28" y1="48" x2="48" y2="48" stroke="#0284c7" strokeWidth="2" />
                {/* Helipad Ring */}
                <ellipse cx="50" cy="30" rx="12" ry="4" fill="#0284c7" />
                <ellipse cx="50" cy="30" rx="9" ry="3" fill="#ffffff" />
              </g>

              {/* 3D Palm Trees */}
              <g transform="translate(160, 110) scale(0.6)">
                <path d="M 20 50 Q 25 25 30 10" stroke="#78350f" strokeWidth="5" strokeLinecap="round" fill="none" />
                {/* Leaves */}
                <path d="M 30 10 Q 10 -5 -10 10" stroke="#15803d" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M 30 10 Q 40 -10 60 0" stroke="#15803d" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M 30 10 Q 50 20 65 30" stroke="#15803d" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M 30 10 Q 15 30 0 40" stroke="#15803d" strokeWidth="4" strokeLinecap="round" fill="none" />
              </g>
            </svg>

            {/* Blue Home Base Slot Tray */}
            <div className={`absolute inset-4 sm:inset-5 z-10 rounded-2xl p-2.5 sm:p-3 border-2 shadow-xl flex items-center justify-center ${
              activeColors.includes('blue')
                ? 'bg-[#0284c7]/90 border-[#0369a1]'
                : 'bg-slate-800/60 border-slate-600/40 grayscale opacity-40'
            }`}>
              {activeColors.includes('blue') ? (
                <div className="w-full h-full bg-[#f0f9ff] rounded-xl p-2 border border-[#7dd3fc] grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3">
                  {[0, 1, 2, 3].map((slot) => (
                    <div
                      key={`blue-slot-${slot}`}
                      className="rounded-full bg-[#0284c7]/20 border-2 border-[#0284c7]/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] flex items-center justify-center"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <span>VACANT</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. TOP-RIGHT RESORT CORNER (RED BASE) */}
          <div
            className="col-span-6 row-span-6 relative overflow-hidden bg-[#ffe4e6] border-b-2 border-l-2 border-[#fecdd3]"
            style={{ gridColumn: '10 / span 6', gridRow: '1 / span 6' }}
          >
            <div className="absolute inset-0 bg-[#fde68a] opacity-60" />
            
            {/* Beach umbrella, hotel building, palm trees */}
            <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {/* Water Edge */}
              <path d="M 110 0 C 130 50, 160 100, 200 120 L 200 0 Z" fill="#38bdf8" opacity="0.8" />

              {/* Sun Umbrella */}
              <g transform="translate(130, 40) scale(0.7)">
                <path d="M 30 40 L 30 80" stroke="#78350f" strokeWidth="4" />
                <path d="M 0 40 C 0 15, 60 15, 60 40 Z" fill="#fb923c" stroke="#ea580c" strokeWidth="2" />
                <path d="M 15 40 C 15 20, 45 20, 45 40 Z" fill="#ffffff" />
              </g>

              {/* Sail Hotel Landmark */}
              <g transform="translate(150, 100) scale(0.65)">
                <path d="M 10 70 L 40 10 L 60 70 Z" fill="#ffffff" stroke="#e11d48" strokeWidth="3" />
                <path d="M 25 70 L 40 20 L 50 70 Z" fill="#ff6b81" />
              </g>

              {/* Palm Tree */}
              <g transform="translate(20, 30) scale(0.6)">
                <path d="M 20 50 Q 15 25 10 10" stroke="#78350f" strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d="M 10 10 Q -10 -5 -30 10" stroke="#15803d" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M 10 10 Q 20 -10 40 0" stroke="#15803d" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M 10 10 Q 30 20 45 30" stroke="#15803d" strokeWidth="4" strokeLinecap="round" fill="none" />
              </g>
            </svg>

            <div className={`absolute inset-4 sm:inset-5 z-10 rounded-2xl p-2.5 sm:p-3 border-2 shadow-xl flex items-center justify-center ${
              activeColors.includes('red')
                ? 'bg-[#e11d48]/90 border-[#be123c]'
                : 'bg-slate-800/60 border-slate-600/40 grayscale opacity-40'
            }`}>
              {activeColors.includes('red') ? (
                <div className="w-full h-full bg-[#fff1f2] rounded-xl p-2 border border-[#fecdd3] grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3">
                  {[0, 1, 2, 3].map((slot) => (
                    <div
                      key={`red-slot-${slot}`}
                      className="rounded-full bg-[#e11d48]/20 border-2 border-[#e11d48]/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] flex items-center justify-center"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <span>VACANT</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. BOTTOM-RIGHT RESORT CORNER (GREEN BASE) */}
          <div
            className="col-span-6 row-span-6 relative overflow-hidden bg-[#dcfce7] border-t-2 border-l-2 border-[#bbf7d0]"
            style={{ gridColumn: '10 / span 6', gridRow: '10 / span 6' }}
          >
            <div className="absolute inset-0 bg-[#fde68a] opacity-60" />

            {/* Bedouin Oasis Tent, Drums, Shisha, Palm Tree */}
            <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {/* Bedouin Tent Canopy */}
              <g transform="translate(110, 110) scale(0.7)">
                <polygon points="10,60 50,10 90,60" fill="#f97316" stroke="#c2410c" strokeWidth="2" />
                <polygon points="20,60 50,20 80,60" fill="#fde047" />
                <line x1="50" y1="10" x2="50" y2="65" stroke="#78350f" strokeWidth="3" />
              </g>

              {/* Oud / Drums Decors */}
              <g transform="translate(30, 120) scale(0.65)">
                <ellipse cx="30" cy="40" rx="15" ry="20" fill="#78350f" />
                <ellipse cx="30" cy="40" rx="10" ry="14" fill="#fbbf24" />
                <path d="M 30 20 L 30 -10" stroke="#78350f" strokeWidth="4" />
              </g>

              {/* Palm Tree */}
              <g transform="translate(160, 20) scale(0.6)">
                <path d="M 20 50 Q 25 25 30 10" stroke="#78350f" strokeWidth="5" fill="none" />
                <path d="M 30 10 Q 10 -5 -10 10" stroke="#15803d" strokeWidth="4" fill="none" />
                <path d="M 30 10 Q 50 20 65 30" stroke="#15803d" strokeWidth="4" fill="none" />
              </g>
            </svg>

            {/* Green Home Base Slot Tray */}
            <div className={`absolute inset-4 sm:inset-5 z-10 rounded-2xl p-2.5 sm:p-3 border-2 shadow-xl flex items-center justify-center ${
              activeColors.includes('green')
                ? 'bg-[#15803d]/90 border-[#166534]'
                : 'bg-slate-800/60 border-slate-600/40 grayscale opacity-40'
            }`}>
              {activeColors.includes('green') ? (
                <div className="w-full h-full bg-[#f0fdf4] rounded-xl p-2 border border-[#bbf7d0] grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3">
                  {[0, 1, 2, 3].map((slot) => (
                    <div
                      key={`green-slot-${slot}`}
                      className="rounded-full bg-[#15803d]/20 border-2 border-[#15803d]/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] flex items-center justify-center"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <span>VACANT</span>
                </div>
              )}
            </div>
          </div>

          {/* 5. BOTTOM-LEFT RESORT CORNER (YELLOW/ORANGE BASE) */}
          <div
            className="col-span-6 row-span-6 relative overflow-hidden bg-[#ffedd5] border-t-2 border-r-2 border-[#fed7aa]"
            style={{ gridColumn: '1 / span 6', gridRow: '10 / span 6' }}
          >
            <div className="absolute inset-0 bg-[#fde68a] opacity-60" />

            {/* Golden Souk Arch & Lounge furniture */}
            <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {/* Souk Entrance Archway */}
              <g transform="translate(20, 100) scale(0.7)">
                <rect x="10" y="20" width="50" height="50" fill="#f97316" rx="4" />
                <path d="M 20 70 L 20 40 Q 35 20 50 40 L 50 70 Z" fill="#fde047" />
                <polygon points="35,5 10,20 60,20" fill="#ea580c" />
              </g>

              {/* Seating lounge */}
              <g transform="translate(110, 120) scale(0.65)">
                <rect x="0" y="20" width="40" height="20" rx="4" fill="#ea580c" />
                <rect x="10" y="10" width="20" height="15" rx="3" fill="#fbbf24" />
              </g>

              {/* Palm Tree */}
              <g transform="translate(20, 15) scale(0.6)">
                <path d="M 20 50 Q 15 25 10 10" stroke="#78350f" strokeWidth="5" fill="none" />
                <path d="M 10 10 Q -10 -5 -30 10" stroke="#15803d" strokeWidth="4" fill="none" />
                <path d="M 10 10 Q 30 20 45 30" stroke="#15803d" strokeWidth="4" fill="none" />
              </g>
            </svg>

            {/* Yellow Home Base Slot Tray */}
            <div className={`absolute inset-4 sm:inset-5 z-10 rounded-2xl p-2.5 sm:p-3 border-2 shadow-xl flex items-center justify-center ${
              activeColors.includes('yellow')
                ? 'bg-[#ea580c]/90 border-[#c2410c]'
                : 'bg-slate-800/60 border-slate-600/40 grayscale opacity-40'
            }`}>
              {activeColors.includes('yellow') ? (
                <div className="w-full h-full bg-[#fff7ed] rounded-xl p-2 border border-[#fed7aa] grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3">
                  {[0, 1, 2, 3].map((slot) => (
                    <div
                      key={`yellow-slot-${slot}`}
                      className="rounded-full bg-[#ea580c]/20 border-2 border-[#ea580c]/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] flex items-center justify-center"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <span>VACANT</span>
                </div>
              )}
            </div>
          </div>

          {/* 6. CENTER GOAL AREA (3x3) WITH COLOR SECTORS AND DIRECTION ARROWS */}
          <div
            className="col-span-3 row-span-3 relative bg-[#f8fafc] overflow-hidden shadow-2xl border-2 border-[#94a3b8]"
            style={{ gridColumn: '7 / span 3', gridRow: '7 / span 3' }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Left Triangle (Blue) */}
              <polygon points="0,0 50,50 0,100" fill="#38bdf8" />
              {/* Top Triangle (Red) */}
              <polygon points="0,0 100,0 50,50" fill="#ff6b81" />
              {/* Right Triangle (Green) */}
              <polygon points="100,0 100,100 50,50" fill="#22c55e" />
              {/* Bottom Triangle (Yellow/Orange) */}
              <polygon points="0,100 100,100 50,50" fill="#fb923c" />

              {/* Center Divider lines */}
              <line x1="0" y1="0" x2="100" y2="100" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
              <line x1="100" y1="0" x2="0" y2="100" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
            </svg>
          </div>

          {/* Giant Directional Arrows on Stems */}
          {/* Top Red Arrow */}
          <div
            className="pointer-events-none z-10 flex items-center justify-center"
            style={{ gridColumn: '8', gridRow: '6' }}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full text-[#ff6b81] fill-[#ff6b81] drop-shadow">
              <path d="M12 21l-8-9h5V3h6v9h5z" />
            </svg>
          </div>
          {/* Bottom Orange Arrow */}
          <div
            className="pointer-events-none z-10 flex items-center justify-center"
            style={{ gridColumn: '8', gridRow: '10' }}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full text-[#fb923c] fill-[#fb923c] drop-shadow">
              <path d="M12 3l8 9h-5v9h-6v-9H4z" />
            </svg>
          </div>
          {/* Left Blue Arrow */}
          <div
            className="pointer-events-none z-10 flex items-center justify-center"
            style={{ gridColumn: '6', gridRow: '8' }}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full text-[#38bdf8] fill-[#38bdf8] drop-shadow">
              <path d="M21 12l-9 8v-5H3v-6h9V4z" />
            </svg>
          </div>
          {/* Right Green Arrow */}
          <div
            className="pointer-events-none z-10 flex items-center justify-center"
            style={{ gridColumn: '10', gridRow: '8' }}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full text-[#22c55e] fill-[#22c55e] drop-shadow">
              <path d="M3 12l9-8v5h9v6h-9v5z" />
            </svg>
          </div>

          {/* 7. PAWNS OVERLAY LAYER */}
          {pawns.map((pawn) => {
            const isUnderAngelFlight = activeAngelFlight && activeAngelFlight.pawn.id === pawn.id;
            if (isUnderAngelFlight) return null; // Rendered via AngelFlightOverlay above!

            const coord = getPawnGridCoord(pawn.color, pawn.pawnIndex, pawn.pathStep);
            const key = `${coord.x.toFixed(1)}-${coord.y.toFixed(1)}`;
            const stack = pawnsByCoord[key] || [pawn];
            const stackIndex = stack.findIndex((sp) => sp.id === pawn.id);

            const leftPct = (coord.x / 15) * 100;
            const topPct = (coord.y / 15) * 100;
            const cellSizePct = (1 / 15) * 100;

            const totalInStack = stack.length;
            let offsetX = 0;
            let offsetY = 0;
            if (totalInStack > 1) {
              if (totalInStack === 2) {
                offsetX = stackIndex === 0 ? -3.5 : 3.5;
                offsetY = stackIndex === 0 ? -3.5 : 3.5;
              } else if (totalInStack === 3) {
                if (stackIndex === 0) {
                  offsetX = -4;
                  offsetY = -4;
                } else if (stackIndex === 1) {
                  offsetX = 4;
                  offsetY = -4;
                } else {
                  offsetX = 0;
                  offsetY = 4;
                }
              } else {
                offsetX = stackIndex % 2 === 0 ? -4 : 4;
                offsetY = stackIndex < 2 ? -4 : 4;
              }
            }

            const isSelected = selectedPawnId === pawn.id;
            const isMovable = movablePawnIds.includes(pawn.id);

            return (
              <motion.div
                key={pawn.id}
                animate={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  x: offsetX,
                  y: offsetY,
                }}
                transition={{
                  duration: 0.6,
                  ease: [0.25, 0.1, 0.25, 1], // Smooth weighted arc movement
                }}
                className="absolute flex items-center justify-center z-30 pointer-events-auto overflow-visible"
                style={{
                  width: `${cellSizePct}%`,
                  height: `${cellSizePct}%`,
                }}
              >
                <div
                  className={`flex items-center justify-center shrink-0 overflow-visible transition-all duration-300 ${
                    totalInStack > 1 ? 'w-[125%] h-[125%]' : 'w-[160%] h-[160%]'
                  }`}
                  style={{
                    transform: 'translateY(-32%)',
                  }}
                >
                  <LudoPawn
                    id={pawn.id}
                    color={pawn.color}
                    pawnIndex={pawn.pawnIndex}
                    pathStep={pawn.pathStep}
                    isSelected={isSelected}
                    isMovable={isMovable}
                    isJumping={steppingPawnId === pawn.id}
                    onClick={() => onPawnClick(pawn)}
                  />
                </div>
              </motion.div>
            );
          })}

          {/* 8. ANGELIC FLIGHT OVERLAY LAYER (When a pawn is cut/captured) */}
          {activeAngelFlight && onAngelFlightComplete && (
            <AngelFlightOverlay
              flight={activeAngelFlight}
              onFlightComplete={onAngelFlightComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

