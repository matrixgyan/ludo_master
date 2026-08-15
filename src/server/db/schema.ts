import {
  pgTable,
  varchar,
  text,
  integer,
  bigint,
  timestamp,
  jsonb,
  numeric,
  uniqueIndex,
  index,
  boolean,
} from 'drizzle-orm/pg-core';

// -----------------------------------------------------------------------------
// 1. USERS
// -----------------------------------------------------------------------------
export const users = pgTable(
  'users',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    externalAuthId: varchar('external_auth_id', { length: 128 }).unique(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    displayName: varchar('display_name', { length: 100 }).notNull(),
    avatarUrl: text('avatar_url'),
    status: varchar('status', { length: 30 }).default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_users_username').on(table.username),
    index('idx_users_last_seen').on(table.lastSeenAt),
  ]
);

// -----------------------------------------------------------------------------
// 2. GAMES (Server Authoritative Lifecycle)
// -----------------------------------------------------------------------------
export const games = pgTable(
  'games',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    gameType: varchar('game_type', { length: 50 }).default('LUDO_CLASSIC').notNull(),
    mode: varchar('mode', { length: 50 }).default('2_PLAYER').notNull(),
    status: varchar('status', { length: 30 }).default('WAITING').notNull(), // WAITING, MATCHING, READY, IN_PROGRESS, PAUSED, COMPLETED, CANCELLED, ABANDONED
    roomCode: varchar('room_code', { length: 20 }).unique(),
    maxPlayers: integer('max_players').default(4).notNull(),
    currentTurnPlayerId: varchar('current_turn_player_id', { length: 64 }),
    turnNumber: integer('turn_number').default(0).notNull(),
    winnerUserId: varchar('winner_user_id', { length: 64 }),
    version: integer('version').default(1).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_games_status').on(table.status),
    index('idx_games_created_at').on(table.createdAt),
    index('idx_games_updated_at').on(table.updatedAt),
    index('idx_games_room_code').on(table.roomCode),
  ]
);

// -----------------------------------------------------------------------------
// 3. GAME PLAYERS
// -----------------------------------------------------------------------------
export const gamePlayers = pgTable(
  'game_players',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    gameId: varchar('game_id', { length: 64 })
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => users.id),
    seat: integer('seat').notNull(), // 0, 1, 2, 3
    color: varchar('color', { length: 20 }).notNull(), // red, green, yellow, blue
    status: varchar('status', { length: 30 }).default('JOINED').notNull(), // JOINED, READY, PLAYING, FINISHED, DISCONNECTED, LEFT
    finishPosition: integer('finish_position'),
    finalScore: integer('final_score').default(0).notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    leftAt: timestamp('left_at', { withTimezone: true }),
    connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow(),
    disconnectedAt: timestamp('disconnected_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('idx_game_players_game_seat').on(table.gameId, table.seat),
    uniqueIndex('idx_game_players_game_color').on(table.gameId, table.color),
    uniqueIndex('idx_game_players_game_user').on(table.gameId, table.userId),
    index('idx_game_players_user_id').on(table.userId),
    index('idx_game_players_game_id').on(table.gameId),
  ]
);

// -----------------------------------------------------------------------------
// 4. GAME EVENTS (Append-Only Event Ledger)
// -----------------------------------------------------------------------------
export const gameEvents = pgTable(
  'game_events',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    gameId: varchar('game_id', { length: 64 })
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    sequenceNumber: bigint('sequence_number', { mode: 'number' }).notNull(),
    eventType: varchar('event_type', { length: 50 }).notNull(), // GAME_CREATED, PLAYER_JOINED, DICE_ROLLED, TOKEN_MOVED, TOKEN_CAPTURED, TOKEN_HOME, TURN_EXPIRED, PLAYER_FINISHED, GAME_COMPLETED, etc.
    actorUserId: varchar('actor_user_id', { length: 64 }),
    payload: jsonb('payload').notNull(),
    gameVersion: integer('game_version').notNull(),
    serverTimestamp: timestamp('server_timestamp', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_game_events_game_seq').on(table.gameId, table.sequenceNumber),
    index('idx_game_events_game_time').on(table.gameId, table.serverTimestamp),
  ]
);

// -----------------------------------------------------------------------------
// 5. GAME STATE SNAPSHOTS
// -----------------------------------------------------------------------------
export const gameStateSnapshots = pgTable(
  'game_state_snapshots',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    gameId: varchar('game_id', { length: 64 })
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    state: jsonb('state').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_snapshots_game_version').on(table.gameId, table.version),
  ]
);

// -----------------------------------------------------------------------------
// 6. PLAYER STATISTICS (Authoritative Aggregate Stats)
// -----------------------------------------------------------------------------
export const playerStatistics = pgTable(
  'player_statistics',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    gamesPlayed: integer('games_played').default(0).notNull(),
    gamesWon: integer('games_won').default(0).notNull(),
    gamesLost: integer('games_lost').default(0).notNull(),
    gamesAbandoned: integer('games_abandoned').default(0).notNull(),
    totalTurns: integer('total_turns').default(0).notNull(),
    totalDiceRolls: integer('total_dice_rolls').default(0).notNull(),
    totalCaptures: integer('total_captures').default(0).notNull(),
    totalFinishedTokens: integer('total_finished_tokens').default(0).notNull(),
    winRate: numeric('win_rate', { precision: 5, scale: 2 }).default('0.00').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_player_stats_user').on(table.userId),
  ]
);

// -----------------------------------------------------------------------------
// 7. LEADERBOARDS
// -----------------------------------------------------------------------------
export const leaderboards = pgTable(
  'leaderboards',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    leaderboardType: varchar('leaderboard_type', { length: 30 }).notNull(), // GLOBAL, DAILY, WEEKLY, MONTHLY, SEASONAL
    period: varchar('period', { length: 50 }).default('ALL_TIME').notNull(),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    score: bigint('score', { mode: 'number' }).default(0).notNull(),
    rank: integer('rank'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_leaderboards_type_period_user').on(table.leaderboardType, table.period, table.userId),
    index('idx_leaderboards_rank').on(table.leaderboardType, table.period, table.score),
  ]
);

// -----------------------------------------------------------------------------
// 8. WALLET LEDGER (Future Web3 Asset / USDT Ledger Architecture)
// -----------------------------------------------------------------------------
export const walletLedger = pgTable(
  'wallet_ledger',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    asset: varchar('asset', { length: 30 }).notNull(), // USDT, MATIC, ETH, etc.
    network: varchar('network', { length: 50 }).notNull(), // POLYGON, ETHEREUM, BSC, etc.
    transactionType: varchar('transaction_type', { length: 50 }).notNull(), // ENTRY_FEE, PRIZE_PAYOUT, DEPOSIT, WITHDRAWAL
    amount: numeric('amount', { precision: 36, scale: 18 }).notNull(),
    direction: varchar('direction', { length: 10 }).notNull(), // CREDIT, DEBIT
    status: varchar('status', { length: 30 }).notNull(), // PENDING, CONFIRMED, FAILED, CANCELLED
    reference: varchar('reference', { length: 100 }),
    externalTransactionId: varchar('external_transaction_id', { length: 150 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_wallet_ledger_user_time').on(table.userId, table.createdAt),
    index('idx_wallet_ledger_ext_id').on(table.externalTransactionId),
  ]
);

// -----------------------------------------------------------------------------
// 9. BLOCKCHAIN TRANSACTIONS (Future Web3 EVM Infrastructure Table)
// -----------------------------------------------------------------------------
export const blockchainTransactions = pgTable(
  'blockchain_transactions',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    network: varchar('network', { length: 50 }).notNull(),
    chainId: integer('chain_id').notNull(),
    asset: varchar('asset', { length: 30 }).notNull(),
    transactionHash: varchar('transaction_hash', { length: 100 }).unique().notNull(),
    transactionType: varchar('transaction_type', { length: 50 }).notNull(),
    amount: numeric('amount', { precision: 36, scale: 18 }).notNull(),
    fromAddress: varchar('from_address', { length: 100 }).notNull(),
    toAddress: varchar('to_address', { length: 100 }).notNull(),
    status: varchar('status', { length: 30 }).notNull(), // DETECTED, CONFIRMED, REVERTED
    confirmations: integer('confirmations').default(0).notNull(),
    detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_blockchain_tx_user_time').on(table.userId, table.createdAt),
    index('idx_blockchain_tx_hash').on(table.transactionHash),
  ]
);
