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
    Logger.info('Initializing Neon PostgreSQL database schema (including USDT Double-Entry Ledger)...');

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

      -- 2. Wallet Accounts (Unified USDT Balance Account)
      CREATE TABLE IF NOT EXISTS wallet_accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        asset TEXT NOT NULL DEFAULT 'USDT',
        available_balance NUMERIC(28, 8) NOT NULL DEFAULT '0.00000000',
        locked_balance NUMERIC(28, 8) NOT NULL DEFAULT '0.00000000',
        total_balance NUMERIC(28, 8) NOT NULL DEFAULT '0.00000000',
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS wallet_accounts_user_idx ON wallet_accounts(user_id);

      -- 3. Ledger Accounts
      CREATE TABLE IF NOT EXISTS ledger_accounts (
        id TEXT PRIMARY KEY,
        account_type TEXT NOT NULL,
        owner_id TEXT,
        asset TEXT NOT NULL DEFAULT 'USDT',
        balance NUMERIC(28, 8) NOT NULL DEFAULT '0.00000000',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS ledger_accounts_owner_type_idx ON ledger_accounts(owner_id, account_type);

      -- 4. Ledger Transactions
      CREATE TABLE IF NOT EXISTS ledger_transactions (
        id TEXT PRIMARY KEY,
        idempotency_key TEXT NOT NULL UNIQUE,
        tx_type TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'COMMITTED',
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS ledger_tx_created_at_idx ON ledger_transactions(created_at);

      -- 5. Ledger Entries
      CREATE TABLE IF NOT EXISTS ledger_entries (
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL REFERENCES ledger_transactions(id) ON DELETE CASCADE,
        account_id TEXT NOT NULL REFERENCES ledger_accounts(id),
        entry_type TEXT NOT NULL,
        amount NUMERIC(28, 8) NOT NULL,
        asset TEXT NOT NULL DEFAULT 'USDT',
        balance_after NUMERIC(28, 8) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS ledger_entries_tx_id_idx ON ledger_entries(transaction_id);
      CREATE INDEX IF NOT EXISTS ledger_entries_account_id_idx ON ledger_entries(account_id);

      -- 6. Deposits
      CREATE TABLE IF NOT EXISTS deposits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        network_key TEXT NOT NULL,
        chain_id INTEGER NOT NULL,
        tx_hash TEXT NOT NULL,
        log_index INTEGER NOT NULL,
        from_address TEXT NOT NULL,
        to_address TEXT NOT NULL,
        token_contract TEXT NOT NULL,
        raw_amount TEXT NOT NULL,
        amount NUMERIC(28, 8) NOT NULL,
        confirmations INTEGER NOT NULL DEFAULT 0,
        required_confirmations INTEGER NOT NULL DEFAULT 3,
        status TEXT NOT NULL DEFAULT 'DETECTED',
        block_number INTEGER NOT NULL,
        ledger_tx_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        confirmed_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT deposits_chain_tx_log_uniq UNIQUE (chain_id, tx_hash, log_index)
      );
      CREATE INDEX IF NOT EXISTS deposits_user_status_idx ON deposits(user_id, status);
      CREATE INDEX IF NOT EXISTS deposits_tx_hash_idx ON deposits(tx_hash);

      -- 7. Withdrawals
      CREATE TABLE IF NOT EXISTS withdrawals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        network_key TEXT NOT NULL,
        chain_id INTEGER NOT NULL,
        destination_address TEXT NOT NULL,
        amount NUMERIC(28, 8) NOT NULL,
        fee_amount NUMERIC(28, 8) NOT NULL DEFAULT '0.00000000',
        net_amount NUMERIC(28, 8) NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        tx_hash TEXT,
        nonce INTEGER,
        block_number INTEGER,
        confirmations INTEGER NOT NULL DEFAULT 0,
        required_confirmations INTEGER NOT NULL DEFAULT 3,
        ledger_tx_id TEXT,
        failure_reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS withdrawals_user_status_idx ON withdrawals(user_id, status);
      CREATE INDEX IF NOT EXISTS withdrawals_tx_hash_idx ON withdrawals(tx_hash);

      -- 8. Blockchain Transactions
      CREATE TABLE IF NOT EXISTS blockchain_transactions (
        id TEXT PRIMARY KEY,
        network_key TEXT NOT NULL,
        chain_id INTEGER NOT NULL,
        tx_hash TEXT NOT NULL,
        tx_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        from_address TEXT NOT NULL,
        to_address TEXT NOT NULL,
        token_contract TEXT,
        amount NUMERIC(28, 8),
        block_number INTEGER,
        confirmations INTEGER NOT NULL DEFAULT 0,
        gas_price TEXT,
        gas_used TEXT,
        raw_receipt JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT blockchain_tx_chain_hash_uniq UNIQUE (chain_id, tx_hash)
      );

      -- 9. Wallet Addresses
      CREATE TABLE IF NOT EXISTS wallet_addresses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        network_key TEXT NOT NULL,
        address TEXT NOT NULL,
        derivation_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT wallet_addr_user_net_uniq UNIQUE (user_id, network_key)
      );
      CREATE INDEX IF NOT EXISTS wallet_addr_address_idx ON wallet_addresses(address);

      -- 10. Treasury Accounts
      CREATE TABLE IF NOT EXISTS treasury_accounts (
        id TEXT PRIMARY KEY,
        network_key TEXT NOT NULL UNIQUE,
        chain_id INTEGER NOT NULL,
        address TEXT NOT NULL,
        usdt_balance NUMERIC(28, 8) NOT NULL DEFAULT '0.00000000',
        native_gas_balance NUMERIC(28, 8) NOT NULL DEFAULT '0.00000000',
        min_liquidity_threshold_usdt NUMERIC(28, 8) NOT NULL DEFAULT '10.00000000',
        target_liquidity_usdt NUMERIC(28, 8) NOT NULL DEFAULT '100.00000000',
        status TEXT NOT NULL DEFAULT 'HEALTHY',
        last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 11. Cross-Chain Rebalances
      CREATE TABLE IF NOT EXISTS cross_chain_rebalances (
        id TEXT PRIMARY KEY,
        source_network_key TEXT NOT NULL,
        dest_network_key TEXT NOT NULL,
        amount_usdt NUMERIC(28, 8) NOT NULL,
        fee_usdt NUMERIC(28, 8) NOT NULL DEFAULT '0.00000000',
        status TEXT NOT NULL DEFAULT 'CREATED',
        provider_name TEXT NOT NULL DEFAULT 'Socket/Li.Fi Router',
        quote_id TEXT,
        source_tx_hash TEXT,
        dest_tx_hash TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 12. Reconciliation Records
      CREATE TABLE IF NOT EXISTS reconciliation_records (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'BALANCED',
        total_user_liabilities_usdt NUMERIC(28, 8) NOT NULL,
        total_treasury_assets_usdt NUMERIC(28, 8) NOT NULL,
        difference_usdt NUMERIC(28, 8) NOT NULL,
        details JSONB,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 13. Wallet Audit Logs
      CREATE TABLE IF NOT EXISTS wallet_audit_logs (
        id TEXT PRIMARY KEY,
        actor_id TEXT NOT NULL,
        actor_role TEXT NOT NULL DEFAULT 'USER',
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        metadata JSONB,
        ip_address TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 14. Games, Game Players, Events, Stats, Leaderboards, Match History, Storage Objects
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
      CREATE INDEX IF NOT EXISTS games_status_idx ON games(status);
      CREATE INDEX IF NOT EXISTS games_created_at_idx ON games(created_at);

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
      CREATE INDEX IF NOT EXISTS game_players_game_user_idx ON game_players(game_id, user_id);

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
      CREATE INDEX IF NOT EXISTS game_events_game_id_idx ON game_events(game_id);

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
      CREATE INDEX IF NOT EXISTS lb_score_idx ON leaderboards(leaderboard_type, score);

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
      CREATE INDEX IF NOT EXISTS match_history_user_idx ON match_history(user_id, played_at);

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
    `);

    Logger.info('PostgreSQL schema migration completed successfully.');
  } catch (err: any) {
    Logger.error('PostgreSQL database migration error', err);
    throw err;
  } finally {
    client.release();
  }
}
