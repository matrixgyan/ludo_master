import React from 'react';

export type SupportedNetworkKey =
  | 'optimism'
  | 'ethereum'
  | 'arbitrum'
  | 'bsc'
  | 'polygon'
  | 'base'
  | 'avalanche'
  | 'usdt'
  | string;

interface NetworkLogoProps {
  networkKey: SupportedNetworkKey;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
}

export const NetworkLogo: React.FC<NetworkLogoProps> = ({
  networkKey,
  size = 'md',
  className = '',
  showGlow = false,
}) => {
  const normalizedKey = (networkKey || '').toLowerCase();

  const sizeDimensions = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  }[size];

  const glowStyles: Record<string, string> = {
    optimism: 'drop-shadow-[0_0_8px_rgba(255,4,32,0.6)]',
    ethereum: 'drop-shadow-[0_0_8px_rgba(98,126,234,0.6)]',
    arbitrum: 'drop-shadow-[0_0_8px_rgba(40,160,240,0.6)]',
    bsc: 'drop-shadow-[0_0_8px_rgba(243,186,47,0.6)]',
    polygon: 'drop-shadow-[0_0_8px_rgba(130,71,229,0.6)]',
    base: 'drop-shadow-[0_0_8px_rgba(0,82,255,0.6)]',
    avalanche: 'drop-shadow-[0_0_8px_rgba(232,65,66,0.6)]',
    usdt: 'drop-shadow-[0_0_8px_rgba(38,161,123,0.6)]',
  };

  const glowClass = showGlow ? (glowStyles[normalizedKey] || 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]') : '';

  // 1. OPTIMISM (Official Red Circle with bold white OP)
  if (normalizedKey === 'optimism' || normalizedKey === 'op') {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeDimensions} shrink-0 ${glowClass} ${className}`}
        aria-label="Optimism Logo"
      >
        <circle cx="50" cy="50" r="50" fill="#FF0420" />
        {/* Letter O */}
        <path
          d="M33.6 30C23.8 30 16 38.6 16 49.8C16 61.1 23.8 69.8 33.6 69.8C43.4 69.8 51.2 61.1 51.2 49.8C51.2 38.6 43.4 30 33.6 30ZM33.6 60.8C28.8 60.8 24.9 55.9 24.9 49.8C24.9 43.8 28.8 38.9 33.6 38.9C38.4 38.9 42.3 43.8 42.3 49.8C42.3 55.9 38.4 60.8 33.6 60.8Z"
          fill="white"
        />
        {/* Letter P */}
        <path
          d="M56.8 30.5H71.2C78.4 30.5 84 35.6 84 42.9C84 50.2 78.4 55.3 71.2 55.3H65.7V69.5H56.8V30.5ZM65.7 46.8H70.8C73.4 46.8 75.3 45.1 75.3 42.9C75.3 40.7 73.4 39 70.8 39H65.7V46.8Z"
          fill="white"
        />
      </svg>
    );
  }

  // 2. ETHEREUM (Official faceted prism with classic gradient & dark-theme badge)
  if (normalizedKey === 'ethereum' || normalizedKey === 'eth') {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeDimensions} shrink-0 ${glowClass} ${className}`}
        aria-label="Ethereum Logo"
      >
        <circle cx="50" cy="50" r="50" fill="#627EEA" />
        <g transform="translate(18, 14) scale(0.64)">
          <path d="M50 0L48.6 4.7V68.3L50 69.7L81.7 51L50 0Z" fill="#FFFFFF" fillOpacity="0.602" />
          <path d="M50 0L18.3 51L50 69.7V37.3V0Z" fill="#FFFFFF" />
          <path d="M50 75.4L49 76.6V100L50 102.9L81.8 56.7L50 75.4Z" fill="#FFFFFF" fillOpacity="0.602" />
          <path d="M50 102.9V75.4L18.3 56.7L50 102.9Z" fill="#FFFFFF" />
          <path d="M50 69.7L81.7 51L50 37.3V69.7Z" fill="#FFFFFF" fillOpacity="0.2" />
          <path d="M18.3 51L50 69.7V37.3L18.3 51Z" fill="#FFFFFF" fillOpacity="0.602" />
        </g>
      </svg>
    );
  }

  // 3. ARBITRUM (Official dark blue badge with vibrant cyan stylized 'A' chevron)
  if (normalizedKey === 'arbitrum' || normalizedKey === 'arb') {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeDimensions} shrink-0 ${glowClass} ${className}`}
        aria-label="Arbitrum Logo"
      >
        <circle cx="50" cy="50" r="50" fill="#213147" />
        <path
          d="M50 16L78 32V68L50 84L22 68V32L50 16Z"
          stroke="#28A0F0"
          strokeWidth="3.5"
          fill="#1B283A"
        />
        {/* Stylized Arbitrum A Chevrons */}
        <path
          d="M50 25L67 59H57.5L50 43.5L42.5 59H33L50 25Z"
          fill="#28A0F0"
        />
        <path
          d="M50 49L59 67H41L50 49Z"
          fill="#FFFFFF"
        />
        <path
          d="M37 63L50 37L63 63H55.5L50 51.5L44.5 63H37Z"
          fill="#96BEDC"
        />
      </svg>
    );
  }

  // 4. BNB CHAIN (Official Binance Yellow Circle with interlocking 4 rhombus cubes)
  if (normalizedKey === 'bsc' || normalizedKey === 'bnb') {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeDimensions} shrink-0 ${glowClass} ${className}`}
        aria-label="BNB Chain Logo"
      >
        <circle cx="50" cy="50" r="50" fill="#F3BA2F" />
        <g transform="translate(19, 19) scale(0.62)" fill="#1E2026">
          {/* Central Rhombus */}
          <polygon points="50,33.5 61.8,45.3 50,57.1 38.2,45.3" />
          {/* Top Point */}
          <polygon points="50,14 61.8,25.8 50,37.6 38.2,25.8" />
          {/* Left Point */}
          <polygon points="30.5,33.5 42.3,45.3 30.5,57.1 18.7,45.3" />
          {/* Right Point */}
          <polygon points="69.5,33.5 81.3,45.3 69.5,57.1 57.7,45.3" />
          {/* Bottom Point */}
          <polygon points="50,53 61.8,64.8 50,76.6 38.2,64.8" />
          {/* Outer Corner brackets */}
          <polygon points="50,0 66.8,16.8 58.5,25.1 50,16.6 41.5,25.1 33.2,16.8" />
          <polygon points="50,100 33.2,83.2 41.5,74.9 50,83.4 58.5,74.9 66.8,83.2" />
          <polygon points="0,50 16.8,33.2 25.1,41.5 16.6,50 25.1,58.5 16.8,66.8" />
          <polygon points="100,50 83.2,66.8 74.9,58.5 83.4,50 74.9,41.5 83.2,33.2" />
        </g>
      </svg>
    );
  }

  // 5. POLYGON (Official Purple Circle with authentic Polygon infinite folded loop)
  if (normalizedKey === 'polygon' || normalizedKey === 'matic' || normalizedKey === 'amoy') {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeDimensions} shrink-0 ${glowClass} ${className}`}
        aria-label="Polygon Logo"
      >
        <circle cx="50" cy="50" r="50" fill="#8247E5" />
        <g transform="translate(20, 20) scale(0.6)">
          <path
            d="M71.7 32.5L52.8 21.6C51.1 20.6 48.9 20.6 47.2 21.6L28.3 32.5C26.6 33.5 25.5 35.4 25.5 37.3V59.1C25.5 61.1 26.6 62.9 28.3 63.9L47.2 74.8C48.9 75.8 51.1 75.8 52.8 74.8L71.7 63.9C73.4 62.9 74.5 61.1 74.5 59.1V37.3C74.5 35.4 73.4 33.5 71.7 32.5Z"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          <path
            d="M50 40L63 47.5V62.5L50 70L37 62.5V47.5L50 40Z"
            fill="#FFFFFF"
          />
        </g>
      </svg>
    );
  }

  // 6. BASE (Official Coinbase Base Electric Blue Circle with authentic inner semi-circle / crescent)
  if (normalizedKey === 'base') {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeDimensions} shrink-0 ${glowClass} ${className}`}
        aria-label="Base Logo"
      >
        <circle cx="50" cy="50" r="50" fill="#0052FF" />
        {/* Official Base Cutout / Inner Ring */}
        <circle cx="50" cy="50" r="28" fill="#0052FF" stroke="#FFFFFF" strokeWidth="8" />
        <rect x="46" y="22" width="28" height="18" fill="#0052FF" />
        <path d="M50 22H74V40H50V22Z" fill="#0052FF" />
        <circle cx="50" cy="50" r="16" fill="#FFFFFF" />
      </svg>
    );
  }

  // 7. AVALANCHE (Official Crimson Red Circle with authentic white chevron mountain peaks 'A')
  if (normalizedKey === 'avalanche' || normalizedKey === 'avax' || normalizedKey === 'fuji') {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeDimensions} shrink-0 ${glowClass} ${className}`}
        aria-label="Avalanche Logo"
      >
        <circle cx="50" cy="50" r="50" fill="#E84142" />
        <g transform="translate(18, 18) scale(0.64)">
          {/* Main Peak */}
          <path
            d="M50 10C47.8 10 45.8 11.2 44.8 13L24.8 48C23.8 49.8 23.8 52 24.8 53.8C25.8 55.6 27.8 56.8 30 56.8H70C72.2 56.8 74.2 55.6 75.2 53.8C76.2 52 76.2 49.8 75.2 48L55.2 13C54.2 11.2 52.2 10 50 10Z"
            fill="#FFFFFF"
          />
          {/* Inner Inset Cutout to form the A */}
          <path
            d="M50 26L62 48H38L50 26Z"
            fill="#E84142"
          />
          {/* Right Small Peak */}
          <path
            d="M74 42C72.8 42 71.6 42.6 71 43.6L63 57.6C62.4 58.6 62.4 60 63 61C63.6 62 64.8 62.6 66 62.6H82C83.2 62.6 84.4 62 85 61C85.6 60 85.6 58.6 85 57.6L77 43.6C76.4 42.6 75.2 42 74 42Z"
            fill="#FFFFFF"
          />
        </g>
      </svg>
    );
  }

  // 8. TETHER USDT (Official Tether Emerald Green Circle with white ₮)
  if (normalizedKey === 'usdt' || normalizedKey === 'tether') {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeDimensions} shrink-0 ${glowClass} ${className}`}
        aria-label="Tether USDT Logo"
      >
        <circle cx="50" cy="50" r="50" fill="#26A17B" />
        <g fill="#FFFFFF">
          <path d="M57.6 34.2V25.5H74.4V17.5H25.6V25.5H42.4V34.2C30.4 34.8 21.2 37.1 21.2 40C21.2 42.8 30.4 45.1 42.4 45.7V72.5H57.6V45.7C69.6 45.1 78.8 42.8 78.8 40C78.8 37.1 69.6 34.8 57.6 34.2ZM50 43.6C37.8 43.6 27.8 41.5 27.8 39.5C27.8 37.5 37.8 35.4 50 35.4C62.2 35.4 72.2 37.5 72.2 39.5C72.2 41.5 62.2 43.6 50 43.6Z" />
        </g>
      </svg>
    );
  }

  // Fallback Network Logo
  return (
    <div
      className={`${sizeDimensions} rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-[10px] shadow-sm border border-amber-200 ${className}`}
    >
      {normalizedKey.slice(0, 2).toUpperCase()}
    </div>
  );
};
