import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { PlayerColor, Pawn, Player, DiceState } from '../../types/game';
import { getPawnGridCoord, SAFE_CELL_INDEXES } from '../../game/boardGeometry';
import { getDbPool, isPostgresConfigured } from '../db/client';
import { Logger } from '../config/env';

export interface ScoreEventRecord {
  id: string;
  matchId: string;
  sequenceNumber: number;
  userId: string;
  pawnId?: string;
  eventType: 'MOVE_SCORE' | 'HOME_MULTIPLIER' | 'CAPTURE_BONUS' | 'PAWN_SCORE_RESET' | 'PENALTY';
  deltaScore: number;
  resultingScore: number;
  details?: Record<string, unknown>;
  timestamp: number;
}

export interface SupremePlayerState extends Player {
  capturesCount: number;
  totalDistanceMoved: number;
  pawnsHomeCount: number;
  pawnProgress: Record<string, number>; // pawnId -> current step
  lastScoreTimestamp: number;
  seatIndex: number;
}

export interface AuthoritativeSupremeSession {
  matchId: string;
  gameMode: 'LUDO_SUPREME';
  playerCount: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  version: number;
  sequenceNumber: number;
  currentTurn: PlayerColor;
  turnNumber: number;
  dice: DiceState;
  consecutiveSixes: number;
  players: Record<PlayerColor, SupremePlayerState>;
  scoreLedger: ScoreEventRecord[];
  startedAt: number; // ms timestamp
  endsAt: number; // startedAt + 300_000 (5 minutes)
  completedAt?: number;
  winnerUserId?: string;
  winnerColor?: PlayerColor;
  finalRankings?: {
    userId: string;
    color: PlayerColor;
    rank: number;
    score: number;
    tokensHome: number;
    captures: number;
    distance: number;
  }[];
}

export class LudoSupremeEngine {
  public static readonly DURATION_MS = 300 * 1000; // 5 minutes
  public static readonly HOME_MULTIPLIER = 2; // 2x score for goal
  public static readonly CAPTURE_BONUS = 10; // +10 points for capture

  /**
   * Initializes an authoritative 5-minute Ludo Supreme game session
   */
  public static createSupremeSession(
    matchId: string,
    participants: { userId: string; username: string; color: PlayerColor; seatIndex: number; isHuman: boolean; avatarUrl?: string }[]
  ): AuthoritativeSupremeSession {
    const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
    const players: Record<PlayerColor, SupremePlayerState> = {} as Record<PlayerColor, SupremePlayerState>;

    const now = Date.now();
    const endsAt = now + this.DURATION_MS;

    colors.forEach((color) => {
      const participant = participants.find((p) => p.color === color);
      const isParticipant = !!participant;

      const pawnProgress: Record<string, number> = {};
      const pawns: Pawn[] = [0, 1, 2, 3].map((index) => {
        const coord = getPawnGridCoord(color, index, -1);
        const pawnId = `${color}-${index}`;
        pawnProgress[pawnId] = 0;
        return {
          id: pawnId,
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
        capturesCount: 0,
        totalDistanceMoved: 0,
        pawnsHomeCount: 0,
        pawnProgress,
        lastScoreTimestamp: now,
        seatIndex: participant ? participant.seatIndex : 0,
      };
    });

    const firstColor = participants[0]?.color || 'red';

    return {
      matchId,
      gameMode: 'LUDO_SUPREME',
      playerCount: participants.length,
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
      scoreLedger: [],
      startedAt: now,
      endsAt,
    };
  }

  /**
   * Check if 5-minute timer has expired; if so, finalize rankings deterministically
   */
  public static checkTimerExpiry(session: AuthoritativeSupremeSession): boolean {
    if (session.status === 'COMPLETED') return true;

    const now = Date.now();
    if (now >= session.endsAt) {
      session.status = 'COMPLETED';
      session.completedAt = now;
      session.finalRankings = this.computeDeterministicRankings(session);
      if (session.finalRankings.length > 0) {
        session.winnerUserId = session.finalRankings[0].userId;
        session.winnerColor = session.finalRankings[0].color;
      }
      return true;
    }
    return false;
  }

  /**
   * Cryptographically secure authoritative dice roll for Ludo Supreme
   */
  public static rollDice(
    session: AuthoritativeSupremeSession,
    actorUserId: string
  ): {
    session: AuthoritativeSupremeSession;
    rollValue: number;
    movablePawnIds: string[];
    consecutiveSixesPenalty: boolean;
    isTimerExpired: boolean;
  } {
    if (this.checkTimerExpiry(session)) {
      return {
        session,
        rollValue: 0,
        movablePawnIds: [],
        consecutiveSixesPenalty: false,
        isTimerExpired: true,
      };
    }

    const activePlayer = session.players[session.currentTurn];
    if (activePlayer.id !== actorUserId && !actorUserId.startsWith('bot-') && actorUserId !== 'system') {
      throw new Error(`Not your turn. Current turn belongs to ${session.currentTurn}`);
    }

    if (session.dice.hasRolled && !session.dice.canRoll) {
      throw new Error('Dice has already been rolled for this turn');
    }

    const rollValue = crypto.randomInt(1, 7);
    let consecutiveSixes = session.consecutiveSixes;

    if (rollValue === 6) {
      consecutiveSixes += 1;
    } else {
      consecutiveSixes = 0;
    }

    // 3 consecutive sixes penalty -> turn pass
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
        isTimerExpired: false,
      };
    }

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
      isTimerExpired: false,
    };
  }

  /**
   * Authoritative Move Token execution with Supreme scoring and capture handling
   */
  public static moveToken(
    session: AuthoritativeSupremeSession,
    actorUserId: string,
    pawnId: string
  ): {
    session: AuthoritativeSupremeSession;
    movedPawn: Pawn;
    capturedPawn?: Pawn;
    deltaScore: number;
    totalScore: number;
    reachedGoal: boolean;
    extraTurn: boolean;
    isGameWon: boolean;
  } {
    if (this.checkTimerExpiry(session)) {
      throw new Error('5-minute match timer has expired. Game is completed.');
    }

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
    let moveDistance = 0;

    if (pawn.state === 'home') {
      if (diceVal === 6) {
        nextStep = 0;
        nextState = 'path';
        moveDistance = 1; // 1 step out of base
      } else {
        throw new Error('A roll of 6 is required to deploy from base.');
      }
    } else if (pawn.state === 'path') {
      nextStep += diceVal;
      moveDistance = diceVal;
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
    player.pawnProgress[pawnId] = nextStep >= 0 ? nextStep + 1 : 0;
    player.totalDistanceMoved += moveDistance;

    let earnedScoreThisMove = moveDistance; // +1 point per step moved

    // 1. Record MOVE_SCORE in ledger
    this.recordScoreEvent(session, player.id, pawnId, 'MOVE_SCORE', moveDistance, {
      fromStep: pawn.pathStep,
      toStep: nextStep,
      diceVal,
    });

    // 2. Goal Entry with HOME_MULTIPLIER (2x)
    const reachedGoal = nextStep === 56;
    if (reachedGoal) {
      player.pawnsHomeCount += 1;
      // Multiplier applies to completed pawn: adds bonus equal to full distance (56)
      const homeBonus = 56 * (this.HOME_MULTIPLIER - 1);
      earnedScoreThisMove += homeBonus;
      this.recordScoreEvent(session, player.id, pawnId, 'HOME_MULTIPLIER', homeBonus, {
        multiplier: this.HOME_MULTIPLIER,
        pawnId,
      });
    }

    // 3. Captures on opponent pawns (if outside safe tiles)
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
              // Captured!
              const victimPawnProgress = opPlayer.pawnProgress[op.id] || (op.pathStep + 1);

              // Deduct accumulated distance score from victim
              this.recordScoreEvent(session, opPlayer.id, op.id, 'PAWN_SCORE_RESET', -victimPawnProgress, {
                capturedBy: player.id,
                lostProgress: victimPawnProgress,
              });

              // Award capture bonus to capturer
              player.capturesCount += 1;
              earnedScoreThisMove += this.CAPTURE_BONUS;
              this.recordScoreEvent(session, player.id, pawnId, 'CAPTURE_BONUS', this.CAPTURE_BONUS, {
                capturedPawnId: op.id,
                victimUserId: opPlayer.id,
              });

              // Reset victim pawn back to base
              const homeCoord = getPawnGridCoord(oc, op.pawnIndex, -1);
              capturedPawn = {
                ...op,
                state: 'home',
                pathStep: -1,
                gridX: homeCoord.x,
                gridY: homeCoord.y,
              };
              opPlayer.pawns[i] = capturedPawn;
              opPlayer.pawnProgress[op.id] = 0;
              break;
            }
          }
        }
        if (capturedPawn) break;
      }
    }

    // Check if all 4 pawns reached home
    const allInGoal = player.pawns.every((p) => p.state === 'goal');
    const isGameWon = allInGoal;

    if (isGameWon) {
      session.status = 'COMPLETED';
      session.completedAt = Date.now();
      session.winnerUserId = player.id;
      session.winnerColor = activeColor;
      session.finalRankings = this.computeDeterministicRankings(session);
    }

    // Extra turn on rolling 6, capturing, or reaching goal
    const extraTurn = (diceVal === 6 || !!capturedPawn || reachedGoal) && !isGameWon;

    if (!extraTurn && !isGameWon) {
      session.currentTurn = this.getNextTurn(activeColor, session.players);
      session.consecutiveSixes = 0;
    }

    // Reset dice
    session.dice = {
      value: diceVal,
      isRolling: false,
      hasRolled: false,
      canRoll: true,
    };

    session.turnNumber += 1;
    session.version += 1;
    session.sequenceNumber += 1;

    // Check timer expiry after move
    this.checkTimerExpiry(session);

    return {
      session,
      movedPawn: updatedPawn,
      capturedPawn,
      deltaScore: earnedScoreThisMove,
      totalScore: player.score,
      reachedGoal,
      extraTurn,
      isGameWon,
    };
  }

  /**
   * Appends an auditable score event to session ledger and updates player aggregate score
   */
  private static recordScoreEvent(
    session: AuthoritativeSupremeSession,
    userId: string,
    pawnId: string | undefined,
    eventType: ScoreEventRecord['eventType'],
    deltaScore: number,
    details?: Record<string, unknown>
  ): void {
    const player = Object.values(session.players).find((p) => p.id === userId);
    if (!player) return;

    player.score = Math.max(0, player.score + deltaScore);
    player.lastScoreTimestamp = Date.now();

    const record: ScoreEventRecord = {
      id: `se_${uuidv4()}`,
      matchId: session.matchId,
      sequenceNumber: session.scoreLedger.length + 1,
      userId,
      pawnId,
      eventType,
      deltaScore,
      resultingScore: player.score,
      details,
      timestamp: Date.now(),
    };

    session.scoreLedger.push(record);

    // Persist score event to PostgreSQL if configured
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        pool.query(
          `INSERT INTO score_events (
             id, match_id, sequence_number, user_id, pawn_id, event_type, delta_score, resulting_score, details
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT DO NOTHING`,
          [
            record.id,
            record.matchId,
            record.sequenceNumber,
            record.userId,
            record.pawnId || null,
            record.eventType,
            record.deltaScore,
            record.resultingScore,
            JSON.stringify(details || {}),
          ]
        ).catch((err) => {
          Logger.warn('Async score_event insert notice', err);
        });
      }
    }
  }

  /**
   * Deterministic Tie-Breaking Hierarchy:
   * 1. Higher total score
   * 2. Higher captures count
   * 3. Higher total completed distance
   * 4. Earlier score timestamp (faster earner)
   * 5. Lower seat index
   */
  public static computeDeterministicRankings(session: AuthoritativeSupremeSession) {
    const activePlayers = Object.values(session.players).filter((p) => p.isActive);

    activePlayers.sort((a, b) => {
      // 1. Total Score
      if (b.score !== a.score) return b.score - a.score;
      // 2. Captures Made
      if (b.capturesCount !== a.capturesCount) return b.capturesCount - a.capturesCount;
      // 3. Total Distance
      if (b.totalDistanceMoved !== a.totalDistanceMoved) return b.totalDistanceMoved - a.totalDistanceMoved;
      // 4. Earlier Score Timestamp
      if (a.lastScoreTimestamp !== b.lastScoreTimestamp) return a.lastScoreTimestamp - b.lastScoreTimestamp;
      // 5. Seat Index
      return a.seatIndex - b.seatIndex;
    });

    return activePlayers.map((p, idx) => ({
      userId: p.id,
      color: p.color,
      rank: idx + 1,
      score: p.score,
      tokensHome: p.pawnsHomeCount,
      captures: p.capturesCount,
      distance: p.totalDistanceMoved,
    }));
  }

  /**
   * Helper to identify movable pawns
   */
  public static getMovablePawns(player: Player, rollValue: number): string[] {
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
   * Turn rotation
   */
  public static getNextTurn(current: PlayerColor, players: Record<PlayerColor, SupremePlayerState>): PlayerColor {
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
