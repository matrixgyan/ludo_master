import React from 'react';
import { PlayerColor } from '../../../types/game';
import { PawnSkinDefinition } from '../../../game/themeRegistry';

interface PawnSvgRendererProps {
  color: PlayerColor;
  skin: PawnSkinDefinition;
  sizePx?: number;
  isSelected?: boolean;
  isMovable?: boolean;
}

export const PawnSvgRenderer: React.FC<PawnSvgRendererProps> = ({
  color,
  skin,
  sizePx = 36,
  isSelected = false,
  isMovable = false,
}) => {
  const colorDef = skin?.colors?.[color] || {
    fillGradient: 'linear-gradient(135deg, #ff4d6d 0%, #d90429 50%, #7a0014 100%)',
    capColor: '#ff758f',
    highlight: '#ffffff',
    glowColor: 'rgba(255, 0, 50, 0.95)',
    borderColor: '#59000e',
  };
  const uniqueId = `pawn-${skin?.id || 'def'}-${color}-${Math.random().toString(36).substring(2, 6)}`;

  // 1. DESIGN 1: HIGH-GLOSS HALMA 3D PAWN (From Screenshot 1)
  if (skin?.id === 'halma_gloss_3d') {
    // Map standard player colors to rich 3D studio tones
    const colorThemes = {
      red: {
        baseDark: '#67000d',
        midTone: '#cb181d',
        highTone: '#ef3b2c',
        highlightLight: '#ff9999',
        ambientGlow: 'rgba(239, 59, 44, 0.8)',
      },
      blue: {
        baseDark: '#08306b',
        midTone: '#08519c',
        highTone: '#2171b5',
        highlightLight: '#9ecae1',
        ambientGlow: 'rgba(33, 113, 181, 0.8)',
      },
      green: {
        baseDark: '#00441b',
        midTone: '#006d2c',
        highTone: '#238b45',
        highlightLight: '#a1d99b',
        ambientGlow: 'rgba(35, 139, 69, 0.8)',
      },
      yellow: {
        baseDark: '#7f2704',
        midTone: '#d94801',
        highTone: '#f16913',
        highlightLight: '#fdd0a2',
        ambientGlow: 'rgba(241, 105, 19, 0.8)',
      },
    }[color];

    return (
      <svg
        viewBox="0 0 100 130"
        width={sizePx}
        height={(sizePx * 130) / 100}
        className="overflow-visible"
        style={{
          filter: isSelected
            ? `drop-shadow(0 0 8px ${colorThemes.ambientGlow}) drop-shadow(0 12px 14px rgba(0,0,0,0.65))`
            : isMovable
            ? `drop-shadow(0 0 5px ${colorThemes.ambientGlow}) drop-shadow(0 8px 10px rgba(0,0,0,0.45))`
            : `drop-shadow(0 6px 8px rgba(0,0,0,0.45))`,
        }}
      >
        <defs>
          {/* Ground Soft Contact Shadow */}
          <radialGradient id={`${uniqueId}-ground-shadow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#000000" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Spherical Head 3D Light Gradient */}
          <radialGradient id={`${uniqueId}-head-grad`} cx="38%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="25%" stopColor={colorThemes.highTone} />
            <stop offset="70%" stopColor={colorThemes.midTone} />
            <stop offset="100%" stopColor={colorThemes.baseDark} />
          </radialGradient>

          {/* Neck and Body Cylindrical/Bell 3D Gradient */}
          <linearGradient id={`${uniqueId}-body-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorThemes.baseDark} />
            <stop offset="18%" stopColor={colorThemes.midTone} />
            <stop offset="42%" stopColor={colorThemes.highTone} />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="75%" stopColor={colorThemes.midTone} />
            <stop offset="100%" stopColor={colorThemes.baseDark} />
          </linearGradient>

          {/* Base Rim Soft Bevel */}
          <linearGradient id={`${uniqueId}-rim-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorThemes.highTone} />
            <stop offset="50%" stopColor={colorThemes.midTone} />
            <stop offset="100%" stopColor={colorThemes.baseDark} />
          </linearGradient>
        </defs>

        {/* 1. Ground Contact Shadow */}
        <ellipse cx="50" cy="122" rx="36" ry="7" fill={`url(#${uniqueId}-ground-shadow)`} />

        {/* 2. Seamless Smooth Halma Body (Tapered Neck to Bell Base) */}
        <path
          d="
            M 50 38
            C 42 38, 38 46, 39 56
            C 40 68, 24 95, 18 112
            C 16 118, 22 122, 50 122
            C 78 122, 84 118, 82 112
            C 76 95, 60 68, 61 56
            C 62 46, 58 38, 50 38
            Z
          "
          fill={`url(#${uniqueId}-body-grad)`}
        />

        {/* 3. Base Rounded Lip & Bevel Outline */}
        <ellipse
          cx="50"
          cy="119"
          rx="32"
          ry="3.5"
          fill={`url(#${uniqueId}-rim-grad)`}
          opacity="0.8"
        />

        {/* 4. High-Gloss Vertical Specular Sheen (Body Curve Reflection) */}
        <path
          d="
            M 44 48
            C 43 54, 34 85, 30 110
            C 33 113, 38 114, 42 114
            C 46 95, 49 65, 48 48
            Z
          "
          fill="#ffffff"
          opacity="0.32"
        />
        <path
          d="
            M 42 52
            C 41 58, 35 88, 32 108
            C 34 110, 37 111, 39 111
            C 43 92, 45 68, 44 52
            Z
          "
          fill="#ffffff"
          opacity="0.55"
        />

        {/* 5. Spherical Head (Top Ball) */}
        <circle cx="50" cy="27" r="22" fill={`url(#${uniqueId}-head-grad)`} />

        {/* 6. Spherical Glare Highlight (Studio Reflection Spot) */}
        <ellipse
          cx="43"
          cy="18"
          rx="6.5"
          ry="4.5"
          transform="rotate(-25 43 18)"
          fill="#ffffff"
          opacity="0.85"
        />
        <circle cx="41" cy="16" r="2.5" fill="#ffffff" opacity="0.95" />

        {/* 7. Secondary Soft Reflected Light (Rim Glow) */}
        <path
          d="M 68 25 C 72 32, 65 42, 57 46"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.25"
        />
      </svg>
    );
  }

  // 2. DESIGN 2: ROYAL SOVEREIGN QUEEN MONARCH (From Screenshot 2)
  if (skin?.id === 'royal_queen_monarch') {
    const colorThemes = {
      red: {
        darkTone: '#4a0018',
        midTone: '#9e0031',
        brightTone: '#e60050',
        lightPeak: '#ff6699',
        ambientGlow: 'rgba(230, 0, 80, 0.85)',
      },
      blue: {
        darkTone: '#03045e',
        midTone: '#0077b6',
        brightTone: '#0096c7',
        lightPeak: '#90e0ef',
        ambientGlow: 'rgba(0, 150, 199, 0.85)',
      },
      green: {
        darkTone: '#003e1f',
        midTone: '#1b7a48',
        brightTone: '#2dc653',
        lightPeak: '#99e2b4',
        ambientGlow: 'rgba(45, 198, 83, 0.85)',
      },
      yellow: {
        darkTone: '#541500',
        midTone: '#d00000',
        brightTone: '#ffba08',
        lightPeak: '#fff3b0',
        ambientGlow: 'rgba(255, 186, 8, 0.85)',
      },
    }[color];

    return (
      <svg
        viewBox="0 0 100 150"
        width={sizePx}
        height={(sizePx * 150) / 100}
        className="overflow-visible"
        style={{
          filter: isSelected
            ? `drop-shadow(0 0 10px ${colorThemes.ambientGlow}) drop-shadow(0 14px 16px rgba(0,0,0,0.7))`
            : isMovable
            ? `drop-shadow(0 0 6px ${colorThemes.ambientGlow}) drop-shadow(0 10px 12px rgba(0,0,0,0.5))`
            : `drop-shadow(0 8px 10px rgba(0,0,0,0.5))`,
        }}
      >
        <defs>
          {/* Ground Shadow */}
          <radialGradient id={`${uniqueId}-queen-ground`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#000000" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Queen Horizontal Cylinder Gradients */}
          <linearGradient id={`${uniqueId}-queen-col`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorThemes.darkTone} />
            <stop offset="20%" stopColor={colorThemes.midTone} />
            <stop offset="45%" stopColor={colorThemes.brightTone} />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="70%" stopColor={colorThemes.brightTone} />
            <stop offset="85%" stopColor={colorThemes.midTone} />
            <stop offset="100%" stopColor={colorThemes.darkTone} />
          </linearGradient>

          {/* Finial Ball Gradient */}
          <radialGradient id={`${uniqueId}-queen-ball`} cx="38%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="30%" stopColor={colorThemes.brightTone} />
            <stop offset="70%" stopColor={colorThemes.midTone} />
            <stop offset="100%" stopColor={colorThemes.darkTone} />
          </radialGradient>
        </defs>

        {/* 1. Ground Contact Shadow */}
        <ellipse cx="50" cy="144" rx="38" ry="6.5" fill={`url(#${uniqueId}-queen-ground)`} />

        {/* 2. Tier 1 Base (Bottom Pedestal Plinth) */}
        <path
          d="
            M 18 136
            C 18 132, 28 128, 50 128
            C 72 128, 82 132, 82 136
            C 82 142, 72 144, 50 144
            C 28 144, 18 142, 18 136
            Z
          "
          fill={`url(#${uniqueId}-queen-col)`}
        />

        {/* 3. Tier 2 Base (Curved Torus Base Roll) */}
        <path
          d="
            M 20 124
            C 16 114, 25 106, 50 106
            C 75 106, 84 114, 80 124
            C 76 130, 24 130, 20 124
            Z
          "
          fill={`url(#${uniqueId}-queen-col)`}
        />

        {/* Base Specular Highlight Stripe */}
        <path
          d="M 38 110 C 44 109, 56 109, 62 110 C 58 116, 42 116, 38 110 Z"
          fill="#ffffff"
          opacity="0.4"
        />

        {/* 4. Fluted Central Queen Column (Waist to Collar) */}
        <path
          d="
            M 36 106
            C 42 78, 40 68, 38 58
            C 42 56, 58 56, 62 58
            C 60 68, 58 78, 64 106
            Z
          "
          fill={`url(#${uniqueId}-queen-col)`}
        />

        {/* Vertical Column Specular Glare */}
        <path
          d="
            M 48 58
            C 47 70, 46 86, 47 104
            C 49 104, 52 104, 54 104
            C 53 86, 52 70, 52 58
            Z
          "
          fill="#ffffff"
          opacity="0.5"
        />

        {/* 5. Queen Double Torus Collar Rings */}
        <ellipse cx="50" cy="57" rx="19" ry="5.5" fill={`url(#${uniqueId}-queen-col)`} />
        <ellipse cx="50" cy="50" rx="16" ry="4.5" fill={`url(#${uniqueId}-queen-col)`} />

        {/* Collar Highlights */}
        <ellipse cx="50" cy="55" rx="15" ry="2" fill="#ffffff" opacity="0.35" />
        <ellipse cx="50" cy="48.5" rx="12" ry="1.5" fill="#ffffff" opacity="0.45" />

        {/* 6. Flared Queen Coronal Chalice & Scalloped Petal Crown */}
        <path
          d="
            M 37 49
            C 36 44, 28 32, 26 28
            C 32 30, 36 34, 40 31
            C 44 26, 47 24, 50 26
            C 53 24, 56 26, 60 31
            C 64 34, 68 30, 74 28
            C 72 32, 64 44, 63 49
            Z
          "
          fill={`url(#${uniqueId}-queen-col)`}
        />

        {/* Crown Rim Specular Light */}
        <path
          d="
            M 28 29
            C 34 32, 38 34, 41 32
            C 44 28, 48 27, 50 28
            C 52 27, 56 28, 59 32
            C 62 34, 66 32, 72 29
          "
          stroke="#ffffff"
          strokeWidth="1.5"
          fill="none"
          opacity="0.75"
        />

        {/* 7. Crown Top Finial Collar & Orb Bead */}
        <ellipse cx="50" cy="22" rx="7" ry="2.5" fill={`url(#${uniqueId}-queen-col)`} />
        <circle cx="50" cy="14" r="5.5" fill={`url(#${uniqueId}-queen-ball)`} />

        {/* Finial Ball Specular Spot */}
        <circle cx="48" cy="12" r="1.5" fill="#ffffff" opacity="0.9" />
      </svg>
    );
  }

  // 3. DEFAULT/FALLBACK SVG STYLES (Monarch, Specular, Crystal, Mecha, etc.)
  return (
    <svg
      viewBox="0 0 100 120"
      width={sizePx}
      height={(sizePx * 120) / 100}
      className="overflow-visible"
      style={{
        filter: isSelected
          ? `drop-shadow(0 0 8px ${colorDef.glowColor}) drop-shadow(0 10px 12px rgba(0,0,0,0.6))`
          : `drop-shadow(0 6px 8px rgba(0,0,0,0.45))`,
      }}
    >
      <defs>
        <radialGradient id={`${uniqueId}-def-shadow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uniqueId}-def-head`} cx="38%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="35%" stopColor={colorDef.capColor} />
          <stop offset="100%" stopColor={colorDef.borderColor} />
        </radialGradient>
        <linearGradient id={`${uniqueId}-def-body`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colorDef.borderColor} />
          <stop offset="45%" stopColor={colorDef.capColor} />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor={colorDef.borderColor} />
        </linearGradient>
      </defs>

      <ellipse cx="50" cy="114" rx="32" ry="6" fill={`url(#${uniqueId}-def-shadow)`} />
      <path
        d="M 50 36 C 42 36, 38 45, 38 56 C 38 70, 22 96, 18 108 C 18 116, 82 116, 82 108 C 78 96, 62 70, 62 56 C 62 45, 58 36, 50 36 Z"
        fill={`url(#${uniqueId}-def-body)`}
      />
      <circle cx="50" cy="26" r="20" fill={`url(#${uniqueId}-def-head)`} />
      <circle cx="44" cy="20" r="4" fill="#ffffff" opacity="0.75" />
    </svg>
  );
};
