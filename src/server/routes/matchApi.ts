import { Router, Request, Response } from 'express';
import { GameMode, ALL_MATCH_POOLS } from '../game/matchConfig';
import { RoomManager } from '../game/roomManager';
import { RoomJoinService } from '../game/roomJoinService';
import { ReconnectService } from '../game/reconnectService';
import { LudoSupremeEngine } from '../game/ludoSupremeEngine';
import { AuthoritativeLudoEngine } from '../game/authoritativeEngine';
import { GamePersistenceService } from '../game/persistenceService';
import { MatchSettlementService } from '../wallet/matchSettlementService';
import { LedgerService } from '../wallet/ledgerService';
import { LedgerMath } from '../wallet/ledgerMath';
import { rateLimiter } from '../redis/rateLimit';
import { getDbPool, isPostgresConfigured } from '../db/client';
import { TournamentService } from '../services/tournamentService';
import { SettingsStore } from '../storage/settingsStore';
import { Logger } from '../config/env';

export const matchApiRouter = Router();

// -----------------------------------------------------------------------------
// 1. PUBLIC LOBBY ROOMS LISTING
// -----------------------------------------------------------------------------

// GET /api/lobby/ludo-arena
matchApiRouter.get('/api/lobby/ludo-arena', async (req: Request, res: Response) => {
  try {
    const playerCount = req.query.playerCount ? parseInt(req.query.playerCount as string, 10) : undefined;
    const entryFee = req.query.entryFee ? parseFloat(req.query.entryFee as string) : undefined;

    const rooms = await RoomManager.getJoinableRooms({
      gameMode: GameMode.ONLINE_ARENA,
      playerCount,
      entryFee,
    });

    res.json({
      gameMode: GameMode.ONLINE_ARENA,
      totalJoinableRooms: rooms.length,
      rooms,
    });
  } catch (err: any) {
    Logger.error('Failed to get Arena lobby rooms', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// GET /api/lobby/ludo-supreme
matchApiRouter.get('/api/lobby/ludo-supreme', async (req: Request, res: Response) => {
  try {
    const playerCount = req.query.playerCount ? parseInt(req.query.playerCount as string, 10) : undefined;
    const entryFee = req.query.entryFee ? parseFloat(req.query.entryFee as string) : undefined;

    const rooms = await RoomManager.getJoinableRooms({
      gameMode: GameMode.LUDO_SUPREME,
      playerCount,
      entryFee,
    });

    res.json({
      gameMode: GameMode.LUDO_SUPREME,
      totalJoinableRooms: rooms.length,
      rooms,
    });
  } catch (err: any) {
    Logger.error('Failed to get Supreme lobby rooms', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// GET /api/matches/pools
matchApiRouter.get('/api/matches/pools', (req: Request, res: Response) => {
  res.json({
    success: true,
    pools: ALL_MATCH_POOLS,
  });
});

// GET /api/matches
matchApiRouter.get('/api/matches', async (req: Request, res: Response) => {
  try {
    const gameMode = req.query.mode as GameMode | undefined;
    const playerCount = req.query.playerCount ? parseInt(req.query.playerCount as string, 10) : undefined;
    const entryFee = req.query.entryFee ? parseFloat(req.query.entryFee as string) : undefined;

    const rooms = await RoomManager.getJoinableRooms({
      gameMode,
      playerCount,
      entryFee,
    });

    res.json({ success: true, count: rooms.length, matches: rooms });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 2. ATOMIC ROOM JOINING & LEAVING
// -----------------------------------------------------------------------------

// POST /api/matches/join (Rate limited per IP/user)
matchApiRouter.post(
  '/api/matches/join',
  rateLimiter({ maxRequests: 30, windowSeconds: 60 }),
  async (req: Request, res: Response) => {
    try {
      const { userId, username, gameMode, playerCount, entryFee, roomId } = req.body;

      if (!userId || !gameMode || !playerCount || entryFee === undefined) {
        res.status(400).json({
          error: 'Missing required parameters: userId, gameMode, playerCount, entryFee',
        });
        return;
      }

      const joinResult = await RoomJoinService.joinMatch({
        userId,
        username: username || `User_${userId.slice(0, 5)}`,
        gameMode: gameMode as GameMode,
        playerCount: parseInt(playerCount, 10) as any,
        entryFee,
        roomId,
      });

      res.status(200).json(joinResult);
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to join match';
      const isInsufficient = errMsg.toLowerCase().includes('insufficient');
      if (isInsufficient) {
        Logger.warn(`Match join rejected: ${errMsg}`);
        res.status(400).json({
          success: false,
          code: 'INSUFFICIENT_BALANCE',
          error: errMsg,
        });
        return;
      }

      Logger.warn(`Match join error: ${errMsg}`);
      res.status(400).json({
        success: false,
        error: errMsg,
      });
    }
  }
);

// POST /api/matches/lock-entry (Pre-locks entry fee for real cash matches)
matchApiRouter.post('/api/matches/lock-entry', async (req: Request, res: Response) => {
  try {
    const { userId, username, matchId, gameMode, playerCount, entryFee, prizePool } = req.body;
    if (!userId) {
      res.status(400).json({ success: false, error: 'Missing userId' });
      return;
    }

    const feeNum = parseFloat(String(entryFee || 0));
    const pCount = parseInt(String(playerCount || 2), 10);
    const mId = matchId || `match_${(gameMode || 'arena').toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    if (feeNum > 0) {
      const summary = await LedgerService.getUserWallet(userId);
      const avail = parseFloat(summary.availableBalance || '0');
      if (avail < feeNum || LedgerMath.isLessThan(summary.availableBalance, feeNum.toFixed(8))) {
        res.status(400).json({
          success: false,
          code: 'INSUFFICIENT_BALANCE',
          error: `Insufficient balance. Required: ${feeNum.toFixed(2)}, Available: ${avail.toFixed(2)}`,
        });
        return;
      }

      // Lock entry fee in double-entry ledger
      const lockIdemp = `lock_entry_${mId}_${userId}`;
      await LedgerService.lockFundsForWithdrawal(userId, feeNum.toFixed(8), lockIdemp);
    }

    res.json({
      success: true,
      matchId: mId,
      lockedFee: feeNum,
      entryFee: feeNum.toFixed(8),
    });
  } catch (err: any) {
    const errMsg = err?.message || 'Failed to lock match entry fee';
    const isInsufficient = errMsg.toLowerCase().includes('insufficient');
    if (isInsufficient) {
      Logger.warn(`Lock match entry rejected: ${errMsg}`);
      res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_BALANCE',
        error: errMsg,
      });
      return;
    }
    Logger.error('Lock match entry error:', err);
    res.status(400).json({ success: false, error: errMsg });
  }
});

// In-memory table queue tracker
interface QueuedTable {
  matchId: string;
  gameMode: string;
  playerCount: number;
  entryFee: number;
  prizePool: number;
  players: any[];
  createdAt: number;
}

const activeTableQueues = new Map<string, QueuedTable>();

const BOT_ROSTER = [
  {
    id: 'bot_alex',
    name: 'Alex_Viper',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    country: 'US',
    rating: 1840,
    ping: 28,
  },
  {
    id: 'bot_elena',
    name: 'Elena_R',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    country: 'GB',
    rating: 1910,
    ping: 34,
  },
  {
    id: 'bot_rashid',
    name: 'Rashid_DXB',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    country: 'AE',
    rating: 2050,
    ping: 18,
  },
  {
    id: 'bot_maya',
    name: 'Maya_LudoQueen',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    country: 'IN',
    rating: 1980,
    ping: 42,
  },
  {
    id: 'bot_david',
    name: 'David_King99',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    country: 'CA',
    rating: 1790,
    ping: 30,
  },
  {
    id: 'bot_sakura',
    name: 'Sakura_Tokyo',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    country: 'JP',
    rating: 2120,
    ping: 55,
  },
  {
    id: 'bot_vikram',
    name: 'Vikram_Ace',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    country: 'IN',
    rating: 2020,
    ping: 38,
  },
  {
    id: 'bot_sophia',
    name: 'Sophia_Star',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    country: 'AU',
    rating: 1890,
    ping: 45,
  },
];

// POST /api/matches/find-or-create-table
// Detects real humans in table and automatically fills remaining seats with bots!
matchApiRouter.post('/api/matches/find-or-create-table', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      userName,
      userAvatar,
      userColor,
      gameMode = 'ONLINE_ARENA',
      playerCount = 4,
      entryFee = 0,
      prizePool = 0,
      matchId: requestedMatchId,
    } = req.body;

    const pCount = parseInt(String(playerCount), 10) as 2 | 3 | 4;
    const feeNum = parseFloat(String(entryFee || 0));
    const pPool = parseFloat(String(prizePool || 0));
    const effectiveUserId = userId || 'user_guest_default';
    const effectiveUserName = userName || 'Player 1';

    // 1. Fetch admin win rates
    const settings = SettingsStore.getSettings();
    let humanCanWin = true;
    if (pCount === 3) {
      const winChance = settings.humanWinRate3P ?? 20;
      humanCanWin = Math.random() * 100 < winChance;
    } else if (pCount === 4) {
      const winChance = settings.humanWinRate4P ?? 20;
      humanCanWin = Math.random() * 100 < winChance;
    } else {
      humanCanWin = Math.random() * 100 < 50;
    }

    // Clean stale queues older than 60s
    const now = Date.now();
    for (const [k, q] of activeTableQueues.entries()) {
      if (now - q.createdAt > 60000) {
        activeTableQueues.delete(k);
      }
    }

    const queueKey = `${gameMode}_${pCount}_${feeNum.toFixed(2)}`;
    let table = activeTableQueues.get(queueKey);

    if (!table || table.players.length >= pCount) {
      const targetMatchId = requestedMatchId || `match_${gameMode.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      table = {
        matchId: targetMatchId,
        gameMode,
        playerCount: pCount,
        entryFee: feeNum,
        prizePool: pPool,
        players: [],
        createdAt: now,
      };
      activeTableQueues.set(queueKey, table);
    }

    const allColorPalette = ['red', 'yellow', 'green', 'blue'];
    const takenColors = new Set(table.players.map((p) => p.color));

    let assignedColor = userColor;
    if (!assignedColor || takenColors.has(assignedColor)) {
      assignedColor = allColorPalette.find((c) => !takenColors.has(c)) || 'red';
    }

    // Add human player if not already in table
    const existingHuman = table.players.find((p) => p.id === effectiveUserId);
    if (!existingHuman) {
      table.players.push({
        id: effectiveUserId,
        name: effectiveUserName,
        avatarUrl: userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        color: assignedColor,
        seatIndex: table.players.length,
        country: 'IN',
        rating: 1950,
        ping: 24,
        isHuman: true,
        isBot: false,
      });
    }

    // Check how many real humans are currently in this table
    const humansCount = table.players.filter((p) => p.isHuman).length;
    const seatsRemaining = pCount - table.players.length;

    // Automatically fill the remaining seats with bots!
    if (seatsRemaining > 0) {
      const shuffledBots = [...BOT_ROSTER].sort(() => Math.random() - 0.5);
      for (let i = 0; i < seatsRemaining; i++) {
        const usedColors = new Set(table.players.map((p) => p.color));
        const botColor = allColorPalette.find((c) => !usedColors.has(c)) || 'green';
        const botTemplate = shuffledBots[i % shuffledBots.length];

        table.players.push({
          id: `${botTemplate.id}_${i}`,
          name: botTemplate.name,
          avatarUrl: botTemplate.avatarUrl,
          color: botColor,
          seatIndex: table.players.length,
          country: botTemplate.country,
          rating: botTemplate.rating,
          ping: botTemplate.ping,
          isHuman: false,
          isBot: true,
        });
      }
    }

    // Persist to PostgreSQL if configured
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        pool.query(
          `INSERT INTO matches (
             id, game_mode, max_players, joined_players, entry_fee, gross_prize_pool, net_prize_pool, status, started_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'STARTING', NOW())
           ON CONFLICT (id) DO UPDATE SET
             joined_players = EXCLUDED.joined_players,
             status = 'STARTING'`,
          [
            table.matchId,
            gameMode,
            pCount,
            pCount,
            feeNum.toFixed(8),
            pPool.toFixed(8),
            (pPool * 0.9).toFixed(8),
          ]
        ).catch((err) => Logger.warn('Postgres match save notice:', err.message));

        for (const player of table.players) {
          pool.query(
            `INSERT INTO match_players (
               id, match_id, user_id, color, seat_index, entry_fee, status
             ) VALUES ($1, $2, $3, $4, $5, $6, 'JOINED')
             ON CONFLICT (id) DO NOTHING`,
            [
              `mp_${table.matchId}_${player.id}`,
              table.matchId,
              player.id,
              player.color,
              player.seatIndex,
              feeNum.toFixed(8),
            ]
          ).catch((err) => Logger.warn('Postgres player save notice:', err.message));
        }
      }
    }

    // Reset this queue so subsequent players get a new table
    activeTableQueues.delete(queueKey);

    const opponents = table.players.filter((p) => p.id !== effectiveUserId);

    res.json({
      success: true,
      matchId: table.matchId,
      gameMode,
      playerCount: pCount,
      entryFee: feeNum,
      prizePool: pPool,
      humanCount: humansCount,
      botCount: seatsRemaining,
      humanCanWin,
      players: table.players,
      opponents,
    });
  } catch (err: any) {
    Logger.error('Find or create table error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// POST /api/matches/settle (Authoritatively settles match, debits loser, credits winner)
matchApiRouter.post('/api/matches/settle', async (req: Request, res: Response) => {
  try {
    const {
      matchId,
      winnerUserId,
      winnerName,
      winnerColor,
      gameMode,
      entryFee,
      prizePool,
      playerCount,
      playerResults,
      playerUsernames,
    } = req.body;

    if (!matchId || !winnerUserId) {
      res.status(400).json({ success: false, error: 'Missing matchId or winnerUserId' });
      return;
    }

    const safeResults = Array.isArray(playerResults) && playerResults.length > 0
      ? playerResults.map((pr: any) => ({
          userId: pr.userId || pr.id,
          rank: pr.rank || (pr.userId === winnerUserId ? 1 : 2),
          finalScore: pr.finalScore || pr.score || 0,
          tokensHome: pr.tokensHome || 0,
          capturesMade: pr.capturesMade || 0,
          totalDistanceMoved: pr.totalDistanceMoved || 0,
        }))
      : [
          { userId: winnerUserId, rank: 1, finalScore: 100, tokensHome: 4, capturesMade: 0, totalDistanceMoved: 50 },
        ];

    const settlement = await MatchSettlementService.settleMatch(
      matchId,
      winnerUserId,
      safeResults,
      {
        entryFee,
        prizePool,
        gameMode,
        playerCount: playerCount || safeResults.length || 2,
        winnerName,
        winnerColor,
        playerUsernames,
      }
    );

    // Fetch updated balance for the winner user
    const updatedWallet = await LedgerService.getUserWallet(winnerUserId);

    // If tournamentId provided or active tournament exists for player, record score in tournament
    let tId = req.body.tournamentId;
    if (!tId) {
      try {
        const activeT = await TournamentService.getActiveTournaments();
        const mode = String(gameMode || '').toLowerCase();
        const matching = activeT.find((t: any) =>
          mode.includes('supreme') ? t.gameType === 'supreme' : mode.includes('snake') ? t.gameType === 'snake' : true
        );
        if (matching) {
          tId = matching.id;
        }
      } catch (tErr) {
        // ignore
      }
    }

    if (tId && safeResults.length > 0) {
      for (const pr of safeResults) {
        if (pr.userId && !pr.userId.startsWith('bot_')) {
          TournamentService.recordTournamentScore(pr.userId, tId, matchId, pr.finalScore).catch((err) => {
            Logger.warn(`Notice recording tournament score for ${pr.userId}:`, err);
          });
        }
      }
    }

    res.json({
      success: true,
      ...settlement,
      userBalance: updatedWallet.availableBalance,
      totalBalance: updatedWallet.totalBalance,
    });
  } catch (err: any) {
    if (
      err.code === '23505' ||
      err.message?.includes('match_settlements_match_id_key') ||
      err.message?.includes('match_settlements_idemp_uniq')
    ) {
      try {
        const pool = getDbPool();
        if (pool && req.body.matchId) {
          const rowRes = await pool.query('SELECT * FROM match_settlements WHERE match_id = $1 LIMIT 1', [req.body.matchId]);
          if (rowRes.rows.length > 0) {
            const row = rowRes.rows[0];
            const updatedWallet = await LedgerService.getUserWallet(row.winner_user_id || req.body.winnerUserId);
            res.json({
              success: true,
              settlementId: row.id,
              matchId: row.match_id,
              winnerUserId: row.winner_user_id,
              grossPool: row.gross_pool,
              platformFee: row.platform_fee,
              prizePool: row.prize_pool,
              payoutTxId: row.settlement_details?.payoutTxId || 'already_settled',
              status: 'ALREADY_SETTLED',
              userBalance: updatedWallet.availableBalance,
              totalBalance: updatedWallet.totalBalance,
            });
            return;
          }
        }
      } catch (recoveryErr) {
        Logger.error('Failed to recover from concurrent settlement constraint:', recoveryErr);
      }
    }
    Logger.error(`Match settlement endpoint error: ${err.message}`, err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/matches/:id/leave
matchApiRouter.post('/api/matches/:id/leave', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const matchId = req.params.id;

    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    const success = await RoomJoinService.leaveMatch(matchId, userId);
    res.json({ success, message: success ? 'Left room successfully' : 'Could not leave room' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/matches/:id
matchApiRouter.get('/api/matches/:id', async (req: Request, res: Response) => {
  const matchId = req.params.id;

  if (isPostgresConfigured()) {
    const pool = getDbPool();
    if (pool) {
      const client = await pool.connect();
      try {
        const matchRes = await client.query(`SELECT * FROM matches WHERE id = $1`, [matchId]);
        if (matchRes.rows.length === 0) {
          res.status(404).json({ error: 'Match not found' });
          return;
        }

        const playersRes = await client.query(`SELECT * FROM match_players WHERE match_id = $1`, [matchId]);
        res.json({
          match: matchRes.rows[0],
          players: playersRes.rows,
        });
        return;
      } finally {
        client.release();
      }
    }
  }

  res.status(404).json({ error: 'Match not found' });
});

// -----------------------------------------------------------------------------
// 3. AUTHORITATIVE IN-GAME ACTIONS & RECOVERY
// -----------------------------------------------------------------------------

// GET /api/games/:id/state
matchApiRouter.get('/api/games/:id/state', async (req: Request, res: Response) => {
  try {
    const matchId = req.params.id;
    const userId = (req.query.userId as string) || 'anonymous';

    const state = await ReconnectService.getMatchAuthoritativeState(matchId, userId);
    if (!state) {
      res.status(404).json({ error: 'Game state not found' });
      return;
    }

    res.json(state);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/games/:id/roll
matchApiRouter.post('/api/games/:id/roll', async (req: Request, res: Response) => {
  try {
    const matchId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    // 1. Try Supreme Engine
    const supremeSession = ReconnectService.getSupremeSession(matchId);
    if (supremeSession) {
      const rollResult = LudoSupremeEngine.rollDice(supremeSession, userId);
      res.json(rollResult);
      return;
    }

    // 2. Try Arena Engine
    const arenaSession = await GamePersistenceService.getGameState(matchId);
    if (arenaSession) {
      const rollResult = AuthoritativeLudoEngine.rollDiceAuthoritative(arenaSession, userId);
      await GamePersistenceService.saveActiveGameState(rollResult.session);
      res.json(rollResult);
      return;
    }

    res.status(404).json({ error: 'Active game session not found' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/games/:id/move
matchApiRouter.post('/api/games/:id/move', async (req: Request, res: Response) => {
  try {
    const matchId = req.params.id;
    const { userId, pawnId } = req.body;

    if (!userId || !pawnId) {
      res.status(400).json({ error: 'Missing userId or pawnId' });
      return;
    }

    // 1. Try Supreme Engine
    const supremeSession = ReconnectService.getSupremeSession(matchId);
    if (supremeSession) {
      const moveResult = LudoSupremeEngine.moveToken(supremeSession, userId, pawnId);

      // If game is now won / completed, settle prizes!
      if (moveResult.isGameWon && supremeSession.finalRankings && supremeSession.winnerUserId) {
        MatchSettlementService.settleMatch(
          matchId,
          supremeSession.winnerUserId,
          supremeSession.finalRankings.map((r) => ({
            userId: r.userId,
            rank: r.rank,
            finalScore: r.score,
            tokensHome: r.tokensHome,
            capturesMade: r.captures,
            totalDistanceMoved: r.distance,
          }))
        ).catch((err) => Logger.error('Async Supreme settlement error', err));
      }

      res.json(moveResult);
      return;
    }

    // 2. Try Arena Engine
    const arenaSession = await GamePersistenceService.getGameState(matchId);
    if (arenaSession) {
      const moveResult = AuthoritativeLudoEngine.moveTokenAuthoritative(arenaSession, userId, pawnId);
      await GamePersistenceService.saveActiveGameState(moveResult.session);

      if (moveResult.isGameWon && arenaSession.winner) {
        const winnerPlayer = arenaSession.players[arenaSession.winner];
        if (winnerPlayer) {
          const rankings = Object.values(arenaSession.players).map((p, idx) => ({
            userId: p.id,
            rank: p.id === winnerPlayer.id ? 1 : idx + 2,
            finalScore: p.score || 0,
            tokensHome: p.pawns.filter((pw) => pw.state === 'goal').length,
            capturesMade: 0,
            totalDistanceMoved: p.pawns.reduce((sum, pw) => sum + (pw.pathStep >= 0 ? pw.pathStep : 0), 0),
          }));

          MatchSettlementService.settleMatch(matchId, winnerPlayer.id, rankings).catch((err) =>
            Logger.error('Async Arena settlement error', err)
          );
        }
      }

      res.json(moveResult);
      return;
    }

    res.status(404).json({ error: 'Active game session not found' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
