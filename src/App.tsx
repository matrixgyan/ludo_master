import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PlayerColor, Pawn, Player, GameState, ChatMessage } from './types/game';
import { BoardEnvironment } from './components/ludo/environment/BoardEnvironment';
import { LudoBoard } from './components/ludo/board/LudoBoard';
import { LudoDice } from './components/ludo/dice/LudoDice';
import { TopBarHUD } from './components/ludo/hud/TopBarHUD';
import { PlayerProfileHUD } from './components/ludo/hud/PlayerProfileHUD';
import { BottomControls } from './components/ludo/hud/BottomControls';
import { ChatBubbleOverlay } from './components/ludo/effects/ChatBubbleOverlay';
import { DebugOverlay } from './components/debug/DebugOverlay';
import { SoundManager } from './audio/soundManager';
import { isSafeCell, getPawnGridCoord, HOME_SLOTS } from './game/boardGeometry';
import confetti from 'canvas-confetti';
import { GameLobby } from './components/lobby/GameLobby';
import { SnakeLudoGame } from './components/lobby/SnakeLudoGame';
import { AngelFlightData } from './components/ludo/effects/AngelFlightOverlay';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLogin } from './components/admin/AdminLogin';
import { PlayerModeOption, GameVariation, PlayerConfig } from './components/lobby/LudoModeSelectorModal';
import { OnlineMatchmakingScreen, MatchedOpponent } from './components/lobby/OnlineMatchmakingScreen';
import { VictoryModal } from './components/ludo/effects/VictoryModal';
import { GameSettingsModal } from './components/lobby/GameSettingsModal';
import { AuthModal } from './components/auth/AuthModal';
import { AuthClientService, AuthUser } from './services/authClientService';
import { UnifiedWalletService } from './services/unifiedWalletService';
import { realtimeClient } from './services/realtimeClient';
import { ReferralClientService } from './services/referralClientService';
import { navigationHistory } from './services/navigationHistory';
import { useBackHandler } from './hooks/useBackHandler';
import { MatchExitConfirmationModal } from './components/common/MatchExitConfirmationModal';
import { BackExitToast } from './components/common/BackExitToast';
import { usePlatformMode } from './hooks/usePlatformMode';
import { getSmartBotRoll, chooseBestBotPawn } from './game/botAI';

type ViewMode = 'lobby' | 'ludo_game' | 'snake_ludo' | 'admin' | 'matchmaking';

interface MatchConfig {
  mode: PlayerModeOption;
  entryFee: number;
  prizePool: number;
  gameType?: 'classic' | 'supreme' | 'snake';
  variation?: GameVariation;
  playersConfig?: PlayerConfig[];
  tournamentId?: string;
}

const TURN_TIME_LIMIT = 10;
const MAX_STRIKES = 3;

const DEFAULT_PLAYERS: Record<PlayerColor, Player> = {
  blue: {
    id: 'p1',
    name: 'Player 1',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    color: 'blue',
    level: 18,
    isActive: true,
    isMuted: false,
    isSpeaking: false,
    isHuman: true,
    score: 1200,
    pawns: [
      { id: 'blue-0', playerId: 'p1', color: 'blue', pawnIndex: 0, state: 'home', pathStep: -1, gridX: 1.5, gridY: 1.5 },
      { id: 'blue-1', playerId: 'p1', color: 'blue', pawnIndex: 1, state: 'home', pathStep: -1, gridX: 3.5, gridY: 1.5 },
      { id: 'blue-2', playerId: 'p1', color: 'blue', pawnIndex: 2, state: 'home', pathStep: -1, gridX: 1.5, gridY: 3.5 },
      { id: 'blue-3', playerId: 'p1', color: 'blue', pawnIndex: 3, state: 'home', pathStep: -1, gridX: 3.5, gridY: 3.5 },
    ],
  },
  red: {
    id: 'p2',
    name: 'Aarav_King',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    color: 'red',
    level: 24,
    isActive: true,
    isMuted: false,
    isSpeaking: false,
    isHuman: false,
    score: 1850,
    pawns: [
      { id: 'red-0', playerId: 'p2', color: 'red', pawnIndex: 0, state: 'home', pathStep: -1, gridX: 10.5, gridY: 1.5 },
      { id: 'red-1', playerId: 'p2', color: 'red', pawnIndex: 1, state: 'home', pathStep: -1, gridX: 12.5, gridY: 1.5 },
      { id: 'red-2', playerId: 'p2', color: 'red', pawnIndex: 2, state: 'home', pathStep: -1, gridX: 10.5, gridY: 3.5 },
      { id: 'red-3', playerId: 'p2', color: 'red', pawnIndex: 3, state: 'home', pathStep: -1, gridX: 12.5, gridY: 3.5 },
    ],
  },
  green: {
    id: 'p3',
    name: 'Priya_Patel',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    color: 'green',
    level: 12,
    isActive: true,
    isMuted: false,
    isSpeaking: false,
    isHuman: false,
    score: 950,
    pawns: [
      { id: 'green-0', playerId: 'p3', color: 'green', pawnIndex: 0, state: 'home', pathStep: -1, gridX: 10.5, gridY: 10.5 },
      { id: 'green-1', playerId: 'p3', color: 'green', pawnIndex: 1, state: 'home', pathStep: -1, gridX: 12.5, gridY: 10.5 },
      { id: 'green-2', playerId: 'p3', color: 'green', pawnIndex: 2, state: 'home', pathStep: -1, gridX: 10.5, gridY: 12.5 },
      { id: 'green-3', playerId: 'p3', color: 'green', pawnIndex: 3, state: 'home', pathStep: -1, gridX: 12.5, gridY: 12.5 },
    ],
  },
  yellow: {
    id: 'p4',
    name: 'Vikram_LudoStar',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    color: 'yellow',
    level: 30,
    isActive: true,
    isMuted: false,
    isSpeaking: false,
    isHuman: false,
    score: 2100,
    pawns: [
      { id: 'yellow-0', playerId: 'p4', color: 'yellow', pawnIndex: 0, state: 'home', pathStep: -1, gridX: 1.5, gridY: 10.5 },
      { id: 'yellow-1', playerId: 'p4', color: 'yellow', pawnIndex: 1, state: 'home', pathStep: -1, gridX: 3.5, gridY: 10.5 },
      { id: 'yellow-2', playerId: 'p4', color: 'yellow', pawnIndex: 2, state: 'home', pathStep: -1, gridX: 1.5, gridY: 12.5 },
      { id: 'yellow-3', playerId: 'p4', color: 'yellow', pawnIndex: 3, state: 'home', pathStep: -1, gridX: 3.5, gridY: 12.5 },
    ],
  },
};

const getNextTurnColor = (current: PlayerColor, activeCols: PlayerColor[]): PlayerColor => {
  const idx = activeCols.indexOf(current);
  if (idx === -1) return activeCols[0] || 'blue';
  return activeCols[(idx + 1) % activeCols.length];
};

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'lobby';
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    const searchParams = new URLSearchParams(window.location.search);
    const isHashAdmin = window.location.hash.includes('admin');
    if (
      path === 'admin' ||
      path === 'custom' ||
      searchParams.get('view') === 'admin' ||
      isHashAdmin
    ) {
      return 'admin';
    }
    return 'lobby';
  });

  const { platformMode } = usePlatformMode();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return AuthClientService.getUser();
  });
  const [showAuthModal, setShowAuthModal] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    const searchParams = new URLSearchParams(window.location.search);
    const isHashAdmin = window.location.hash.includes('admin');
    if (path === 'admin' || path === 'custom' || searchParams.get('view') === 'admin' || isHashAdmin) {
      return false;
    }
    return !AuthClientService.isAuthenticated();
  });

  const [balance, setBalance] = useState<number>(0.0);
  const [usdtBalanceStr, setUsdtBalanceStr] = useState<string>('$0.00');

  // Real Wallet Balance Synchronization with Server Ledger (Specific to Authenticated User)
  const fetchRealWalletBalance = useCallback(async () => {
    const activeUserId = currentUser?.id || 'user_guest_default';
    try {
      const data = await UnifiedWalletService.fetchWallet(activeUserId);
      if (data && data.availableBalance !== undefined) {
        const parsed = parseFloat(data.availableBalance) || 0.0;
        setBalance(parsed);
        setUsdtBalanceStr(`$${parsed.toFixed(2)}`);
      }
    } catch {
      // Keep real fallback 0.00
    }
  }, [currentUser?.id]);

  useEffect(() => {
    // Clear any legacy test/mock balances from browser storage
    try {
      localStorage.removeItem('evm_testnet_user_balance');
    } catch {}

    fetchRealWalletBalance();
    const balanceInterval = setInterval(fetchRealWalletBalance, 4000);
    return () => clearInterval(balanceInterval);
  }, [fetchRealWalletBalance]);

  const handleUpdateBalance = useCallback((amountChange: number) => {
    setBalance((prev) => {
      const next = Math.max(0, prev + amountChange);
      setUsdtBalanceStr(`$${next.toFixed(2)}`);
      return next;
    });
    fetchRealWalletBalance();
  }, [fetchRealWalletBalance]);

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    setGameState((prev) => ({
      ...prev,
      players: {
        ...prev.players,
        blue: {
          ...prev.players.blue,
          name: user.displayName || user.username,
          avatarUrl: user.avatarUrl,
        },
      },
    }));
    UnifiedWalletService.fetchWallet(user.id).then((data) => {
      if (data && data.availableBalance !== undefined) {
        const parsed = parseFloat(data.availableBalance) || 0.0;
        setBalance(parsed);
        setUsdtBalanceStr(`$${parsed.toFixed(2)}`);
      }
    }).catch(() => {});
  };

  const handleLogout = () => {
    AuthClientService.clearSession();
    setCurrentUser(null);
    setBalance(0.0);
    setUsdtBalanceStr('$0.00');
    setShowAuthModal(true);
  };
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('ludo_admin_token') || sessionStorage.getItem('ludo_admin_token');
    } catch {
      return null;
    }
  });
  const [adminData, setAdminData] = useState<any | null>(null);
  const [adminAlias, setAdminAlias] = useState<string>('admin');

  // Mobile Back Button Navigation & Exit Warning State
  const [backToastMsg, setBackToastMsg] = useState<string | null>(null);
  const [exitConfirmationConfig, setExitConfirmationConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
  } | null>(null);
  const backToastTimeoutRef = useRef<any>(null);

  // Initialize central navigation stack on mount
  useEffect(() => {
    navigationHistory.init();
    navigationHistory.setToastCallback((msg) => {
      setBackToastMsg(msg);
      if (backToastTimeoutRef.current) clearTimeout(backToastTimeoutRef.current);
      backToastTimeoutRef.current = setTimeout(() => {
        setBackToastMsg(null);
      }, 2200);
    });
    navigationHistory.setConfirmationCallback((config) => {
      setExitConfirmationConfig(config);
    });
  }, []);

  // Matchmaking & Dynamic Player Mode State
  const [playerMode, setPlayerMode] = useState<PlayerModeOption>(4);
  const [currentMatchConfig, setCurrentMatchConfig] = useState<MatchConfig | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string>('');
  const settledMatchesRef = useRef<Set<string>>(new Set());
  const isSettlingMatchRef = useRef<boolean>(false);

  // Authoritative double-entry ledger match settlement
  const settleAndFinalizeMatch = useCallback(
    async (winnerColor: PlayerColor, customWinnerPlayer?: Player) => {
      const gs = gameStateRef.current;
      const cfg = currentMatchConfigRef.current;
      const winnerP = customWinnerPlayer || gs.players[winnerColor];
      const mId = activeMatchId || `match_${(cfg?.gameType || 'supreme')}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Deduplicate settlement calls - prevent duplicate executions for same match
      if (settledMatchesRef.current.has(mId) || isSettlingMatchRef.current) {
        console.log(`[Settlement] Match ${mId} is already settled or in progress, skipping duplicate call.`);
        return;
      }
      settledMatchesRef.current.add(mId);
      isSettlingMatchRef.current = true;

      const activeCols = activeColorsRef.current;
      const activeList = activeCols.map((c) => gs.players[c]).filter(Boolean);
      const sorted = [...activeList].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

      const isSupremeMode = cfg?.gameType !== 'classic' && cfg?.gameType !== 'snake';
      const actualWinnerP = isSupremeMode ? (sorted[0] || winnerP) : (winnerP || sorted[0]);
      const actualWinnerColor = actualWinnerP?.color || winnerColor;
      const isWinnerHuman = actualWinnerP?.isHuman || actualWinnerP?.id === 'p1';
      const winnerUserId = isWinnerHuman ? (currentUser?.id || 'user_guest_default') : `bot_${actualWinnerColor}`;
      const winnerName = actualWinnerP?.name || `${actualWinnerColor.toUpperCase()} Player`;
      const effectivePrize = cfg?.prizePool && cfg.prizePool > 0 ? cfg.prizePool : (cfg?.entryFee ? cfg.entryFee * 1.8 : 0);

      // Instant optimistic UI update for the user if human won
      if (isWinnerHuman && effectivePrize > 0) {
        setBalance((prevBal) => {
          const updated = Number((prevBal + effectivePrize).toFixed(2));
          setUsdtBalanceStr(`$${updated.toFixed(2)}`);
          return updated;
        });
      }

      // Order players strictly by score ranking with winner at rank 1
      const activeUserId = currentUser?.id || 'user_guest_default';
      const reorderedList = isSupremeMode
        ? sorted
        : [actualWinnerP, ...sorted.filter((p) => p.color !== actualWinnerColor)];

      const playerResults = reorderedList.map((p, idx) => ({
        userId: p.isHuman || p.id === 'p1' ? activeUserId : `bot_${p.color}`,
        username: p.name,
        rank: idx + 1,
        finalScore: p.score ?? 0,
        tokensHome: p.pawns.filter((pawn) => pawn.state === 'goal').length,
        capturesMade: 0,
        totalDistanceMoved: 50,
        isHuman: p.isHuman || p.id === 'p1',
      }));

      try {
        const settleRes = await UnifiedWalletService.settleMatchOutcome({
          matchId: mId,
          gameMode: cfg?.gameType === 'snake' ? 'SNAKE_LUDO' : cfg?.gameType === 'classic' ? 'LUDO_CLASSIC' : 'LUDO_SUPREME',
          winnerUserId,
          winnerName,
          winnerColor,
          entryFee: cfg?.entryFee || 0,
          prizePool: effectivePrize,
          playerCount: activeCols.length || 2,
          playerResults,
          tournamentId: cfg?.tournamentId,
        });

        if (settleRes?.userBalance && isWinnerHuman) {
          const authoritativeBal = parseFloat(settleRes.userBalance);
          if (!isNaN(authoritativeBal)) {
            setBalance(authoritativeBal);
            setUsdtBalanceStr(`$${authoritativeBal.toFixed(2)}`);
          }
        }

        // Trigger wallet and transactions sync from backend
        fetchRealWalletBalance();
      } catch (err) {
        console.error('Ludo match settlement error:', err);
        fetchRealWalletBalance();
      } finally {
        isSettlingMatchRef.current = false;
      }
    },
    [activeMatchId, currentUser?.id, fetchRealWalletBalance]
  );

  // URL Path & Query Detection for Admin Portal and Realtime Sync (Runs once on mount)
  useEffect(() => {
    realtimeClient.init();

    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.adminUrls?.currentSlug) {
          const slug = data.adminUrls.currentSlug;
          setAdminAlias(slug);

          const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
          const searchParams = new URLSearchParams(window.location.search);
          const isHashAdmin = window.location.hash.includes('admin') || window.location.hash.includes(slug);

          if (
            path === 'admin' ||
            path === 'custom' ||
            path === slug ||
            searchParams.get('view') === 'admin' ||
            isHashAdmin
          ) {
            setViewMode('admin');
          }
        }
      })
      .catch(() => {
        const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
        if (path === 'admin' || path === 'custom') {
          setViewMode('admin');
        }
      });

    // Validate cached admin token on startup
    const cachedToken = localStorage.getItem('ludo_admin_token') || sessionStorage.getItem('ludo_admin_token');
    if (cachedToken) {
      fetch('/api/admin/auth/me', {
        headers: { Authorization: `Bearer ${cachedToken}` },
      })
        .then(async (res) => {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('ludo_admin_token');
            sessionStorage.removeItem('ludo_admin_token');
            setAdminToken(null);
            setAdminData(null);
            return;
          }
          if (res.ok) {
            const data = await res.json();
            if (data.admin) {
              setAdminData(data.admin);
            }
          }
        })
        .catch(() => {
          // Never invalidate auth on network hiccups or server reboot
        });
    }

    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (path === 'admin' || path === 'custom') {
        setViewMode('admin');
      } else if (path === '') {
        setViewMode('lobby');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [gameState, setGameState] = useState<GameState>({
    players: DEFAULT_PLAYERS,
    currentTurn: 'blue',
    dice: { value: 6, isRolling: false, hasRolled: false, canRoll: true },
    selectedPawnId: null,
    movablePawnIds: [],
    statusText: "PLAYER 1'S TURN — ROLL THE DICE!",
    winner: null,
    isAutoPlay: false,
    isMuted: false,
    theme: 'dubai_sunset',
    consecutiveSixes: 0,
  });

  const activeColors: PlayerColor[] = useMemo(() => {
    const active = (Object.keys(gameState.players) as PlayerColor[]).filter(
      (c) => gameState.players[c]?.isActive
    );
    if (active.length > 0) return active;
    return playerMode === 2
      ? ['blue', 'green']
      : playerMode === 3
      ? ['blue', 'red', 'green']
      : ['blue', 'red', 'green', 'yellow'];
  }, [gameState.players, playerMode]);

  const humanPlayer = useMemo(() => {
    return (Object.values(gameState.players) as Player[]).find((p) => p?.isHuman);
  }, [gameState.players]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [lastMatchedOpponents, setLastMatchedOpponents] = useState<MatchedOpponent[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDebugGridVisible, setIsDebugGridVisible] = useState(false);
  const [steppingPawnId, setSteppingPawnId] = useState<string | null>(null);
  const [bouncingCellKey, setBouncingCellKey] = useState<string | null>(null);
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(TURN_TIME_LIMIT);
  const [turnCycleId, setTurnCycleId] = useState<number>(1);
  const [playerStrikes, setPlayerStrikes] = useState<Record<PlayerColor, number>>({
    blue: 0,
    red: 0,
    green: 0,
    yellow: 0,
  });
  const [matchTimeLeft, setMatchTimeLeft] = useState<number>(180); // 2 min 60 sec (180s)
  const [activeAngelFlight, setActiveAngelFlight] = useState<AngelFlightData | null>(null);

  // Authoritative turn lock ref & animation tracking refs
  const isRollOrMoveInProgressRef = useRef<boolean>(false);
  const noMoveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botRollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botMoveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const steppingPawnIdRef = useRef<string | null>(null);
  steppingPawnIdRef.current = steppingPawnId;
  const activeAngelFlightRef = useRef<AngelFlightData | null>(null);
  activeAngelFlightRef.current = activeAngelFlight;

  // Keep mutable refs for interval access without re-triggering timer effects
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const currentMatchConfigRef = useRef(currentMatchConfig);
  currentMatchConfigRef.current = currentMatchConfig;
  const activeColorsRef = useRef(activeColors);
  activeColorsRef.current = activeColors;

  // 10-Second Turn Countdown Timer Effect (Strictly active only during ludo_game mode - exact match to Snake Ludo)
  // Authoritative: Freezes countdown while dice is rolling, pawn is stepping, angel is flying, or action is locked.
  useEffect(() => {
    if (viewMode !== 'ludo_game' || Boolean(gameState.winner)) return;

    setTurnTimeLeft(TURN_TIME_LIMIT);

    const timerInterval = setInterval(() => {
      // FREEZE turn timer if dice is rolling, pawn is stepping, angel flight is active, or action in progress!
      if (
        gameStateRef.current.dice.isRolling ||
        Boolean(steppingPawnIdRef.current) ||
        Boolean(activeAngelFlightRef.current) ||
        isRollOrMoveInProgressRef.current
      ) {
        return; // Paused during active animations, rolling, or pawn hopping
      }

      setTurnTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [viewMode, turnCycleId, gameState.currentTurn, Boolean(gameState.winner)]);

  // 2 Minutes 60 Seconds (180s) Supreme Match Countdown Timer Effect (Continuously running)
  useEffect(() => {
    if (viewMode !== 'ludo_game' || Boolean(gameState.winner) || currentMatchConfig?.gameType === 'classic') return;

    if (matchTimeLeft <= 0) {
      // Timer finished -> Calculate top scorer using current refs
      const gs = gameStateRef.current;
      const cols = activeColorsRef.current;
      const activeList = cols.map((c) => gs.players[c]).filter(Boolean);
      const sorted = [...activeList].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      const topPlayer = sorted[0];

      if (topPlayer && !gameState.winner) {
        SoundManager.play('pawn-finish');

        // Authoritative double-entry ledger settlement
        settleAndFinalizeMatch(topPlayer.color, topPlayer);

        setGameState((g) => ({
          ...g,
          winner: topPlayer.color,
          statusText: `⏱️ TIME OVER! ${topPlayer.name.toUpperCase()} WINS WITH ${topPlayer.score ?? 0} PTS!`,
        }));
      }
      return;
    }

    const matchInterval = setInterval(() => {
      setMatchTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(matchInterval);
  }, [viewMode, Boolean(gameState.winner), currentMatchConfig?.gameType, matchTimeLeft, settleAndFinalizeMatch]);

  // Flatten all pawns of active players for rendering
  const allPawns = activeColors.flatMap((c) => gameState.players[c].pawns);

  // Compute active players ranking for Supreme mode
  const playerRankMap = useMemo(() => {
    const sorted = (Object.keys(gameState.players) as PlayerColor[])
      .filter((c) => gameState.players[c]?.isActive)
      .sort((a, b) => (gameState.players[b]?.score ?? 0) - (gameState.players[a]?.score ?? 0));
    const ranks: Partial<Record<PlayerColor, number>> = {};
    sorted.forEach((c, idx) => {
      ranks[c] = idx + 1;
    });
    return ranks;
  }, [gameState.players]);

  // Find legal movable pawns for the rolled dice value
  const getMovablePawns = useCallback(
    (color: PlayerColor, diceVal: number): string[] => {
      const playerPawns = gameState.players[color]?.pawns || [];
      const movables: string[] = [];

      playerPawns.forEach((p) => {
        if (p.pathStep === -1) {
          if (diceVal === 6) movables.push(p.id);
        } else if (p.pathStep < 56) {
          if (p.pathStep + diceVal <= 56) {
            movables.push(p.id);
          }
        }
      });

      return movables;
    },
    [gameState.players]
  );

  // Handle Match Start from Lobby
  const handleStartOnlineMatch = async (
    mode: PlayerModeOption,
    entryFee: number,
    prizePool: number,
    gameType: 'classic' | 'supreme' | 'snake' = 'supreme',
    variation: GameVariation = 'Classic',
    playersConfig?: PlayerConfig[],
    tournamentId?: string
  ) => {
    // 1. Client-Side Balance Validation
    if (entryFee > 0 && balance < entryFee) {
      setBackToastMsg(`⚠️ Insufficient balance ($${balance.toFixed(2)}). Please add funds or play Free Practice!`);
      if (backToastTimeoutRef.current) clearTimeout(backToastTimeoutRef.current);
      backToastTimeoutRef.current = setTimeout(() => setBackToastMsg(null), 3500);
      return;
    }

    const newMatchId = `match_${gameType}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setActiveMatchId(newMatchId);
    isSettlingMatchRef.current = false;

    if (entryFee > 0) {
      try {
        await UnifiedWalletService.lockMatchEntry({
          userId: currentUser?.id || 'user_guest_default',
          username: currentUser?.displayName || currentUser?.username || 'Player 1',
          matchId: newMatchId,
          gameMode: gameType === 'snake' ? 'SNAKE_LUDO' : gameType === 'supreme' ? 'LUDO_SUPREME' : 'LUDO_CLASSIC',
          playerCount: Number(mode) === 2 ? 2 : Number(mode) === 3 ? 3 : 4,
          entryFee,
          prizePool,
        });

        setBalance((b) => Math.max(0, Number((b - entryFee).toFixed(2))));
        setUsdtBalanceStr(`$${Math.max(0, Number((balance - entryFee).toFixed(2))).toFixed(2)}`);
      } catch (err: any) {
        console.warn('Match entry lock notice:', err.message);
        const errMsg = err?.message || 'Insufficient balance';
        if (errMsg.toLowerCase().includes('insufficient')) {
          setBackToastMsg(`⚠️ Insufficient balance to join ($${balance.toFixed(2)}). Please add funds!`);
          if (backToastTimeoutRef.current) clearTimeout(backToastTimeoutRef.current);
          backToastTimeoutRef.current = setTimeout(() => setBackToastMsg(null), 3500);
          fetchRealWalletBalance();
          return;
        }
      }
    }

    setPlayerMode(mode);
    setCurrentMatchConfig({ mode, entryFee, prizePool, gameType, variation, playersConfig, tournamentId });
    setViewMode('matchmaking');
  };

  // Match Complete -> Prepare Board for 2P, 3P, or 4P
  const handleMatchComplete = (matchedOpponents: MatchedOpponent[]) => {
    // Record match event for anti-fraud referral qualification
    ReferralClientService.recordMatchEvent('user_guest_default');
    setLastMatchedOpponents(matchedOpponents);

    if (currentMatchConfig?.gameType === 'snake') {
      setViewMode('snake_ludo');
      return;
    }

    const isSupreme = currentMatchConfig?.gameType !== 'classic';
    const customPlayers = currentMatchConfig?.playersConfig;
    
    // Initialize all 4 colors as inactive
    const updatedPlayers: Record<PlayerColor, Player> = {
      blue: { ...DEFAULT_PLAYERS.blue, isActive: false, pawns: [] },
      red: { ...DEFAULT_PLAYERS.red, isActive: false, pawns: [] },
      green: { ...DEFAULT_PLAYERS.green, isActive: false, pawns: [] },
      yellow: { ...DEFAULT_PLAYERS.yellow, isActive: false, pawns: [] },
    };

    // Helper to generate pawns - starting OUTSIDE at pathStep: 0 for Supreme mode!
    const createPawnsForColor = (color: PlayerColor, playerId: string): Pawn[] => {
      return [0, 1, 2, 3].map((idx) => {
        if (isSupreme) {
          const coord = getPawnGridCoord(color, idx, 0);
          return {
            id: `${color}-${idx}`,
            playerId,
            color,
            pawnIndex: idx,
            state: 'path' as Pawn['state'],
            pathStep: 0,
            gridX: coord.x,
            gridY: coord.y,
          };
        } else {
          const homeCoords = HOME_SLOTS[color][idx];
          return {
            id: `${color}-${idx}`,
            playerId,
            color,
            pawnIndex: idx,
            state: 'home' as Pawn['state'],
            pathStep: -1,
            gridX: homeCoords.x,
            gridY: homeCoords.y,
          };
        }
      });
    };

    const allColorPalette: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
    
    // Player 1 (Human) chosen color
    const p1Color = (customPlayers?.[0]?.color || 'red') as PlayerColor;
    
    // Determine active colors for all players
    const assignedPlayerColors: PlayerColor[] = [p1Color];
    for (let i = 1; i < playerMode; i++) {
      const opp = matchedOpponents[i - 1];
      let desiredColor = (opp?.color as PlayerColor) || (customPlayers?.[i]?.color as PlayerColor | undefined);
      if (!desiredColor || assignedPlayerColors.includes(desiredColor)) {
        desiredColor = allColorPalette.find((c) => !assignedPlayerColors.includes(c)) || 'green';
      }
      assignedPlayerColors.push(desiredColor);
    }

    // Configure Player 1 (Human)
    const p1Name = customPlayers?.[0]?.name || humanPlayer?.name || currentUser?.displayName || currentUser?.username || 'Player 1';
    const p1Avatar = customPlayers?.[0]?.avatarUrl || humanPlayer?.avatarUrl || currentUser?.avatarUrl || DEFAULT_PLAYERS[p1Color].avatarUrl;

    updatedPlayers[p1Color] = {
      ...DEFAULT_PLAYERS[p1Color],
      name: p1Name,
      avatarUrl: p1Avatar,
      color: p1Color,
      isActive: true,
      isHuman: true,
      score: 0,
      pawns: createPawnsForColor(p1Color, 'p1'),
    };

    // Configure Opponents with exact matchmaking names, avatars, and colors
    for (let i = 1; i < playerMode; i++) {
      const oppIndex = i - 1;
      const opp = matchedOpponents[oppIndex];
      const customP = customPlayers?.[i];
      const oppColor = assignedPlayerColors[i];

      updatedPlayers[oppColor] = {
        ...DEFAULT_PLAYERS[oppColor],
        name: opp?.name || customP?.name || DEFAULT_PLAYERS[oppColor].name,
        avatarUrl: opp?.avatarUrl || customP?.avatarUrl || DEFAULT_PLAYERS[oppColor].avatarUrl,
        color: oppColor,
        isActive: true,
        isHuman: false,
        score: 0,
        pawns: createPawnsForColor(oppColor, `p${i + 1}`),
      };
    }

    setGameState({
      players: updatedPlayers,
      currentTurn: p1Color,
      dice: { value: 6, isRolling: false, hasRolled: false, canRoll: true },
      selectedPawnId: null,
      movablePawnIds: [],
      statusText: isSupreme
        ? `⚡ LUDO SUPREME SPEED MATCH! ${updatedPlayers[p1Color].name.toUpperCase()}'S TURN — ROLL ANY NUMBER TO MOVE!`
        : `${updatedPlayers[p1Color].name.toUpperCase()}'S TURN — ROLL THE DICE!`,
      winner: null,
      isAutoPlay: false,
      isMuted: false,
      theme: 'dubai_sunset',
      consecutiveSixes: 0,
      gameType: currentMatchConfig?.gameType || 'supreme',
      homesCount: { blue: 0, red: 0, green: 0, yellow: 0 },
    });

    setPlayerStrikes({ blue: 0, red: 0, green: 0, yellow: 0 });
    setTurnTimeLeft(TURN_TIME_LIMIT);
    setMatchTimeLeft(180);
    setChatMessages([]);
    if (noMoveTimerRef.current) {
      clearTimeout(noMoveTimerRef.current);
      noMoveTimerRef.current = null;
    }
    if (botRollTimerRef.current) {
      clearTimeout(botRollTimerRef.current);
      botRollTimerRef.current = null;
    }
    if (botMoveTimerRef.current) {
      clearTimeout(botMoveTimerRef.current);
      botMoveTimerRef.current = null;
    }
    isRollOrMoveInProgressRef.current = false;
    setTurnCycleId((c) => c + 1);
    setViewMode('ludo_game');
  };

  // Authoritative Dice Roll with Mutex Lock and Realistic 3D Tumble Time
  const handleRollDice = (forcedValue?: number) => {
    if (viewMode !== 'ludo_game') return;
    // Strict Mutex Lock: Guard against duplicate taps, bot collisions, and rolling during movements
    if (isRollOrMoveInProgressRef.current) return;
    if (gameState.winner || steppingPawnId || activeAngelFlight) return;
    if (!gameState.dice.canRoll || gameState.dice.isRolling || gameState.dice.hasRolled) return;

    // Acquire authoritative action lock
    isRollOrMoveInProgressRef.current = true;

    // Clear any pending no-move or bot timers
    if (noMoveTimerRef.current) {
      clearTimeout(noMoveTimerRef.current);
      noMoveTimerRef.current = null;
    }
    if (botRollTimerRef.current) {
      clearTimeout(botRollTimerRef.current);
      botRollTimerRef.current = null;
    }
    if (botMoveTimerRef.current) {
      clearTimeout(botMoveTimerRef.current);
      botMoveTimerRef.current = null;
    }

    // Immediately trigger rolling state in UI to disable controls and freeze countdown timer
    setGameState((prev) => ({
      ...prev,
      dice: {
        ...prev.dice,
        isRolling: true,
        canRoll: false,
        hasRolled: false,
      },
      statusText: `${prev.players[prev.currentTurn].name} IS ROLLING...`,
    }));

    SoundManager.play('dice-roll');

    // Simulate 3D tumble physics duration (650ms) matching 3D dice tumble
    setTimeout(() => {
      // If match ended or winner decided, abort and unlock
      if (gameStateRef.current.winner) {
        isRollOrMoveInProgressRef.current = false;
        return;
      }

      const rolledVal = forcedValue ?? Math.floor(Math.random() * 6) + 1;
      const curTurn = gameStateRef.current.currentTurn;
      const activePlayerName = gameStateRef.current.players[curTurn].name;
      const movables = getMovablePawns(curTurn, rolledVal);

      // Check consecutive sixes rule
      if (rolledVal === 6) {
        const nextSixes = gameStateRef.current.consecutiveSixes + 1;

        if (nextSixes === 3) {
          const nextTurn = getNextTurnColor(curTurn, activeColorsRef.current);
          SoundManager.play('turn');
          setGameState((prev) => ({
            ...prev,
            currentTurn: nextTurn,
            consecutiveSixes: 0,
            dice: { value: 6, isRolling: false, hasRolled: false, canRoll: true },
            movablePawnIds: [],
            statusText: `${activePlayerName} ROLLED 3 SIXES IN A ROW! TURN FORFEITED.`,
          }));
          setTurnTimeLeft(TURN_TIME_LIMIT);
          setTurnCycleId((c) => c + 1);
          isRollOrMoveInProgressRef.current = false;
          return;
        }

        let statusMsg = `${activePlayerName} ROLLED A 6!`;
        if (movables.length === 0) {
          statusMsg += ' NO LEGAL MOVES. BONUS TURN GRANTED!';
        } else {
          statusMsg += ' SELECT A PAWN TO MOVE.';
        }

        setGameState((prev) => ({
          ...prev,
          consecutiveSixes: nextSixes,
          dice: {
            value: rolledVal,
            isRolling: false,
            hasRolled: true,
            canRoll: false,
          },
          movablePawnIds: movables,
          statusText: statusMsg,
        }));

        if (movables.length > 0) {
          // Release lock so active player/bot can pick a movable pawn
          isRollOrMoveInProgressRef.current = false;
        } else {
          // Auto-grant bonus roll after brief pause
          noMoveTimerRef.current = setTimeout(() => {
            if (gameStateRef.current.winner) {
              isRollOrMoveInProgressRef.current = false;
              return;
            }
            SoundManager.play('turn');
            setTurnTimeLeft(TURN_TIME_LIMIT);
            setTurnCycleId((c) => c + 1);
            setGameState((prev) => ({
              ...prev,
              dice: { value: prev.dice.value, isRolling: false, hasRolled: false, canRoll: true },
              statusText: `${prev.players[prev.currentTurn].name} ROLLED 6 — BONUS TURN! ROLL AGAIN.`,
            }));
            isRollOrMoveInProgressRef.current = false;
          }, 1200);
        }
        return;
      }

      // Rolled 1..5
      let statusMsg = `${activePlayerName} ROLLED A ${rolledVal}!`;
      if (movables.length === 0) {
        statusMsg += ' NO LEGAL MOVES.';
      } else {
        statusMsg += ' SELECT A PAWN TO MOVE.';
      }

      setGameState((prev) => ({
        ...prev,
        consecutiveSixes: 0,
        dice: {
          value: rolledVal,
          isRolling: false,
          hasRolled: true,
          canRoll: false,
        },
        movablePawnIds: movables,
        statusText: statusMsg,
      }));

      if (movables.length > 0) {
        // Release lock so active player/bot can pick a movable pawn
        isRollOrMoveInProgressRef.current = false;
      } else {
        // Auto-pass turn to next player after brief display pause
        noMoveTimerRef.current = setTimeout(() => {
          if (gameStateRef.current.winner) {
            isRollOrMoveInProgressRef.current = false;
            return;
          }
          const nextTurn = getNextTurnColor(gameStateRef.current.currentTurn, activeColorsRef.current);
          SoundManager.play('turn');
          setTurnTimeLeft(TURN_TIME_LIMIT);
          setTurnCycleId((c) => c + 1);
          setGameState((prev) => ({
            ...prev,
            currentTurn: nextTurn,
            consecutiveSixes: 0,
            dice: { value: prev.dice.value, isRolling: false, hasRolled: false, canRoll: true },
            statusText: `${prev.players[nextTurn].name}'S TURN — ROLL THE DICE!`,
          }));
          isRollOrMoveInProgressRef.current = false;
        }, 1200);
      }
    }, 650);
  };

  // Finalize Pawn Move & Turn Progression
  const finalizeMove = (clickedPawn: Pawn, finalStep: number, diceValue: number) => {
    const isGoalArrival = finalStep === 56;
    const isSupreme = currentMatchConfig?.gameType !== 'classic';

    if (isGoalArrival) {
      SoundManager.play('score-double');
      confetti({ particleCount: 85, spread: 85, origin: { y: 0.6 } });
    } else {
      SoundManager.play('pawn-land');
    }

    let didWin = false;
    let winColor: PlayerColor | null = null;
    let winPlayer: Player | null = null;

    setGameState((prev) => {
      const updatedPlayers = { ...prev.players };
      const curPlayer = { ...updatedPlayers[prev.currentTurn] };
      const updatedHomes = { ...(prev.homesCount || { blue: 0, red: 0, green: 0, yellow: 0 }) };

      // 1. Scoring - Base tile movement points (+1 pt per tile)
      let basePoints = diceValue;
      let newScore = (curPlayer.score ?? 0) + basePoints;
      let scoreDoubleMsg = '';
      let captureMsg = '';

      // 2. Check Home Arrival & Double Score Multiplier
      if (isGoalArrival) {
        const homeNum = (updatedHomes[prev.currentTurn] || 0) + 1;
        updatedHomes[prev.currentTurn] = homeNum;
        newScore = newScore * 2; // Double total score upon reaching home!
        scoreDoubleMsg = ` — 🌟 ${homeNum === 1 ? '1ST' : homeNum === 2 ? '2ND' : `${homeNum}TH`} HOME! 2X SCORE (${newScore} PTS)!`;
      }
      curPlayer.score = newScore;
      updatedPlayers[prev.currentTurn] = curPlayer;

      // 3. Check Captures on target tile (if not in safe cell or home stretch)
      let didCapture = false;
      if (finalStep >= 0 && finalStep <= 50) {
        const targetCoord = getPawnGridCoord(prev.currentTurn, clickedPawn.pawnIndex, finalStep);
        if (!isSafeCell(targetCoord)) {
          activeColors.forEach((otherColor) => {
            if (otherColor !== prev.currentTurn) {
              const otherPlayer = { ...updatedPlayers[otherColor] };
              let captured = false;
              otherPlayer.pawns = otherPlayer.pawns.map((op) => {
                if (op.pathStep >= 0 && op.pathStep <= 50) {
                  const opCoord = getPawnGridCoord(otherColor, op.pawnIndex, op.pathStep);
                  if (opCoord.x === targetCoord.x && opCoord.y === targetCoord.y) {
                    didCapture = true;
                    captured = true;
                    const capturedStep = op.pathStep;
                    const startCoord = isSupreme
                      ? getPawnGridCoord(otherColor, op.pawnIndex, 0)
                      : HOME_SLOTS[otherColor][op.pawnIndex];

                    // Score deduction for cut pawn
                    const scorePenalty = Math.min(otherPlayer.score ?? 0, capturedStep);
                    otherPlayer.score = Math.max(0, (otherPlayer.score ?? 0) - capturedStep);
                    SoundManager.play('score-minus');

                    captureMsg = ` — ⚔️ CUT ${otherPlayer.name}'S PAWN (-${scorePenalty} PTS)!`;

                    setActiveAngelFlight({
                      id: `flight-${op.id}-${Date.now()}`,
                      pawn: { ...op },
                      fromPathStep: capturedStep,
                      fromCoord: { ...opCoord },
                      toCoord: { ...startCoord },
                      capturedByColor: prev.currentTurn,
                      capturedByName: curPlayer.name,
                    });

                    // In Supreme mode, returned pawns stay outside at step 0 ready to roll!
                    return {
                      ...op,
                      pathStep: isSupreme ? 0 : -1,
                      state: (isSupreme ? 'path' : 'home') as Pawn['state'],
                      gridX: startCoord.x,
                      gridY: startCoord.y,
                    };
                  }
                }
                return op;
              });
              if (captured) {
                updatedPlayers[otherColor] = otherPlayer;
              }
            }
          });
        }
      }

      // Check if current player has won by getting all pawns home
      const allReachedGoal = curPlayer.pawns.length > 0 && curPlayer.pawns.every((p) => p.state === 'goal');
      if (allReachedGoal) {
        didWin = true;
        winColor = prev.currentTurn;
        winPlayer = curPlayer;
        return {
          ...prev,
          players: updatedPlayers,
          homesCount: updatedHomes,
          winner: prev.currentTurn,
          statusText: `${curPlayer.name.toUpperCase()} CONQUERED ALL HOMES & WINS!`,
        };
      }

      // Extra Turn logic
      const getsExtraTurn = diceValue === 6 || didCapture || isGoalArrival;
      const nextTurnColor = getsExtraTurn
        ? prev.currentTurn
        : getNextTurnColor(prev.currentTurn, activeColors);

      if (!getsExtraTurn) {
        SoundManager.play('turn');
      }

      const statusMsg = getsExtraTurn
        ? `${curPlayer.name} ${diceValue === 6 ? 'ROLLED 6' : didCapture ? 'CAPTURED PAWN' : 'REACHED HOME'}${scoreDoubleMsg}${captureMsg} — BONUS TURN!`
        : `${updatedPlayers[nextTurnColor].name}'S TURN${scoreDoubleMsg}${captureMsg} — ROLL THE DICE!`;

      setTurnTimeLeft(TURN_TIME_LIMIT);

      return {
        ...prev,
        players: updatedPlayers,
        homesCount: updatedHomes,
        currentTurn: nextTurnColor,
        consecutiveSixes: getsExtraTurn && diceValue === 6 ? prev.consecutiveSixes : 0,
        dice: { value: prev.dice.value, isRolling: false, hasRolled: false, canRoll: true },
        movablePawnIds: [],
        selectedPawnId: null,
        statusText: statusMsg,
      };
    });

    if (didWin && winColor && winPlayer) {
      SoundManager.play('pawn-finish');
      settleAndFinalizeMatch(winColor, winPlayer);
    }

    setSteppingPawnId(null);
    setTimeout(() => setBouncingCellKey(null), 300);
    // Increment turn cycle ID to give fresh 10 seconds for bonus or next turn and release lock
    setTurnCycleId((c) => c + 1);
    isRollOrMoveInProgressRef.current = false;
  };

  // Move Pawn Action (Animated Cell-by-Cell Hop)
  const handlePawnClick = (clickedPawn: Pawn) => {
    if (viewMode !== 'ludo_game') return;
    if (steppingPawnId || isRollOrMoveInProgressRef.current) return;
    if (clickedPawn.color !== gameState.currentTurn) return;
    if (!gameState.dice.hasRolled || gameState.dice.isRolling) return;
    if (!gameState.movablePawnIds.includes(clickedPawn.id)) return;

    // Acquire authoritative action lock immediately
    isRollOrMoveInProgressRef.current = true;
    setSteppingPawnId(clickedPawn.id);

    // Cancel any pending timers
    if (noMoveTimerRef.current) {
      clearTimeout(noMoveTimerRef.current);
      noMoveTimerRef.current = null;
    }
    if (botMoveTimerRef.current) {
      clearTimeout(botMoveTimerRef.current);
      botMoveTimerRef.current = null;
    }

    const diceValue = gameState.dice.value;
    const startStep = clickedPawn.pathStep;
    const targetStep = startStep === -1 ? 0 : startStep + diceValue;
    const color = clickedPawn.color;
    const pawnIndex = clickedPawn.pawnIndex;

    setGameState((prev) => ({
      ...prev,
      movablePawnIds: [],
      selectedPawnId: clickedPawn.id,
    }));

    let stepCount = 0;
    const stepsToPerform = startStep === -1 ? 1 : diceValue;
    const STEP_DURATION_MS = 150; // Exact same fast 150ms per cell speed as Snake Ludo

    const doStep = () => {
      stepCount++;
      const currentStep = startStep === -1 ? 0 : startStep + stepCount;

      setGameState((prev) => {
        const updatedPlayers = { ...prev.players };
        const player = { ...updatedPlayers[color] };
        player.pawns = player.pawns.map((p) => {
          if (p.id === clickedPawn.id) {
            return {
              ...p,
              pathStep: currentStep,
              state: (currentStep === 56 ? 'goal' : 'path') as Pawn['state'],
            };
          }
          return p;
        });
        updatedPlayers[color] = player;
        return {
          ...prev,
          players: updatedPlayers,
        };
      });

      SoundManager.play('pawn-step');
      const coord = getPawnGridCoord(color, pawnIndex, currentStep);
      const cellKey = `${Math.round(coord.x)}-${Math.round(coord.y)}`;
      setBouncingCellKey(cellKey);

      if (stepCount < stepsToPerform) {
        setTimeout(doStep, STEP_DURATION_MS);
      } else {
        setTimeout(() => {
          finalizeMove(clickedPawn, targetStep, diceValue);
        }, STEP_DURATION_MS + 80);
      }
    };

    doStep();
  };

  // 1. Turn Expiration Effect (Handles 3 Strikes & Timeouts when turnTimeLeft hits 0)
  useEffect(() => {
    if (viewMode !== 'ludo_game' || turnTimeLeft > 0) return;

    // Do NOT time out if game is over or animations/actions are in progress!
    if (
      gameState.winner ||
      steppingPawnId ||
      activeAngelFlight ||
      gameState.dice.isRolling ||
      isRollOrMoveInProgressRef.current
    ) {
      return;
    }

    const curPlayer = gameState.players[gameState.currentTurn];
    if (!curPlayer || !curPlayer.isActive) return;

    const curColor = gameState.currentTurn;
    const nextStrikes = (playerStrikes[curColor] || 0) + 1;
    const newStrikes = { ...playerStrikes, [curColor]: nextStrikes };
    setPlayerStrikes(newStrikes);

    SoundManager.play('turn');

    if (nextStrikes >= MAX_STRIKES) {
      // Player missed 3 turns -> Instant Forfeit!
      const remainingActiveColors = activeColors.filter(
        (c) => c !== curColor && gameState.players[c]?.isActive
      );

      if (remainingActiveColors.length <= 1) {
        const winnerColor = remainingActiveColors[0] || getNextTurnColor(curColor, activeColors);
        const winnerPlayer = gameState.players[winnerColor];

        SoundManager.play('pawn-finish');
        settleAndFinalizeMatch(winnerColor, winnerPlayer);

        setGameState((prev) => ({
          ...prev,
          winner: winnerColor,
          statusText: `❌ ${curPlayer.name.toUpperCase()} MISSED 3 TURNS AND FORFEITED! ${winnerPlayer?.name.toUpperCase() || 'OPPONENT'} WINS!`,
        }));
        return;
      } else {
        // In 3-player or 4-player match, eliminate this player and pass turn
        const nextTurn = getNextTurnColor(curColor, remainingActiveColors);
        setGameState((prev) => {
          const updPlayers = { ...prev.players };
          if (updPlayers[curColor]) {
            updPlayers[curColor] = { ...updPlayers[curColor], isActive: false };
          }
          return {
            ...prev,
            players: updPlayers,
            currentTurn: nextTurn,
            consecutiveSixes: 0,
            dice: { value: prev.dice.value, isRolling: false, hasRolled: false, canRoll: true },
            movablePawnIds: [],
            selectedPawnId: null,
            statusText: `⚠️ ${curPlayer.name.toUpperCase()} MISSED 3 TURNS & WAS DISQUALIFIED!`,
          };
        });
        setTurnTimeLeft(TURN_TIME_LIMIT);
        setTurnCycleId((c) => c + 1);
        isRollOrMoveInProgressRef.current = false;
        return;
      }
    } else {
      // Strike 1 or 2: Skip turn with strike penalty alert
      const nextTurn = getNextTurnColor(curColor, activeColors);
      setGameState((prev) => ({
        ...prev,
        currentTurn: nextTurn,
        consecutiveSixes: 0,
        dice: { value: prev.dice.value, isRolling: false, hasRolled: false, canRoll: true },
        movablePawnIds: [],
        selectedPawnId: null,
        statusText: `⏳ TIME'S UP! ${curPlayer.name.toUpperCase()}'S TURN SKIPPED (${nextStrikes}/${MAX_STRIKES} STRIKES)`,
      }));
      setTurnTimeLeft(TURN_TIME_LIMIT);
      setTurnCycleId((c) => c + 1);
      isRollOrMoveInProgressRef.current = false;
      return;
    }
  }, [
    viewMode,
    turnTimeLeft,
    gameState.currentTurn,
    gameState.players,
    gameState.winner,
    gameState.dice.isRolling,
    steppingPawnId,
    activeAngelFlight,
    activeColors,
    playerStrikes,
    settleAndFinalizeMatch,
  ]);

  // 2. Human-like Bot Automation (Online Arena & Ludo Supreme Matches)
  // Authoritative: respects action lock, active flight, pawn hopping, and cancels on turn cycle advance
  useEffect(() => {
    if (
      viewMode !== 'ludo_game' ||
      Boolean(gameState.winner) ||
      Boolean(steppingPawnId) ||
      Boolean(activeAngelFlight) ||
      isRollOrMoveInProgressRef.current
    ) {
      return;
    }

    const curPlayer = gameState.players[gameState.currentTurn];
    if (!curPlayer || !curPlayer.isActive) return;

    const isBot = !curPlayer.isHuman || gameState.isAutoPlay;
    if (!isBot) return;

    // Step A: Natural Dice Roll by Bot
    if (gameState.dice.canRoll && !gameState.dice.isRolling && !gameState.dice.hasRolled) {
      if (botRollTimerRef.current) clearTimeout(botRollTimerRef.current);
      botRollTimerRef.current = setTimeout(() => {
        if (
          viewMode === 'ludo_game' &&
          !gameStateRef.current.winner &&
          !steppingPawnIdRef.current &&
          !activeAngelFlightRef.current &&
          !isRollOrMoveInProgressRef.current
        ) {
          const isSupreme =
            currentMatchConfigRef.current?.gameType !== 'classic' &&
            currentMatchConfigRef.current?.gameType !== 'snake';
          const humanWinRate =
            playerMode === 3
              ? (platformMode.humanWinRate3P ?? 20)
              : playerMode === 4
              ? (platformMode.humanWinRate4P ?? 20)
              : 50;
          const smartVal = getSmartBotRoll(
            gameStateRef.current,
            gameStateRef.current.currentTurn,
            activeColors,
            isSupreme,
            humanWinRate
          );
          handleRollDice(smartVal);
        }
      }, 850);
      return () => {
        if (botRollTimerRef.current) {
          clearTimeout(botRollTimerRef.current);
          botRollTimerRef.current = null;
        }
      };
    }

    // Step B: Natural Step-by-Step Pawn Selection and Movement by Bot
    if (gameState.dice.hasRolled && !gameState.dice.isRolling && gameState.movablePawnIds.length > 0) {
      if (botMoveTimerRef.current) clearTimeout(botMoveTimerRef.current);
      botMoveTimerRef.current = setTimeout(() => {
        if (
          viewMode === 'ludo_game' &&
          !gameStateRef.current.winner &&
          !steppingPawnIdRef.current &&
          !activeAngelFlightRef.current &&
          !isRollOrMoveInProgressRef.current
        ) {
          const isSupreme =
            currentMatchConfigRef.current?.gameType !== 'classic' &&
            currentMatchConfigRef.current?.gameType !== 'snake';
          const movables = gameStateRef.current.movablePawnIds;
          const bestPawnId = chooseBestBotPawn(
            gameStateRef.current,
            gameStateRef.current.currentTurn,
            activeColors,
            movables,
            isSupreme
          );
          const chosenPawn =
            curPlayer.pawns.find((p) => p.id === bestPawnId) ||
            curPlayer.pawns.find((p) => p.id === movables[0]);
          if (chosenPawn) {
            handlePawnClick(chosenPawn);
          }
        }
      }, 750);
      return () => {
        if (botMoveTimerRef.current) {
          clearTimeout(botMoveTimerRef.current);
          botMoveTimerRef.current = null;
        }
      };
    }
  }, [
    viewMode,
    turnCycleId,
    gameState.currentTurn,
    gameState.dice.canRoll,
    gameState.dice.isRolling,
    gameState.dice.hasRolled,
    gameState.movablePawnIds,
    gameState.isAutoPlay,
    gameState.winner,
    steppingPawnId,
    activeAngelFlight,
    activeColors,
    playerMode,
    platformMode.humanWinRate3P,
    platformMode.humanWinRate4P,
  ]);

  // Chat
  const handleSendChat = (text: string, isEmoji = false) => {
    const newMessage: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      senderName: gameState.players.blue.name,
      senderColor: 'blue',
      text,
      timestamp: new Date().toLocaleTimeString(),
      isEmojiOnly: isEmoji,
    };
    setChatMessages((prev) => [...prev, newMessage]);
  };

  const handleToggleMute = () => {
    const newMuted = !gameState.isMuted;
    SoundManager.setMuted(newMuted);
    setGameState((prev) => ({ ...prev, isMuted: newMuted }));
  };

  const handleToggleMic = (playerId?: string) => {
    const targetId = playerId ?? 'p1';
    setGameState((prev) => {
      const updatedPlayers = { ...prev.players };
      (Object.values(updatedPlayers) as Player[]).forEach((p) => {
        if (p.id === targetId) {
          p.isMuted = !p.isMuted;
        }
      });
      return { ...prev, players: updatedPlayers };
    });
  };

  const handleResetGame = () => {
    if (noMoveTimerRef.current) {
      clearTimeout(noMoveTimerRef.current);
      noMoveTimerRef.current = null;
    }
    if (botRollTimerRef.current) {
      clearTimeout(botRollTimerRef.current);
      botRollTimerRef.current = null;
    }
    if (botMoveTimerRef.current) {
      clearTimeout(botMoveTimerRef.current);
      botMoveTimerRef.current = null;
    }
    isRollOrMoveInProgressRef.current = false;
    setTurnCycleId((c) => c + 1);

    setGameState({
      players: DEFAULT_PLAYERS,
      currentTurn: 'blue',
      dice: { value: 6, isRolling: false, hasRolled: false, canRoll: true },
      selectedPawnId: null,
      movablePawnIds: [],
      statusText: "PLAYER 1'S TURN — ROLL THE DICE!",
      winner: null,
      isAutoPlay: false,
      isMuted: gameState.isMuted,
      theme: 'dubai_sunset',
      consecutiveSixes: 0,
    });
    setSteppingPawnId(null);
    setActiveAngelFlight(null);
    setBouncingCellKey(null);
    setPlayerStrikes({ blue: 0, red: 0, green: 0, yellow: 0 });
    setTurnTimeLeft(TURN_TIME_LIMIT);
    setChatMessages([]);
  };

  const handleReturnToLobby = () => {
    SoundManager.play('click');
    setSteppingPawnId(null);
    setActiveAngelFlight(null);
    setBouncingCellKey(null);
    handleResetGame();
    setViewMode('lobby');
  };

  const handleTestAngelFlight = () => {
    const testPawn = gameState.players.red.pawns[1] || gameState.players.red.pawns[0];
    if (!testPawn) return;
    const testStep = 18;
    const startCoord = getPawnGridCoord('red', 1, testStep);
    const homeCoord = HOME_SLOTS.red[1] || HOME_SLOTS.red[0];
    setActiveAngelFlight({
      id: `test-flight-${Date.now()}`,
      pawn: { ...testPawn, pathStep: testStep },
      fromPathStep: testStep,
      fromCoord: startCoord,
      toCoord: homeCoord,
      capturedByColor: 'blue',
      capturedByName: 'Player 1',
    });
  };

  const handleAngelFlightComplete = useCallback(() => {
    setActiveAngelFlight(null);
  }, []);

  // Back Navigation Handlers for App Level Screens and Modals
  useBackHandler(
    viewMode === 'matchmaking',
    () => {
      if (currentMatchConfig && currentMatchConfig.entryFee > 0) {
        setBalance((b) => Number((b + currentMatchConfig.entryFee).toFixed(2)));
      }
      setViewMode('lobby');
    },
    'view_matchmaking',
    'Matchmaking'
  );

  useBackHandler(
    viewMode === 'ludo_game' && !gameState.winner && !isMenuOpen && !exitConfirmationConfig,
    () => {
      navigationHistory.requestMatchLeaveConfirmation(() => {
        handleReturnToLobby();
      });
      return false;
    },
    'view_ludo_game',
    'Ludo Game'
  );

  useBackHandler(
    viewMode === 'snake_ludo' && !exitConfirmationConfig,
    () => {
      navigationHistory.requestMatchLeaveConfirmation(() => {
        handleReturnToLobby();
      });
      return false;
    },
    'view_snake_ludo',
    'Snake Ludo'
  );

  useBackHandler(
    viewMode === 'admin',
    () => {
      setViewMode('lobby');
      window.history.pushState({}, '', '/');
    },
    'view_admin',
    'Admin'
  );

  useBackHandler(
    isMenuOpen,
    () => {
      setIsMenuOpen(false);
    },
    'modal_game_settings',
    'Settings'
  );

  useBackHandler(
    Boolean(gameState.winner),
    () => {
      handleReturnToLobby();
    },
    'modal_victory',
    'Victory'
  );

  useBackHandler(
    showAuthModal && Boolean(currentUser),
    () => {
      setShowAuthModal(false);
    },
    'modal_auth',
    'Auth'
  );

  useBackHandler(
    Boolean(exitConfirmationConfig),
    () => {
      setExitConfirmationConfig(null);
    },
    'modal_match_exit_confirmation',
    'Exit Confirmation'
  );

  const sharedExitAndToastUI = (
    <>
      <MatchExitConfirmationModal
        isOpen={Boolean(exitConfirmationConfig)}
        title={exitConfirmationConfig?.title}
        message={exitConfirmationConfig?.message}
        confirmText={exitConfirmationConfig?.confirmText}
        cancelText={exitConfirmationConfig?.cancelText}
        onConfirm={() => {
          const cb = exitConfirmationConfig?.onConfirm;
          setExitConfirmationConfig(null);
          if (cb) cb();
        }}
        onCancel={() => {
          setExitConfirmationConfig(null);
        }}
      />
      <BackExitToast message={backToastMsg} />
    </>
  );

  // 0. ADMIN CONTROL PANEL VIEW
  if (viewMode === 'admin') {
    if (!adminToken) {
      return (
        <>
          <AdminLogin
            adminAlias={adminAlias}
            onLoginSuccess={(token, admin) => {
              setAdminToken(token);
              setAdminData(admin);
            }}
            onBackToGame={() => {
              setViewMode('lobby');
              window.history.pushState({}, '', '/');
            }}
          />
          {sharedExitAndToastUI}
        </>
      );
    }

    return (
      <>
        <AdminLayout
          token={adminToken}
          adminData={adminData}
          adminAlias={adminAlias}
          onLogout={() => {
            localStorage.removeItem('ludo_admin_token');
            sessionStorage.removeItem('ludo_admin_token');
            setAdminToken(null);
            setAdminData(null);
          }}
          onAdminAliasChange={(newAlias) => {
            setAdminAlias(newAlias);
            window.history.replaceState({}, '', `/${newAlias}`);
          }}
          onBackToGame={() => {
            setViewMode('lobby');
            window.history.pushState({}, '', '/');
          }}
        />
        {sharedExitAndToastUI}
      </>
    );
  }

  // 1. GAME LOBBY VIEW
  if (viewMode === 'lobby') {
    return (
      <>
        <GameLobby
          balance={balance}
          onAddFunds={handleUpdateBalance}
          onPlayLudo={() => {
            if (!currentUser) {
              setShowAuthModal(true);
              return;
            }
            SoundManager.play('click');
            setPlayerMode(4);
            setViewMode('ludo_game');
          }}
          onPlaySnakeLudo={() => {
            if (!currentUser) {
              setShowAuthModal(true);
              return;
            }
            SoundManager.play('click');
            setViewMode('snake_ludo');
          }}
          onStartOnlineMatch={(mode, fee, prize, gType, varN, pConfig, tId) => {
            if (!currentUser) {
              setShowAuthModal(true);
              return;
            }
            handleStartOnlineMatch(mode, fee, prize, gType, varN, pConfig, tId);
          }}
          onRefreshBalance={fetchRealWalletBalance}
          userId={currentUser?.id || 'user_guest_default'}
          userName={currentUser?.displayName || currentUser?.username || 'Player 1'}
          userAvatar={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80'}
          userEmail={currentUser?.email}
          onLogout={handleLogout}
          onAvatarUpdate={(newAvatarUrl) => {
            setCurrentUser((prev) => (prev ? { ...prev, avatarUrl: newAvatarUrl } : prev));
          }}
        />

        <AuthModal
          isOpen={showAuthModal || !currentUser}
          onClose={() => {
            if (currentUser) {
              setShowAuthModal(false);
            }
          }}
          onSuccess={handleAuthSuccess}
        />
        {sharedExitAndToastUI}
      </>
    );
  }

  // 2. LIVE ONLINE MATCHMAKING VIEW
  if (viewMode === 'matchmaking') {
    const p1Config = currentMatchConfig?.playersConfig?.[0];
    const userColor = (p1Config?.color || 'red') as PlayerColor;
    const userName = p1Config?.name || 'Player 1';
    const userAvatar = p1Config?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    return (
      <>
        <OnlineMatchmakingScreen
          playerCount={playerMode}
          entryFee={currentMatchConfig?.entryFee || 0}
          prizePool={currentMatchConfig?.prizePool || 0}
          userName={userName}
          userAvatar={userAvatar}
          userColor={userColor}
          customOpponents={currentMatchConfig?.playersConfig?.slice(1)}
          onCancel={() => {
            // Refund fee on cancel
            if (currentMatchConfig && currentMatchConfig.entryFee > 0) {
              setBalance((b) => Number((b + currentMatchConfig.entryFee).toFixed(2)));
            }
            setViewMode('lobby');
          }}
          onMatchComplete={handleMatchComplete}
        />
        {sharedExitAndToastUI}
      </>
    );
  }

  // 3. SNAKE LUDO MINI-GAME VIEW
  if (viewMode === 'snake_ludo') {
    return (
      <>
        <SnakeLudoGame
          onBackToLobby={() => {
            SoundManager.play('click');
            setViewMode('lobby');
          }}
          isMuted={gameState.isMuted}
          onToggleMute={handleToggleMute}
          entryFee={currentMatchConfig?.entryFee || 0}
          prizePool={currentMatchConfig?.prizePool || 0}
          userId={currentUser?.id || 'user_guest_default'}
          userName={humanPlayer?.name || currentUser?.displayName || currentUser?.username || 'Player 1'}
          userAvatar={humanPlayer?.avatarUrl || currentUser?.avatarUrl || ''}
          playerCount={Number(currentMatchConfig?.mode || playerMode || 2)}
          matchedOpponents={lastMatchedOpponents}
          tournamentId={currentMatchConfig?.tournamentId}
          onMatchWon={(prize) => {
            if (prize > 0) {
              setBalance((b) => Number((b + prize).toFixed(2)));
              fetchRealWalletBalance();
            }
          }}
        />
        {sharedExitAndToastUI}
      </>
    );
  }

  // 4. CLASSIC & MULTI-PLAYER LUDO BOARD VIEW (2P, 3P, 4P DYNAMIC)
  return (
    <BoardEnvironment>
      {/* 1. TOP HUD HEADER */}
      <TopBarHUD
        onOpenMenu={() => setIsMenuOpen(true)}
        isMuted={gameState.isMuted}
        onToggleMute={handleToggleMute}
        balance={balance}
        onBackToLobby={() => {
          navigationHistory.requestMatchLeaveConfirmation(() => {
            handleReturnToLobby();
          });
        }}
        gameType={currentMatchConfig?.gameType || 'supreme'}
        matchTimeLeft={matchTimeLeft}
        prizePool={currentMatchConfig?.prizePool || 0}
      />

      {/* 2. TOP PLAYERS PROFILE HUDs (Blue Top-Left, Red Top-Right) */}
      <div className="w-full flex items-center justify-between px-2 pt-1 pb-1 z-20">
        {activeColors.includes('blue') ? (
          <PlayerProfileHUD
            player={gameState.players.blue}
            isTurn={gameState.currentTurn === 'blue' && !steppingPawnId}
            position="top-left"
            onToggleMic={handleToggleMic}
            dice={gameState.dice}
            onRollDice={() => handleRollDice()}
            turnTimeLeft={turnTimeLeft}
            totalTurnTime={TURN_TIME_LIMIT}
            strikes={playerStrikes.blue}
            maxStrikes={MAX_STRIKES}
            scoreRank={playerRankMap.blue}
          />
        ) : (
          <div className="w-10" />
        )}
        {activeColors.includes('red') ? (
          <PlayerProfileHUD
            player={gameState.players.red}
            isTurn={gameState.currentTurn === 'red' && !steppingPawnId}
            position="top-right"
            onToggleMic={handleToggleMic}
            dice={gameState.dice}
            onRollDice={() => handleRollDice()}
            turnTimeLeft={turnTimeLeft}
            totalTurnTime={TURN_TIME_LIMIT}
            strikes={playerStrikes.red}
            maxStrikes={MAX_STRIKES}
            scoreRank={playerRankMap.red}
          />
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* 3. CENTER HERO LUDO BOARD & 3D DICE */}
      <div className="relative my-auto flex flex-col items-center justify-center w-full">
        {/* Floating Chat Bubbles */}
        <ChatBubbleOverlay messages={chatMessages} />

        {/* 3D Ludo Board Component - Dynamic Active Colors */}
        <LudoBoard
          pawns={allPawns}
          currentTurn={gameState.currentTurn}
          selectedPawnId={gameState.selectedPawnId}
          movablePawnIds={gameState.movablePawnIds}
          bouncingCellKey={bouncingCellKey}
          steppingPawnId={steppingPawnId}
          activeAngelFlight={activeAngelFlight}
          onAngelFlightComplete={handleAngelFlightComplete}
          onPawnClick={handlePawnClick}
          activeColors={activeColors}
        />

        {/* Optional 15x15 Coordinate Overlay for Debugging */}
        {isDebugGridVisible && (
          <div className="absolute inset-0 z-40 bg-black/80 p-2 text-[8px] font-mono text-cyan-300 grid grid-cols-15 grid-rows-15 pointer-events-none">
            {Array.from({ length: 225 }).map((_, i) => {
              const c = i % 15;
              const r = Math.floor(i / 15);
              return (
                <div key={`debug-cell-${c}-${r}`} className="border border-cyan-500/30 flex items-center justify-center">
                  {c},{r}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. BOTTOM PLAYERS PROFILE HUDs */}
      <div className="w-full flex items-center justify-between px-2 py-1 z-20">
        {/* Bottom Left Player 4 (Yellow) - Only visible if active */}
        {activeColors.includes('yellow') ? (
          <PlayerProfileHUD
            player={gameState.players.yellow}
            isTurn={gameState.currentTurn === 'yellow' && !steppingPawnId}
            position="bottom-left"
            onToggleMic={handleToggleMic}
            dice={gameState.dice}
            onRollDice={() => handleRollDice()}
            turnTimeLeft={turnTimeLeft}
            totalTurnTime={TURN_TIME_LIMIT}
            strikes={playerStrikes.yellow}
            maxStrikes={MAX_STRIKES}
            scoreRank={playerRankMap.yellow}
          />
        ) : (
          <div className="w-10" />
        )}

        {/* Bottom Right Player 3 (Green) - Only visible if active */}
        {activeColors.includes('green') ? (
          <PlayerProfileHUD
            player={gameState.players.green}
            isTurn={gameState.currentTurn === 'green' && !steppingPawnId}
            position="bottom-right"
            onToggleMic={handleToggleMic}
            dice={gameState.dice}
            onRollDice={() => handleRollDice()}
            turnTimeLeft={turnTimeLeft}
            totalTurnTime={TURN_TIME_LIMIT}
            strikes={playerStrikes.green}
            maxStrikes={MAX_STRIKES}
            scoreRank={playerRankMap.green}
          />
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* 5. BOTTOM CONTROLS & STATUS BANNER */}
      <BottomControls
        isMutedMic={humanPlayer?.isMuted ?? false}
        onToggleMic={() => handleToggleMic('p1')}
        onSendChat={handleSendChat}
        activeColor={gameState.currentTurn}
        statusText={gameState.statusText}
      />

      {/* 6. SETTINGS & MENU MODAL */}
      <GameSettingsModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        balance={balance}
        userName={humanPlayer?.name || 'Player 1'}
        userAvatar={humanPlayer?.avatarUrl || ''}
      />

      {/* 7. MATCH VICTORY & PRIZE MODAL */}
      <VictoryModal
        isOpen={gameState.winner !== null}
        winnerColor={gameState.winner}
        players={gameState.players}
        prizePool={currentMatchConfig?.prizePool || 0}
        entryFee={currentMatchConfig?.entryFee || 0}
        gameType={currentMatchConfig?.gameType || 'supreme'}
        onRematch={() => {
          if (currentMatchConfig) {
            handleStartOnlineMatch(
              currentMatchConfig.mode,
              currentMatchConfig.entryFee,
              currentMatchConfig.prizePool,
              currentMatchConfig.gameType || 'supreme'
            );
          } else {
            handleResetGame();
          }
        }}
        onBackToLobby={handleReturnToLobby}
      />

      {/* 8. EXIT CONFIRMATION MODAL & SYSTEM BACK TOAST */}
      {sharedExitAndToastUI}
    </BoardEnvironment>
  );
}
