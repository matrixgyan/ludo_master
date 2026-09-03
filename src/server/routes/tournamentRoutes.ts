import { Router, Request, Response } from 'express';
import { TournamentService } from '../services/tournamentService';
import { Logger } from '../config/env';

export const tournamentRouter = Router();

/**
 * GET /api/tournaments/active
 * Returns list of active tournaments (Daily & Weekly for Supreme & Snake Ludo).
 */
tournamentRouter.get('/api/tournaments/active', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const tournaments = await TournamentService.getActiveTournaments(userId);
    res.json({
      success: true,
      tournaments,
    });
  } catch (err: any) {
    Logger.error('Error fetching active tournaments:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/tournaments/join
 * Registers user for a tournament, authoritatively debiting ₹25 entry fee through double-entry ledger.
 */
tournamentRouter.post('/api/tournaments/join', async (req: Request, res: Response) => {
  try {
    const { userId, tournamentId } = req.body;
    if (!userId || !tournamentId) {
      res.status(400).json({ success: false, error: 'Missing userId or tournamentId' });
      return;
    }

    const result = await TournamentService.joinTournament(userId, tournamentId);
    res.json(result);
  } catch (err: any) {
    Logger.error('Error joining tournament:', err);
    res.status(400).json({ success: false, error: err.message || 'Failed to join tournament' });
  }
});

/**
 * GET /api/tournaments/:id/leaderboard
 * Returns tournament leaderboard ranked by highest score.
 */
tournamentRouter.get('/api/tournaments/:id/leaderboard', async (req: Request, res: Response) => {
  try {
    const tournamentId = req.params.id;
    const userId = req.query.userId as string | undefined;

    const data = await TournamentService.getTournamentLeaderboard(tournamentId, userId);
    res.json({
      success: true,
      ...data,
    });
  } catch (err: any) {
    Logger.error('Error fetching tournament leaderboard:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/tournaments/record-score
 * Records match score for an active tournament participant.
 */
tournamentRouter.post('/api/tournaments/record-score', async (req: Request, res: Response) => {
  try {
    const { userId, tournamentId, matchId, score } = req.body;
    if (!userId || !tournamentId || !matchId || score === undefined) {
      res.status(400).json({ success: false, error: 'Missing required score fields' });
      return;
    }

    const result = await TournamentService.recordTournamentScore(userId, tournamentId, matchId, Number(score));
    res.json(result);
  } catch (err: any) {
    Logger.error('Error recording tournament score:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/leaderboard/highest-scores
 * Clean, real highest-score based rankings across the platform.
 */
tournamentRouter.get('/api/leaderboard/highest-scores', async (req: Request, res: Response) => {
  try {
    const timeframe = (req.query.timeframe as 'today' | 'weekly' | 'all-time') || 'today';
    const gameType = (req.query.gameType as 'all' | 'supreme' | 'snake') || 'all';
    const userId = req.query.userId as string | undefined;

    const data = await TournamentService.getHighestScoreLeaderboard(timeframe, gameType, userId);
    res.json({
      success: true,
      ...data,
    });
  } catch (err: any) {
    Logger.error('Error fetching highest score leaderboard:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/leaderboard/user-daily-rank
 * Quick user daily stats for the collapsible lobby rank widget.
 */
tournamentRouter.get('/api/leaderboard/user-daily-rank', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ success: false, error: 'Missing userId parameter' });
      return;
    }

    const summary = await TournamentService.getUserDailySummary(userId);
    res.json({
      success: true,
      ...summary,
    });
  } catch (err: any) {
    Logger.error('Error fetching user daily rank summary:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});
