export interface MatchPoolTier {
  fee: number;
  title: string;
  tag?: string;
  isHot?: boolean;
  colorName?: 'red' | 'yellow' | 'green' | 'blue';
}

export interface PlatformGameSettings {
  adminUrlAlias: string;
  maintenanceMode: boolean;
  turnTimeoutSeconds: number;
  maxConsecutiveSixes: number;

  // Pawn Movement Speeds (ms per step hop)
  ludoPawnSpeedMs: number;
  snakeLudoPawnSpeedMs: number;
  supremePawnSpeedMs: number;

  // Match Entry Fees & Platform Rake
  entryFee2Player: number;
  entryFee4Player: number;
  entryFeeSnakeLudo: number;
  prizePoolPercentage: number;
  platformFeePercentage: number;

  // Full customizable match tier arrays
  matchPools2P: MatchPoolTier[];
  matchPools3P: MatchPoolTier[];
  matchPools4P: MatchPoolTier[];
  matchPoolsSnake: MatchPoolTier[];

  allowedOrigins: string[];
}

export const DEFAULT_MATCH_POOLS_2P: MatchPoolTier[] = [
  { fee: 0, title: 'Free Training', tag: 'Practice', colorName: 'red' },
  { fee: 1, title: 'Micro Duel', tag: 'Beginner', isHot: true, colorName: 'yellow' },
  { fee: 5, title: 'Popular Duel', tag: 'Popular', isHot: true, colorName: 'red' },
  { fee: 10, title: 'High Stakes 1v1', tag: 'High Roller', colorName: 'yellow' },
  { fee: 25, title: 'Grand Arena', tag: 'Pro League', colorName: 'red' },
  { fee: 50, title: 'VIP Championship', tag: 'VIP Elite', colorName: 'yellow' },
  { fee: 100, title: 'High Roller Legend', tag: 'Supreme', colorName: 'red' },
];

export const DEFAULT_MATCH_POOLS_3P: MatchPoolTier[] = [
  { fee: 0, title: 'Free Trio Arena', tag: 'Practice', colorName: 'red' },
  { fee: 1, title: 'Trio Micro Clash', tag: 'Quick 3P', isHot: true, colorName: 'yellow' },
  { fee: 5, title: 'Trio Showdown', tag: 'Popular', isHot: true, colorName: 'green' },
  { fee: 10, title: 'Master 3P Clash', tag: 'High Stakes', colorName: 'red' },
  { fee: 25, title: 'Grand Trio League', tag: 'Pro', colorName: 'yellow' },
  { fee: 50, title: 'VIP 3P Royal', tag: 'VIP', colorName: 'green' },
  { fee: 100, title: 'VIP 3P Supreme', tag: 'High Roller', colorName: 'yellow' },
];

export const DEFAULT_MATCH_POOLS_4P: MatchPoolTier[] = [
  { fee: 0, title: 'Free 4P Rumble', tag: 'Practice', colorName: 'red' },
  { fee: 1, title: '4P Mini Rumble', tag: 'Beginner', isHot: true, colorName: 'yellow' },
  { fee: 5, title: 'Classic 4P Battle', tag: 'Most Popular', isHot: true, colorName: 'green' },
  { fee: 10, title: 'Supreme 4P Rumble', tag: 'Stakes', colorName: 'blue' },
  { fee: 25, title: 'Master 4P League', tag: 'Grand Prize', colorName: 'red' },
  { fee: 50, title: 'VIP 4P Championship', tag: 'High Roller', colorName: 'yellow' },
  { fee: 100, title: 'Ultimate 4P Crown', tag: 'Supreme Royal', colorName: 'green' },
];

export const DEFAULT_MATCH_POOLS_SNAKE: MatchPoolTier[] = [
  { fee: 0, title: 'Free Snake Practice', tag: 'Training', colorName: 'red' },
  { fee: 1, title: 'Snake 1v1 Sprint', tag: 'Quick', isHot: true, colorName: 'yellow' },
  { fee: 5, title: 'Snake Derby', tag: 'Popular', isHot: true, colorName: 'green' },
  { fee: 10, title: 'Snake Master League', tag: 'High Stakes', colorName: 'red' },
  { fee: 25, title: 'Grand Snake Arena', tag: 'Pro', colorName: 'yellow' },
  { fee: 50, title: 'VIP Snake Royal', tag: 'VIP Elite', colorName: 'green' },
  { fee: 100, title: 'Snake Legend Cup', tag: 'Supreme', colorName: 'red' },
];

export const DEFAULT_PLATFORM_SETTINGS: PlatformGameSettings = {
  adminUrlAlias: 'admin',
  maintenanceMode: false,
  turnTimeoutSeconds: 30,
  maxConsecutiveSixes: 3,
  ludoPawnSpeedMs: 320,       // 320ms per step
  snakeLudoPawnSpeedMs: 160,  // 160ms per step
  supremePawnSpeedMs: 240,    // 240ms per step
  entryFee2Player: 5,
  entryFee4Player: 10,
  entryFeeSnakeLudo: 5,
  prizePoolPercentage: 90,
  platformFeePercentage: 10,
  matchPools2P: DEFAULT_MATCH_POOLS_2P,
  matchPools3P: DEFAULT_MATCH_POOLS_3P,
  matchPools4P: DEFAULT_MATCH_POOLS_4P,
  matchPoolsSnake: DEFAULT_MATCH_POOLS_SNAKE,
  allowedOrigins: ['https://ludo.omyra.org', 'http://localhost:3000'],
};
