import React from 'react';
import { motion } from 'motion/react';
import { User, Info } from 'lucide-react';
import { SnakeLudo3DDice } from './SnakeLudo3DDice';

export interface SnakePlayerSeatProps {
  playerId: 'p1' | 'p2' | 'p3' | 'p4';
  name: string;
  avatar?: string;
  position: number;
  isActiveTurn: boolean;
  isRolling: boolean;
  hasRolled?: boolean;
  diceValue: number;
  disabled: boolean;
  turnTimeLeft: number;
  totalTurnTime: number;
  strikes: number; // 0, 1, 2, 3
  consecutiveSixes: number; // 0, 1, 2
  onRoll: () => void;
  isOpponent?: boolean;
  compact?: boolean;
}

export const SnakePlayerSeat: React.FC<SnakePlayerSeatProps> = ({
  playerId,
  name,
  avatar,
  position,
  isActiveTurn,
  isRolling,
  hasRolled = false,
  diceValue,
  disabled,
  turnTimeLeft,
  totalTurnTime,
  strikes,
  consecutiveSixes,
  onRoll,
  isOpponent = false,
  compact = false,
}) => {
  const isP1 = playerId === 'p1';
  const displayName = isP1 ? 'You' : name || 'Player';

  // In Snake Ludo, score corresponds to progress on board (starts at 0 on Tile 1)
  const score = Math.max(0, position - 1);

  // Score colors strictly matching Ludo archetypes (Yellow for P1 "You", Red for P2, Blue for P3, Green for P4)
  const scoreColorMap: Record<'p1' | 'p2' | 'p3' | 'p4', string> = {
    p1: 'text-[#facc15]', // Yellow
    p2: 'text-[#ef4444]', // Red
    p3: 'text-[#3b82f6]', // Blue
    p4: 'text-[#10b981]', // Green
  };

  // Mover ordinal matching the screenshot: "1st Mover", "2nd Mover", "3rd Mover", "4th Mover"
  const moverOrdinalMap: Record<'p1' | 'p2' | 'p3' | 'p4', string> = {
    p1: '1st',
    p2: '2nd',
    p3: '3rd',
    p4: '4th',
  };
  const moverOrdinal = moverOrdinalMap[playerId] || '1st';

  // Active circular countdown progress ring (Red arc matching Clash6500 in screenshot)
  const progressRatio = Math.max(0, Math.min(1, turnTimeLeft / totalTurnTime));
  const svgRadius = compact ? 25 : 28;
  const svgCircumference = 2 * Math.PI * svgRadius;
  const strokeDashoffset = svgCircumference * (1 - progressRatio);

  const isInteractiveRoll = isActiveTurn && isP1 && !disabled && !isRolling;

  // Exact dice size: 48px for standard, 42px for compact
  // This size remains strictly constant during idle, rolling, and after landing
  const dicePixelSize = compact ? 42 : 48;

  return (
    <div
      id={`snake-player-column-${playerId}`}
      className={`relative flex flex-col items-center select-none transition-all duration-300 min-w-0 ${
        compact ? 'max-w-[78px] sm:max-w-[92px]' : 'max-w-[92px] sm:max-w-[108px]'
      }`}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. ROUNDED CIRCULAR PROFILE WITH COUNTDOWN TIMER RING         */}
      {/* ------------------------------------------------------------- */}
      <div className="relative flex items-center justify-center">
        {/* Active Red Circular Timer Ring (As seen on Clash6500 in screenshot) */}
        {isActiveTurn && (
          <svg
            className={`absolute -rotate-90 pointer-events-none z-10 ${
              compact ? 'w-[58px] h-[58px] sm:w-[68px] sm:h-[68px]' : 'w-[66px] h-[66px] sm:w-[74px] sm:h-[74px]'
            }`}
            viewBox="0 0 64 64"
          >
            {/* Subtle background track */}
            <circle
              cx="32"
              cy="32"
              r={svgRadius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="2.5"
            />
            {/* Vibrant Red countdown arc */}
            <circle
              cx="32"
              cy="32"
              r={svgRadius}
              fill="none"
              stroke="#ef4444"
              strokeWidth="3.5"
              strokeDasharray={svgCircumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-200"
            />
          </svg>
        )}

        {/* Circular Avatar Frame */}
        <div
          className={`rounded-full p-0.5 transition-all duration-300 ${
            compact ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-14 h-14 sm:w-16 sm:h-16'
          } ${
            isActiveTurn
              ? 'ring-2 ring-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
              : 'ring-2 ring-[#132560]'
          }`}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-[#0a1642] flex items-center justify-center shadow-inner">
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-blue-200/70" />
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. PLAYER NAME PILL WITH INFO (i) ICON                         */}
      {/* ------------------------------------------------------------- */}
      <div className="mt-1.5 flex items-center justify-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-0.5 rounded-full bg-[#12225e] border border-blue-900/50 shadow-sm max-w-[85px] sm:max-w-[100px]">
        <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
          {displayName}
        </span>
        <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-300 stroke-[2.2] shrink-0" />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BIG BOLD SCORE SECTION                                     */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`text-2xl sm:text-3xl font-black tracking-tight mt-1 leading-none ${
          scoreColorMap[playerId]
        }`}
      >
        {score}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. DICE / MOVER SECTION (SPEECH-BUBBLE POINTER CARD)          */}
      {/* ------------------------------------------------------------- */}
      <div className="relative mt-2 flex flex-col items-center">
        {/* Upward Triangle Pointer Arrow pointing directly to the score */}
        <div
          className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 z-20 transition-all duration-300 ${
            isActiveTurn
              ? 'bg-[#0c184d] border-t-2 border-l-2 border-red-500 shadow-[-2px_-2px_8px_rgba(239,68,68,0.7)]'
              : 'bg-[#0c184d] border-t border-l border-blue-900/50'
          }`}
        />

        {/* The Pointer Card */}
        <motion.div
          id={`snake-player-card-${playerId}`}
          whileHover={isInteractiveRoll ? { scale: 1.04 } : {}}
          whileTap={isInteractiveRoll ? { scale: 0.96 } : {}}
          onClick={() => {
            if (isInteractiveRoll) {
              onRoll();
            }
          }}
          className={`relative rounded-2xl flex items-center justify-center transition-all duration-300 overflow-visible ${
            compact
              ? 'w-[64px] h-[64px] sm:w-[72px] sm:h-[72px]'
              : 'w-[74px] h-[74px] sm:w-[82px] sm:h-[82px]'
          } ${
            isActiveTurn
              ? 'bg-[#0c184d] border-2 border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.85)] z-10'
              : 'bg-[#0c184d] border border-blue-900/50'
          } ${isInteractiveRoll ? 'cursor-pointer' : ''}`}
        >
          {isActiveTurn ? (
            /* ACTIVE TURN: CONTINUOUS 3D CERAMIC DICE (CONSISTENT SIZE AT ALL TIMES) */
            <div className="relative flex items-center justify-center">
              <SnakeLudo3DDice
                value={diceValue}
                isRolling={isRolling}
                disabled={disabled}
                isActiveTurn={isActiveTurn}
                playerTheme={playerId}
                onRoll={onRoll}
                size={dicePixelSize}
                showCrown={!hasRolled && !isRolling}
              />

              {/* Floating "Roll" Prompt Tooltip for Human Player */}
              {isInteractiveRoll && (
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-3.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-amber-600 border border-yellow-300 text-[8px] sm:text-[9px] font-black text-white shadow-lg uppercase tracking-wider whitespace-nowrap pointer-events-none z-30"
                >
                  Roll
                </motion.div>
              )}
            </div>
          ) : (
            /* INACTIVE STATE: "1st Mover", "2nd Mover", "3rd Mover", "4th Mover" */
            <div className="flex flex-col items-center justify-center text-center leading-tight select-none pointer-events-none">
              <span className="text-xs sm:text-sm font-bold text-blue-100">
                {moverOrdinal}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-blue-300/80">
                Mover
              </span>
            </div>
          )}
        </motion.div>

        {/* Missed Turn Strikes Indicator Dots */}
        {strikes > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {[0, 1, 2].map((idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${
                  idx < strikes ? 'bg-rose-500 shadow-[0_0_4px_#ef4444]' : 'bg-blue-900/60'
                }`}
                title={`Strike ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
