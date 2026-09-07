import React from 'react';

/**
 * High-fidelity pirate vector assets matching the Treasure Hunt Leaderboard art style.
 */

// 1. Classic Pirate Galleon Ship
export const PirateShipSvg: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <svg viewBox="0 0 120 110" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Water ripple underneath */}
    <path d="M15 94 C30 92, 45 96, 60 94 C75 92, 90 96, 105 94" stroke="#7a6245" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    <path d="M25 99 C40 97, 55 100, 70 98 C85 96, 95 99, 100 98" stroke="#7a6245" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    
    {/* Wooden Hull */}
    <path
      d="M18 64 C24 84, 42 93, 62 93 C82 93, 98 84, 104 64 L108 55 C80 57, 40 57, 14 55 Z"
      fill="#432213"
      stroke="#221109"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Upper deck yellow/gold trim band */}
    <path
      d="M16 57 C45 59, 78 59, 106 57 L105 63 C78 65, 45 65, 17 63 Z"
      fill="#d9822b"
      stroke="#221109"
      strokeWidth="1.5"
    />
    {/* Wood planks subtle lines */}
    <path d="M22 72 C45 78, 75 78, 100 72" stroke="#2a150b" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M28 81 C48 86, 72 86, 92 81" stroke="#2a150b" strokeWidth="1.5" strokeLinecap="round" />

    {/* Yellow/Gold Portholes */}
    <circle cx="38" cy="73" r="4.5" fill="#f59e0b" stroke="#221109" strokeWidth="2" />
    <circle cx="60" cy="74" r="4.5" fill="#f59e0b" stroke="#221109" strokeWidth="2" />
    <circle cx="82" cy="73" r="4.5" fill="#f59e0b" stroke="#221109" strokeWidth="2" />
    <circle cx="38" cy="73" r="2" fill="#221109" />
    <circle cx="60" cy="74" r="2" fill="#221109" />
    <circle cx="82" cy="73" r="2" fill="#221109" />

    {/* Stern Castle / Cabin on the right */}
    <path d="M88 56 L88 44 L104 44 L105 56 Z" fill="#432213" stroke="#221109" strokeWidth="2" />
    <rect x="91" y="47" width="5" height="5" rx="1" fill="#f59e0b" stroke="#221109" strokeWidth="1.2" />

    {/* Main Mast */}
    <line x1="58" y1="12" x2="58" y2="56" stroke="#2a150b" strokeWidth="3.5" strokeLinecap="round" />
    {/* Fore Mast */}
    <line x1="32" y1="24" x2="32" y2="56" stroke="#2a150b" strokeWidth="2.5" strokeLinecap="round" />
    {/* Bowsprit */}
    <line x1="18" y1="58" x2="4" y2="48" stroke="#2a150b" strokeWidth="2.5" strokeLinecap="round" />

    {/* Crow's Nest */}
    <path d="M53 25 L63 25 L62 30 L54 30 Z" fill="#432213" stroke="#221109" strokeWidth="1.5" />

    {/* Big Main Sail (Dark Black/Charcoal) */}
    <path
      d="M44 32 C58 35, 66 35, 76 32 C74 44, 70 51, 74 53 C62 55, 54 55, 46 53 C50 51, 46 44, 44 32 Z"
      fill="#1c1917"
      stroke="#0f0d0c"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Fore Sail */}
    <path
      d="M22 36 C30 38, 36 38, 42 36 C41 45, 39 49, 41 51 C34 52, 28 52, 23 51 C25 49, 23 45, 22 36 Z"
      fill="#292524"
      stroke="#0f0d0c"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />

    {/* Pirate Flag / Jolly Roger fluttering at mast top */}
    <path
      d="M58 12 L76 17 L58 22 Z"
      fill="#1c1917"
      stroke="#0f0d0c"
      strokeWidth="1.5"
    />
    <circle cx="64" cy="17" r="1.8" fill="#f5f5f4" />
  </svg>
);

// 2. Open Wooden Treasure Chest with Golden Doubloons & Gems
export const TreasureChestSvg: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <svg viewBox="0 0 110 95" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Chest Body */}
    <path
      d="M12 44 L16 84 C16 86, 18 88, 21 88 L89 88 C92 88, 94 86, 94 84 L98 44 Z"
      fill="#854d0e"
      stroke="#261505"
      strokeWidth="2.8"
      strokeLinejoin="round"
    />
    {/* Chest Plank divisions */}
    <line x1="14" y1="58" x2="96" y2="58" stroke="#542e09" strokeWidth="2" />
    <line x1="15" y1="72" x2="95" y2="72" stroke="#542e09" strokeWidth="2" />

    {/* Iron Straps on Body */}
    <rect x="25" y="44" width="9" height="44" fill="#1c1917" stroke="#0c0a09" strokeWidth="1.5" />
    <rect x="76" y="44" width="9" height="44" fill="#1c1917" stroke="#0c0a09" strokeWidth="1.5" />
    {/* Iron Corner Reinforcements */}
    <path d="M12 44 L20 44 L16 84 L12 84 Z" fill="#1c1917" opacity="0.8" />
    <path d="M98 44 L90 44 L94 84 L98 84 Z" fill="#1c1917" opacity="0.8" />

    {/* Lock Clasp */}
    <rect x="49" y="46" width="12" height="15" rx="2" fill="#d97706" stroke="#261505" strokeWidth="2" />
    <circle cx="55" cy="52" r="2" fill="#1c1917" />
    <line x1="55" y1="54" x2="55" y2="58" stroke="#1c1917" strokeWidth="1.5" />

    {/* Open Lid (Tipped Back) */}
    <path
      d="M6 35 C6 18, 30 10, 55 10 C80 10, 104 18, 104 35 L98 44 L12 44 Z"
      fill="#a16207"
      stroke="#261505"
      strokeWidth="2.8"
      strokeLinejoin="round"
    />
    <path
      d="M12 36 C12 24, 32 16, 55 16 C78 16, 98 24, 98 36"
      stroke="#713f12"
      strokeWidth="2"
      fill="none"
    />
    {/* Iron Straps on Lid */}
    <path d="M25 14 C25 24, 25 34, 25 44 L34 44 C34 34, 34 24, 34 13 Z" fill="#1c1917" stroke="#0c0a09" strokeWidth="1.5" />
    <path d="M76 13 C76 24, 76 34, 76 44 L85 44 C85 34, 85 24, 85 14 Z" fill="#1c1917" stroke="#0c0a09" strokeWidth="1.5" />

    {/* Overflowing Gold Coins & Treasures */}
    {/* Background heap */}
    <path d="M22 45 C30 32, 50 28, 60 30 C75 28, 85 35, 88 45 Z" fill="#f59e0b" />
    {/* Coins */}
    <circle cx="34" cy="38" r="5.5" fill="#fde047" stroke="#b45309" strokeWidth="1.5" />
    <circle cx="44" cy="35" r="5.5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
    <circle cx="55" cy="33" r="6" fill="#fde047" stroke="#b45309" strokeWidth="1.5" />
    <circle cx="67" cy="35" r="5.5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
    <circle cx="76" cy="39" r="5.5" fill="#fde047" stroke="#b45309" strokeWidth="1.5" />
    
    <circle cx="28" cy="44" r="5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
    <circle cx="38" cy="43" r="5.5" fill="#fde047" stroke="#b45309" strokeWidth="1.5" />
    <circle cx="49" cy="41" r="5.5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
    <circle cx="61" cy="42" r="5.5" fill="#fde047" stroke="#b45309" strokeWidth="1.5" />
    <circle cx="72" cy="43" r="5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
    <circle cx="82" cy="44" r="5" fill="#fde047" stroke="#b45309" strokeWidth="1.5" />

    {/* Glistening Ruby Gem */}
    <polygon points="50,30 54,25 60,25 64,30 57,37" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
    {/* Sparkling Diamonds/Stars */}
    <path d="M30 25 L32 20 L34 25 L39 27 L34 29 L32 34 L30 29 L25 27 Z" fill="#ffffff" />
    <path d="M78 22 L79.5 18 L81 22 L85 23.5 L81 25 L79.5 29 L78 25 L74 23.5 Z" fill="#fef08a" />
  </svg>
);

// 3. Laurel Wreath with Rank Numeral
export const LaurelWreathSvg: React.FC<{
  rank: number;
  className?: string;
  isGold?: boolean;
}> = ({ rank, className = 'w-10 h-10', isGold = false }) => {
  const leafColor = isGold ? '#d97706' : '#5c3317';
  const strokeColor = isGold ? '#92400e' : '#331908';
  const textColor = isGold ? '#78350f' : '#2e1507';

  return (
    <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Left branch stem */}
      <path
        d="M27 47 C16 45, 10 35, 10 24 C10 16, 15 10, 22 7"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right branch stem */}
      <path
        d="M27 47 C38 45, 44 35, 44 24 C44 16, 39 10, 32 7"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Left Leaves */}
      <path d="M12 40 C7 38, 7 32, 12 34 Z" fill={leafColor} />
      <path d="M9 31 C4 29, 5 23, 10 26 Z" fill={leafColor} />
      <path d="M8 21 C4 18, 6 12, 11 16 Z" fill={leafColor} />
      <path d="M12 13 C9 9, 13 4, 16 9 Z" fill={leafColor} />
      <path d="M18 7 C17 3, 22 1, 23 6 Z" fill={leafColor} />

      {/* Right Leaves */}
      <path d="M42 40 C47 38, 47 32, 42 34 Z" fill={leafColor} />
      <path d="M45 31 C50 29, 49 23, 44 26 Z" fill={leafColor} />
      <path d="M46 21 C50 18, 48 12, 43 16 Z" fill={leafColor} />
      <path d="M42 13 C45 9, 41 4, 38 9 Z" fill={leafColor} />
      <path d="M36 7 C37 3, 32 1, 31 6 Z" fill={leafColor} />

      {/* Center Rank Number */}
      <text
        x="27"
        y="32"
        textAnchor="middle"
        dominantBaseline="central"
        fill={textColor}
        fontSize={rank > 99 ? '15' : rank > 9 ? '18' : '22'}
        fontWeight="800"
        fontFamily="serif"
      >
        {rank}
      </text>
    </svg>
  );
};

// 4. Crossed Pirate Cutlasses / Swords
export const CrossedSwordsSvg: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Sword 1 (Top-Left to Bottom-Right) */}
    {/* Blade */}
    <path d="M10 8 C18 16, 26 26, 36 36 L34 38 C24 28, 14 18, 7 11 Z" fill="#9ca3af" stroke="#374151" strokeWidth="1" />
    <path d="M10 8 Q15 6 16 9 L34 38 Z" fill="#e5e7eb" />
    {/* Guard */}
    <path d="M30 33 C33 32, 38 37, 37 40 L34 37 Z" fill="#d97706" stroke="#78350f" strokeWidth="1" />
    {/* Handle / Pommel */}
    <line x1="34" y1="38" x2="41" y2="45" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
    <circle cx="42" cy="46" r="2" fill="#d97706" />

    {/* Sword 2 (Top-Right to Bottom-Left) */}
    {/* Blade */}
    <path d="M38 8 C30 16, 22 26, 12 36 L14 38 C24 28, 34 18, 41 11 Z" fill="#9ca3af" stroke="#374151" strokeWidth="1" />
    <path d="M38 8 Q33 6 32 9 L14 38 Z" fill="#e5e7eb" />
    {/* Guard */}
    <path d="M18 33 C15 32, 10 37, 11 40 L14 37 Z" fill="#d97706" stroke="#78350f" strokeWidth="1" />
    {/* Handle / Pommel */}
    <line x1="14" y1="38" x2="7" y2="45" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
    <circle cx="6" cy="46" r="2" fill="#d97706" />
  </svg>
);

// 5. Wooden Rum Barrels
export const RumBarrelsSvg: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 54 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Barrel 1 (standing on left) */}
    <path
      d="M10 10 C6 18, 6 26, 10 34 L22 34 C26 26, 26 18, 22 10 Z"
      fill="#854d0e"
      stroke="#261505"
      strokeWidth="1.8"
    />
    <ellipse cx="16" cy="10" rx="6" ry="2" fill="#a16207" stroke="#261505" strokeWidth="1" />
    {/* Metal Rings */}
    <path d="M8 17 C13 18, 19 18, 24 17" stroke="#1c1917" strokeWidth="1.8" />
    <path d="M8 27 C13 28, 19 28, 24 27" stroke="#1c1917" strokeWidth="1.8" />

    {/* Barrel 2 (leaning slightly on right) */}
    <g transform="rotate(24 36 24)">
      <path
        d="M30 8 C26 16, 26 24, 30 32 L40 32 C44 24, 44 16, 40 8 Z"
        fill="#713f12"
        stroke="#261505"
        strokeWidth="1.8"
      />
      <ellipse cx="35" cy="8" rx="5" ry="1.8" fill="#854d0e" stroke="#261505" strokeWidth="1" />
      <path d="M28 15 C33 16, 37 16, 42 15" stroke="#1c1917" strokeWidth="1.8" />
      <path d="M28 25 C33 26, 37 26, 42 25" stroke="#1c1917" strokeWidth="1.8" />
    </g>
  </svg>
);

// 6. Captain's Wooden Helm / Ship's Wheel
export const ShipWheelSvg: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Outer Rim */}
    <circle cx="16" cy="16" r="10" stroke="#451a03" strokeWidth="2.2" />
    {/* Inner Rim */}
    <circle cx="16" cy="16" r="6" stroke="#451a03" strokeWidth="1.5" />
    {/* Center Hub */}
    <circle cx="16" cy="16" r="3.2" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
    <circle cx="16" cy="16" r="1" fill="#fef3c7" />

    {/* 8 Handles / Spokes */}
    <line x1="16" y1="2" x2="16" y2="30" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
    <line x1="2" y1="16" x2="30" y2="16" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
    <line x1="6" y1="6" x2="26" y2="26" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
    <line x1="26" y1="6" x2="6" y2="26" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />

    {/* Handle Knobs */}
    <circle cx="16" cy="3" r="1.5" fill="#78350f" />
    <circle cx="16" cy="29" r="1.5" fill="#78350f" />
    <circle cx="3" cy="16" r="1.5" fill="#78350f" />
    <circle cx="29" cy="16" r="1.5" fill="#78350f" />
    <circle cx="6.8" cy="6.8" r="1.5" fill="#78350f" />
    <circle cx="25.2" cy="25.2" r="1.5" fill="#78350f" />
    <circle cx="25.2" cy="6.8" r="1.5" fill="#78350f" />
    <circle cx="6.8" cy="25.2" r="1.5" fill="#78350f" />
  </svg>
);

// 7. Pirate Cannon
export const PirateCannonSvg: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 46 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Wooden Carriage */}
    <path d="M12 22 L32 20 L30 28 L10 28 Z" fill="#854d0e" stroke="#261505" strokeWidth="1.5" />
    {/* Big Wheel */}
    <circle cx="20" cy="26" r="7" fill="#713f12" stroke="#261505" strokeWidth="2" />
    <circle cx="20" cy="26" r="3" fill="#1c1917" stroke="#261505" strokeWidth="1" />
    <circle cx="20" cy="26" r="1" fill="#fde047" />

    {/* Small Rear Wheel */}
    <circle cx="10" cy="28" r="4.5" fill="#713f12" stroke="#261505" strokeWidth="1.5" />

    {/* Black Iron Barrel angled up */}
    <path
      d="M10 20 L28 10 L34 11 L35 15 L28 17 L12 24 Z"
      fill="#1c1917"
      stroke="#0c0a09"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* Cannon Muzzle Rim */}
    <ellipse cx="34.5" cy="13" rx="2.2" ry="3.5" fill="#292524" stroke="#0c0a09" strokeWidth="1.5" />
    {/* Fuse */}
    <path d="M11 20 C9 17, 8 15, 9 13" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// 8. Nautical Anchor
export const NauticalAnchorSvg: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Top Ring */}
    <circle cx="18" cy="6" r="3.5" stroke="#261505" strokeWidth="2" />
    {/* Crossbar */}
    <line x1="8" y1="14" x2="28" y2="14" stroke="#261505" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="8" cy="14" r="1.5" fill="#261505" />
    <circle cx="28" cy="14" r="1.5" fill="#261505" />

    {/* Vertical Shank */}
    <line x1="18" y1="9" x2="18" y2="35" stroke="#261505" strokeWidth="3" strokeLinecap="round" />

    {/* Bottom Curved Flukes */}
    <path
      d="M5 26 C5 37, 31 37, 31 26"
      stroke="#261505"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    {/* Arrowhead Tips */}
    <polygon points="5,26 2,24 5,20" fill="#261505" />
    <polygon points="31,26 34,24 31,20" fill="#261505" />
  </svg>
);

// 9. Authentic Pirate Character Avatars matching the screenshot
export const PirateAvatarSvg: React.FC<{
  type: 1 | 2 | 3 | 4 | 5 | 6 | number;
  className?: string;
}> = ({ type, className = 'w-12 h-12' }) => {
  const avatarIndex = ((type - 1) % 6) + 1;

  if (avatarIndex === 1) {
    // 1. Captain Marco: Bicorne hat with skull, eyepatch over left eye, smiling kid pirate
    return (
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Background circle */}
        <circle cx="30" cy="30" r="28" fill="#e0c7a5" />
        {/* Body / Coat */}
        <path d="M16 56 C16 46, 22 42, 30 42 C38 42, 44 46, 44 56 Z" fill="#991b1b" />
        <path d="M26 42 L30 56 L34 42 Z" fill="#ffffff" />
        {/* Head */}
        <circle cx="30" cy="33" r="13" fill="#fcd34d" />
        {/* Smile */}
        <path d="M26 38 Q30 41 34 38" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        {/* Eyes: Right eye open, Left eye patch */}
        <circle cx="35" cy="33" r="2" fill="#1f2937" />
        <circle cx="25" cy="33" r="3.2" fill="#111827" />
        <line x1="17" y1="29" x2="33" y2="37" stroke="#111827" strokeWidth="1.2" />
        {/* Pirate Bicorne Hat */}
        <path
          d="M12 25 C14 10, 46 10, 48 25 C40 27, 20 27, 12 25 Z"
          fill="#1c1917"
          stroke="#0c0a09"
          strokeWidth="1.5"
        />
        <path d="M12 25 C18 20, 42 20, 48 25" stroke="#d97706" strokeWidth="1.5" />
        {/* Tiny skull on hat */}
        <circle cx="30" cy="18" r="2.5" fill="#f9fafb" />
        <rect x="29" y="20.5" width="2" height="1.5" rx="0.5" fill="#f9fafb" />
      </svg>
    );
  }

  if (avatarIndex === 2) {
    // 2. Joseph: Tricorn hat, handlebar mustache
    return (
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="30" cy="30" r="28" fill="#d8b894" />
        {/* Coat */}
        <path d="M16 56 C16 46, 22 42, 30 42 C38 42, 44 46, 44 56 Z" fill="#1e3a8a" />
        {/* Head */}
        <circle cx="30" cy="33" r="13" fill="#fcd34d" />
        {/* Eyes */}
        <circle cx="25" cy="32" r="2" fill="#1f2937" />
        <circle cx="35" cy="32" r="2" fill="#1f2937" />
        {/* Handlebar Mustache */}
        <path d="M23 37 Q27 35 30 38 Q33 35 37 37 Q40 40 35 39 Q30 40 25 39 Z" fill="#78350f" />
        {/* Tricorn Hat */}
        <path
          d="M10 24 C14 12, 30 9, 30 9 C30 9, 46 12, 50 24 C42 27, 18 27, 10 24 Z"
          fill="#292524"
          stroke="#0c0a09"
          strokeWidth="1.5"
        />
        <circle cx="30" cy="17" r="2.2" fill="#f9fafb" />
      </svg>
    );
  }

  if (avatarIndex === 3) {
    // 3. John: Red spotted pirate bandana
    return (
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="30" cy="30" r="28" fill="#ecd1b0" />
        {/* Shirt */}
        <path d="M16 56 C16 46, 22 42, 30 42 C38 42, 44 46, 44 56 Z" fill="#047857" />
        {/* Head */}
        <circle cx="30" cy="33" r="13" fill="#fed7aa" />
        {/* Smile & Eyes */}
        <circle cx="25" cy="34" r="2" fill="#1f2937" />
        <circle cx="35" cy="34" r="2" fill="#1f2937" />
        <path d="M26 39 Q30 42 34 39" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        {/* Red Spotted Bandana */}
        <path d="M17 29 C17 18, 43 18, 43 29 C36 27, 24 27, 17 29 Z" fill="#dc2626" />
        <circle cx="22" cy="24" r="1.5" fill="#ffffff" />
        <circle cx="30" cy="22" r="1.5" fill="#ffffff" />
        <circle cx="38" cy="24" r="1.5" fill="#ffffff" />
        <circle cx="26" cy="27" r="1.2" fill="#ffffff" />
        <circle cx="34" cy="27" r="1.2" fill="#ffffff" />
        {/* Bandana Knot on side */}
        <path d="M43 27 Q47 30 46 35 Q43 32 43 27 Z" fill="#dc2626" />
      </svg>
    );
  }

  if (avatarIndex === 4) {
    // 4. Marie: Pirate girl with red spotted bandana & cute hairstyle
    return (
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="30" cy="30" r="28" fill="#ebd2b4" />
        {/* Outfit */}
        <path d="M16 56 C16 46, 22 42, 30 42 C38 42, 44 46, 44 56 Z" fill="#b91c1c" />
        {/* Hair background */}
        <path d="M17 32 C13 38, 14 48, 18 50 C21 44, 21 36, 17 32 Z" fill="#78350f" />
        <path d="M43 32 C47 38, 46 48, 42 50 C39 44, 39 36, 43 32 Z" fill="#78350f" />
        {/* Head */}
        <circle cx="30" cy="33" r="12" fill="#fed7aa" />
        {/* Cheeks & Eyes */}
        <circle cx="25" cy="33" r="2" fill="#1f2937" />
        <circle cx="35" cy="33" r="2" fill="#1f2937" />
        <circle cx="23" cy="36" r="2" fill="#fca5a5" opacity="0.6" />
        <circle cx="37" cy="36" r="2" fill="#fca5a5" opacity="0.6" />
        <path d="M27 38 Q30 40 33 38" stroke="#991b1b" strokeWidth="1.5" strokeLinecap="round" />
        {/* Red Spotted Bandana */}
        <path d="M18 28 C18 18, 42 18, 42 28 C36 26, 24 26, 18 28 Z" fill="#dc2626" />
        <circle cx="24" cy="23" r="1.5" fill="#ffffff" />
        <circle cx="30" cy="21" r="1.5" fill="#ffffff" />
        <circle cx="36" cy="23" r="1.5" fill="#ffffff" />
        <circle cx="27" cy="26" r="1.2" fill="#ffffff" />
        <circle cx="33" cy="26" r="1.2" fill="#ffffff" />
      </svg>
    );
  }

  if (avatarIndex === 5) {
    // 5. Daniel: Red bandana, blue-and-white striped sailor shirt, green parrot on shoulder
    return (
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="30" cy="30" r="28" fill="#dfc6a3" />
        {/* Blue and white striped shirt */}
        <path d="M16 56 C16 46, 22 42, 30 42 C38 42, 44 46, 44 56 Z" fill="#1e40af" />
        <line x1="16" y1="46" x2="44" y2="46" stroke="#ffffff" strokeWidth="2.5" />
        <line x1="18" y1="52" x2="42" y2="52" stroke="#ffffff" strokeWidth="2.5" />
        {/* Head */}
        <circle cx="30" cy="33" r="13" fill="#fed7aa" />
        <circle cx="25" cy="33" r="2" fill="#1f2937" />
        <circle cx="35" cy="33" r="2" fill="#1f2937" />
        <path d="M26 38 Q30 41 34 38" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        {/* Red Bandana with skull */}
        <path d="M17 28 C17 18, 43 18, 43 28 C36 26, 24 26, 17 28 Z" fill="#b91c1c" />
        <circle cx="30" cy="22" r="2" fill="#ffffff" />
        {/* Green Parrot on shoulder */}
        <path d="M42 38 C44 35, 48 36, 48 40 C48 45, 44 48, 42 46 Z" fill="#16a34a" />
        <path d="M48 37 L51 38 L48 39 Z" fill="#f59e0b" />
        <circle cx="46" cy="37" r="0.8" fill="#111827" />
      </svg>
    );
  }

  // 6. Eusebiu: Black captain hat with skull & crossbones, blue striped shirt
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="30" cy="30" r="28" fill="#e8cfad" />
      {/* Blue striped shirt */}
      <path d="M16 56 C16 46, 22 42, 30 42 C38 42, 44 46, 44 56 Z" fill="#1d4ed8" />
      <line x1="16" y1="47" x2="44" y2="47" stroke="#ffffff" strokeWidth="2.5" />
      <line x1="18" y1="53" x2="42" y2="53" stroke="#ffffff" strokeWidth="2.5" />
      {/* Blonde hair strands */}
      <path d="M18 31 C15 36, 17 40, 20 40" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
      <path d="M42 31 C45 36, 43 40, 40 40" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
      {/* Head */}
      <circle cx="30" cy="33" r="13" fill="#fed7aa" />
      <circle cx="25" cy="33" r="2" fill="#1f2937" />
      <circle cx="35" cy="33" r="2" fill="#1f2937" />
      <path d="M26 38 Q30 41 34 38" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
      {/* Black Captain Hat */}
      <path
        d="M12 25 C14 11, 46 11, 48 25 C40 27, 20 27, 12 25 Z"
        fill="#18181b"
        stroke="#09090b"
        strokeWidth="1.5"
      />
      <circle cx="30" cy="18" r="2.5" fill="#f4f4f5" />
      <rect x="29" y="20.5" width="2" height="1.5" rx="0.5" fill="#f4f4f5" />
    </svg>
  );
};
