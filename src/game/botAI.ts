import { GameState, PlayerColor } from '../types/game';
import { isSafeCell, getPawnGridCoord } from './boardGeometry';

/**
 * Calculates a smart dice roll for bot players based on match settings
 * and human win-rate limiter (configured in Admin Settings).
 */
export function getSmartBotRoll(
  gameState: GameState,
  botColor: PlayerColor,
  activeColors: PlayerColor[],
  isSupreme: boolean,
  humanWinRate: number = 20
): number {
  const botPlayer = gameState.players[botColor];
  if (!botPlayer) return Math.floor(Math.random() * 6) + 1;

  // Probability that the bot gets strategic priority
  const botAdvantageChance = Math.max(0, Math.min(100, 100 - humanWinRate)) / 100;
  const shouldFavorBot = Math.random() < botAdvantageChance;

  if (!shouldFavorBot) {
    return Math.floor(Math.random() * 6) + 1;
  }

  // Evaluate roll options: 6 down to 1
  const candidateRolls = [6, 5, 4, 3, 2, 1];
  for (const roll of candidateRolls) {
    for (const pawn of botPlayer.pawns) {
      if (pawn.state === 'goal') continue;

      if (pawn.pathStep === -1) {
        if (roll === 6) return 6; // open pawn
        continue;
      }

      const targetStep = pawn.pathStep + roll;
      if (targetStep === 56) return roll; // exact home goal!

      if (targetStep >= 0 && targetStep <= 50) {
        const targetCoord = getPawnGridCoord(botColor, pawn.pawnIndex, targetStep);
        if (!isSafeCell(targetCoord)) {
          for (const otherColor of activeColors) {
            if (otherColor !== botColor) {
              const otherPlayer = gameState.players[otherColor];
              for (const op of otherPlayer.pawns) {
                if (op.pathStep >= 0 && op.pathStep <= 50) {
                  const opCoord = getPawnGridCoord(otherColor, op.pawnIndex, op.pathStep);
                  if (opCoord.x === targetCoord.x && opCoord.y === targetCoord.y) {
                    return roll; // Cut opponent pawn!
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Selects the optimal movable pawn for a bot player.
 */
export function chooseBestBotPawn(
  gameState: GameState,
  botColor: PlayerColor,
  activeColors: PlayerColor[],
  movableIds: string[],
  isSupreme: boolean
): string {
  if (movableIds.length === 0) return '';
  if (movableIds.length === 1) return movableIds[0];

  const botPlayer = gameState.players[botColor];
  if (!botPlayer) return movableIds[0];

  let bestPawnId = movableIds[0];
  let highestScore = -99999;
  const roll = gameState.dice.value;

  for (const pawnId of movableIds) {
    const pawn = botPlayer.pawns.find((p) => p.id === pawnId);
    if (!pawn) continue;

    let score = 0;
    const finalStep = pawn.pathStep === -1 ? 0 : pawn.pathStep + roll;

    // 1. Reaching home
    if (finalStep === 56) {
      score += 600;
    }

    // 2. Entering safe home column
    if (finalStep >= 51 && finalStep < 56) {
      score += 200;
    }

    // 3. Captures on target tile
    if (finalStep >= 0 && finalStep <= 50) {
      const targetCoord = getPawnGridCoord(botColor, pawn.pawnIndex, finalStep);
      if (!isSafeCell(targetCoord)) {
        for (const otherColor of activeColors) {
          if (otherColor !== botColor) {
            const otherPlayer = gameState.players[otherColor];
            const isHumanTarget = otherPlayer.isHuman || otherPlayer.id === 'p1';
            for (const op of otherPlayer.pawns) {
              if (op.pathStep >= 0 && op.pathStep <= 50) {
                const opCoord = getPawnGridCoord(otherColor, op.pawnIndex, op.pathStep);
                if (opCoord.x === targetCoord.x && opCoord.y === targetCoord.y) {
                  score += isHumanTarget ? 500 : 300; // prioritize capturing human
                }
              }
            }
          }
        }
      } else {
        score += 100; // safe star bonus
      }
    }

    // 4. Moving out from base on a 6
    if (pawn.pathStep === -1 && roll === 6) {
      score += 140;
    }

    // 5. Normal movement progress
    score += finalStep * 2;

    if (score > highestScore) {
      highestScore = score;
      bestPawnId = pawnId;
    }
  }

  return bestPawnId;
}
