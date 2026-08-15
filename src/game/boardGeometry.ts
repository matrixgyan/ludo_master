import { PlayerColor } from '../types/game';

export interface GridCoord {
  x: number; // 0 to 14
  y: number; // 0 to 14
}

export const BOARD_GRID_SIZE = 15;

// The 52 main outer track coordinates in clockwise order starting from Blue start (1, 6)
export const MAIN_PATH: GridCoord[] = [
  { x: 1, y: 6 },  // 0: Blue Start
  { x: 2, y: 6 },  // 1
  { x: 3, y: 6 },  // 2
  { x: 4, y: 6 },  // 3
  { x: 5, y: 6 },  // 4
  { x: 6, y: 5 },  // 5
  { x: 6, y: 4 },  // 6
  { x: 6, y: 3 },  // 7
  { x: 6, y: 2 },  // 8
  { x: 6, y: 1 },  // 9
  { x: 6, y: 0 },  // 10
  { x: 7, y: 0 },  // 11
  { x: 8, y: 0 },  // 12
  { x: 8, y: 1 },  // 13: Red Start
  { x: 8, y: 2 },  // 14
  { x: 8, y: 3 },  // 15
  { x: 8, y: 4 },  // 16
  { x: 8, y: 5 },  // 17
  { x: 9, y: 6 },  // 18
  { x: 10, y: 6 }, // 19
  { x: 11, y: 6 }, // 20
  { x: 12, y: 6 }, // 21
  { x: 13, y: 6 }, // 22
  { x: 14, y: 6 }, // 23
  { x: 14, y: 7 }, // 24
  { x: 14, y: 8 }, // 25
  { x: 13, y: 8 }, // 26: Green Start
  { x: 12, y: 8 }, // 27
  { x: 11, y: 8 }, // 28
  { x: 10, y: 8 }, // 29
  { x: 9, y: 8 },  // 30
  { x: 8, y: 9 },  // 31
  { x: 8, y: 10 }, // 32
  { x: 8, y: 11 }, // 33
  { x: 8, y: 12 }, // 34
  { x: 8, y: 13 }, // 35
  { x: 8, y: 14 }, // 36
  { x: 7, y: 14 }, // 37
  { x: 6, y: 14 }, // 38
  { x: 6, y: 13 }, // 39: Yellow Start
  { x: 6, y: 12 }, // 40
  { x: 6, y: 11 }, // 41
  { x: 6, y: 10 }, // 42
  { x: 6, y: 9 },  // 43
  { x: 5, y: 8 },  // 44
  { x: 4, y: 8 },  // 45
  { x: 3, y: 8 },  // 46
  { x: 2, y: 8 },  // 47
  { x: 1, y: 8 },  // 48
  { x: 0, y: 8 },  // 49
  { x: 0, y: 7 },  // 50
  { x: 0, y: 6 },  // 51
];

// Start step index on MAIN_PATH for each color
export const COLOR_START_INDEX: Record<PlayerColor, number> = {
  blue: 0,    // (1, 6)
  red: 13,    // (8, 1)
  green: 26,  // (13, 8)
  yellow: 39, // (6, 13)
};

// Safe star / start indexes on relative/main path where tokens cannot be captured
export const SAFE_CELL_INDEXES: number[] = [0, 8, 13, 21, 26, 34, 39, 47];

// Home stretch 6 steps leading into goal for each color
export const HOME_STRETCH_PATHS: Record<PlayerColor, GridCoord[]> = {
  blue: [
    { x: 1, y: 7 },
    { x: 2, y: 7 },
    { x: 3, y: 7 },
    { x: 4, y: 7 },
    { x: 5, y: 7 },
    { x: 6, y: 7 }, // Goal Center
  ],
  red: [
    { x: 7, y: 1 },
    { x: 7, y: 2 },
    { x: 7, y: 3 },
    { x: 7, y: 4 },
    { x: 7, y: 5 },
    { x: 7, y: 6 }, // Goal Center
  ],
  green: [
    { x: 13, y: 7 },
    { x: 12, y: 7 },
    { x: 11, y: 7 },
    { x: 10, y: 7 },
    { x: 9, y: 7 },
    { x: 8, y: 7 }, // Goal Center
  ],
  yellow: [
    { x: 7, y: 13 },
    { x: 7, y: 12 },
    { x: 7, y: 11 },
    { x: 7, y: 10 },
    { x: 7, y: 9 },
    { x: 7, y: 8 }, // Goal Center
  ],
};

// 4 Pawn slot positions inside Home bases (in grid cell fractional terms matching circular slot centers)
export const HOME_SLOTS: Record<PlayerColor, GridCoord[]> = {
  blue: [
    { x: 1.5, y: 1.5 },
    { x: 3.5, y: 1.5 },
    { x: 1.5, y: 3.5 },
    { x: 3.5, y: 3.5 },
  ],
  red: [
    { x: 10.5, y: 1.5 },
    { x: 12.5, y: 1.5 },
    { x: 10.5, y: 3.5 },
    { x: 12.5, y: 3.5 },
  ],
  green: [
    { x: 10.5, y: 10.5 },
    { x: 12.5, y: 10.5 },
    { x: 10.5, y: 12.5 },
    { x: 12.5, y: 12.5 },
  ],
  yellow: [
    { x: 1.5, y: 10.5 },
    { x: 3.5, y: 10.5 },
    { x: 1.5, y: 12.5 },
    { x: 3.5, y: 12.5 },
  ],
};

// Safe cells where pawns cannot be captured
export const SAFE_CELLS: GridCoord[] = [
  { x: 1, y: 6 },   // Blue start
  { x: 2, y: 8 },   // Blue star safe
  { x: 8, y: 1 },   // Red start
  { x: 6, y: 2 },   // Red star safe
  { x: 13, y: 8 },  // Green start
  { x: 12, y: 6 },  // Green star safe
  { x: 6, y: 13 },  // Yellow start
  { x: 8, y: 12 },  // Yellow star safe
];

export function isSafeCell(coord: GridCoord): boolean {
  return SAFE_CELLS.some((sc) => sc.x === coord.x && sc.y === coord.y);
}

/**
 * Calculates the exact Grid Coordination for a pawn given its color and step index.
 * pathStep = -1 means in Home Base slot.
 * pathStep 0..50 means on the 51 main track tiles before turning into home stretch.
 * pathStep 51..56 means inside the 6 home stretch tiles (56 is Goal Center).
 */
export function getPawnGridCoord(color: PlayerColor, pawnIndex: number, pathStep: number): GridCoord {
  if (pathStep < 0) {
    return HOME_SLOTS[color][pawnIndex];
  }

  // 0 to 50 are main path steps relative to color start
  if (pathStep <= 50) {
    const startIndex = COLOR_START_INDEX[color];
    const mainPathIndex = (startIndex + pathStep) % 52;
    return MAIN_PATH[mainPathIndex];
  }

  // 51 to 56 are home stretch steps (1-indexed into 6-step HOME_STRETCH_PATHS array)
  const homeIndex = Math.min(pathStep - 51, 5);
  return HOME_STRETCH_PATHS[color][homeIndex];
}

/**
 * Utility to check if cell is colored home path tile
 */
export function getCellType(x: number, y: number): {
  type: 'home_base' | 'main_path' | 'home_stretch' | 'center_goal';
  color?: PlayerColor;
  isStartTile?: boolean;
  isSafeTile?: boolean;
} {
  // Check Home Bases (6x6 corners)
  if (x >= 0 && x <= 5 && y >= 0 && y <= 5) return { type: 'home_base', color: 'blue' };
  if (x >= 9 && x <= 14 && y >= 0 && y <= 5) return { type: 'home_base', color: 'red' };
  if (x >= 9 && x <= 14 && y >= 9 && y <= 14) return { type: 'home_base', color: 'green' };
  if (x >= 0 && x <= 5 && y >= 9 && y <= 14) return { type: 'home_base', color: 'yellow' };

  // Center Goal (3x3 center)
  if (x >= 6 && x <= 8 && y >= 6 && y <= 8) return { type: 'center_goal' };

  // Check Home Stretches
  if (y === 7 && x >= 1 && x <= 5) return { type: 'home_stretch', color: 'blue' };
  if (x === 7 && y >= 1 && y <= 5) return { type: 'home_stretch', color: 'red' };
  if (y === 7 && x >= 9 && x <= 13) return { type: 'home_stretch', color: 'green' };
  if (x === 7 && y >= 9 && y <= 13) return { type: 'home_stretch', color: 'yellow' };

  // Starts
  if (x === 1 && y === 6) return { type: 'main_path', color: 'blue', isStartTile: true, isSafeTile: true };
  if (x === 8 && y === 1) return { type: 'main_path', color: 'red', isStartTile: true, isSafeTile: true };
  if (x === 13 && y === 8) return { type: 'main_path', color: 'green', isStartTile: true, isSafeTile: true };
  if (x === 6 && y === 13) return { type: 'main_path', color: 'yellow', isStartTile: true, isSafeTile: true };

  // Star safe tiles
  const safe = isSafeCell({ x, y });
  return { type: 'main_path', isSafeTile: safe };
}
