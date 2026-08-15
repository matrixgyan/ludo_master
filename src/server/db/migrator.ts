import { getDbPool, isPostgresConfigured } from './client';
import { Logger } from '../config/env';

/**
 * Ensures required PostgreSQL tables exist when DATABASE_URL is provided
 */
export async function ensureDatabaseTables(): Promise<void> {
  if (!isPostgresConfigured()) {
    Logger.info('PostgreSQL not configured. Skipping database table initialization.');
    return;
  }

  const pool = getDbPool();
  if (!pool) return;

  const client = await pool.connect();
  try {
    Logger.info('Initializing Neon PostgreSQL database schema...');

    await client.query(`
      -- 1. Users Table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT,
        avatar_url TEXT,
        wallet_address TEXT,
        coins INTEGER NOT NULL DEFAULT 1000,
        diamonds INTEGER NOT NULL DEFAULT 10,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 2. Games Table
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        mode TEXT NOT NULL DEFAULT '2_PLAYER',
        status TEXT NOT NULL DEFAULT 'WAITING',
        winner_user_id TEXT,
        total_turns INTEGER NOT NULL DEFAULT 0,
        version INTEGER NOT NULL DEFAULT 1,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 3. Game Players Table
      CREATE TABLE IF NOT EXISTS game_players (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        color TEXT NOT NULL,
        is_host BOOLEAN NOT NULL DEFAULT FALSE,
        is_ai BOOLEAN NOT NULL DEFAULT FALSE,
        finish_position INTEGER,
        final_score INTEGER NOT NULL DEFAULT 0,
        tokens_home INTEGER NOT NULL DEFAULT 0,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 4. Game Events Table
      CREATE TABLE IF NOT EXISTS game_events (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        sequence_number INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        actor_user_id TEXT,
        payload JSONB NOT NULL,
        game_version INTEGER NOT NULL DEFAULT 1,
        server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT game_events_seq_uniq UNIQUE (game_id, sequence_number)
      );

      -- 5. Player Statistics Table
      CREATE TABLE IF NOT EXISTS player_statistics (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        games_played INTEGER NOT NULL DEFAULT 0,
        games_won INTEGER NOT NULL DEFAULT 0,
        games_lost INTEGER NOT NULL DEFAULT 0,
        games_abandoned INTEGER NOT NULL DEFAULT 0,
        total_captures INTEGER NOT NULL DEFAULT 0,
        tokens_reached_home INTEGER NOT NULL DEFAULT 0,
        win_rate NUMERIC(5, 2) NOT NULL DEFAULT '0.00',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 6. Leaderboards Table
      CREATE TABLE IF NOT EXISTS leaderboards (
        id TEXT PRIMARY KEY,
        leaderboard_type TEXT NOT NULL DEFAULT 'GLOBAL',
        period TEXT NOT NULL DEFAULT 'ALL_TIME',
        user_id TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        rank INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT lb_type_period_user_uniq UNIQUE (leaderboard_type, period, user_id)
      );

      -- 7. Match History Table
      CREATE TABLE IF NOT EXISTS match_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        mode TEXT NOT NULL,
        result TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        tokens_home INTEGER NOT NULL DEFAULT 0,
        played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 8. Storage Objects Table (Cloudflare R2 metadata)
      CREATE TABLE IF NOT EXISTS storage_objects (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        bucket TEXT NOT NULL,
        user_id TEXT,
        content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
        size_bytes INTEGER NOT NULL DEFAULT 0,
        url TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Create performance indices
      CREATE INDEX IF NOT EXISTS idx_games_status ON games (status);
      CREATE INDEX IF NOT EXISTS idx_game_players_game_user ON game_players (game_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events (game_id);
      CREATE INDEX IF NOT EXISTS idx_lb_score ON leaderboards (leaderboard_type, score DESC);
      CREATE INDEX IF NOT EXISTS idx_match_history_user ON match_history (user_id, played_at DESC);
    `);

    Logger.info('Neon PostgreSQL tables initialized successfully.');
  } catch (err) {
    Logger.error('Failed to initialize Neon PostgreSQL database schema', err);
  } finally {
    client.release();
  }
}
