import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SoundManager } from '../../../audio/soundManager';

export interface SnakeLudo3DDiceProps {
  value: number;
  isRolling: boolean;
  disabled: boolean;
  isActiveTurn: boolean;
  playerTheme?: 'p1' | 'p2' | 'p3' | 'p4' | 'red' | 'green' | 'yellow' | 'blue';
  onRoll: () => void;
  size?: number;
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
  disabled,
  isActiveTurn,
  playerTheme = 'p1',
  onRoll,
  size = 44,
}) => {
  const [rotation, setRotation] = useState<{ x: number; y: number; z: number }>({
    x: 0,
    y: 0,
    z: 0,
  });
  const [isTumbling, setIsTumbling] = useState(false);

  const cubeSize = size; // px
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
    if (disabled || !isActiveTurn || isRolling || isTumbling) return;
    onRoll();
  };

  // Render authentic inlaid pips
  const renderPips = (val: number) => {
    const darkDot =
      'w-2 h-2 rounded-full bg-[#262017] shadow-[inset_0_1px_2px_rgba(0,0,0,0.85)] ring-[0.5px] ring-[#3d3324]';
    const redDot =
      'w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#dc2626] to-[#7f1d1d] shadow-[inset_0_1px_2px_rgba(0,0,0,0.7)] ring-[0.5px] ring-[#fca5a5]';
    const redSmallDot =
      'w-2 h-2 rounded-full bg-gradient-to-br from-[#dc2626] to-[#7f1d1d] shadow-[inset_0_1px_2px_rgba(0,0,0,0.7)] ring-[0.5px] ring-[#fca5a5]';
    const pad = 'p-1.5';

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
    border: '1px solid #a8997a',
    borderRadius: '8px',
    boxShadow:
      'inset 0 0 4px rgba(0,0,0,0.15), inset 0 1.5px 2px rgba(255,255,255,0.95), 0 2px 4px rgba(0,0,0,0.25)',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    transform: transformStr,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
  });

  const isInteractive = isActiveTurn && !disabled && !isRolling && !isTumbling;

  // Theme color accents
  const isP1 = playerTheme === 'p1' || playerTheme === 'red';
  const isP2 = playerTheme === 'p2' || playerTheme === 'green';
  const isP3 = playerTheme === 'p3' || playerTheme === 'yellow';

  const glowClass = isP1
    ? 'shadow-[0_0_18px_rgba(239,68,68,0.55)] ring-1.5 ring-red-500/60'
    : isP2
    ? 'shadow-[0_0_18px_rgba(16,185,129,0.55)] ring-1.5 ring-emerald-500/60'
    : isP3
    ? 'shadow-[0_0_18px_rgba(234,179,8,0.55)] ring-1.5 ring-yellow-500/60'
    : 'shadow-[0_0_18px_rgba(59,130,246,0.55)] ring-1.5 ring-blue-500/60';

  const dockBg = isP1
    ? 'radial-gradient(circle, rgba(239,68,68,0.18) 0%, rgba(26,20,16,0.85) 75%, transparent 100%)'
    : isP2
    ? 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(16,24,20,0.85) 75%, transparent 100%)'
    : isP3
    ? 'radial-gradient(circle, rgba(234,179,8,0.18) 0%, rgba(26,24,16,0.85) 75%, transparent 100%)'
    : 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(16,20,28,0.85) 75%, transparent 100%)';

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none"
      style={{ perspective: '600px' }}
    >
      {/* 3D Interactive Dice Button Container */}
      <motion.button
        id={`snake-ludo-dice-${playerTheme}`}
        role="button"
        tabIndex={0}
        aria-label={`Roll 3D Dice for ${playerTheme}`}
        whileHover={isInteractive ? { scale: 1.08, y: -2 } : {}}
        whileTap={isInteractive ? { scale: 0.92, y: 1 } : {}}
        onClick={handleClick}
        disabled={!isInteractive}
        className={`relative rounded-xl flex items-center justify-center transition-all duration-300 ${
          isInteractive
            ? 'cursor-pointer'
            : isActiveTurn
            ? 'cursor-wait opacity-90'
            : 'cursor-not-allowed opacity-60 grayscale-[35%]'
        }`}
        style={{
          background: dockBg,
          perspective: '500px',
          width: `${Math.max(40, cubeSize + 14)}px`,
          height: `${Math.max(40, cubeSize + 14)}px`,
        }}
      >
        {/* Active Player Radial Pulsing Glow Halo */}
        {isActiveTurn && (
          <div
            className={`absolute inset-0 rounded-xl pointer-events-none ${
              isInteractive ? `animate-pulse ${glowClass}` : 'ring-1 ring-white/20'
            }`}
          />
        )}

        {/* Dynamic Physical Floor Shadow */}
        <motion.div
          animate={
            isTumbling || isRolling
              ? { scale: [1, 0.3, 0.8, 1.2, 1], opacity: [0.6, 0.1, 0.4, 0.7, 0.6] }
              : { scale: 1, opacity: 0.55 }
          }
          transition={{ duration: 0.75, ease: 'easeInOut' }}
          className="absolute bottom-1 w-9 h-2.5 rounded-full bg-black/80 blur-[2.5px] pointer-events-none"
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
