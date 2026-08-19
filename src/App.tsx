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
import { PlayerModeOption } from './components/lobby/LudoModeSelectorModal';
import { OnlineMatchmakingScreen, MatchedOpponent } from './components/lobby/OnlineMatchmakingScreen';
import { VictoryModal } from './components/ludo/effects/VictoryModal';
import { GameSettingsModal } from './components/lobby/GameSettingsModal';

type ViewMode = 'lobby' | 'ludo_game' | 'snake_ludo' | 'admin' | 'matchmaking';

interface MatchConfig {
  mode: PlayerModeOption;
  entryFee: number;
  prizePool: number;
  gameType?: 'classic' | 'supreme';
}

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
    name: 'Player 2',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
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
    name: 'Player 3',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
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
    name: 'Player 4',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
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

  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('evm_testnet_user_balance');
    return saved ? parseFloat(saved) : 0.0;
  });

  const handleUpdateBalance = useCallback((amountChange: number) => {
    setBalance((prev) => {
      const next = Math.max(0, prev + amountChange);
      localStorage.setItem('evm_testnet_user_balance', next.toString());
      return next;
    });
  }, []);
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('ludo_admin_token'));
  const [adminData, setAdminData] = useState<any | null>(null);
  const [adminAlias, setAdminAlias] = useState<string>('admin');

  // Matchmaking & Dynamic Player Mode State
  const [playerMode, setPlayerMode] = useState<PlayerModeOption>(4);
  const [currentMatchConfig, setCurrentMatchConfig] = useState<MatchConfig | null>(null);

  const activeColors: PlayerColor[] =
    playerMode === 2
      ? ['blue', 'green']
      : playerMode === 3
      ? ['blue', 'red', 'green']
      : ['blue', 'red', 'green', 'yellow'];

  // URL Path & Query Detection for Admin Portal
  useEffect(() => {
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

    const cachedToken = localStorage.getItem('ludo_admin_token');
    if (cachedToken) {
      fetch('/api/admin/auth/me', {
        headers: { Authorization: `Bearer ${cachedToken}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Invalid token');
        })
        .then((data) => {
          setAdminData(data.admin);
        })
        .catch(() => {
          localStorage.removeItem('ludo_admin_token');
          setAdminToken(null);
        });
    }

    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (path === 'admin' || path === 'custom' || path === adminAlias) {
        setViewMode('admin');
      } else if (path === '') {
        setViewMode('lobby');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [adminAlias]);

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

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDebugGridVisible, setIsDebugGridVisible] = useState(false);
  const [steppingPawnId, setSteppingPawnId] = useState<string | null>(null);
  const [bouncingCellKey, setBouncingCellKey] = useState<string | null>(null);
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(30);
  const [matchTimeLeft, setMatchTimeLeft] = useState<number>(180); // 2 min 60 sec (180s)
  const [activeAngelFlight, setActiveAngelFlight] = useState<AngelFlightData | null>(null);

  // Keep mutable refs for interval access without re-triggering timer effects
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const currentMatchConfigRef = useRef(currentMatchConfig);
  currentMatchConfigRef.current = currentMatchConfig;
  const activeColorsRef = useRef(activeColors);
  activeColorsRef.current = activeColors;

  // 30-Second Turn Countdown Timer Effect (Strictly active only during ludo_game mode)
  useEffect(() => {
    if (viewMode !== 'ludo_game' || Boolean(gameState.winner)) return;

    setTurnTimeLeft(30);

    const timerInterval = setInterval(() => {
      setTurnTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [viewMode, gameState.currentTurn, Boolean(gameState.winner)]);

  // 2 Minutes 60 Seconds (180s) Supreme Match Countdown Timer Effect (Continuously running)
  useEffect(() => {
    if (viewMode !== 'ludo_game' || Boolean(gameState.winner) || currentMatchConfig?.gameType === 'classic') return;

    const matchInterval = setInterval(() => {
      setMatchTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer finished -> Calculate top scorer using current refs
          const gs = gameStateRef.current;
          const cfg = currentMatchConfigRef.current;
          const cols = activeColorsRef.current;
          const activeList = cols.map((c) => gs.players[c]).filter(Boolean);
          const sorted = [...activeList].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
          const topPlayer = sorted[0];

          if (topPlayer) {
            SoundManager.play('pawn-finish');
            confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });

            if (topPlayer.isHuman && cfg && cfg.prizePool > 0) {
              setBalance((b) => Number((b + cfg.prizePool).toFixed(2)));
            }

            setGameState((g) => ({
              ...g,
              winner: topPlayer.color,
              statusText: `⏱️ TIME OVER! ${topPlayer.name.toUpperCase()} WINS WITH ${topPlayer.score ?? 0} PTS!`,
            }));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(matchInterval);
  }, [viewMode, Boolean(gameState.winner), currentMatchConfig?.gameType]);

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
  const handleStartOnlineMatch = (
    mode: PlayerModeOption,
    entryFee: number,
    prizePool: number,
    gameType: 'classic' | 'supreme' = 'supreme'
  ) => {
    if (entryFee > 0) {
      setBalance((b) => Math.max(0, Number((b - entryFee).toFixed(2))));
    }
    setPlayerMode(mode);
    setCurrentMatchConfig({ mode, entryFee, prizePool, gameType });
    setViewMode('matchmaking');
  };

  // Match Complete -> Prepare Board for 2P, 3P, or 4P
  const handleMatchComplete = (matchedOpponents: MatchedOpponent[]) => {
    const isSupreme = currentMatchConfig?.gameType !== 'classic';
    const updatedPlayers: Record<PlayerColor, Player> = { ...DEFAULT_PLAYERS };

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

    // Player 1 (Blue - Human)
    updatedPlayers.blue = {
      ...DEFAULT_PLAYERS.blue,
      isActive: true,
      isHuman: true,
      score: 0,
      pawns: createPawnsForColor('blue', 'p1'),
    };

    // Opponents configuration based on player count
    if (playerMode === 2) {
      // 2 Players: Blue (Top-Left) vs Green (Bottom-Right, Front Opposite Corner)
      updatedPlayers.red = { ...DEFAULT_PLAYERS.red, isActive: false, pawns: [] };
      updatedPlayers.yellow = { ...DEFAULT_PLAYERS.yellow, isActive: false, pawns: [] };
      if (matchedOpponents[0]) {
        updatedPlayers.green = {
          ...DEFAULT_PLAYERS.green,
          name: matchedOpponents[0].name,
          avatarUrl: matchedOpponents[0].avatarUrl,
          isActive: true,
          isHuman: false,
          score: 0,
          pawns: createPawnsForColor('green', 'p2'),
        };
      } else {
        updatedPlayers.green = { ...DEFAULT_PLAYERS.green, isActive: false, pawns: [] };
      }
    } else if (playerMode === 3) {
      // 3 Players: Blue, Red, Green
      updatedPlayers.yellow = { ...DEFAULT_PLAYERS.yellow, isActive: false, pawns: [] };
      if (matchedOpponents[0]) {
        updatedPlayers.red = {
          ...DEFAULT_PLAYERS.red,
          name: matchedOpponents[0].name,
          avatarUrl: matchedOpponents[0].avatarUrl,
          isActive: true,
          isHuman: false,
          score: 0,
          pawns: createPawnsForColor('red', 'p2'),
        };
      } else {
        updatedPlayers.red = { ...DEFAULT_PLAYERS.red, isActive: false, pawns: [] };
      }
      if (matchedOpponents[1]) {
        updatedPlayers.green = {
          ...DEFAULT_PLAYERS.green,
          name: matchedOpponents[1].name,
          avatarUrl: matchedOpponents[1].avatarUrl,
          isActive: true,
          isHuman: false,
          score: 0,
          pawns: createPawnsForColor('green', 'p3'),
        };
      } else {
        updatedPlayers.green = { ...DEFAULT_PLAYERS.green, isActive: false, pawns: [] };
      }
    } else {
      // 4 Players: Blue, Red, Green, Yellow
      if (matchedOpponents[0]) {
        updatedPlayers.red = {
          ...DEFAULT_PLAYERS.red,
          name: matchedOpponents[0].name,
          avatarUrl: matchedOpponents[0].avatarUrl,
          isActive: true,
          isHuman: false,
          score: 0,
          pawns: createPawnsForColor('red', 'p2'),
        };
      } else {
        updatedPlayers.red = { ...DEFAULT_PLAYERS.red, isActive: false, pawns: [] };
      }
      if (matchedOpponents[1]) {
        updatedPlayers.green = {
          ...DEFAULT_PLAYERS.green,
          name: matchedOpponents[1].name,
          avatarUrl: matchedOpponents[1].avatarUrl,
          isActive: true,
          isHuman: false,
          score: 0,
          pawns: createPawnsForColor('green', 'p3'),
        };
      } else {
        updatedPlayers.green = { ...DEFAULT_PLAYERS.green, isActive: false, pawns: [] };
      }
      if (matchedOpponents[2]) {
        updatedPlayers.yellow = {
          ...DEFAULT_PLAYERS.yellow,
          name: matchedOpponents[2].name,
          avatarUrl: matchedOpponents[2].avatarUrl,
          isActive: true,
          isHuman: false,
          score: 0,
          pawns: createPawnsForColor('yellow', 'p4'),
        };
      } else {
        updatedPlayers.yellow = { ...DEFAULT_PLAYERS.yellow, isActive: false, pawns: [] };
      }
    }

    setGameState({
      players: updatedPlayers,
      currentTurn: 'blue',
      dice: { value: 6, isRolling: false, hasRolled: false, canRoll: true },
      selectedPawnId: null,
      movablePawnIds: [],
      statusText: isSupreme
        ? "⚡ LUDO SUPREME SPEED MATCH! ALL PAWNS OPEN — ROLL ANY NUMBER TO MOVE!"
        : "PLAYER 1'S TURN — ROLL THE DICE!",
      winner: null,
      isAutoPlay: false,
      isMuted: false,
      theme: 'dubai_sunset',
      consecutiveSixes: 0,
      gameType: currentMatchConfig?.gameType || 'supreme',
      homesCount: { blue: 0, red: 0, green: 0, yellow: 0 },
    });

    setMatchTimeLeft(180);
    setChatMessages([]);
    setViewMode('ludo_game');
  };

  // Handle Dice Roll
  const handleRollDice = (forcedValue?: number) => {
    if (viewMode !== 'ludo_game') return;
    const rolledVal = forcedValue ?? Math.floor(Math.random() * 6) + 1;

    setGameState((prev) => {
      const activePlayerName = prev.players[prev.currentTurn].name;
      const movables = getMovablePawns(prev.currentTurn, rolledVal);

      // Check consecutive sixes rule
      if (rolledVal === 6) {
        const nextSixes = prev.consecutiveSixes + 1;

        if (nextSixes === 3) {
          const nextTurn = getNextTurnColor(prev.currentTurn, activeColors);
          SoundManager.play('turn');
          return {
            ...prev,
            currentTurn: nextTurn,
            consecutiveSixes: 0,
            dice: { value: 6, isRolling: false, hasRolled: false, canRoll: true },
            movablePawnIds: [],
            statusText: `${activePlayerName} ROLLED 3 SIXES IN A ROW! TURN FORFEITED.`,
          };
        }

        let statusMsg = `${activePlayerName} ROLLED A 6!`;
        if (movables.length === 0) {
          statusMsg += ' NO LEGAL MOVES. BONUS TURN GRANTED!';
        } else {
          statusMsg += ' SELECT A PAWN TO MOVE.';
        }

        return {
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
        };
      }

      let statusMsg = `${activePlayerName} ROLLED A ${rolledVal}!`;
      if (movables.length === 0) {
        statusMsg += ' NO LEGAL MOVES.';
      } else {
        statusMsg += ' SELECT A PAWN TO MOVE.';
      }

      return {
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
      };
    });

    // Auto-resolve when no legal moves are available
    setTimeout(() => {
      setGameState((prev) => {
        if (prev.movablePawnIds.length === 0 && prev.dice.hasRolled) {
          if (prev.dice.value === 6 && prev.consecutiveSixes < 3) {
            SoundManager.play('turn');
            setTurnTimeLeft(30);
            return {
              ...prev,
              dice: { value: prev.dice.value, isRolling: false, hasRolled: false, canRoll: true },
              statusText: `${prev.players[prev.currentTurn].name} ROLLED 6 — BONUS TURN! ROLL AGAIN.`,
            };
          } else {
            const nextTurn = getNextTurnColor(prev.currentTurn, activeColors);
            SoundManager.play('turn');
            setTurnTimeLeft(30);
            return {
              ...prev,
              currentTurn: nextTurn,
              consecutiveSixes: 0,
              dice: { value: prev.dice.value, isRolling: false, hasRolled: false, canRoll: true },
              statusText: `${prev.players[nextTurn].name}'S TURN — ROLL THE DICE!`,
            };
          }
        }
        return prev;
      });
    }, 1200);
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
        SoundManager.play('pawn-finish');
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
        if (curPlayer.isHuman && currentMatchConfig && currentMatchConfig.prizePool > 0) {
          setBalance((b) => Number((b + currentMatchConfig.prizePool).toFixed(2)));
        }
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

      setTurnTimeLeft(30);

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

    setSteppingPawnId(null);
    setTimeout(() => setBouncingCellKey(null), 300);
  };

  // Move Pawn Action (Animated Cell-by-Cell Hop)
  const handlePawnClick = (clickedPawn: Pawn) => {
    if (viewMode !== 'ludo_game') return;
    if (steppingPawnId) return;
    if (clickedPawn.color !== gameState.currentTurn) return;
    if (!gameState.dice.hasRolled) return;
    if (!gameState.movablePawnIds.includes(clickedPawn.id)) return;

    setSteppingPawnId(clickedPawn.id);

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
    const STEP_DURATION_MS = 320; // Snappy, responsive hops for speed gameplay

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

      setTimeout(() => {
        SoundManager.play('pawn-step');
        const coord = getPawnGridCoord(color, pawnIndex, currentStep);
        const cellKey = `${Math.round(coord.x)}-${Math.round(coord.y)}`;
        setBouncingCellKey(cellKey);
      }, 180);

      if (stepCount < stepsToPerform) {
        setTimeout(doStep, STEP_DURATION_MS);
      } else {
        setTimeout(() => {
          finalizeMove(clickedPawn, targetStep, diceValue);
        }, STEP_DURATION_MS + 180);
      }
    };

    doStep();
  };

  // Bot Automation & Timer Expiration Effect (Strictly active only in ludo_game view)
  useEffect(() => {
    if (viewMode !== 'ludo_game') return;

    const curPlayer = gameState.players[gameState.currentTurn];
    if (!curPlayer || !curPlayer.isActive) return;

    const isBot = !curPlayer.isHuman || gameState.isAutoPlay;
    const isTimerExpired = turnTimeLeft === 0;

    if (gameState.winner || steppingPawnId) return;

    // Handle Timer Expiration -> Forfeit turn
    if (isTimerExpired) {
      const nextTurn = getNextTurnColor(gameState.currentTurn, activeColors);
      SoundManager.play('turn');
      setGameState((prev) => ({
        ...prev,
        currentTurn: nextTurn,
        consecutiveSixes: 0,
        dice: { value: prev.dice.value, isRolling: false, hasRolled: false, canRoll: true },
        movablePawnIds: [],
        selectedPawnId: null,
        statusText: `${curPlayer.name}'S TIME EXPIRED! TURN FORFEITED.`,
      }));
      setTurnTimeLeft(30);
      return;
    }

    // Handle Normal Bot Turns
    if (isBot) {
      if (gameState.dice.canRoll && !gameState.dice.isRolling) {
        const timer = setTimeout(() => {
          if (viewMode === 'ludo_game') {
            handleRollDice();
          }
        }, 1100);
        return () => clearTimeout(timer);
      }

      if (gameState.dice.hasRolled && gameState.movablePawnIds.length > 0) {
        const timer = setTimeout(() => {
          if (viewMode === 'ludo_game') {
            const movables = gameState.movablePawnIds;
            const randomPawnId = movables[Math.floor(Math.random() * movables.length)];
            const chosenPawn = curPlayer.pawns.find((p) => p.id === randomPawnId);
            if (chosenPawn) {
              handlePawnClick(chosenPawn);
            }
          }
        }, 1100);
        return () => clearTimeout(timer);
      }
    }
  }, [
    viewMode,
    gameState.currentTurn,
    gameState.dice.canRoll,
    gameState.dice.hasRolled,
    gameState.isAutoPlay,
    steppingPawnId,
    turnTimeLeft,
    gameState.winner,
    activeColors,
  ]);

  // Chat
  const handleSendChat = (text: string, isEmoji = false) => {
    const newMessage: ChatMessage = {
      id: `chat-${Date.now()}`,
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
    setTurnTimeLeft(30);
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

  // 0. ADMIN CONTROL PANEL VIEW
  if (viewMode === 'admin') {
    if (!adminToken) {
      return (
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
      );
    }

    return (
      <AdminLayout
        token={adminToken}
        adminData={adminData}
        adminAlias={adminAlias}
        onLogout={() => {
          localStorage.removeItem('ludo_admin_token');
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
    );
  }

  // 1. GAME LOBBY VIEW
  if (viewMode === 'lobby') {
    return (
      <GameLobby
        balance={balance}
        onAddFunds={handleUpdateBalance}
        onPlayLudo={() => {
          SoundManager.play('click');
          setPlayerMode(4);
          setViewMode('ludo_game');
        }}
        onPlaySnakeLudo={() => {
          SoundManager.play('click');
          setViewMode('snake_ludo');
        }}
        onStartOnlineMatch={handleStartOnlineMatch}
      />
    );
  }

  // 2. LIVE ONLINE MATCHMAKING VIEW
  if (viewMode === 'matchmaking') {
    return (
      <OnlineMatchmakingScreen
        playerCount={playerMode}
        entryFee={currentMatchConfig?.entryFee || 0}
        prizePool={currentMatchConfig?.prizePool || 0}
        userName={gameState.players.blue.name}
        userAvatar={gameState.players.blue.avatarUrl}
        onCancel={() => {
          // Refund fee on cancel
          if (currentMatchConfig && currentMatchConfig.entryFee > 0) {
            setBalance((b) => Number((b + currentMatchConfig.entryFee).toFixed(2)));
          }
          setViewMode('lobby');
        }}
        onMatchComplete={handleMatchComplete}
      />
    );
  }

  // 3. SNAKE LUDO MINI-GAME VIEW
  if (viewMode === 'snake_ludo') {
    return (
      <SnakeLudoGame
        onBackToLobby={() => {
          SoundManager.play('click');
          setViewMode('lobby');
        }}
        isMuted={gameState.isMuted}
        onToggleMute={handleToggleMute}
      />
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
        gemsCount={1200}
        balance={balance}
        onBackToLobby={handleReturnToLobby}
        gameType={currentMatchConfig?.gameType || 'supreme'}
        matchTimeLeft={matchTimeLeft}
        prizePool={currentMatchConfig?.prizePool || 0}
      />

      {/* 2. TOP PLAYERS PROFILE HUDs (Blue Top-Left, Red Top-Right) */}
      <div className="w-full flex items-center justify-between px-2 pt-1 pb-1 z-20">
        <PlayerProfileHUD
          player={gameState.players.blue}
          isTurn={gameState.currentTurn === 'blue' && !steppingPawnId}
          position="top-left"
          onToggleMic={handleToggleMic}
          dice={gameState.dice}
          onRollDice={() => handleRollDice()}
          turnTimeLeft={turnTimeLeft}
          scoreRank={playerRankMap.blue}
        />
        {activeColors.includes('red') ? (
          <PlayerProfileHUD
            player={gameState.players.red}
            isTurn={gameState.currentTurn === 'red' && !steppingPawnId}
            position="top-right"
            onToggleMic={handleToggleMic}
            dice={gameState.dice}
            onRollDice={() => handleRollDice()}
            turnTimeLeft={turnTimeLeft}
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
            {Array.from({ length: 15 }).map((_, r) =>
              Array.from({ length: 15 }).map((_, c) => (
                <div key={`${c}-${r}`} className="border border-cyan-500/30 flex items-center justify-center">
                  {c},{r}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 4. BOTTOM PLAYERS PROFILE HUDs */}
      <div className="w-full flex items-center justify-between px-2 py-1 z-20">
        {/* Bottom Left Player 4 (Yellow) - Only visible if 4P mode */}
        {activeColors.includes('yellow') ? (
          <PlayerProfileHUD
            player={gameState.players.yellow}
            isTurn={gameState.currentTurn === 'yellow' && !steppingPawnId}
            position="bottom-left"
            onToggleMic={handleToggleMic}
            dice={gameState.dice}
            onRollDice={() => handleRollDice()}
            turnTimeLeft={turnTimeLeft}
            scoreRank={playerRankMap.yellow}
          />
        ) : (
          <div className="w-10" />
        )}

        {/* Bottom Right Player 3 (Green) - Visible in 3P and 4P modes */}
        {activeColors.includes('green') ? (
          <PlayerProfileHUD
            player={gameState.players.green}
            isTurn={gameState.currentTurn === 'green' && !steppingPawnId}
            position="bottom-right"
            onToggleMic={handleToggleMic}
            dice={gameState.dice}
            onRollDice={() => handleRollDice()}
            turnTimeLeft={turnTimeLeft}
            scoreRank={playerRankMap.green}
          />
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* 5. BOTTOM CONTROLS & STATUS BANNER */}
      <BottomControls
        isMutedMic={gameState.players.blue.isMuted}
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
        userName={gameState.players.blue.name}
        userAvatar={gameState.players.blue.avatarUrl}
      />

      {/* 7. MATCH VICTORY & PRIZE MODAL */}
      <VictoryModal
        isOpen={gameState.winner !== null}
        winnerColor={gameState.winner}
        players={gameState.players}
        prizePool={currentMatchConfig?.prizePool || 0}
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
    </BoardEnvironment>
  );
}
