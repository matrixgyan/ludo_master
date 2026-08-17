export type StoneType = 'muted_olive' | 'light_beige' | 'gold_altar' | 'start_portal';

export interface TileData {
  number: number;
  row: number; // 0 (top) to 9 (bottom)
  col: number; // 0 to 9
  xPercent: number;
  yPercent: number;
  stoneType: StoneType;
  ladderDest?: number;
  snakeDest?: number;
  relicName?: string;
  isSpecial?: boolean;
}

export type LadderType =
  | 'ancient_stone_steps'
  | 'vine_ladder'
  | 'rope_bridge'
  | 'golden_staircase';

export interface LadderConfig {
  id: string;
  start: number;
  dest: number;
  name: string;
  type: LadderType;
}

export type SnakeTheme =
  | 'king_cobra'
  | 'emerald_tree_boa'
  | 'ruby_pit_viper'
  | 'golden_anaconda'
  | 'shadow_python'
  | 'fire_serpent';

export interface SnakeConfig {
  id: string;
  head: number;
  tail: number;
  dest: number;
  name: string;
  theme: SnakeTheme;
}

// Master Adventure Ladders / Stairs List
export const ADVENTURE_LADDERS: LadderConfig[] = [
  { id: 'ladder_1', start: 4, dest: 25, name: 'Ancient Carved Stone Steps', type: 'ancient_stone_steps' },
  { id: 'ladder_7', start: 8, dest: 30, name: 'Cliffside Stone Stairway', type: 'ancient_stone_steps' },
  { id: 'ladder_2', start: 12, dest: 34, name: 'Vine-Wrapped Jungle Ladder', type: 'vine_ladder' },
  { id: 'ladder_3', start: 28, dest: 52, name: 'Mayan Temple Ascent Stairway', type: 'ancient_stone_steps' },
  { id: 'ladder_4', start: 45, dest: 66, name: 'Suspension Timber Rope Bridge', type: 'rope_bridge' },
  { id: 'ladder_5', start: 60, dest: 82, name: 'Sun Pyramid Grand Staircase', type: 'golden_staircase' },
  { id: 'ladder_6', start: 73, dest: 95, name: 'Altar of the Sun Golden Stairs', type: 'golden_staircase' },
];

// Master Adventure Dangerous Serpents List
export const ADVENTURE_SNAKES: SnakeConfig[] = [
  { id: 'snake_1', head: 21, tail: 3, dest: 3, name: 'Emerald Tree Boa', theme: 'emerald_tree_boa' },
  { id: 'snake_2', head: 43, tail: 18, dest: 18, name: 'Ruby Pit Viper', theme: 'ruby_pit_viper' },
  { id: 'snake_3', head: 59, tail: 38, dest: 38, name: 'Shadow Amazon Python', theme: 'shadow_python' },
  { id: 'snake_7', head: 68, tail: 24, dest: 24, name: 'Golden Viper Serpent', theme: 'golden_anaconda' },
  { id: 'snake_4', head: 76, tail: 48, dest: 48, name: 'Golden Aztec Anaconda', theme: 'golden_anaconda' },
  { id: 'snake_5', head: 89, tail: 53, dest: 53, name: 'Temple King Cobra', theme: 'king_cobra' },
  { id: 'snake_6', head: 98, tail: 64, dest: 64, name: 'Mythical Fire Dragon Serpent', theme: 'fire_serpent' },
];

// Helper maps for quick O(1) lookup
export const LADDER_MAP: Record<number, LadderConfig> = Object.fromEntries(
  ADVENTURE_LADDERS.map((l) => [l.start, l])
);

export const SNAKE_MAP: Record<number, SnakeConfig> = Object.fromEntries(
  ADVENTURE_SNAKES.map((s) => [s.head, s])
);

// Calculate exact center coordinates (0% to 100%) for a tile number (1 to 100)
export function getTileCoordinates(tileNumber: number): {
  row: number;
  col: number;
  xPercent: number;
  yPercent: number;
} {
  const clamped = Math.max(1, Math.min(100, tileNumber));
  const rowFromBottom = Math.floor((clamped - 1) / 10); // 0 (1..10) to 9 (91..100)
  const row = 9 - rowFromBottom; // 0 top (100..91), 9 bottom (1..10)
  const isRowEven = rowFromBottom % 2 === 0;

  const col = isRowEven ? (clamped - 1) % 10 : 9 - ((clamped - 1) % 10);

  // 10x10 grid with 10% cell width and 10% cell height
  const xPercent = col * 10 + 5;
  const yPercent = row * 10 + 5;

  return { row, col, xPercent, yPercent };
}
