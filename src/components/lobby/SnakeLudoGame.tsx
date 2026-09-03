import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  Info,
  PartyPopper,
  Coins,
  Crown,
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import { AdventureSnakeBoard } from '../ludo/adventure/AdventureSnakeBoard';
import { SnakePlayerSeat } from '../ludo/adventure/SnakePlayerSeat';
import {
  LADDER_MAP,
  SNAKE_MAP,
} from '../ludo/adventure/types';
import confetti from 'canvas-confetti';
import { usePlatformMode } from '../../hooks/usePlatformMode';
import { UnifiedWalletService } from '../../services/unifiedWalletService';

const TURN_TIME_LIMIT = 10; // 10 seconds per turn
const MAX_STRIKES = 3; // 3 missed turns = forfeit

interface SnakeLudoGameProps {
  onBackToLobby: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  entryFee?: number;
  prizePool?: number;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  playerCount?: number;
  tournamentId?: string;
  onMatchWon?: (prize: number) => void;
}

export const SnakeLudoGame: React.FC<SnakeLudoGameProps> = ({
  onBackToLobby,
  isMuted,
  onToggleMute,
  entryFee = 0,
  prizePool = 0,
  userId = 'user_guest_default',
  userName = 'Player 1',
  userAvatar,
  playerCount = 2,
  tournamentId,
  onMatchWon,
}) => {
  const { platformMode, currencySymbol } = usePlatformMode();

  // Active match ID for authoritative double-entry settlement
  const [matchId, setMatchId] = useState<string>(() =>
    `match_snake_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  );

  // Player positions on 1-100 board
  const [player1Pos, setPlayer1Pos] = useState<number>(1);
  const [player2Pos, setPlayer2Pos] = useState<number>(1);

  // Turn management
  const [currentTurn, setCurrentTurn] = useState<'p1' | 'p2'>('p1');
  const [player1DiceVal, setPlayer1DiceVal] = useState<number>(1);
  const [player2DiceVal, setPlayer2DiceVal] = useState<number>(1);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isMovingPawn, setIsMovingPawn] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [isSettling, setIsSettling] = useState<boolean>(false);

  // Tournament Rules State: 6s count and Missed Turn Strikes
  const [p1ConsecutiveSixes, setP1ConsecutiveSixes] = useState<number>(0);
  const [p2ConsecutiveSixes, setP2ConsecutiveSixes] = useState<number>(0);
  const [p1Strikes, setP1Strikes] = useState<number>(0);
  const [p2Strikes, setP2Strikes] = useState<number>(0);

  // Turn Timer
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(TURN_TIME_LIMIT);

  // Visual board effects
  const [highlightTile, setHighlightTile] = useState<number | null>(null);
  const [highlightLadderId, setHighlightLadderId] = useState<string | null>(null);
  const [highlightSnakeId, setHighlightSnakeId] = useState<string | null>(null);
  const [boardShake, setBoardShake] = useState<boolean>(false);
  const [actionAlert, setActionAlert] = useState<{
    text: string;
    type: 'ladder' | 'snake' | 'bonus' | 'penalty' | 'neutral';
  } | null>(null);

  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasFinalizedRef = useRef<boolean>(false);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Pre-lock match entry fee in database
  useEffect(() => {
    if (entryFee > 0) {
      UnifiedWalletService.lockMatchEntry({
        userId: 'user_guest_default',
        username: userName,
        matchId,
        gameMode: 'SNAKE_LUDO',
        playerCount,
        entryFee,
        prizePool,
      }).catch((err) => {
        console.warn('Snake Ludo entry lock notification:', err.message);
      });
    }
  }, [matchId, entryFee, prizePool, playerCount, userName]);

  // Multi-stage blast party confetti celebration
  const triggerBlastPartyCelebration = useCallback(() => {
    // Wave 1: Immediate center explosion
    confetti({
      particleCount: 160,
      spread: 120,
      startVelocity: 45,
      origin: { y: 0.5, x: 0.5 },
      colors: ['#FFD700', '#FFA500', '#00E676', '#00B0FF', '#E040FB', '#FFFFFF'],
      shapes: ['star', 'circle'],
      scalar: 1.2,
      zIndex: 9999,
    });

    // Wave 2: Left cannon
    setTimeout(() => {
      confetti({
        particleCount: 110,
        angle: 60,
        spread: 85,
        origin: { x: 0.05, y: 0.65 },
        colors: ['#FFD700', '#FF1493', '#00FFFF', '#76FF03'],
        zIndex: 9999,
      });
    }, 250);

    // Wave 3: Right cannon
    setTimeout(() => {
      confetti({
        particleCount: 110,
        angle: 120,
        spread: 85,
        origin: { x: 0.95, y: 0.65 },
        colors: ['#FFD700', '#FF1493', '#00FFFF', '#76FF03'],
        zIndex: 9999,
      });
    }, 450);

    // Wave 4: Golden celebratory rain
    setTimeout(() => {
      confetti({
        particleCount: 140,
        spread: 160,
        startVelocity: 35,
        origin: { y: 0.2, x: 0.5 },
        colors: ['#FFD700', '#F59E0B', '#FBBF24', '#FFFFFF'],
        shapes: ['star'],
        scalar: 1.3,
        zIndex: 9999,
      });
    }, 750);
  }, []);

  // Handle authoritative match finalization
  const handleFinalizeSnakeMatch = useCallback(
    async (isP1Winner: boolean) => {
      if (hasFinalizedRef.current) return;
      hasFinalizedRef.current = true;

      const winnerName = isP1Winner ? userName : 'Opponent';
      setWinner(winnerName);
      SoundManager.play('pawn-finish');
      triggerBlastPartyCelebration();

      const effectivePrize = prizePool > 0 ? prizePool : (entryFee > 0 ? entryFee * 1.8 : 0);

      try {
        setIsSettling(true);
        await UnifiedWalletService.settleMatchOutcome({
          matchId,
          gameMode: 'SNAKE_LUDO',
          winnerUserId: isP1Winner ? userId : 'opponent_bot_1',
          winnerName,
          entryFee,
          prizePool: effectivePrize,
          playerCount: 2,
          playerResults: [
            {
              userId: userId,
              username: userName,
              rank: isP1Winner ? 1 : 2,
              finalScore: isP1Winner ? 100 : player1Pos,
              tokensHome: isP1Winner ? 1 : 0,
              isHuman: true,
            },
            {
              userId: 'opponent_bot_1',
              username: 'Opponent',
              rank: isP1Winner ? 2 : 1,
              finalScore: isP1Winner ? player2Pos : 100,
              tokensHome: isP1Winner ? 0 : 1,
              isHuman: false,
            },
          ],
          tournamentId,
        });

        if (isP1Winner && effectivePrize > 0) {
          onMatchWon?.(effectivePrize);
        }
      } catch (err: any) {
        console.error('Snake Ludo settlement error:', err);
      } finally {
        setIsSettling(false);
      }
    },
    [matchId, userName, prizePool, entryFee, player1Pos, player2Pos, onMatchWon, triggerBlastPartyCelebration]
  );

  // Step-by-step pawn motion
  const movePawnStepByStep = async (
    player: 'p1' | 'p2',
    startPos: number,
    steps: number
  ) => {
    setIsMovingPawn(true);
    let curr = startPos;

    for (let i = 1; i <= steps; i++) {
      curr += 1;
      if (curr > 100) {
        curr = startPos;
        if (player === 'p1') setPlayer1Pos(curr);
        else setPlayer2Pos(curr);
        setActionAlert({
          text: 'Overshot! Exact roll needed for Tile 100',
          type: 'neutral',
        });
        SoundManager.play('turn');
        setIsMovingPawn(false);
        setTimeout(() => setActionAlert(null), 2200);
        return curr;
      }

      if (player === 'p1') setPlayer1Pos(curr);
      else setPlayer2Pos(curr);

      SoundManager.play('pawn-step');
      await sleep(150);
    }

    // Check if landed on a ladder
    const ladder = LADDER_MAP[curr];
    if (ladder) {
      setHighlightLadderId(ladder.id);
      setHighlightTile(ladder.dest);
      setActionAlert({
        text: `⚡ Climbed ${ladder.name} to Tile ${ladder.dest}!`,
        type: 'ladder',
      });
      setBoardShake(true);
      SoundManager.play('pawn-finish');
      await sleep(550);
      setBoardShake(false);
      curr = ladder.dest;
      if (player === 'p1') setPlayer1Pos(curr);
      else setPlayer2Pos(curr);
      await sleep(300);
      setHighlightLadderId(null);
      setHighlightTile(null);
      setTimeout(() => setActionAlert(null), 2500);
    }
    // Check if ambushed by a snake
    else {
      const snake = SNAKE_MAP[curr];
      if (snake) {
        setHighlightSnakeId(snake.id);
        setHighlightTile(snake.dest);
        setActionAlert({
          text: `🐍 Snake Ambush! Slid to Tile ${snake.dest}`,
          type: 'snake',
        });
        setBoardShake(true);
        SoundManager.play('pawn-capture');
        await sleep(550);
        setBoardShake(false);
        curr = snake.dest;
        if (player === 'p1') setPlayer1Pos(curr);
        else setPlayer2Pos(curr);
        await sleep(300);
        setHighlightSnakeId(null);
        setHighlightTile(null);
        setTimeout(() => setActionAlert(null), 2500);
      }
    }

    setIsMovingPawn(false);
    return curr;
  };

  // Pass Turn Function
  const passTurnToNext = useCallback((nextTurn: 'p1' | 'p2') => {
    setCurrentTurn(nextTurn);
    setTurnTimeLeft(TURN_TIME_LIMIT);
  }, []);

  // Handle Turn Timeout / Auto-skip rule
  const handleTurnTimeout = useCallback(() => {
    if (winner || isRolling || isMovingPawn) return;

    if (currentTurn === 'p1') {
      const nextStrikes = p1Strikes + 1;
      setP1Strikes(nextStrikes);
      setP1ConsecutiveSixes(0);

      if (nextStrikes >= MAX_STRIKES) {
        setActionAlert({
          text: `${userName} missed 3 turns and forfeited!`,
          type: 'penalty',
        });
        handleFinalizeSnakeMatch(false);
        return;
      }

      setActionAlert({
        text: `⏳ Time's up! ${userName}'s turn skipped (${nextStrikes}/${MAX_STRIKES} Strikes)`,
        type: 'penalty',
      });
      SoundManager.play('turn');
      setTimeout(() => setActionAlert(null), 2500);
      passTurnToNext('p2');
    } else {
      const nextStrikes = p2Strikes + 1;
      setP2Strikes(nextStrikes);
      setP2ConsecutiveSixes(0);

      if (nextStrikes >= MAX_STRIKES) {
        setActionAlert({
          text: `Opponent missed 3 turns! ${userName} Wins!`,
          type: 'bonus',
        });
        handleFinalizeSnakeMatch(true);
        return;
      }

      setActionAlert({
        text: `⏳ Opponent timed out! (${nextStrikes}/${MAX_STRIKES} Strikes)`,
        type: 'penalty',
      });
      SoundManager.play('turn');
      setTimeout(() => setActionAlert(null), 2500);
      passTurnToNext('p1');
    }
  }, [
    currentTurn,
    p1Strikes,
    p2Strikes,
    winner,
    isRolling,
    isMovingPawn,
    userName,
    prizePool,
    onMatchWon,
    passTurnToNext,
  ]);

  // Turn Timer Effect (Decrements every second)
  useEffect(() => {
    if (winner || isRolling || isMovingPawn) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTurnTimeLeft((prev) => {
        if (prev <= 1) {
          handleTurnTimeout();
          return TURN_TIME_LIMIT;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentTurn, winner, isRolling, isMovingPawn, handleTurnTimeout]);

  // Roll Interactive Dice
  const handleRoll = async () => {
    if (isRolling || isMovingPawn || winner) return;

    SoundManager.play('dice-roll');
    setIsRolling(true);
    setActionAlert(null);

    const rolled = Math.floor(Math.random() * 6) + 1;

    if (currentTurn === 'p1') {
      setPlayer1DiceVal(rolled);
    } else {
      setPlayer2DiceVal(rolled);
    }

    await sleep(780);
    setIsRolling(false);

    const isP1 = currentTurn === 'p1';

    // ----------------------------------------------------
    // RULE OF 6 & 3 CONSECUTIVE SIXES TOURNAMENT RULE
    // ----------------------------------------------------
    let currentSixesCount = (isP1 ? p1ConsecutiveSixes : p2ConsecutiveSixes);

    if (rolled === 6) {
      currentSixesCount += 1;
      if (isP1) setP1ConsecutiveSixes(currentSixesCount);
      else setP2ConsecutiveSixes(currentSixesCount);

      // Penalty: 3 consecutive sixes cancels turn and passes to next player!
      if (currentSixesCount === 3) {
        if (isP1) setP1ConsecutiveSixes(0);
        else setP2ConsecutiveSixes(0);

        setActionAlert({
          text: '🚫 3 Consecutive Sixes! Turn Cancelled.',
          type: 'penalty',
        });
        SoundManager.play('pawn-capture');
        setTimeout(() => setActionAlert(null), 2500);
        passTurnToNext(isP1 ? 'p2' : 'p1');
        return;
      }
    } else {
      // Non-6 rolls reset the consecutive sixes counter
      if (isP1) setP1ConsecutiveSixes(0);
      else setP2ConsecutiveSixes(0);
    }

    // Move token on board
    const startPos = isP1 ? player1Pos : player2Pos;
    const finalPos = await movePawnStepByStep(currentTurn, startPos, rolled);

    // Check if reached Tile 100 (Victory)
    if (finalPos === 100) {
      handleFinalizeSnakeMatch(isP1);
      return;
    }

    // Extra Turn on 6
    if (rolled === 6) {
      setActionAlert({
        text: `🎲 Rolled a 6 (${currentSixesCount}/3)! Extra turn awarded!`,
        type: 'bonus',
      });
      setTurnTimeLeft(TURN_TIME_LIMIT);
      setTimeout(() => setActionAlert(null), 2200);
    } else {
      passTurnToNext(isP1 ? 'p2' : 'p1');
    }
  };

  // Automatic roll for Opponent (P2) turn
  useEffect(() => {
    if (currentTurn === 'p2' && !winner && !isRolling && !isMovingPawn) {
      const timer = setTimeout(() => {
        handleRoll();
      }, 950);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, winner, isRolling, isMovingPawn]);

  const handleReset = () => {
    SoundManager.play('click');
    setMatchId(`match_snake_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
    setPlayer1Pos(1);
    setPlayer2Pos(1);
    setCurrentTurn('p1');
    setWinner(null);
    setPlayer1DiceVal(1);
    setPlayer2DiceVal(1);
    setP1ConsecutiveSixes(0);
    setP2ConsecutiveSixes(0);
    setP1Strikes(0);
    setP2Strikes(0);
    setTurnTimeLeft(TURN_TIME_LIMIT);
    setHighlightLadderId(null);
    setHighlightSnakeId(null);
    setHighlightTile(null);
    setActionAlert(null);
  };

  const isRealMatch = prizePool > 0 || entryFee > 0;

  return (
    <div className="relative min-h-screen w-full bg-[#0b0c0a] text-[#fef3c7] flex flex-col items-center justify-between p-2.5 sm:p-3 select-none overflow-hidden font-sans">
      {/* Ambient Background & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1f1d16] via-[#10100c] to-[#080806] pointer-events-none -z-20" />
      <div className="absolute inset-0 bg-[radial-gradient(#a79e7b12_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

      {/* Atmospheric Soft Warm Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#a79e7b]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#dccba7]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER WITH CENTERED PRIZE POOL (INR ₹)               */}
      {/* ------------------------------------------------------------- */}
      <header className="w-full max-w-lg flex items-center justify-between py-1 z-20">
        {/* Back to Lobby Button */}
        <button
          onClick={() => {
            SoundManager.play('click');
            onBackToLobby();
          }}
          className="flex items-center gap-1.5 bg-[#1a1812]/90 hover:bg-[#28251c] border border-[#a79e7b]/40 px-3 py-1.5 rounded-full text-xs font-semibold text-[#e8dfc8] shadow-md transition-all cursor-pointer group"
          id="snake-ludo-back-btn"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#dccba7] group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden xs:inline">Lobby</span>
        </button>

        {/* TOP CENTER: REAL MATCH PRIZE POOL (INR ₹) OR PRACTICE MATCH */}
        <div className="flex flex-col items-center">
          {isRealMatch ? (
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="flex items-center gap-2 bg-gradient-to-r from-[#2c2008] via-[#453412] to-[#2c2008] border-2 border-[#fbbf24] px-4 py-1 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.35)]"
              id="snake-ludo-prize-badge"
            >
              <Trophy className="w-4 h-4 text-amber-300 animate-pulse" />
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-300/90">
                  Prize Pool:
                </span>
                <span className="text-sm sm:text-base font-black text-amber-200 tracking-tight font-mono">
                  {currencySymbol}{prizePool.toLocaleString()}
                </span>
              </div>
              {entryFee > 0 && (
                <span className="text-[10px] font-semibold text-amber-300/70 border-l border-amber-500/40 pl-2">
                  Entry {currencySymbol}{entryFee}
                </span>
              )}
            </motion.div>
          ) : (
            <div
              className="flex items-center gap-1.5 bg-[#1a1812]/90 border border-white/20 px-3.5 py-1 rounded-full text-xs font-bold text-stone-300 shadow-inner"
              id="snake-ludo-practice-badge"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#dccba7]" />
              <span>Practice Match</span>
            </div>
          )}
        </div>

        {/* Audio & Match Rules Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsRulesOpen(!isRulesOpen)}
            className="w-8 h-8 rounded-full bg-[#1a1812]/90 border border-[#a79e7b]/40 flex items-center justify-center text-[#e8dfc8] hover:text-white transition-colors cursor-pointer shadow-md"
            title="Match Rules"
            id="snake-ludo-rules-btn"
          >
            <Info className="w-4 h-4 text-[#dccba7]" />
          </button>
          <button
            onClick={onToggleMute}
            className="w-8 h-8 rounded-full bg-[#1a1812]/90 border border-[#a79e7b]/40 flex items-center justify-center text-[#e8dfc8] hover:text-white transition-colors cursor-pointer shadow-md"
            title="Toggle Audio"
            id="snake-ludo-mute-btn"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#dccba7]" />
            )}
          </button>
          <button
            onClick={handleReset}
            className="w-8 h-8 rounded-full bg-[#1a1812]/90 border border-[#a79e7b]/40 flex items-center justify-center text-[#e8dfc8] hover:text-white transition-colors cursor-pointer shadow-md"
            title="Restart Match"
            id="snake-ludo-restart-btn"
          >
            <RotateCcw className="w-4 h-4 text-[#dccba7]" />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* RULES ACCORDION OVERLAY (IF OPENED)                          */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isRulesOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-lg bg-[#1a1812]/95 border border-[#a79e7b]/60 rounded-2xl p-3 text-xs text-[#e8dfc8] space-y-2 z-30 shadow-2xl backdrop-blur-md mb-1"
          >
            <div className="flex items-center justify-between font-bold text-[#fef08a] border-b border-white/10 pb-1">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" /> Official Snake Ludo Tournament Rules
              </span>
              <button
                onClick={() => setIsRulesOpen(false)}
                className="text-stone-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <ul className="space-y-1 text-[11px] list-disc list-inside text-stone-300">
              <li><strong className="text-amber-300">Rule of 6:</strong> Rolling a 6 grants a bonus turn.</li>
              <li><strong className="text-rose-400">3 Consecutive Sixes:</strong> Rolling three 6s in a row cancels the turn and passes to the opponent.</li>
              <li><strong className="text-amber-300">Turn Timer:</strong> 10 seconds per turn. Failing to play gives 1 Strike. 3 Strikes = Auto Forfeit!</li>
              <li><strong className="text-emerald-400">Ladders & Snakes:</strong> Ladders take you up; snakes slide you down! Exact roll required to finish at Tile 100.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 2. MASTER 10x10 ADVENTURE BOARD                              */}
      {/* ------------------------------------------------------------- */}
      <main className="relative w-full max-w-lg my-auto py-1 flex items-center justify-center">
        <AdventureSnakeBoard
          player1Pos={player1Pos}
          player2Pos={player2Pos}
          activeTurn={currentTurn}
          isMoving={isMovingPawn}
          highlightTile={highlightTile}
          highlightLadderId={highlightLadderId}
          highlightSnakeId={highlightSnakeId}
          boardShake={boardShake}
        />
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 3. EVENT ACTION ALERTS (LADDER, SNAKE, 6 BONUS, TIMEOUT)      */}
      {/* ------------------------------------------------------------- */}
      <div className="h-6 flex items-center justify-center z-20 my-0.5">
        <AnimatePresence>
          {actionAlert && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              className={`px-3.5 py-0.5 rounded-full text-xs font-black shadow-xl backdrop-blur-md border ${
                actionAlert.type === 'ladder'
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-emerald-900/50'
                  : actionAlert.type === 'snake'
                  ? 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-rose-900/50'
                  : actionAlert.type === 'bonus'
                  ? 'bg-amber-950/90 border-amber-400 text-amber-200 shadow-amber-900/50'
                  : actionAlert.type === 'penalty'
                  ? 'bg-rose-950/95 border-rose-400 text-rose-200 shadow-rose-900/60'
                  : 'bg-black/90 border-stone-600 text-stone-200'
              }`}
            >
              {actionAlert.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. BOTTOM HUD: PROFILE ON TOP, 3D DICE ON BOTTOM (NO BORDERS) */}
      {/* ------------------------------------------------------------- */}
      <footer className="w-full max-w-lg z-20 pt-1 pb-1">
        <div className="flex items-end justify-between px-3 sm:px-6">
          {/* Player 1 (Red / Sun) Seat: Profile Top, 3D Dice Bottom */}
          <SnakePlayerSeat
            playerId="p1"
            name={userName}
            avatar={userAvatar}
            position={player1Pos}
            isActiveTurn={currentTurn === 'p1'}
            isRolling={isRolling}
            diceValue={player1DiceVal}
            disabled={isMovingPawn || !!winner}
            turnTimeLeft={turnTimeLeft}
            totalTurnTime={TURN_TIME_LIMIT}
            strikes={p1Strikes}
            consecutiveSixes={p1ConsecutiveSixes}
            onRoll={handleRoll}
            isOpponent={false}
          />

          {/* Center Round / Turn Status Indicator */}
          <div className="flex flex-col items-center justify-center pb-2">
            <div className="px-2.5 py-0.5 rounded-full bg-[#1c1810]/80 border border-[#a79e7b]/30 flex items-center gap-1 text-[10px] font-mono text-[#dccba7] shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a79e7b] animate-pulse" />
              <span>
                {currentTurn === 'p1' ? `${userName}'s Turn` : "Opponent's Turn"}
              </span>
            </div>
            <span className="text-[8px] font-mono text-stone-500 uppercase tracking-widest mt-0.5">
              Turn Timer: {turnTimeLeft}s
            </span>
          </div>

          {/* Player 2 (Green / Jade) Seat: Profile Top, 3D Dice Bottom */}
          <SnakePlayerSeat
            playerId="p2"
            name="Opponent"
            position={player2Pos}
            isActiveTurn={currentTurn === 'p2'}
            isRolling={isRolling}
            diceValue={player2DiceVal}
            disabled={isMovingPawn || !!winner}
            turnTimeLeft={turnTimeLeft}
            totalTurnTime={TURN_TIME_LIMIT}
            strikes={p2Strikes}
            consecutiveSixes={p2ConsecutiveSixes}
            onRoll={handleRoll}
            isOpponent={true}
          />
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* 5. VICTORY & CASH SETTLEMENT MODAL (INR ₹)                   */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {winner && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative w-full max-w-sm bg-gradient-to-b from-[#2a1d0f] via-[#17140e] to-[#0a0906] border-2 border-[#DCCBA7] rounded-3xl p-6 text-center text-white shadow-[0_0_50px_rgba(220,203,167,0.5)] space-y-4 overflow-hidden"
              id="snake-ludo-victory-modal"
            >
              {/* Floating Party Emojis */}
              <div className="absolute top-3 left-4 text-2xl animate-bounce pointer-events-none">🎉</div>
              <div className="absolute top-3 right-4 text-2xl animate-bounce pointer-events-none" style={{ animationDelay: '200ms' }}>✨</div>

              <div className="relative mx-auto w-fit">
                <Trophy className="w-16 h-16 text-[#DCCBA7] mx-auto filter drop-shadow-[0_4px_20px_rgba(220,203,167,0.8)]" />
                <Crown className="w-7 h-7 text-amber-300 fill-amber-300 absolute -top-2 left-1/2 -translate-x-1/2 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-widest text-[#A79E7B] font-black">
                  <PartyPopper className="w-3.5 h-3.5 text-amber-400" />
                  <span>SNAKE LUDO FINISHED</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#fef3c7] mt-1">
                  {winner === userName ? '🏆 YOU WON!' : `🏆 ${winner} Won!`}
                </h2>
                <p className="text-xs text-[#dccba7] mt-1">
                  {winner === userName ? 'Claimed victory on Tile 100!' : `${winner} reached Tile 100 first!`}
                </p>

                {/* Winning Prize Banner */}
                {(() => {
                  const effectivePrize = prizePool > 0 ? prizePool : (entryFee > 0 ? entryFee * 1.8 : 0);
                  if (effectivePrize <= 0) return null;
                  const isUserWinner = winner === userName;
                  return (
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: [0.98, 1.02, 0.98] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      className={`mt-3 py-2.5 px-3.5 rounded-2xl border shadow-lg flex flex-col gap-1 text-left ${
                        isUserWinner
                          ? 'bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-emerald-900/90 border-emerald-400 text-emerald-300'
                          : 'bg-gradient-to-r from-amber-950/90 to-stone-900/90 border-amber-400/50 text-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black uppercase">
                          <Coins className="w-4 h-4 text-yellow-400" />
                          <span>{isUserWinner ? '💰 Winning Cash Prize' : '🏆 Match Winning Amount'}</span>
                        </div>
                        <span className="text-base font-black text-white font-mono">
                          {currencySymbol}{effectivePrize.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300 flex items-center justify-between pt-0.5 border-t border-white/10">
                        <span>{isUserWinner ? 'Status: 100% Credited to Wallet' : `Awarded to: ${winner}`}</span>
                        <span className="font-bold text-emerald-400">Instant Ledger Settled</span>
                      </div>
                    </motion.div>
                  );
                })()}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#DCCBA7] via-amber-300 to-[#A79E7B] text-[#1c1810] font-sans font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  id="snake-ludo-play-again-btn"
                >
                  Play Again
                </button>
                <button
                  onClick={onBackToLobby}
                  className="flex-1 py-3 rounded-2xl bg-[#1f1b13] border border-[#A79E7B]/50 text-[#fef3c7] font-bold text-sm hover:bg-[#2c271b] active:scale-95 transition-all cursor-pointer"
                  id="snake-ludo-lobby-btn"
                >
                  Lobby
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
