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
        display_name TEXT,
        email TEXT,
        avatar_url TEXT,
        wallet_address TEXT,
        coins INTEGER NOT NULL DEFAULT 1000,
        diamonds INTEGER NOT NULL DEFAULT 10,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Ensure display_name column compatibility and relax username unique constraint
      ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
      ALTER TABLE users ALTER COLUMN display_name DROP NOT NULL;
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_unique;

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
      ALTER TABLE games ADD COLUMN IF NOT EXISTS winner_user_id TEXT;
      ALTER TABLE games ADD COLUMN IF NOT EXISTS total_turns INTEGER DEFAULT 0;
      ALTER TABLE games ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
      ALTER TABLE match_history DROP CONSTRAINT IF EXISTS match_history_game_id_fkey;
      ALTER TABLE score_events DROP CONSTRAINT IF EXISTS score_events_match_id_fkey;
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

      -- 15. Match Pools (Deterministic Match Pools)
      CREATE TABLE IF NOT EXISTS match_pools (
        id TEXT PRIMARY KEY,
        pool_key TEXT NOT NULL UNIQUE,
        game_mode TEXT NOT NULL,
        player_count INTEGER NOT NULL,
        entry_fee NUMERIC(28, 8) NOT NULL,
        rule_version TEXT NOT NULL DEFAULT 'v1',
        platform_fee_rate NUMERIC(5, 4) NOT NULL DEFAULT '0.1000',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        min_buffer_rooms INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS match_pools_mode_fee_idx ON match_pools(game_mode, player_count, entry_fee);

      -- 16. Matches (Automated Match Rooms & State Machine)
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        match_code TEXT NOT NULL,
        pool_id TEXT NOT NULL REFERENCES match_pools(id),
        game_mode TEXT NOT NULL,
        player_count INTEGER NOT NULL,
        entry_fee NUMERIC(28, 8) NOT NULL,
        gross_prize_pool NUMERIC(28, 8) NOT NULL DEFAULT '0.00000000',
        platform_fee NUMERIC(28, 8) NOT NULL DEFAULT '0.00000000',
        net_prize_pool NUMERIC(28, 8) NOT NULL DEFAULT '0.00000000',
        status TEXT NOT NULL DEFAULT 'OPEN',
        joined_players INTEGER NOT NULL DEFAULT 0,
        max_players INTEGER NOT NULL DEFAULT 4,
        server_seed TEXT,
        current_turn_color TEXT,
        turn_number INTEGER NOT NULL DEFAULT 0,
        started_at TIMESTAMPTZ,
        ends_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        settled_at TIMESTAMPTZ,
        winner_user_id TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS matches_status_mode_idx ON matches(status, game_mode, player_count, entry_fee);
      CREATE INDEX IF NOT EXISTS matches_created_at_idx ON matches(created_at);
      CREATE INDEX IF NOT EXISTS matches_pool_status_idx ON matches(pool_id, status);

      -- 17. Match Players (Atomic Membership & Financial Locks)
      CREATE TABLE IF NOT EXISTS match_players (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        color TEXT NOT NULL,
        seat_index INTEGER NOT NULL,
        entry_fee NUMERIC(28, 8) NOT NULL,
        reservation_tx_id TEXT,
        status TEXT NOT NULL DEFAULT 'RESERVED',
        final_rank INTEGER,
        final_score INTEGER NOT NULL DEFAULT 0,
        tokens_home INTEGER NOT NULL DEFAULT 0,
        total_distance_moved INTEGER NOT NULL DEFAULT 0,
        captures_made INTEGER NOT NULL DEFAULT 0,
        prize_payout NUMERIC(28, 8) NOT NULL DEFAULT '0.00000000',
        payout_tx_id TEXT,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT match_players_match_user_uniq UNIQUE (match_id, user_id),
        CONSTRAINT match_players_match_color_uniq UNIQUE (match_id, color),
        CONSTRAINT match_players_match_seat_uniq UNIQUE (match_id, seat_index)
      );
      CREATE INDEX IF NOT EXISTS match_players_match_idx ON match_players(match_id);
      CREATE INDEX IF NOT EXISTS match_players_user_idx ON match_players(user_id);

      -- 18. Score Events (Authoritative Score Ledger for Supreme)
      CREATE TABLE IF NOT EXISTS score_events (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        sequence_number INTEGER NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pawn_id TEXT,
        event_type TEXT NOT NULL,
        delta_score INTEGER NOT NULL,
        resulting_score INTEGER NOT NULL,
        details JSONB,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT score_events_match_seq_uniq UNIQUE (match_id, sequence_number)
      );
      CREATE INDEX IF NOT EXISTS score_events_match_id_idx ON score_events(match_id);

      -- 19. Match Settlements (Immutable Double-Entry Settlement Audit)
      CREATE TABLE IF NOT EXISTS match_settlements (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
        idempotency_key TEXT NOT NULL UNIQUE,
        gross_pool NUMERIC(28, 8) NOT NULL,
        platform_fee NUMERIC(28, 8) NOT NULL,
        prize_pool NUMERIC(28, 8) NOT NULL,
        winner_user_id TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        settlement_details JSONB,
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS match_settlements_idemp_idx ON match_settlements(idempotency_key);

      -- 20. Game Configurations
      CREATE TABLE IF NOT EXISTS game_configurations (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 21. Platform System Settings (Central Source of Truth for Crypto/Manual Gateways & Rates)
      CREATE TABLE IF NOT EXISTS platform_system_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 22. Payment Gateways (Admin Managed UPI / Bank / QR / Custom Channels)
      CREATE TABLE IF NOT EXISTS payment_gateways (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        account_holder_name TEXT NOT NULL,
        upi_id TEXT,
        account_number TEXT,
        ifsc_code TEXT,
        bank_name TEXT,
        branch_name TEXT,
        qr_code_url TEXT,
        min_deposit_amount NUMERIC(28, 8) NOT NULL DEFAULT 100.00,
        max_deposit_amount NUMERIC(28, 8) NOT NULL DEFAULT 100000.00,
        deposit_instructions TEXT,
        is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- 23. Manual Fiat Deposit Requests
      CREATE TABLE IF NOT EXISTS manual_deposit_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        gateway_id TEXT NOT NULL REFERENCES payment_gateways(id),
        amount NUMERIC(28, 8) NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        utr_number TEXT NOT NULL,
        sender_name TEXT,
        sender_upi_or_account TEXT,
        screenshot_url TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        admin_notes TEXT,
        reviewed_by TEXT,
        reviewed_at TIMESTAMPTZ,
        ledger_tx_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS manual_deposits_user_status_idx ON manual_deposit_requests(user_id, status);
      CREATE INDEX IF NOT EXISTS manual_deposits_utr_idx ON manual_deposit_requests(utr_number);

      -- 24. Manual Fiat Withdrawal Requests
      CREATE TABLE IF NOT EXISTS manual_withdrawal_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(28, 8) NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        payout_method TEXT NOT NULL,
        payout_upi_id TEXT,
        payout_account_number TEXT,
        payout_ifsc_code TEXT,
        payout_account_name TEXT,
        payout_bank_name TEXT,
        fee_amount NUMERIC(28, 8) NOT NULL DEFAULT 0.00,
        net_amount NUMERIC(28, 8) NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        payout_reference TEXT,
        payout_receipt_url TEXT,
        admin_notes TEXT,
        reviewed_by TEXT,
        reviewed_at TIMESTAMPTZ,
        ledger_tx_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS manual_withdrawals_user_status_idx ON manual_withdrawal_requests(user_id, status);

      -- 25. Referral Codes
      CREATE TABLE IF NOT EXISTS referral_codes (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        code TEXT NOT NULL UNIQUE,
        total_earned NUMERIC(28, 8) NOT NULL DEFAULT '0.00000000',
        total_invited INTEGER NOT NULL DEFAULT 0,
        total_qualified INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS referral_codes_code_uniq ON referral_codes(code);

      -- 26. Qualified Anti-Fraud Referrals
      CREATE TABLE IF NOT EXISTS referrals (
        id TEXT PRIMARY KEY,
        referrer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referee_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        referral_code TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        deposit_completed BOOLEAN NOT NULL DEFAULT FALSE,
        deposit_amount NUMERIC(28, 8) NOT NULL DEFAULT '0.00000000',
        deposit_completed_at TIMESTAMPTZ,
        first_match_played BOOLEAN NOT NULL DEFAULT FALSE,
        match_game_id TEXT,
        first_match_played_at TIMESTAMPTZ,
        reward_amount NUMERIC(28, 8) NOT NULL DEFAULT '20.00000000',
        reward_credited BOOLEAN NOT NULL DEFAULT FALSE,
        reward_credited_at TIMESTAMPTZ,
        reward_tx_id TEXT,
        ip_address TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals(referrer_id);
      CREATE UNIQUE INDEX IF NOT EXISTS referrals_referee_uniq ON referrals(referee_id);
      CREATE INDEX IF NOT EXISTS referrals_status_idx ON referrals(status);
    `);

    Logger.info('PostgreSQL schema migration completed successfully.');
  } catch (err: any) {
    Logger.error('PostgreSQL database migration error', err);
    throw err;
  } finally {
    client.release();
  }
}
