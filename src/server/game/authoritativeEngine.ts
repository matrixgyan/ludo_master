import crypto from 'crypto';
import { PlayerColor, Pawn, GameState, Player, DiceState } from '../../types/game';
import { getPawnGridCoord, SAFE_CELL_INDEXES } from '../../game/boardGeometry';

export interface AuthoritativeGameSession {
  gameId: string;
  gameType: string;
  mode: '2_PLAYER' | '4_PLAYER' | 'SNAKE_LUDO';
  status: 'WAITING' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  version: number;
  sequenceNumber: number;
  currentTurn: PlayerColor;
  turnNumber: number;
  dice: DiceState;
  consecutiveSixes: number;
  players: Record<PlayerColor, Player>;
  winner: PlayerColor | null;
  startedAt: number;
  completedAt?: number;
}

export class AuthoritativeLudoEngine {
  /**
   * Initializes a brand-new authoritative game session
   */
  static createNewGame(
    gameId: string,
    mode: '2_PLAYER' | '4_PLAYER' | 'SNAKE_LUDO' = '2_PLAYER',
    participants: { userId: string; username: string; color: PlayerColor; isHuman: boolean; avatarUrl?: string }[]
  ): AuthoritativeGameSession {
    const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
    const players: Record<PlayerColor, Player> = {} as Record<PlayerColor, Player>;

    colors.forEach((color) => {
      const participant = participants.find((p) => p.color === color);
      const isParticipant = !!participant;

      const pawns: Pawn[] = [0, 1, 2, 3].map((index) => {
        const coord = getPawnGridCoord(color, index, -1);
        return {
          id: `${color}-${index}`,
          playerId: isParticipant ? participant.userId : `bot-${color}`,
          color,
          pawnIndex: index,
          state: 'home',
          pathStep: -1,
          gridX: coord.x,
          gridY: coord.y,
        };
      });

      players[color] = {
        id: isParticipant ? participant.userId : `bot-${color}`,
        name: isParticipant ? participant.username : `Player ${color.toUpperCase()}`,
        avatarUrl: participant?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${color}`,
        color,
        level: 1,
        isActive: isParticipant,
        isMuted: false,
        isSpeaking: false,
        isHuman: isParticipant ? participant.isHuman : false,
        pawns,
        score: 0,
      };
    });

    const firstColor = participants[0]?.color || 'red';

    return {
      gameId,
      gameType: 'LUDO_CLASSIC',
      mode,
      status: 'IN_PROGRESS',
      version: 1,
      sequenceNumber: 1,
      currentTurn: firstColor,
      turnNumber: 1,
      dice: {
        value: 6,
        isRolling: false,
        hasRolled: false,
        canRoll: true,
      },
      consecutiveSixes: 0,
      players,
      winner: null,
      startedAt: Date.now(),
    };
  }

  /**
   * Cryptographically secure authoritative dice roll (1 to 6)
   */
  static rollDiceAuthoritative(session: AuthoritativeGameSession, actorUserId: string): {
    session: AuthoritativeGameSession;
    rollValue: number;
    movablePawnIds: string[];
    consecutiveSixesPenalty: boolean;
  } {
    const activePlayer = session.players[session.currentTurn];
    if (activePlayer.id !== actorUserId && !actorUserId.startsWith('bot-') && actorUserId !== 'system') {
      throw new Error(`Not your turn. Current turn belongs to ${session.currentTurn}`);
    }

    if (session.dice.hasRolled && !session.dice.canRoll) {
      throw new Error('Dice has already been rolled for this turn');
    }

    // Cryptographic 1..6 roll
    const rollValue = crypto.randomInt(1, 7);
    let consecutiveSixes = session.consecutiveSixes;

    if (rollValue === 6) {
      consecutiveSixes += 1;
    } else {
      consecutiveSixes = 0;
    }

    // Three consecutive sixes penalty
    if (consecutiveSixes >= 3) {
      const nextTurn = this.getNextTurn(session.currentTurn, session.players);
      session.currentTurn = nextTurn;
      session.consecutiveSixes = 0;
      session.dice = {
        value: rollValue,
        isRolling: false,
        hasRolled: false,
        canRoll: true,
      };
      session.turnNumber += 1;
      session.version += 1;
      session.sequenceNumber += 1;

      return {
        session,
        rollValue,
        movablePawnIds: [],
        consecutiveSixesPenalty: true,
      };
    }

    // Compute legal movable pawns for this roll
    const movablePawnIds = this.getMovablePawns(activePlayer, rollValue);

    // If no moves possible, pass turn immediately
    if (movablePawnIds.length === 0 && rollValue !== 6) {
      const nextTurn = this.getNextTurn(session.currentTurn, session.players);
      session.currentTurn = nextTurn;
      session.consecutiveSixes = 0;
      session.dice = {
        value: rollValue,
        isRolling: false,
        hasRolled: false,
        canRoll: true,
      };
      session.turnNumber += 1;
      session.version += 1;
      session.sequenceNumber += 1;
    } else {
      session.dice = {
        value: rollValue,
        isRolling: false,
        hasRolled: true,
        canRoll: false,
      };
      session.consecutiveSixes = consecutiveSixes;
      session.version += 1;
      session.sequenceNumber += 1;
    }

    return {
      session,
      rollValue,
      movablePawnIds,
      consecutiveSixesPenalty: false,
    };
  }

  /**
   * Authoritative Move Token validation & execution
   */
  static moveTokenAuthoritative(
    session: AuthoritativeGameSession,
    actorUserId: string,
    pawnId: string
  ): {
    session: AuthoritativeGameSession;
    movedPawn: Pawn;
    capturedPawn?: Pawn;
    reachedGoal: boolean;
    isGameWon: boolean;
    extraTurn: boolean;
  } {
    const activeColor = session.currentTurn;
    const player = session.players[activeColor];

    if (player.id !== actorUserId && !actorUserId.startsWith('bot-') && actorUserId !== 'system') {
      throw new Error(`Turn mismatch. It is ${activeColor}'s turn.`);
    }

    if (!session.dice.hasRolled) {
      throw new Error('You must roll the dice before moving a token.');
    }

    const pawnIndex = player.pawns.findIndex((p) => p.id === pawnId);
    if (pawnIndex === -1) {
      throw new Error(`Pawn ${pawnId} does not belong to current player ${activeColor}`);
    }

    const pawn = player.pawns[pawnIndex];
    const diceVal = session.dice.value;

    let nextStep = pawn.pathStep;
    let nextState = pawn.state;

    if (pawn.state === 'home') {
      if (diceVal === 6) {
        nextStep = 0;
        nextState = 'path';
      } else {
        throw new Error('A roll of 6 is required to deploy from base.');
      }
    } else if (pawn.state === 'path') {
      nextStep += diceVal;
      if (nextStep === 56) {
        nextState = 'goal';
      } else if (nextStep > 56) {
        throw new Error('Exact roll required to reach home goal.');
      }
    } else {
      throw new Error('Pawn is already in the goal.');
    }

    const targetCoord = getPawnGridCoord(activeColor, pawn.pawnIndex, nextStep);

    // Update pawn
    const updatedPawn: Pawn = {
      ...pawn,
      pathStep: nextStep,
      state: nextState,
      gridX: targetCoord.x,
      gridY: targetCoord.y,
    };
    player.pawns[pawnIndex] = updatedPawn;

    // Check for captures on opponent pawns (if outside safe tiles)
    let capturedPawn: Pawn | undefined;
    const isSafe = SAFE_CELL_INDEXES.includes(nextStep) || nextStep > 50;

    if (!isSafe && nextState === 'path') {
      const otherColors = (['red', 'green', 'yellow', 'blue'] as PlayerColor[]).filter((c) => c !== activeColor);
      for (const oc of otherColors) {
        const opPlayer = session.players[oc];
        if (!opPlayer.isActive) continue;

        for (let i = 0; i < opPlayer.pawns.length; i++) {
          const op = opPlayer.pawns[i];
          if (op.state === 'path' && op.pathStep >= 0 && op.pathStep <= 50) {
            const opCoord = getPawnGridCoord(oc, op.pawnIndex, op.pathStep);
            if (opCoord.x === targetCoord.x && opCoord.y === targetCoord.y) {
              // Captured! Send opponent pawn back to base
              const homeCoord = getPawnGridCoord(oc, op.pawnIndex, -1);
              capturedPawn = {
                ...op,
                state: 'home',
                pathStep: -1,
                gridX: homeCoord.x,
                gridY: homeCoord.y,
              };
              opPlayer.pawns[i] = capturedPawn;
              break;
            }
          }
        }
        if (capturedPawn) break;
      }
    }

    const reachedGoal = nextStep === 56;
    const allInGoal = player.pawns.every((p) => p.state === 'goal');
    const isGameWon = allInGoal;

    if (isGameWon) {
      session.status = 'COMPLETED';
      session.winner = activeColor;
      session.completedAt = Date.now();
    }

    // Extra turn on rolling 6, capturing opponent, or reaching goal
    const extraTurn = (diceVal === 6 || !!capturedPawn || reachedGoal) && !isGameWon;

    if (!extraTurn && !isGameWon) {
      session.currentTurn = this.getNextTurn(activeColor, session.players);
      session.consecutiveSixes = 0;
    }

    // Reset dice for next move
    session.dice = {
      value: diceVal,
      isRolling: false,
      hasRolled: false,
      canRoll: true,
    };

    session.turnNumber += 1;
    session.version += 1;
    session.sequenceNumber += 1;

    return {
      session,
      movedPawn: updatedPawn,
      capturedPawn,
      reachedGoal,
      isGameWon,
      extraTurn,
    };
  }

  /**
   * Helper to identify movable pawns for a player given a dice roll
   */
  static getMovablePawns(player: Player, rollValue: number): string[] {
    return player.pawns
      .filter((pawn) => {
        if (pawn.state === 'home') {
          return rollValue === 6;
        }
        if (pawn.state === 'path') {
          return pawn.pathStep + rollValue <= 56;
        }
        return false;
      })
      .map((p) => p.id);
  }

  /**
   * Turn rotation among active players
   */
  static getNextTurn(current: PlayerColor, players: Record<PlayerColor, Player>): PlayerColor {
    const order: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
    let idx = order.indexOf(current);

    for (let i = 1; i <= 4; i++) {
      const nextIdx = (idx + i) % 4;
      const nextColor = order[nextIdx];
      if (players[nextColor]?.isActive) {
        return nextColor;
      }
    }
    return current;
  }
}
