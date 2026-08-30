import React from 'react';
import { PlayerColor } from '../../../types/game';

export interface PawnShapeProps {
  color: PlayerColor;
  skinId?: string;
  sizePx?: number;
  isSelected?: boolean;
  isMovable?: boolean;
}

/**
 * Photorealistic 3D Pawn Rendering Engine:
 * 1. halma_gloss_3d: Exact 3D High-Gloss Halma Pin (Screenshot 1)
 *    - Perfect spherical head with raytraced specular reflection glint & ambient shadow
 *    - Seamlessly tapered concave neck curving into weighted bell body
 *    - Dual vertical high-gloss studio window reflections
 *    - Curved cylindrical base bevel with soft ground contact occlusion
 *
 * 2. royal_queen_monarch: Royal Sovereign Queen Monarch (Screenshot 2)
 *    - Spherical finial orb bead with highlight glint
 *    - Flared 5-petal scalloped coronal chalice crown with illuminated rim
 *    - Double concentric torus collar rings with horizontal specular sheen
 *    - Tapered fluted central column with vertical glossy window reflection
 *    - Double-beveled weighted pedestal plinth base
 *
 * 3. royal_crowned: Original Default Royal Monarch Crowned
 *    - Classic royal jewel-crowned glossy tournament piece
 *
 * 4. Other skins (classic_gloss, crystal_gem, mecha_cyber, sovereign, shield)
 */
export const Pawn3DRenderer: React.FC<PawnShapeProps> = ({
  color,
  skinId = 'royal_crowned',
  sizePx = 38,
  isSelected = false,
  isMovable = false,
}) => {
  const uid = React.useId().replace(/:/g, '');

  // -----------------------------------------------------------------
  // 1. HIGH-PRECISION 3D LIGHT & DEPTH COLOR PALETTES
  // -----------------------------------------------------------------
  const halmaPalette = {
    red: {
      shadowOcclusion: '#380007',
      deepBase: '#660010',
      darkCore: '#9e0018',
      midTone: '#d90429',
      brightTone: '#ef233c',
      specularPeak: '#ff8597',
      ambientColor: 'rgba(239, 35, 60, 0.85)',
    },
    blue: {
      shadowOcclusion: '#011230',
      deepBase: '#02215c',
      darkCore: '#00438a',
      midTone: '#0077b6',
      brightTone: '#0096c7',
      specularPeak: '#90e0ef',
      ambientColor: 'rgba(0, 150, 199, 0.85)',
    },
    green: {
      shadowOcclusion: '#03140d',
      deepBase: '#082f1e',
      darkCore: '#155738',
      midTone: '#2d6a4f',
      brightTone: '#40916c',
      specularPeak: '#95d5b2',
      ambientColor: 'rgba(64, 145, 108, 0.85)',
    },
    yellow: {
      shadowOcclusion: '#2e1700',
      deepBase: '#5e3300',
      darkCore: '#9e5a00',
      midTone: '#d97706',
      brightTone: '#f59e0b',
      specularPeak: '#fde68a',
      ambientColor: 'rgba(245, 158, 11, 0.85)',
    },
  }[color];

  const queenPalette = {
    red: {
      shadowOcclusion: '#29000d',
      deepBase: '#54001c',
      darkCore: '#85002d',
      midTone: '#ba0040',
      brightTone: '#e60050',
      specularPeak: '#ff70a0',
      ambientColor: 'rgba(230, 0, 80, 0.9)',
    },
    blue: {
      shadowOcclusion: '#010d29',
      deepBase: '#062363',
      darkCore: '#0d429e',
      midTone: '#1e65d4',
      brightTone: '#3b82f6',
      specularPeak: '#93c5fd',
      ambientColor: 'rgba(59, 130, 246, 0.9)',
    },
    green: {
      shadowOcclusion: '#011c0c',
      deepBase: '#053d1d',
      darkCore: '#0a6934',
      midTone: '#109950',
      brightTone: '#10b981',
      specularPeak: '#6ee7b7',
      ambientColor: 'rgba(16, 185, 129, 0.9)',
    },
    yellow: {
      shadowOcclusion: '#2e1000',
      deepBase: '#592500',
      darkCore: '#8c4000',
      midTone: '#c76600',
      brightTone: '#f59e0b',
      specularPeak: '#fef08a',
      ambientColor: 'rgba(245, 158, 11, 0.9)',
    },
  }[color];

  const crownedPalette = {
    red: {
      darkCore: '#7a0019',
      midTone: '#dc2626',
      brightTone: '#f87171',
      crownGoldDark: '#b45309',
      crownGoldMid: '#fbbf24',
      crownGoldLight: '#fef08a',
      glow: 'rgba(239, 68, 68, 0.8)',
    },
    blue: {
      darkCore: '#1e3a8a',
      midTone: '#2563eb',
      brightTone: '#60a5fa',
      crownGoldDark: '#b45309',
      crownGoldMid: '#fbbf24',
      crownGoldLight: '#fef08a',
      glow: 'rgba(59, 130, 246, 0.8)',
    },
    green: {
      darkCore: '#064e3b',
      midTone: '#059669',
      brightTone: '#34d399',
      crownGoldDark: '#b45309',
      crownGoldMid: '#fbbf24',
      crownGoldLight: '#fef08a',
      glow: 'rgba(16, 185, 129, 0.8)',
    },
    yellow: {
      darkCore: '#78350f',
      midTone: '#d97706',
      brightTone: '#fbbf24',
      crownGoldDark: '#78350f',
      crownGoldMid: '#fef08a',
      crownGoldLight: '#ffffff',
      glow: 'rgba(245, 158, 11, 0.8)',
    },
  }[color];

  // =================================================================
  // 1. DESIGN 1: PHOTOREALISTIC HIGH-GLOSS HALMA 3D PIN (Screenshot 1)
  // =================================================================
  if (skinId === 'halma_gloss_3d') {
    const pal = halmaPalette;

    return (
      <svg
        viewBox="0 0 100 136"
        width={sizePx}
        height={(sizePx * 136) / 100}
        className="overflow-visible select-none pointer-events-none"
        style={{
          filter: isSelected
            ? `drop-shadow(0 0 10px ${pal.ambientColor}) drop-shadow(0 12px 14px rgba(0,0,0,0.7))`
            : isMovable
            ? `drop-shadow(0 0 6px ${pal.ambientColor}) drop-shadow(0 8px 10px rgba(0,0,0,0.5))`
            : `drop-shadow(0 6px 8px rgba(0,0,0,0.45))`,
        }}
      >
        <defs>
          {/* Ground Soft Occlusion Shadow */}
          <radialGradient id={`${uid}-h-gnd`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#000000" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Spherical 3D Ball Head Gradient (Top-Left Key Light) */}
          <radialGradient id={`${uid}-h-head`} cx="36%" cy="26%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="18%" stopColor={pal.brightTone} />
            <stop offset="55%" stopColor={pal.midTone} />
            <stop offset="85%" stopColor={pal.darkCore} />
            <stop offset="100%" stopColor={pal.deepBase} />
          </radialGradient>

          {/* Smooth Concave Neck & Bell Body Cylindrical 3D Gradient */}
          <linearGradient id={`${uid}-h-body`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={pal.shadowOcclusion} />
            <stop offset="12%" stopColor={pal.deepBase} />
            <stop offset="36%" stopColor={pal.midTone} />
            <stop offset="50%" stopColor={pal.brightTone} />
            <stop offset="60%" stopColor={pal.specularPeak} stopOpacity="0.7" />
            <stop offset="76%" stopColor={pal.midTone} />
            <stop offset="90%" stopColor={pal.darkCore} />
            <stop offset="100%" stopColor={pal.deepBase} />
          </linearGradient>

          {/* Base Rim Soft Bevel */}
          <linearGradient id={`${uid}-h-rim`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={pal.brightTone} />
            <stop offset="45%" stopColor={pal.midTone} />
            <stop offset="100%" stopColor={pal.shadowOcclusion} />
          </linearGradient>

          {/* Vertical Studio Window Glaze */}
          <linearGradient id={`${uid}-h-glaze`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Ground Contact Shadow */}
        <ellipse cx="50" cy="127" rx="36" ry="7" fill={`url(#${uid}-h-gnd)`} />

        {/* 2. Sculpted Halma Bell Body */}
        <path
          d="
            M 50 38
            C 44 38, 40 45, 41 54
            C 42 66, 26 95, 20 114
            C 18 122, 24 125, 50 125
            C 76 125, 82 122, 80 114
            C 74 95, 58 66, 59 54
            C 60 45, 56 38, 50 38
            Z
          "
          fill={`url(#${uid}-h-body)`}
        />

        {/* 3. Base Rounded Bottom Lip & Bevel */}
        <ellipse cx="50" cy="123" rx="31" ry="3.5" fill={`url(#${uid}-h-rim)`} opacity="0.9" />

        {/* 4. Left High-Gloss Specular Vertical Light Streak */}
        <path
          d="
            M 44 48
            C 42 56, 32 86, 28 112
            C 31 115, 36 116, 40 116
            C 44 94, 48 66, 48 48
            Z
          "
          fill={`url(#${uid}-h-glaze)`}
        />

        {/* 5. Center-Left Bright Specular Highlight Line */}
        <path
          d="
            M 42 52
            C 41 58, 35 88, 31 110
            C 33 111, 36 112, 38 112
            C 42 90, 45 68, 44 52
            Z
          "
          fill="#ffffff"
          opacity="0.65"
        />

        {/* 6. Spherical Head Ball */}
        <circle cx="50" cy="27" r="22" fill={`url(#${uid}-h-head)`} />

        {/* 7. Spherical Glare Highlight Spot */}
        <ellipse
          cx="42"
          cy="18"
          rx="7"
          ry="5"
          transform="rotate(-28 42 18)"
          fill="#ffffff"
          opacity="0.9"
        />
        <circle cx="39.5" cy="15.5" r="2.8" fill="#ffffff" opacity="0.98" />

        {/* 8. Subtle Rim Light on Opposite Edge */}
        <path
          d="M 68 22 C 72 28, 66 38, 58 43"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          opacity="0.35"
        />
      </svg>
    );
  }

  // =================================================================
  // 2. DESIGN 2: ROYAL SOVEREIGN QUEEN MONARCH (Screenshot 2)
  // =================================================================
  if (skinId === 'royal_queen_monarch') {
    const qPal = queenPalette;

    return (
      <svg
        viewBox="0 0 100 156"
        width={sizePx}
        height={(sizePx * 156) / 100}
        className="overflow-visible select-none pointer-events-none"
        style={{
          filter: isSelected
            ? `drop-shadow(0 0 12px ${qPal.ambientColor}) drop-shadow(0 14px 16px rgba(0,0,0,0.75))`
            : isMovable
            ? `drop-shadow(0 0 7px ${qPal.ambientColor}) drop-shadow(0 9px 11px rgba(0,0,0,0.5))`
            : `drop-shadow(0 7px 9px rgba(0,0,0,0.45))`,
        }}
      >
        <defs>
          {/* Ground Occlusion Shadow */}
          <radialGradient id={`${uid}-q-gnd`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#000000" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Multi-Band Horizontal Specular Cylinder Gradient */}
          <linearGradient id={`${uid}-q-col`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={qPal.shadowOcclusion} />
            <stop offset="16%" stopColor={qPal.deepBase} />
            <stop offset="40%" stopColor={qPal.midTone} />
            <stop offset="52%" stopColor={qPal.brightTone} />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="72%" stopColor={qPal.midTone} />
            <stop offset="88%" stopColor={qPal.darkCore} />
            <stop offset="100%" stopColor={qPal.deepBase} />
          </linearGradient>

          {/* Finial Ball Radial Gradient */}
          <radialGradient id={`${uid}-q-finial`} cx="38%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="30%" stopColor={qPal.brightTone} />
            <stop offset="70%" stopColor={qPal.midTone} />
            <stop offset="100%" stopColor={qPal.deepBase} />
          </radialGradient>
        </defs>

        {/* 1. Ground Contact Shadow */}
        <ellipse cx="50" cy="149" rx="40" ry="6.5" fill={`url(#${uid}-q-gnd)`} />

        {/* 2. Tier 1 Base (Bottom Pedestal Plinth) */}
        <path
          d="
            M 16 140
            C 16 135, 26 130, 50 130
            C 74 130, 84 135, 84 140
            C 84 147, 74 149, 50 149
            C 26 149, 16 147, 16 140
            Z
          "
          fill={`url(#${uid}-q-col)`}
        />

        {/* 3. Tier 2 Base (Curved Torus Cushion Foot) */}
        <path
          d="
            M 18 127
            C 14 116, 24 108, 50 108
            C 76 108, 86 116, 82 127
            C 78 134, 22 134, 18 127
            Z
          "
          fill={`url(#${uid}-q-col)`}
        />

        {/* Base Specular Highlight Stripe */}
        <path
          d="M 36 113 C 44 111, 56 111, 64 113 C 60 119, 40 119, 36 113 Z"
          fill="#ffffff"
          opacity="0.5"
        />

        {/* 4. Fluted Central Queen Column */}
        <path
          d="
            M 34 108
            C 41 79, 39 69, 37 59
            C 42 57, 58 57, 63 59
            C 61 69, 59 79, 66 108
            Z
          "
          fill={`url(#${uid}-q-col)`}
        />

        {/* Vertical Column Specular Glare */}
        <path
          d="
            M 48 59
            C 47 71, 46 87, 47 106
            C 49 106, 52 106, 54 106
            C 53 87, 52 71, 52 59
            Z
          "
          fill="#ffffff"
          opacity="0.6"
        />

        {/* 5. Queen Double Torus Collar Rings */}
        <ellipse cx="50" cy="58" rx="20" ry="5.5" fill={`url(#${uid}-q-col)`} />
        <ellipse cx="50" cy="51" rx="17" ry="4.5" fill={`url(#${uid}-q-col)`} />

        {/* Collar Highlights */}
        <ellipse cx="50" cy="56" rx="15" ry="2" fill="#ffffff" opacity="0.4" />
        <ellipse cx="50" cy="49.5" rx="12" ry="1.5" fill="#ffffff" opacity="0.5" />

        {/* 6. Flared Queen Coronal Chalice & Scalloped Petal Crown */}
        <path
          d="
            M 36 50
            C 35 45, 27 32, 25 28
            C 31 30, 35 34, 39 31
            C 43 26, 46 24, 50 26
            C 54 24, 57 26, 61 31
            C 65 34, 69 30, 75 28
            C 73 32, 65 45, 64 50
            Z
          "
          fill={`url(#${uid}-q-col)`}
        />

        {/* Crown Rim Specular Light Highlight */}
        <path
          d="
            M 27 29
            C 33 32, 37 34, 40 32
            C 43 28, 47 27, 50 28
            C 53 27, 57 28, 60 32
            C 63 34, 67 32, 73 29
          "
          stroke="#ffffff"
          strokeWidth="1.6"
          fill="none"
          opacity="0.8"
        />

        {/* 7. Crown Top Finial Collar & Orb Bead */}
        <ellipse cx="50" cy="22" rx="7.5" ry="2.5" fill={`url(#${uid}-q-col)`} />
        <circle cx="50" cy="14" r="5.5" fill={`url(#${uid}-q-finial)`} />

        {/* Finial Ball Specular Glint */}
        <circle cx="48" cy="12" r="1.6" fill="#ffffff" opacity="0.95" />
      </svg>
    );
  }

  // =================================================================
  // 3. ORIGINAL DEFAULT: ROYAL MONARCH CROWNED (royal_crowned)
  // =================================================================
  const cPal = crownedPalette;

  return (
    <svg
      viewBox="0 0 100 130"
      width={sizePx}
      height={(sizePx * 130) / 100}
      className="overflow-visible select-none pointer-events-none"
      style={{
        filter: isSelected
          ? `drop-shadow(0 0 10px ${cPal.glow}) drop-shadow(0 12px 14px rgba(0,0,0,0.7))`
          : `drop-shadow(0 6px 8px rgba(0,0,0,0.45))`,
      }}
    >
      <defs>
        {/* Ground Occlusion Shadow */}
        <radialGradient id={`${uid}-cr-gnd`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* 3D Spherical Head */}
        <radialGradient id={`${uid}-cr-head`} cx="38%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="25%" stopColor={cPal.brightTone} />
          <stop offset="65%" stopColor={cPal.midTone} />
          <stop offset="100%" stopColor={cPal.darkCore} />
        </radialGradient>

        {/* 3D Bell Body */}
        <linearGradient id={`${uid}-cr-body`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={cPal.darkCore} />
          <stop offset="22%" stopColor={cPal.midTone} />
          <stop offset="48%" stopColor={cPal.brightTone} />
          <stop offset="58%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="76%" stopColor={cPal.midTone} />
          <stop offset="100%" stopColor={cPal.darkCore} />
        </linearGradient>

        {/* Royal Crown Gold Gradient */}
        <linearGradient id={`${uid}-cr-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={cPal.crownGoldLight} />
          <stop offset="50%" stopColor={cPal.crownGoldMid} />
          <stop offset="100%" stopColor={cPal.crownGoldDark} />
        </linearGradient>
      </defs>

      {/* 1. Ground Shadow */}
      <ellipse cx="50" cy="122" rx="34" ry="6.5" fill={`url(#${uid}-cr-gnd)`} />

      {/* 2. Pawn Bell Body */}
      <path
        d="M 50 44 C 42 44, 38 52, 38 62 C 38 78, 22 100, 18 114 C 18 122, 82 122, 82 114 C 78 100, 62 78, 62 62 C 62 52, 58 44, 50 44 Z"
        fill={`url(#${uid}-cr-body)`}
      />

      {/* Base Bevel Ring */}
      <ellipse cx="50" cy="119" rx="30" ry="3" fill="#ffffff" opacity="0.3" />

      {/* Body Specular Reflection */}
      <path
        d="M 44 54 C 43 62, 36 90, 32 112 C 35 113, 38 114, 40 114 C 44 94, 48 68, 48 54 Z"
        fill="#ffffff"
        opacity="0.4"
      />

      {/* 3. Spherical Head */}
      <circle cx="50" cy="34" r="19" fill={`url(#${uid}-cr-head)`} />
      <circle cx="43" cy="27" r="4" fill="#ffffff" opacity="0.8" />

      {/* 4. 3D Royal Gold Coronet */}
      <path
        d="M 32 24 L 36 12 L 43 18 L 50 8 L 57 18 L 64 12 L 68 24 C 68 28, 32 28, 32 24 Z"
        fill={`url(#${uid}-cr-gold)`}
        stroke="#78350f"
        strokeWidth="0.8"
      />
      <circle cx="36" cy="12" r="1.8" fill="#ffffff" />
      <circle cx="50" cy="8" r="2.2" fill="#ffffff" />
      <circle cx="64" cy="12" r="1.8" fill="#ffffff" />
    </svg>
  );
};
