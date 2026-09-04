import { getDbPool, isPostgresConfigured } from '../db/client';
import { LedgerService } from '../wallet/ledgerService';
import { Logger } from '../config/env';

export interface ScoreTierInfo {
  tier: string;
  badge: string;
  color: string;
  minScore: number;
  nextMinScore: number | null;
}

export function calculateScoreTier(score: number): ScoreTierInfo {
  if (score >= 10000) {
    return { tier: 'Crown Sovereign', badge: '👑', color: '#a855f7', minScore: 10000, nextMinScore: null };
  }
  if (score >= 5001) {
    return { tier: 'Grandmaster', badge: '💎', color: '#f43f5e', minScore: 5001, nextMinScore: 10000 };
  }
  if (score >= 2001) {
    return { tier: 'Master', badge: '⚡', color: '#06b6d4', minScore: 2001, nextMinScore: 5001 };
  }
  if (score >= 1001) {
    return { tier: 'Champion', badge: '🥇', color: '#eab308', minScore: 1001, nextMinScore: 2001 };
  }
  if (score >= 401) {
    return { tier: 'Warrior', badge: '🥈', color: '#94a3b8', minScore: 401, nextMinScore: 1001 };
  }
  if (score >= 1) {
    return { tier: 'Challenger', badge: '🥉', color: '#cd7f32', minScore: 1, nextMinScore: 401 };
  }
  return { tier: 'Unranked', badge: '🎯', color: '#64748b', minScore: 0, nextMinScore: 1 };
}

export class TournamentService {
  /**
   * Generates or retrieves active daily and weekly tournaments for Supreme and Snake Ludo.
   */
  static async ensureActiveTournaments(): Promise<any[]> {
    if (!isPostgresConfigured()) return [];
    const pool = getDbPool();
    if (!pool) return [];

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Calculate Daily start/end
    const dailyStart = new Date(now);
    dailyStart.setUTCHours(0, 0, 0, 0);
    const dailyEnd = new Date(now);
    dailyEnd.setUTCHours(23, 59, 59, 999);

    // Calculate Weekly start/end (Monday to Sunday)
    const dayOfWeek = now.getUTCDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const weeklyStart = new Date(now);
    weeklyStart.setUTCDate(now.getUTCDate() + diffToMonday);
    weeklyStart.setUTCHours(0, 0, 0, 0);

    const weeklyEnd = new Date(weeklyStart);
    weeklyEnd.setUTCDate(weeklyStart.getUTCDate() + 6);
    weeklyEnd.setUTCHours(23, 59, 59, 999);
    const weekYear = weeklyStart.getUTCFullYear();
    const weekNumber = Math.ceil((((weeklyStart.getTime() - new Date(Date.UTC(weekYear, 0, 1)).getTime()) / 86400000) + 1) / 7);

    const tournaments = [
      {
        id: `tourn_daily_supreme_${dateStr}`,
        gameType: 'supreme',
        cadence: 'DAILY',
        title: 'Daily Supreme Ludo Championship',
        description: 'Compete in up to 25 matches today. Highest score wins the top prize!',
        entryFee: '25.00000000',
        maxMatches: 25,
        prizePool: '5000.00000000',
        startsAt: dailyStart.toISOString(),
        endsAt: dailyEnd.toISOString(),
      },
      {
        id: `tourn_daily_snake_${dateStr}`,
        gameType: 'snake',
        cadence: 'DAILY',
        title: 'Daily Snake Ludo Championship',
        description: '25 fast-paced Snake Ludo matches. Maximum score takes the trophy & cash!',
        entryFee: '25.00000000',
        maxMatches: 25,
        prizePool: '5000.00000000',
        startsAt: dailyStart.toISOString(),
        endsAt: dailyEnd.toISOString(),
      },
      {
        id: `tourn_weekly_supreme_${weekYear}_w${weekNumber}`,
        gameType: 'supreme',
        cadence: 'WEEKLY',
        title: 'Weekly Supreme Masters League',
        description: 'The premier 7-day tournament. Play all week and achieve the highest peak score!',
        entryFee: '25.00000000',
        maxMatches: 100,
        prizePool: '25000.00000000',
        startsAt: weeklyStart.toISOString(),
        endsAt: weeklyEnd.toISOString(),
      },
      {
        id: `tourn_weekly_snake_${weekYear}_w${weekNumber}`,
        gameType: 'snake',
        cadence: 'WEEKLY',
        title: 'Weekly Snake Ludo Masters',
        description: 'Weekly marathon of snake & ladders scoring. Highest score wins the mega pool!',
        entryFee: '25.00000000',
        maxMatches: 100,
        prizePool: '25000.00000000',
        startsAt: weeklyStart.toISOString(),
        endsAt: weeklyEnd.toISOString(),
      },
    ];

    for (const t of tournaments) {
      await pool.query(
        `INSERT INTO league_tournaments (id, game_type, cadence, title, description, entry_fee, max_matches, prize_pool, starts_at, ends_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE')
         ON CONFLICT (id) DO UPDATE
         SET title = EXCLUDED.title,
             description = EXCLUDED.description,
             ends_at = EXCLUDED.ends_at`,
        [t.id, t.gameType, t.cadence, t.title, t.description, t.entryFee, t.maxMatches, t.prizePool, t.startsAt, t.endsAt]
      );
    }

    return tournaments;
  }

  /**
   * Retrieves active tournaments list with user's participation status attached if logged in.
   */
  static async getActiveTournaments(userId?: string): Promise<any[]> {
    await this.ensureActiveTournaments();
    const pool = getDbPool();
    if (!pool) return [];

    const res = await pool.query(
      `SELECT * FROM league_tournaments 
       WHERE status = 'ACTIVE' AND ends_at > NOW()
       ORDER BY cadence ASC, game_type ASC`
    );

    const tournaments = res.rows;
    if (!userId) {
      return tournaments.map((t) => ({ ...t, participation: null }));
    }

    const partRes = await pool.query(
      `SELECT * FROM tournament_participants WHERE user_id = $1`,
      [userId]
    );
    const partMap = new Map<string, any>();
    for (const p of partRes.rows) {
      partMap.set(p.tournament_id, p);
    }

    return tournaments.map((t) => {
      const part = partMap.get(t.id);
      return {
        id: t.id,
        gameType: t.game_type,
        cadence: t.cadence,
        title: t.title,
        description: t.description,
        entryFee: parseFloat(t.entry_fee),
        maxMatches: t.max_matches,
        prizePool: parseFloat(t.prize_pool),
        startsAt: t.starts_at,
        endsAt: t.ends_at,
        status: t.status,
        participation: part
          ? {
              id: part.id,
              matchesPlayed: part.matches_played,
              maxMatches: part.max_matches,
              highestScore: part.highest_score,
              status: part.status,
              tier: calculateScoreTier(part.highest_score),
              isCompleted: part.matches_played >= part.max_matches,
            }
          : null,
      };
    });
  }

  /**
   * Join a tournament with ₹25 entry fee ledger deduction.
   */
  static async joinTournament(userId: string, tournamentId: string): Promise<{ success: boolean; participation: any; newBalance: string }> {
    const pool = getDbPool();
    if (!pool) throw new Error('Database unavailable');

    // 1. Check tournament
    const tournRes = await pool.query(`SELECT * FROM league_tournaments WHERE id = $1`, [tournamentId]);
    if (tournRes.rows.length === 0) {
      throw new Error('Tournament not found');
    }
    const tourn = tournRes.rows[0];
    if (tourn.status !== 'ACTIVE' || new Date(tourn.ends_at).getTime() <= Date.now()) {
      throw new Error('This tournament has expired or ended');
    }

    // 2. Check if already joined
    const existing = await pool.query(
      `SELECT * FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2`,
      [tournamentId, userId]
    );
    if (existing.rows.length > 0) {
      const p = existing.rows[0];
      const wallet = await LedgerService.getUserWallet(userId);
      return {
        success: true,
        participation: {
          id: p.id,
          matchesPlayed: p.matches_played,
          maxMatches: p.max_matches,
          highestScore: p.highest_score,
          status: p.status,
          tier: calculateScoreTier(p.highest_score),
          isCompleted: p.matches_played >= p.max_matches,
        },
        newBalance: wallet.availableBalance,
      };
    }

    // 3. Check wallet balance
    const entryFeeNum = parseFloat(tourn.entry_fee);
    const userWallet = await LedgerService.getUserWallet(userId);
    if (parseFloat(userWallet.availableBalance || '0') < entryFeeNum) {
      throw new Error(`Insufficient wallet balance. ₹${entryFeeNum} entry fee is required.`);
    }

    // 4. Double-entry ledger debit
    const lockIdemp = `lock_tourn_${tournamentId}_${userId}`;
    const deductIdemp = `settle_tourn_${tournamentId}_${userId}`;
    await LedgerService.lockFundsForWithdrawal(userId, tourn.entry_fee, lockIdemp);
    const tx = await LedgerService.settleWithdrawal(userId, tourn.entry_fee, '0.00000000', deductIdemp);

    // 5. Insert participant record
    const partId = `part_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const insertRes = await pool.query(
      `INSERT INTO tournament_participants (
        id, tournament_id, user_id, matches_played, max_matches, highest_score, scores_history, entry_fee_paid, ledger_tx_id, status
      ) VALUES ($1, $2, $3, 0, $4, 0, '[]'::jsonb, $5, $6, 'ACTIVE')
      RETURNING *`,
      [partId, tournamentId, userId, tourn.max_matches, tourn.entry_fee, tx.transactionId]
    );

    const part = insertRes.rows[0];
    const updatedWallet = await LedgerService.getUserWallet(userId);

    Logger.info(`User ${userId} successfully joined tournament ${tournamentId} (Entry Fee: ₹${entryFeeNum})`);

    return {
      success: true,
      participation: {
        id: part.id,
        matchesPlayed: part.matches_played,
        maxMatches: part.max_matches,
        highestScore: part.highest_score,
        status: part.status,
        tier: calculateScoreTier(part.highest_score),
        isCompleted: false,
      },
      newBalance: updatedWallet.availableBalance,
    };
  }

  /**
   * Records match score for a tournament participant.
   */
  static async recordTournamentScore(
    userId: string,
    tournamentId: string,
    matchId: string,
    score: number
  ): Promise<{ success: boolean; highestScore: number; matchesPlayed: number; isNewRecord: boolean; isCompleted: boolean }> {
    const pool = getDbPool();
    if (!pool) throw new Error('Database unavailable');

    const partRes = await pool.query(
      `SELECT * FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2`,
      [tournamentId, userId]
    );

    if (partRes.rows.length === 0) {
      // User didn't join tournament ticket yet; non-blocking return
      return { success: false, highestScore: score, matchesPlayed: 0, isNewRecord: false, isCompleted: false };
    }

    const part = partRes.rows[0];
    if (part.matches_played >= part.max_matches) {
      return {
        success: true,
        highestScore: part.highest_score,
        matchesPlayed: part.matches_played,
        isNewRecord: false,
        isCompleted: true,
      };
    }

    const newMatchesPlayed = part.matches_played + 1;
    const isNewRecord = score > (part.highest_score || 0);
    const newHighestScore = isNewRecord ? score : part.highest_score;
    const isCompleted = newMatchesPlayed >= part.max_matches;
    const newStatus = isCompleted ? 'COMPLETED' : 'ACTIVE';

    const historyEntry = {
      matchId,
      score,
      playedAt: new Date().toISOString(),
    };

    await pool.query(
      `UPDATE tournament_participants
       SET matches_played = $1,
           highest_score = $2,
           best_match_id = CASE WHEN $3 THEN $4 ELSE best_match_id END,
           scores_history = scores_history || $5::jsonb,
           status = $6,
           updated_at = NOW()
       WHERE id = $7`,
      [newMatchesPlayed, newHighestScore, isNewRecord, matchId, JSON.stringify([historyEntry]), newStatus, part.id]
    );

    return {
      success: true,
      highestScore: newHighestScore,
      matchesPlayed: newMatchesPlayed,
      isNewRecord,
      isCompleted,
    };
  }

  /**
   * Retrieves tournament leaderboard ranked by highest score.
   */
  static async getTournamentLeaderboard(tournamentId: string, currentUserId?: string): Promise<{
    tournament: any;
    leaderboard: any[];
    myStanding: any | null;
  }> {
    const pool = getDbPool();
    if (!pool) throw new Error('Database unavailable');

    const tournRes = await pool.query(`SELECT * FROM league_tournaments WHERE id = $1`, [tournamentId]);
    if (tournRes.rows.length === 0) {
      throw new Error('Tournament not found');
    }
    const tourn = tournRes.rows[0];

    const participantsRes = await pool.query(
      `SELECT 
         tp.id,
         tp.user_id,
         tp.matches_played,
         tp.max_matches,
         tp.highest_score,
         tp.status,
         tp.updated_at,
         COALESCE(u.username, u.display_name, 'Player') AS username,
         COALESCE(u.avatar_url, '') AS avatar_url
       FROM tournament_participants tp
       JOIN users u ON u.id = tp.user_id
       WHERE tp.tournament_id = $1
       ORDER BY tp.highest_score DESC, tp.matches_played DESC, tp.updated_at ASC
       LIMIT 50`,
      [tournamentId]
    );

    let myStanding: any = null;
    const leaderboard = participantsRes.rows.map((row, index) => {
      const rank = index + 1;
      const tierInfo = calculateScoreTier(row.highest_score);
      const item = {
        rank,
        userId: row.user_id,
        username: row.username,
        avatar: row.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${row.user_id}`,
        highestScore: row.highest_score,
        matchesPlayed: row.matches_played,
        maxMatches: row.max_matches,
        tier: tierInfo.tier,
        tierBadge: tierInfo.badge,
        tierColor: tierInfo.color,
        isCompleted: row.matches_played >= row.max_matches,
      };

      if (currentUserId && row.user_id === currentUserId) {
        myStanding = item;
      }

      return item;
    });

    // If current user is not in top 50, fetch their personal rank
    if (currentUserId && !myStanding) {
      const userRankRes = await pool.query(
        `WITH ranked AS (
           SELECT 
             user_id,
             highest_score,
             matches_played,
             max_matches,
             DENSE_RANK() OVER (ORDER BY highest_score DESC, matches_played DESC) AS rank
           FROM tournament_participants
           WHERE tournament_id = $1
         )
         SELECT r.*, COALESCE(u.username, u.display_name, 'Player') AS username, COALESCE(u.avatar_url, '') AS avatar_url
         FROM ranked r
         JOIN users u ON u.id = r.user_id
         WHERE r.user_id = $2`,
        [tournamentId, currentUserId]
      );

      if (userRankRes.rows.length > 0) {
        const ur = userRankRes.rows[0];
        const tierInfo = calculateScoreTier(ur.highest_score);
        myStanding = {
          rank: parseInt(ur.rank, 10),
          userId: ur.user_id,
          username: ur.username,
          avatar: ur.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${ur.user_id}`,
          highestScore: ur.highest_score,
          matchesPlayed: ur.matches_played,
          maxMatches: ur.max_matches,
          tier: tierInfo.tier,
          tierBadge: tierInfo.badge,
          tierColor: tierInfo.color,
          isCompleted: ur.matches_played >= ur.max_matches,
        };
      }
    }

    return {
      tournament: {
        id: tourn.id,
        gameType: tourn.game_type,
        cadence: tourn.cadence,
        title: tourn.title,
        description: tourn.description,
        entryFee: parseFloat(tourn.entry_fee),
        maxMatches: tourn.max_matches,
        prizePool: parseFloat(tourn.prize_pool),
        startsAt: tourn.starts_at,
        endsAt: tourn.ends_at,
      },
      leaderboard,
      myStanding,
    };
  }

  /**
   * Retrieves clean global highest score leaderboard (Daily, Weekly, All-time).
   */
  static async getHighestScoreLeaderboard(
    timeframe: 'today' | 'weekly' | 'all-time' = 'today',
    gameType: 'all' | 'supreme' | 'snake' = 'all',
    currentUserId?: string
  ): Promise<{
    timeframe: string;
    gameType: string;
    leaderboard: any[];
    myStanding: any | null;
  }> {
    const pool = getDbPool();
    if (!pool) return { timeframe, gameType, leaderboard: [], myStanding: null };

    let dateFilter = '';
    if (timeframe === 'today') {
      dateFilter = `AND COALESCE(mp.joined_at, NOW()) >= (CURRENT_DATE - INTERVAL '1 day')`;
    } else if (timeframe === 'weekly') {
      dateFilter = `AND COALESCE(mp.joined_at, NOW()) >= DATE_TRUNC('week', CURRENT_DATE)`;
    }

    let gameTypeFilter = '';
    if (gameType === 'supreme') {
      gameTypeFilter = `AND (m.game_mode = 'ludo_supreme' OR m.game_mode = 'LUDO_SUPREME')`;
    } else if (gameType === 'snake') {
      gameTypeFilter = `AND (m.game_mode = 'snake_ludo' OR m.game_mode = 'SNAKE_LUDO')`;
    }

    const query = `
      SELECT 
        mp.user_id,
        COALESCE(NULLIF(u.username, ''), NULLIF(u.display_name, ''), mp.user_id, 'Player') AS username,
        COALESCE(u.avatar_url, '') AS avatar_url,
        MAX(mp.final_score) AS highest_score,
        COUNT(mp.id) AS matches_played,
        SUM(CASE WHEN mp.final_rank = 1 THEN 1 ELSE 0 END) AS matches_won
      FROM match_players mp
      JOIN matches m ON m.id = mp.match_id
      LEFT JOIN users u ON u.id = mp.user_id
      WHERE mp.status = 'FINISHED'
        ${dateFilter}
        ${gameTypeFilter}
      GROUP BY mp.user_id, u.username, u.display_name, u.avatar_url
      ORDER BY highest_score DESC, matches_won DESC
      LIMIT 50;
    `;

    const res = await pool.query(query);

    let myStanding: any = null;
    const leaderboard = res.rows.map((row, idx) => {
      const rank = idx + 1;
      const score = parseInt(row.highest_score, 10) || 0;
      const tierInfo = calculateScoreTier(score);
      const item = {
        rank,
        userId: row.user_id,
        username: row.username,
        avatar: row.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${row.user_id}`,
        highestScore: score,
        matchesPlayed: parseInt(row.matches_played, 10) || 0,
        matchesWon: parseInt(row.matches_won, 10) || 0,
        tier: tierInfo.tier,
        tierBadge: tierInfo.badge,
        tierColor: tierInfo.color,
      };

      if (currentUserId && row.user_id === currentUserId) {
        myStanding = item;
      }
      return item;
    });

    // Check user standing if not in top 50
    if (currentUserId && !myStanding) {
      const userRes = await pool.query(
        `SELECT 
           mp.user_id,
           COALESCE(NULLIF(u.username, ''), NULLIF(u.display_name, ''), mp.user_id, 'Player') AS username,
           COALESCE(u.avatar_url, '') AS avatar_url,
           MAX(mp.final_score) AS highest_score,
           COUNT(mp.id) AS matches_played,
           SUM(CASE WHEN mp.final_rank = 1 THEN 1 ELSE 0 END) AS matches_won
         FROM match_players mp
         JOIN matches m ON m.id = mp.match_id
         LEFT JOIN users u ON u.id = mp.user_id
         WHERE mp.status = 'FINISHED' AND mp.user_id = $1
           ${dateFilter}
           ${gameTypeFilter}
         GROUP BY mp.user_id, u.username, u.display_name, u.avatar_url;`,
        [currentUserId]
      );

      if (userRes.rows.length > 0) {
        const ur = userRes.rows[0];
        const score = parseInt(ur.highest_score, 10) || 0;
        const tierInfo = calculateScoreTier(score);
        myStanding = {
          rank: 51,
          userId: ur.user_id,
          username: ur.username,
          avatar: ur.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${ur.user_id}`,
          highestScore: score,
          matchesPlayed: parseInt(ur.matches_played, 10) || 0,
          matchesWon: parseInt(ur.matches_won, 10) || 0,
          tier: tierInfo.tier,
          tierBadge: tierInfo.badge,
          tierColor: tierInfo.color,
        };
      }
    }

    return {
      timeframe,
      gameType,
      leaderboard,
      myStanding,
    };
  }

  /**
   * Retrieves quick daily summary for the collapsible lobby rank widget.
   */
  static async getUserDailySummary(userId: string): Promise<{
    todayHighestScore: number;
    dailyRank: number | null;
    tier: ScoreTierInfo;
    matchesPlayedToday: number;
    activeTournament: {
      id: string;
      title: string;
      gameType: string;
      matchesPlayed: number;
      maxMatches: number;
      highestScore: number;
      isCompleted: boolean;
    } | null;
  }> {
    const pool = getDbPool();
    const defaultTier = calculateScoreTier(0);
    if (!pool || !userId) {
      return {
        todayHighestScore: 0,
        dailyRank: null,
        tier: defaultTier,
        matchesPlayedToday: 0,
        activeTournament: null,
      };
    }

    // 1. Get today's highest score across standard matches
    const scoreRes = await pool.query(
      `SELECT 
         MAX(final_score) AS highest_score,
         COUNT(id) AS matches_count
       FROM match_players
       WHERE user_id = $1 AND status = 'FINISHED' AND COALESCE(joined_at, NOW()) >= (CURRENT_DATE - INTERVAL '1 day')`,
      [userId]
    );

    const matchHighest = scoreRes.rows[0]?.highest_score ? parseInt(scoreRes.rows[0].highest_score, 10) : 0;
    const matchesCount = scoreRes.rows[0]?.matches_count ? parseInt(scoreRes.rows[0].matches_count, 10) : 0;

    // 2. Check active daily tournament participation
    const activePartRes = await pool.query(
      `SELECT tp.*, lt.title, lt.game_type
       FROM tournament_participants tp
       JOIN league_tournaments lt ON lt.id = tp.tournament_id
       WHERE tp.user_id = $1 AND lt.status = 'ACTIVE' AND lt.cadence = 'DAILY' AND lt.ends_at > NOW()
       ORDER BY tp.updated_at DESC
       LIMIT 1`,
      [userId]
    );

    let activeTournament: any = null;
    let tournScore = 0;
    let tournMatches = 0;

    if (activePartRes.rows.length > 0) {
      const row = activePartRes.rows[0];
      tournScore = parseInt(row.highest_score || '0', 10);
      tournMatches = parseInt(row.matches_played || '0', 10);
      activeTournament = {
        id: row.tournament_id,
        title: row.title,
        gameType: row.game_type,
        matchesPlayed: tournMatches,
        maxMatches: parseInt(row.max_matches || '25', 10),
        highestScore: tournScore,
        isCompleted: tournMatches >= parseInt(row.max_matches || '25', 10),
      };
    }

    const todayHighestScore = Math.max(matchHighest, tournScore);
    const matchesPlayedToday = matchesCount + tournMatches;
    const tier = calculateScoreTier(todayHighestScore);

    // 3. Determine daily rank
    let dailyRank: number | null = null;
    if (todayHighestScore > 0) {
      const rankRes = await pool.query(
        `SELECT COUNT(DISTINCT user_id) + 1 AS user_rank
         FROM (
           SELECT user_id, MAX(final_score) AS max_score
           FROM match_players
           WHERE status = 'FINISHED' AND joined_at >= CURRENT_DATE
           GROUP BY user_id
           UNION ALL
           SELECT user_id, highest_score AS max_score
           FROM tournament_participants
           WHERE updated_at >= CURRENT_DATE
         ) sub
         WHERE sub.max_score > $1`,
        [todayHighestScore]
      );
      dailyRank = rankRes.rows[0]?.user_rank ? parseInt(rankRes.rows[0].user_rank, 10) : 1;
    }

    return {
      todayHighestScore,
      dailyRank,
      tier,
      matchesPlayedToday,
      activeTournament,
    };
  }
}
