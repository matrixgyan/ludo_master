import React from 'react';
import { motion } from 'motion/react';
import { PlayerColor } from '../../../types/game';
import { useLiveTheme } from '../../../hooks/useLiveTheme';
import { Pawn3DRenderer } from './Pawn3DRenderer';

interface LudoPawnProps {
  id: string;
  color: PlayerColor;
  pawnIndex: number;
  pathStep?: number;
  isSelected?: boolean;
  isMovable?: boolean;
  isJumping?: boolean;
  onClick?: () => void;
  sizePx?: number;
  style?: React.CSSProperties;
  overrideSkinId?: string;
}

export const LudoPawn: React.FC<LudoPawnProps> = ({
  id,
  color,
  pathStep = 0,
  isSelected = false,
  isMovable = false,
  isJumping = false,
  onClick,
  sizePx,
  style,
  overrideSkinId,
}) => {
  const { activePawnId } = useLiveTheme();
  const currentSkinId = overrideSkinId || activePawnId || 'royal_crowned';

  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative w-full h-full cursor-pointer select-none flex items-center justify-center ${
        isMovable ? 'z-30' : 'z-20'
      }`}
      style={{
        ...(sizePx ? { width: `${sizePx}px`, height: `${sizePx}px` } : {}),
        ...style,
      }}
    >
      {/* Movable / Selected Pulsing Radial Aura Ring */}
      {(isMovable || isSelected) && (
        <motion.div
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute rounded-full z-0 pointer-events-none"
          style={{
            top: '72%',
            left: '8%',
            width: '84%',
            height: '24%',
            background:
              color === 'blue'
                ? 'radial-gradient(circle, rgba(0, 150, 199, 0.95) 0%, rgba(255,255,255,0) 70%)'
                : color === 'red'
                ? 'radial-gradient(circle, rgba(239, 35, 60, 0.95) 0%, rgba(255,255,255,0) 70%)'
                : color === 'green'
                ? 'radial-gradient(circle, rgba(45, 106, 79, 0.95) 0%, rgba(255,255,255,0) 70%)'
                : 'radial-gradient(circle, rgba(245, 158, 11, 0.95) 0%, rgba(255,255,255,0) 70%)',
            boxShadow: `0 0 16px ${
              color === 'blue'
                ? '#0096c7'
                : color === 'red'
                ? '#ef233c'
                : color === 'green'
                ? '#2d6a4f'
                : '#f59e0b'
            }`,
          }}
        />
      )}

      {/* Ground Shadow - dynamic elevation & contrast */}
      <motion.div
        key={isJumping ? `shadow-${pathStep}` : 'shadow-idle'}
        className="absolute rounded-full bg-black/60 blur-[2.5px] pointer-events-none"
        animate={
          isJumping
            ? { scale: [1, 0.35, 1.25, 1], opacity: [0.6, 0.15, 0.75, 0.6] }
            : isSelected
            ? { scale: 1.3, opacity: 0.85 }
            : { scale: 1, opacity: 0.6 }
        }
        transition={
          isJumping
            ? { duration: 0.58, ease: [0.22, 1, 0.36, 1] }
            : { duration: 0.25 }
        }
        style={{
          top: '72%',
          left: '8%',
          width: '84%',
          height: '24%',
        }}
      />

      {/* Solid 3D Pawn Body (Ground-anchored physics) */}
      <motion.div
        key={isJumping ? `body-${pathStep}` : 'body-idle'}
        animate={
          isJumping
            ? {
                y: [0, -42, -6, 0],
                scaleX: [1, 0.72, 1.35, 0.88, 1.04, 1],
                scaleY: [1, 1.38, 0.72, 1.15, 0.96, 1],
              }
            : isSelected
            ? { y: [-2, -6, -2], scale: 1.12 }
            : isMovable
            ? { scale: [1, 1.04, 1], y: 0 }
            : { y: 0, scale: 1 }
        }
        transition={
          isJumping
            ? { duration: 0.58, ease: [0.22, 1, 0.36, 1] }
            : isSelected
            ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut' }
            : isMovable
            ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.2 }
        }
        className="relative z-10 w-full h-full flex flex-col items-center justify-center overflow-visible"
      >
        {/* Exact 3D Pawn Geometry without any distracting numbers */}
        <Pawn3DRenderer
          color={color}
          skinId={currentSkinId}
          sizePx={sizePx || 38}
          isSelected={isSelected}
          isMovable={isMovable}
        />
      </motion.div>
    </div>
  );
};
