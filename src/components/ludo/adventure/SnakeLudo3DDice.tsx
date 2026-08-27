import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { SoundManager } from '../../../audio/soundManager';

interface SnakeLudo3DDiceProps {
  value: number;
  isRolling: boolean;
  disabled: boolean;
  currentTurn: 'p1' | 'p2';
  onRoll: () => void;
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
  currentTurn,
  onRoll,
}) => {
  const [rotation, setRotation] = useState<{ x: number; y: number; z: number }>({
    x: 0,
    y: 0,
    z: 0,
  });
  const [isTumbling, setIsTumbling] = useState(false);
  const lastValRef = useRef<number>(value || 1);

  const cubeSize = 54; // px
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
    if (disabled || isRolling || isTumbling) return;
    onRoll();
  };

  // Render authentic inlaid pips
  const renderPips = (val: number) => {
    const darkDot =
      'w-2.5 h-2.5 rounded-full bg-[#262017] shadow-[inset_0_1px_2px_rgba(0,0,0,0.85)] ring-[0.5px] ring-[#3d3324]';
    const redDot =
      'w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#dc2626] to-[#7f1d1d] shadow-[inset_0_1px_2px_rgba(0,0,0,0.7)] ring-[0.5px] ring-[#fca5a5]';
    const redSmallDot =
      'w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#dc2626] to-[#7f1d1d] shadow-[inset_0_1px_2px_rgba(0,0,0,0.7)] ring-[0.5px] ring-[#fca5a5]';
    const pad = 'p-2';

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
    border: '1.5px solid #a8997a',
    borderRadius: '10px',
    boxShadow:
      'inset 0 0 5px rgba(0,0,0,0.12), inset 0 2px 3px rgba(255,255,255,0.95), 0 2px 4px rgba(0,0,0,0.22)',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    transform: transformStr,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
  });

  const isInteractive = !disabled && !isRolling && !isTumbling;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ perspective: '600px' }}
    >
      {/* Interactive 3D Dice Button Container */}
      <motion.button
        id="snake-ludo-3d-dice-btn"
        role="button"
        tabIndex={0}
        aria-label="Roll 3D Dice"
        whileHover={isInteractive ? { scale: 1.12, y: -4 } : {}}
        whileTap={isInteractive ? { scale: 0.94, y: 2 } : {}}
        onClick={handleClick}
        disabled={!isInteractive}
        className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          isInteractive
            ? 'cursor-pointer'
            : 'cursor-not-allowed opacity-80'
        }`}
        style={{
          background:
            currentTurn === 'p1'
              ? 'radial-gradient(circle, rgba(239,68,68,0.22) 0%, rgba(20,15,12,0.8) 70%, transparent 100%)'
              : 'radial-gradient(circle, rgba(16,185,129,0.22) 0%, rgba(20,15,12,0.8) 70%, transparent 100%)',
          perspective: '500px',
        }}
      >
        {/* Active Player Radial Pulsing Glow Halo */}
        {isInteractive && (
          <div
            className={`absolute inset-0 rounded-2xl animate-pulse pointer-events-none ${
              currentTurn === 'p1'
                ? 'shadow-[0_0_24px_rgba(239,68,68,0.45)] ring-1 ring-red-500/40'
                : 'shadow-[0_0_24px_rgba(16,185,129,0.45)] ring-1 ring-emerald-500/40'
            }`}
          />
        )}

        {/* Dynamic Physical Floor Shadow */}
        <motion.div
          animate={
            isTumbling || isRolling
              ? { scale: [1, 0.35, 0.8, 1.15, 1], opacity: [0.6, 0.12, 0.4, 0.7, 0.6] }
              : { scale: 1, opacity: 0.6 }
          }
          transition={{ duration: 0.75, ease: 'easeInOut' }}
          className="absolute bottom-2 w-12 h-3 rounded-full bg-black/80 blur-[3px] pointer-events-none"
        />

        {/* 3D Physical Cube Mesh */}
        <motion.div
          animate={{
            rotateX: rotation.x,
            rotateY: rotation.y,
            rotateZ: rotation.z,
            y: isTumbling || isRolling ? [0, -32, 4, -8, 2, 0] : 0,
            scale: isTumbling || isRolling ? [1, 1.15, 0.92, 1.06, 0.98, 1] : 1,
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
