import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { SoundManager } from '../../../audio/soundManager';

export interface SnakeLudo3DDiceProps {
  value: number;
  isRolling: boolean;
  disabled?: boolean;
  currentTurn?: string;
  color?: 'red' | 'green' | 'yellow' | 'blue';
  isActiveTurn?: boolean;
  isHuman?: boolean;
  size?: 'sm' | 'md' | 'normal';
  onRoll?: () => void;
}

// 3D rotation angles to face the camera for each dice value
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },       // Front
  2: { x: 0, y: -90 },     // Right
  3: { x: -90, y: 0 },     // Top
  4: { x: 90, y: 0 },      // Bottom
  5: { x: 0, y: 90 },      // Left
  6: { x: 0, y: -180 },    // Back
};

export const SnakeLudo3DDice: React.FC<SnakeLudo3DDiceProps> = ({
  value,
  isRolling,
  disabled = false,
  currentTurn,
  color = 'red',
  isActiveTurn = false,
  isHuman = false,
  size = 'normal',
  onRoll,
}) => {
  const [rotation, setRotation] = useState<{ x: number; y: number; z: number }>({
    x: 0,
    y: 0,
    z: 0,
  });
  const [isTumbling, setIsTumbling] = useState(false);

  // Slightly increased normal, clear dice dimensions (comfortable in multi-player layouts)
  const cubeSize = size === 'sm' ? 38 : size === 'md' ? 42 : 46; // px
  const translateZ = cubeSize / 2;

  const triggerTumble = (targetVal: number) => {
    const target = FACE_ROTATIONS[targetVal] || FACE_ROTATIONS[1];

    setRotation((prev) => {
      // Add 2 to 3 full 360-degree rolls plus target offset
      const nextTurnsX = Math.ceil(prev.x / 360) + 3;
      const nextTurnsY = Math.ceil(prev.y / 360) + 2;
      const nextTurnsZ = Math.ceil(prev.z / 360) + 1;

      return {
        x: nextTurnsX * 360 + target.x,
        y: nextTurnsY * 360 + target.y,
        z: nextTurnsZ * 360,
      };
    });
    setIsTumbling(true);
  };

  useEffect(() => {
    if (isRolling) {
      triggerTumble(value);
    }
  }, [isRolling, value]);

  const handleClick = () => {
    if (disabled || isRolling || isTumbling || !isActiveTurn || !isHuman) return;
    onRoll?.();
  };

  // Render authentic inlaid pips with optimal dot size for normal cube
  const renderPips = (val: number) => {
    const dotSize = cubeSize <= 38 ? 'w-2 h-2' : 'w-2.5 h-2.5';
    const bigDotSize = cubeSize <= 38 ? 'w-3 h-3' : 'w-3.5 h-3.5';
    const darkDot = `${dotSize} rounded-full bg-[#241e17] shadow-[inset_0_1px_1px_rgba(0,0,0,0.85)] ring-[0.5px] ring-[#3d3324]`;
    const redDot = `${bigDotSize} rounded-full bg-gradient-to-br from-[#dc2626] to-[#7f1d1d] shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.7)] ring-[0.5px] ring-[#fca5a5]`;
    const redSmallDot = `${dotSize} rounded-full bg-gradient-to-br from-[#dc2626] to-[#7f1d1d] shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.7)] ring-[0.5px] ring-[#fca5a5]`;
    const pad = cubeSize <= 38 ? 'p-1.5' : 'p-2';

    switch (val) {
      case 1:
        return (
          <div className={`w-full h-full flex items-center justify-center ${pad}`}>
            <div className={redDot} />
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
            <div className={`${redSmallDot} self-center`} />
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
    background: 'linear-gradient(135deg, #ffffff 0%, #f7f3e8 45%, #DCCBA7 100%)',
    border: '1px solid #9c8c6f',
    borderRadius: '7px',
    boxShadow:
      'inset 0 0 3px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.95), 0 2px 4px rgba(0,0,0,0.25)',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    transform: transformStr,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
  });

  const isInteractive = !disabled && !isRolling && !isTumbling && isActiveTurn && isHuman;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ perspective: '500px' }}
    >
      {/* Sleek Normal-Sized Interactive Dice Button (NO big border!) */}
      <motion.button
        type="button"
        role="button"
        tabIndex={0}
        aria-label="Roll Dice"
        whileHover={isInteractive ? { scale: 1.08, y: -2 } : {}}
        whileTap={isInteractive ? { scale: 0.94, y: 1 } : {}}
        onClick={handleClick}
        disabled={!isInteractive}
        className={`relative flex items-center justify-center p-1 bg-transparent border-0 outline-none transition-all duration-200 ${
          isInteractive
            ? 'cursor-pointer'
            : isActiveTurn
            ? 'cursor-wait opacity-95'
            : 'cursor-default opacity-85'
        }`}
        style={{
          width: `${cubeSize + 14}px`,
          height: `${cubeSize + 14}px`,
          perspective: '400px',
        }}
      >
        {/* Active Turn Gentle Aura Pulse (Subtle, no thick box border) */}
        {isActiveTurn && (
          <div
            className={`absolute inset-1 rounded-full animate-pulse pointer-events-none ${
              color === 'red'
                ? 'shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : color === 'green'
                ? 'shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : color === 'yellow'
                ? 'shadow-[0_0_12px_rgba(234,179,8,0.5)]'
                : 'shadow-[0_0_12px_rgba(59,130,246,0.5)]'
            }`}
          />
        )}

        {/* Dynamic Floor Shadow */}
        <motion.div
          animate={
            isTumbling || isRolling
              ? { scale: [1, 0.35, 0.8, 1.15, 1], opacity: [0.55, 0.12, 0.35, 0.65, 0.55] }
              : { scale: 1, opacity: 0.55 }
          }
          transition={{ duration: 0.75, ease: 'easeInOut' }}
          className="absolute bottom-1 w-9 h-2.5 rounded-full bg-black/75 blur-[2px] pointer-events-none"
        />

        {/* 3D Physical Cube Mesh */}
        <motion.div
          animate={{
            rotateX: rotation.x,
            rotateY: rotation.y,
            rotateZ: rotation.z,
            y: isTumbling || isRolling ? [0, -26, 3, -6, 2, 0] : 0,
            scale: isTumbling || isRolling ? [1, 1.12, 0.94, 1.04, 0.98, 1] : 1,
          }}
          transition={{
            duration: 0.75,
            ease: [0.22, 1, 0.36, 1],
          }}
          onAnimationComplete={() => {
            if (isTumbling) {
              setIsTumbling(false);
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
          <div style={faceStyle(`rotateY(0deg) translateZ(${translateZ}px)`)}>
            {renderPips(1)}
          </div>

          {/* Face 2: Right (Value 2) */}
          <div style={faceStyle(`rotateY(90deg) translateZ(${translateZ}px)`)}>
            {renderPips(2)}
          </div>

          {/* Face 3: Top (Value 3) */}
          <div style={faceStyle(`rotateX(90deg) translateZ(${translateZ}px)`)}>
            {renderPips(3)}
          </div>

          {/* Face 4: Bottom (Value 4) */}
          <div style={faceStyle(`rotateX(-90deg) translateZ(${translateZ}px)`)}>
            {renderPips(4)}
          </div>

          {/* Face 5: Left (Value 5) */}
          <div style={faceStyle(`rotateY(-90deg) translateZ(${translateZ}px)`)}>
            {renderPips(5)}
          </div>

          {/* Face 6: Back (Value 6) */}
          <div style={faceStyle(`rotateY(180deg) translateZ(${translateZ}px)`)}>
            {renderPips(6)}
          </div>
        </motion.div>
      </motion.button>
    </div>
  );
};
