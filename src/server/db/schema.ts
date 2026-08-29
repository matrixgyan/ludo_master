import { pgTable, text, timestamp, integer, boolean, jsonb, numeric, index, uniqueIndex, bigint } from 'drizzle-orm/pg-core';

// -----------------------------------------------------------------------------
// 1. USERS (Permanent Source of Truth)
// -----------------------------------------------------------------------------
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  displayName: text('display_name'),
  email: text('email'),
  avatarUrl: text('avatar_url'),
  walletAddress: text('wallet_address'),
  coins: integer('coins').notNull().default(1000),
  diamonds: integer('diamonds').notNull().default(10),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// 2. WALLET ACCOUNTS (Unified USDT Balance Account)
// -----------------------------------------------------------------------------
export const walletAccounts = pgTable('wallet_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  asset: text('asset').notNull().default('USDT'),
  availableBalance: numeric('available_balance', { precision: 28, scale: 8 }).notNull().default('0.00000000'),
  lockedBalance: numeric('locked_balance', { precision: 28, scale: 8 }).notNull().default('0.00000000'),
  totalBalance: numeric('total_balance', { precision: 28, scale: 8 }).notNull().default('0.00000000'),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'FROZEN' | 'SUSPENDED'
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('wallet_accounts_user_idx').on(table.userId),
}));

// -----------------------------------------------------------------------------
// 3. LEDGER ACCOUNTS (Double-Entry Financial Accounts)
// -----------------------------------------------------------------------------
export const ledgerAccounts = pgTable('ledger_accounts', {
  id: text('id').primaryKey(),
  accountType: text('account_type').notNull(), // 'USER_AVAILABLE', 'USER_LOCKED', 'PLATFORM_TREASURY', 'PLATFORM_FEE', 'GAME_ESCROW', 'CROSS_CHAIN_ROUTING'
  ownerId: text('owner_id'), // userId or 'SYSTEM'
  asset: text('asset').notNull().default('USDT'),
  balance: numeric('balance', { precision: 28, scale: 8 }).notNull().default('0.00000000'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ownerTypeIdx: index('ledger_accounts_owner_type_idx').on(table.ownerId, table.accountType),
}));

// -----------------------------------------------------------------------------
// 4. LEDGER TRANSACTIONS (Atomic Financial Transaction Records)
// -----------------------------------------------------------------------------
export const ledgerTransactions = pgTable('ledger_transactions', {
  id: text('id').primaryKey(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  txType: text('tx_type').notNull(), // 'DEPOSIT', 'WITHDRAWAL_LOCK', 'WITHDRAWAL_SETTLE', 'WITHDRAWAL_REFUND', 'GAME_ENTRY', 'GAME_PAYOUT', 'REBALANCE'
  description: text('description'),
  status: text('status').notNull().default('COMMITTED'), // 'COMMITTED' | 'REVERTED'
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idempIdx: uniqueIndex('ledger_tx_idemp_uniq').on(table.idempotencyKey),
  createdAtIdx: index('ledger_tx_created_at_idx').on(table.createdAt),
}));

// -----------------------------------------------------------------------------
// 5. LEDGER ENTRIES (Double-Entry Immutable Debits and Credits)
// -----------------------------------------------------------------------------
export const ledgerEntries = pgTable('ledger_entries', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull().references(() => ledgerTransactions.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => ledgerAccounts.id),
  entryType: text('entry_type').notNull(), // 'DEBIT' | 'CREDIT'
  amount: numeric('amount', { precision: 28, scale: 8 }).notNull(),
  asset: text('asset').notNull().default('USDT'),
  balanceAfter: numeric('balance_after', { precision: 28, scale: 8 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  txIdIdx: index('ledger_entries_tx_id_idx').on(table.transactionId),
  accountIdx: index('ledger_entries_account_id_idx').on(table.accountId),
}));

// -----------------------------------------------------------------------------
// 6. DEPOSITS (Real Blockchain Deposit Ingress Records)
// -----------------------------------------------------------------------------
export const deposits = pgTable('deposits', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  networkKey: text('network_key').notNull(),
  chainId: integer('chain_id').notNull(),
  txHash: text('tx_hash').notNull(),
  logIndex: integer('log_index').notNull(),
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address').notNull(),
  tokenContract: text('token_contract').notNull(),
  rawAmount: text('raw_amount').notNull(),
  amount: numeric('amount', { precision: 28, scale: 8 }).notNull(),
  confirmations: integer('confirmations').notNull().default(0),
  requiredConfirmations: integer('required_confirmations').notNull().default(3),
  status: text('status').notNull().default('DETECTED'), // 'DETECTED' | 'CONFIRMING' | 'CONFIRMED' | 'REJECTED' | 'REORGED'
  blockNumber: integer('block_number').notNull(),
  ledgerTxId: text('ledger_tx_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  depositEventUniq: uniqueIndex('deposits_chain_tx_log_uniq').on(table.chainId, table.txHash, table.logIndex),
  userStatusIdx: index('deposits_user_status_idx').on(table.userId, table.status),
  txHashIdx: index('deposits_tx_hash_idx').on(table.txHash),
}));

// -----------------------------------------------------------------------------
// 7. WITHDRAWALS (Real Blockchain Withdrawal Egress Records)
// -----------------------------------------------------------------------------
export const withdrawals = pgTable('withdrawals', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  networkKey: text('network_key').notNull(),
  chainId: integer('chain_id').notNull(),
  destinationAddress: text('destination_address').notNull(),
  amount: numeric('amount', { precision: 28, scale: 8 }).notNull(), // Requested amount
  feeAmount: numeric('fee_amount', { precision: 28, scale: 8 }).notNull().default('0.00000000'),
  netAmount: numeric('net_amount', { precision: 28, scale: 8 }).notNull(), // Amount transferred on-chain
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'QUEUED' | 'REBALANCING' | 'SIGNING' | 'BROADCAST' | 'CONFIRMING' | 'CONFIRMED' | 'FAILED' | 'REJECTED' | 'REQUIRES_REVIEW'
  txHash: text('tx_hash'),
  nonce: integer('nonce'),
  blockNumber: integer('block_number'),
  confirmations: integer('confirmations').notNull().default(0),
  requiredConfirmations: integer('required_confirmations').notNull().default(3),
  ledgerTxId: text('ledger_tx_id'),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userWithdrawalIdx: index('withdrawals_user_status_idx').on(table.userId, table.status),
  txHashIdx: index('withdrawals_tx_hash_idx').on(table.txHash),
}));

// -----------------------------------------------------------------------------
// 8. BLOCKCHAIN TRANSACTIONS (On-Chain Audit Log)
// -----------------------------------------------------------------------------
export const blockchainTransactions = pgTable('blockchain_transactions', {
  id: text('id').primaryKey(),
  networkKey: text('network_key').notNull(),
  chainId: integer('chain_id').notNull(),
  txHash: text('tx_hash').notNull(),
  txType: text('tx_type').notNull(), // 'DEPOSIT' | 'WITHDRAWAL' | 'REBALANCE' | 'GAS_SWEEP' | 'TREASURY_TRANSFER'
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'CONFIRMED' | 'FAILED'
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address').notNull(),
  tokenContract: text('token_contract'),
  amount: numeric('amount', { precision: 28, scale: 8 }),
  blockNumber: integer('block_number'),
  confirmations: integer('confirmations').notNull().default(0),
  gasPrice: text('gas_price'),
  gasUsed: text('gas_used'),
  rawReceipt: jsonb('raw_receipt'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  chainTxUniq: uniqueIndex('blockchain_tx_chain_hash_uniq').on(table.chainId, table.txHash),
}));

// -----------------------------------------------------------------------------
// 9. WALLET ADDRESSES (User Deposit Address Allocations)
// -----------------------------------------------------------------------------
export const walletAddresses = pgTable('wallet_addresses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  networkKey: text('network_key').notNull(),
  address: text('address').notNull(),
  derivationIndex: integer('derivation_index').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userNetAddrUniq: uniqueIndex('wallet_addr_user_net_uniq').on(table.userId, table.networkKey),
  addressIdx: index('wallet_addr_address_idx').on(table.address),
}));

// -----------------------------------------------------------------------------
// 10. TREASURY ACCOUNTS (Platform On-Chain Liquidity Balances)
// -----------------------------------------------------------------------------
export const treasuryAccounts = pgTable('treasury_accounts', {
  id: text('id').primaryKey(),
  networkKey: text('network_key').notNull().unique(),
  chainId: integer('chain_id').notNull(),
  address: text('address').notNull(),
  usdtBalance: numeric('usdt_balance', { precision: 28, scale: 8 }).notNull().default('0.00000000'),
  nativeGasBalance: numeric('native_gas_balance', { precision: 28, scale: 8 }).notNull().default('0.00000000'),
  minLiquidityThresholdUsdt: numeric('min_liquidity_threshold_usdt', { precision: 28, scale: 8 }).notNull().default('10.00000000'),
  targetLiquidityUsdt: numeric('target_liquidity_usdt', { precision: 28, scale: 8 }).notNull().default('100.00000000'),
  status: text('status').notNull().default('HEALTHY'), // 'HEALTHY' | 'LOW_LIQUIDITY' | 'LOW_GAS' | 'CRITICAL'
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// 11. CROSS-CHAIN REBALANCING (Liquidity Routing State Machine)
// -----------------------------------------------------------------------------
export const crossChainRebalances = pgTable('cross_chain_rebalances', {
  id: text('id').primaryKey(),
  sourceNetworkKey: text('source_network_key').notNull(),
  destNetworkKey: text('dest_network_key').notNull(),
  amountUsdt: numeric('amount_usdt', { precision: 28, scale: 8 }).notNull(),
  feeUsdt: numeric('fee_usdt', { precision: 28, scale: 8 }).notNull().default('0.00000000'),
  status: text('status').notNull().default('CREATED'), // 'CREATED' | 'QUOTED' | 'APPROVED' | 'SUBMITTED' | 'SOURCE_CONFIRMED' | 'DESTINATION_PENDING' | 'DESTINATION_CONFIRMED' | 'LIQUIDITY_AVAILABLE' | 'FAILED' | 'COMPLETED'
  providerName: text('provider_name').notNull().default('Socket/Li.Fi Router'),
  quoteId: text('quote_id'),
  sourceTxHash: text('source_tx_hash'),
  destTxHash: text('dest_tx_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// 12. RECONCILIATION RECORDS (Audit & Anomaly Tracking)
// -----------------------------------------------------------------------------
export const reconciliationRecords = pgTable('reconciliation_records', {
  id: text('id').primaryKey(),
  status: text('status').notNull().default('BALANCED'), // 'BALANCED' | 'DISCREPANCY_FOUND' | 'RESOLVED'
  totalUserLiabilitiesUsdt: numeric('total_user_liabilities_usdt', { precision: 28, scale: 8 }).notNull(),
  totalTreasuryAssetsUsdt: numeric('total_treasury_assets_usdt', { precision: 28, scale: 8 }).notNull(),
  differenceUsdt: numeric('difference_usdt', { precision: 28, scale: 8 }).notNull(),
  details: jsonb('details'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// 13. WALLET AUDIT LOGS (Security & Administrative Activity)
// -----------------------------------------------------------------------------
export const walletAuditLogs = pgTable('wallet_audit_logs', {
  id: text('id').primaryKey(),
  actorId: text('actor_id').notNull(),
  actorRole: text('actor_role').notNull().default('USER'), // 'USER' | 'ADMIN' | 'SYSTEM_WORKER'
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  metadata: jsonb('metadata'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// 14. GAMES & PLAYERS (Existing Ludo Architecture)
// -----------------------------------------------------------------------------
export const games = pgTable('games', {
  id: text('id').primaryKey(),
  mode: text('mode').notNull().default('2_PLAYER'),
  status: text('status').notNull().default('WAITING'),
  winnerUserId: text('winner_user_id'),
  totalTurns: integer('total_turns').notNull().default(0),
  version: integer('version').notNull().default(1),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('games_status_idx').on(table.status),
  createdAtIdx: index('games_created_at_idx').on(table.createdAt),
}));

export const gamePlayers = pgTable('game_players', {
  id: text('id').primaryKey(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  color: text('color').notNull(),
  isHost: boolean('is_host').notNull().default(false),
  isAi: boolean('is_ai').notNull().default(false),
  finishPosition: integer('finish_position'),
  finalScore: integer('final_score').notNull().default(0),
  tokensHome: integer('tokens_home').notNull().default(0),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  gameUserIdx: index('game_players_game_user_idx').on(table.gameId, table.userId),
}));

export const gameEvents = pgTable('game_events', {
  id: text('id').primaryKey(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  sequenceNumber: integer('sequence_number').notNull(),
  eventType: text('event_type').notNull(),
  actorUserId: text('actor_user_id'),
  payload: jsonb('payload').notNull(),
  gameVersion: integer('game_version').notNull().default(1),
  serverTimestamp: timestamp('server_timestamp', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  gameSeqUnique: uniqueIndex('game_events_seq_uniq').on(table.gameId, table.sequenceNumber),
  gameIdIdx: index('game_events_game_id_idx').on(table.gameId),
}));

export const playerStatistics = pgTable('player_statistics', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  gamesPlayed: integer('games_played').notNull().default(0),
  gamesWon: integer('games_won').notNull().default(0),
  gamesLost: integer('games_lost').notNull().default(0),
  gamesAbandoned: integer('games_abandoned').notNull().default(0),
  totalCaptures: integer('total_captures').notNull().default(0),
  tokensReachedHome: integer('tokens_reached_home').notNull().default(0),
  winRate: numeric('win_rate', { precision: 5, scale: 2 }).notNull().default('0.00'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const leaderboards = pgTable('leaderboards', {
  id: text('id').primaryKey(),
  leaderboardType: text('leaderboard_type').notNull().default('GLOBAL'),
  period: text('period').notNull().default('ALL_TIME'),
  userId: text('user_id').notNull(),
  score: integer('score').notNull().default(0),
  rank: integer('rank').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  typePeriodUserUnique: uniqueIndex('lb_type_period_user_uniq').on(
    table.leaderboardType,
    table.period,
    table.userId
  ),
  scoreIdx: index('lb_score_idx').on(table.leaderboardType, table.score),
}));

export const matchHistory = pgTable('match_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  mode: text('mode').notNull(),
  result: text('result').notNull(),
  score: integer('score').notNull().default(0),
  tokensHome: integer('tokens_home').notNull().default(0),
  playedAt: timestamp('played_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userHistoryIdx: index('match_history_user_idx').on(table.userId, table.playedAt),
}));

export const storageObjects = pgTable('storage_objects', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  bucket: text('bucket').notNull(),
  userId: text('user_id'),
  contentType: text('content_type').notNull().default('application/octet-stream'),
  sizeBytes: integer('size_bytes').notNull().default(0),
  url: text('url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// 15. MATCH POOLS (Deterministic Competitive Pools)
// -----------------------------------------------------------------------------
export const matchPools = pgTable('match_pools', {
  id: text('id').primaryKey(), // e.g. 'pool_online_arena_4p_5u_v1'
  poolKey: text('pool_key').notNull().unique(), // e.g. 'ONLINE_ARENA:4:5:v1'
  gameMode: text('game_mode').notNull(), // 'ONLINE_ARENA' | 'LUDO_SUPREME'
  playerCount: integer('player_count').notNull(), // 2, 3, 4
  entryFee: numeric('entry_fee', { precision: 28, scale: 8 }).notNull(),
  ruleVersion: text('rule_version').notNull().default('v1'),
  platformFeeRate: numeric('platform_fee_rate', { precision: 5, scale: 4 }).notNull().default('0.1000'),
  isActive: boolean('is_active').notNull().default(true),
  minBufferRooms: integer('min_buffer_rooms').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  modeFeeIdx: index('match_pools_mode_fee_idx').on(table.gameMode, table.playerCount, table.entryFee),
}));

// -----------------------------------------------------------------------------
// 16. MATCHES (Automated Match Rooms & State Machine)
// -----------------------------------------------------------------------------
export const matches = pgTable('matches', {
  id: text('id').primaryKey(), // e.g. 'match_xxx'
  matchCode: text('match_code').notNull(), // short human readable code
  poolId: text('pool_id').notNull().references(() => matchPools.id),
  gameMode: text('game_mode').notNull(), // 'ONLINE_ARENA' | 'LUDO_SUPREME'
  playerCount: integer('player_count').notNull(), // 2, 3, 4
  entryFee: numeric('entry_fee', { precision: 28, scale: 8 }).notNull(),
  grossPrizePool: numeric('gross_prize_pool', { precision: 28, scale: 8 }).notNull().default('0.00000000'),
  platformFee: numeric('platform_fee', { precision: 28, scale: 8 }).notNull().default('0.00000000'),
  netPrizePool: numeric('net_prize_pool', { precision: 28, scale: 8 }).notNull().default('0.00000000'),
  status: text('status').notNull().default('OPEN'), 
  // 'OPEN' | 'FILLING' | 'FULL' | 'STARTING' | 'RUNNING' | 'ENDING' | 'FINISHED' | 'SETTLEMENT_PENDING' | 'SETTLED' | 'CANCELLED' | 'REQUIRES_REVIEW'
  joinedPlayers: integer('joined_players').notNull().default(0),
  maxPlayers: integer('max_players').notNull().default(4),
  serverSeed: text('server_seed'),
  currentTurnColor: text('current_turn_color'),
  turnNumber: integer('turn_number').notNull().default(0),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }), // 5-minute timer deadline for LUDO_SUPREME
  completedAt: timestamp('completed_at', { withTimezone: true }),
  settledAt: timestamp('settled_at', { withTimezone: true }),
  winnerUserId: text('winner_user_id'),
  version: integer('version').notNull().default(1),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  statusModeIdx: index('matches_status_mode_idx').on(table.status, table.gameMode, table.playerCount, table.entryFee),
  createdAtIdx: index('matches_created_at_idx').on(table.createdAt),
  poolStatusIdx: index('matches_pool_status_idx').on(table.poolId, table.status),
}));

// -----------------------------------------------------------------------------
// 17. MATCH PLAYERS (Atomic Match Membership & Reservation)
// -----------------------------------------------------------------------------
export const matchPlayers = pgTable('match_players', {
  id: text('id').primaryKey(), // e.g. 'mp_{matchId}_{userId}'
  matchId: text('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  color: text('color').notNull(), // 'red' | 'green' | 'yellow' | 'blue'
  seatIndex: integer('seat_index').notNull(), // 0, 1, 2, 3
  entryFee: numeric('entry_fee', { precision: 28, scale: 8 }).notNull(),
  reservationTxId: text('reservation_tx_id'), // ledger transaction reference
  status: text('status').notNull().default('RESERVED'), // 'RESERVED' | 'JOINED' | 'ACTIVE' | 'DISCONNECTED' | 'ABANDONED' | 'FINISHED'
  finalRank: integer('final_rank'), // 1, 2, 3, 4
  finalScore: integer('final_score').notNull().default(0),
  tokensHome: integer('tokens_home').notNull().default(0),
  totalDistanceMoved: integer('total_distance_moved').notNull().default(0),
  capturesMade: integer('captures_made').notNull().default(0),
  prizePayout: numeric('prize_payout', { precision: 28, scale: 8 }).notNull().default('0.00000000'),
  payoutTxId: text('payout_tx_id'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  matchUserUniq: uniqueIndex('match_players_match_user_uniq').on(table.matchId, table.userId),
  matchColorUniq: uniqueIndex('match_players_match_color_uniq').on(table.matchId, table.color),
  matchSeatUniq: uniqueIndex('match_players_match_seat_uniq').on(table.matchId, table.seatIndex),
  matchIdx: index('match_players_match_idx').on(table.matchId),
  userIdx: index('match_players_user_idx').on(table.userId),
}));

// -----------------------------------------------------------------------------
// 18. SCORE EVENTS (Authoritative Immutable Score Ledger for Supreme)
// -----------------------------------------------------------------------------
export const scoreEvents = pgTable('score_events', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  sequenceNumber: integer('sequence_number').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pawnId: text('pawn_id'),
  eventType: text('event_type').notNull(), 
  // 'MOVE_SCORE' | 'HOME_MULTIPLIER' | 'CAPTURE_BONUS' | 'PAWN_SCORE_RESET' | 'PENALTY'
  deltaScore: integer('delta_score').notNull(),
  resultingScore: integer('resulting_score').notNull(),
  details: jsonb('details'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  matchSeqUniq: uniqueIndex('score_events_match_seq_uniq').on(table.matchId, table.sequenceNumber),
  matchIdIdx: index('score_events_match_id_idx').on(table.matchId),
}));

// -----------------------------------------------------------------------------
// 19. MATCH SETTLEMENTS (Immutable Double-Entry Settlement Audit)
// -----------------------------------------------------------------------------
export const matchSettlements = pgTable('match_settlements', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().unique().references(() => matches.id, { onDelete: 'cascade' }),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  grossPool: numeric('gross_pool', { precision: 28, scale: 8 }).notNull(),
  platformFee: numeric('platform_fee', { precision: 28, scale: 8 }).notNull(),
  prizePool: numeric('prize_pool', { precision: 28, scale: 8 }).notNull(),
  winnerUserId: text('winner_user_id'),
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'COMPLETED' | 'FAILED' | 'REQUIRES_REVIEW'
  settlementDetails: jsonb('settlement_details'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idempUniq: uniqueIndex('match_settlements_idemp_uniq').on(table.idempotencyKey),
}));

// -----------------------------------------------------------------------------
// 20. GAME CONFIGURATIONS (Dynamic Platform Game Mode Settings)
// -----------------------------------------------------------------------------
export const gameConfigurations = pgTable('game_configurations', {
  key: text('key').primaryKey(), // e.g. 'PLATFORM_FEE_RATE', 'LUDO_SUPREME_DURATION'
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// 21. REFERRAL CODES (Unique User Referral Codes)
// -----------------------------------------------------------------------------
export const referralCodes = pgTable('referral_codes', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  code: text('code').notNull().unique(),
  totalEarned: numeric('total_earned', { precision: 28, scale: 8 }).notNull().default('0.00000000'),
  totalInvited: integer('total_invited').notNull().default(0),
  totalQualified: integer('total_qualified').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  codeIdx: uniqueIndex('referral_codes_code_uniq').on(table.code),
}));

// -----------------------------------------------------------------------------
// 22. REFERRALS (Production-grade, Anti-Fraud Qualified Referral Records)
// -----------------------------------------------------------------------------
export const referrals = pgTable('referrals', {
  id: text('id').primaryKey(),
  referrerId: text('referrer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refereeId: text('referee_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  referralCode: text('referral_code').notNull(),
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'QUALIFIED' | 'COMPLETED' | 'FLAGGED'
  depositCompleted: boolean('deposit_completed').notNull().default(false),
  depositAmount: numeric('deposit_amount', { precision: 28, scale: 8 }).notNull().default('0.00000000'),
  depositCompletedAt: timestamp('deposit_completed_at', { withTimezone: true }),
  firstMatchPlayed: boolean('first_match_played').notNull().default(false),
  matchGameId: text('match_game_id'),
  firstMatchPlayedAt: timestamp('first_match_played_at', { withTimezone: true }),
  rewardAmount: numeric('reward_amount', { precision: 28, scale: 8 }).notNull().default('20.00000000'),
  rewardCredited: boolean('reward_credited').notNull().default(false),
  rewardCreditedAt: timestamp('reward_credited_at', { withTimezone: true }),
  rewardTxId: text('reward_tx_id'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  referrerIdx: index('referrals_referrer_idx').on(table.referrerId),
  refereeIdx: uniqueIndex('referrals_referee_uniq').on(table.refereeId),
  statusIdx: index('referrals_status_idx').on(table.status),
}));


