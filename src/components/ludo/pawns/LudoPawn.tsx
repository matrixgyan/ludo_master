import React from 'react';
import { motion } from 'motion/react';
import { PlayerColor } from '../../../types/game';

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
}

export const LudoPawn: React.FC<LudoPawnProps> = ({
  color,
  pawnIndex,
  pathStep = 0,
  isSelected = false,
  isMovable = false,
  isJumping = false,
  onClick,
  sizePx,
  style,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative w-full h-full cursor-pointer select-none flex items-center justify-center ${
        isMovable ? 'z-30' : 'z-20'
      }`}
      style={{
        ...(sizePx ? { width: `${sizePx}px`, height: `${sizePx}px` } : {}),
        ...style,
      }}
    >
      {/* Movable / Selected Pulsing Ring */}
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
            top: '70%',
            left: '10%',
            width: '80%',
            height: '24%',
            background:
              color === 'blue'
                ? 'radial-gradient(circle, rgba(29, 140, 248, 0.9) 0%, rgba(255,255,255,0) 70%)'
                : color === 'red'
                ? 'radial-gradient(circle, rgba(255, 61, 103, 0.9) 0%, rgba(255,255,255,0) 70%)'
                : color === 'green'
                ? 'radial-gradient(circle, rgba(0, 230, 118, 0.9) 0%, rgba(255,255,255,0) 70%)'
                : 'radial-gradient(circle, rgba(255, 179, 0, 0.9) 0%, rgba(255,255,255,0) 70%)',
            boxShadow: `0 0 14px ${
              color === 'blue'
                ? '#1d8cf8'
                : color === 'red'
                ? '#ff3d67'
                : color === 'green'
                ? '#00e676'
                : '#ffb300'
            }`,
          }}
        />
      )}

      {/* Ground Shadow - dynamic contrast during jumps */}
      <motion.div
        key={isJumping ? `shadow-${pathStep}` : 'shadow-idle'}
        className="absolute rounded-full bg-black/60 blur-[2px] pointer-events-none"
        animate={
          isJumping
            ? { scale: [1, 0.35, 1.25, 1], opacity: [0.6, 0.15, 0.75, 0.6] }
            : isSelected
            ? { scale: 1.3, opacity: 0.8 }
            : { scale: 1, opacity: 0.6 }
        }
        transition={
          isJumping
            ? { duration: 0.58, ease: [0.22, 1, 0.36, 1] }
            : { duration: 0.25 }
        }
        style={{
          top: '70%',
          left: '10%',
          width: '80%',
          height: '24%',
        }}
      />

      {/* Solid 3D Pawn Body (Ground-anchored with squishy jump physics) */}
      <motion.div
        key={isJumping ? `body-${pathStep}` : 'body-idle'}
        animate={
          isJumping
            ? {
                y: [0, -42, -6, 0],
                scaleX: [1, 0.7, 1.38, 0.86, 1.05, 1],
                scaleY: [1, 1.42, 0.68, 1.18, 0.94, 1],
              }
            : isSelected
            ? { y: [-2, -6, -2], scale: 1.15 }
            : isMovable
            ? { scale: [1, 1.05, 1], y: 0 }
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
        className="relative z-10 w-full h-full flex items-center justify-center overflow-visible"
      >
        <svg
          viewBox="0 0 100 120"
          className="w-full h-full drop-shadow-[0_5px_8px_rgba(0,0,0,0.5)] overflow-visible"
        >
          {/* ================= BLUE PAWN: BURJ AL ARAB SAIL ================= */}
          {color === 'blue' && (
            <g>
              <defs>
                <linearGradient id="blue-sail-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#82c0ff" />
                  <stop offset="40%" stopColor="#1d8cf8" />
                  <stop offset="100%" stopColor="#0b3866" />
                </linearGradient>
                <linearGradient id="silver-rim" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
              </defs>
              {/* Base pedestal */}
              <ellipse cx="50" cy="100" rx="38" ry="12" fill="#0b3866" />
              <ellipse cx="50" cy="97" rx="36" ry="10" fill="url(#silver-rim)" />
              <ellipse cx="50" cy="95" rx="30" ry="8" fill="#1d8cf8" />

              {/* 3D Sail Structure */}
              <path
                d="M 30 92 C 30 60, 48 20, 72 25 C 55 35, 46 65, 48 92 Z"
                fill="url(#blue-sail-grad)"
              />
              {/* Curved Inner Sail Accent */}
              <path
                d="M 44 92 C 43 70, 52 40, 68 30 C 58 42, 52 68, 52 92 Z"
                fill="#ffffff"
                opacity="0.8"
              />
              {/* Top Skybridge Ring */}
              <ellipse cx="50" cy="30" rx="10" ry="4" fill="url(#silver-rim)" />
              {/* Spire tip */}
              <path d="M 49 30 L 50 10 L 51 30 Z" fill="#ffffff" />
            </g>
          )}

          {/* ================= RED PAWN: PINK STRAWBERRY CUPCAKE SWIRL ================= */}
          {color === 'red' && (
            <g>
              <defs>
                <linearGradient id="pink-swirl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffb3c1" />
                  <stop offset="50%" stopColor="#ff4d6d" />
                  <stop offset="100%" stopColor="#a4133c" />
                </linearGradient>
                <linearGradient id="cup-base-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff758f" />
                  <stop offset="100%" stopColor="#800f2f" />
                </linearGradient>
              </defs>
              {/* Cupcake Base Liner */}
              <path d="M 22 98 L 30 70 L 70 70 L 78 98 Z" fill="url(#cup-base-grad)" />
              <ellipse cx="50" cy="98" rx="28" ry="8" fill="#590d22" />
              <ellipse cx="50" cy="70" rx="20" ry="5" fill="#ff758f" />

              {/* Spiraling Frosting Layers */}
              {/* Bottom Layer */}
              <ellipse cx="50" cy="65" rx="30" ry="12" fill="url(#pink-swirl-grad)" />
              <ellipse cx="50" cy="62" rx="28" ry="10" fill="#ff758f" />
              {/* Middle Layer */}
              <ellipse cx="50" cy="50" rx="22" ry="9" fill="url(#pink-swirl-grad)" />
              <ellipse cx="50" cy="48" rx="20" ry="7" fill="#ff8fa3" />
              {/* Top Layer Swirl */}
              <path d="M 38 42 C 38 30, 48 20, 50 18 C 52 20, 62 30, 62 42 Z" fill="url(#pink-swirl-grad)" />

              {/* Cherry on top */}
              <circle cx="50" cy="16" r="8" fill="#800f2f" />
              <circle cx="48" cy="14" r="2.5" fill="#ffffff" opacity="0.9" />
            </g>
          )}

          {/* ================= GREEN PAWN: EMERALD ROBOT / STAR CRYSTAL ================= */}
          {color === 'green' && (
            <g>
              <defs>
                <linearGradient id="green-crystal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#b2ff59" />
                  <stop offset="40%" stopColor="#00e676" />
                  <stop offset="100%" stopColor="#004d40" />
                </linearGradient>
                <linearGradient id="green-core" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#b2ff59" />
                </linearGradient>
              </defs>
              {/* Base Platform */}
              <ellipse cx="50" cy="100" rx="36" ry="12" fill="#003311" />
              <ellipse cx="50" cy="97" rx="32" ry="9" fill="url(#green-crystal-grad)" />

              {/* Angled Robot / Crystal Torso */}
              <path d="M 28 92 L 36 50 L 64 50 L 72 92 Z" fill="url(#green-crystal-grad)" />

              {/* Glowing Chest Emblem */}
              <polygon points="50,56 60,66 50,76 40,66" fill="url(#green-core)" />

              {/* Crystalline Head */}
              <polygon points="50,18 68,36 50,48 32,36" fill="url(#green-crystal-grad)" />
              <polygon points="50,22 62,36 50,44 38,36" fill="#ffffff" opacity="0.6" />

              {/* Top Star Crown */}
              <circle cx="50" cy="14" r="5" fill="#b2ff59" />
            </g>
          )}

          {/* ================= YELLOW PAWN: GOLDEN ARABIAN TURBAN / HELMET ================= */}
          {color === 'yellow' && (
            <g>
              <defs>
                <linearGradient id="gold-dome-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff59d" />
                  <stop offset="40%" stopColor="#ffb300" />
                  <stop offset="100%" stopColor="#8c5000" />
                </linearGradient>
                <linearGradient id="copper-band" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff8f00" />
                  <stop offset="50%" stopColor="#ffe082" />
                  <stop offset="100%" stopColor="#ff6f00" />
                </linearGradient>
              </defs>
              {/* Pedestal Base */}
              <ellipse cx="50" cy="100" rx="38" ry="12" fill="#5d3200" />
              <ellipse cx="50" cy="97" rx="34" ry="10" fill="url(#copper-band)" />

              {/* Helmet Ridge Body */}
              <path d="M 24 94 C 24 60, 32 40, 50 35 C 68 40, 76 60, 76 94 Z" fill="url(#gold-dome-grad)" />

              {/* Decorative Ribs */}
              <path d="M 50 35 L 50 94" stroke="#8c5000" strokeWidth="2.5" opacity="0.6" />
              <path d="M 36 45 C 38 65, 36 85, 34 94" stroke="#8c5000" strokeWidth="2" opacity="0.5" />
              <path d="M 64 45 C 62 65, 64 85, 66 94" stroke="#8c5000" strokeWidth="2" opacity="0.5" />

              {/* Metallic Base Collar */}
              <rect x="22" y="86" width="56" height="8" rx="4" fill="url(#copper-band)" />

              {/* Top Golden Finial / Crescent Pearl */}
              <circle cx="50" cy="26" r="9" fill="url(#copper-band)" />
              <circle cx="47" cy="23" r="3" fill="#ffffff" opacity="0.9" />
              <path d="M 50 17 L 50 10" stroke="#ffea00" strokeWidth="3" strokeLinecap="round" />
            </g>
          )}

          {/* Number Label Badge */}
          <circle cx="50" cy="112" r="8" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
          <text
            x="50"
            y="115"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="10"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            {pawnIndex + 1}
          </text>
        </svg>
      </motion.div>
    </div>
  );
};

