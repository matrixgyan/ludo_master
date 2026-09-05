import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Crown } from 'lucide-react';
import { SoundManager } from '../../../audio/soundManager';

export interface SnakeLudo3DDiceProps {
  value: number;
  isRolling: boolean;
  disabled?: boolean;
  isActiveTurn?: boolean;
  playerTheme?: 'p1' | 'p2' | 'p3' | 'p4' | string;
  onRoll?: () => void;
  size?: number;
  showCrown?: boolean;
}

// 3D rotation angles to face the camera directly for each dice value (1 to 6)
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
  isActiveTurn = true,
  playerTheme = 'p1',
  onRoll,
  size = 48,
  showCrown = false,
}) => {
  const [rotation, setRotation] = useState<{ x: number; y: number; z: number }>({
    x: 0,
    y: 0,
    z: 0,
  });
  const [isTumbling, setIsTumbling] = useState(false);
  const wasRollingRef = useRef(false);

  const cubeSize = size;
  const translateZ = cubeSize / 2;

  // Trigger 3D tumble when rolling starts
  const triggerTumble = (targetVal: number) => {
    const target = FACE_ROTATIONS[targetVal] || FACE_ROTATIONS[1];

    setRotation((prev) => {
      // Add 2-3 full 360-degree rolls plus target offset to create a natural tumble
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
    if (isRolling && !wasRollingRef.current) {
      triggerTumble(value);
    } else if (!isRolling && showCrown) {
      // Reset smoothly to front face when crown should be displayed
      setRotation((prev) => {
        const nextTurnsX = Math.round(prev.x / 360);
        const nextTurnsY = Math.round(prev.y / 360);
        const nextTurnsZ = Math.round(prev.z / 360);
        return {
          x: nextTurnsX * 360,
          y: nextTurnsY * 360,
          z: nextTurnsZ * 360,
        };
      });
    }
    wasRollingRef.current = isRolling;
  }, [isRolling, value, showCrown]);

  const handleClick = () => {
    if (disabled || !isActiveTurn || isRolling || isTumbling) return;
    onRoll?.();
  };

  // Render authentic inlaid pips or crown for ceramic faces
  const renderFaceContent = (val: number) => {
    const darkDot =
      'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#1e293b] shadow-inner ring-[0.5px] ring-[#334155]';
    const redDot =
      'w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-gradient-to-br from-[#dc2626] to-[#991b1b] shadow-inner ring-[0.5px] ring-[#fca5a5]';
    const pad = 'p-1.5 sm:p-2';

    switch (val) {
      case 1:
        if (showCrown) {
          return (
            <div className="w-full h-full flex items-center justify-center">
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-[#475569] fill-[#475569] drop-shadow-sm" />
            </div>
          );
        }
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
            <div className={`${darkDot} self-center`} />
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
    top: 0,
    left: 0,
    width: `${cubeSize}px`,
    height: `${cubeSize}px`,
    background: 'linear-gradient(145deg, #ffffff 0%, #ffffff 42%, #f1f5f9 100%)',
    border: '1.5px solid rgba(241, 245, 249, 0.95)',
    borderRadius: `${Math.round(cubeSize * 0.22)}px`,
    boxShadow:
      'inset 0 1.5px 2px rgba(255,255,255,1), inset 0 -1.5px 2px rgba(0,0,0,0.06), 0 4px 10px rgba(0,0,0,0.22)',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    transform: transformStr,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
  });

  const isInteractive = isActiveTurn && !disabled && !isRolling && !isTumbling;

  return (
    <div
      id={`snake-ludo-dice-container-${playerTheme}`}
      onClick={handleClick}
      className={`relative flex items-center justify-center select-none ${
        isInteractive ? 'cursor-pointer' : ''
      }`}
      style={{
        perspective: '600px',
        width: `${cubeSize}px`,
        height: `${cubeSize}px`,
      }}
    >
      {/* Floor Ambient Contact Shadow */}
      <motion.div
        animate={
          isTumbling || isRolling
            ? { scale: [1, 0.45, 0.85, 1.15, 1], opacity: [0.45, 0.12, 0.32, 0.55, 0.45] }
            : { scale: 1, opacity: 0.45 }
        }
        transition={{ duration: 0.72, ease: 'easeInOut' }}
        className="absolute -bottom-2 w-10 h-2.5 rounded-full bg-black/80 blur-[2.5px] pointer-events-none"
      />

      {/* 3D Physical Cube Mesh */}
      <motion.div
        animate={{
          rotateX: rotation.x,
          rotateY: rotation.y,
          rotateZ: rotation.z,
          y: isTumbling || isRolling ? [0, -8, 2, -3, 0] : 0,
          scale: isTumbling || isRolling ? [1, 1.05, 0.98, 1] : 1,
        }}
        transition={{
          duration: 0.72,
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
        {/* Face 1: Front (Value 1 or Crown) */}
        <div style={faceStyle(`rotateY(0deg) translateZ(${translateZ}px)`)}>
          {renderFaceContent(1)}
        </div>

        {/* Face 2: Right (Value 2) */}
        <div style={faceStyle(`rotateY(90deg) translateZ(${translateZ}px)`)}>
          {renderFaceContent(2)}
        </div>

        {/* Face 3: Top (Value 3) */}
        <div style={faceStyle(`rotateX(90deg) translateZ(${translateZ}px)`)}>
          {renderFaceContent(3)}
        </div>

        {/* Face 4: Bottom (Value 4) */}
        <div style={faceStyle(`rotateX(-90deg) translateZ(${translateZ}px)`)}>
          {renderFaceContent(4)}
        </div>

        {/* Face 5: Left (Value 5) */}
        <div style={faceStyle(`rotateY(-90deg) translateZ(${translateZ}px)`)}>
          {renderFaceContent(5)}
        </div>

        {/* Face 6: Back (Value 6) */}
        <div style={faceStyle(`rotateY(180deg) translateZ(${translateZ}px)`)}>
          {renderFaceContent(6)}
        </div>
      </motion.div>
    </div>
  );
};
