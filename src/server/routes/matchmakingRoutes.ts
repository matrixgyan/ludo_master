import { Router, Request, Response } from 'express';
import { MatchmakingQueueService } from '../game/matchmakingQueueService';
import { GameMode } from '../game/matchConfig';
import { AuthService } from '../services/authService';
import { Logger } from '../config/env';

export const matchmakingRouter = Router();

function resolveUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const verified = AuthService.verifyToken(authHeader.substring(7));
    if (verified?.userId) return verified.userId;
  }
  const headerUser = req.headers['x-user-id'] as string;
  const queryUser = req.query.userId as string;
  const bodyUser = req.body?.userId as string;
  return bodyUser || headerUser || queryUser || 'user_guest_default';
}

/**
 * POST /api/matchmaking/join
 * Join real or practice matchmaking queue
 */
matchmakingRouter.post('/api/matchmaking/join', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const {
      username,
      avatarUrl,
      country,
      rating,
      ping,
      gameMode,
      playerCount,
      entryFee,
      matchType,
    } = req.body;

    const numFee = typeof entryFee === 'string' ? parseFloat(entryFee) : (entryFee ?? 0);
    const parsedPlayerCount = playerCount ? parseInt(playerCount, 10) : 2;

    const result = await MatchmakingQueueService.joinQueue({
      userId,
      username: username || `Player_${userId.slice(-4)}`,
      avatarUrl,
      country,
      rating,
      ping,
      gameMode: gameMode || GameMode.LUDO_SUPREME,
      playerCount: parsedPlayerCount as any,
      entryFee: numFee,
      matchType: numFee > 0 ? 'REAL' : (matchType || 'PRACTICE'),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    Logger.error('Matchmaking join error', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to join matchmaking' });
  }
});

/**
 * GET /api/matchmaking/status
 * Poll current status of matchmaking room
 */
matchmakingRouter.get('/api/matchmaking/status', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const matchId = req.query.matchId as string;

    if (!matchId) {
      res.status(400).json({ success: false, error: 'Missing matchId query parameter' });
      return;
    }

    const status = MatchmakingQueueService.pollStatus(matchId, userId);
    res.json({
      success: true,
      ...status,
    });
  } catch (err: any) {
    Logger.error('Matchmaking status error', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to check status' });
  }
});

/**
 * POST /api/matchmaking/simulate-join
 * Force a verified 2nd real player to join the table on demand for testing/demo
 */
matchmakingRouter.post('/api/matchmaking/simulate-join', (req: Request, res: Response) => {
  try {
    const { matchId } = req.body;
    if (!matchId) {
      res.status(400).json({ success: false, error: 'Missing matchId' });
      return;
    }

    const result = MatchmakingQueueService.simulateRealPlayerJoin(matchId);
    res.json(result);
  } catch (err: any) {
    Logger.error('Simulate join error', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to simulate real player' });
  }
});

/**
 * POST /api/matchmaking/cancel
 * Cancel queue waiting and refund/leave
 */
matchmakingRouter.post('/api/matchmaking/cancel', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { matchId } = req.body;

    const cancelled = MatchmakingQueueService.cancelQueue(userId, matchId);
    res.json({
      success: true,
      cancelled,
      message: 'Left matchmaking queue',
    });
  } catch (err: any) {
    Logger.error('Matchmaking cancel error', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to cancel queue' });
  }
});
