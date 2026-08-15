import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { PlayerColor, Pawn } from '../../../types/game';
import { GridCoord, getPawnGridCoord, HOME_SLOTS } from '../../../game/boardGeometry';
import { LudoPawn } from '../pawns/LudoPawn';
import { SoundManager } from '../../../audio/soundManager';

export interface AngelFlightData {
  id: string;
  pawn: Pawn;
  fromPathStep: number;
  fromCoord: GridCoord;
  toCoord: GridCoord;
  capturedByColor: PlayerColor;
  capturedByName: string;
}

interface AngelFlightOverlayProps {
  flight: AngelFlightData | null;
  onFlightComplete: (flightId: string) => void;
}

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  type: 'feather' | 'star' | 'sparkle';
  rotation: number;
}

export const AngelFlightOverlay: React.FC<AngelFlightOverlayProps> = ({
  flight,
  onFlightComplete,
}) => {
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [hasLanded, setHasLanded] = useState(false);
  const handledFlightIdRef = useRef<string | null>(null);

  // Compute cell-by-cell reverse trajectory from current step back to 0, then into Home slot
  const { pathCoords, xPercentKeyframes, yPercentKeyframes, times, duration } = useMemo(() => {
    if (!flight) {
      return {
        pathCoords: [],
        xPercentKeyframes: [0],
        yPercentKeyframes: [0],
        times: [0, 1],
        duration: 1.5,
      };
    }

    const { pawn, fromPathStep, fromCoord, toCoord } = flight;
    const coords: GridCoord[] = [];

    if (fromPathStep >= 0) {
      // Step backwards cell-by-cell: fromPathStep -> ... -> 0
      for (let s = fromPathStep; s >= 0; s--) {
        coords.push(getPawnGridCoord(pawn.color, pawn.pawnIndex, s));
      }
    } else {
      coords.push(fromCoord);
    }

    // Final destination: Home Base slot
    coords.push(toCoord);

    // If only 1 or 2 points, ensure smooth array
    if (coords.length === 1) {
      coords.push(toCoord);
    }

    const xPercents = coords.map((c) => (c.x / 15) * 100);
    const yPercents = coords.map((c) => (c.y / 15) * 100);
    const stepTimes = coords.map((_, i) => i / (coords.length - 1));

    // Dynamic flight duration based on distance (60-80ms per cell, clamped to [1.2s, 2.6s])
    const calculatedDuration = Math.min(2.6, Math.max(1.2, coords.length * 0.075));

    return {
      pathCoords: coords,
      xPercentKeyframes: xPercents,
      yPercentKeyframes: yPercents,
      times: stepTimes,
      duration: calculatedDuration,
    };
  }, [flight]);

  useEffect(() => {
    if (!flight) {
      handledFlightIdRef.current = null;
      setHasLanded(false);
      return;
    }

    // Prevent duplicate execution for the same flight ID
    if (handledFlightIdRef.current === flight.id) {
      return;
    }
    handledFlightIdRef.current = flight.id;
    setHasLanded(false);

    // Play celestial ascension sound ONCE per flight
    SoundManager.play('angel-flight');

    // Generate floating stardust and feather particles
    const generated: FloatingParticle[] = Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 44,
      y: (Math.random() - 0.5) * 44,
      size: Math.random() * 10 + 6,
      delay: i * 0.09,
      type: i % 3 === 0 ? 'feather' : i % 3 === 1 ? 'star' : 'sparkle',
      rotation: Math.random() * 360,
    }));
    setParticles(generated);

    // Timer for touchdown
    const landingTimer = setTimeout(() => {
      setHasLanded(true);
      SoundManager.play('angel-land');

      // Allow 260ms for the landing sparkle burst before completing
      const finishTimer = setTimeout(() => {
        onFlightComplete(flight.id);
      }, 260);

      return () => clearTimeout(finishTimer);
    }, duration * 1000);

    return () => {
      clearTimeout(landingTimer);
    };
  }, [flight?.id, duration, onFlightComplete]);

  if (!flight || pathCoords.length === 0) return null;

  const { pawn } = flight;
  const cellSizePct = (1 / 15) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
      {/* 1. TOP CELESTIAL BANNER */}
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.92 }}
        animate={{
          opacity: [0, 1, 1, 0],
          y: [-16, 0, 0, -10],
          scale: [0.92, 1, 1, 0.95],
        }}
        transition={{ duration: duration + 0.3, times: [0, 0.15, 0.82, 1] }}
        className="absolute top-2 inset-x-0 flex justify-center z-50"
      >
        <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-[0_4px_20px_rgba(251,191,36,0.6)] border-2 border-white flex items-center gap-2 backdrop-blur-md">
          <span className="text-base">🪽</span>
          <span className="tracking-wide uppercase text-[11px] sm:text-xs">
            Angelic Return • <strong className="capitalize">{pawn.color} #{pawn.pawnIndex + 1}</strong> Gliding Home!
          </span>
          <span className="text-base">✨</span>
        </div>
      </motion.div>

      {/* 2. ANGEL PAWN FLIGHT OBJECT MOVING CELL-BY-CELL */}
      <motion.div
        initial={{
          left: `${xPercentKeyframes[0]}%`,
          top: `${yPercentKeyframes[0]}%`,
          scale: 1,
        }}
        animate={{
          left: xPercentKeyframes.map((x) => `${x}%`),
          top: yPercentKeyframes.map((y) => `${y}%`),
          scale: [1, 1.3, 1.3, 1],
        }}
        transition={{
          left: { duration, times, ease: 'linear' },
          top: { duration, times, ease: 'linear' },
          scale: { duration, times: [0, 0.1, 0.9, 1], ease: 'easeInOut' },
        }}
        className="absolute flex items-center justify-center overflow-visible"
        style={{
          width: `${cellSizePct}%`,
          height: `${cellSizePct}%`,
        }}
      >
        {/* Animated Golden Halo Ring above head */}
        <motion.div
          animate={{
            y: [-36, -42, -36],
            rotateX: [60, 65, 60],
            rotateZ: [0, 180, 360],
            scale: [1, 1.12, 1],
          }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute z-40 pointer-events-none"
          style={{ transformOrigin: 'center center' }}
        >
          <div className="w-11 h-5 rounded-full border-[3px] border-yellow-300 bg-yellow-200/40 shadow-[0_0_14px_rgba(253,224,71,0.9),inset_0_0_8px_rgba(255,255,255,0.9)]" />
        </motion.div>

        {/* Heavenly Golden Aura Glow */}
        <motion.div
          animate={{
            scale: [1.1, 1.5, 1.1],
            opacity: [0.5, 0.85, 0.5],
          }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-20 h-20 rounded-full bg-gradient-to-r from-yellow-300/40 via-amber-200/50 to-amber-400/40 blur-xl pointer-events-none z-10"
        />

        {/* 3. FLUTTERING ANGEL WINGS (Left & Right) */}
        {/* LEFT ANGEL WING */}
        <motion.div
          animate={{
            rotateZ: [-25, 20, -25],
            scaleX: [1, 0.85, 1],
            scaleY: [1, 1.12, 1],
          }}
          transition={{ duration: 0.22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-[52%] top-[-10%] z-20 pointer-events-none origin-bottom-right"
          style={{ width: '46px', height: '46px' }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
            <defs>
              <linearGradient id="angelWingGradLeftCell" x1="100%" y1="50%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#fde047" />
              </linearGradient>
            </defs>
            <path
              d="M 95 80 C 85 45, 60 15, 15 10 C 25 30, 45 40, 50 55 C 35 55, 25 65, 30 75 C 45 75, 65 78, 95 80 Z"
              fill="url(#angelWingGradLeftCell)"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <path d="M 85 70 C 70 45, 55 30, 30 25" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 75 72 C 60 55, 45 48, 40 45" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </motion.div>

        {/* RIGHT ANGEL WING */}
        <motion.div
          animate={{
            rotateZ: [25, -20, 25],
            scaleX: [1, 0.85, 1],
            scaleY: [1, 1.12, 1],
          }}
          transition={{ duration: 0.22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[52%] top-[-10%] z-20 pointer-events-none origin-bottom-left"
          style={{ width: '46px', height: '46px' }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
            <defs>
              <linearGradient id="angelWingGradRightCell" x1="0%" y1="50%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#fde047" />
              </linearGradient>
            </defs>
            <path
              d="M 5 80 C 15 45, 40 15, 85 10 C 75 30, 55 40, 50 55 C 65 55, 75 65, 70 75 C 55 75, 35 78, 5 80 Z"
              fill="url(#angelWingGradRightCell)"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <path d="M 15 70 C 30 45, 45 30, 70 25" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 25 72 C 40 55, 55 48, 60 45" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </motion.div>

        {/* 4. ACTUAL 3D PAWN BODY */}
        <div
          className="w-[150%] h-[150%] relative z-30 shrink-0 overflow-visible"
          style={{
            transform: 'translateY(-24%)',
          }}
        >
          <LudoPawn
            id={`angel-${pawn.id}`}
            color={pawn.color}
            pawnIndex={pawn.pawnIndex}
            pathStep={pawn.pathStep}
            isSelected={false}
            isMovable={false}
          />
        </div>

        {/* 5. TRAILING CELESTIAL STARDUST & FEATHER PARTICLES */}
        {particles.map((p) => (
          <motion.div
            key={`particle-${p.id}`}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0.7, 0],
              scale: [0.3, 1.1, 0.7, 0.1],
              x: [0, p.x * 1.3, p.x * 2.2],
              y: [0, p.y + 20, p.y + 50],
              rotate: [0, p.rotation],
            }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeOut',
            }}
            className="absolute z-10 pointer-events-none"
            style={{ width: `${p.size}px`, height: `${p.size}px` }}
          >
            {p.type === 'feather' ? (
              <svg viewBox="0 0 24 24" className="w-full h-full text-white fill-white/80 drop-shadow-[0_0_4px_rgba(253,224,71,0.8)]">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5zM16 8L2 22M17.5 15H9" />
              </svg>
            ) : p.type === 'star' ? (
              <div className="w-full h-full text-yellow-300 font-black text-xs flex items-center justify-center drop-shadow-[0_0_6px_rgba(253,224,71,1)]">
                ✦
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-r from-white to-yellow-200 shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
            )}
          </motion.div>
        ))}

        {/* 6. TOUCHDOWN HEAVENLY BURST AT TARGET HOME */}
        {hasLanded && (
          <motion.div
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute w-24 h-24 rounded-full border-4 border-yellow-300 bg-yellow-200/40 blur-[1px] pointer-events-none z-40"
          />
        )}
      </motion.div>
    </div>
  );
};
