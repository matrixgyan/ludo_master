import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { DiceState, PlayerColor } from '../../../types/game';
import { SoundManager } from '../../../audio/soundManager';

interface LudoDiceProps {
  dice: DiceState;
  activeColor: PlayerColor;
  onRoll: () => void;
  disabled?: boolean;
  size?: 'compact' | 'normal';
  turnTimeLeft?: number;
  isTurn?: boolean;
}

const ACTIVE_BG_GRADIENTS: Record<PlayerColor, string> = {
  blue: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
  red: 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)',
  green: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
  yellow: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
};

// Exact 3D target angles (rotateX, rotateY) to present each face front to the camera
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },       // Front
  2: { x: 0, y: -90 },     // Right
  3: { x: -90, y: 0 },     // Top
  4: { x: 90, y: 0 },      // Bottom
  5: { x: 0, y: 90 },      // Left
  6: { x: 0, y: -180 },    // Back
};

export const LudoDice: React.FC<LudoDiceProps> = ({
  dice,
  activeColor,
  onRoll,
  disabled = false,
  size = 'compact',
  turnTimeLeft = 30,
  isTurn = false,
}) => {
  const [rotation, setRotation] = useState<{ x: number; y: number; z: number }>({
    x: 0,
    y: 0,
    z: 0,
  });
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const lastValRef = useRef<number>(dice.value || 6);

  const isCompact = size === 'compact';
  const cubeSize = isCompact ? 34 : 56;
  const translateZVal = cubeSize / 2;

  const rollToValue = (val: number) => {
    const target = FACE_ROTATIONS[val] || FACE_ROTATIONS[1];

    setRotation((prev) => {
      // Add 3 full 360-degree rolls on X and Y plus target offset
      const nextTurnsX = Math.ceil(prev.x / 360) + 3;
      const nextTurnsY = Math.ceil(prev.y / 360) + 3;
      const nextTurnsZ = Math.ceil(prev.z / 360) + 1;

      return {
        x: nextTurnsX * 360 + target.x,
        y: nextTurnsY * 360 + target.y,
        z: nextTurnsZ * 360,
      };
    });
  };

  const handleClick = () => {
    if (!isTurn || disabled || dice.isRolling || isAnimating || !dice.canRoll) return;

    setIsAnimating(true);
    SoundManager.play('dice-roll');

    // Trigger game logic roll
    onRoll();

    // Trigger 3D tumble physics animation
    const targetVal = dice.value || Math.floor(Math.random() * 6) + 1;
    rollToValue(targetVal);
  };

  // Reset animation state and sync last value ref when turn is not active
  useEffect(() => {
    if (!isTurn) {
      setIsAnimating(false);
      lastValRef.current = dice.value;
    }
  }, [isTurn, dice.value]);

  // Trigger 3D tumble ONLY for active player when dice value updates during their active turn
  useEffect(() => {
    if (!isTurn) return;
    if (dice.value && dice.value !== lastValRef.current) {
      lastValRef.current = dice.value;
      rollToValue(dice.value);
      setIsAnimating(true);
      SoundManager.play('dice-roll');
    }
  }, [dice.value, isTurn]);

  // Render 3D Pip Dots on each face
  const renderPips = (val: number) => {
    const darkDot = isCompact
      ? 'w-1.5 h-1.5 rounded-full bg-slate-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)] ring-[0.5px] ring-slate-800'
      : 'w-2.5 h-2.5 rounded-full bg-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] ring-1 ring-slate-800';
    const redCenterDot = isCompact
      ? 'w-2 h-2 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-sm ring-[0.5px] ring-red-300'
      : 'w-3.5 h-3.5 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-md ring-1 ring-red-300';
    const pad = isCompact ? 'p-1' : 'p-2.5';

    switch (val) {
      case 1:
        return (
          <div className={`w-full h-full flex items-center justify-center ${pad}`}>
            <div className={redCenterDot} />
          </div>
        );
      case 2:
        return (
          <div className={`w-full h-full flex justify-between ${pad}`}>
            <div className={darkDot} />
            <div className={`${darkDot} self-end`} />
          </div>
        );
      case 3:
        return (
          <div className={`w-full h-full flex justify-between ${pad}`}>
            <div className={darkDot} />
            <div className={`${redCenterDot} self-center`} />
            <div className={`${darkDot} self-end`} />
          </div>
        );
      case 4:
        return (
          <div className={`w-full h-full flex flex-col justify-between ${pad}`}>
            <div className="flex justify-between">
              <div className={darkDot} />
              <div className={darkDot} />
            </div>
            <div className="flex justify-between">
              <div className={darkDot} />
              <div className={darkDot} />
            </div>
          </div>
        );
      case 5:
        return (
          <div className={`w-full h-full flex flex-col justify-between ${pad}`}>
            <div className="flex justify-between">
              <div className={darkDot} />
              <div className={darkDot} />
            </div>
            <div className="flex justify-center">
              <div className={darkDot} />
            </div>
            <div className="flex justify-between">
              <div className={darkDot} />
              <div className={darkDot} />
            </div>
          </div>
        );
      case 6:
        return (
          <div className={`w-full h-full flex flex-col justify-between ${pad}`}>
            <div className="flex justify-between">
              <div className={darkDot} />
              <div className={darkDot} />
            </div>
            <div className="flex justify-between">
              <div className={darkDot} />
              <div className={darkDot} />
            </div>
            <div className="flex justify-between">
              <div className={darkDot} />
              <div className={darkDot} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const faceStyle = (transformStr: string): React.CSSProperties => ({
    position: 'absolute',
    width: `${cubeSize}px`,
    height: `${cubeSize}px`,
    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 55%, #e2e8f0 100%)',
    border: isCompact ? '1px solid #cbd5e1' : '1.5px solid #cbd5e1',
    borderRadius: isCompact ? '8px' : '12px',
    boxShadow: isCompact
      ? 'inset 0 0 4px rgba(0,0,0,0.12), inset 0 1px 2px rgba(255,255,255,0.9), 0 1.5px 3px rgba(0,0,0,0.18)'
      : 'inset 0 0 6px rgba(0,0,0,0.12), inset 0 2px 3px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.18)',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    transform: transformStr,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ perspective: isCompact ? '400px' : '600px' }}
    >
      {/* Square 30-Second Turn Timer Progress Bar around Active Dice */}
      {isTurn && (
        <div className="absolute inset-[-5px] sm:inset-[-6px] pointer-events-none z-30">
          <svg className="w-full h-full overflow-visible">
            {/* Dark Track Outer Border */}
            <rect
              x="2"
              y="2"
              width="calc(100% - 4px)"
              height="calc(100% - 4px)"
              rx="14"
              fill="none"
              stroke="rgba(0, 0, 0, 0.45)"
              strokeWidth="4"
            />
            {/* Animated 30s Green -> Red Progress Line */}
            <rect
              x="2"
              y="2"
              width="calc(100% - 4px)"
              height="calc(100% - 4px)"
              rx="14"
              fill="none"
              stroke={turnTimeLeft <= 10 ? '#ef4444' : '#22c55e'}
              strokeWidth="4"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={Math.max(0, Math.min(100, (1 - turnTimeLeft / 30) * 100))}
              className="transition-all duration-1000 ease-linear"
              style={{
                filter: turnTimeLeft <= 10
                  ? 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.9))'
                  : 'drop-shadow(0 0 5px rgba(34, 197, 94, 0.8))',
              }}
            />
          </svg>

          {/* Turn Timer Countdown Badge */}
          <div
            className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-1 py-0.2 rounded text-[9px] font-black leading-tight tracking-tight shadow-md border ${
              turnTimeLeft <= 10
                ? 'bg-red-600 text-white border-red-300 animate-pulse shadow-red-500/50'
                : 'bg-emerald-600 text-white border-emerald-300 shadow-emerald-500/50'
            }`}
          >
            {turnTimeLeft}s
          </div>
        </div>
      )}

      {/* 3D Dice Button Plate */}
      <motion.button
        whileHover={dice.canRoll && !disabled && isTurn ? { scale: 1.08, y: -2 } : {}}
        whileTap={dice.canRoll && !disabled && isTurn ? { scale: 0.92, y: 2 } : {}}
        onClick={handleClick}
        disabled={disabled || dice.isRolling || isAnimating || !dice.canRoll || !isTurn}
        className={`relative ${
          isCompact
            ? 'w-12 h-12 sm:w-13 sm:h-13 rounded-xl p-1'
            : 'w-22 h-22 sm:w-24 sm:h-24 rounded-2xl p-2'
        } flex items-center justify-center transition-all duration-200 ${
          isTurn
            ? dice.canRoll && !disabled
              ? 'cursor-pointer opacity-100 filter-none shadow-xl ring-2 ring-amber-300 active:scale-95'
              : 'cursor-default opacity-100 filter-none shadow-md ring-2 ring-white/60'
            : 'cursor-not-allowed opacity-20 grayscale-[90%] pointer-events-none'
        }`}
        style={{
          background: isTurn
            ? ACTIVE_BG_GRADIENTS[activeColor]
            : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          boxShadow: isTurn
            ? `0 6px 14px rgba(0,0,0,0.5), inset 0 1px 3px rgba(255,255,255,0.6)`
            : `none`,
          border: isTurn
            ? '2px solid #ffffff'
            : '2px solid rgba(255, 255, 255, 0.1)',
          perspective: isCompact ? '350px' : '500px',
        }}
      >
        {/* Dynamic Floor Shadow beneath 3D Cube */}
        <motion.div
          animate={
            isAnimating
              ? { scale: [1, 0.4, 0.85, 1.1, 1], opacity: [0.6, 0.15, 0.4, 0.7, 0.6] }
              : { scale: 1, opacity: 0.6 }
          }
          transition={{ duration: 0.75, ease: 'easeInOut' }}
          className={`absolute ${
            isCompact ? 'bottom-1.5 w-8 h-2' : 'bottom-2.5 w-12 h-3'
          } rounded-full bg-black/70 blur-sm pointer-events-none`}
        />

        {/* Real 3D Physical Cube */}
        <motion.div
          animate={{
            rotateX: rotation.x,
            rotateY: rotation.y,
            rotateZ: rotation.z,
            y: isAnimating ? (isCompact ? [0, -18, 2, -5, 0] : [0, -30, 4, -8, 0]) : 0,
            scale: isAnimating ? [1, 1.12, 0.92, 1.05, 1] : 1,
          }}
          transition={{
            duration: 0.75,
            ease: [0.22, 1, 0.36, 1],
          }}
          onAnimationComplete={() => {
            if (isAnimating) {
              setIsAnimating(false);
              SoundManager.play('dice-land');
            }
          }}
          style={{
            width: `${cubeSize}px`,
            height: `${cubeSize}px`,
            transformStyle: 'preserve-3d',
            position: 'relative',
          }}
        >
          {/* Face 1: Front (Value 1) */}
          <div style={faceStyle(`rotateY(0deg) translateZ(${translateZVal}px)`)}>
            {renderPips(1)}
          </div>

          {/* Face 2: Right (Value 2) */}
          <div style={faceStyle(`rotateY(90deg) translateZ(${translateZVal}px)`)}>
            {renderPips(2)}
          </div>

          {/* Face 3: Top (Value 3) */}
          <div style={faceStyle(`rotateX(90deg) translateZ(${translateZVal}px)`)}>
            {renderPips(3)}
          </div>

          {/* Face 4: Bottom (Value 4) */}
          <div style={faceStyle(`rotateX(-90deg) translateZ(${translateZVal}px)`)}>
            {renderPips(4)}
          </div>

          {/* Face 5: Left (Value 5) */}
          <div style={faceStyle(`rotateY(-90deg) translateZ(${translateZVal}px)`)}>
            {renderPips(5)}
          </div>

          {/* Face 6: Back (Value 6) */}
          <div style={faceStyle(`rotateY(180deg) translateZ(${translateZVal}px)`)}>
            {renderPips(6)}
          </div>
        </motion.div>
      </motion.button>
    </div>
  );
};
