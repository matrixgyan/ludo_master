export enum GameMode {
  ONLINE_ARENA = 'ONLINE_ARENA',
  LUDO_SUPREME = 'LUDO_SUPREME',
  SNAKE_LUDO = 'SNAKE_LUDO',
}

export const SUPPORTED_PLAYER_COUNTS = [2, 3, 4] as const;
export type PlayerCount = (typeof SUPPORTED_PLAYER_COUNTS)[number];

export const SUPPORTED_ENTRY_FEES = [
  '0.00000000',
  '1.00000000',
  '5.00000000',
  '10.00000000',
  '20.00000000',
  '25.00000000',
  '50.00000000',
  '100.00000000',
  '250.00000000',
  '500.00000000',
  '1000.00000000',
] as const;
export type EntryFee = (typeof SUPPORTED_ENTRY_FEES)[number];

export const ENTRY_FEE_NUMBERS = [0, 1, 5, 10, 20, 25, 50, 100, 250, 500, 1000] as const;

export interface GameModeConfig {
  gameMode: GameMode;
  name: string;
  description: string;
  ruleVersion: string;
  pawnsPerPlayer: number;
  matchDurationSeconds: number; // 0 for unlimited (Arena), 300 for Supreme (5 mins)
  turnTimeoutSeconds: number; // 15 seconds per turn
  reconnectGraceSeconds: number; // 60 seconds
  defaultPlatformFeeRate: number; // e.g. 0.10 for 10%
  homeMultiplier: number; // 2x for Supreme
  captureBonus: number; // +10 points for Supreme
  enabled: boolean;
}

export const DEFAULT_GAME_CONFIGS: Record<GameMode, GameModeConfig> = {
  [GameMode.ONLINE_ARENA]: {
    gameMode: GameMode.ONLINE_ARENA,
    name: 'Online Arena (Classic Ludo)',
    description: 'Traditional full Ludo match with 4 pawns per player. First player to bring all 4 pawns HOME wins.',
    ruleVersion: 'v1',
    pawnsPerPlayer: 4,
    matchDurationSeconds: 0, // No fixed timer; continues until all 4 pawns reach home
    turnTimeoutSeconds: 15,
    reconnectGraceSeconds: 60,
    defaultPlatformFeeRate: 0.10, // 10% platform fee
    homeMultiplier: 1,
    captureBonus: 0,
    enabled: true,
  },
  [GameMode.LUDO_SUPREME]: {
    gameMode: GameMode.LUDO_SUPREME,
    name: 'Ludo Supreme (Fast 5-Min Timer)',
    description: 'Fast-paced competitive 5-minute match. Point scoring on movement, captures, and home multiplier.',
    ruleVersion: 'v1',
    pawnsPerPlayer: 4,
    matchDurationSeconds: 300, // Exactly 5 minutes (300 seconds)
    turnTimeoutSeconds: 15,
    reconnectGraceSeconds: 60,
    defaultPlatformFeeRate: 0.10, // 10% platform fee
    homeMultiplier: 2, // 2x score for reaching home
    captureBonus: 10, // +10 points on capture
    enabled: true,
  },
  [GameMode.SNAKE_LUDO]: {
    gameMode: GameMode.SNAKE_LUDO,
    name: 'Snake Ludo (1-100 Adventure)',
    description: 'Classic Snakes & Ladders 100-tile race with 1 token per player. First to tile 100 wins.',
    ruleVersion: 'v1',
    pawnsPerPlayer: 1,
    matchDurationSeconds: 0,
    turnTimeoutSeconds: 10,
    reconnectGraceSeconds: 60,
    defaultPlatformFeeRate: 0.10,
    homeMultiplier: 1,
    captureBonus: 0,
    enabled: true,
  },
};

export interface MatchPoolDefinition {
  poolId: string;
  poolKey: string; // e.g. 'ONLINE_ARENA:4:5:v1'
  gameMode: GameMode;
  playerCount: PlayerCount;
  entryFee: string;
  entryFeeUsdt: number;
  ruleVersion: string;
  platformFeeRate: number;
  isActive: boolean;
  minBufferRooms: number; // Demand-aware auto-provision buffer (default: 1)
}

/**
 * Generate all deterministic pool combinations
 */
export function generateAllMatchPools(): MatchPoolDefinition[] {
  const pools: MatchPoolDefinition[] = [];
  const modes = [GameMode.ONLINE_ARENA, GameMode.LUDO_SUPREME, GameMode.SNAKE_LUDO];

  for (const mode of modes) {
    const config = DEFAULT_GAME_CONFIGS[mode];
    for (const count of SUPPORTED_PLAYER_COUNTS) {
      for (const fee of SUPPORTED_ENTRY_FEES) {
        const feeNumber = parseFloat(fee);
        const poolKey = `${mode}:${count}:${feeNumber}:${config.ruleVersion}`;
        const poolId = `pool_${mode.toLowerCase()}_${count}p_${feeNumber}u_${config.ruleVersion}`;

        pools.push({
          poolId,
          poolKey,
          gameMode: mode,
          playerCount: count,
          entryFee: fee,
          entryFeeUsdt: feeNumber,
          ruleVersion: config.ruleVersion,
          platformFeeRate: config.defaultPlatformFeeRate,
          isActive: true,
          minBufferRooms: 1, // Keep 1 ready open room per active pool
        });
      }
    }
  }

  return pools;
}

export const ALL_MATCH_POOLS = generateAllMatchPools();

export function findMatchPool(
  gameMode: GameMode | string,
  playerCount: number,
  entryFee: number | string,
  ruleVersion = 'v1'
): MatchPoolDefinition | undefined {
  let mode = gameMode as GameMode;
  if (mode !== GameMode.ONLINE_ARENA && mode !== GameMode.LUDO_SUPREME && mode !== GameMode.SNAKE_LUDO) {
    mode = GameMode.ONLINE_ARENA;
  }
  const count = Number(playerCount) as PlayerCount;
  if (!SUPPORTED_PLAYER_COUNTS.includes(count)) {
    return undefined;
  }
  const feeNum = typeof entryFee === 'string' ? parseFloat(entryFee) : entryFee;
  if (isNaN(feeNum) || feeNum < 0) {
    return undefined;
  }

  const targetKey = `${mode}:${count}:${feeNum}:${ruleVersion}`;
  const existing = ALL_MATCH_POOLS.find(
    (p) =>
      p.poolKey === targetKey ||
      (p.gameMode === mode && p.playerCount === count && p.entryFeeUsdt === feeNum)
  );
  if (existing) {
    return existing;
  }

  // Create & register dynamic pool
  const config = DEFAULT_GAME_CONFIGS[mode] || DEFAULT_GAME_CONFIGS[GameMode.ONLINE_ARENA];
  const dynamicPool: MatchPoolDefinition = {
    poolId: `pool_${mode.toLowerCase()}_${count}p_${feeNum}u_${ruleVersion}`,
    poolKey: targetKey,
    gameMode: mode,
    playerCount: count,
    entryFee: feeNum.toFixed(8),
    entryFeeUsdt: feeNum,
    ruleVersion: ruleVersion || config.ruleVersion,
    platformFeeRate: config.defaultPlatformFeeRate,
    isActive: true,
    minBufferRooms: 1,
  };
  ALL_MATCH_POOLS.push(dynamicPool);
  return dynamicPool;
}
