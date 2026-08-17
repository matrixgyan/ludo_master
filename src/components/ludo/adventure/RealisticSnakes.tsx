import React from 'react';
import { ADVENTURE_SNAKES, getTileCoordinates, SnakeConfig, SnakeTheme } from './types';

interface RealisticSnakesProps {
  highlightId?: string | null;
}

export const RealisticSnakes: React.FC<RealisticSnakesProps> = ({ highlightId }) => {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-16 overflow-visible"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Emerald Tree Boa Gradient */}
        <linearGradient id="emeraldSnakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="30%" stopColor="#059669" />
          <stop offset="70%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>

        {/* Ruby Pit Viper Gradient */}
        <linearGradient id="rubySnakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="35%" stopColor="#dc2626" />
          <stop offset="70%" stopColor="#991b1b" />
          <stop offset="100%" stopColor="#450a0a" />
        </linearGradient>

        {/* Golden Aztec Anaconda Gradient */}
        <linearGradient id="goldSnakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="30%" stopColor="#eab308" />
          <stop offset="70%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#713f12" />
        </linearGradient>

        {/* Temple King Cobra Gradient */}
        <linearGradient id="cobraSnakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="25%" stopColor="#b45309" />
          <stop offset="65%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#1c1917" />
        </linearGradient>

        {/* Shadow Python Gradient */}
        <linearGradient id="shadowSnakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="35%" stopColor="#4338ca" />
          <stop offset="70%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Fire Serpent Gradient */}
        <linearGradient id="fireSnakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="20%" stopColor="#f97316" />
          <stop offset="60%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>

        {/* Realistic Ground Shadow */}
        <filter id="snakeGroundShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="8" dy="14" stdDeviation="8" floodColor="#000000" floodOpacity="0.9" />
        </filter>
      </defs>

      {ADVENTURE_SNAKES.map((snake) => (
        <SnakeItem key={snake.id} snake={snake} isHighlighted={highlightId === snake.id} />
      ))}
    </svg>
  );
};

const SnakeItem: React.FC<{ snake: SnakeConfig; isHighlighted: boolean }> = ({
  snake,
  isHighlighted,
}) => {
  const headCoords = getTileCoordinates(snake.head);
  const tailCoords = getTileCoordinates(snake.tail);

  // SVG Coordinates (0..1000)
  const hx = headCoords.xPercent * 10;
  const hy = headCoords.yPercent * 10;
  const tx = tailCoords.xPercent * 10;
  const ty = tailCoords.yPercent * 10;

  // Compute organic S-curve control points
  const dx = tx - hx;
  const dy = ty - hy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Orthogonal offset for realistic serpent curvature
  const curveSign = (snake.head + snake.tail) % 2 === 0 ? 1 : -1;
  const perpX = (-dy / dist) * 70 * curveSign;
  const perpY = (dx / dist) * 70 * curveSign;

  const cp1x = hx + dx * 0.35 + perpX;
  const cp1y = hy + dy * 0.35 + perpY;

  const cp2x = hx + dx * 0.65 - perpX;
  const cp2y = hy + dy * 0.65 - perpY;

  const pathData = `M ${hx} ${hy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;

  const getSnakeGrad = (theme: SnakeTheme) => {
    switch (theme) {
      case 'emerald_tree_boa':
        return 'url(#emeraldSnakeGrad)';
      case 'ruby_pit_viper':
        return 'url(#rubySnakeGrad)';
      case 'golden_anaconda':
        return 'url(#goldSnakeGrad)';
      case 'king_cobra':
        return 'url(#cobraSnakeGrad)';
      case 'shadow_python':
        return 'url(#shadowSnakeGrad)';
      case 'fire_serpent':
        return 'url(#fireSnakeGrad)';
      default:
        return 'url(#emeraldSnakeGrad)';
    }
  };

  const getEyeColor = (theme: SnakeTheme) => {
    switch (theme) {
      case 'emerald_tree_boa':
        return '#fef08a';
      case 'ruby_pit_viper':
        return '#fef08a';
      case 'golden_anaconda':
        return '#ef4444';
      case 'king_cobra':
        return '#dc2626';
      case 'shadow_python':
        return '#38bdf8';
      case 'fire_serpent':
        return '#facc15';
      default:
        return '#fef08a';
    }
  };

  const snakeGradient = getSnakeGrad(snake.theme);
  const eyeColor = getEyeColor(snake.theme);

  // Angle of head direction based on initial curve
  const headAngle = Math.atan2(cp1y - hy, cp1x - hx) * (180 / Math.PI) + 180;

  return (
    <g filter="url(#snakeGroundShadow)" className="transition-all duration-300">
      {/* Glow when highlighted / striking */}
      {isHighlighted && (
        <path
          d={pathData}
          fill="none"
          stroke="#f43f5e"
          strokeWidth="38"
          strokeLinecap="round"
          opacity="0.6"
          className="animate-pulse"
        />
      )}

      {/* 1. SNAKE MAIN CURVED BODY (THICK COILING BODY) */}
      <path
        d={pathData}
        fill="none"
        stroke={snakeGradient}
        strokeWidth="20"
        strokeLinecap="round"
      />

      {/* 2. SCALE RIDGE / BACK PATTERN (SERPENT SPINE) */}
      <path
        d={pathData}
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeOpacity="0.45"
        strokeDasharray="6, 8"
        strokeLinecap="round"
      />

      {/* 3. DIAMOND PATTERN ALONG BODY */}
      <path
        d={pathData}
        fill="none"
        stroke="#000000"
        strokeWidth="12"
        strokeOpacity="0.3"
        strokeDasharray="4, 14"
        strokeLinecap="round"
      />

      {/* 4. TAPERED TAIL AT DESTINATION */}
      <circle cx={tx} cy={ty} r="5" fill="#1c1917" stroke={snakeGradient} strokeWidth="2" />

      {/* 5. 3D DETAILED MENACING SERPENT HEAD */}
      <g transform={`translate(${hx}, ${hy}) rotate(${headAngle})`}>
        {/* Forked Flicking Tongue */}
        <path
          d="M 16 0 L 26 -4 M 26 -4 L 32 -7 M 26 -4 L 32 -1"
          stroke="#ef4444"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Cobra Hood Flare / Head Silhouette */}
        <ellipse cx="6" cy="0" rx="16" ry="12" fill={snakeGradient} stroke="#000000" strokeWidth="1.5" />
        <ellipse cx="6" cy="0" rx="14" ry="10" fill="#ffffff" fillOpacity="0.15" />

        {/* Crown Ridge */}
        <path d="M 0 -7 Q 8 0 0 7" stroke="#000000" strokeWidth="2" fill="none" opacity="0.6" />

        {/* Realistic Glowing Eyes with Slit Pupils */}
        <ellipse cx="10" cy="-6" rx="3" ry="2.2" fill={eyeColor} />
        <ellipse cx="10" cy="-6" rx="1" ry="2" fill="#000000" />

        <ellipse cx="10" cy="6" rx="3" ry="2.2" fill={eyeColor} />
        <ellipse cx="10" cy="6" rx="1" ry="2" fill="#000000" />

        {/* Nostril pits */}
        <circle cx="16" cy="-2" r="0.8" fill="#000000" />
        <circle cx="16" cy="2" r="0.8" fill="#000000" />
      </g>
    </g>
  );
};
