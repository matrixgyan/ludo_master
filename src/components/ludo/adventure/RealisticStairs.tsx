import React from 'react';
import { ADVENTURE_LADDERS, getTileCoordinates, LadderConfig } from './types';

interface RealisticStairsProps {
  highlightId?: string | null;
}

export const RealisticStairs: React.FC<RealisticStairsProps> = ({ highlightId }) => {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-15 overflow-visible"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Wood Texture / Gradient for Ladders */}
        <linearGradient id="woodRailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="35%" stopColor="#92400e" />
          <stop offset="70%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>

        {/* Gold Stairway Gradient */}
        <linearGradient id="goldStairsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="30%" stopColor="#f59e0b" />
          <stop offset="70%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>

        {/* Stone Step Texture */}
        <linearGradient id="stoneStepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="50%" stopColor="#4b5563" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>

        {/* Rung Highlight Gradient */}
        <linearGradient id="rungHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>

        {/* Realistic Shadow Filter */}
        <filter id="ladderDropShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="6" dy="12" stdDeviation="6" floodColor="#000000" floodOpacity="0.85" />
        </filter>
      </defs>

      {ADVENTURE_LADDERS.map((ladder) => (
        <LadderItem key={ladder.id} ladder={ladder} isHighlighted={highlightId === ladder.id} />
      ))}
    </svg>
  );
};

const LadderItem: React.FC<{ ladder: LadderConfig; isHighlighted: boolean }> = ({
  ladder,
  isHighlighted,
}) => {
  const startCoords = getTileCoordinates(ladder.start);
  const destCoords = getTileCoordinates(ladder.dest);

  // Convert percentage (0..100) to SVG viewbox (0..1000)
  const x1 = startCoords.xPercent * 10;
  const y1 = startCoords.yPercent * 10;
  const x2 = destCoords.xPercent * 10;
  const y2 = destCoords.yPercent * 10;

  // Vector calculation for ladder width & rungs
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / length;
  const ny = dx / length;

  // Ladder half-width in SVG units (approx 20 units)
  const halfW = 20;

  // Side Rails Points
  const leftX1 = x1 + nx * halfW;
  const leftY1 = y1 + ny * halfW;
  const leftX2 = x2 + nx * halfW;
  const leftY2 = y2 + ny * halfW;

  const rightX1 = x1 - nx * halfW;
  const rightY1 = y1 - ny * halfW;
  const rightX2 = x2 - nx * halfW;
  const rightY2 = y2 - ny * halfW;

  // Calculate number of rungs along the ladder (roughly 1 every 40 units)
  const rungCount = Math.max(4, Math.floor(length / 42));
  const rungs = [];

  for (let i = 1; i < rungCount; i++) {
    const t = i / rungCount;
    const rx1 = leftX1 + (leftX2 - leftX1) * t;
    const ry1 = leftY1 + (leftY2 - leftY1) * t;
    const rx2 = rightX1 + (rightX2 - rightX1) * t;
    const ry2 = rightY1 + (rightY2 - rightY1) * t;
    rungs.push({ rx1, ry1, rx2, ry2, t });
  }

  const isGold = ladder.type === 'golden_staircase';
  const isStone = ladder.type === 'ancient_stone_steps';
  const railStroke = isGold ? 'url(#goldStairsGrad)' : isStone ? 'url(#stoneStepGrad)' : 'url(#woodRailGrad)';

  return (
    <g filter="url(#ladderDropShadow)" className="transition-all duration-300">
      {/* Dynamic Golden Glow when Highlighted */}
      {isHighlighted && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#fbbf24"
          strokeWidth="60"
          strokeLinecap="round"
          opacity="0.5"
          className="animate-pulse"
        />
      )}

      {/* Left Rail */}
      <line
        x1={leftX1}
        y1={leftY1}
        x2={leftX2}
        y2={leftY2}
        stroke={railStroke}
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* Left Rail Highlight Bevel */}
      <line
        x1={leftX1 - 1}
        y1={leftY1 - 1}
        x2={leftX2 - 1}
        y2={leftY2 - 1}
        stroke={isGold ? '#fff' : '#fde68a'}
        strokeWidth="2"
        strokeOpacity="0.7"
        strokeLinecap="round"
      />

      {/* Right Rail */}
      <line
        x1={rightX1}
        y1={rightY1}
        x2={rightX2}
        y2={rightY2}
        stroke={railStroke}
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* Right Rail Highlight Bevel */}
      <line
        x1={rightX1 - 1}
        y1={rightY1 - 1}
        x2={rightX2 - 1}
        y2={rightY2 - 1}
        stroke={isGold ? '#fff' : '#fde68a'}
        strokeWidth="2"
        strokeOpacity="0.7"
        strokeLinecap="round"
      />

      {/* Rungs (Steps) */}
      {rungs.map((rung, idx) => (
        <g key={idx}>
          {/* Step Drop Shadow */}
          <line
            x1={rung.rx1}
            y1={rung.ry1 + 3}
            x2={rung.rx2}
            y2={rung.ry2 + 3}
            stroke="#000000"
            strokeWidth="6"
            strokeOpacity="0.7"
            strokeLinecap="round"
          />
          {/* Step Main Body */}
          <line
            x1={rung.rx1}
            y1={rung.ry1}
            x2={rung.rx2}
            y2={rung.ry2}
            stroke={isGold ? 'url(#goldStairsGrad)' : 'url(#rungHighlight)'}
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Step Top Light Reflection */}
          <line
            x1={rung.rx1}
            y1={rung.ry1 - 1.5}
            x2={rung.rx2}
            y2={rung.ry2 - 1.5}
            stroke="#ffffff"
            strokeWidth="2"
            strokeOpacity="0.8"
            strokeLinecap="round"
          />

          {/* Rope Ties / Bindings on both ends */}
          <circle cx={rung.rx1} cy={rung.ry1} r="4" fill="#78350f" stroke="#451a03" strokeWidth="1" />
          <circle cx={rung.rx2} cy={rung.ry2} r="4" fill="#78350f" stroke="#451a03" strokeWidth="1" />
        </g>
      ))}

      {/* Start and End Brass Anchor Rings */}
      <circle cx={x1} cy={y1} r="7" fill="#d97706" stroke="#fef08a" strokeWidth="2" />
      <circle cx={x2} cy={y2} r="7" fill="#d97706" stroke="#fef08a" strokeWidth="2" />
    </g>
  );
};
