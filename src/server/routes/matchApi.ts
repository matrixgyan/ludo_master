import { Router, Request, Response } from 'express';
import { GameMode, ALL_MATCH_POOLS } from '../game/matchConfig';
import { RoomManager } from '../game/roomManager';
import { RoomJoinService } from '../game/roomJoinService';
import { ReconnectService } from '../game/reconnectService';
import { LudoSupremeEngine } from '../game/ludoSupremeEngine';
import { AuthoritativeLudoEngine } from '../game/authoritativeEngine';
import { GamePersistenceService } from '../game/persistenceService';
import { MatchSettlementService } from '../wallet/matchSettlementService';
import { rateLimiter } from '../redis/rateLimit';
import { getDbPool, isPostgresConfigured } from '../db/client';
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
      Logger.error('Match join API error', err);
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to join match',
      });
    }
  }
);

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
