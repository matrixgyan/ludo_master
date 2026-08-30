import { PlayerColor } from '../types/game';

export interface LobbyThemeDefinition {
  id: string;
  name: string;
  category: 'Royal 3D' | 'Cyber' | 'Luxury Casino' | 'Tournament' | 'Festival';
  description: string;
  tag: string;
  previewBgGradient: string;
  previewAccentColor: string;
  accentGlow: string;
  atmosphere: 'particles' | 'grid' | 'aurora' | 'bokeh' | 'stars' | 'classic';
  bodyBgClass: string;
  containerClass: string;
  headerBgGradient: string;
  headerBorderClass: string;
  headerTextClass: string;
  cardBorderGlow: string;
  floatingWidgetClass: string;
  bottomNavGradient: string;
  bottomNavBorder: string;
  bottomNavActiveColor: string;
  bannerBadgeStyle: string;
}

export interface BoardThemeDefinition {
  id: string;
  name: string;
  category: 'Royal' | 'Classic' | 'Cyber' | 'Luxury' | 'Casual';
  description: string;
  tag: string;
  bgBoardClass: string;
  boardBorderClass: string;
  boardGlowColor: string;
  cellBgClass: string;
  cellBorderClass: string;
  centerBgGradient: string;
  cornerBases: Record<PlayerColor, {
    bgGradient: string;
    borderClass: string;
    glow: string;
    accentColor: string;
  }>;
  stemColors: Record<PlayerColor, {
    bgClass: string;
    borderClass: string;
    hex: string;
  }>;
  startCells: Record<PlayerColor, {
    bgClass: string;
    borderClass: string;
    hex: string;
  }>;
}

export interface DiceSkinDefinition {
  id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  description: string;
  material: string;
  cubeBgGradient: string;
  cubeBorderColor: string;
  cubeBoxShadow: string;
  pipColor: string;
  pipShadow: string;
  glowAura: string;
}

export interface PawnSkinDefinition {
  id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  description: string;
  styleType: 'crowned' | 'gloss' | 'crystal' | 'mecha' | 'sovereign' | 'shield' | 'halma_gloss' | 'queen_monarch';
  colors: Record<PlayerColor, {
    primaryGradient: string;
    secondaryGradient: string;
    borderColor: string;
    glowColor: string;
    capColor: string;
    highlight: string;
  }>;
}

export const LOBBY_THEMES: LobbyThemeDefinition[] = [
  {
    id: 'dubai_prestige_gold',
    name: 'Dubai Royal 3D Arena',
    category: 'Royal 3D',
    tag: 'DEFAULT ACTIVE',
    description: 'The flagship signature lobby featuring clean off-white canvas, golden highlights, 3D animated hero cards, luxury casino amber accents, and crisp typography.',
    previewBgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #451a03 100%)',
    previewAccentColor: '#f59e0b',
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    atmosphere: 'particles',
    bodyBgClass: 'bg-[#fcfaf7]',
    containerClass: 'bg-white',
    headerBgGradient: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.98) 100%)',
    headerBorderClass: 'border-amber-500/30',
    headerTextClass: 'text-amber-400',
    cardBorderGlow: 'shadow-[0_8px_30px_rgba(245,158,11,0.18)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.32)]',
    floatingWidgetClass: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-amber-400/50 shadow-[0_0_20px_rgba(16,185,129,0.5)]',
    bottomNavGradient: 'linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(2, 6, 23, 0.99) 100%)',
    bottomNavBorder: 'border-slate-800/90',
    bottomNavActiveColor: '#fbbf24',
    bannerBadgeStyle: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black',
  },
  {
    id: 'cyberpunk_neon_tokyo',
    name: 'Cyberpunk Hologram 2099',
    category: 'Cyber',
    tag: 'FUTURISTIC',
    description: 'Dark obsidian matrix with animated cyan & fuchsia laser glow, holographic scanlines, neon digital grid, and electric futuristic energy.',
    previewBgGradient: 'linear-gradient(135deg, #020617 0%, #083344 50%, #701a75 100%)',
    previewAccentColor: '#22d3ee',
    accentGlow: 'rgba(34, 211, 238, 0.6)',
    atmosphere: 'grid',
    bodyBgClass: 'bg-[#070913]',
    containerClass: 'bg-[#0b0f1e]',
    headerBgGradient: 'linear-gradient(135deg, rgba(8, 51, 68, 0.95) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(112, 26, 117, 0.95) 100%)',
    headerBorderClass: 'border-cyan-500/50',
    headerTextClass: 'text-cyan-400',
    cardBorderGlow: 'shadow-[0_0_30px_rgba(6,182,212,0.35)] hover:shadow-[0_0_45px_rgba(6,182,212,0.6)] border-cyan-500/40',
    floatingWidgetClass: 'bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white border-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.7)]',
    bottomNavGradient: 'linear-gradient(180deg, rgba(8, 14, 30, 0.98) 0%, rgba(3, 7, 18, 1) 100%)',
    bottomNavBorder: 'border-cyan-900/60',
    bottomNavActiveColor: '#22d3ee',
    bannerBadgeStyle: 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.8)]',
  },
  {
    id: 'monaco_vip_casino',
    name: 'Monaco Royale VIP Club',
    category: 'Luxury Casino',
    tag: 'HIGH ROLLER',
    description: 'Deep velvet crimson, brushed gold titanium, 24K gold foil trim, and exclusive Monte Carlo high-stakes casino luxury.',
    previewBgGradient: 'linear-gradient(135deg, #1c050a 0%, #4c0519 50%, #78350f 100%)',
    previewAccentColor: '#fb7185',
    accentGlow: 'rgba(244, 63, 94, 0.55)',
    atmosphere: 'bokeh',
    bodyBgClass: 'bg-[#12070a]',
    containerClass: 'bg-[#1a0c10]',
    headerBgGradient: 'linear-gradient(135deg, rgba(76, 5, 25, 0.95) 0%, rgba(28, 5, 10, 0.98) 50%, rgba(69, 26, 3, 0.95) 100%)',
    headerBorderClass: 'border-amber-500/50',
    headerTextClass: 'text-amber-300',
    cardBorderGlow: 'shadow-[0_0_30px_rgba(225,29,72,0.35)] hover:shadow-[0_0_45px_rgba(244,63,94,0.55)] border-amber-500/40',
    floatingWidgetClass: 'bg-gradient-to-r from-rose-600 to-amber-600 text-white border-amber-300 shadow-[0_0_25px_rgba(244,63,94,0.7)]',
    bottomNavGradient: 'linear-gradient(180deg, rgba(28, 5, 10, 0.98) 0%, rgba(15, 2, 5, 1) 100%)',
    bottomNavBorder: 'border-rose-950/80',
    bottomNavActiveColor: '#fbbf24',
    bannerBadgeStyle: 'bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black shadow-[0_0_15px_rgba(244,63,94,0.7)]',
  },
  {
    id: 'emerald_palace_tournament',
    name: 'Emerald Palace Esports Arena',
    category: 'Tournament',
    tag: 'PRO ESPORTS',
    description: 'Imperial forest emerald, brass championship badges, tournament ranking status rings, and ultra-crisp competitive sports polish.',
    previewBgGradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f172a 100%)',
    previewAccentColor: '#34d399',
    accentGlow: 'rgba(52, 211, 153, 0.55)',
    atmosphere: 'aurora',
    bodyBgClass: 'bg-[#03140e]',
    containerClass: 'bg-[#071f16]',
    headerBgGradient: 'linear-gradient(135deg, rgba(6, 78, 59, 0.95) 0%, rgba(2, 44, 34, 0.98) 50%, rgba(15, 23, 42, 0.95) 100%)',
    headerBorderClass: 'border-emerald-500/50',
    headerTextClass: 'text-emerald-300',
    cardBorderGlow: 'shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_45px_rgba(52,211,153,0.55)] border-emerald-500/40',
    floatingWidgetClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.7)]',
    bottomNavGradient: 'linear-gradient(180deg, rgba(4, 30, 22, 0.98) 0%, rgba(2, 18, 13, 1) 100%)',
    bottomNavBorder: 'border-emerald-950/80',
    bottomNavActiveColor: '#34d399',
    bannerBadgeStyle: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black shadow-[0_0_15px_rgba(52,211,153,0.7)]',
  },
  {
    id: 'sunset_oasis_carnival',
    name: 'Sunset Oasis Carnival',
    category: 'Festival',
    tag: 'FESTIVAL VIP',
    description: 'Vibrant sunset magenta, electric violet, warm dusk peach, and sparkling festival illumination with festive celebration effects.',
    previewBgGradient: 'linear-gradient(135deg, #3b0764 0%, #701a75 50%, #831843 100%)',
    previewAccentColor: '#f472b6',
    accentGlow: 'rgba(244, 114, 182, 0.55)',
    atmosphere: 'stars',
    bodyBgClass: 'bg-[#14081c]',
    containerClass: 'bg-[#1c0c26]',
    headerBgGradient: 'linear-gradient(135deg, rgba(88, 28, 135, 0.95) 0%, rgba(59, 7, 100, 0.98) 50%, rgba(131, 24, 67, 0.95) 100%)',
    headerBorderClass: 'border-pink-500/50',
    headerTextClass: 'text-pink-300',
    cardBorderGlow: 'shadow-[0_0_30px_rgba(236,72,153,0.35)] hover:shadow-[0_0_45px_rgba(244,114,182,0.55)] border-pink-500/40',
    floatingWidgetClass: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white border-pink-300 shadow-[0_0_25px_rgba(244,114,182,0.7)]',
    bottomNavGradient: 'linear-gradient(180deg, rgba(28, 12, 38, 0.98) 0%, rgba(15, 6, 22, 1) 100%)',
    bottomNavBorder: 'border-purple-950/80',
    bottomNavActiveColor: '#f472b6',
    bannerBadgeStyle: 'bg-gradient-to-r from-pink-400 to-rose-500 text-white font-black shadow-[0_0_15px_rgba(244,114,182,0.7)]',
  },
];

export const BOARD_THEMES: BoardThemeDefinition[] = [
  {
    id: 'dubai_royal_sunset',
    name: 'Dubai Royal Sunset',
    category: 'Royal',
    description: 'Warm terracotta, royal gold trim, and vibrant sunset magenta accents inspired by luxury dunes.',
    tag: 'DEFAULT ACTIVE',
    bgBoardClass: 'bg-[#fcfaf7]',
    boardBorderClass: 'border-[#3a2010]',
    boardGlowColor: 'rgba(245, 158, 11, 0.4)',
    cellBgClass: 'bg-[#fcfaf7]',
    cellBorderClass: 'border-[#d4ceca]',
    centerBgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
    cornerBases: {
      blue: { bgGradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderClass: 'border-[#0284c7]', glow: '#38bdf8', accentColor: '#38bdf8' },
      red: { bgGradient: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', borderClass: 'border-[#e11d48]', glow: '#fb7185', accentColor: '#ff6b81' },
      green: { bgGradient: 'linear-gradient(135deg, #15803d 0%, #166534 100%)', borderClass: 'border-[#15803d]', glow: '#4ade80', accentColor: '#22c55e' },
      yellow: { bgGradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', borderClass: 'border-[#ea580c]', glow: '#fbbf24', accentColor: '#fb923c' },
    },
    stemColors: {
      blue: { bgClass: 'bg-[#38bdf8]', borderClass: 'border-[#0284c7]', hex: '#38bdf8' },
      red: { bgClass: 'bg-[#ff6b81]', borderClass: 'border-[#e11d48]', hex: '#ff6b81' },
      green: { bgClass: 'bg-[#22c55e]', borderClass: 'border-[#15803d]', hex: '#22c55e' },
      yellow: { bgClass: 'bg-[#fb923c]', borderClass: 'border-[#c2410c]', hex: '#fb923c' },
    },
    startCells: {
      blue: { bgClass: 'bg-[#0284c7]', borderClass: 'border-[#0369a1]', hex: '#0284c7' },
      red: { bgClass: 'bg-[#e11d48]', borderClass: 'border-[#be123c]', hex: '#e11d48' },
      green: { bgClass: 'bg-[#15803d]', borderClass: 'border-[#166534]', hex: '#15803d' },
      yellow: { bgClass: 'bg-[#ea580c]', borderClass: 'border-[#c2410c]', hex: '#ea580c' },
    },
  },
  {
    id: 'classic_emerald',
    name: 'Classic Emerald Velvet',
    category: 'Classic',
    description: 'High-roller casino velvet green with brass hazard corners, ivory path cells, and gold stars.',
    tag: 'POPULAR',
    bgBoardClass: 'bg-[#062419]',
    boardBorderClass: 'border-[#104a34]',
    boardGlowColor: 'rgba(16, 185, 129, 0.45)',
    cellBgClass: 'bg-[#f4fbf7]',
    cellBorderClass: 'border-[#a7d7c5]',
    centerBgGradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
    cornerBases: {
      blue: { bgGradient: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)', borderClass: 'border-[#0369a1]', glow: '#38bdf8', accentColor: '#38bdf8' },
      red: { bgGradient: 'linear-gradient(135deg, #be123c 0%, #9f1239 100%)', borderClass: 'border-[#be123c]', glow: '#f43f5e', accentColor: '#f43f5e' },
      green: { bgGradient: 'linear-gradient(135deg, #047857 0%, #065f46 100%)', borderClass: 'border-[#047857]', glow: '#34d399', accentColor: '#10b981' },
      yellow: { bgGradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', borderClass: 'border-[#d97706]', glow: '#fde047', accentColor: '#f59e0b' },
    },
    stemColors: {
      blue: { bgClass: 'bg-[#0ea5e9]', borderClass: 'border-[#0284c7]', hex: '#0ea5e9' },
      red: { bgClass: 'bg-[#f43f5e]', borderClass: 'border-[#be123c]', hex: '#f43f5e' },
      green: { bgClass: 'bg-[#10b981]', borderClass: 'border-[#047857]', hex: '#10b981' },
      yellow: { bgClass: 'bg-[#f59e0b]', borderClass: 'border-[#b45309]', hex: '#f59e0b' },
    },
    startCells: {
      blue: { bgClass: 'bg-[#0284c7]', borderClass: 'border-[#0369a1]', hex: '#0284c7' },
      red: { bgClass: 'bg-[#e11d48]', borderClass: 'border-[#be123c]', hex: '#e11d48' },
      green: { bgClass: 'bg-[#059669]', borderClass: 'border-[#047857]', hex: '#059669' },
      yellow: { bgClass: 'bg-[#d97706]', borderClass: 'border-[#b45309]', hex: '#d97706' },
    },
  },
  {
    id: 'cyber_neon',
    name: 'Cyber Neon Matrix',
    category: 'Cyber',
    description: 'Dark futuristic obsidian grid with illuminated cyan, magenta, laser-green & amber pathways.',
    tag: 'FUTURISTIC',
    bgBoardClass: 'bg-[#090a14]',
    boardBorderClass: 'border-cyan-500/50',
    boardGlowColor: 'rgba(6, 182, 212, 0.6)',
    cellBgClass: 'bg-[#121528]',
    cellBorderClass: 'border-cyan-900/60',
    centerBgGradient: 'linear-gradient(135deg, #020617 0%, #1e1b4b 100%)',
    cornerBases: {
      blue: { bgGradient: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', borderClass: 'border-cyan-400', glow: '#22d3ee', accentColor: '#22d3ee' },
      red: { bgGradient: 'linear-gradient(135deg, #c026d3 0%, #9333ea 100%)', borderClass: 'border-fuchsia-400', glow: '#e879f9', accentColor: '#f472b6' },
      green: { bgGradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)', borderClass: 'border-emerald-400', glow: '#34d399', accentColor: '#34d399' },
      yellow: { bgGradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', borderClass: 'border-yellow-400', glow: '#fde047', accentColor: '#fde047' },
    },
    stemColors: {
      blue: { bgClass: 'bg-cyan-400', borderClass: 'border-cyan-300', hex: '#22d3ee' },
      red: { bgClass: 'bg-fuchsia-500', borderClass: 'border-fuchsia-400', hex: '#d946ef' },
      green: { bgClass: 'bg-emerald-400', borderClass: 'border-emerald-300', hex: '#34d399' },
      yellow: { bgClass: 'bg-amber-400', borderClass: 'border-amber-300', hex: '#fbbf24' },
    },
    startCells: {
      blue: { bgClass: 'bg-cyan-600', borderClass: 'border-cyan-400', hex: '#0891b2' },
      red: { bgClass: 'bg-fuchsia-600', borderClass: 'border-fuchsia-400', hex: '#c026d3' },
      green: { bgClass: 'bg-emerald-600', borderClass: 'border-emerald-400', hex: '#059669' },
      yellow: { bgClass: 'bg-amber-600', borderClass: 'border-amber-400', hex: '#d97706' },
    },
  },
  {
    id: 'midnight_marble',
    name: 'Midnight Marble & Gold',
    category: 'Luxury',
    description: 'Black Italian marble with crystalline veins, 24K gold foil trim, and royal jewel stars.',
    tag: 'ULTRA LUXURY',
    bgBoardClass: 'bg-[#0f0e17]',
    boardBorderClass: 'border-amber-500/60',
    boardGlowColor: 'rgba(251, 191, 36, 0.5)',
    cellBgClass: 'bg-[#1b1926]',
    cellBorderClass: 'border-amber-900/40',
    centerBgGradient: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
    cornerBases: {
      blue: { bgGradient: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)', borderClass: 'border-amber-400', glow: '#60a5fa', accentColor: '#60a5fa' },
      red: { bgGradient: 'linear-gradient(135deg, #881337 0%, #4c0519 100%)', borderClass: 'border-amber-400', glow: '#fb7185', accentColor: '#fb7185' },
      green: { bgGradient: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)', borderClass: 'border-amber-400', glow: '#4ade80', accentColor: '#4ade80' },
      yellow: { bgGradient: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)', borderClass: 'border-amber-400', glow: '#fbbf24', accentColor: '#fbbf24' },
    },
    stemColors: {
      blue: { bgClass: 'bg-blue-500', borderClass: 'border-amber-400', hex: '#3b82f6' },
      red: { bgClass: 'bg-rose-600', borderClass: 'border-amber-400', hex: '#e11d48' },
      green: { bgClass: 'bg-emerald-500', borderClass: 'border-amber-400', hex: '#10b981' },
      yellow: { bgClass: 'bg-amber-500', borderClass: 'border-amber-400', hex: '#f59e0b' },
    },
    startCells: {
      blue: { bgClass: 'bg-blue-700', borderClass: 'border-amber-400', hex: '#1d4ed8' },
      red: { bgClass: 'bg-rose-700', borderClass: 'border-amber-400', hex: '#be123c' },
      green: { bgClass: 'bg-emerald-700', borderClass: 'border-amber-400', hex: '#047857' },
      yellow: { bgClass: 'bg-amber-600', borderClass: 'border-amber-400', hex: '#d97706' },
    },
  },
  {
    id: 'candy_pastel',
    name: 'Sweet Candy Pastel',
    category: 'Casual',
    description: 'Playful lollipop marshmallow theme with candy pink, sky cyan, mint, and banana yellow.',
    tag: 'PLAYFUL',
    bgBoardClass: 'bg-[#fff5f8]',
    boardBorderClass: 'border-pink-300',
    boardGlowColor: 'rgba(244, 114, 182, 0.4)',
    cellBgClass: 'bg-[#ffffff]',
    cellBorderClass: 'border-pink-200',
    centerBgGradient: 'linear-gradient(135deg, #fbcfe8 0%, #f472b6 100%)',
    cornerBases: {
      blue: { bgGradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', borderClass: 'border-sky-300', glow: '#7dd3fc', accentColor: '#38bdf8' },
      red: { bgGradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', borderClass: 'border-rose-300', glow: '#fda4af', accentColor: '#fb7185' },
      green: { bgGradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)', borderClass: 'border-emerald-300', glow: '#a7f3d0', accentColor: '#4ade80' },
      yellow: { bgGradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', borderClass: 'border-amber-300', glow: '#fde68a', accentColor: '#fcd34d' },
    },
    stemColors: {
      blue: { bgClass: 'bg-sky-400', borderClass: 'border-sky-300', hex: '#38bdf8' },
      red: { bgClass: 'bg-pink-400', borderClass: 'border-pink-300', hex: '#f472b6' },
      green: { bgClass: 'bg-emerald-300', borderClass: 'border-emerald-200', hex: '#6ee7b7' },
      yellow: { bgClass: 'bg-amber-300', borderClass: 'border-amber-200', hex: '#fcd34d' },
    },
    startCells: {
      blue: { bgClass: 'bg-sky-500', borderClass: 'border-sky-400', hex: '#0ea5e9' },
      red: { bgClass: 'bg-pink-500', borderClass: 'border-pink-400', hex: '#ec4899' },
      green: { bgClass: 'bg-emerald-400', borderClass: 'border-emerald-300', hex: '#34d399' },
      yellow: { bgClass: 'bg-amber-400', borderClass: 'border-amber-300', hex: '#fbbf24' },
    },
  },
  {
    id: 'aztec_wood',
    name: 'Ancient Aztec Mahogany',
    category: 'Classic',
    description: 'Carved mahogany wood grain, antique bronze corners, weathered stone pathways, and sun glyphs.',
    tag: 'ANCIENT',
    bgBoardClass: 'bg-[#2b1810]',
    boardBorderClass: 'border-[#5c3822]',
    boardGlowColor: 'rgba(180, 83, 9, 0.4)',
    cellBgClass: 'bg-[#ede5d8]',
    cellBorderClass: 'border-[#c2b4a3]',
    centerBgGradient: 'linear-gradient(135deg, #451a03 0%, #78350f 100%)',
    cornerBases: {
      blue: { bgGradient: 'linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%)', borderClass: 'border-[#b45309]', glow: '#38bdf8', accentColor: '#38bdf8' },
      red: { bgGradient: 'linear-gradient(135deg, #881337 0%, #3f1d24 100%)', borderClass: 'border-[#b45309]', glow: '#f43f5e', accentColor: '#f43f5e' },
      green: { bgGradient: 'linear-gradient(135deg, #14532d 0%, #143522 100%)', borderClass: 'border-[#b45309]', glow: '#22c55e', accentColor: '#22c55e' },
      yellow: { bgGradient: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)', borderClass: 'border-[#b45309]', glow: '#f59e0b', accentColor: '#f59e0b' },
    },
    stemColors: {
      blue: { bgClass: 'bg-[#2563eb]', borderClass: 'border-[#1d4ed8]', hex: '#2563eb' },
      red: { bgClass: 'bg-[#dc2626]', borderClass: 'border-[#b91c1c]', hex: '#dc2626' },
      green: { bgClass: 'bg-[#16a34a]', borderClass: 'border-[#15803d]', hex: '#16a34a' },
      yellow: { bgClass: 'bg-[#d97706]', borderClass: 'border-[#b45309]', hex: '#d97706' },
    },
    startCells: {
      blue: { bgClass: 'bg-[#1d4ed8]', borderClass: 'border-[#1e40af]', hex: '#1d4ed8' },
      red: { bgClass: 'bg-[#b91c1c]', borderClass: 'border-[#991b1b]', hex: '#b91c1c' },
      green: { bgClass: 'bg-[#15803d]', borderClass: 'border-[#166534]', hex: '#15803d' },
      yellow: { bgClass: 'bg-[#b45309]', borderClass: 'border-[#92400e]', hex: '#b45309' },
    },
  },
];

export const DICE_SKINS: DiceSkinDefinition[] = [
  {
    id: 'golden_high_roller',
    name: '24K Gold High Roller',
    rarity: 'Legendary',
    description: 'Pure 24k polished gold cube with ruby-red inset pips and a warm golden aura.',
    material: 'Polished Gold',
    cubeBgGradient: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)',
    cubeBorderColor: '#fef08a',
    cubeBoxShadow: '0 0 20px rgba(234, 179, 8, 0.7)',
    pipColor: '#dc2626',
    pipShadow: '0 1px 2px rgba(0,0,0,0.6)',
    glowAura: 'rgba(234, 179, 8, 0.6)',
  },
  {
    id: 'classic_pearl',
    name: 'Classic Ivory Pearl',
    rarity: 'Common',
    description: 'Smooth glossy ivory porcelain with deep obsidian inset dots.',
    material: 'Porcelain Ivory',
    cubeBgGradient: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #cbd5e1 100%)',
    cubeBorderColor: '#e2e8f0',
    cubeBoxShadow: '0 4px 15px rgba(0,0,0,0.35)',
    pipColor: '#0f172a',
    pipShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
    glowAura: 'rgba(255, 255, 255, 0.3)',
  },
  {
    id: 'cyber_glass',
    name: 'Cyber Hologram Glass',
    rarity: 'Epic',
    description: 'Translucent cyan-tinted acrylic cube with laser blue & neon pips.',
    material: 'Holographic Glass',
    cubeBgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.8) 0%, rgba(14, 116, 144, 0.9) 100%)',
    cubeBorderColor: '#22d3ee',
    cubeBoxShadow: '0 0 25px rgba(6, 182, 212, 0.8)',
    pipColor: '#ffffff',
    pipShadow: '0 0 8px #22d3ee',
    glowAura: 'rgba(6, 182, 212, 0.7)',
  },
  {
    id: 'ruby_royale',
    name: 'Ruby Crimson Royale',
    rarity: 'Legendary',
    description: 'Faceted deep crimson gemstone cube with sparkling diamond pips.',
    material: 'Faceted Ruby',
    cubeBgGradient: 'linear-gradient(135deg, #f43f5e 0%, #be123c 50%, #881337 100%)',
    cubeBorderColor: '#fda4af',
    cubeBoxShadow: '0 0 22px rgba(244, 63, 94, 0.75)',
    pipColor: '#ffffff',
    pipShadow: '0 0 6px #fff',
    glowAura: 'rgba(244, 63, 94, 0.65)',
  },
  {
    id: 'emerald_jade',
    name: 'Emerald Jade Relic',
    rarity: 'Rare',
    description: 'Polished imperial jade stone with engraved gold foil pips.',
    material: 'Imperial Jade',
    cubeBgGradient: 'linear-gradient(135deg, #34d399 0%, #059669 50%, #064e3b 100%)',
    cubeBorderColor: '#6ee7b7',
    cubeBoxShadow: '0 0 20px rgba(16, 185, 129, 0.65)',
    pipColor: '#fde047',
    pipShadow: '0 1px 3px rgba(0,0,0,0.7)',
    glowAura: 'rgba(16, 185, 129, 0.55)',
  },
  {
    id: 'dark_matter',
    name: 'Obsidian Dark Matter',
    rarity: 'Epic',
    description: 'Matte stealth carbon black with glowing ultraviolet violet pips.',
    material: 'Dark Matter Carbon',
    cubeBgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #020617 100%)',
    cubeBorderColor: '#a855f7',
    cubeBoxShadow: '0 0 22px rgba(168, 85, 247, 0.7)',
    pipColor: '#c084fc',
    pipShadow: '0 0 8px #c084fc',
    glowAura: 'rgba(168, 85, 247, 0.6)',
  },
];

export const PAWN_SKINS: PawnSkinDefinition[] = [
  {
    id: 'halma_gloss_3d',
    name: '3D High-Gloss Halma Pin',
    rarity: 'Legendary',
    description: 'Smooth ceramic-lacquer Halma pawn with spherical head, concave tapered waist, and high-gloss vertical reflections (Screenshot 1).',
    styleType: 'halma_gloss',
    colors: {
      blue: { primaryGradient: 'from-blue-400 via-blue-600 to-blue-900', secondaryGradient: 'from-blue-300 to-blue-500', borderColor: '#00509d', glowColor: 'rgba(0, 150, 199, 0.85)', capColor: '#0077b6', highlight: '#90e0ef' },
      red: { primaryGradient: 'from-rose-500 via-red-600 to-red-950', secondaryGradient: 'from-rose-400 to-red-600', borderColor: '#9e0019', glowColor: 'rgba(239, 35, 60, 0.85)', capColor: '#d90429', highlight: '#ff8597' },
      green: { primaryGradient: 'from-emerald-400 via-green-600 to-green-950', secondaryGradient: 'from-emerald-300 to-green-500', borderColor: '#1b4332', glowColor: 'rgba(64, 145, 108, 0.85)', capColor: '#2d6a4f', highlight: '#95d5b2' },
      yellow: { primaryGradient: 'from-amber-300 via-amber-500 to-amber-900', secondaryGradient: 'from-amber-200 to-amber-400', borderColor: '#9e5a00', glowColor: 'rgba(245, 158, 11, 0.85)', capColor: '#d97706', highlight: '#fde68a' },
    },
  },
  {
    id: 'royal_queen_monarch',
    name: 'Royal Sovereign Queen Monarch',
    rarity: 'Legendary',
    description: 'Multi-tiered sovereign queen with scalloped coronet chalice, double collar torus rings, and fluted column (Screenshot 2).',
    styleType: 'queen_monarch',
    colors: {
      blue: { primaryGradient: 'from-sky-400 via-blue-600 to-blue-900', secondaryGradient: 'from-sky-300 to-blue-500', borderColor: '#0c3577', glowColor: 'rgba(59, 130, 246, 0.9)', capColor: '#1e5bb8', highlight: '#93c5fd' },
      red: { primaryGradient: 'from-pink-500 via-rose-600 to-rose-950', secondaryGradient: 'from-pink-400 to-rose-600', borderColor: '#7a0026', glowColor: 'rgba(230, 0, 76, 0.9)', capColor: '#b8003a', highlight: '#ff6699' },
      green: { primaryGradient: 'from-emerald-400 via-emerald-600 to-emerald-950', secondaryGradient: 'from-emerald-300 to-emerald-500', borderColor: '#09572d', glowColor: 'rgba(16, 185, 129, 0.9)', capColor: '#138548', highlight: '#6ee7b7' },
      yellow: { primaryGradient: 'from-yellow-300 via-amber-500 to-amber-900', secondaryGradient: 'from-yellow-200 to-amber-400', borderColor: '#78350f', glowColor: 'rgba(234, 179, 8, 0.9)', capColor: '#b45309', highlight: '#fef08a' },
    },
  },
  {
    id: 'royal_crowned',
    name: 'Royal Monarch Crowned',
    rarity: 'Legendary',
    description: 'Jewel-toned glossy pawns topped with hand-crafted 3D royal crowns.',
    styleType: 'crowned',
    colors: {
      blue: { primaryGradient: 'from-sky-400 via-blue-600 to-blue-900', secondaryGradient: 'from-sky-300 to-blue-500', borderColor: '#38bdf8', glowColor: 'rgba(56, 189, 248, 0.7)', capColor: '#fbbf24', highlight: '#e0f2fe' },
      red: { primaryGradient: 'from-rose-400 via-red-600 to-red-950', secondaryGradient: 'from-rose-300 to-red-500', borderColor: '#fb7185', glowColor: 'rgba(251, 113, 133, 0.7)', capColor: '#fbbf24', highlight: '#ffe4e6' },
      green: { primaryGradient: 'from-emerald-400 via-green-600 to-green-950', secondaryGradient: 'from-emerald-300 to-green-500', borderColor: '#4ade80', glowColor: 'rgba(74, 222, 128, 0.7)', capColor: '#fbbf24', highlight: '#dcfce7' },
      yellow: { primaryGradient: 'from-amber-300 via-amber-500 to-amber-900', secondaryGradient: 'from-amber-200 to-amber-400', borderColor: '#fbbf24', glowColor: 'rgba(251, 191, 36, 0.7)', capColor: '#f8fafc', highlight: '#fef3c7' },
    },
  },
  {
    id: 'classic_gloss',
    name: '3D Pro Specular Gloss',
    rarity: 'Common',
    description: 'Aerodynamic tournament tokens with high specular gloss and reflective base rings.',
    styleType: 'gloss',
    colors: {
      blue: { primaryGradient: 'from-blue-400 via-blue-600 to-blue-800', secondaryGradient: 'from-blue-300 to-blue-500', borderColor: '#60a5fa', glowColor: 'rgba(96, 165, 250, 0.6)', capColor: '#ffffff', highlight: '#eff6ff' },
      red: { primaryGradient: 'from-red-400 via-red-600 to-red-800', secondaryGradient: 'from-red-300 to-red-500', borderColor: '#f87171', glowColor: 'rgba(248, 113, 113, 0.6)', capColor: '#ffffff', highlight: '#fef2f2' },
      green: { primaryGradient: 'from-green-400 via-green-600 to-green-800', secondaryGradient: 'from-green-300 to-green-500', borderColor: '#4ade80', glowColor: 'rgba(74, 222, 128, 0.6)', capColor: '#ffffff', highlight: '#f0fdf4' },
      yellow: { primaryGradient: 'from-yellow-400 via-amber-500 to-yellow-700', secondaryGradient: 'from-yellow-300 to-amber-400', borderColor: '#facc15', glowColor: 'rgba(250, 204, 21, 0.6)', capColor: '#ffffff', highlight: '#fefce8' },
    },
  },
  {
    id: 'crystal_gem',
    name: 'Faceted Crystal Gems',
    rarity: 'Epic',
    description: '3D crystalline geometric figurines with sparkling facet light reflections.',
    styleType: 'crystal',
    colors: {
      blue: { primaryGradient: 'from-cyan-300 via-sky-500 to-blue-700', secondaryGradient: 'from-cyan-200 to-sky-400', borderColor: '#67e8f9', glowColor: 'rgba(103, 232, 249, 0.75)', capColor: '#cffafe', highlight: '#ffffff' },
      red: { primaryGradient: 'from-pink-400 via-rose-600 to-red-800', secondaryGradient: 'from-pink-300 to-rose-500', borderColor: '#f472b6', glowColor: 'rgba(244, 114, 182, 0.75)', capColor: '#fce7f3', highlight: '#ffffff' },
      green: { primaryGradient: 'from-teal-300 via-emerald-500 to-emerald-800', secondaryGradient: 'from-teal-200 to-emerald-400', borderColor: '#5eead4', glowColor: 'rgba(94, 234, 212, 0.75)', capColor: '#ccfbf1', highlight: '#ffffff' },
      yellow: { primaryGradient: 'from-yellow-200 via-amber-400 to-amber-600', secondaryGradient: 'from-yellow-100 to-amber-300', borderColor: '#fde047', glowColor: 'rgba(253, 224, 71, 0.75)', capColor: '#fef9c3', highlight: '#ffffff' },
    },
  },
  {
    id: 'cyber_mecha',
    name: 'Cyber Mecha Droids',
    rarity: 'Legendary',
    description: 'Futuristic cyber bots with illuminated visor lines and metallic joints.',
    styleType: 'mecha',
    colors: {
      blue: { primaryGradient: 'from-cyan-500 via-slate-800 to-cyan-950', secondaryGradient: 'from-cyan-400 to-slate-700', borderColor: '#22d3ee', glowColor: 'rgba(34, 211, 238, 0.8)', capColor: '#06b6d4', highlight: '#a5f3fc' },
      red: { primaryGradient: 'from-rose-500 via-slate-800 to-rose-950', secondaryGradient: 'from-rose-400 to-slate-700', borderColor: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.8)', capColor: '#e11d48', highlight: '#fecdd3' },
      green: { primaryGradient: 'from-emerald-500 via-slate-800 to-emerald-950', secondaryGradient: 'from-emerald-400 to-slate-700', borderColor: '#10b981', glowColor: 'rgba(16, 185, 129, 0.8)', capColor: '#059669', highlight: '#a7f3d0' },
      yellow: { primaryGradient: 'from-amber-400 via-slate-800 to-amber-950', secondaryGradient: 'from-amber-300 to-slate-700', borderColor: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.8)', capColor: '#d97706', highlight: '#fde68a' },
    },
  },
  {
    id: 'golden_sovereign',
    name: 'Gilded Sovereign Idols',
    rarity: 'Epic',
    description: 'Solid gilded statuettes with ornate base pedestal and jewel center crest.',
    styleType: 'sovereign',
    colors: {
      blue: { primaryGradient: 'from-amber-300 via-yellow-600 to-amber-900', secondaryGradient: 'from-amber-200 to-yellow-500', borderColor: '#38bdf8', glowColor: 'rgba(56, 189, 248, 0.7)', capColor: '#38bdf8', highlight: '#fef08a' },
      red: { primaryGradient: 'from-amber-300 via-yellow-600 to-amber-900', secondaryGradient: 'from-amber-200 to-yellow-500', borderColor: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.7)', capColor: '#f43f5e', highlight: '#fef08a' },
      green: { primaryGradient: 'from-amber-300 via-yellow-600 to-amber-900', secondaryGradient: 'from-amber-200 to-yellow-500', borderColor: '#10b981', glowColor: 'rgba(16, 185, 129, 0.7)', capColor: '#10b981', highlight: '#fef08a' },
      yellow: { primaryGradient: 'from-amber-300 via-yellow-600 to-amber-900', secondaryGradient: 'from-amber-200 to-yellow-500', borderColor: '#fbbf24', glowColor: 'rgba(251, 191, 36, 0.7)', capColor: '#fbbf24', highlight: '#fef08a' },
    },
  },
  {
    id: 'dragon_shield',
    name: 'Dragon Knight Crests',
    rarity: 'Rare',
    description: 'Medieval heraldic crest shields embossed with flaming color emblems.',
    styleType: 'shield',
    colors: {
      blue: { primaryGradient: 'from-blue-600 via-indigo-800 to-slate-900', secondaryGradient: 'from-blue-400 to-indigo-600', borderColor: '#93c5fd', glowColor: 'rgba(147, 197, 253, 0.6)', capColor: '#fcd34d', highlight: '#dbeafe' },
      red: { primaryGradient: 'from-red-600 via-rose-900 to-slate-900', secondaryGradient: 'from-red-400 to-rose-600', borderColor: '#fca5a5', glowColor: 'rgba(252, 165, 165, 0.6)', capColor: '#fcd34d', highlight: '#fee2e2' },
      green: { primaryGradient: 'from-green-600 via-emerald-900 to-slate-900', secondaryGradient: 'from-green-400 to-emerald-600', borderColor: '#86efac', glowColor: 'rgba(134, 239, 172, 0.6)', capColor: '#fcd34d', highlight: '#dcfce7' },
      yellow: { primaryGradient: 'from-amber-500 via-yellow-800 to-slate-900', secondaryGradient: 'from-amber-300 to-yellow-600', borderColor: '#fde047', glowColor: 'rgba(253, 224, 71, 0.6)', capColor: '#f8fafc', highlight: '#fef9c3' },
    },
  },
];

export interface CompleteThemeConfig {
  activeLobbyId: string;
  activeBoardId: string;
  activeDiceId: string;
  activePawnId: string;
  lobby: LobbyThemeDefinition;
  board: BoardThemeDefinition;
  dice: DiceSkinDefinition;
  pawn: PawnSkinDefinition;
}

export function getActiveThemeConfig(): CompleteThemeConfig {
  let activeLobbyId = 'dubai_prestige_gold';
  let activeBoardId = 'dubai_royal_sunset';
  let activeDiceId = 'golden_high_roller';
  let activePawnId = 'halma_gloss_3d';

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('ludo_active_theme_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeLobbyId) activeLobbyId = parsed.activeLobbyId;
        if (parsed.activeBoardId) activeBoardId = parsed.activeBoardId;
        if (parsed.activeDiceId) activeDiceId = parsed.activeDiceId;
        if (parsed.activePawnId) activePawnId = parsed.activePawnId;
      }
    } catch {}
  }

  const lobby = LOBBY_THEMES.find((l) => l.id === activeLobbyId) || LOBBY_THEMES[0];
  const board = BOARD_THEMES.find((b) => b.id === activeBoardId) || BOARD_THEMES[0];
  const dice = DICE_SKINS.find((d) => d.id === activeDiceId) || DICE_SKINS[0];
  const pawn = PAWN_SKINS.find((p) => p.id === activePawnId) || PAWN_SKINS[0];

  return {
    activeLobbyId,
    activeBoardId,
    activeDiceId,
    activePawnId,
    lobby,
    board,
    dice,
    pawn,
  };
}

export function saveLocalThemeConfig(config: {
  activeLobbyId?: string;
  activeBoardId?: string;
  activeDiceId?: string;
  activePawnId?: string;
}) {
  if (typeof window === 'undefined') return;
  try {
    const current = getActiveThemeConfig();
    const toSave = {
      activeLobbyId: config.activeLobbyId || current.activeLobbyId,
      activeBoardId: config.activeBoardId || current.activeBoardId,
      activeDiceId: config.activeDiceId || current.activeDiceId,
      activePawnId: config.activePawnId || current.activePawnId,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('ludo_active_theme_config', JSON.stringify(toSave));
    window.dispatchEvent(new CustomEvent('ludo_theme_changed', { detail: toSave }));
  } catch {}
}
