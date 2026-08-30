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
 * Photorealistic 3D Pawn Models exactly matching:
 * 1. halma_gloss_3d: Classic High-Gloss Ceramic Halma Pin (Screenshot 1)
 *    - Perfect spherical head with soft studio curved gloss
 *    - Elegant concave tapered neck
 *    - Smooth flared bell body with rounded base rim
 *    - High-gloss vertical studio window reflections
 *
 * 2. royal_queen_monarch: Royal High-Gloss Queen Monarch (Screenshot 2)
 *    - Spherical finial bead on top
 *    - Flared 5-petal royal coronet chalice crown
 *    - Dual concentric torus collar neck rings
 *    - Fluted vertical column pillar with specular sheen
 *    - Double-beveled weighted pedestal plinth foot with studio reflections
 */
export const Pawn3DRenderer: React.FC<PawnShapeProps> = ({
  color,
  skinId = 'halma_gloss_3d',
  sizePx = 36,
  isSelected = false,
  isMovable = false,
}) => {
  const uid = React.useId().replace(/:/g, '');

  // -------------------------------------------------------------
  // COLOR PALETTES (Red, Blue, Green, Yellow) with 3D Depth
  // -------------------------------------------------------------
  const halmaPalette = {
    red: {
      deepShadow: '#5c000e',
      darkCore: '#9e0019',
      midTone: '#d90429',
      brightGlow: '#ef233c',
      specularPeak: '#ff8597',
      pureWhite: '#ffffff',
      ambientColor: 'rgba(239, 35, 60, 0.85)',
      ringBorder: '#ffccd5',
    },
    blue: {
      deepShadow: '#03045e',
      darkCore: '#00509d',
      midTone: '#0077b6',
      brightGlow: '#0096c7',
      specularPeak: '#90e0ef',
      pureWhite: '#ffffff',
      ambientColor: 'rgba(0, 150, 199, 0.85)',
      ringBorder: '#caf0f8',
    },
    green: {
      deepShadow: '#081c15',
      darkCore: '#1b4332',
      midTone: '#2d6a4f',
      brightGlow: '#40916c',
      specularPeak: '#95d5b2',
      pureWhite: '#ffffff',
      ambientColor: 'rgba(64, 145, 108, 0.85)',
      ringBorder: '#d8f3dc',
    },
    yellow: {
      deepShadow: '#4a2800',
      darkCore: '#9e5a00',
      midTone: '#d97706',
      brightGlow: '#f59e0b',
      specularPeak: '#fde68a',
      pureWhite: '#ffffff',
      ambientColor: 'rgba(245, 158, 11, 0.85)',
      ringBorder: '#fef3c7',
    },
  }[color];

  const queenPalette = {
    red: {
      deepShadow: '#3d0014',
      darkCore: '#7a0026',
      midTone: '#b8003a',
      brightGlow: '#e6004c',
      specularPeak: '#ff6699',
      pureWhite: '#ffffff',
      ambientColor: 'rgba(230, 0, 76, 0.9)',
    },
    blue: {
      deepShadow: '#021844',
      darkCore: '#0c3577',
      midTone: '#1e5bb8',
      brightGlow: '#3b82f6',
      specularPeak: '#93c5fd',
      pureWhite: '#ffffff',
      ambientColor: 'rgba(59, 130, 246, 0.9)',
    },
    green: {
      deepShadow: '#022c15',
      darkCore: '#09572d',
      midTone: '#138548',
      brightGlow: '#10b981',
      specularPeak: '#6ee7b7',
      pureWhite: '#ffffff',
      ambientColor: 'rgba(16, 185, 129, 0.9)',
    },
    yellow: {
      deepShadow: '#451a03',
      darkCore: '#78350f',
      midTone: '#b45309',
      brightGlow: '#eab308',
      specularPeak: '#fef08a',
      pureWhite: '#ffffff',
      ambientColor: 'rgba(234, 179, 8, 0.9)',
    },
  }[color];

  // =============================================================
  // 1. DESIGN 1: HIGH-GLOSS HALMA 3D PIN PAWN (Exact Screenshot 1)
  // =============================================================
  if (skinId === 'halma_gloss_3d' || skinId === 'specular_3d_gloss' || skinId === 'dubai_sunset_pawn') {
    const pal = halmaPalette;

    return (
      <svg
        viewBox="0 0 100 135"
        width={sizePx}
        height={(sizePx * 135) / 100}
        className="overflow-visible select-none pointer-events-none"
        style={{
          filter: isSelected
            ? `drop-shadow(0 0 10px ${pal.ambientColor}) drop-shadow(0 14px 16px rgba(0,0,0,0.75))`
            : isMovable
            ? `drop-shadow(0 0 6px ${pal.ambientColor}) drop-shadow(0 8px 10px rgba(0,0,0,0.5))`
            : `drop-shadow(0 6px 8px rgba(0,0,0,0.45))`,
        }}
      >
        <defs>
          {/* Ground Soft Contact Occlusion Shadow */}
          <radialGradient id={`${uid}-halma-ground`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#000000" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Spherical 3D Ball Head Gradient (Top Left High-Light Source) */}
          <radialGradient id={`${uid}-head-ball`} cx="36%" cy="28%" r="62%">
            <stop offset="0%" stopColor={pal.pureWhite} stopOpacity="0.95" />
            <stop offset="18%" stopColor={pal.brightGlow} />
            <stop offset="55%" stopColor={pal.midTone} />
            <stop offset="85%" stopColor={pal.darkCore} />
            <stop offset="100%" stopColor={pal.deepShadow} />
          </radialGradient>

          {/* Smooth Concave Neck & Bell Body Cylindrical Gradient */}
          <linearGradient id={`${uid}-body-cylinder`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={pal.deepShadow} />
            <stop offset="14%" stopColor={pal.darkCore} />
            <stop offset="38%" stopColor={pal.midTone} />
            <stop offset="52%" stopColor={pal.brightGlow} />
            <stop offset="60%" stopColor={pal.specularPeak} stopOpacity="0.65" />
            <stop offset="78%" stopColor={pal.midTone} />
            <stop offset="92%" stopColor={pal.darkCore} />
            <stop offset="100%" stopColor={pal.deepShadow} />
          </linearGradient>

          {/* Base Plinth Rounded Rim Reflection */}
          <linearGradient id={`${uid}-base-bevel`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={pal.brightGlow} />
            <stop offset="40%" stopColor={pal.midTone} />
            <stop offset="100%" stopColor={pal.deepShadow} />
          </linearGradient>

          {/* Studio Vertical Reflection Strip */}
          <linearGradient id={`${uid}-gloss-sheen`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Ground Contact Shadow */}
        <ellipse cx="50" cy="126" rx="36" ry="7" fill={`url(#${uid}-halma-ground)`} />

        {/* 2. Seamless Sculpted Halma Bell Body (Exact Curve Silhouette) */}
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
          fill={`url(#${uid}-body-cylinder)`}
        />

        {/* 3. Base Rounded Bottom Lip & Bevel */}
        <ellipse cx="50" cy="122.5" rx="31" ry="3.5" fill={`url(#${uid}-base-bevel)`} opacity="0.9" />

        {/* 4. Left High-Gloss Specular Vertical Light Streak (Matching Screenshot 1) */}
        <path
          d="
            M 44 48
            C 42 56, 32 86, 28 112
            C 31 115, 36 116, 40 116
            C 44 94, 48 66, 48 48
            Z
          "
          fill="url(#gloss-sheen)"
          fillOpacity="0.45"
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
          opacity="0.6"
        />

        {/* 6. Spherical Head Ball (Smooth Gloss Sphere) */}
        <circle cx="50" cy="27" r="22" fill={`url(#${uid}-head-ball)`} />

        {/* 7. Spherical Glare Highlight Spot (Studio Softbox Reflection) */}
        <ellipse
          cx="42"
          cy="18"
          rx="7"
          ry="5"
          transform="rotate(-28 42 18)"
          fill="#ffffff"
          opacity="0.88"
        />
        <circle cx="39.5" cy="15.5" r="2.8" fill="#ffffff" opacity="0.98" />

        {/* 8. Subtle Rim Light (Back Scatter on opposite edge) */}
        <path
          d="M 68 22 C 72 28, 66 38, 58 43"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
      </svg>
    );
  }

  // =============================================================
  // 2. DESIGN 2: ROYAL SOVEREIGN QUEEN MONARCH (Exact Screenshot 2)
  // =============================================================
  const qPal = queenPalette;

  return (
    <svg
      viewBox="0 0 100 155"
      width={sizePx}
      height={(sizePx * 155) / 100}
      className="overflow-visible select-none pointer-events-none"
      style={{
        filter: isSelected
          ? `drop-shadow(0 0 12px ${qPal.ambientColor}) drop-shadow(0 16px 18px rgba(0,0,0,0.8))`
          : isMovable
          ? `drop-shadow(0 0 7px ${qPal.ambientColor}) drop-shadow(0 10px 12px rgba(0,0,0,0.55))`
          : `drop-shadow(0 8px 10px rgba(0,0,0,0.5))`,
      }}
    >
      <defs>
        {/* Ground Occlusion Shadow */}
        <radialGradient id={`${uid}-queen-ground`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#000000" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Multi-Band Horizontal Specular Cylinder Gradient */}
        <linearGradient id={`${uid}-queen-col`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={qPal.deepShadow} />
          <stop offset="18%" stopColor={qPal.darkCore} />
          <stop offset="42%" stopColor={qPal.midTone} />
          <stop offset="54%" stopColor={qPal.brightGlow} />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="72%" stopColor={qPal.midTone} />
          <stop offset="88%" stopColor={qPal.darkCore} />
          <stop offset="100%" stopColor={qPal.deepShadow} />
        </linearGradient>

        {/* Finial Ball Radial Gradient */}
        <radialGradient id={`${uid}-queen-finial`} cx="38%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="30%" stopColor={qPal.brightGlow} />
          <stop offset="70%" stopColor={qPal.midTone} />
          <stop offset="100%" stopColor={qPal.deepShadow} />
        </radialGradient>
      </defs>

      {/* 1. Ground Contact Shadow */}
      <ellipse cx="50" cy="148" rx="40" ry="6.5" fill={`url(#${uid}-queen-ground)`} />

      {/* 2. Tier 1 Base (Bottom Pedestal Plinth) */}
      <path
        d="
          M 16 139
          C 16 135, 26 130, 50 130
          C 74 130, 84 135, 84 139
          C 84 146, 74 148, 50 148
          C 26 148, 16 146, 16 139
          Z
        "
        fill={`url(#${uid}-queen-col)`}
      />

      {/* 3. Tier 2 Base (Curved Torus Cushion Foot) */}
      <path
        d="
          M 18 126
          C 14 115, 24 107, 50 107
          C 76 107, 86 115, 82 126
          C 78 133, 22 133, 18 126
          Z
        "
        fill={`url(#${uid}-queen-col)`}
      />

      {/* Base Specular Highlight Stripe */}
      <path
        d="M 36 112 C 44 110, 56 110, 64 112 C 60 118, 40 118, 36 112 Z"
        fill="#ffffff"
        opacity="0.5"
      />

      {/* 4. Fluted Central Queen Column (Waist to Collar) */}
      <path
        d="
          M 34 107
          C 41 78, 39 68, 37 58
          C 42 56, 58 56, 63 58
          C 61 68, 59 78, 66 107
          Z
        "
        fill={`url(#${uid}-queen-col)`}
      />

      {/* Vertical Column Specular Glare (Studio Window Reflection) */}
      <path
        d="
          M 48 58
          C 47 70, 46 86, 47 105
          C 49 105, 52 105, 54 105
          C 53 86, 52 70, 52 58
          Z
        "
        fill="#ffffff"
        opacity="0.6"
      />

      {/* 5. Queen Double Torus Collar Rings */}
      <ellipse cx="50" cy="57" rx="20" ry="5.5" fill={`url(#${uid}-queen-col)`} />
      <ellipse cx="50" cy="50" rx="17" ry="4.5" fill={`url(#${uid}-queen-col)`} />

      {/* Collar Highlights */}
      <ellipse cx="50" cy="55" rx="15" ry="2" fill="#ffffff" opacity="0.4" />
      <ellipse cx="50" cy="48.5" rx="12" ry="1.5" fill="#ffffff" opacity="0.5" />

      {/* 6. Flared Queen Coronal Chalice & Scalloped Petal Crown (Exact from Screenshot 2) */}
      <path
        d="
          M 36 49
          C 35 44, 27 31, 25 27
          C 31 29, 35 33, 39 30
          C 43 25, 46 23, 50 25
          C 54 23, 57 25, 61 30
          C 65 33, 69 29, 75 27
          C 73 31, 65 44, 64 49
          Z
        "
        fill={`url(#${uid}-queen-col)`}
      />

      {/* Crown Rim Specular Light Highlight */}
      <path
        d="
          M 27 28
          C 33 31, 37 33, 40 31
          C 43 27, 47 26, 50 27
          C 53 26, 57 27, 60 31
          C 63 33, 67 31, 73 28
        "
        stroke="#ffffff"
        strokeWidth="1.6"
        fill="none"
        opacity="0.8"
      />

      {/* 7. Crown Top Finial Collar & Orb Bead */}
      <ellipse cx="50" cy="21.5" rx="7.5" ry="2.5" fill={`url(#${uid}-queen-col)`} />
      <circle cx="50" cy="13.5" r="5.5" fill={`url(#${uid}-queen-finial)`} />

      {/* Finial Ball Specular Glint */}
      <circle cx="48" cy="11.5" r="1.6" fill="#ffffff" opacity="0.95" />
    </svg>
  );
};
