-- =============================================================================
-- LUDO PRODUCTION SCHEMA MIGRATION 0001
-- Target: Neon PostgreSQL
-- =============================================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    external_auth_id VARCHAR(128) UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen_at);

-- 2. GAMES
CREATE TABLE IF NOT EXISTS games (
    id VARCHAR(64) PRIMARY KEY,
    game_type VARCHAR(50) NOT NULL DEFAULT 'LUDO_CLASSIC',
    mode VARCHAR(50) NOT NULL DEFAULT '2_PLAYER',
    status VARCHAR(30) NOT NULL DEFAULT 'WAITING',
    room_code VARCHAR(20) UNIQUE,
    max_players INT NOT NULL DEFAULT 4,
    current_turn_player_id VARCHAR(64),
    turn_number INT NOT NULL DEFAULT 0,
    winner_user_id VARCHAR(64),
    version INT NOT NULL DEFAULT 1,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);
CREATE INDEX IF NOT EXISTS idx_games_updated_at ON games(updated_at);
CREATE INDEX IF NOT EXISTS idx_games_room_code ON games(room_code);

-- 3. GAME PLAYERS
CREATE TABLE IF NOT EXISTS game_players (
    id VARCHAR(64) PRIMARY KEY,
    game_id VARCHAR(64) NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id),
    seat INT NOT NULL,
    color VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'JOINED',
    finish_position INT,
    final_score INT NOT NULL DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    disconnected_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_game_players_seat UNIQUE (game_id, seat),
    CONSTRAINT uq_game_players_color UNIQUE (game_id, color),
    CONSTRAINT uq_game_players_user UNIQUE (game_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_players_user_id ON game_players(user_id);
CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);

-- 4. GAME EVENTS (Append-only)
CREATE TABLE IF NOT EXISTS game_events (
    id VARCHAR(64) PRIMARY KEY,
    game_id VARCHAR(64) NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    sequence_number BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    actor_user_id VARCHAR(64),
    payload JSONB NOT NULL,
    game_version INT NOT NULL,
    server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_game_events_seq UNIQUE (game_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_game_events_game_time ON game_events(game_id, server_timestamp);

-- 5. GAME STATE SNAPSHOTS
CREATE TABLE IF NOT EXISTS game_state_snapshots (
    id VARCHAR(64) PRIMARY KEY,
    game_id VARCHAR(64) NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    version INT NOT NULL,
    state JSONB NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_game_version ON game_state_snapshots(game_id, version);

-- 6. PLAYER STATISTICS
CREATE TABLE IF NOT EXISTS player_statistics (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    games_played INT NOT NULL DEFAULT 0,
    games_won INT NOT NULL DEFAULT 0,
    games_lost INT NOT NULL DEFAULT 0,
    games_abandoned INT NOT NULL DEFAULT 0,
    total_turns INT NOT NULL DEFAULT 0,
    total_dice_rolls INT NOT NULL DEFAULT 0,
    total_captures INT NOT NULL DEFAULT 0,
    total_finished_tokens INT NOT NULL DEFAULT 0,
    win_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_stats_user ON player_statistics(user_id);

-- 7. LEADERBOARDS
CREATE TABLE IF NOT EXISTS leaderboards (
    id VARCHAR(64) PRIMARY KEY,
    leaderboard_type VARCHAR(30) NOT NULL,
    period VARCHAR(50) NOT NULL DEFAULT 'ALL_TIME',
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score BIGINT NOT NULL DEFAULT 0,
    rank INT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_leaderboards_type_period_user UNIQUE (leaderboard_type, period, user_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_rank ON leaderboards(leaderboard_type, period, score DESC);

-- 8. WALLET LEDGER (Web3 / USDT Architecture)
CREATE TABLE IF NOT EXISTS wallet_ledger (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset VARCHAR(30) NOT NULL,
    network VARCHAR(50) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount NUMERIC(36, 18) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    status VARCHAR(30) NOT NULL,
    reference VARCHAR(100),
    external_transaction_id VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_time ON wallet_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_ext_id ON wallet_ledger(external_transaction_id);

-- 9. BLOCKCHAIN TRANSACTIONS (Web3 EVM Transaction Log)
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    network VARCHAR(50) NOT NULL,
    chain_id INT NOT NULL,
    asset VARCHAR(30) NOT NULL,
    transaction_hash VARCHAR(100) UNIQUE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount NUMERIC(36, 18) NOT NULL,
    from_address VARCHAR(100) NOT NULL,
    to_address VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL,
    confirmations INT NOT NULL DEFAULT 0,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blockchain_tx_user_time ON blockchain_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON blockchain_transactions(transaction_hash);
