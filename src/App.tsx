import React, { useState, useEffect, useCallback } from 'react';
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

type ViewMode = 'lobby' | 'ludo_game' | 'snake_ludo' | 'admin';

const INITIAL_PLAYERS: Record<PlayerColor, Player> = {
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
    isHuman: true,
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
    isHuman: true,
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
    isHuman: true,
    score: 2100,
    pawns: [
      { id: 'yellow-0', playerId: 'p4', color: 'yellow', pawnIndex: 0, state: 'home', pathStep: -1, gridX: 1.5, gridY: 10.5 },
      { id: 'yellow-1', playerId: 'p4', color: 'yellow', pawnIndex: 1, state: 'home', pathStep: -1, gridX: 3.5, gridY: 10.5 },
      { id: 'yellow-2', playerId: 'p4', color: 'yellow', pawnIndex: 2, state: 'home', pathStep: -1, gridX: 1.5, gridY: 12.5 },
      { id: 'yellow-3', playerId: 'p4', color: 'yellow', pawnIndex: 3, state: 'home', pathStep: -1, gridX: 3.5, gridY: 12.5 },
    ],
  },
};

const NEXT_TURN: Record<PlayerColor, PlayerColor> = {
  blue: 'red',
  red: 'green',
  green: 'yellow',
  yellow: 'blue',
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
  const [balance, setBalance] = useState<number>(0.50);
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('ludo_admin_token'));
  const [adminData, setAdminData] = useState<any | null>(null);
  const [adminAlias, setAdminAlias] = useState<string>('admin');

  // URL Path & Query Detection for Admin Portal (supports /admin, /custom, ?view=admin, etc.)
  useEffect(() => {
    // 1. Fetch current platform settings to know the current admin alias (e.g. 'admin' or 'custom')
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.adminUrls?.currentSlug) {
          const slug = data.adminUrls.currentSlug;
          setAdminAlias(slug);

          // Check if current URL matches /admin or /custom or currentSlug
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
        // Fallback check
        const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
        if (path === 'admin' || path === 'custom') {
          setViewMode('admin');
        }
      });

    // 2. Verify cached admin token if available
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
    players: INITIAL_PLAYERS,
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
  const [activeAngelFlight, setActiveAngelFlight] = useState<AngelFlightData | null>(null);

  // 30-Second Turn Countdown Timer Effect
  useEffect(() => {
    if (gameState.winner) return;

    // Reset turn timer to 30s whenever turn changes
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
  }, [gameState.currentTurn, gameState.winner]);

  // Flatten all pawns for rendering
  const allPawns = (Object.values(gameState.players) as Player[]).flatMap((p) => p.pawns);

  // Find legal movable pawns for the rolled dice value
  const getMovablePawns = useCallback(
    (color: PlayerColor, diceVal: number): string[] => {
      const playerPawns = gameState.players[color].pawns;
      const movables: string[] = [];

      playerPawns.forEach((p) => {
        if (p.pathStep === -1) {
          // Pawn in home base: requires rolling a 6
          if (diceVal === 6) movables.push(p.id);
        } else if (p.pathStep < 56) {
          // Pawn on path or home stretch: can move if doesn't overshoot goal (56)
          if (p.pathStep + diceVal <= 56) {
            movables.push(p.id);
          }
        }
      });

      return movables;
    },
    [gameState.players]
  );

  // Handle Dice Roll
  const handleRollDice = (forcedValue?: number) => {
    const rolledVal = forcedValue ?? Math.floor(Math.random() * 6) + 1;

    setGameState((prev) => {
      const activePlayerName = prev.players[prev.currentTurn].name;
      const movables = getMovablePawns(prev.currentTurn, rolledVal);

      // Check consecutive sixes rule
      if (rolledVal === 6) {
        const nextSixes = prev.consecutiveSixes + 1;

        if (nextSixes === 3) {
          // 3 CONSECUTIVE SIXES PENALTY! Turn forfeited to next player!
          const nextTurn = NEXT_TURN[prev.currentTurn];
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

        // 1st or 2nd six
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

      // Non-6 rolled (1, 2, 3, 4, 5) -> resets consecutive 6s
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

    // Reset turn timer to 30 for pawn selection or extra turn
    setTurnTimeLeft(30);

    // Auto-resolve when no legal moves are available
    setTimeout(() => {
      setGameState((prev) => {
        if (prev.movablePawnIds.length === 0 && prev.dice.hasRolled) {
          if (prev.dice.value === 6 && prev.consecutiveSixes < 3) {
            // Rolled a 6 with no legal moves -> gets extra turn automatically!
            SoundManager.play('turn');
            setTurnTimeLeft(30);
            return {
              ...prev,
              dice: { value: prev.dice.value, isRolling: false, hasRolled: false, canRoll: true },
              statusText: `${prev.players[prev.currentTurn].name} ROLLED 6 — BONUS TURN! ROLL AGAIN.`,
            };
          } else {
            // Non-6 with no legal moves -> pass turn to next player
            const nextTurn = NEXT_TURN[prev.currentTurn];
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

    if (isGoalArrival) {
      SoundManager.play('pawn-finish');
      confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
    } else {
      SoundManager.play('pawn-land');
    }

    setGameState((prev) => {
      const updatedPlayers = { ...prev.players };
      const curPlayer = { ...updatedPlayers[prev.currentTurn] };

      // Check Captures on target tile (if not in safe cell or home stretch)
      let didCapture = false;
      if (finalStep >= 0 && finalStep <= 50) {
        const targetCoord = getPawnGridCoord(prev.currentTurn, clickedPawn.pawnIndex, finalStep);
        if (!isSafeCell(targetCoord)) {
          (Object.keys(updatedPlayers) as PlayerColor[]).forEach((otherColor) => {
            if (otherColor !== prev.currentTurn) {
              const otherPlayer = { ...updatedPlayers[otherColor] };
              let captured = false;
              otherPlayer.pawns = otherPlayer.pawns.map((op) => {
                if (op.pathStep >= 0 && op.pathStep <= 50) {
                  const opCoord = getPawnGridCoord(otherColor, op.pawnIndex, op.pathStep);
                  if (opCoord.x === targetCoord.x && opCoord.y === targetCoord.y) {
                    didCapture = true;
                    captured = true;
                    // Trigger Angelic Flight Animation cell-by-cell back to Home Nest!
                    const homeCoord = HOME_SLOTS[otherColor][op.pawnIndex];
                    const capturedStep = op.pathStep;
                    setActiveAngelFlight({
                      id: `flight-${op.id}-${Date.now()}`,
                      pawn: { ...op },
                      fromPathStep: capturedStep,
                      fromCoord: { ...opCoord },
                      toCoord: { ...homeCoord },
                      capturedByColor: prev.currentTurn,
                      capturedByName: curPlayer.name,
                    });
                    return { ...op, pathStep: -1, state: 'home' as Pawn['state'] };
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

      // Extra Turn logic
      const getsExtraTurn = diceValue === 6 || didCapture || isGoalArrival;
      const nextTurnColor = getsExtraTurn ? prev.currentTurn : NEXT_TURN[prev.currentTurn];

      if (!getsExtraTurn) {
        SoundManager.play('turn');
      }

      const statusMsg = getsExtraTurn
        ? `${curPlayer.name} ${diceValue === 6 ? 'ROLLED 6' : didCapture ? 'CAPTURED PAWN' : 'REACHED HOME'} — BONUS TURN!`
        : `${updatedPlayers[nextTurnColor].name}'S TURN — ROLL THE DICE!`;

      // Reset turn timer to 30 for the bonus or next turn
      setTurnTimeLeft(30);

      return {
        ...prev,
        players: updatedPlayers,
        currentTurn: nextTurnColor,
        consecutiveSixes: getsExtraTurn && diceValue === 6 ? prev.consecutiveSixes : 0,
        dice: { value: prev.dice.value, isRolling: false, hasRolled: false, canRoll: true },
        movablePawnIds: [],
        selectedPawnId: null,
        statusText: statusMsg,
      };
    });

    setSteppingPawnId(null);
    setTimeout(() => setBouncingCellKey(null), 350);
  };

  // Move Pawn Action (Animated Cell-by-Cell Hop with Jelly Cell Landing Bounces)
  const handlePawnClick = (clickedPawn: Pawn) => {
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

    // Lock selections immediately
    setGameState((prev) => ({
      ...prev,
      movablePawnIds: [],
      selectedPawnId: clickedPawn.id,
    }));

    let stepCount = 0;
    const stepsToPerform = startStep === -1 ? 1 : diceValue;
    const STEP_DURATION_MS = 600;

    const doStep = () => {
      stepCount++;
      const currentStep = startStep === -1 ? 0 : startStep + stepCount;

      // 1. Begin pawn movement to target step cell
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

      // 2. Trigger landing sound and cell jelly bounce right as pawn impacts target cell
      setTimeout(() => {
        SoundManager.play('pawn-step');

        const coord = getPawnGridCoord(color, pawnIndex, currentStep);
        const cellKey = `${Math.round(coord.x)}-${Math.round(coord.y)}`;
        setBouncingCellKey(cellKey);
      }, 420);

      // 3. Queue next step or finalize movement after landing
      if (stepCount < stepsToPerform) {
        setTimeout(doStep, STEP_DURATION_MS);
      } else {
        setTimeout(() => {
          finalizeMove(clickedPawn, targetStep, diceValue);
        }, STEP_DURATION_MS + 250);
      }
    };

    doStep();
  };

  // Bot Automation & Timer Expiration Effect
  useEffect(() => {
    const curPlayer = gameState.players[gameState.currentTurn];
    const isBot = !curPlayer.isHuman || gameState.isAutoPlay;
    const isTimerExpired = turnTimeLeft === 0;

    if (gameState.winner || steppingPawnId) return;

    // Handle Timer Expiration (30s) -> FORFEIT TURN IMMEDIATELY
    if (isTimerExpired) {
      const nextTurn = NEXT_TURN[gameState.currentTurn];
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
          handleRollDice();
        }, 1100);
        return () => clearTimeout(timer);
      }

      if (gameState.dice.hasRolled && gameState.movablePawnIds.length > 0) {
        const timer = setTimeout(() => {
          const movables = gameState.movablePawnIds;
          const randomPawnId = movables[Math.floor(Math.random() * movables.length)];
          const chosenPawn = curPlayer.pawns.find((p) => p.id === randomPawnId);
          if (chosenPawn) {
            handlePawnClick(chosenPawn);
          }
        }, 1100);
        return () => clearTimeout(timer);
      }
    }
  }, [
    gameState.currentTurn,
    gameState.dice.canRoll,
    gameState.dice.hasRolled,
    gameState.isAutoPlay,
    steppingPawnId,
    turnTimeLeft,
    gameState.winner,
  ]);

  // Handle Sending Chat / Emoji
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

  // Toggle Mute
  const handleToggleMute = () => {
    const newMuted = !gameState.isMuted;
    SoundManager.setMuted(newMuted);
    setGameState((prev) => ({ ...prev, isMuted: newMuted }));
  };

  // Toggle Mic
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

  // Reset Game
  const handleResetGame = () => {
    setGameState({
      players: INITIAL_PLAYERS,
      currentTurn: 'blue',
      dice: { value: 6, isRolling: false, hasRolled: false, canRoll: true },
      selectedPawnId: null,
      movablePawnIds: [],
      statusText: "PLAYER 1'S TURN — ROLL THE DICE!",
      winner: null,
      isAutoPlay: false,
      isMuted: gameState.isMuted,
      theme: 'dubai_sunset',
    });
    setChatMessages([]);
  };

  // Test Angelic Flight Trigger
  const handleTestAngelFlight = () => {
    const testPawn = gameState.players.red.pawns[1] || gameState.players.red.pawns[0];
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
        onAddFunds={(amt) => setBalance((prev) => prev + amt)}
        onPlayLudo={() => {
          SoundManager.play('click');
          setViewMode('ludo_game');
        }}
        onPlaySnakeLudo={() => {
          SoundManager.play('click');
          setViewMode('snake_ludo');
        }}
      />
    );
  }

  // 2. SNAKE LUDO MINI-GAME VIEW
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

  // 3. CLASSIC 3D LUDO SUPREME VIEW
  return (
    <BoardEnvironment>
      {/* 1. TOP HUD HEADER */}
      <TopBarHUD
        onOpenMenu={() => setIsMenuOpen(true)}
        isMuted={gameState.isMuted}
        onToggleMute={handleToggleMute}
        gemsCount={1200}
        balance={balance}
        onBackToLobby={() => setViewMode('lobby')}
      />

      {/* 2. TOP PLAYERS PROFILE HUDs (Top Left & Top Right) */}
      <div className="w-full flex items-center justify-between px-2 pt-1 pb-1 z-20">
        <PlayerProfileHUD
          player={gameState.players.blue}
          isTurn={gameState.currentTurn === 'blue' && !steppingPawnId}
          position="top-left"
          onToggleMic={handleToggleMic}
          dice={gameState.dice}
          onRollDice={() => handleRollDice()}
          turnTimeLeft={turnTimeLeft}
        />
        <PlayerProfileHUD
          player={gameState.players.red}
          isTurn={gameState.currentTurn === 'red' && !steppingPawnId}
          position="top-right"
          onToggleMic={handleToggleMic}
          dice={gameState.dice}
          onRollDice={() => handleRollDice()}
          turnTimeLeft={turnTimeLeft}
        />
      </div>

      {/* 3. CENTER HERO LUDO BOARD & 3D DICE */}
      <div className="relative my-auto flex flex-col items-center justify-center w-full">
        {/* Floating Chat Bubbles */}
        <ChatBubbleOverlay messages={chatMessages} />

        {/* 3D Ludo Board Component */}
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
        {/* Bottom Left Player 4 (Yellow) */}
        <PlayerProfileHUD
          player={gameState.players.yellow}
          isTurn={gameState.currentTurn === 'yellow' && !steppingPawnId}
          position="bottom-left"
          onToggleMic={handleToggleMic}
          dice={gameState.dice}
          onRollDice={() => handleRollDice()}
          turnTimeLeft={turnTimeLeft}
        />

        {/* Bottom Right Player 3 (Green) */}
        <PlayerProfileHUD
          player={gameState.players.green}
          isTurn={gameState.currentTurn === 'green' && !steppingPawnId}
          position="bottom-right"
          onToggleMic={handleToggleMic}
          dice={gameState.dice}
          onRollDice={() => handleRollDice()}
          turnTimeLeft={turnTimeLeft}
        />
      </div>

      {/* 5. BOTTOM CONTROLS & STATUS BANNER */}
      <BottomControls
        isMutedMic={gameState.players.blue.isMuted}
        onToggleMic={() => handleToggleMic('p1')}
        onSendChat={handleSendChat}
        activeColor={gameState.currentTurn}
        statusText={gameState.statusText}
      />

      {/* 6. DEBUG & MENU MODAL */}
      <DebugOverlay
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onForceDiceRoll={(val) => handleRollDice(val)}
        onResetGame={handleResetGame}
        isDebugGridVisible={isDebugGridVisible}
        onToggleDebugGrid={() => setIsDebugGridVisible(!isDebugGridVisible)}
        isAutoPlay={gameState.isAutoPlay}
        onToggleAutoPlay={() =>
          setGameState((prev) => ({ ...prev, isAutoPlay: !prev.isAutoPlay }))
        }
        onTestAngelFlight={handleTestAngelFlight}
      />
    </BoardEnvironment>
  );
}
