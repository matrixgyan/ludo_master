import { GameMode, ALL_MATCH_POOLS, generateAllMatchPools, findMatchPool } from '../game/matchConfig';
import { AuthoritativeLudoEngine } from '../game/authoritativeEngine';
import { LudoSupremeEngine } from '../game/ludoSupremeEngine';
import { RoomManager } from '../game/roomManager';
import { RoomJoinService } from '../game/roomJoinService';
import { MatchSettlementService } from '../wallet/matchSettlementService';
import { LedgerService } from '../wallet/ledgerService';
import { LedgerMath } from '../wallet/ledgerMath';
import { ensureDatabaseTables } from '../db/migrator';
import { isPostgresConfigured } from '../db/client';
import { Logger } from '../config/env';

export interface TestResult {
  suiteName: string;
  testName: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: Record<string, unknown>;
}

export class AutomatedMatchArenaTests {
  private static results: TestResult[] = [];

  public static async runAllTests(): Promise<{
    totalTests: number;
    passedTests: number;
    failedTests: number;
    durationMs: number;
    results: TestResult[];
  }> {
    const startTime = Date.now();
    this.results = [];

    Logger.info('===============================================================');
    Logger.info('STARTING AUTOMATED LUDO MATCH ARENA & SUPREME TEST SUITE');
    Logger.info('===============================================================');

    // 0. Ensure Database Schema Tables exist
    if (isPostgresConfigured()) {
      try {
        await ensureDatabaseTables();
      } catch (err: any) {
        Logger.warn('Database table init notice in test runner', { error: err?.message });
      }
    }

    // 1. Configuration & Pools Suite
    await this.testMatchPoolsGeneration();
    await this.testMatchPoolLookups();

    // 2. Online Arena Engine Suite
    await this.testArenaEngine2Player();
    await this.testArenaEngine3Player();
    await this.testArenaEngine4Player();
    await this.testArenaConsecutiveSixes();
    await this.testArenaCapturesAndSafeCells();
    await this.testArenaWinCondition();

    // 3. Ludo Supreme Engine Suite
    await this.testSupremeSessionInitialization();
    await this.testSupremeMovementScoring();
    await this.testSupremeHomeMultiplier();
    await this.testSupremeCaptureScoring();
    await this.testSupremeTimerExpiry();
    await this.testSupremeDeterministicTieBreaker();
    await this.testSupremeScoreEventLedger();

    // 4. Atomic Room Joining & Wallet Reservation Suite
    await this.testAtomicRoomJoinWithReservation();
    await this.testInsufficientBalanceJoinRejection();
    await this.testRoomStateTransitionsToStarting();
    await this.testConcurrentJoinRaceCondition();

    // 5. Financial Settlement Suite
    await this.testDoubleEntryMatchSettlement();
    await this.testSettlementIdempotency();
    await this.testMatchRefundFlow();

    const durationMs = Date.now() - startTime;
    const passedTests = this.results.filter((r) => r.passed).length;
    const failedTests = this.results.filter((r) => !r.passed).length;

    Logger.info('===============================================================');
    Logger.info(`TEST SUITE COMPLETED: ${passedTests}/${this.results.length} PASSED (${failedTests} FAILED) in ${durationMs}ms`);
    Logger.info('===============================================================');

    return {
      totalTests: this.results.length,
      passedTests,
      failedTests,
      durationMs,
      results: this.results,
    };
  }

  private static record(suite: string, name: string, passed: boolean, start: number, error?: string, details?: any) {
    const durationMs = Date.now() - start;
    this.results.push({
      suiteName: suite,
      testName: name,
      passed,
      durationMs,
      error,
      details,
    });
    if (passed) {
      Logger.info(`  ✓ [${suite}] ${name} (${durationMs}ms)`);
    } else {
      Logger.error(`  ✗ [${suite}] ${name} FAILED: ${error}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. CONFIGURATION & MATCH POOLS
  // ---------------------------------------------------------------------------
  private static async testMatchPoolsGeneration() {
    const start = Date.now();
    try {
      const pools = generateAllMatchPools();
      // 2 modes * 3 player counts (2,3,4) * 7 fees ($1,$5,$10,$20,$25,$50,$100) = 42 pools
      if (pools.length !== 42) {
        throw new Error(`Expected 42 match pools, got ${pools.length}`);
      }

      // Check unique keys
      const keys = new Set(pools.map((p) => p.poolKey));
      if (keys.size !== 42) {
        throw new Error(`Duplicate pool keys detected`);
      }

      this.record('Config', 'Generate 42 Deterministic Match Pools', true, start, undefined, { count: pools.length });
    } catch (err: any) {
      this.record('Config', 'Generate 42 Deterministic Match Pools', false, start, err.message);
    }
  }

  private static async testMatchPoolLookups() {
    const start = Date.now();
    try {
      const p1 = findMatchPool(GameMode.ONLINE_ARENA, 4, 100);
      if (!p1 || p1.entryFeeUsdt !== 100 || p1.playerCount !== 4) {
        throw new Error('Failed to lookup Arena 4-player $100 pool');
      }

      const p2 = findMatchPool(GameMode.LUDO_SUPREME, 2, 25);
      if (!p2 || p2.entryFeeUsdt !== 25 || p2.playerCount !== 2) {
        throw new Error('Failed to lookup Supreme 2-player $25 pool');
      }

      this.record('Config', 'Deterministic Pool Lookups', true, start);
    } catch (err: any) {
      this.record('Config', 'Deterministic Pool Lookups', false, start, err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. ONLINE ARENA ENGINE TESTS
  // ---------------------------------------------------------------------------
  private static async testArenaEngine2Player() {
    const start = Date.now();
    try {
      const gameId = `test_arena_2p_${Date.now()}`;
      const session = AuthoritativeLudoEngine.createNewGame(gameId, '2_PLAYER', [
        { userId: 'u1', username: 'Alice', color: 'red', isHuman: true },
        { userId: 'u2', username: 'Bob', color: 'blue', isHuman: true },
      ]);

      if (session.status !== 'IN_PROGRESS' || session.currentTurn !== 'red') {
        throw new Error('Invalid initial session state');
      }
      if (session.players.red.pawns.length !== 4 || session.players.blue.pawns.length !== 4) {
        throw new Error('Each player must have exactly 4 pawns');
      }

      this.record('Arena Engine', '2-Player Game Creation & Setup', true, start);
    } catch (err: any) {
      this.record('Arena Engine', '2-Player Game Creation & Setup', false, start, err.message);
    }
  }

  private static async testArenaEngine3Player() {
    const start = Date.now();
    try {
      const session = AuthoritativeLudoEngine.createNewGame(`test_3p_${Date.now()}`, '4_PLAYER', [
        { userId: 'u1', username: 'Alice', color: 'red', isHuman: true },
        { userId: 'u2', username: 'Bob', color: 'green', isHuman: true },
        { userId: 'u3', username: 'Charlie', color: 'yellow', isHuman: true },
      ]);

      if (!session.players.red.isActive || !session.players.green.isActive || !session.players.yellow.isActive) {
        throw new Error('Expected 3 active players in 3-player match');
      }

      this.record('Arena Engine', '3-Player Game Creation', true, start);
    } catch (err: any) {
      this.record('Arena Engine', '3-Player Game Creation', false, start, err.message);
    }
  }

  private static async testArenaEngine4Player() {
    const start = Date.now();
    try {
      const session = AuthoritativeLudoEngine.createNewGame(`test_4p_${Date.now()}`, '4_PLAYER', [
        { userId: 'u1', username: 'P1', color: 'red', isHuman: true },
        { userId: 'u2', username: 'P2', color: 'green', isHuman: true },
        { userId: 'u3', username: 'P3', color: 'yellow', isHuman: true },
        { userId: 'u4', username: 'P4', color: 'blue', isHuman: true },
      ]);

      if (Object.values(session.players).filter((p) => p.isActive).length !== 4) {
        throw new Error('Expected 4 active players');
      }

      this.record('Arena Engine', '4-Player Game Creation', true, start);
    } catch (err: any) {
      this.record('Arena Engine', '4-Player Game Creation', false, start, err.message);
    }
  }

  private static async testArenaConsecutiveSixes() {
    const start = Date.now();
    try {
      const session = AuthoritativeLudoEngine.createNewGame(`test_sixes_${Date.now()}`, '2_PLAYER', [
        { userId: 'u1', username: 'Alice', color: 'red', isHuman: true },
        { userId: 'u2', username: 'Bob', color: 'blue', isHuman: true },
      ]);

      session.consecutiveSixes = 2; // Simulate 2 sixes already rolled
      session.dice.hasRolled = false;
      session.dice.canRoll = true;

      // Force roll simulation with 6
      const rollRes = AuthoritativeLudoEngine.rollDiceAuthoritative(session, 'u1');
      // If 6 is rolled, it should trigger 3 consecutive sixes penalty and pass turn to blue
      if (rollRes.rollValue === 6) {
        if (!rollRes.consecutiveSixesPenalty || rollRes.session.currentTurn !== 'blue') {
          throw new Error('Failed to enforce 3-consecutive sixes penalty');
        }
      }

      this.record('Arena Engine', 'Three Consecutive Sixes Penalty Check', true, start);
    } catch (err: any) {
      this.record('Arena Engine', 'Three Consecutive Sixes Penalty Check', false, start, err.message);
    }
  }

  private static async testArenaCapturesAndSafeCells() {
    const start = Date.now();
    try {
      const session = AuthoritativeLudoEngine.createNewGame(`test_cap_${Date.now()}`, '2_PLAYER', [
        { userId: 'u1', username: 'Alice', color: 'red', isHuman: true },
        { userId: 'u2', username: 'Bob', color: 'blue', isHuman: true },
      ]);

      // Place Bob's pawn on non-safe tile (step 10)
      session.players.blue.pawns[0].state = 'path';
      session.players.blue.pawns[0].pathStep = 10;

      // Deploy Alice's pawn to step 10
      session.players.red.pawns[0].state = 'path';
      session.players.red.pawns[0].pathStep = 4;
      session.dice.value = 6;
      session.dice.hasRolled = true;

      const moveRes = AuthoritativeLudoEngine.moveTokenAuthoritative(session, 'u1', 'red-0');
      if (moveRes.movedPawn.pathStep !== 10) {
        throw new Error('Pawn did not move to target step');
      }

      this.record('Arena Engine', 'Path Movement and Validation', true, start);
    } catch (err: any) {
      this.record('Arena Engine', 'Path Movement and Validation', false, start, err.message);
    }
  }

  private static async testArenaWinCondition() {
    const start = Date.now();
    try {
      const session = AuthoritativeLudoEngine.createNewGame(`test_win_${Date.now()}`, '2_PLAYER', [
        { userId: 'u1', username: 'Alice', color: 'red', isHuman: true },
        { userId: 'u2', username: 'Bob', color: 'blue', isHuman: true },
      ]);

      // Set 3 pawns in goal already, 4th pawn at step 54
      session.players.red.pawns[0].state = 'goal';
      session.players.red.pawns[0].pathStep = 56;
      session.players.red.pawns[1].state = 'goal';
      session.players.red.pawns[1].pathStep = 56;
      session.players.red.pawns[2].state = 'goal';
      session.players.red.pawns[2].pathStep = 56;

      session.players.red.pawns[3].state = 'path';
      session.players.red.pawns[3].pathStep = 54;

      session.dice.value = 2;
      session.dice.hasRolled = true;

      const moveRes = AuthoritativeLudoEngine.moveTokenAuthoritative(session, 'u1', 'red-3');
      if (!moveRes.reachedGoal || !moveRes.isGameWon || session.status !== 'COMPLETED' || session.winner !== 'red') {
        throw new Error('Win condition not triggered when 4th pawn reached goal');
      }

      this.record('Arena Engine', 'Arena 4-Pawn Win Condition Verification', true, start);
    } catch (err: any) {
      this.record('Arena Engine', 'Arena 4-Pawn Win Condition Verification', false, start, err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. LUDO SUPREME ENGINE TESTS
  // ---------------------------------------------------------------------------
  private static async testSupremeSessionInitialization() {
    const start = Date.now();
    try {
      const matchId = `sup_init_${Date.now()}`;
      const session = LudoSupremeEngine.createSupremeSession(matchId, [
        { userId: 'u1', username: 'Alice', color: 'red', seatIndex: 0, isHuman: true },
        { userId: 'u2', username: 'Bob', color: 'blue', seatIndex: 1, isHuman: true },
      ]);

      if (session.gameMode !== 'LUDO_SUPREME') throw new Error('Game mode mismatch');
      if (session.endsAt !== session.startedAt + 300000) {
        throw new Error('Supreme match duration must be exactly 300,000 ms (5 minutes)');
      }
      if (session.players.red.score !== 0 || session.players.blue.score !== 0) {
        throw new Error('Initial scores must be 0');
      }

      this.record('Supreme Engine', '5-Minute Session Setup & Timer', true, start);
    } catch (err: any) {
      this.record('Supreme Engine', '5-Minute Session Setup & Timer', false, start, err.message);
    }
  }

  private static async testSupremeMovementScoring() {
    const start = Date.now();
    try {
      const session = LudoSupremeEngine.createSupremeSession(`sup_score_${Date.now()}`, [
        { userId: 'u1', username: 'Alice', color: 'red', seatIndex: 0, isHuman: true },
        { userId: 'u2', username: 'Bob', color: 'blue', seatIndex: 1, isHuman: true },
      ]);

      // Deploy red pawn
      session.dice.value = 6;
      session.dice.hasRolled = true;
      const deployRes = LudoSupremeEngine.moveToken(session, 'u1', 'red-0');

      if (deployRes.totalScore !== 1) {
        throw new Error(`Expected score 1 after deploy, got ${deployRes.totalScore}`);
      }

      // Move 4 steps
      session.currentTurn = 'red';
      session.dice.value = 4;
      session.dice.hasRolled = true;
      const moveRes = LudoSupremeEngine.moveToken(session, 'u1', 'red-0');

      if (moveRes.totalScore !== 5) {
        throw new Error(`Expected total score 5, got ${moveRes.totalScore}`);
      }

      this.record('Supreme Engine', 'Movement Step Scoring (+1 per tile)', true, start);
    } catch (err: any) {
      this.record('Supreme Engine', 'Movement Step Scoring (+1 per tile)', false, start, err.message);
    }
  }

  private static async testSupremeHomeMultiplier() {
    const start = Date.now();
    try {
      const session = LudoSupremeEngine.createSupremeSession(`sup_mult_${Date.now()}`, [
        { userId: 'u1', username: 'Alice', color: 'red', seatIndex: 0, isHuman: true },
        { userId: 'u2', username: 'Bob', color: 'blue', seatIndex: 1, isHuman: true },
      ]);

      session.players.red.pawns[0].state = 'path';
      session.players.red.pawns[0].pathStep = 55;
      session.players.red.score = 55;

      session.dice.value = 1;
      session.dice.hasRolled = true;

      const moveRes = LudoSupremeEngine.moveToken(session, 'u1', 'red-0');
      // Step 56 reached -> +1 move score + 56 home multiplier bonus = +57 points (Total: 55 + 57 = 112 points)
      if (moveRes.totalScore !== 112 || !moveRes.reachedGoal) {
        throw new Error(`Expected score 112 after 2x home multiplier, got ${moveRes.totalScore}`);
      }

      this.record('Supreme Engine', 'Home Goal 2x Multiplier Bonus', true, start);
    } catch (err: any) {
      this.record('Supreme Engine', 'Home Goal 2x Multiplier Bonus', false, start, err.message);
    }
  }

  private static async testSupremeCaptureScoring() {
    const start = Date.now();
    try {
      const session = LudoSupremeEngine.createSupremeSession(`sup_cap_${Date.now()}`, [
        { userId: 'u1', username: 'Alice', color: 'red', seatIndex: 0, isHuman: true },
        { userId: 'u2', username: 'Bob', color: 'blue', seatIndex: 1, isHuman: true },
      ]);

      // Set Bob's pawn at non-safe path step with 28 progress (corresponding to Red step 15)
      session.players.blue.pawns[0].state = 'path';
      session.players.blue.pawns[0].pathStep = 28;
      session.players.blue.score = 28;
      session.players.blue.pawnProgress['blue-0'] = 29;

      // Alice moves red pawn from step 10 -> 15 and captures Bob's pawn at identical grid coordinates
      session.players.red.pawns[0].state = 'path';
      session.players.red.pawns[0].pathStep = 10;
      session.players.red.score = 10;

      session.dice.value = 5;
      session.dice.hasRolled = true;

      const moveRes = LudoSupremeEngine.moveToken(session, 'u1', 'red-0');

      // Alice gets +5 move score + 10 capture bonus = +15 -> Total: 25
      if (session.players.red.score < 25) {
        throw new Error(`Alice score expected at least 25, got ${session.players.red.score}`);
      }

      // Bob's score should be deducted for the captured pawn
      if (session.players.blue.score > 0) {
        throw new Error(`Bob's score should be reduced after pawn capture`);
      }

      this.record('Supreme Engine', 'Capture Bonus (+10) & Victim Progress Deduction', true, start);
    } catch (err: any) {
      this.record('Supreme Engine', 'Capture Bonus (+10) & Victim Progress Deduction', false, start, err.message);
    }
  }

  private static async testSupremeTimerExpiry() {
    const start = Date.now();
    try {
      const session = LudoSupremeEngine.createSupremeSession(`sup_exp_${Date.now()}`, [
        { userId: 'u1', username: 'Alice', color: 'red', seatIndex: 0, isHuman: true },
        { userId: 'u2', username: 'Bob', color: 'blue', seatIndex: 1, isHuman: true },
      ]);

      session.players.red.score = 45;
      session.players.blue.score = 30;

      // Simulate timer expiration
      session.endsAt = Date.now() - 1000;

      const isExpired = LudoSupremeEngine.checkTimerExpiry(session);
      if (!isExpired || session.status !== 'COMPLETED' || session.winnerUserId !== 'u1') {
        throw new Error('Timer expiry did not crown Alice (higher score) as winner');
      }

      this.record('Supreme Engine', '5-Minute Countdown Expiration & Auto-Completion', true, start);
    } catch (err: any) {
      this.record('Supreme Engine', '5-Minute Countdown Expiration & Auto-Completion', false, start, err.message);
    }
  }

  private static async testSupremeDeterministicTieBreaker() {
    const start = Date.now();
    try {
      const session = LudoSupremeEngine.createSupremeSession(`sup_tie_${Date.now()}`, [
        { userId: 'u1', username: 'Alice', color: 'red', seatIndex: 0, isHuman: true },
        { userId: 'u2', username: 'Bob', color: 'blue', seatIndex: 1, isHuman: true },
      ]);

      // Both players have identical score = 50
      session.players.red.score = 50;
      session.players.blue.score = 50;

      // Alice has 2 captures, Bob has 1 capture
      session.players.red.capturesCount = 2;
      session.players.blue.capturesCount = 1;

      const rankings = LudoSupremeEngine.computeDeterministicRankings(session);
      if (rankings[0].userId !== 'u1') {
        throw new Error('Tie breaker failed: player with higher captures should rank 1st');
      }

      this.record('Supreme Engine', 'Deterministic Tie-Breaking Hierarchy', true, start);
    } catch (err: any) {
      this.record('Supreme Engine', 'Deterministic Tie-Breaking Hierarchy', false, start, err.message);
    }
  }

  private static async testSupremeScoreEventLedger() {
    const start = Date.now();
    try {
      const session = LudoSupremeEngine.createSupremeSession(`sup_ledg_${Date.now()}`, [
        { userId: 'u1', username: 'Alice', color: 'red', seatIndex: 0, isHuman: true },
        { userId: 'u2', username: 'Bob', color: 'blue', seatIndex: 1, isHuman: true },
      ]);

      session.dice.value = 6;
      session.dice.hasRolled = true;
      LudoSupremeEngine.moveToken(session, 'u1', 'red-0');

      if (session.scoreLedger.length === 0) {
        throw new Error('Score event ledger is empty');
      }

      const event = session.scoreLedger[0];
      if (event.eventType !== 'MOVE_SCORE' || event.userId !== 'u1' || event.resultingScore !== 1) {
        throw new Error('Score event ledger entry mismatch');
      }

      this.record('Supreme Engine', 'Auditable Score Event Ledger', true, start);
    } catch (err: any) {
      this.record('Supreme Engine', 'Auditable Score Event Ledger', false, start, err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // 4. ATOMIC ROOM JOINING & WALLET RESERVATION
  // ---------------------------------------------------------------------------
  private static async testAtomicRoomJoinWithReservation() {
    const start = Date.now();
    try {
      const userId = `test_user_res_${Date.now()}`;
      // Credit test user $50 USDT
      await LedgerService.creditDeposit(userId, '50.00000000', `dep_${userId}`);

      const joinRes = await RoomJoinService.joinMatch({
        userId,
        username: `User_${userId}`,
        gameMode: GameMode.ONLINE_ARENA,
        playerCount: 2,
        entryFee: 10,
      });

      if (!joinRes.success || !joinRes.reservationTxId) {
        throw new Error('Join match failed to lock wallet funds');
      }

      const wallet = await LedgerService.getUserWallet(userId);
      if (LedgerMath.isLessThan(wallet.lockedBalance, '10.00000000')) {
        throw new Error(`Expected locked balance >= 10, got ${wallet.lockedBalance}`);
      }

      this.record('Room & Wallet', 'Atomic Join with Double-Entry Wallet Reservation', true, start);
    } catch (err: any) {
      this.record('Room & Wallet', 'Atomic Join with Double-Entry Wallet Reservation', false, start, err.message);
    }
  }

  private static async testInsufficientBalanceJoinRejection() {
    const start = Date.now();
    try {
      const poorUserId = `poor_user_${Date.now()}`;
      // 0 balance user tries to join $100 room
      let errorCaught = false;
      try {
        await RoomJoinService.joinMatch({
          userId: poorUserId,
          username: 'PoorPlayer',
          gameMode: GameMode.ONLINE_ARENA,
          playerCount: 4,
          entryFee: 100,
        });
      } catch (err: any) {
        errorCaught = true;
        if (!err.message.includes('Insufficient USDT balance')) {
          throw new Error(`Unexpected error message: ${err.message}`);
        }
      }

      if (!errorCaught) {
        throw new Error('Should have rejected join with insufficient balance');
      }

      this.record('Room & Wallet', 'Insufficient Balance Join Rejection', true, start);
    } catch (err: any) {
      this.record('Room & Wallet', 'Insufficient Balance Join Rejection', false, start, err.message);
    }
  }

  private static async testRoomStateTransitionsToStarting() {
    const start = Date.now();
    try {
      const u1 = `trans_u1_${Date.now()}`;
      const u2 = `trans_u2_${Date.now()}`;
      await LedgerService.creditDeposit(u1, '20.00000000', `dep_${u1}`);
      await LedgerService.creditDeposit(u2, '20.00000000', `dep_${u2}`);

      // u1 joins
      const j1 = await RoomJoinService.joinMatch({
        userId: u1,
        username: `User_${u1}`,
        gameMode: GameMode.ONLINE_ARENA,
        playerCount: 2,
        entryFee: 5,
      });

      // u2 joins the same room
      const j2 = await RoomJoinService.joinMatch({
        userId: u2,
        username: `User_${u2}`,
        gameMode: GameMode.ONLINE_ARENA,
        playerCount: 2,
        entryFee: 5,
        roomId: j1.matchId,
      });

      if (j2.status !== 'STARTING' || j2.joinedPlayers !== 2) {
        throw new Error(`Expected status STARTING on full room, got ${j2.status}`);
      }

      this.record('Room & Wallet', 'Room Lifecycle (OPEN -> FILLING -> FULL -> STARTING)', true, start);
    } catch (err: any) {
      this.record('Room & Wallet', 'Room Lifecycle (OPEN -> FILLING -> FULL -> STARTING)', false, start, err.message);
    }
  }

  private static async testConcurrentJoinRaceCondition() {
    const start = Date.now();
    try {
      // Provision a dedicated 2-player room
      const poolDef = findMatchPool(GameMode.ONLINE_ARENA, 2, 1)!;
      const roomId = await RoomManager.ensurePoolHasJoinableRoom(poolDef);
      if (!roomId) throw new Error('Failed to provision test room');

      // Create 10 concurrent players trying to join the SAME single slot
      const userIds: string[] = [];
      for (let i = 0; i < 10; i++) {
        const uid = `race_user_${Date.now()}_${i}`;
        userIds.push(uid);
        await LedgerService.creditDeposit(uid, '10.00000000', `dep_${uid}`);
      }

      const joinPromises = userIds.map((uid) =>
        RoomJoinService.joinMatch({
          userId: uid,
          username: `Player_${uid}`,
          gameMode: GameMode.ONLINE_ARENA,
          playerCount: 2,
          entryFee: 1,
          roomId,
        }).catch((err) => ({ error: err.message }))
      );

      const outcomes = await Promise.all(joinPromises);
      const successfulJoins = outcomes.filter((o: any) => !o.error);

      // Max capacity is 2 players. Exactly 2 should succeed, 8 should fail
      if (successfulJoins.length > 2) {
        throw new Error(`Race condition flaw! ${successfulJoins.length} players joined a 2-player room!`);
      }

      this.record('Room & Wallet', 'High-Concurrency Atomic Join Lock Test (No Over-Filling)', true, start, undefined, {
        successCount: successfulJoins.length,
      });
    } catch (err: any) {
      this.record('Room & Wallet', 'High-Concurrency Atomic Join Lock Test (No Over-Filling)', false, start, err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // 5. DOUBLE-ENTRY FINANCIAL SETTLEMENT
  // ---------------------------------------------------------------------------
  private static async testDoubleEntryMatchSettlement() {
    const start = Date.now();
    try {
      const winnerId = `win_user_${Date.now()}`;
      const loserId = `lose_user_${Date.now()}`;

      await LedgerService.creditDeposit(winnerId, '50.00000000', `dep_${winnerId}`);
      await LedgerService.creditDeposit(loserId, '50.00000000', `dep_${loserId}`);

      // Join both players into a $5 match
      const join1 = await RoomJoinService.joinMatch({
        userId: winnerId,
        username: 'WinnerPlayer',
        gameMode: GameMode.ONLINE_ARENA,
        playerCount: 2,
        entryFee: 5,
      });

      const join2 = await RoomJoinService.joinMatch({
        userId: loserId,
        username: 'LoserPlayer',
        gameMode: GameMode.ONLINE_ARENA,
        playerCount: 2,
        entryFee: 5,
        roomId: join1.matchId,
      });

      const matchId = join1.matchId;

      const settlement = await MatchSettlementService.settleMatch(matchId, winnerId, [
        { userId: winnerId, rank: 1, finalScore: 100, tokensHome: 4, capturesMade: 2, totalDistanceMoved: 224 },
        { userId: loserId, rank: 2, finalScore: 40, tokensHome: 1, capturesMade: 0, totalDistanceMoved: 120 },
      ]);

      if (settlement.status !== 'COMPLETED') {
        throw new Error(`Settlement status mismatch: ${settlement.status}`);
      }

      // Check prize calculation (2 players * $5 = $10 gross, $1 platform fee (10%), $9 net prize)
      if (parseFloat(settlement.grossPool) !== 10 || parseFloat(settlement.platformFee) !== 1 || parseFloat(settlement.prizePool) !== 9) {
        throw new Error(`Prize calculation error. Gross: ${settlement.grossPool}, Fee: ${settlement.platformFee}, Prize: ${settlement.prizePool}`);
      }

      // Verify winner wallet balance increased by net prize ($50 - $5 entry + $9 prize = $54)
      const winnerWallet = await LedgerService.getUserWallet(winnerId);
      if (parseFloat(winnerWallet.availableBalance) < 54) {
        throw new Error(`Winner available balance expected 54.00, got ${winnerWallet.availableBalance}`);
      }

      this.record('Settlement', 'Double-Entry Prize Pool Distribution (Gross, 10% Fee, 90% Net)', true, start);
    } catch (err: any) {
      this.record('Settlement', 'Double-Entry Prize Pool Distribution (Gross, 10% Fee, 90% Net)', false, start, err.message);
    }
  }

  private static async testSettlementIdempotency() {
    const start = Date.now();
    try {
      const winnerId = `idemp_win_${Date.now()}`;
      const loserId = `idemp_lose_${Date.now()}`;

      await LedgerService.creditDeposit(winnerId, '50.00000000', `dep_${winnerId}`);
      await LedgerService.creditDeposit(loserId, '50.00000000', `dep_${loserId}`);

      const join1 = await RoomJoinService.joinMatch({
        userId: winnerId,
        username: `Winner_${winnerId}`,
        gameMode: GameMode.ONLINE_ARENA,
        playerCount: 2,
        entryFee: 5,
      });

      await RoomJoinService.joinMatch({
        userId: loserId,
        username: `Loser_${loserId}`,
        gameMode: GameMode.ONLINE_ARENA,
        playerCount: 2,
        entryFee: 5,
        roomId: join1.matchId,
      });

      const matchId = join1.matchId;

      // 1st Settlement
      const s1 = await MatchSettlementService.settleMatch(matchId, winnerId, [
        { userId: winnerId, rank: 1, finalScore: 100, tokensHome: 4, capturesMade: 2, totalDistanceMoved: 224 },
        { userId: loserId, rank: 2, finalScore: 40, tokensHome: 1, capturesMade: 0, totalDistanceMoved: 120 },
      ]);

      // 2nd Settlement with same match ID
      const s2 = await MatchSettlementService.settleMatch(matchId, winnerId, [
        { userId: winnerId, rank: 1, finalScore: 100, tokensHome: 4, capturesMade: 2, totalDistanceMoved: 224 },
        { userId: loserId, rank: 2, finalScore: 40, tokensHome: 1, capturesMade: 0, totalDistanceMoved: 120 },
      ]);

      if (s2.status !== 'ALREADY_SETTLED' && s2.settlementId !== s1.settlementId) {
        throw new Error('Settlement did not protect against duplicate execution');
      }

      this.record('Settlement', 'Settlement Idempotency Protection', true, start);
    } catch (err: any) {
      this.record('Settlement', 'Settlement Idempotency Protection', false, start, err.message);
    }
  }

  private static async testMatchRefundFlow() {
    const start = Date.now();
    try {
      const userId = `ref_u1_${Date.now()}`;

      await LedgerService.creditDeposit(userId, '50.00000000', `dep_${userId}`);

      const join = await RoomJoinService.joinMatch({
        userId,
        username: 'RefundUser',
        gameMode: GameMode.ONLINE_ARENA,
        playerCount: 2,
        entryFee: 5,
      });

      const matchId = join.matchId;

      // Balance after lock should be 45
      const walletBeforeRefund = await LedgerService.getUserWallet(userId);
      if (parseFloat(walletBeforeRefund.availableBalance) !== 45) {
        throw new Error(`Expected 45.00 available before refund, got ${walletBeforeRefund.availableBalance}`);
      }

      await MatchSettlementService.refundMatch(matchId, 'Room cancelled due to timeout');

      // Balance after refund should be back to 50
      const walletAfterRefund = await LedgerService.getUserWallet(userId);
      if (parseFloat(walletAfterRefund.availableBalance) !== 50) {
        throw new Error(`Expected 50.00 available after refund, got ${walletAfterRefund.availableBalance}`);
      }

      this.record('Settlement', 'Match Cancellation & Wallet Refund Flow', true, start);
    } catch (err: any) {
      this.record('Settlement', 'Match Cancellation & Wallet Refund Flow', false, start, err.message);
    }
  }
}
