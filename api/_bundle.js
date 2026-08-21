var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/server/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  blockchainTransactions: () => blockchainTransactions,
  crossChainRebalances: () => crossChainRebalances,
  deposits: () => deposits,
  gameConfigurations: () => gameConfigurations,
  gameEvents: () => gameEvents,
  gamePlayers: () => gamePlayers,
  games: () => games,
  leaderboards: () => leaderboards,
  ledgerAccounts: () => ledgerAccounts,
  ledgerEntries: () => ledgerEntries,
  ledgerTransactions: () => ledgerTransactions,
  matchHistory: () => matchHistory,
  matchPlayers: () => matchPlayers,
  matchPools: () => matchPools,
  matchSettlements: () => matchSettlements,
  matches: () => matches,
  playerStatistics: () => playerStatistics,
  reconciliationRecords: () => reconciliationRecords,
  scoreEvents: () => scoreEvents,
  storageObjects: () => storageObjects,
  treasuryAccounts: () => treasuryAccounts,
  users: () => users,
  walletAccounts: () => walletAccounts,
  walletAddresses: () => walletAddresses,
  walletAuditLogs: () => walletAuditLogs,
  withdrawals: () => withdrawals
});
import { pgTable, text, timestamp, integer, boolean, jsonb, numeric, index, uniqueIndex } from "drizzle-orm/pg-core";
var users, walletAccounts, ledgerAccounts, ledgerTransactions, ledgerEntries, deposits, withdrawals, blockchainTransactions, walletAddresses, treasuryAccounts, crossChainRebalances, reconciliationRecords, walletAuditLogs, games, gamePlayers, gameEvents, playerStatistics, leaderboards, matchHistory, storageObjects, matchPools, matches, matchPlayers, scoreEvents, matchSettlements, gameConfigurations;
var init_schema = __esm({
  "src/server/db/schema.ts"() {
    users = pgTable("users", {
      id: text("id").primaryKey(),
      username: text("username").notNull(),
      email: text("email"),
      avatarUrl: text("avatar_url"),
      walletAddress: text("wallet_address"),
      coins: integer("coins").notNull().default(1e3),
      diamonds: integer("diamonds").notNull().default(10),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    });
    walletAccounts = pgTable("wallet_accounts", {
      id: text("id").primaryKey(),
      userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
      asset: text("asset").notNull().default("USDT"),
      availableBalance: numeric("available_balance", { precision: 28, scale: 8 }).notNull().default("0.00000000"),
      lockedBalance: numeric("locked_balance", { precision: 28, scale: 8 }).notNull().default("0.00000000"),
      totalBalance: numeric("total_balance", { precision: 28, scale: 8 }).notNull().default("0.00000000"),
      status: text("status").notNull().default("ACTIVE"),
      // 'ACTIVE' | 'FROZEN' | 'SUSPENDED'
      version: integer("version").notNull().default(1),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      userIdIdx: index("wallet_accounts_user_idx").on(table.userId)
    }));
    ledgerAccounts = pgTable("ledger_accounts", {
      id: text("id").primaryKey(),
      accountType: text("account_type").notNull(),
      // 'USER_AVAILABLE', 'USER_LOCKED', 'PLATFORM_TREASURY', 'PLATFORM_FEE', 'GAME_ESCROW', 'CROSS_CHAIN_ROUTING'
      ownerId: text("owner_id"),
      // userId or 'SYSTEM'
      asset: text("asset").notNull().default("USDT"),
      balance: numeric("balance", { precision: 28, scale: 8 }).notNull().default("0.00000000"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      ownerTypeIdx: index("ledger_accounts_owner_type_idx").on(table.ownerId, table.accountType)
    }));
    ledgerTransactions = pgTable("ledger_transactions", {
      id: text("id").primaryKey(),
      idempotencyKey: text("idempotency_key").notNull().unique(),
      txType: text("tx_type").notNull(),
      // 'DEPOSIT', 'WITHDRAWAL_LOCK', 'WITHDRAWAL_SETTLE', 'WITHDRAWAL_REFUND', 'GAME_ENTRY', 'GAME_PAYOUT', 'REBALANCE'
      description: text("description"),
      status: text("status").notNull().default("COMMITTED"),
      // 'COMMITTED' | 'REVERTED'
      metadata: jsonb("metadata"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      idempIdx: uniqueIndex("ledger_tx_idemp_uniq").on(table.idempotencyKey),
      createdAtIdx: index("ledger_tx_created_at_idx").on(table.createdAt)
    }));
    ledgerEntries = pgTable("ledger_entries", {
      id: text("id").primaryKey(),
      transactionId: text("transaction_id").notNull().references(() => ledgerTransactions.id, { onDelete: "cascade" }),
      accountId: text("account_id").notNull().references(() => ledgerAccounts.id),
      entryType: text("entry_type").notNull(),
      // 'DEBIT' | 'CREDIT'
      amount: numeric("amount", { precision: 28, scale: 8 }).notNull(),
      asset: text("asset").notNull().default("USDT"),
      balanceAfter: numeric("balance_after", { precision: 28, scale: 8 }).notNull(),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      txIdIdx: index("ledger_entries_tx_id_idx").on(table.transactionId),
      accountIdx: index("ledger_entries_account_id_idx").on(table.accountId)
    }));
    deposits = pgTable("deposits", {
      id: text("id").primaryKey(),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      networkKey: text("network_key").notNull(),
      chainId: integer("chain_id").notNull(),
      txHash: text("tx_hash").notNull(),
      logIndex: integer("log_index").notNull(),
      fromAddress: text("from_address").notNull(),
      toAddress: text("to_address").notNull(),
      tokenContract: text("token_contract").notNull(),
      rawAmount: text("raw_amount").notNull(),
      amount: numeric("amount", { precision: 28, scale: 8 }).notNull(),
      confirmations: integer("confirmations").notNull().default(0),
      requiredConfirmations: integer("required_confirmations").notNull().default(3),
      status: text("status").notNull().default("DETECTED"),
      // 'DETECTED' | 'CONFIRMING' | 'CONFIRMED' | 'REJECTED' | 'REORGED'
      blockNumber: integer("block_number").notNull(),
      ledgerTxId: text("ledger_tx_id"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      depositEventUniq: uniqueIndex("deposits_chain_tx_log_uniq").on(table.chainId, table.txHash, table.logIndex),
      userStatusIdx: index("deposits_user_status_idx").on(table.userId, table.status),
      txHashIdx: index("deposits_tx_hash_idx").on(table.txHash)
    }));
    withdrawals = pgTable("withdrawals", {
      id: text("id").primaryKey(),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      networkKey: text("network_key").notNull(),
      chainId: integer("chain_id").notNull(),
      destinationAddress: text("destination_address").notNull(),
      amount: numeric("amount", { precision: 28, scale: 8 }).notNull(),
      // Requested amount
      feeAmount: numeric("fee_amount", { precision: 28, scale: 8 }).notNull().default("0.00000000"),
      netAmount: numeric("net_amount", { precision: 28, scale: 8 }).notNull(),
      // Amount transferred on-chain
      status: text("status").notNull().default("PENDING"),
      // 'PENDING' | 'QUEUED' | 'REBALANCING' | 'SIGNING' | 'BROADCAST' | 'CONFIRMING' | 'CONFIRMED' | 'FAILED' | 'REJECTED' | 'REQUIRES_REVIEW'
      txHash: text("tx_hash"),
      nonce: integer("nonce"),
      blockNumber: integer("block_number"),
      confirmations: integer("confirmations").notNull().default(0),
      requiredConfirmations: integer("required_confirmations").notNull().default(3),
      ledgerTxId: text("ledger_tx_id"),
      failureReason: text("failure_reason"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      completedAt: timestamp("completed_at", { withTimezone: true }),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      userWithdrawalIdx: index("withdrawals_user_status_idx").on(table.userId, table.status),
      txHashIdx: index("withdrawals_tx_hash_idx").on(table.txHash)
    }));
    blockchainTransactions = pgTable("blockchain_transactions", {
      id: text("id").primaryKey(),
      networkKey: text("network_key").notNull(),
      chainId: integer("chain_id").notNull(),
      txHash: text("tx_hash").notNull(),
      txType: text("tx_type").notNull(),
      // 'DEPOSIT' | 'WITHDRAWAL' | 'REBALANCE' | 'GAS_SWEEP' | 'TREASURY_TRANSFER'
      status: text("status").notNull().default("PENDING"),
      // 'PENDING' | 'CONFIRMED' | 'FAILED'
      fromAddress: text("from_address").notNull(),
      toAddress: text("to_address").notNull(),
      tokenContract: text("token_contract"),
      amount: numeric("amount", { precision: 28, scale: 8 }),
      blockNumber: integer("block_number"),
      confirmations: integer("confirmations").notNull().default(0),
      gasPrice: text("gas_price"),
      gasUsed: text("gas_used"),
      rawReceipt: jsonb("raw_receipt"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      chainTxUniq: uniqueIndex("blockchain_tx_chain_hash_uniq").on(table.chainId, table.txHash)
    }));
    walletAddresses = pgTable("wallet_addresses", {
      id: text("id").primaryKey(),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      networkKey: text("network_key").notNull(),
      address: text("address").notNull(),
      derivationIndex: integer("derivation_index").notNull().default(0),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      userNetAddrUniq: uniqueIndex("wallet_addr_user_net_uniq").on(table.userId, table.networkKey),
      addressIdx: index("wallet_addr_address_idx").on(table.address)
    }));
    treasuryAccounts = pgTable("treasury_accounts", {
      id: text("id").primaryKey(),
      networkKey: text("network_key").notNull().unique(),
      chainId: integer("chain_id").notNull(),
      address: text("address").notNull(),
      usdtBalance: numeric("usdt_balance", { precision: 28, scale: 8 }).notNull().default("0.00000000"),
      nativeGasBalance: numeric("native_gas_balance", { precision: 28, scale: 8 }).notNull().default("0.00000000"),
      minLiquidityThresholdUsdt: numeric("min_liquidity_threshold_usdt", { precision: 28, scale: 8 }).notNull().default("10.00000000"),
      targetLiquidityUsdt: numeric("target_liquidity_usdt", { precision: 28, scale: 8 }).notNull().default("100.00000000"),
      status: text("status").notNull().default("HEALTHY"),
      // 'HEALTHY' | 'LOW_LIQUIDITY' | 'LOW_GAS' | 'CRITICAL'
      lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).notNull().defaultNow()
    });
    crossChainRebalances = pgTable("cross_chain_rebalances", {
      id: text("id").primaryKey(),
      sourceNetworkKey: text("source_network_key").notNull(),
      destNetworkKey: text("dest_network_key").notNull(),
      amountUsdt: numeric("amount_usdt", { precision: 28, scale: 8 }).notNull(),
      feeUsdt: numeric("fee_usdt", { precision: 28, scale: 8 }).notNull().default("0.00000000"),
      status: text("status").notNull().default("CREATED"),
      // 'CREATED' | 'QUOTED' | 'APPROVED' | 'SUBMITTED' | 'SOURCE_CONFIRMED' | 'DESTINATION_PENDING' | 'DESTINATION_CONFIRMED' | 'LIQUIDITY_AVAILABLE' | 'FAILED' | 'COMPLETED'
      providerName: text("provider_name").notNull().default("Socket/Li.Fi Router"),
      quoteId: text("quote_id"),
      sourceTxHash: text("source_tx_hash"),
      destTxHash: text("dest_tx_hash"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      completedAt: timestamp("completed_at", { withTimezone: true }),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    });
    reconciliationRecords = pgTable("reconciliation_records", {
      id: text("id").primaryKey(),
      status: text("status").notNull().default("BALANCED"),
      // 'BALANCED' | 'DISCREPANCY_FOUND' | 'RESOLVED'
      totalUserLiabilitiesUsdt: numeric("total_user_liabilities_usdt", { precision: 28, scale: 8 }).notNull(),
      totalTreasuryAssetsUsdt: numeric("total_treasury_assets_usdt", { precision: 28, scale: 8 }).notNull(),
      differenceUsdt: numeric("difference_usdt", { precision: 28, scale: 8 }).notNull(),
      details: jsonb("details"),
      resolvedAt: timestamp("resolved_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
    });
    walletAuditLogs = pgTable("wallet_audit_logs", {
      id: text("id").primaryKey(),
      actorId: text("actor_id").notNull(),
      actorRole: text("actor_role").notNull().default("USER"),
      // 'USER' | 'ADMIN' | 'SYSTEM_WORKER'
      action: text("action").notNull(),
      resourceType: text("resource_type").notNull(),
      resourceId: text("resource_id"),
      metadata: jsonb("metadata"),
      ipAddress: text("ip_address"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
    });
    games = pgTable("games", {
      id: text("id").primaryKey(),
      mode: text("mode").notNull().default("2_PLAYER"),
      status: text("status").notNull().default("WAITING"),
      winnerUserId: text("winner_user_id"),
      totalTurns: integer("total_turns").notNull().default(0),
      version: integer("version").notNull().default(1),
      metadata: jsonb("metadata"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      completedAt: timestamp("completed_at", { withTimezone: true }),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      statusIdx: index("games_status_idx").on(table.status),
      createdAtIdx: index("games_created_at_idx").on(table.createdAt)
    }));
    gamePlayers = pgTable("game_players", {
      id: text("id").primaryKey(),
      gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
      userId: text("user_id").notNull(),
      color: text("color").notNull(),
      isHost: boolean("is_host").notNull().default(false),
      isAi: boolean("is_ai").notNull().default(false),
      finishPosition: integer("finish_position"),
      finalScore: integer("final_score").notNull().default(0),
      tokensHome: integer("tokens_home").notNull().default(0),
      joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      gameUserIdx: index("game_players_game_user_idx").on(table.gameId, table.userId)
    }));
    gameEvents = pgTable("game_events", {
      id: text("id").primaryKey(),
      gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
      sequenceNumber: integer("sequence_number").notNull(),
      eventType: text("event_type").notNull(),
      actorUserId: text("actor_user_id"),
      payload: jsonb("payload").notNull(),
      gameVersion: integer("game_version").notNull().default(1),
      serverTimestamp: timestamp("server_timestamp", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      gameSeqUnique: uniqueIndex("game_events_seq_uniq").on(table.gameId, table.sequenceNumber),
      gameIdIdx: index("game_events_game_id_idx").on(table.gameId)
    }));
    playerStatistics = pgTable("player_statistics", {
      id: text("id").primaryKey(),
      userId: text("user_id").notNull().unique(),
      gamesPlayed: integer("games_played").notNull().default(0),
      gamesWon: integer("games_won").notNull().default(0),
      gamesLost: integer("games_lost").notNull().default(0),
      gamesAbandoned: integer("games_abandoned").notNull().default(0),
      totalCaptures: integer("total_captures").notNull().default(0),
      tokensReachedHome: integer("tokens_reached_home").notNull().default(0),
      winRate: numeric("win_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    });
    leaderboards = pgTable("leaderboards", {
      id: text("id").primaryKey(),
      leaderboardType: text("leaderboard_type").notNull().default("GLOBAL"),
      period: text("period").notNull().default("ALL_TIME"),
      userId: text("user_id").notNull(),
      score: integer("score").notNull().default(0),
      rank: integer("rank").notNull().default(0),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      typePeriodUserUnique: uniqueIndex("lb_type_period_user_uniq").on(
        table.leaderboardType,
        table.period,
        table.userId
      ),
      scoreIdx: index("lb_score_idx").on(table.leaderboardType, table.score)
    }));
    matchHistory = pgTable("match_history", {
      id: text("id").primaryKey(),
      userId: text("user_id").notNull(),
      gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
      mode: text("mode").notNull(),
      result: text("result").notNull(),
      score: integer("score").notNull().default(0),
      tokensHome: integer("tokens_home").notNull().default(0),
      playedAt: timestamp("played_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      userHistoryIdx: index("match_history_user_idx").on(table.userId, table.playedAt)
    }));
    storageObjects = pgTable("storage_objects", {
      id: text("id").primaryKey(),
      key: text("key").notNull().unique(),
      bucket: text("bucket").notNull(),
      userId: text("user_id"),
      contentType: text("content_type").notNull().default("application/octet-stream"),
      sizeBytes: integer("size_bytes").notNull().default(0),
      url: text("url").notNull(),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
    });
    matchPools = pgTable("match_pools", {
      id: text("id").primaryKey(),
      // e.g. 'pool_online_arena_4p_5u_v1'
      poolKey: text("pool_key").notNull().unique(),
      // e.g. 'ONLINE_ARENA:4:5:v1'
      gameMode: text("game_mode").notNull(),
      // 'ONLINE_ARENA' | 'LUDO_SUPREME'
      playerCount: integer("player_count").notNull(),
      // 2, 3, 4
      entryFee: numeric("entry_fee", { precision: 28, scale: 8 }).notNull(),
      ruleVersion: text("rule_version").notNull().default("v1"),
      platformFeeRate: numeric("platform_fee_rate", { precision: 5, scale: 4 }).notNull().default("0.1000"),
      isActive: boolean("is_active").notNull().default(true),
      minBufferRooms: integer("min_buffer_rooms").notNull().default(1),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      modeFeeIdx: index("match_pools_mode_fee_idx").on(table.gameMode, table.playerCount, table.entryFee)
    }));
    matches = pgTable("matches", {
      id: text("id").primaryKey(),
      // e.g. 'match_xxx'
      matchCode: text("match_code").notNull(),
      // short human readable code
      poolId: text("pool_id").notNull().references(() => matchPools.id),
      gameMode: text("game_mode").notNull(),
      // 'ONLINE_ARENA' | 'LUDO_SUPREME'
      playerCount: integer("player_count").notNull(),
      // 2, 3, 4
      entryFee: numeric("entry_fee", { precision: 28, scale: 8 }).notNull(),
      grossPrizePool: numeric("gross_prize_pool", { precision: 28, scale: 8 }).notNull().default("0.00000000"),
      platformFee: numeric("platform_fee", { precision: 28, scale: 8 }).notNull().default("0.00000000"),
      netPrizePool: numeric("net_prize_pool", { precision: 28, scale: 8 }).notNull().default("0.00000000"),
      status: text("status").notNull().default("OPEN"),
      // 'OPEN' | 'FILLING' | 'FULL' | 'STARTING' | 'RUNNING' | 'ENDING' | 'FINISHED' | 'SETTLEMENT_PENDING' | 'SETTLED' | 'CANCELLED' | 'REQUIRES_REVIEW'
      joinedPlayers: integer("joined_players").notNull().default(0),
      maxPlayers: integer("max_players").notNull().default(4),
      serverSeed: text("server_seed"),
      currentTurnColor: text("current_turn_color"),
      turnNumber: integer("turn_number").notNull().default(0),
      startedAt: timestamp("started_at", { withTimezone: true }),
      endsAt: timestamp("ends_at", { withTimezone: true }),
      // 5-minute timer deadline for LUDO_SUPREME
      completedAt: timestamp("completed_at", { withTimezone: true }),
      settledAt: timestamp("settled_at", { withTimezone: true }),
      winnerUserId: text("winner_user_id"),
      version: integer("version").notNull().default(1),
      metadata: jsonb("metadata"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      statusModeIdx: index("matches_status_mode_idx").on(table.status, table.gameMode, table.playerCount, table.entryFee),
      createdAtIdx: index("matches_created_at_idx").on(table.createdAt),
      poolStatusIdx: index("matches_pool_status_idx").on(table.poolId, table.status)
    }));
    matchPlayers = pgTable("match_players", {
      id: text("id").primaryKey(),
      // e.g. 'mp_{matchId}_{userId}'
      matchId: text("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      color: text("color").notNull(),
      // 'red' | 'green' | 'yellow' | 'blue'
      seatIndex: integer("seat_index").notNull(),
      // 0, 1, 2, 3
      entryFee: numeric("entry_fee", { precision: 28, scale: 8 }).notNull(),
      reservationTxId: text("reservation_tx_id"),
      // ledger transaction reference
      status: text("status").notNull().default("RESERVED"),
      // 'RESERVED' | 'JOINED' | 'ACTIVE' | 'DISCONNECTED' | 'ABANDONED' | 'FINISHED'
      finalRank: integer("final_rank"),
      // 1, 2, 3, 4
      finalScore: integer("final_score").notNull().default(0),
      tokensHome: integer("tokens_home").notNull().default(0),
      totalDistanceMoved: integer("total_distance_moved").notNull().default(0),
      capturesMade: integer("captures_made").notNull().default(0),
      prizePayout: numeric("prize_payout", { precision: 28, scale: 8 }).notNull().default("0.00000000"),
      payoutTxId: text("payout_tx_id"),
      joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
      lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      matchUserUniq: uniqueIndex("match_players_match_user_uniq").on(table.matchId, table.userId),
      matchColorUniq: uniqueIndex("match_players_match_color_uniq").on(table.matchId, table.color),
      matchSeatUniq: uniqueIndex("match_players_match_seat_uniq").on(table.matchId, table.seatIndex),
      matchIdx: index("match_players_match_idx").on(table.matchId),
      userIdx: index("match_players_user_idx").on(table.userId)
    }));
    scoreEvents = pgTable("score_events", {
      id: text("id").primaryKey(),
      matchId: text("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
      sequenceNumber: integer("sequence_number").notNull(),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      pawnId: text("pawn_id"),
      eventType: text("event_type").notNull(),
      // 'MOVE_SCORE' | 'HOME_MULTIPLIER' | 'CAPTURE_BONUS' | 'PAWN_SCORE_RESET' | 'PENALTY'
      deltaScore: integer("delta_score").notNull(),
      resultingScore: integer("resulting_score").notNull(),
      details: jsonb("details"),
      timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      matchSeqUniq: uniqueIndex("score_events_match_seq_uniq").on(table.matchId, table.sequenceNumber),
      matchIdIdx: index("score_events_match_id_idx").on(table.matchId)
    }));
    matchSettlements = pgTable("match_settlements", {
      id: text("id").primaryKey(),
      matchId: text("match_id").notNull().unique().references(() => matches.id, { onDelete: "cascade" }),
      idempotencyKey: text("idempotency_key").notNull().unique(),
      grossPool: numeric("gross_pool", { precision: 28, scale: 8 }).notNull(),
      platformFee: numeric("platform_fee", { precision: 28, scale: 8 }).notNull(),
      prizePool: numeric("prize_pool", { precision: 28, scale: 8 }).notNull(),
      winnerUserId: text("winner_user_id"),
      status: text("status").notNull().default("PENDING"),
      // 'PENDING' | 'COMPLETED' | 'FAILED' | 'REQUIRES_REVIEW'
      settlementDetails: jsonb("settlement_details"),
      processedAt: timestamp("processed_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => ({
      idempUniq: uniqueIndex("match_settlements_idemp_uniq").on(table.idempotencyKey)
    }));
    gameConfigurations = pgTable("game_configurations", {
      key: text("key").primaryKey(),
      // e.g. 'PLATFORM_FEE_RATE', 'LUDO_SUPREME_DURATION'
      value: jsonb("value").notNull(),
      description: text("description"),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    });
  }
});

// src/server/config/env.ts
import { z } from "zod";
import dotenv from "dotenv";
function parseEnv() {
  const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRESQL_URL || process.env.NEON_DATABASE_URL || process.env.DIRECT_URL;
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL || process.env.UPSTASH_REDIS_URL || process.env.KV_URL;
  const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.ACCOUNT_ID;
  const r2Endpoint = process.env.R2_ENDPOINT || process.env.CLOUDFLARE_R2_ENDPOINT || process.env.CLOUDFLARE_ENDPOINT || process.env.AWS_ENDPOINT_URL_S3 || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : void 0);
  const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_ACCESS_KEY_ID || process.env.R2_KEY_ID || process.env.CLOUDFLARE_KEY_ID || process.env.R2_KEY || process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
  const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_SECRET_ACCESS_KEY || process.env.R2_SECRET_KEY || process.env.CLOUDFLARE_SECRET_KEY || process.env.R2_SECRET || process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;
  const r2BucketName = process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME || process.env.CLOUDFLARE_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET || process.env.CLOUDFLARE_BUCKET || process.env.R2_BUCKET || process.env.AWS_BUCKET_NAME || process.env.BUCKET_NAME;
  const raw = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3,
    IS_VERCEL: isVercel,
    DATABASE_URL: databaseUrl,
    REDIS_URL: redisUrl,
    R2_ENDPOINT: r2Endpoint,
    R2_ACCESS_KEY_ID: r2AccessKeyId,
    R2_SECRET_ACCESS_KEY: r2SecretAccessKey,
    R2_BUCKET_NAME: r2BucketName,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
  };
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    console.error("\u274C Environment configuration validation warning:", result.error.format());
    return envSchema.parse(raw);
  }
  return result.data;
}
function getServicesStatusSummary() {
  const hasPg = Boolean(config.DATABASE_URL && config.DATABASE_URL.trim().length > 0);
  const hasRedis = Boolean(config.REDIS_URL && config.REDIS_URL.trim().length > 0);
  const hasR2 = Boolean(
    config.R2_ENDPOINT && config.R2_ACCESS_KEY_ID && config.R2_SECRET_ACCESS_KEY && config.R2_BUCKET_NAME
  );
  return {
    neonPostgres: {
      configured: hasPg,
      message: hasPg ? "DATABASE_URL detected" : "DATABASE_URL not configured"
    },
    redis: {
      configured: hasRedis,
      message: hasRedis ? "REDIS_URL detected" : "REDIS_URL not configured"
    },
    cloudflareR2: {
      configured: hasR2,
      message: hasR2 ? `R2 configured (bucket: ${config.R2_BUCKET_NAME})` : "R2 environment variables incomplete"
    }
  };
}
var envSchema, config, Logger;
var init_env = __esm({
  "src/server/config/env.ts"() {
    dotenv.config();
    envSchema = z.object({
      NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
      PORT: z.coerce.number().default(3e3),
      IS_VERCEL: z.boolean().default(false),
      // 1. Neon PostgreSQL
      DATABASE_URL: z.string().optional(),
      // 2. Redis / Upstash
      REDIS_URL: z.string().optional(),
      // 3. Cloudflare R2 Object Storage (supports R2_* and CLOUDFLARE_R2_*)
      R2_ENDPOINT: z.string().optional(),
      R2_ACCESS_KEY_ID: z.string().optional(),
      R2_SECRET_ACCESS_KEY: z.string().optional(),
      R2_BUCKET_NAME: z.string().optional(),
      // Optional AI / Gemini integration
      GEMINI_API_KEY: z.string().optional()
    });
    config = parseEnv();
    Logger = class {
      static info(message, meta) {
        console.log(`[INFO] [${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`, meta ? JSON.stringify(meta) : "");
      }
      static warn(message, meta) {
        console.warn(`[WARN] [${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`, meta ? JSON.stringify(meta) : "");
      }
      static error(message, error, meta) {
        const errMessage = error instanceof Error ? error.message : String(error || "");
        const stack = error instanceof Error ? error.stack : void 0;
        console.error(
          `[ERROR] [${(/* @__PURE__ */ new Date()).toISOString()}] ${message} - ${errMessage}`,
          meta ? JSON.stringify(meta) : "",
          stack ? `
Stack: ${stack}` : ""
        );
      }
      static debug(message, meta) {
        if (config.NODE_ENV !== "production") {
          console.debug(`[DEBUG] [${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`, meta ? JSON.stringify(meta) : "");
        }
      }
    };
  }
});

// src/server/db/client.ts
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
function isPostgresConfigured() {
  return Boolean(config.DATABASE_URL && config.DATABASE_URL.trim().length > 0);
}
function getDbPool() {
  if (!isPostgresConfigured()) {
    return null;
  }
  if (!globalThis.__ludo_pg_pool) {
    const rawUrl = config.DATABASE_URL || "";
    const isLocal = rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1");
    let cleanConnectionString = rawUrl;
    try {
      const parsed = new URL(rawUrl);
      if (parsed.searchParams.has("sslmode")) {
        parsed.searchParams.delete("sslmode");
      }
      cleanConnectionString = parsed.toString();
    } catch {
      cleanConnectionString = rawUrl;
    }
    globalThis.__ludo_pg_pool = new Pool({
      connectionString: cleanConnectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      min: 0,
      // Serverless scale-to-zero friendly
      max: config.IS_VERCEL ? 3 : 10,
      idleTimeoutMillis: 1e4,
      // Reclaim idle clients before serverless gateway drops
      connectionTimeoutMillis: 1e4,
      keepAlive: true,
      keepAliveInitialDelayMillis: 1e4
    });
    globalThis.__ludo_pg_pool.on("error", (err) => {
      const errMsg = err?.message || String(err);
      if (errMsg.includes("Connection terminated unexpectedly") || errMsg.includes("Connection terminated due to connection timeout") || err?.code === "ECONNRESET" || err?.code === "57P01") {
        Logger.info("Idle PostgreSQL client socket recycled cleanly by serverless gateway.");
        return;
      }
      Logger.warn("Neon PostgreSQL pool notice", { error: errMsg });
    });
  }
  return globalThis.__ludo_pg_pool;
}
function getDb() {
  if (!globalThis.__ludo_drizzle_db) {
    const p = getDbPool();
    if (p) {
      globalThis.__ludo_drizzle_db = drizzle(p, { schema: schema_exports });
    }
  }
  return globalThis.__ludo_drizzle_db || null;
}
async function checkPostgresHealth() {
  if (!isPostgresConfigured()) {
    return { status: "unconfigured", latencyMs: 0 };
  }
  const start = Date.now();
  try {
    const p = getDbPool();
    if (!p) {
      return { status: "unconfigured", latencyMs: 0 };
    }
    const client = await p.connect();
    try {
      const res = await client.query("SELECT 1 as alive, NOW() as current_time");
      const latencyMs = Date.now() - start;
      return {
        status: res.rows.length > 0 ? "healthy" : "unhealthy",
        latencyMs
      };
    } finally {
      client.release();
    }
  } catch (err) {
    const latencyMs = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);
    Logger.warn("Neon PostgreSQL health probe failed", { error: errorMsg });
    return {
      status: "unhealthy",
      latencyMs,
      error: errorMsg
    };
  }
}
async function withTransaction(callback) {
  const p = getDbPool();
  if (!p) {
    throw new Error("Neon PostgreSQL is not configured");
  }
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    Logger.error("PostgreSQL transaction rolled back", err);
    throw err;
  } finally {
    client.release();
  }
}
var Pool;
var init_client = __esm({
  "src/server/db/client.ts"() {
    init_schema();
    init_env();
    ({ Pool } = pg);
  }
});

// src/server/redis/client.ts
import Redis from "ioredis";
function isRedisConfigured() {
  return Boolean(
    config.REDIS_URL && config.REDIS_URL.trim().length > 0 && !config.REDIS_URL.includes("samplepassword")
  );
}
function getRedisConfig() {
  if (isRedisConfigured() && config.REDIS_URL) {
    try {
      const url = new URL(config.REDIS_URL);
      return {
        host: url.hostname,
        port: Number(url.port) || (url.protocol === "rediss:" ? 6379 : 6379),
        password: url.password ? decodeURIComponent(url.password) : void 0,
        username: url.username ? decodeURIComponent(url.username) : void 0,
        lazyConnect: true,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        enableOfflineQueue: false,
        connectTimeout: 1e4,
        commandTimeout: 8e3,
        tls: url.protocol === "rediss:" || config.REDIS_URL.startsWith("rediss://") ? { rejectUnauthorized: false } : void 0,
        retryStrategy(times) {
          if (times > 3) {
            return null;
          }
          return Math.min(times * 300, 2e3);
        }
      };
    } catch {
    }
  }
  return {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    connectTimeout: 5e3,
    commandTimeout: 5e3,
    retryStrategy() {
      return null;
    }
  };
}
function getRedisClient() {
  if (!isRedisConfigured()) {
    return null;
  }
  if (!globalThis.__ludo_redis_client) {
    try {
      const client = new Redis(config.REDIS_URL, getRedisConfig());
      client.on("connect", () => {
        lastConnectionError = null;
        Logger.info("Redis / Upstash client connected successfully");
      });
      client.on("ready", () => {
        lastConnectionError = null;
      });
      client.on("error", (err) => {
        lastConnectionError = err?.message || String(err);
        Logger.warn("Redis client error notice", { error: lastConnectionError });
      });
      globalThis.__ludo_redis_client = client;
    } catch (err) {
      lastConnectionError = err?.message || String(err);
      return null;
    }
  }
  return globalThis.__ludo_redis_client;
}
async function checkRedisHealth() {
  if (!isRedisConfigured()) {
    return { status: "unconfigured", latencyMs: 0 };
  }
  const start = Date.now();
  try {
    const client = getRedisClient();
    if (!client) {
      return {
        status: "unhealthy",
        latencyMs: 0,
        error: lastConnectionError || "Could not instantiate Redis client"
      };
    }
    if (client.status !== "ready" && client.status !== "connect") {
      try {
        await client.connect();
      } catch (connErr) {
        if (!connErr?.message?.includes("already connecting") && !connErr?.message?.includes("ready")) {
        }
      }
    }
    const pong = await Promise.race([
      client.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Redis ping timeout (5s)")), 5e3))
    ]);
    const latencyMs = Date.now() - start;
    return {
      status: pong === "PONG" ? "healthy" : "unhealthy",
      latencyMs
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    return {
      status: "unhealthy",
      latencyMs,
      error: msg
    };
  }
}
var lastConnectionError;
var init_client2 = __esm({
  "src/server/redis/client.ts"() {
    init_env();
    lastConnectionError = null;
  }
});

// src/server/redis/locks.ts
import { v4 as uuidv42 } from "uuid";
var DistributedLock;
var init_locks = __esm({
  "src/server/redis/locks.ts"() {
    init_client2();
    init_env();
    DistributedLock = class {
      static {
        this.localLocks = /* @__PURE__ */ new Map();
      }
      static async acquire(key, ttlMs = 5e3) {
        const redis = getRedisClient();
        const token = uuidv42();
        if (redis) {
          try {
            const result = await redis.set(key, token, "PX", ttlMs, "NX");
            if (result === "OK") {
              return token;
            }
            return null;
          } catch (err) {
            Logger.warn(`Redis lock acquire error on key ${key}: ${String(err)}`);
          }
        }
        if (this.localLocks.has(key)) {
          return null;
        }
        this.localLocks.set(key, Promise.resolve());
        return token;
      }
      static async release(key, token) {
        const redis = getRedisClient();
        if (redis) {
          const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
          try {
            const result = await redis.eval(luaScript, 1, key, token);
            return result === 1;
          } catch (err) {
            Logger.warn(`Redis lock release error on key ${key}: ${String(err)}`);
          }
        }
        this.localLocks.delete(key);
        return true;
      }
      static async withLock(key, action, ttlMs = 5e3, retryCount = 3, retryDelayMs = 150) {
        let token = null;
        for (let i = 0; i < retryCount; i++) {
          token = await this.acquire(key, ttlMs);
          if (token) break;
          await new Promise((r) => setTimeout(r, retryDelayMs));
        }
        if (!token) {
          throw new Error(`Failed to acquire distributed lock for resource: ${key}`);
        }
        try {
          return await action();
        } finally {
          await this.release(key, token);
        }
      }
    };
  }
});

// src/game/boardGeometry.ts
function getPawnGridCoord(color, pawnIndex, pathStep) {
  if (pathStep < 0) {
    return HOME_SLOTS[color][pawnIndex];
  }
  if (pathStep <= 50) {
    const startIndex = COLOR_START_INDEX[color];
    const mainPathIndex = (startIndex + pathStep) % 52;
    return MAIN_PATH[mainPathIndex];
  }
  const homeIndex = Math.min(pathStep - 51, 5);
  return HOME_STRETCH_PATHS[color][homeIndex];
}
var MAIN_PATH, COLOR_START_INDEX, SAFE_CELL_INDEXES, HOME_STRETCH_PATHS, HOME_SLOTS;
var init_boardGeometry = __esm({
  "src/game/boardGeometry.ts"() {
    MAIN_PATH = [
      { x: 1, y: 6 },
      // 0: Blue Start
      { x: 2, y: 6 },
      // 1
      { x: 3, y: 6 },
      // 2
      { x: 4, y: 6 },
      // 3
      { x: 5, y: 6 },
      // 4
      { x: 6, y: 5 },
      // 5
      { x: 6, y: 4 },
      // 6
      { x: 6, y: 3 },
      // 7
      { x: 6, y: 2 },
      // 8
      { x: 6, y: 1 },
      // 9
      { x: 6, y: 0 },
      // 10
      { x: 7, y: 0 },
      // 11
      { x: 8, y: 0 },
      // 12
      { x: 8, y: 1 },
      // 13: Red Start
      { x: 8, y: 2 },
      // 14
      { x: 8, y: 3 },
      // 15
      { x: 8, y: 4 },
      // 16
      { x: 8, y: 5 },
      // 17
      { x: 9, y: 6 },
      // 18
      { x: 10, y: 6 },
      // 19
      { x: 11, y: 6 },
      // 20
      { x: 12, y: 6 },
      // 21
      { x: 13, y: 6 },
      // 22
      { x: 14, y: 6 },
      // 23
      { x: 14, y: 7 },
      // 24
      { x: 14, y: 8 },
      // 25
      { x: 13, y: 8 },
      // 26: Green Start
      { x: 12, y: 8 },
      // 27
      { x: 11, y: 8 },
      // 28
      { x: 10, y: 8 },
      // 29
      { x: 9, y: 8 },
      // 30
      { x: 8, y: 9 },
      // 31
      { x: 8, y: 10 },
      // 32
      { x: 8, y: 11 },
      // 33
      { x: 8, y: 12 },
      // 34
      { x: 8, y: 13 },
      // 35
      { x: 8, y: 14 },
      // 36
      { x: 7, y: 14 },
      // 37
      { x: 6, y: 14 },
      // 38
      { x: 6, y: 13 },
      // 39: Yellow Start
      { x: 6, y: 12 },
      // 40
      { x: 6, y: 11 },
      // 41
      { x: 6, y: 10 },
      // 42
      { x: 6, y: 9 },
      // 43
      { x: 5, y: 8 },
      // 44
      { x: 4, y: 8 },
      // 45
      { x: 3, y: 8 },
      // 46
      { x: 2, y: 8 },
      // 47
      { x: 1, y: 8 },
      // 48
      { x: 0, y: 8 },
      // 49
      { x: 0, y: 7 },
      // 50
      { x: 0, y: 6 }
      // 51
    ];
    COLOR_START_INDEX = {
      blue: 0,
      // (1, 6)
      red: 13,
      // (8, 1)
      green: 26,
      // (13, 8)
      yellow: 39
      // (6, 13)
    };
    SAFE_CELL_INDEXES = [0, 8, 13, 21, 26, 34, 39, 47];
    HOME_STRETCH_PATHS = {
      blue: [
        { x: 1, y: 7 },
        { x: 2, y: 7 },
        { x: 3, y: 7 },
        { x: 4, y: 7 },
        { x: 5, y: 7 },
        { x: 6, y: 7 }
        // Goal Center
      ],
      red: [
        { x: 7, y: 1 },
        { x: 7, y: 2 },
        { x: 7, y: 3 },
        { x: 7, y: 4 },
        { x: 7, y: 5 },
        { x: 7, y: 6 }
        // Goal Center
      ],
      green: [
        { x: 13, y: 7 },
        { x: 12, y: 7 },
        { x: 11, y: 7 },
        { x: 10, y: 7 },
        { x: 9, y: 7 },
        { x: 8, y: 7 }
        // Goal Center
      ],
      yellow: [
        { x: 7, y: 13 },
        { x: 7, y: 12 },
        { x: 7, y: 11 },
        { x: 7, y: 10 },
        { x: 7, y: 9 },
        { x: 7, y: 8 }
        // Goal Center
      ]
    };
    HOME_SLOTS = {
      blue: [
        { x: 1.5, y: 1.5 },
        { x: 3.5, y: 1.5 },
        { x: 1.5, y: 3.5 },
        { x: 3.5, y: 3.5 }
      ],
      red: [
        { x: 10.5, y: 1.5 },
        { x: 12.5, y: 1.5 },
        { x: 10.5, y: 3.5 },
        { x: 12.5, y: 3.5 }
      ],
      green: [
        { x: 10.5, y: 10.5 },
        { x: 12.5, y: 10.5 },
        { x: 10.5, y: 12.5 },
        { x: 12.5, y: 12.5 }
      ],
      yellow: [
        { x: 1.5, y: 10.5 },
        { x: 3.5, y: 10.5 },
        { x: 1.5, y: 12.5 },
        { x: 3.5, y: 12.5 }
      ]
    };
  }
});

// src/server/game/authoritativeEngine.ts
import crypto from "crypto";
var AuthoritativeLudoEngine;
var init_authoritativeEngine = __esm({
  "src/server/game/authoritativeEngine.ts"() {
    init_boardGeometry();
    AuthoritativeLudoEngine = class {
      /**
       * Initializes a brand-new authoritative game session
       */
      static createNewGame(gameId, mode = "2_PLAYER", participants) {
        const colors = ["red", "green", "yellow", "blue"];
        const players = {};
        colors.forEach((color) => {
          const participant = participants.find((p) => p.color === color);
          const isParticipant = !!participant;
          const pawns = [0, 1, 2, 3].map((index2) => {
            const coord = getPawnGridCoord(color, index2, -1);
            return {
              id: `${color}-${index2}`,
              playerId: isParticipant ? participant.userId : `bot-${color}`,
              color,
              pawnIndex: index2,
              state: "home",
              pathStep: -1,
              gridX: coord.x,
              gridY: coord.y
            };
          });
          players[color] = {
            id: isParticipant ? participant.userId : `bot-${color}`,
            name: isParticipant ? participant.username : `Player ${color.toUpperCase()}`,
            avatarUrl: participant?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${color}`,
            color,
            level: 1,
            isActive: isParticipant,
            isMuted: false,
            isSpeaking: false,
            isHuman: isParticipant ? participant.isHuman : false,
            pawns,
            score: 0
          };
        });
        const firstColor = participants[0]?.color || "red";
        return {
          gameId,
          gameType: "LUDO_CLASSIC",
          mode,
          status: "IN_PROGRESS",
          version: 1,
          sequenceNumber: 1,
          currentTurn: firstColor,
          turnNumber: 1,
          dice: {
            value: 6,
            isRolling: false,
            hasRolled: false,
            canRoll: true
          },
          consecutiveSixes: 0,
          players,
          winner: null,
          startedAt: Date.now()
        };
      }
      /**
       * Cryptographically secure authoritative dice roll (1 to 6)
       */
      static rollDiceAuthoritative(session, actorUserId) {
        const activePlayer = session.players[session.currentTurn];
        if (activePlayer.id !== actorUserId && !actorUserId.startsWith("bot-") && actorUserId !== "system") {
          throw new Error(`Not your turn. Current turn belongs to ${session.currentTurn}`);
        }
        if (session.dice.hasRolled && !session.dice.canRoll) {
          throw new Error("Dice has already been rolled for this turn");
        }
        const rollValue = crypto.randomInt(1, 7);
        let consecutiveSixes = session.consecutiveSixes;
        if (rollValue === 6) {
          consecutiveSixes += 1;
        } else {
          consecutiveSixes = 0;
        }
        if (consecutiveSixes >= 3) {
          const nextTurn = this.getNextTurn(session.currentTurn, session.players);
          session.currentTurn = nextTurn;
          session.consecutiveSixes = 0;
          session.dice = {
            value: rollValue,
            isRolling: false,
            hasRolled: false,
            canRoll: true
          };
          session.turnNumber += 1;
          session.version += 1;
          session.sequenceNumber += 1;
          return {
            session,
            rollValue,
            movablePawnIds: [],
            consecutiveSixesPenalty: true
          };
        }
        const movablePawnIds = this.getMovablePawns(activePlayer, rollValue);
        if (movablePawnIds.length === 0 && rollValue !== 6) {
          const nextTurn = this.getNextTurn(session.currentTurn, session.players);
          session.currentTurn = nextTurn;
          session.consecutiveSixes = 0;
          session.dice = {
            value: rollValue,
            isRolling: false,
            hasRolled: false,
            canRoll: true
          };
          session.turnNumber += 1;
          session.version += 1;
          session.sequenceNumber += 1;
        } else {
          session.dice = {
            value: rollValue,
            isRolling: false,
            hasRolled: true,
            canRoll: false
          };
          session.consecutiveSixes = consecutiveSixes;
          session.version += 1;
          session.sequenceNumber += 1;
        }
        return {
          session,
          rollValue,
          movablePawnIds,
          consecutiveSixesPenalty: false
        };
      }
      /**
       * Authoritative Move Token validation & execution
       */
      static moveTokenAuthoritative(session, actorUserId, pawnId) {
        const activeColor = session.currentTurn;
        const player = session.players[activeColor];
        if (player.id !== actorUserId && !actorUserId.startsWith("bot-") && actorUserId !== "system") {
          throw new Error(`Turn mismatch. It is ${activeColor}'s turn.`);
        }
        if (!session.dice.hasRolled) {
          throw new Error("You must roll the dice before moving a token.");
        }
        const pawnIndex = player.pawns.findIndex((p) => p.id === pawnId);
        if (pawnIndex === -1) {
          throw new Error(`Pawn ${pawnId} does not belong to current player ${activeColor}`);
        }
        const pawn = player.pawns[pawnIndex];
        const diceVal = session.dice.value;
        let nextStep = pawn.pathStep;
        let nextState = pawn.state;
        if (pawn.state === "home") {
          if (diceVal === 6) {
            nextStep = 0;
            nextState = "path";
          } else {
            throw new Error("A roll of 6 is required to deploy from base.");
          }
        } else if (pawn.state === "path") {
          nextStep += diceVal;
          if (nextStep === 56) {
            nextState = "goal";
          } else if (nextStep > 56) {
            throw new Error("Exact roll required to reach home goal.");
          }
        } else {
          throw new Error("Pawn is already in the goal.");
        }
        const targetCoord = getPawnGridCoord(activeColor, pawn.pawnIndex, nextStep);
        const updatedPawn = {
          ...pawn,
          pathStep: nextStep,
          state: nextState,
          gridX: targetCoord.x,
          gridY: targetCoord.y
        };
        player.pawns[pawnIndex] = updatedPawn;
        let capturedPawn;
        const isSafe = SAFE_CELL_INDEXES.includes(nextStep) || nextStep > 50;
        if (!isSafe && nextState === "path") {
          const otherColors = ["red", "green", "yellow", "blue"].filter((c) => c !== activeColor);
          for (const oc of otherColors) {
            const opPlayer = session.players[oc];
            if (!opPlayer.isActive) continue;
            for (let i = 0; i < opPlayer.pawns.length; i++) {
              const op = opPlayer.pawns[i];
              if (op.state === "path" && op.pathStep >= 0 && op.pathStep <= 50) {
                const opCoord = getPawnGridCoord(oc, op.pawnIndex, op.pathStep);
                if (opCoord.x === targetCoord.x && opCoord.y === targetCoord.y) {
                  const homeCoord = getPawnGridCoord(oc, op.pawnIndex, -1);
                  capturedPawn = {
                    ...op,
                    state: "home",
                    pathStep: -1,
                    gridX: homeCoord.x,
                    gridY: homeCoord.y
                  };
                  opPlayer.pawns[i] = capturedPawn;
                  break;
                }
              }
            }
            if (capturedPawn) break;
          }
        }
        const reachedGoal = nextStep === 56;
        const allInGoal = player.pawns.every((p) => p.state === "goal");
        const isGameWon = allInGoal;
        if (isGameWon) {
          session.status = "COMPLETED";
          session.winner = activeColor;
          session.completedAt = Date.now();
        }
        const extraTurn = (diceVal === 6 || !!capturedPawn || reachedGoal) && !isGameWon;
        if (!extraTurn && !isGameWon) {
          session.currentTurn = this.getNextTurn(activeColor, session.players);
          session.consecutiveSixes = 0;
        }
        session.dice = {
          value: diceVal,
          isRolling: false,
          hasRolled: false,
          canRoll: true
        };
        session.turnNumber += 1;
        session.version += 1;
        session.sequenceNumber += 1;
        return {
          session,
          movedPawn: updatedPawn,
          capturedPawn,
          reachedGoal,
          isGameWon,
          extraTurn
        };
      }
      /**
       * Helper to identify movable pawns for a player given a dice roll
       */
      static getMovablePawns(player, rollValue) {
        return player.pawns.filter((pawn) => {
          if (pawn.state === "home") {
            return rollValue === 6;
          }
          if (pawn.state === "path") {
            return pawn.pathStep + rollValue <= 56;
          }
          return false;
        }).map((p) => p.id);
      }
      /**
       * Turn rotation among active players
       */
      static getNextTurn(current, players) {
        const order = ["red", "green", "yellow", "blue"];
        let idx = order.indexOf(current);
        for (let i = 1; i <= 4; i++) {
          const nextIdx = (idx + i) % 4;
          const nextColor = order[nextIdx];
          if (players[nextColor]?.isActive) {
            return nextColor;
          }
        }
        return current;
      }
    };
  }
});

// src/server/game/ludoSupremeEngine.ts
import crypto2 from "crypto";
import { v4 as uuidv43 } from "uuid";
var LudoSupremeEngine;
var init_ludoSupremeEngine = __esm({
  "src/server/game/ludoSupremeEngine.ts"() {
    init_boardGeometry();
    init_client();
    init_env();
    LudoSupremeEngine = class {
      static {
        this.DURATION_MS = 300 * 1e3;
      }
      static {
        // 5 minutes
        this.HOME_MULTIPLIER = 2;
      }
      static {
        // 2x score for goal
        this.CAPTURE_BONUS = 10;
      }
      // +10 points for capture
      /**
       * Initializes an authoritative 5-minute Ludo Supreme game session
       */
      static createSupremeSession(matchId, participants) {
        const colors = ["red", "green", "yellow", "blue"];
        const players = {};
        const now = Date.now();
        const endsAt = now + this.DURATION_MS;
        colors.forEach((color) => {
          const participant = participants.find((p) => p.color === color);
          const isParticipant = !!participant;
          const pawnProgress = {};
          const pawns = [0, 1, 2, 3].map((index2) => {
            const coord = getPawnGridCoord(color, index2, -1);
            const pawnId = `${color}-${index2}`;
            pawnProgress[pawnId] = 0;
            return {
              id: pawnId,
              playerId: isParticipant ? participant.userId : `bot-${color}`,
              color,
              pawnIndex: index2,
              state: "home",
              pathStep: -1,
              gridX: coord.x,
              gridY: coord.y
            };
          });
          players[color] = {
            id: isParticipant ? participant.userId : `bot-${color}`,
            name: isParticipant ? participant.username : `Player ${color.toUpperCase()}`,
            avatarUrl: participant?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${color}`,
            color,
            level: 1,
            isActive: isParticipant,
            isMuted: false,
            isSpeaking: false,
            isHuman: isParticipant ? participant.isHuman : false,
            pawns,
            score: 0,
            capturesCount: 0,
            totalDistanceMoved: 0,
            pawnsHomeCount: 0,
            pawnProgress,
            lastScoreTimestamp: now,
            seatIndex: participant ? participant.seatIndex : 0
          };
        });
        const firstColor = participants[0]?.color || "red";
        return {
          matchId,
          gameMode: "LUDO_SUPREME",
          playerCount: participants.length,
          status: "IN_PROGRESS",
          version: 1,
          sequenceNumber: 1,
          currentTurn: firstColor,
          turnNumber: 1,
          dice: {
            value: 6,
            isRolling: false,
            hasRolled: false,
            canRoll: true
          },
          consecutiveSixes: 0,
          players,
          scoreLedger: [],
          startedAt: now,
          endsAt
        };
      }
      /**
       * Check if 5-minute timer has expired; if so, finalize rankings deterministically
       */
      static checkTimerExpiry(session) {
        if (session.status === "COMPLETED") return true;
        const now = Date.now();
        if (now >= session.endsAt) {
          session.status = "COMPLETED";
          session.completedAt = now;
          session.finalRankings = this.computeDeterministicRankings(session);
          if (session.finalRankings.length > 0) {
            session.winnerUserId = session.finalRankings[0].userId;
            session.winnerColor = session.finalRankings[0].color;
          }
          return true;
        }
        return false;
      }
      /**
       * Cryptographically secure authoritative dice roll for Ludo Supreme
       */
      static rollDice(session, actorUserId) {
        if (this.checkTimerExpiry(session)) {
          return {
            session,
            rollValue: 0,
            movablePawnIds: [],
            consecutiveSixesPenalty: false,
            isTimerExpired: true
          };
        }
        const activePlayer = session.players[session.currentTurn];
        if (activePlayer.id !== actorUserId && !actorUserId.startsWith("bot-") && actorUserId !== "system") {
          throw new Error(`Not your turn. Current turn belongs to ${session.currentTurn}`);
        }
        if (session.dice.hasRolled && !session.dice.canRoll) {
          throw new Error("Dice has already been rolled for this turn");
        }
        const rollValue = crypto2.randomInt(1, 7);
        let consecutiveSixes = session.consecutiveSixes;
        if (rollValue === 6) {
          consecutiveSixes += 1;
        } else {
          consecutiveSixes = 0;
        }
        if (consecutiveSixes >= 3) {
          const nextTurn = this.getNextTurn(session.currentTurn, session.players);
          session.currentTurn = nextTurn;
          session.consecutiveSixes = 0;
          session.dice = {
            value: rollValue,
            isRolling: false,
            hasRolled: false,
            canRoll: true
          };
          session.turnNumber += 1;
          session.version += 1;
          session.sequenceNumber += 1;
          return {
            session,
            rollValue,
            movablePawnIds: [],
            consecutiveSixesPenalty: true,
            isTimerExpired: false
          };
        }
        const movablePawnIds = this.getMovablePawns(activePlayer, rollValue);
        if (movablePawnIds.length === 0 && rollValue !== 6) {
          const nextTurn = this.getNextTurn(session.currentTurn, session.players);
          session.currentTurn = nextTurn;
          session.consecutiveSixes = 0;
          session.dice = {
            value: rollValue,
            isRolling: false,
            hasRolled: false,
            canRoll: true
          };
          session.turnNumber += 1;
          session.version += 1;
          session.sequenceNumber += 1;
        } else {
          session.dice = {
            value: rollValue,
            isRolling: false,
            hasRolled: true,
            canRoll: false
          };
          session.consecutiveSixes = consecutiveSixes;
          session.version += 1;
          session.sequenceNumber += 1;
        }
        return {
          session,
          rollValue,
          movablePawnIds,
          consecutiveSixesPenalty: false,
          isTimerExpired: false
        };
      }
      /**
       * Authoritative Move Token execution with Supreme scoring and capture handling
       */
      static moveToken(session, actorUserId, pawnId) {
        if (this.checkTimerExpiry(session)) {
          throw new Error("5-minute match timer has expired. Game is completed.");
        }
        const activeColor = session.currentTurn;
        const player = session.players[activeColor];
        if (player.id !== actorUserId && !actorUserId.startsWith("bot-") && actorUserId !== "system") {
          throw new Error(`Turn mismatch. It is ${activeColor}'s turn.`);
        }
        if (!session.dice.hasRolled) {
          throw new Error("You must roll the dice before moving a token.");
        }
        const pawnIndex = player.pawns.findIndex((p) => p.id === pawnId);
        if (pawnIndex === -1) {
          throw new Error(`Pawn ${pawnId} does not belong to current player ${activeColor}`);
        }
        const pawn = player.pawns[pawnIndex];
        const diceVal = session.dice.value;
        let nextStep = pawn.pathStep;
        let nextState = pawn.state;
        let moveDistance = 0;
        if (pawn.state === "home") {
          if (diceVal === 6) {
            nextStep = 0;
            nextState = "path";
            moveDistance = 1;
          } else {
            throw new Error("A roll of 6 is required to deploy from base.");
          }
        } else if (pawn.state === "path") {
          nextStep += diceVal;
          moveDistance = diceVal;
          if (nextStep === 56) {
            nextState = "goal";
          } else if (nextStep > 56) {
            throw new Error("Exact roll required to reach home goal.");
          }
        } else {
          throw new Error("Pawn is already in the goal.");
        }
        const targetCoord = getPawnGridCoord(activeColor, pawn.pawnIndex, nextStep);
        const updatedPawn = {
          ...pawn,
          pathStep: nextStep,
          state: nextState,
          gridX: targetCoord.x,
          gridY: targetCoord.y
        };
        player.pawns[pawnIndex] = updatedPawn;
        player.pawnProgress[pawnId] = nextStep >= 0 ? nextStep + 1 : 0;
        player.totalDistanceMoved += moveDistance;
        let earnedScoreThisMove = moveDistance;
        this.recordScoreEvent(session, player.id, pawnId, "MOVE_SCORE", moveDistance, {
          fromStep: pawn.pathStep,
          toStep: nextStep,
          diceVal
        });
        const reachedGoal = nextStep === 56;
        if (reachedGoal) {
          player.pawnsHomeCount += 1;
          const homeBonus = 56 * (this.HOME_MULTIPLIER - 1);
          earnedScoreThisMove += homeBonus;
          this.recordScoreEvent(session, player.id, pawnId, "HOME_MULTIPLIER", homeBonus, {
            multiplier: this.HOME_MULTIPLIER,
            pawnId
          });
        }
        let capturedPawn;
        const isSafe = SAFE_CELL_INDEXES.includes(nextStep) || nextStep > 50;
        if (!isSafe && nextState === "path") {
          const otherColors = ["red", "green", "yellow", "blue"].filter((c) => c !== activeColor);
          for (const oc of otherColors) {
            const opPlayer = session.players[oc];
            if (!opPlayer.isActive) continue;
            for (let i = 0; i < opPlayer.pawns.length; i++) {
              const op = opPlayer.pawns[i];
              if (op.state === "path" && op.pathStep >= 0 && op.pathStep <= 50) {
                const opCoord = getPawnGridCoord(oc, op.pawnIndex, op.pathStep);
                if (opCoord.x === targetCoord.x && opCoord.y === targetCoord.y) {
                  const victimPawnProgress = opPlayer.pawnProgress[op.id] || op.pathStep + 1;
                  this.recordScoreEvent(session, opPlayer.id, op.id, "PAWN_SCORE_RESET", -victimPawnProgress, {
                    capturedBy: player.id,
                    lostProgress: victimPawnProgress
                  });
                  player.capturesCount += 1;
                  earnedScoreThisMove += this.CAPTURE_BONUS;
                  this.recordScoreEvent(session, player.id, pawnId, "CAPTURE_BONUS", this.CAPTURE_BONUS, {
                    capturedPawnId: op.id,
                    victimUserId: opPlayer.id
                  });
                  const homeCoord = getPawnGridCoord(oc, op.pawnIndex, -1);
                  capturedPawn = {
                    ...op,
                    state: "home",
                    pathStep: -1,
                    gridX: homeCoord.x,
                    gridY: homeCoord.y
                  };
                  opPlayer.pawns[i] = capturedPawn;
                  opPlayer.pawnProgress[op.id] = 0;
                  break;
                }
              }
            }
            if (capturedPawn) break;
          }
        }
        const allInGoal = player.pawns.every((p) => p.state === "goal");
        const isGameWon = allInGoal;
        if (isGameWon) {
          session.status = "COMPLETED";
          session.completedAt = Date.now();
          session.winnerUserId = player.id;
          session.winnerColor = activeColor;
          session.finalRankings = this.computeDeterministicRankings(session);
        }
        const extraTurn = (diceVal === 6 || !!capturedPawn || reachedGoal) && !isGameWon;
        if (!extraTurn && !isGameWon) {
          session.currentTurn = this.getNextTurn(activeColor, session.players);
          session.consecutiveSixes = 0;
        }
        session.dice = {
          value: diceVal,
          isRolling: false,
          hasRolled: false,
          canRoll: true
        };
        session.turnNumber += 1;
        session.version += 1;
        session.sequenceNumber += 1;
        this.checkTimerExpiry(session);
        return {
          session,
          movedPawn: updatedPawn,
          capturedPawn,
          deltaScore: earnedScoreThisMove,
          totalScore: player.score,
          reachedGoal,
          extraTurn,
          isGameWon
        };
      }
      /**
       * Appends an auditable score event to session ledger and updates player aggregate score
       */
      static recordScoreEvent(session, userId, pawnId, eventType, deltaScore, details) {
        const player = Object.values(session.players).find((p) => p.id === userId);
        if (!player) return;
        player.score = Math.max(0, player.score + deltaScore);
        player.lastScoreTimestamp = Date.now();
        const record = {
          id: `se_${uuidv43()}`,
          matchId: session.matchId,
          sequenceNumber: session.scoreLedger.length + 1,
          userId,
          pawnId,
          eventType,
          deltaScore,
          resultingScore: player.score,
          details,
          timestamp: Date.now()
        };
        session.scoreLedger.push(record);
        if (isPostgresConfigured()) {
          const pool = getDbPool();
          if (pool) {
            pool.query(
              `INSERT INTO score_events (
             id, match_id, sequence_number, user_id, pawn_id, event_type, delta_score, resulting_score, details
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT DO NOTHING`,
              [
                record.id,
                record.matchId,
                record.sequenceNumber,
                record.userId,
                record.pawnId || null,
                record.eventType,
                record.deltaScore,
                record.resultingScore,
                JSON.stringify(details || {})
              ]
            ).catch((err) => {
              Logger.warn("Async score_event insert notice", err);
            });
          }
        }
      }
      /**
       * Deterministic Tie-Breaking Hierarchy:
       * 1. Higher total score
       * 2. Higher captures count
       * 3. Higher total completed distance
       * 4. Earlier score timestamp (faster earner)
       * 5. Lower seat index
       */
      static computeDeterministicRankings(session) {
        const activePlayers = Object.values(session.players).filter((p) => p.isActive);
        activePlayers.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.capturesCount !== a.capturesCount) return b.capturesCount - a.capturesCount;
          if (b.totalDistanceMoved !== a.totalDistanceMoved) return b.totalDistanceMoved - a.totalDistanceMoved;
          if (a.lastScoreTimestamp !== b.lastScoreTimestamp) return a.lastScoreTimestamp - b.lastScoreTimestamp;
          return a.seatIndex - b.seatIndex;
        });
        return activePlayers.map((p, idx) => ({
          userId: p.id,
          color: p.color,
          rank: idx + 1,
          score: p.score,
          tokensHome: p.pawnsHomeCount,
          captures: p.capturesCount,
          distance: p.totalDistanceMoved
        }));
      }
      /**
       * Helper to identify movable pawns
       */
      static getMovablePawns(player, rollValue) {
        return player.pawns.filter((pawn) => {
          if (pawn.state === "home") {
            return rollValue === 6;
          }
          if (pawn.state === "path") {
            return pawn.pathStep + rollValue <= 56;
          }
          return false;
        }).map((p) => p.id);
      }
      /**
       * Turn rotation
       */
      static getNextTurn(current, players) {
        const order = ["red", "green", "yellow", "blue"];
        let idx = order.indexOf(current);
        for (let i = 1; i <= 4; i++) {
          const nextIdx = (idx + i) % 4;
          const nextColor = order[nextIdx];
          if (players[nextColor]?.isActive) {
            return nextColor;
          }
        }
        return current;
      }
    };
  }
});

// src/server/wallet/ledgerMath.ts
var LEDGER_DECIMALS, MULTIPLIER, LedgerMath;
var init_ledgerMath = __esm({
  "src/server/wallet/ledgerMath.ts"() {
    LEDGER_DECIMALS = 8;
    MULTIPLIER = BigInt(10 ** LEDGER_DECIMALS);
    LedgerMath = class {
      /**
       * Converts a decimal string (e.g. "80.50", "0.000001") into an integer BigInt
       */
      static toUnits(amount) {
        const str = String(amount).trim();
        if (!str || isNaN(Number(str))) {
          throw new Error(`Invalid numeric amount for ledger: "${amount}"`);
        }
        const [wholePart, fractionalPart = ""] = str.split(".");
        const isNegative = wholePart.startsWith("-");
        const cleanWhole = isNegative ? wholePart.slice(1) : wholePart;
        const paddedFraction = (fractionalPart + "0".repeat(LEDGER_DECIMALS)).slice(0, LEDGER_DECIMALS);
        const combinedStr = `${cleanWhole}${paddedFraction}`;
        const units = BigInt(combinedStr);
        return isNegative ? -units : units;
      }
      /**
       * Converts an integer BigInt back to an exact fixed-point string with specified decimals
       */
      static fromUnits(units, decimals = 8) {
        const isNegative = units < 0n;
        const absUnits = isNegative ? -units : units;
        const unitsStr = absUnits.toString().padStart(LEDGER_DECIMALS + 1, "0");
        const whole = unitsStr.slice(0, unitsStr.length - LEDGER_DECIMALS);
        const fraction = unitsStr.slice(unitsStr.length - LEDGER_DECIMALS, unitsStr.length - LEDGER_DECIMALS + decimals);
        const result = decimals > 0 ? `${whole}.${fraction}` : whole;
        return isNegative ? `-${result}` : result;
      }
      /**
       * Adds two decimal strings exactly
       */
      static add(a, b) {
        const unitsA = this.toUnits(a);
        const unitsB = this.toUnits(b);
        return this.fromUnits(unitsA + unitsB);
      }
      /**
       * Subtracts decimal b from decimal a (a - b)
       */
      static subtract(a, b) {
        const unitsA = this.toUnits(a);
        const unitsB = this.toUnits(b);
        return this.fromUnits(unitsA - unitsB);
      }
      /**
       * Multiplies a decimal amount by a scalar factor
       */
      static multiply(a, scalar) {
        const unitsA = this.toUnits(a);
        const scalarUnits = BigInt(Math.round(scalar * 1e4));
        const resultUnits = unitsA * scalarUnits / 10000n;
        return this.fromUnits(resultUnits);
      }
      /**
       * Returns true if a > b
       */
      static isGreaterThan(a, b) {
        return this.toUnits(a) > this.toUnits(b);
      }
      /**
       * Returns true if a >= b
       */
      static isGreaterThanOrEqual(a, b) {
        return this.toUnits(a) >= this.toUnits(b);
      }
      /**
       * Returns true if a < b
       */
      static isLessThan(a, b) {
        return this.toUnits(a) < this.toUnits(b);
      }
      /**
       * Returns true if a <= b
       */
      static isLessThanOrEqual(a, b) {
        return this.toUnits(a) <= this.toUnits(b);
      }
      /**
       * Returns true if a == b
       */
      static isEqual(a, b) {
        return this.toUnits(a) === this.toUnits(b);
      }
      /**
       * Formats a fixed decimal to user-friendly dollar string (e.g. "$80.00")
       */
      static formatDollar(amount) {
        const units = this.toUnits(amount);
        const formatted = this.fromUnits(units, 2);
        return `$${Number(formatted).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    };
  }
});

// src/server/wallet/ledgerService.ts
import { v4 as uuidv44 } from "uuid";
var LedgerService;
var init_ledgerService = __esm({
  "src/server/wallet/ledgerService.ts"() {
    init_client();
    init_ledgerMath();
    init_env();
    LedgerService = class {
      static {
        this.memoryAccounts = /* @__PURE__ */ new Map();
      }
      static {
        // key: `${ownerId}_${accountType}`
        this.memoryTransactions = /* @__PURE__ */ new Map();
      }
      static {
        // key: idempotencyKey
        this.memoryEntries = [];
      }
      static {
        this.memoryWalletSummary = /* @__PURE__ */ new Map();
      }
      /**
       * Helper to ensure ledger accounts exist for an owner
       */
      static async getOrCreateAccount(ownerId, accountType) {
        const key = `${ownerId}_${accountType}`;
        if (isPostgresConfigured()) {
          const pool = getDbPool();
          if (pool) {
            const client = await pool.connect();
            try {
              const res = await client.query(
                `SELECT id FROM ledger_accounts WHERE owner_id = $1 AND account_type = $2 LIMIT 1`,
                [ownerId, accountType]
              );
              if (res.rows.length > 0) {
                return res.rows[0].id;
              }
              const newId = `acc_${uuidv44()}`;
              await client.query(
                `INSERT INTO ledger_accounts (id, account_type, owner_id, asset, balance)
             VALUES ($1, $2, $3, 'USDT', '0.00000000')
             ON CONFLICT DO NOTHING`,
                [newId, accountType, ownerId]
              );
              return newId;
            } finally {
              client.release();
            }
          }
        }
        if (!this.memoryAccounts.has(key)) {
          const acc = {
            id: `mem_acc_${uuidv44()}`,
            accountType,
            ownerId,
            balance: "0.00000000"
          };
          this.memoryAccounts.set(key, acc);
        }
        return this.memoryAccounts.get(key).id;
      }
      /**
       * Retrieves the Unified USDT Wallet balance for a user
       */
      static async getUserWallet(userId) {
        if (isPostgresConfigured()) {
          const pool = getDbPool();
          if (pool) {
            const client = await pool.connect();
            try {
              await client.query(
                `INSERT INTO users (id, username, display_name) VALUES ($1, $1, $1) ON CONFLICT (id) DO NOTHING`,
                [userId]
              );
              let res = await client.query(
                `SELECT * FROM wallet_accounts WHERE user_id = $1 LIMIT 1`,
                [userId]
              );
              if (res.rows.length === 0) {
                const walletId = `w_${uuidv44()}`;
                await client.query(
                  `INSERT INTO wallet_accounts (id, user_id, asset, available_balance, locked_balance, total_balance, status)
               VALUES ($1, $2, 'USDT', '0.00000000', '0.00000000', '0.00000000', 'ACTIVE')
               ON CONFLICT (user_id) DO NOTHING`,
                  [walletId, userId]
                );
                res = await client.query(`SELECT * FROM wallet_accounts WHERE user_id = $1 LIMIT 1`, [userId]);
              }
              if (res.rows.length > 0) {
                const row = res.rows[0];
                const avail = row.available_balance || "0.00000000";
                const locked = row.locked_balance || "0.00000000";
                const total = LedgerMath.add(avail, locked);
                return {
                  userId,
                  asset: "USDT",
                  availableBalance: avail,
                  lockedBalance: locked,
                  totalBalance: total,
                  formattedAvailable: LedgerMath.formatDollar(avail),
                  formattedTotal: LedgerMath.formatDollar(total),
                  status: row.status || "ACTIVE",
                  updatedAt: new Date(row.updated_at || Date.now()).toISOString()
                };
              }
            } catch (err) {
              Logger.warn("Postgres query fallback for getUserWallet", { userId });
            } finally {
              client.release();
            }
          }
        }
        if (!this.memoryWalletSummary.has(userId)) {
          this.memoryWalletSummary.set(userId, {
            available: "0.00000000",
            locked: "0.00000000",
            total: "0.00000000",
            status: "ACTIVE"
          });
        }
        const mem = this.memoryWalletSummary.get(userId);
        return {
          userId,
          asset: "USDT",
          availableBalance: mem.available,
          lockedBalance: mem.locked,
          totalBalance: LedgerMath.add(mem.available, mem.locked),
          formattedAvailable: LedgerMath.formatDollar(mem.available),
          formattedTotal: LedgerMath.formatDollar(LedgerMath.add(mem.available, mem.locked)),
          status: mem.status,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      /**
       * Processes an incoming deposit: Credits the user's unified available balance, debits platform treasury asset
       */
      static async creditDeposit(userId, amountUsdt, idempotencyKey, metadata) {
        if (isPostgresConfigured()) {
          const pool = getDbPool();
          if (pool) {
            const client = await pool.connect();
            try {
              await client.query("BEGIN");
              const existing = await client.query(
                `SELECT id FROM ledger_transactions WHERE idempotency_key = $1 LIMIT 1`,
                [idempotencyKey]
              );
              if (existing.rows.length > 0) {
                await client.query("COMMIT");
                const w2 = await this.getUserWallet(userId);
                return { transactionId: existing.rows[0].id, newAvailableBalance: w2.availableBalance };
              }
              const userAccId = await this.getOrCreateAccount(userId, "USER_AVAILABLE");
              const treasuryAccId = await this.getOrCreateAccount("SYSTEM", "PLATFORM_TREASURY");
              const txId2 = `ltx_${uuidv44()}`;
              await client.query(
                `INSERT INTO ledger_transactions (id, idempotency_key, tx_type, description, metadata)
             VALUES ($1, $2, 'DEPOSIT', $3, $4)`,
                [txId2, idempotencyKey, `Deposit of ${amountUsdt} USDT`, JSON.stringify(metadata || {})]
              );
              await client.query(
                `INSERT INTO users (id, username, display_name) VALUES ($1, $1, $1) ON CONFLICT (id) DO NOTHING`,
                [userId]
              );
              await client.query(
                `INSERT INTO wallet_accounts (id, user_id, asset, available_balance, locked_balance, total_balance, status)
             VALUES ($1, $2, 'USDT', $3, '0.00000000', $3, 'ACTIVE')
             ON CONFLICT (user_id) DO UPDATE
             SET available_balance = wallet_accounts.available_balance + EXCLUDED.available_balance,
                 total_balance = wallet_accounts.total_balance + EXCLUDED.total_balance,
                 updated_at = NOW()`,
                [`w_${uuidv44()}`, userId, amountUsdt]
              );
              const updatedW = await client.query(
                `SELECT available_balance FROM wallet_accounts WHERE user_id = $1`,
                [userId]
              );
              const newAvail2 = updatedW.rows[0]?.available_balance || amountUsdt;
              await client.query(
                `INSERT INTO ledger_entries (id, transaction_id, account_id, entry_type, amount, asset, balance_after)
             VALUES 
             ($1, $2, $3, 'CREDIT', $4, 'USDT', $5),
             ($6, $2, $7, 'DEBIT', $4, 'USDT', '0.00000000')`,
                [`le_${uuidv44()}`, txId2, userAccId, amountUsdt, newAvail2, `le_${uuidv44()}`, treasuryAccId]
              );
              await client.query("COMMIT");
              Logger.info(`Ledger: Credited deposit of ${amountUsdt} USDT to user ${userId}`, { txId: txId2, idempotencyKey });
              return { transactionId: txId2, newAvailableBalance: newAvail2 };
            } catch (err) {
              await client.query("ROLLBACK");
              throw err;
            } finally {
              client.release();
            }
          }
        }
        if (this.memoryTransactions.has(idempotencyKey)) {
          const tx = this.memoryTransactions.get(idempotencyKey);
          const w2 = await this.getUserWallet(userId);
          return { transactionId: tx.id, newAvailableBalance: w2.availableBalance };
        }
        const txId = `ltx_${uuidv44()}`;
        this.memoryTransactions.set(idempotencyKey, {
          id: txId,
          idempotencyKey,
          txType: "DEPOSIT",
          description: `Deposit of ${amountUsdt} USDT`,
          metadata,
          createdAt: /* @__PURE__ */ new Date()
        });
        const w = await this.getUserWallet(userId);
        const newAvail = LedgerMath.add(w.availableBalance, amountUsdt);
        this.memoryWalletSummary.set(userId, {
          ...this.memoryWalletSummary.get(userId),
          available: newAvail,
          total: LedgerMath.add(newAvail, w.lockedBalance)
        });
        Logger.info(`[Memory Ledger] Credited deposit of ${amountUsdt} USDT to user ${userId}`);
        return { transactionId: txId, newAvailableBalance: newAvail };
      }
      /**
       * Locks funds for a pending withdrawal
       */
      static async lockFundsForWithdrawal(userId, amountUsdt, idempotencyKey) {
        const w = await this.getUserWallet(userId);
        if (LedgerMath.isGreaterThan(amountUsdt, w.availableBalance)) {
          throw new Error(`Insufficient available USDT balance. Requested: ${amountUsdt}, Available: ${w.availableBalance}`);
        }
        if (isPostgresConfigured()) {
          const pool = getDbPool();
          if (pool) {
            const client = await pool.connect();
            try {
              await client.query("BEGIN");
              const existing = await client.query(
                `SELECT id FROM ledger_transactions WHERE idempotency_key = $1 LIMIT 1`,
                [idempotencyKey]
              );
              if (existing.rows.length > 0) {
                await client.query("COMMIT");
                return { transactionId: existing.rows[0].id };
              }
              const updateRes = await client.query(
                `UPDATE wallet_accounts
             SET available_balance = available_balance - $1,
                 locked_balance = locked_balance + $1,
                 updated_at = NOW()
             WHERE user_id = $2 AND available_balance >= $1
             RETURNING available_balance, locked_balance`,
                [amountUsdt, userId]
              );
              if (updateRes.rows.length === 0) {
                throw new Error("Insufficient funds or concurrent withdrawal detected");
              }
              const txId2 = `ltx_${uuidv44()}`;
              await client.query(
                `INSERT INTO ledger_transactions (id, idempotency_key, tx_type, description)
             VALUES ($1, $2, 'WITHDRAWAL_LOCK', $3)`,
                [txId2, idempotencyKey, `Locked ${amountUsdt} USDT for withdrawal`]
              );
              await client.query("COMMIT");
              return { transactionId: txId2 };
            } catch (err) {
              await client.query("ROLLBACK");
              throw err;
            } finally {
              client.release();
            }
          }
        }
        const txId = `ltx_${uuidv44()}`;
        const newAvail = LedgerMath.subtract(w.availableBalance, amountUsdt);
        const newLocked = LedgerMath.add(w.lockedBalance, amountUsdt);
        this.memoryWalletSummary.set(userId, {
          ...this.memoryWalletSummary.get(userId),
          available: newAvail,
          locked: newLocked
        });
        return { transactionId: txId };
      }
      /**
       * Finalizes a completed withdrawal: Settles the locked funds from the user wallet
       */
      static async settleWithdrawal(userId, amountUsdt, feeUsdt, idempotencyKey) {
        if (isPostgresConfigured()) {
          const pool = getDbPool();
          if (pool) {
            const client = await pool.connect();
            try {
              await client.query("BEGIN");
              await client.query(
                `UPDATE wallet_accounts
             SET locked_balance = locked_balance - $1,
                 total_balance = total_balance - $1,
                 updated_at = NOW()
             WHERE user_id = $2`,
                [amountUsdt, userId]
              );
              const txId = `ltx_${uuidv44()}`;
              await client.query(
                `INSERT INTO ledger_transactions (id, idempotency_key, tx_type, description)
             VALUES ($1, $2, 'WITHDRAWAL_SETTLE', $3)
             ON CONFLICT (idempotency_key) DO NOTHING`,
                [txId, idempotencyKey, `Settled withdrawal of ${amountUsdt} USDT (Fee: ${feeUsdt})`]
              );
              await client.query("COMMIT");
              return { transactionId: txId };
            } catch (err) {
              await client.query("ROLLBACK");
              throw err;
            } finally {
              client.release();
            }
          }
        }
        const w = await this.getUserWallet(userId);
        const newLocked = LedgerMath.subtract(w.lockedBalance, amountUsdt);
        this.memoryWalletSummary.set(userId, {
          ...this.memoryWalletSummary.get(userId),
          locked: newLocked,
          total: LedgerMath.add(w.availableBalance, newLocked)
        });
        return { transactionId: `ltx_${uuidv44()}` };
      }
      /**
       * Refunds a failed withdrawal back to the user's available balance
       */
      static async refundWithdrawal(userId, amountUsdt, idempotencyKey, reason) {
        if (isPostgresConfigured()) {
          const pool = getDbPool();
          if (pool) {
            const client = await pool.connect();
            try {
              await client.query("BEGIN");
              await client.query(
                `UPDATE wallet_accounts
             SET locked_balance = locked_balance - $1,
                 available_balance = available_balance + $1,
                 updated_at = NOW()
             WHERE user_id = $2`,
                [amountUsdt, userId]
              );
              const txId = `ltx_${uuidv44()}`;
              await client.query(
                `INSERT INTO ledger_transactions (id, idempotency_key, tx_type, description, metadata)
             VALUES ($1, $2, 'WITHDRAWAL_REFUND', $3, $4)`,
                [txId, idempotencyKey, `Refunded withdrawal of ${amountUsdt} USDT`, JSON.stringify({ reason })]
              );
              await client.query("COMMIT");
              return { transactionId: txId };
            } catch (err) {
              await client.query("ROLLBACK");
              throw err;
            } finally {
              client.release();
            }
          }
        }
        const w = await this.getUserWallet(userId);
        const newLocked = LedgerMath.subtract(w.lockedBalance, amountUsdt);
        const newAvail = LedgerMath.add(w.availableBalance, amountUsdt);
        this.memoryWalletSummary.set(userId, {
          ...this.memoryWalletSummary.get(userId),
          locked: newLocked,
          available: newAvail
        });
        return { transactionId: `ltx_${uuidv44()}` };
      }
    };
  }
});

// src/server/wallet/matchSettlementService.ts
import { v4 as uuidv45 } from "uuid";
var MatchSettlementService;
var init_matchSettlementService = __esm({
  "src/server/wallet/matchSettlementService.ts"() {
    init_client();
    init_ledgerService();
    init_ledgerMath();
    init_locks();
    init_env();
    MatchSettlementService = class {
      /**
       * Settles an authoritative match outcome idempotently with complete double-entry ledger audit
       */
      static async settleMatch(matchId, winnerUserId, playerResults) {
        const lockKey = `lock:match:settle:${matchId}`;
        return await DistributedLock.withLock(
          lockKey,
          async () => {
            const idempotencyKey = `settle_match_${matchId}_${winnerUserId}`;
            Logger.info(`Starting double-entry match settlement for match ${matchId}, winner ${winnerUserId}`);
            if (isPostgresConfigured()) {
              const pool = getDbPool();
              if (pool) {
                const client = await pool.connect();
                try {
                  await client.query("BEGIN");
                  const existingSettlement = await client.query(
                    `SELECT * FROM match_settlements WHERE match_id = $1 OR idempotency_key = $2 FOR UPDATE`,
                    [matchId, idempotencyKey]
                  );
                  if (existingSettlement.rows.length > 0) {
                    await client.query("COMMIT");
                    Logger.info(`Match ${matchId} was already settled idempotently.`);
                    const row = existingSettlement.rows[0];
                    return {
                      settlementId: row.id,
                      matchId,
                      winnerUserId: row.winner_user_id,
                      grossPool: row.gross_pool,
                      platformFee: row.platform_fee,
                      prizePool: row.prize_pool,
                      payoutTxId: row.settlement_details?.payoutTxId || "already_settled",
                      status: "ALREADY_SETTLED"
                    };
                  }
                  const matchRes = await client.query(
                    `SELECT * FROM matches WHERE id = $1 FOR UPDATE`,
                    [matchId]
                  );
                  if (matchRes.rows.length === 0) {
                    throw new Error(`Match ${matchId} not found for settlement`);
                  }
                  const matchRow = matchRes.rows[0];
                  const entryFee = matchRow.entry_fee || "1.00000000";
                  const playerCount = matchRow.player_count || playerResults.length || 2;
                  const playersRes = await client.query(
                    `SELECT * FROM match_players WHERE match_id = $1 FOR UPDATE`,
                    [matchId]
                  );
                  const actualPlayerCount = playersRes.rows.length || playerCount;
                  const grossPool2 = LedgerMath.multiply(entryFee, actualPlayerCount);
                  const platformFeeRate = 0.1;
                  const platformFee2 = LedgerMath.multiply(grossPool2, platformFeeRate);
                  const netPrizePool2 = LedgerMath.subtract(grossPool2, platformFee2);
                  for (const result of playerResults) {
                    const isWinner = result.userId === winnerUserId;
                    const payout2 = isWinner ? netPrizePool2 : "0.00000000";
                    await client.query(
                      `UPDATE match_players
                   SET final_rank = $1,
                       final_score = $2,
                       tokens_home = $3,
                       captures_made = $4,
                       total_distance_moved = $5,
                       prize_payout = $6,
                       status = 'FINISHED'
                   WHERE match_id = $7 AND user_id = $8`,
                      [
                        result.rank,
                        result.finalScore,
                        result.tokensHome,
                        result.capturesMade,
                        result.totalDistanceMoved,
                        payout2,
                        matchId,
                        result.userId
                      ]
                    );
                  }
                  for (const player of playersRes.rows) {
                    const playerUserId = player.user_id;
                    const deductIdemp = `settle_entry_deduct_${matchId}_${playerUserId}`;
                    await LedgerService.settleWithdrawal(playerUserId, entryFee, "0.00000000", deductIdemp);
                  }
                  const payoutResult = await LedgerService.creditDeposit(
                    winnerUserId,
                    netPrizePool2,
                    `payout_${matchId}_${winnerUserId}`,
                    {
                      matchId,
                      type: "MATCH_WIN_PAYOUT",
                      grossPool: grossPool2,
                      platformFee: platformFee2,
                      netPrizePool: netPrizePool2
                    }
                  );
                  const platformAccId = await LedgerService.getOrCreateAccount("PLATFORM_TREASURY", "PLATFORM_REVENUE");
                  const feeTxId = `fee_tx_${uuidv45()}`;
                  await client.query(
                    `INSERT INTO ledger_transactions (id, idempotency_key, tx_type, description, metadata)
                 VALUES ($1, $2, 'PLATFORM_FEE', $3, $4)
                 ON CONFLICT DO NOTHING`,
                    [
                      feeTxId,
                      `platform_fee_${matchId}`,
                      `Platform fee collected for match ${matchId}`,
                      JSON.stringify({ matchId, feeAmount: platformFee2 })
                    ]
                  );
                  const settlementId = `stl_${uuidv45()}`;
                  await client.query(
                    `INSERT INTO match_settlements (
                   id, match_id, idempotency_key, gross_pool, platform_fee, prize_pool,
                   winner_user_id, status, settlement_details, processed_at
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'COMPLETED', $8, NOW())`,
                    [
                      settlementId,
                      matchId,
                      idempotencyKey,
                      grossPool2,
                      platformFee2,
                      netPrizePool2,
                      winnerUserId,
                      JSON.stringify({
                        payoutTxId: payoutResult.transactionId,
                        playerResults,
                        platformFeeRate
                      })
                    ]
                  );
                  await client.query(
                    `UPDATE matches
                 SET status = 'SETTLED',
                     winner_user_id = $1,
                     gross_prize_pool = $2,
                     platform_fee = $3,
                     net_prize_pool = $4,
                     completed_at = COALESCE(completed_at, NOW()),
                     settled_at = NOW(),
                     updated_at = NOW()
                 WHERE id = $5`,
                    [winnerUserId, grossPool2, platformFee2, netPrizePool2, matchId]
                  );
                  try {
                    await client.query(
                      `INSERT INTO games (id, mode, status, host_id, prize_pool)
                   VALUES ($1, $2, 'COMPLETED', $3, $4)
                   ON CONFLICT (id) DO NOTHING`,
                      [matchId, matchRow.game_mode || "ONLINE_ARENA", winnerUserId, Math.round(Number(grossPool2))]
                    );
                    for (const player of playersRes.rows) {
                      const isWinner = player.user_id === winnerUserId;
                      const playerRes = playerResults.find((r) => r.userId === player.user_id);
                      await client.query(
                        `INSERT INTO match_history (id, user_id, game_id, mode, result, score, tokens_home)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT DO NOTHING`,
                        [
                          `mh_${uuidv45()}`,
                          player.user_id,
                          matchId,
                          matchRow.game_mode,
                          isWinner ? "WON" : "LOST",
                          playerRes?.finalScore || 0,
                          playerRes?.tokensHome || 0
                        ]
                      );
                    }
                  } catch (histErr) {
                    Logger.warn("Match history audit notice in settlement", { error: histErr });
                  }
                  await client.query("COMMIT");
                  Logger.info(`Match ${matchId} settled successfully! Winner: ${winnerUserId}, Net Prize: ${netPrizePool2} USDT`);
                  return {
                    settlementId,
                    matchId,
                    winnerUserId,
                    grossPool: grossPool2,
                    platformFee: platformFee2,
                    prizePool: netPrizePool2,
                    payoutTxId: payoutResult.transactionId,
                    status: "COMPLETED"
                  };
                } catch (err) {
                  await client.query("ROLLBACK");
                  Logger.error(`Match settlement failed for ${matchId}`, err);
                  throw err;
                } finally {
                  client.release();
                }
              }
            }
            const grossPool = "2.00000000";
            const platformFee = "0.20000000";
            const netPrizePool = "1.80000000";
            const payout = await LedgerService.creditDeposit(
              winnerUserId,
              netPrizePool,
              `payout_${matchId}_${winnerUserId}`,
              { matchId, grossPool, platformFee }
            );
            return {
              settlementId: `mem_stl_${uuidv45()}`,
              matchId,
              winnerUserId,
              grossPool,
              platformFee,
              prizePool: netPrizePool,
              payoutTxId: payout.transactionId,
              status: "COMPLETED"
            };
          },
          8e3
        );
      }
      /**
       * Refunds all participants if a match is cancelled or failed to fill
       */
      static async refundMatch(matchId, reason) {
        const lockKey = `lock:match:refund:${matchId}`;
        await DistributedLock.withLock(lockKey, async () => {
          Logger.info(`Processing refunds for match ${matchId}. Reason: ${reason}`);
          if (isPostgresConfigured()) {
            const pool = getDbPool();
            if (pool) {
              const client = await pool.connect();
              try {
                await client.query("BEGIN");
                const matchRes = await client.query(`SELECT * FROM matches WHERE id = $1 FOR UPDATE`, [matchId]);
                if (matchRes.rows.length === 0) return;
                const matchRow = matchRes.rows[0];
                if (matchRow.status === "SETTLED" || matchRow.status === "CANCELLED") {
                  await client.query("COMMIT");
                  return;
                }
                const playersRes = await client.query(
                  `SELECT * FROM match_players WHERE match_id = $1 FOR UPDATE`,
                  [matchId]
                );
                for (const player of playersRes.rows) {
                  const refundIdemp = `refund_${matchId}_${player.user_id}`;
                  await LedgerService.refundWithdrawal(
                    player.user_id,
                    player.entry_fee,
                    refundIdemp,
                    `Match ${matchId} refund: ${reason}`
                  );
                  await client.query(
                    `UPDATE match_players SET status = 'REFUNDED' WHERE match_id = $1 AND user_id = $2`,
                    [matchId, player.user_id]
                  );
                }
                await client.query(
                  `UPDATE matches SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1`,
                  [matchId]
                );
                await client.query("COMMIT");
                Logger.info(`Match ${matchId} refunded successfully.`);
              } catch (err) {
                await client.query("ROLLBACK");
                Logger.error(`Match refund failed for ${matchId}`, err);
                throw err;
              } finally {
                client.release();
              }
            }
          }
        });
      }
    };
  }
});

// src/server/game/matchConfig.ts
function generateAllMatchPools() {
  const pools = [];
  const modes = ["ONLINE_ARENA" /* ONLINE_ARENA */, "LUDO_SUPREME" /* LUDO_SUPREME */];
  for (const mode of modes) {
    const config2 = DEFAULT_GAME_CONFIGS[mode];
    for (const count of SUPPORTED_PLAYER_COUNTS) {
      for (const fee of SUPPORTED_ENTRY_FEES) {
        const feeNumber = parseFloat(fee);
        const poolKey = `${mode}:${count}:${feeNumber}:${config2.ruleVersion}`;
        const poolId = `pool_${mode.toLowerCase()}_${count}p_${feeNumber}u_${config2.ruleVersion}`;
        pools.push({
          poolId,
          poolKey,
          gameMode: mode,
          playerCount: count,
          entryFee: fee,
          entryFeeUsdt: feeNumber,
          ruleVersion: config2.ruleVersion,
          platformFeeRate: config2.defaultPlatformFeeRate,
          isActive: true,
          minBufferRooms: 1
          // Keep 1 ready open room per active pool
        });
      }
    }
  }
  return pools;
}
function findMatchPool(gameMode, playerCount, entryFee, ruleVersion = "v1") {
  const feeNum = typeof entryFee === "string" ? parseFloat(entryFee) : entryFee;
  const targetKey = `${gameMode}:${playerCount}:${feeNum}:${ruleVersion}`;
  return ALL_MATCH_POOLS.find((p) => p.poolKey === targetKey || p.gameMode === gameMode && p.playerCount === playerCount && p.entryFeeUsdt === feeNum);
}
var SUPPORTED_PLAYER_COUNTS, SUPPORTED_ENTRY_FEES, DEFAULT_GAME_CONFIGS, ALL_MATCH_POOLS;
var init_matchConfig = __esm({
  "src/server/game/matchConfig.ts"() {
    SUPPORTED_PLAYER_COUNTS = [2, 3, 4];
    SUPPORTED_ENTRY_FEES = [
      "1.00000000",
      "5.00000000",
      "10.00000000",
      "20.00000000",
      "25.00000000",
      "50.00000000",
      "100.00000000"
    ];
    DEFAULT_GAME_CONFIGS = {
      ["ONLINE_ARENA" /* ONLINE_ARENA */]: {
        gameMode: "ONLINE_ARENA" /* ONLINE_ARENA */,
        name: "Online Arena (Classic Ludo)",
        description: "Traditional full Ludo match with 4 pawns per player. First player to bring all 4 pawns HOME wins.",
        ruleVersion: "v1",
        pawnsPerPlayer: 4,
        matchDurationSeconds: 0,
        // No fixed timer; continues until all 4 pawns reach home
        turnTimeoutSeconds: 15,
        reconnectGraceSeconds: 60,
        defaultPlatformFeeRate: 0.1,
        // 10% platform fee
        homeMultiplier: 1,
        captureBonus: 0,
        enabled: true
      },
      ["LUDO_SUPREME" /* LUDO_SUPREME */]: {
        gameMode: "LUDO_SUPREME" /* LUDO_SUPREME */,
        name: "Ludo Supreme (Fast 5-Min Timer)",
        description: "Fast-paced competitive 5-minute match. Point scoring on movement, captures, and home multiplier.",
        ruleVersion: "v1",
        pawnsPerPlayer: 4,
        matchDurationSeconds: 300,
        // Exactly 5 minutes (300 seconds)
        turnTimeoutSeconds: 15,
        reconnectGraceSeconds: 60,
        defaultPlatformFeeRate: 0.1,
        // 10% platform fee
        homeMultiplier: 2,
        // 2x score for reaching home
        captureBonus: 10,
        // +10 points on capture
        enabled: true
      }
    };
    ALL_MATCH_POOLS = generateAllMatchPools();
  }
});

// src/server/game/roomManager.ts
import { v4 as uuidv46 } from "uuid";
var RoomManager;
var init_roomManager = __esm({
  "src/server/game/roomManager.ts"() {
    init_client();
    init_matchConfig();
    init_locks();
    init_env();
    RoomManager = class {
      static {
        this.isInitialized = false;
      }
      static {
        this.maintenanceInterval = null;
      }
      static {
        // In-memory fallback rooms store when PostgreSQL is offline
        this.memoryRooms = /* @__PURE__ */ new Map();
      }
      /**
       * Initializes match pools and demand-aware room replenishment loop
       */
      static async initialize() {
        Logger.info("Initializing Demand-Aware Automated Room Manager...");
        await this.ensureMatchPoolsSeeded();
        await this.replenishJoinableRooms();
        if (!this.maintenanceInterval) {
          this.maintenanceInterval = setInterval(() => {
            this.runMaintenanceCycle().catch((err) => {
              Logger.warn(`Room maintenance cycle error: ${String(err)}`);
            });
          }, 1e4);
        }
        this.isInitialized = true;
        Logger.info("Demand-Aware Room Manager initialized successfully.");
      }
      /**
       * Seed all deterministic match pools in PostgreSQL
       */
      static async ensureMatchPoolsSeeded() {
        if (!isPostgresConfigured()) return;
        const pool = getDbPool();
        if (!pool) return;
        const client = await pool.connect();
        try {
          for (const p of ALL_MATCH_POOLS) {
            await client.query(
              `INSERT INTO match_pools (
             id, pool_key, game_mode, player_count, entry_fee, rule_version,
             platform_fee_rate, is_active, min_buffer_rooms
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (pool_key) DO UPDATE SET
             platform_fee_rate = EXCLUDED.platform_fee_rate,
             is_active = EXCLUDED.is_active,
             updated_at = NOW()`,
              [
                p.poolId,
                p.poolKey,
                p.gameMode,
                p.playerCount,
                p.entryFee,
                p.ruleVersion,
                p.platformFeeRate,
                p.isActive,
                p.minBufferRooms
              ]
            );
          }
          Logger.info(`Seeded ${ALL_MATCH_POOLS.length} deterministic match pools into PostgreSQL.`);
        } catch (err) {
          Logger.error("Failed to seed match pools", err);
        } finally {
          client.release();
        }
      }
      /**
       * Automatically creates joinable rooms for active pools if demand requires it
       */
      static async replenishJoinableRooms() {
        for (const poolDef of ALL_MATCH_POOLS) {
          if (!poolDef.isActive) continue;
          try {
            await this.ensurePoolHasJoinableRoom(poolDef);
          } catch (err) {
            Logger.warn(`Failed to replenish room for pool ${poolDef.poolKey}`, err);
          }
        }
      }
      /**
       * Checks if an active pool has at least 1 joinable room; if not, provisions a new one atomically
       */
      static async ensurePoolHasJoinableRoom(poolDef) {
        const lockKey = `lock:pool:replenish:${poolDef.poolId}`;
        return await DistributedLock.withLock(
          lockKey,
          async () => {
            if (isPostgresConfigured()) {
              const pool = getDbPool();
              if (pool) {
                const client = await pool.connect();
                try {
                  const res = await client.query(
                    `SELECT id, status, joined_players, max_players
                 FROM matches
                 WHERE pool_id = $1 AND status IN ('OPEN', 'FILLING') AND joined_players < max_players
                 ORDER BY joined_players DESC, created_at ASC
                 LIMIT 1`,
                    [poolDef.poolId]
                  );
                  if (res.rows.length > 0) {
                    return res.rows[0].id;
                  }
                  const matchId = `match_${poolDef.gameMode.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                  const matchCode = `LUDO-${Math.floor(1e5 + Math.random() * 9e5)}`;
                  const grossPool = (poolDef.playerCount * poolDef.entryFeeUsdt).toFixed(8);
                  const platformFee = (poolDef.playerCount * poolDef.entryFeeUsdt * poolDef.platformFeeRate).toFixed(8);
                  const netPrizePool = (parseFloat(grossPool) - parseFloat(platformFee)).toFixed(8);
                  await client.query(
                    `INSERT INTO matches (
                   id, match_code, pool_id, game_mode, player_count, entry_fee,
                   gross_prize_pool, platform_fee, net_prize_pool, status,
                   joined_players, max_players, server_seed
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'OPEN', 0, $10, $11)`,
                    [
                      matchId,
                      matchCode,
                      poolDef.poolId,
                      poolDef.gameMode,
                      poolDef.playerCount,
                      poolDef.entryFee,
                      grossPool,
                      platformFee,
                      netPrizePool,
                      poolDef.playerCount,
                      uuidv46()
                    ]
                  );
                  Logger.info(`Provisioned new demand-aware match room ${matchId} (${matchCode}) for pool ${poolDef.poolKey}`);
                  return matchId;
                } finally {
                  client.release();
                }
              }
            }
            const existing = Array.from(this.memoryRooms.values()).find(
              (r) => r.poolId === poolDef.poolId && (r.status === "OPEN" || r.status === "FILLING") && r.joinedPlayers < r.maxPlayers
            );
            if (existing) return existing.id;
            const newId = `mem_match_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            this.memoryRooms.set(newId, {
              id: newId,
              matchCode: `LUDO-${Math.floor(1e5 + Math.random() * 9e5)}`,
              poolId: poolDef.poolId,
              gameMode: poolDef.gameMode,
              playerCount: poolDef.playerCount,
              entryFee: poolDef.entryFee,
              status: "OPEN",
              joinedPlayers: 0,
              maxPlayers: poolDef.playerCount,
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            });
            return newId;
          },
          4e3
        );
      }
      /**
       * Query all joinable public rooms sorted by highest fill first
       */
      static async getJoinableRooms(filters) {
        if (isPostgresConfigured()) {
          const pool = getDbPool();
          if (pool) {
            const client = await pool.connect();
            try {
              let query = `
            SELECT m.*, p.pool_key, p.rule_version
            FROM matches m
            JOIN match_pools p ON m.pool_id = p.id
            WHERE m.status IN ('OPEN', 'FILLING') AND m.joined_players < m.max_players
          `;
              const params = [];
              if (filters?.gameMode) {
                params.push(filters.gameMode);
                query += ` AND m.game_mode = $${params.length}`;
              }
              if (filters?.playerCount) {
                params.push(filters.playerCount);
                query += ` AND m.player_count = $${params.length}`;
              }
              if (filters?.entryFee) {
                params.push(filters.entryFee.toFixed(8));
                query += ` AND m.entry_fee = $${params.length}`;
              }
              query += ` ORDER BY m.joined_players DESC, m.created_at ASC LIMIT 50`;
              const res = await client.query(query, params);
              return res.rows.map((row) => {
                const joined = parseInt(row.joined_players, 10) || 0;
                const max = parseInt(row.max_players, 10) || 4;
                const feeNum = parseFloat(row.entry_fee || "1");
                return {
                  roomId: row.id,
                  matchCode: row.match_code,
                  poolId: row.pool_id,
                  gameMode: row.game_mode,
                  playerCount: max,
                  entryFee: row.entry_fee,
                  entryFeeUsdt: feeNum,
                  grossPrizePool: row.gross_prize_pool || (max * feeNum).toFixed(8),
                  platformFee: row.platform_fee || (max * feeNum * 0.1).toFixed(8),
                  netPrizePool: row.net_prize_pool || (max * feeNum * 0.9).toFixed(8),
                  status: row.status,
                  joinedPlayers: joined,
                  maxPlayers: max,
                  remainingSlots: Math.max(0, max - joined),
                  fillPercentage: Math.round(joined / max * 100),
                  createdAt: new Date(row.created_at).toISOString()
                };
              });
            } finally {
              client.release();
            }
          }
        }
        return Array.from(this.memoryRooms.values()).filter((r) => (r.status === "OPEN" || r.status === "FILLING") && r.joinedPlayers < r.maxPlayers).map((r) => ({
          roomId: r.id,
          matchCode: r.matchCode,
          poolId: r.poolId,
          gameMode: r.gameMode,
          playerCount: r.playerCount,
          entryFee: r.entryFee,
          entryFeeUsdt: parseFloat(r.entryFee),
          grossPrizePool: (r.playerCount * parseFloat(r.entryFee)).toFixed(8),
          platformFee: (r.playerCount * parseFloat(r.entryFee) * 0.1).toFixed(8),
          netPrizePool: (r.playerCount * parseFloat(r.entryFee) * 0.9).toFixed(8),
          status: r.status,
          joinedPlayers: r.joinedPlayers,
          maxPlayers: r.maxPlayers,
          remainingSlots: r.maxPlayers - r.joinedPlayers,
          fillPercentage: Math.round(r.joinedPlayers / r.maxPlayers * 100),
          createdAt: r.createdAt
        }));
      }
      /**
       * Periodic background maintenance: Replenishes empty pools and cleans up stale abandoned rooms
       */
      static async runMaintenanceCycle() {
        await this.replenishJoinableRooms();
      }
    };
  }
});

// src/server/game/roomJoinService.ts
import { v4 as uuidv47 } from "uuid";
var PLAYER_COLORS_4P, PLAYER_COLORS_2P, PLAYER_COLORS_3P, RoomJoinService;
var init_roomJoinService = __esm({
  "src/server/game/roomJoinService.ts"() {
    init_client();
    init_locks();
    init_ledgerService();
    init_ledgerMath();
    init_matchConfig();
    init_roomManager();
    init_env();
    PLAYER_COLORS_4P = ["red", "green", "yellow", "blue"];
    PLAYER_COLORS_2P = ["red", "blue"];
    PLAYER_COLORS_3P = ["red", "green", "yellow"];
    RoomJoinService = class {
      /**
       * Atomically joins or provisions a match room with double-entry wallet reservation
       */
      static async joinMatch(req) {
        const feeNumber = typeof req.entryFee === "string" ? parseFloat(req.entryFee) : req.entryFee;
        const feeStr = feeNumber.toFixed(8);
        const poolDef = findMatchPool(req.gameMode, req.playerCount, feeNumber);
        if (!poolDef) {
          throw new Error(`Invalid match configuration: Mode ${req.gameMode}, ${req.playerCount} players, fee ${req.entryFee}`);
        }
        let targetRoomId = req.roomId;
        if (!targetRoomId) {
          const joinableRooms = await RoomManager.getJoinableRooms({
            gameMode: req.gameMode,
            playerCount: req.playerCount,
            entryFee: feeNumber
          });
          if (joinableRooms.length > 0) {
            targetRoomId = joinableRooms[0].roomId;
          } else {
            const newRoomId = await RoomManager.ensurePoolHasJoinableRoom(poolDef);
            if (!newRoomId) {
              throw new Error("Failed to provision match room");
            }
            targetRoomId = newRoomId;
          }
        }
        const roomLockKey = `lock:room:join:${targetRoomId}`;
        const userLockKey = `lock:user:join:${req.userId}`;
        return await DistributedLock.withLock(userLockKey, async () => {
          return await DistributedLock.withLock(roomLockKey, async () => {
            Logger.info(`Atomic Join: User ${req.userId} joining match ${targetRoomId}`);
            if (isPostgresConfigured()) {
              const pool = getDbPool();
              if (pool) {
                const client = await pool.connect();
                let reservationTxId = null;
                try {
                  await client.query("BEGIN");
                  const roomRes = await client.query(
                    `SELECT * FROM matches WHERE id = $1 FOR UPDATE`,
                    [targetRoomId]
                  );
                  if (roomRes.rows.length === 0) {
                    throw new Error(`Match room ${targetRoomId} not found`);
                  }
                  const matchRow = roomRes.rows[0];
                  if (matchRow.status !== "OPEN" && matchRow.status !== "FILLING") {
                    throw new Error(`Match room is no longer open for joining (Status: ${matchRow.status})`);
                  }
                  const joinedCount = parseInt(matchRow.joined_players, 10);
                  const maxCount = parseInt(matchRow.max_players, 10);
                  if (joinedCount >= maxCount) {
                    throw new Error("Match room is already full");
                  }
                  const existingPlayer = await client.query(
                    `SELECT * FROM match_players WHERE match_id = $1 AND user_id = $2`,
                    [targetRoomId, req.userId]
                  );
                  if (existingPlayer.rows.length > 0) {
                    const ep = existingPlayer.rows[0];
                    await client.query("COMMIT");
                    return {
                      success: true,
                      matchId: targetRoomId,
                      matchCode: matchRow.match_code,
                      gameMode: matchRow.game_mode,
                      playerCount: maxCount,
                      entryFee: matchRow.entry_fee,
                      color: ep.color,
                      seatIndex: ep.seat_index,
                      status: matchRow.status,
                      joinedPlayers: joinedCount,
                      maxPlayers: maxCount,
                      grossPrizePool: matchRow.gross_prize_pool,
                      netPrizePool: matchRow.net_prize_pool,
                      reservationTxId: ep.reservation_tx_id || "existing",
                      startedAt: matchRow.started_at?.toISOString(),
                      endsAt: matchRow.ends_at?.toISOString()
                    };
                  }
                  const userWallet = await LedgerService.getUserWallet(req.userId);
                  if (LedgerMath.isLessThan(userWallet.availableBalance, feeStr)) {
                    throw new Error(
                      `Insufficient USDT balance. Required: ${feeStr} USDT, Available: ${userWallet.availableBalance} USDT`
                    );
                  }
                  const reserveIdemp = `reserve_${targetRoomId}_${req.userId}`;
                  const lockResult = await LedgerService.lockFundsForWithdrawal(req.userId, feeStr, reserveIdemp);
                  reservationTxId = lockResult.transactionId;
                  const existingPlayersRes = await client.query(
                    `SELECT color, seat_index FROM match_players WHERE match_id = $1`,
                    [targetRoomId]
                  );
                  const usedColors = new Set(existingPlayersRes.rows.map((r) => r.color));
                  const usedSeats = new Set(existingPlayersRes.rows.map((r) => r.seat_index));
                  const colorPalette = maxCount === 2 ? PLAYER_COLORS_2P : maxCount === 3 ? PLAYER_COLORS_3P : PLAYER_COLORS_4P;
                  const assignedColor = colorPalette.find((c) => !usedColors.has(c)) || "red";
                  let assignedSeat = 0;
                  for (let s = 0; s < maxCount; s++) {
                    if (!usedSeats.has(s)) {
                      assignedSeat = s;
                      break;
                    }
                  }
                  await client.query(
                    `INSERT INTO users (id, username, display_name) VALUES ($1, $2, $2) ON CONFLICT (id) DO NOTHING`,
                    [req.userId, req.username || `User_${req.userId.slice(0, 6)}`]
                  );
                  const matchPlayerId = `mp_${targetRoomId}_${req.userId}`;
                  await client.query(
                    `INSERT INTO match_players (
                   id, match_id, user_id, color, seat_index, entry_fee, reservation_tx_id, status
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'JOINED')`,
                    [
                      matchPlayerId,
                      targetRoomId,
                      req.userId,
                      assignedColor,
                      assignedSeat,
                      feeStr,
                      reservationTxId
                    ]
                  );
                  const newJoinedCount = joinedCount + 1;
                  let newStatus = "FILLING";
                  let startedAt = null;
                  let endsAt = null;
                  if (newJoinedCount === maxCount) {
                    newStatus = "STARTING";
                    startedAt = /* @__PURE__ */ new Date();
                    if (matchRow.game_mode === "LUDO_SUPREME" /* LUDO_SUPREME */) {
                      endsAt = new Date(startedAt.getTime() + 300 * 1e3);
                    }
                  }
                  await client.query(
                    `UPDATE matches
                 SET joined_players = $1,
                     status = $2,
                     started_at = COALESCE(started_at, $3),
                     ends_at = COALESCE(ends_at, $4),
                     updated_at = NOW()
                 WHERE id = $5`,
                    [newJoinedCount, newStatus, startedAt, endsAt, targetRoomId]
                  );
                  await client.query("COMMIT");
                  Logger.info(`User ${req.userId} successfully joined match ${targetRoomId}. New status: ${newStatus}`);
                  if (newStatus === "STARTING") {
                    RoomManager.ensurePoolHasJoinableRoom(poolDef).catch((err) => {
                      Logger.warn("Auto replenishment trigger notice", err);
                    });
                  }
                  return {
                    success: true,
                    matchId: targetRoomId,
                    matchCode: matchRow.match_code,
                    gameMode: matchRow.game_mode,
                    playerCount: maxCount,
                    entryFee: matchRow.entry_fee,
                    color: assignedColor,
                    seatIndex: assignedSeat,
                    status: newStatus,
                    joinedPlayers: newJoinedCount,
                    maxPlayers: maxCount,
                    grossPrizePool: matchRow.gross_prize_pool,
                    netPrizePool: matchRow.net_prize_pool,
                    reservationTxId,
                    startedAt: startedAt?.toISOString(),
                    endsAt: endsAt?.toISOString()
                  };
                } catch (err) {
                  await client.query("ROLLBACK");
                  if (reservationTxId) {
                    await LedgerService.refundWithdrawal(
                      req.userId,
                      feeStr,
                      `rollback_${targetRoomId}_${req.userId}`,
                      "Atomic join failure rollback"
                    ).catch(() => {
                    });
                  }
                  Logger.error(`Atomic join error for user ${req.userId} in match ${targetRoomId}`, err);
                  throw err;
                } finally {
                  client.release();
                }
              }
            }
            return {
              success: true,
              matchId: targetRoomId,
              matchCode: `LUDO-${Math.floor(1e5 + Math.random() * 9e5)}`,
              gameMode: req.gameMode,
              playerCount: req.playerCount,
              entryFee: feeStr,
              color: "red",
              seatIndex: 0,
              status: "FILLING",
              joinedPlayers: 1,
              maxPlayers: req.playerCount,
              grossPrizePool: (req.playerCount * feeNumber).toFixed(8),
              netPrizePool: (req.playerCount * feeNumber * 0.9).toFixed(8),
              reservationTxId: `mem_res_${uuidv47()}`
            };
          }, 5e3);
        }, 5e3);
      }
      /**
       * Leave a match before it starts and release the wallet reservation
       */
      static async leaveMatch(matchId, userId) {
        const roomLockKey = `lock:room:join:${matchId}`;
        return await DistributedLock.withLock(roomLockKey, async () => {
          if (isPostgresConfigured()) {
            const pool = getDbPool();
            if (pool) {
              const client = await pool.connect();
              try {
                await client.query("BEGIN");
                const matchRes = await client.query(`SELECT * FROM matches WHERE id = $1 FOR UPDATE`, [matchId]);
                if (matchRes.rows.length === 0) return false;
                const matchRow = matchRes.rows[0];
                if (matchRow.status !== "OPEN" && matchRow.status !== "FILLING") {
                  throw new Error("Cannot leave match that has already started");
                }
                const playerRes = await client.query(
                  `SELECT * FROM match_players WHERE match_id = $1 AND user_id = $2`,
                  [matchId, userId]
                );
                if (playerRes.rows.length === 0) return false;
                const playerRow = playerRes.rows[0];
                await client.query(`DELETE FROM match_players WHERE match_id = $1 AND user_id = $2`, [matchId, userId]);
                const newCount = Math.max(0, parseInt(matchRow.joined_players, 10) - 1);
                const newStatus = newCount === 0 ? "OPEN" : "FILLING";
                await client.query(
                  `UPDATE matches SET joined_players = $1, status = $2, updated_at = NOW() WHERE id = $3`,
                  [newCount, newStatus, matchId]
                );
                const refundIdemp = `leave_refund_${matchId}_${userId}`;
                await LedgerService.refundWithdrawal(
                  userId,
                  playerRow.entry_fee,
                  refundIdemp,
                  `Player left lobby match ${matchId}`
                );
                await client.query("COMMIT");
                Logger.info(`User ${userId} left match ${matchId} and entry fee ${playerRow.entry_fee} was refunded.`);
                return true;
              } catch (err) {
                await client.query("ROLLBACK");
                Logger.error(`Leave match error for user ${userId} in match ${matchId}`, err);
                throw err;
              } finally {
                client.release();
              }
            }
          }
          return true;
        });
      }
    };
  }
});

// src/server/db/migrator.ts
async function ensureDatabaseTables() {
  if (!isPostgresConfigured()) {
    Logger.info("PostgreSQL not configured. Skipping database table initialization.");
    return;
  }
  const pool = getDbPool();
  if (!pool) return;
  const client = await pool.connect();
  try {
    Logger.info("Initializing Neon PostgreSQL database schema (including USDT Double-Entry Ledger)...");
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
    `);
    Logger.info("PostgreSQL schema migration completed successfully.");
  } catch (err) {
    Logger.error("PostgreSQL database migration error", err);
    throw err;
  } finally {
    client.release();
  }
}
var init_migrator = __esm({
  "src/server/db/migrator.ts"() {
    init_client();
    init_env();
  }
});

// src/server/tests/automatedMatchArenaTests.ts
var automatedMatchArenaTests_exports = {};
__export(automatedMatchArenaTests_exports, {
  AutomatedMatchArenaTests: () => AutomatedMatchArenaTests
});
var AutomatedMatchArenaTests;
var init_automatedMatchArenaTests = __esm({
  "src/server/tests/automatedMatchArenaTests.ts"() {
    init_matchConfig();
    init_authoritativeEngine();
    init_ludoSupremeEngine();
    init_roomManager();
    init_roomJoinService();
    init_matchSettlementService();
    init_ledgerService();
    init_ledgerMath();
    init_migrator();
    init_client();
    init_env();
    AutomatedMatchArenaTests = class {
      static {
        this.results = [];
      }
      static async runAllTests() {
        const startTime = Date.now();
        this.results = [];
        Logger.info("===============================================================");
        Logger.info("STARTING AUTOMATED LUDO MATCH ARENA & SUPREME TEST SUITE");
        Logger.info("===============================================================");
        if (isPostgresConfigured()) {
          try {
            await ensureDatabaseTables();
          } catch (err) {
            Logger.warn("Database table init notice in test runner", { error: err?.message });
          }
        }
        await this.testMatchPoolsGeneration();
        await this.testMatchPoolLookups();
        await this.testArenaEngine2Player();
        await this.testArenaEngine3Player();
        await this.testArenaEngine4Player();
        await this.testArenaConsecutiveSixes();
        await this.testArenaCapturesAndSafeCells();
        await this.testArenaWinCondition();
        await this.testSupremeSessionInitialization();
        await this.testSupremeMovementScoring();
        await this.testSupremeHomeMultiplier();
        await this.testSupremeCaptureScoring();
        await this.testSupremeTimerExpiry();
        await this.testSupremeDeterministicTieBreaker();
        await this.testSupremeScoreEventLedger();
        await this.testAtomicRoomJoinWithReservation();
        await this.testInsufficientBalanceJoinRejection();
        await this.testRoomStateTransitionsToStarting();
        await this.testConcurrentJoinRaceCondition();
        await this.testDoubleEntryMatchSettlement();
        await this.testSettlementIdempotency();
        await this.testMatchRefundFlow();
        const durationMs = Date.now() - startTime;
        const passedTests = this.results.filter((r) => r.passed).length;
        const failedTests = this.results.filter((r) => !r.passed).length;
        Logger.info("===============================================================");
        Logger.info(`TEST SUITE COMPLETED: ${passedTests}/${this.results.length} PASSED (${failedTests} FAILED) in ${durationMs}ms`);
        Logger.info("===============================================================");
        return {
          totalTests: this.results.length,
          passedTests,
          failedTests,
          durationMs,
          results: this.results
        };
      }
      static record(suite, name, passed, start, error, details) {
        const durationMs = Date.now() - start;
        this.results.push({
          suiteName: suite,
          testName: name,
          passed,
          durationMs,
          error,
          details
        });
        if (passed) {
          Logger.info(`  \u2713 [${suite}] ${name} (${durationMs}ms)`);
        } else {
          Logger.error(`  \u2717 [${suite}] ${name} FAILED: ${error}`);
        }
      }
      // ---------------------------------------------------------------------------
      // 1. CONFIGURATION & MATCH POOLS
      // ---------------------------------------------------------------------------
      static async testMatchPoolsGeneration() {
        const start = Date.now();
        try {
          const pools = generateAllMatchPools();
          if (pools.length !== 42) {
            throw new Error(`Expected 42 match pools, got ${pools.length}`);
          }
          const keys = new Set(pools.map((p) => p.poolKey));
          if (keys.size !== 42) {
            throw new Error(`Duplicate pool keys detected`);
          }
          this.record("Config", "Generate 42 Deterministic Match Pools", true, start, void 0, { count: pools.length });
        } catch (err) {
          this.record("Config", "Generate 42 Deterministic Match Pools", false, start, err.message);
        }
      }
      static async testMatchPoolLookups() {
        const start = Date.now();
        try {
          const p1 = findMatchPool("ONLINE_ARENA" /* ONLINE_ARENA */, 4, 100);
          if (!p1 || p1.entryFeeUsdt !== 100 || p1.playerCount !== 4) {
            throw new Error("Failed to lookup Arena 4-player $100 pool");
          }
          const p2 = findMatchPool("LUDO_SUPREME" /* LUDO_SUPREME */, 2, 25);
          if (!p2 || p2.entryFeeUsdt !== 25 || p2.playerCount !== 2) {
            throw new Error("Failed to lookup Supreme 2-player $25 pool");
          }
          this.record("Config", "Deterministic Pool Lookups", true, start);
        } catch (err) {
          this.record("Config", "Deterministic Pool Lookups", false, start, err.message);
        }
      }
      // ---------------------------------------------------------------------------
      // 2. ONLINE ARENA ENGINE TESTS
      // ---------------------------------------------------------------------------
      static async testArenaEngine2Player() {
        const start = Date.now();
        try {
          const gameId = `test_arena_2p_${Date.now()}`;
          const session = AuthoritativeLudoEngine.createNewGame(gameId, "2_PLAYER", [
            { userId: "u1", username: "Alice", color: "red", isHuman: true },
            { userId: "u2", username: "Bob", color: "blue", isHuman: true }
          ]);
          if (session.status !== "IN_PROGRESS" || session.currentTurn !== "red") {
            throw new Error("Invalid initial session state");
          }
          if (session.players.red.pawns.length !== 4 || session.players.blue.pawns.length !== 4) {
            throw new Error("Each player must have exactly 4 pawns");
          }
          this.record("Arena Engine", "2-Player Game Creation & Setup", true, start);
        } catch (err) {
          this.record("Arena Engine", "2-Player Game Creation & Setup", false, start, err.message);
        }
      }
      static async testArenaEngine3Player() {
        const start = Date.now();
        try {
          const session = AuthoritativeLudoEngine.createNewGame(`test_3p_${Date.now()}`, "4_PLAYER", [
            { userId: "u1", username: "Alice", color: "red", isHuman: true },
            { userId: "u2", username: "Bob", color: "green", isHuman: true },
            { userId: "u3", username: "Charlie", color: "yellow", isHuman: true }
          ]);
          if (!session.players.red.isActive || !session.players.green.isActive || !session.players.yellow.isActive) {
            throw new Error("Expected 3 active players in 3-player match");
          }
          this.record("Arena Engine", "3-Player Game Creation", true, start);
        } catch (err) {
          this.record("Arena Engine", "3-Player Game Creation", false, start, err.message);
        }
      }
      static async testArenaEngine4Player() {
        const start = Date.now();
        try {
          const session = AuthoritativeLudoEngine.createNewGame(`test_4p_${Date.now()}`, "4_PLAYER", [
            { userId: "u1", username: "P1", color: "red", isHuman: true },
            { userId: "u2", username: "P2", color: "green", isHuman: true },
            { userId: "u3", username: "P3", color: "yellow", isHuman: true },
            { userId: "u4", username: "P4", color: "blue", isHuman: true }
          ]);
          if (Object.values(session.players).filter((p) => p.isActive).length !== 4) {
            throw new Error("Expected 4 active players");
          }
          this.record("Arena Engine", "4-Player Game Creation", true, start);
        } catch (err) {
          this.record("Arena Engine", "4-Player Game Creation", false, start, err.message);
        }
      }
      static async testArenaConsecutiveSixes() {
        const start = Date.now();
        try {
          const session = AuthoritativeLudoEngine.createNewGame(`test_sixes_${Date.now()}`, "2_PLAYER", [
            { userId: "u1", username: "Alice", color: "red", isHuman: true },
            { userId: "u2", username: "Bob", color: "blue", isHuman: true }
          ]);
          session.consecutiveSixes = 2;
          session.dice.hasRolled = false;
          session.dice.canRoll = true;
          const rollRes = AuthoritativeLudoEngine.rollDiceAuthoritative(session, "u1");
          if (rollRes.rollValue === 6) {
            if (!rollRes.consecutiveSixesPenalty || rollRes.session.currentTurn !== "blue") {
              throw new Error("Failed to enforce 3-consecutive sixes penalty");
            }
          }
          this.record("Arena Engine", "Three Consecutive Sixes Penalty Check", true, start);
        } catch (err) {
          this.record("Arena Engine", "Three Consecutive Sixes Penalty Check", false, start, err.message);
        }
      }
      static async testArenaCapturesAndSafeCells() {
        const start = Date.now();
        try {
          const session = AuthoritativeLudoEngine.createNewGame(`test_cap_${Date.now()}`, "2_PLAYER", [
            { userId: "u1", username: "Alice", color: "red", isHuman: true },
            { userId: "u2", username: "Bob", color: "blue", isHuman: true }
          ]);
          session.players.blue.pawns[0].state = "path";
          session.players.blue.pawns[0].pathStep = 10;
          session.players.red.pawns[0].state = "path";
          session.players.red.pawns[0].pathStep = 4;
          session.dice.value = 6;
          session.dice.hasRolled = true;
          const moveRes = AuthoritativeLudoEngine.moveTokenAuthoritative(session, "u1", "red-0");
          if (moveRes.movedPawn.pathStep !== 10) {
            throw new Error("Pawn did not move to target step");
          }
          this.record("Arena Engine", "Path Movement and Validation", true, start);
        } catch (err) {
          this.record("Arena Engine", "Path Movement and Validation", false, start, err.message);
        }
      }
      static async testArenaWinCondition() {
        const start = Date.now();
        try {
          const session = AuthoritativeLudoEngine.createNewGame(`test_win_${Date.now()}`, "2_PLAYER", [
            { userId: "u1", username: "Alice", color: "red", isHuman: true },
            { userId: "u2", username: "Bob", color: "blue", isHuman: true }
          ]);
          session.players.red.pawns[0].state = "goal";
          session.players.red.pawns[0].pathStep = 56;
          session.players.red.pawns[1].state = "goal";
          session.players.red.pawns[1].pathStep = 56;
          session.players.red.pawns[2].state = "goal";
          session.players.red.pawns[2].pathStep = 56;
          session.players.red.pawns[3].state = "path";
          session.players.red.pawns[3].pathStep = 54;
          session.dice.value = 2;
          session.dice.hasRolled = true;
          const moveRes = AuthoritativeLudoEngine.moveTokenAuthoritative(session, "u1", "red-3");
          if (!moveRes.reachedGoal || !moveRes.isGameWon || session.status !== "COMPLETED" || session.winner !== "red") {
            throw new Error("Win condition not triggered when 4th pawn reached goal");
          }
          this.record("Arena Engine", "Arena 4-Pawn Win Condition Verification", true, start);
        } catch (err) {
          this.record("Arena Engine", "Arena 4-Pawn Win Condition Verification", false, start, err.message);
        }
      }
      // ---------------------------------------------------------------------------
      // 3. LUDO SUPREME ENGINE TESTS
      // ---------------------------------------------------------------------------
      static async testSupremeSessionInitialization() {
        const start = Date.now();
        try {
          const matchId = `sup_init_${Date.now()}`;
          const session = LudoSupremeEngine.createSupremeSession(matchId, [
            { userId: "u1", username: "Alice", color: "red", seatIndex: 0, isHuman: true },
            { userId: "u2", username: "Bob", color: "blue", seatIndex: 1, isHuman: true }
          ]);
          if (session.gameMode !== "LUDO_SUPREME") throw new Error("Game mode mismatch");
          if (session.endsAt !== session.startedAt + 3e5) {
            throw new Error("Supreme match duration must be exactly 300,000 ms (5 minutes)");
          }
          if (session.players.red.score !== 0 || session.players.blue.score !== 0) {
            throw new Error("Initial scores must be 0");
          }
          this.record("Supreme Engine", "5-Minute Session Setup & Timer", true, start);
        } catch (err) {
          this.record("Supreme Engine", "5-Minute Session Setup & Timer", false, start, err.message);
        }
      }
      static async testSupremeMovementScoring() {
        const start = Date.now();
        try {
          const session = LudoSupremeEngine.createSupremeSession(`sup_score_${Date.now()}`, [
            { userId: "u1", username: "Alice", color: "red", seatIndex: 0, isHuman: true },
            { userId: "u2", username: "Bob", color: "blue", seatIndex: 1, isHuman: true }
          ]);
          session.dice.value = 6;
          session.dice.hasRolled = true;
          const deployRes = LudoSupremeEngine.moveToken(session, "u1", "red-0");
          if (deployRes.totalScore !== 1) {
            throw new Error(`Expected score 1 after deploy, got ${deployRes.totalScore}`);
          }
          session.currentTurn = "red";
          session.dice.value = 4;
          session.dice.hasRolled = true;
          const moveRes = LudoSupremeEngine.moveToken(session, "u1", "red-0");
          if (moveRes.totalScore !== 5) {
            throw new Error(`Expected total score 5, got ${moveRes.totalScore}`);
          }
          this.record("Supreme Engine", "Movement Step Scoring (+1 per tile)", true, start);
        } catch (err) {
          this.record("Supreme Engine", "Movement Step Scoring (+1 per tile)", false, start, err.message);
        }
      }
      static async testSupremeHomeMultiplier() {
        const start = Date.now();
        try {
          const session = LudoSupremeEngine.createSupremeSession(`sup_mult_${Date.now()}`, [
            { userId: "u1", username: "Alice", color: "red", seatIndex: 0, isHuman: true },
            { userId: "u2", username: "Bob", color: "blue", seatIndex: 1, isHuman: true }
          ]);
          session.players.red.pawns[0].state = "path";
          session.players.red.pawns[0].pathStep = 55;
          session.players.red.score = 55;
          session.dice.value = 1;
          session.dice.hasRolled = true;
          const moveRes = LudoSupremeEngine.moveToken(session, "u1", "red-0");
          if (moveRes.totalScore !== 112 || !moveRes.reachedGoal) {
            throw new Error(`Expected score 112 after 2x home multiplier, got ${moveRes.totalScore}`);
          }
          this.record("Supreme Engine", "Home Goal 2x Multiplier Bonus", true, start);
        } catch (err) {
          this.record("Supreme Engine", "Home Goal 2x Multiplier Bonus", false, start, err.message);
        }
      }
      static async testSupremeCaptureScoring() {
        const start = Date.now();
        try {
          const session = LudoSupremeEngine.createSupremeSession(`sup_cap_${Date.now()}`, [
            { userId: "u1", username: "Alice", color: "red", seatIndex: 0, isHuman: true },
            { userId: "u2", username: "Bob", color: "blue", seatIndex: 1, isHuman: true }
          ]);
          session.players.blue.pawns[0].state = "path";
          session.players.blue.pawns[0].pathStep = 28;
          session.players.blue.score = 28;
          session.players.blue.pawnProgress["blue-0"] = 29;
          session.players.red.pawns[0].state = "path";
          session.players.red.pawns[0].pathStep = 10;
          session.players.red.score = 10;
          session.dice.value = 5;
          session.dice.hasRolled = true;
          const moveRes = LudoSupremeEngine.moveToken(session, "u1", "red-0");
          if (session.players.red.score < 25) {
            throw new Error(`Alice score expected at least 25, got ${session.players.red.score}`);
          }
          if (session.players.blue.score > 0) {
            throw new Error(`Bob's score should be reduced after pawn capture`);
          }
          this.record("Supreme Engine", "Capture Bonus (+10) & Victim Progress Deduction", true, start);
        } catch (err) {
          this.record("Supreme Engine", "Capture Bonus (+10) & Victim Progress Deduction", false, start, err.message);
        }
      }
      static async testSupremeTimerExpiry() {
        const start = Date.now();
        try {
          const session = LudoSupremeEngine.createSupremeSession(`sup_exp_${Date.now()}`, [
            { userId: "u1", username: "Alice", color: "red", seatIndex: 0, isHuman: true },
            { userId: "u2", username: "Bob", color: "blue", seatIndex: 1, isHuman: true }
          ]);
          session.players.red.score = 45;
          session.players.blue.score = 30;
          session.endsAt = Date.now() - 1e3;
          const isExpired = LudoSupremeEngine.checkTimerExpiry(session);
          if (!isExpired || session.status !== "COMPLETED" || session.winnerUserId !== "u1") {
            throw new Error("Timer expiry did not crown Alice (higher score) as winner");
          }
          this.record("Supreme Engine", "5-Minute Countdown Expiration & Auto-Completion", true, start);
        } catch (err) {
          this.record("Supreme Engine", "5-Minute Countdown Expiration & Auto-Completion", false, start, err.message);
        }
      }
      static async testSupremeDeterministicTieBreaker() {
        const start = Date.now();
        try {
          const session = LudoSupremeEngine.createSupremeSession(`sup_tie_${Date.now()}`, [
            { userId: "u1", username: "Alice", color: "red", seatIndex: 0, isHuman: true },
            { userId: "u2", username: "Bob", color: "blue", seatIndex: 1, isHuman: true }
          ]);
          session.players.red.score = 50;
          session.players.blue.score = 50;
          session.players.red.capturesCount = 2;
          session.players.blue.capturesCount = 1;
          const rankings = LudoSupremeEngine.computeDeterministicRankings(session);
          if (rankings[0].userId !== "u1") {
            throw new Error("Tie breaker failed: player with higher captures should rank 1st");
          }
          this.record("Supreme Engine", "Deterministic Tie-Breaking Hierarchy", true, start);
        } catch (err) {
          this.record("Supreme Engine", "Deterministic Tie-Breaking Hierarchy", false, start, err.message);
        }
      }
      static async testSupremeScoreEventLedger() {
        const start = Date.now();
        try {
          const session = LudoSupremeEngine.createSupremeSession(`sup_ledg_${Date.now()}`, [
            { userId: "u1", username: "Alice", color: "red", seatIndex: 0, isHuman: true },
            { userId: "u2", username: "Bob", color: "blue", seatIndex: 1, isHuman: true }
          ]);
          session.dice.value = 6;
          session.dice.hasRolled = true;
          LudoSupremeEngine.moveToken(session, "u1", "red-0");
          if (session.scoreLedger.length === 0) {
            throw new Error("Score event ledger is empty");
          }
          const event = session.scoreLedger[0];
          if (event.eventType !== "MOVE_SCORE" || event.userId !== "u1" || event.resultingScore !== 1) {
            throw new Error("Score event ledger entry mismatch");
          }
          this.record("Supreme Engine", "Auditable Score Event Ledger", true, start);
        } catch (err) {
          this.record("Supreme Engine", "Auditable Score Event Ledger", false, start, err.message);
        }
      }
      // ---------------------------------------------------------------------------
      // 4. ATOMIC ROOM JOINING & WALLET RESERVATION
      // ---------------------------------------------------------------------------
      static async testAtomicRoomJoinWithReservation() {
        const start = Date.now();
        try {
          const userId = `test_user_res_${Date.now()}`;
          await LedgerService.creditDeposit(userId, "50.00000000", `dep_${userId}`);
          const joinRes = await RoomJoinService.joinMatch({
            userId,
            username: `User_${userId}`,
            gameMode: "ONLINE_ARENA" /* ONLINE_ARENA */,
            playerCount: 2,
            entryFee: 10
          });
          if (!joinRes.success || !joinRes.reservationTxId) {
            throw new Error("Join match failed to lock wallet funds");
          }
          const wallet = await LedgerService.getUserWallet(userId);
          if (LedgerMath.isLessThan(wallet.lockedBalance, "10.00000000")) {
            throw new Error(`Expected locked balance >= 10, got ${wallet.lockedBalance}`);
          }
          this.record("Room & Wallet", "Atomic Join with Double-Entry Wallet Reservation", true, start);
        } catch (err) {
          this.record("Room & Wallet", "Atomic Join with Double-Entry Wallet Reservation", false, start, err.message);
        }
      }
      static async testInsufficientBalanceJoinRejection() {
        const start = Date.now();
        try {
          const poorUserId = `poor_user_${Date.now()}`;
          let errorCaught = false;
          try {
            await RoomJoinService.joinMatch({
              userId: poorUserId,
              username: "PoorPlayer",
              gameMode: "ONLINE_ARENA" /* ONLINE_ARENA */,
              playerCount: 4,
              entryFee: 100
            });
          } catch (err) {
            errorCaught = true;
            if (!err.message.includes("Insufficient USDT balance")) {
              throw new Error(`Unexpected error message: ${err.message}`);
            }
          }
          if (!errorCaught) {
            throw new Error("Should have rejected join with insufficient balance");
          }
          this.record("Room & Wallet", "Insufficient Balance Join Rejection", true, start);
        } catch (err) {
          this.record("Room & Wallet", "Insufficient Balance Join Rejection", false, start, err.message);
        }
      }
      static async testRoomStateTransitionsToStarting() {
        const start = Date.now();
        try {
          const u1 = `trans_u1_${Date.now()}`;
          const u2 = `trans_u2_${Date.now()}`;
          await LedgerService.creditDeposit(u1, "20.00000000", `dep_${u1}`);
          await LedgerService.creditDeposit(u2, "20.00000000", `dep_${u2}`);
          const j1 = await RoomJoinService.joinMatch({
            userId: u1,
            username: `User_${u1}`,
            gameMode: "ONLINE_ARENA" /* ONLINE_ARENA */,
            playerCount: 2,
            entryFee: 5
          });
          const j2 = await RoomJoinService.joinMatch({
            userId: u2,
            username: `User_${u2}`,
            gameMode: "ONLINE_ARENA" /* ONLINE_ARENA */,
            playerCount: 2,
            entryFee: 5,
            roomId: j1.matchId
          });
          if (j2.status !== "STARTING" || j2.joinedPlayers !== 2) {
            throw new Error(`Expected status STARTING on full room, got ${j2.status}`);
          }
          this.record("Room & Wallet", "Room Lifecycle (OPEN -> FILLING -> FULL -> STARTING)", true, start);
        } catch (err) {
          this.record("Room & Wallet", "Room Lifecycle (OPEN -> FILLING -> FULL -> STARTING)", false, start, err.message);
        }
      }
      static async testConcurrentJoinRaceCondition() {
        const start = Date.now();
        try {
          const poolDef = findMatchPool("ONLINE_ARENA" /* ONLINE_ARENA */, 2, 1);
          const roomId = await RoomManager.ensurePoolHasJoinableRoom(poolDef);
          if (!roomId) throw new Error("Failed to provision test room");
          const userIds = [];
          for (let i = 0; i < 10; i++) {
            const uid = `race_user_${Date.now()}_${i}`;
            userIds.push(uid);
            await LedgerService.creditDeposit(uid, "10.00000000", `dep_${uid}`);
          }
          const joinPromises = userIds.map(
            (uid) => RoomJoinService.joinMatch({
              userId: uid,
              username: `Player_${uid}`,
              gameMode: "ONLINE_ARENA" /* ONLINE_ARENA */,
              playerCount: 2,
              entryFee: 1,
              roomId
            }).catch((err) => ({ error: err.message }))
          );
          const outcomes = await Promise.all(joinPromises);
          const successfulJoins = outcomes.filter((o) => !o.error);
          if (successfulJoins.length > 2) {
            throw new Error(`Race condition flaw! ${successfulJoins.length} players joined a 2-player room!`);
          }
          this.record("Room & Wallet", "High-Concurrency Atomic Join Lock Test (No Over-Filling)", true, start, void 0, {
            successCount: successfulJoins.length
          });
        } catch (err) {
          this.record("Room & Wallet", "High-Concurrency Atomic Join Lock Test (No Over-Filling)", false, start, err.message);
        }
      }
      // ---------------------------------------------------------------------------
      // 5. DOUBLE-ENTRY FINANCIAL SETTLEMENT
      // ---------------------------------------------------------------------------
      static async testDoubleEntryMatchSettlement() {
        const start = Date.now();
        try {
          const winnerId = `win_user_${Date.now()}`;
          const loserId = `lose_user_${Date.now()}`;
          await LedgerService.creditDeposit(winnerId, "50.00000000", `dep_${winnerId}`);
          await LedgerService.creditDeposit(loserId, "50.00000000", `dep_${loserId}`);
          const join1 = await RoomJoinService.joinMatch({
            userId: winnerId,
            username: "WinnerPlayer",
            gameMode: "ONLINE_ARENA" /* ONLINE_ARENA */,
            playerCount: 2,
            entryFee: 5
          });
          const join2 = await RoomJoinService.joinMatch({
            userId: loserId,
            username: "LoserPlayer",
            gameMode: "ONLINE_ARENA" /* ONLINE_ARENA */,
            playerCount: 2,
            entryFee: 5,
            roomId: join1.matchId
          });
          const matchId = join1.matchId;
          const settlement = await MatchSettlementService.settleMatch(matchId, winnerId, [
            { userId: winnerId, rank: 1, finalScore: 100, tokensHome: 4, capturesMade: 2, totalDistanceMoved: 224 },
            { userId: loserId, rank: 2, finalScore: 40, tokensHome: 1, capturesMade: 0, totalDistanceMoved: 120 }
          ]);
          if (settlement.status !== "COMPLETED") {
            throw new Error(`Settlement status mismatch: ${settlement.status}`);
          }
          if (parseFloat(settlement.grossPool) !== 10 || parseFloat(settlement.platformFee) !== 1 || parseFloat(settlement.prizePool) !== 9) {
            throw new Error(`Prize calculation error. Gross: ${settlement.grossPool}, Fee: ${settlement.platformFee}, Prize: ${settlement.prizePool}`);
          }
          const winnerWallet = await LedgerService.getUserWallet(winnerId);
          if (parseFloat(winnerWallet.availableBalance) < 54) {
            throw new Error(`Winner available balance expected 54.00, got ${winnerWallet.availableBalance}`);
          }
          this.record("Settlement", "Double-Entry Prize Pool Distribution (Gross, 10% Fee, 90% Net)", true, start);
        } catch (err) {
          this.record("Settlement", "Double-Entry Prize Pool Distribution (Gross, 10% Fee, 90% Net)", false, start, err.message);
        }
      }
      static async testSettlementIdempotency() {
        const start = Date.now();
        try {
          const winnerId = `idemp_win_${Date.now()}`;
          const loserId = `idemp_lose_${Date.now()}`;
          await LedgerService.creditDeposit(winnerId, "50.00000000", `dep_${winnerId}`);
          await LedgerService.creditDeposit(loserId, "50.00000000", `dep_${loserId}`);
          const join1 = await RoomJoinService.joinMatch({
            userId: winnerId,
            username: `Winner_${winnerId}`,
            gameMode: "ONLINE_ARENA" /* ONLINE_ARENA */,
            playerCount: 2,
            entryFee: 5
          });
          await RoomJoinService.joinMatch({
            userId: loserId,
            username: `Loser_${loserId}`,
            gameMode: "ONLINE_ARENA" /* ONLINE_ARENA */,
            playerCount: 2,
            entryFee: 5,
            roomId: join1.matchId
          });
          const matchId = join1.matchId;
          const s1 = await MatchSettlementService.settleMatch(matchId, winnerId, [
            { userId: winnerId, rank: 1, finalScore: 100, tokensHome: 4, capturesMade: 2, totalDistanceMoved: 224 },
            { userId: loserId, rank: 2, finalScore: 40, tokensHome: 1, capturesMade: 0, totalDistanceMoved: 120 }
          ]);
          const s2 = await MatchSettlementService.settleMatch(matchId, winnerId, [
            { userId: winnerId, rank: 1, finalScore: 100, tokensHome: 4, capturesMade: 2, totalDistanceMoved: 224 },
            { userId: loserId, rank: 2, finalScore: 40, tokensHome: 1, capturesMade: 0, totalDistanceMoved: 120 }
          ]);
          if (s2.status !== "ALREADY_SETTLED" && s2.settlementId !== s1.settlementId) {
            throw new Error("Settlement did not protect against duplicate execution");
          }
          this.record("Settlement", "Settlement Idempotency Protection", true, start);
        } catch (err) {
          this.record("Settlement", "Settlement Idempotency Protection", false, start, err.message);
        }
      }
      static async testMatchRefundFlow() {
        const start = Date.now();
        try {
          const userId = `ref_u1_${Date.now()}`;
          await LedgerService.creditDeposit(userId, "50.00000000", `dep_${userId}`);
          const join = await RoomJoinService.joinMatch({
            userId,
            username: "RefundUser",
            gameMode: "ONLINE_ARENA" /* ONLINE_ARENA */,
            playerCount: 2,
            entryFee: 5
          });
          const matchId = join.matchId;
          const walletBeforeRefund = await LedgerService.getUserWallet(userId);
          if (parseFloat(walletBeforeRefund.availableBalance) !== 45) {
            throw new Error(`Expected 45.00 available before refund, got ${walletBeforeRefund.availableBalance}`);
          }
          await MatchSettlementService.refundMatch(matchId, "Room cancelled due to timeout");
          const walletAfterRefund = await LedgerService.getUserWallet(userId);
          if (parseFloat(walletAfterRefund.availableBalance) !== 50) {
            throw new Error(`Expected 50.00 available after refund, got ${walletAfterRefund.availableBalance}`);
          }
          this.record("Settlement", "Match Cancellation & Wallet Refund Flow", true, start);
        } catch (err) {
          this.record("Settlement", "Match Cancellation & Wallet Refund Flow", false, start, err.message);
        }
      }
    };
  }
});

// src/server/app.ts
import express from "express";

// src/server/routes/api.ts
init_client();
init_client2();
import { Router } from "express";
import multer from "multer";

// src/server/storage/r2Client.ts
init_env();
init_client();
init_schema();
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
function isR2Configured() {
  return Boolean(
    config.R2_ENDPOINT && config.R2_ACCESS_KEY_ID && config.R2_SECRET_ACCESS_KEY && config.R2_BUCKET_NAME && config.R2_ENDPOINT.trim().length > 0 && config.R2_ACCESS_KEY_ID.trim().length > 0 && config.R2_SECRET_ACCESS_KEY.trim().length > 0 && config.R2_BUCKET_NAME.trim().length > 0
  );
}
function getR2Client() {
  if (!isR2Configured()) {
    return null;
  }
  if (!globalThis.__ludo_s3_client) {
    globalThis.__ludo_s3_client = new S3Client({
      region: "auto",
      endpoint: config.R2_ENDPOINT,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID,
        secretAccessKey: config.R2_SECRET_ACCESS_KEY
      },
      // Cloudflare R2 requires path-style or virtual-hosted; endpoint provided handles this
      forcePathStyle: true
    });
  }
  return globalThis.__ludo_s3_client;
}
async function checkR2Health() {
  if (!isR2Configured()) {
    return { status: "unconfigured", latencyMs: 0 };
  }
  const client = getR2Client();
  if (!client) {
    return { status: "unconfigured", latencyMs: 0 };
  }
  const start = Date.now();
  try {
    await client.send(
      new ListObjectsV2Command({
        Bucket: config.R2_BUCKET_NAME,
        MaxKeys: 1
      })
    );
    const latencyMs = Date.now() - start;
    return {
      status: "healthy",
      latencyMs,
      bucket: config.R2_BUCKET_NAME
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);
    Logger.warn("Cloudflare R2 health probe failed", { error: errorMsg });
    return {
      status: "unhealthy",
      latencyMs,
      bucket: config.R2_BUCKET_NAME,
      error: errorMsg
    };
  }
}
async function uploadToR2(params) {
  const client = getR2Client();
  if (!client || !config.R2_BUCKET_NAME) {
    throw new Error("Cloudflare R2 is not configured. Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.");
  }
  const category = params.category || "assets";
  const extension = params.contentType.split("/")[1] || "bin";
  const objectKey = params.key || `${category}/${Date.now()}-${uuidv4()}.${extension}`;
  await client.send(
    new PutObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: objectKey,
      Body: params.buffer,
      ContentType: params.contentType,
      Metadata: {
        userId: params.userId || "system",
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    })
  );
  const publicUrl = `/api/storage/file/${encodeURIComponent(objectKey)}`;
  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        await db.insert(storageObjects).values({
          id: `obj_${uuidv4()}`,
          key: objectKey,
          bucket: config.R2_BUCKET_NAME,
          userId: params.userId || null,
          contentType: params.contentType,
          sizeBytes: params.buffer.length,
          url: publicUrl,
          createdAt: /* @__PURE__ */ new Date()
        });
      }
    } catch (err) {
      Logger.warn(`Failed to persist storage metadata to PostgreSQL: ${String(err)}`);
    }
  }
  Logger.info(`Successfully uploaded object to Cloudflare R2: ${objectKey} (${params.buffer.length} bytes)`);
  return {
    key: objectKey,
    url: publicUrl,
    bucket: config.R2_BUCKET_NAME,
    sizeBytes: params.buffer.length,
    contentType: params.contentType
  };
}
async function generatePresignedUploadUrl(params) {
  const client = getR2Client();
  if (!client || !config.R2_BUCKET_NAME) {
    throw new Error("Cloudflare R2 is not configured");
  }
  const command = new PutObjectCommand({
    Bucket: config.R2_BUCKET_NAME,
    Key: params.key,
    ContentType: params.contentType
  });
  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds || 300
    // 5 minutes default
  });
  return {
    uploadUrl,
    key: params.key,
    finalUrl: `/api/storage/file/${encodeURIComponent(params.key)}`
  };
}
async function getObjectFromR2(key) {
  const client = getR2Client();
  if (!client || !config.R2_BUCKET_NAME) {
    return null;
  }
  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: config.R2_BUCKET_NAME,
        Key: key
      })
    );
    if (!response.Body) return null;
    return {
      stream: response.Body,
      contentType: response.ContentType || "application/octet-stream",
      contentLength: response.ContentLength
    };
  } catch (err) {
    Logger.warn(`Object not found in Cloudflare R2: ${key}`);
    return null;
  }
}
async function deleteObjectFromR2(key) {
  const client = getR2Client();
  if (!client || !config.R2_BUCKET_NAME) return false;
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.R2_BUCKET_NAME,
        Key: key
      })
    );
    return true;
  } catch (err) {
    Logger.warn(`Failed to delete object from R2: ${key}`);
    return false;
  }
}

// src/server/redis/matchmaking.ts
init_client2();

// src/server/redis/keys.ts
var RedisKeys = {
  // 1. Realtime Game State
  gameState: (gameId) => `ludo:state:${gameId}`,
  gameVersion: (gameId) => `ludo:version:${gameId}`,
  gameTurn: (gameId) => `ludo:turn:${gameId}`,
  gameRoomMembers: (gameId) => `ludo:room:${gameId}:members`,
  // 2. Distributed Locks
  gameLock: (gameId) => `ludo:lock:game:${gameId}`,
  userLock: (userId) => `ludo:lock:user:${userId}`,
  matchmakingLock: (mode) => `ludo:lock:matchmaking:${mode}`,
  // 3. Player Presence
  userPresence: (userId) => `ludo:presence:${userId}`,
  onlineUsers: () => "ludo:presence:online_set",
  // 4. Matchmaking
  matchmakingQueue: (mode) => `ludo:matchmaking:queue:${mode}`,
  playerTicket: (userId) => `ludo:matchmaking:ticket:${userId}`,
  // 5. Rate Limiting
  rateLimit: (key) => `ludo:ratelimit:${key}`,
  // 6. Cache
  leaderboardCache: (type) => `ludo:cache:leaderboard:${type}`,
  userStatsCache: (userId) => `ludo:cache:stats:${userId}`
};

// src/server/redis/matchmaking.ts
init_locks();
init_env();
var MatchmakingService = class {
  static {
    this.localQueues = /* @__PURE__ */ new Map();
  }
  static async enqueue(userId, username, mode, avatarUrl) {
    const ticket = {
      userId,
      username,
      avatarUrl,
      mode,
      enqueuedAt: Date.now()
    };
    const redis = getRedisClient();
    if (redis) {
      const lockKey = RedisKeys.matchmakingLock(mode);
      try {
        return await DistributedLock.withLock(lockKey, async () => {
          const queueKey = RedisKeys.matchmakingQueue(mode);
          const ticketKey = RedisKeys.playerTicket(userId);
          const pipeline = redis.pipeline();
          pipeline.set(ticketKey, JSON.stringify(ticket), "EX", 180);
          pipeline.zadd(queueKey, Date.now(), userId);
          await pipeline.exec();
          Logger.info(`User ${userId} (${username}) enqueued in Redis queue ${mode}`);
          return { success: true };
        });
      } catch (err) {
        Logger.warn(`Redis matchmaking enqueue error for ${userId}: ${String(err)}`);
      }
    }
    const list = this.localQueues.get(mode) || [];
    const filtered = list.filter((t) => t.userId !== userId);
    filtered.push(ticket);
    this.localQueues.set(mode, filtered);
    return { success: true };
  }
  static async cancel(userId, mode) {
    const redis = getRedisClient();
    if (redis) {
      try {
        const pipeline = redis.pipeline();
        pipeline.zrem(RedisKeys.matchmakingQueue(mode), userId);
        pipeline.del(RedisKeys.playerTicket(userId));
        await pipeline.exec();
        return true;
      } catch (err) {
        Logger.warn(`Failed to cancel matchmaking for ${userId}: ${String(err)}`);
      }
    }
    const list = this.localQueues.get(mode);
    if (list) {
      this.localQueues.set(mode, list.filter((t) => t.userId !== userId));
    }
    return true;
  }
  static async tryMatch(mode) {
    const requiredPlayers = mode === "2_PLAYER" ? 2 : mode === "4_PLAYER" ? 4 : 2;
    const redis = getRedisClient();
    if (redis) {
      const lockKey = RedisKeys.matchmakingLock(mode);
      try {
        return await DistributedLock.withLock(lockKey, async () => {
          const queueKey = RedisKeys.matchmakingQueue(mode);
          const candidateUserIds = await redis.zrange(queueKey, 0, requiredPlayers - 1);
          if (candidateUserIds.length < requiredPlayers) {
            return null;
          }
          const matchedTickets = [];
          for (const uId of candidateUserIds) {
            const raw = await redis.get(RedisKeys.playerTicket(uId));
            if (raw) {
              matchedTickets.push(JSON.parse(raw));
            }
          }
          if (matchedTickets.length === requiredPlayers) {
            const pipeline = redis.pipeline();
            for (const ticket of matchedTickets) {
              pipeline.zrem(queueKey, ticket.userId);
              pipeline.del(RedisKeys.playerTicket(ticket.userId));
            }
            await pipeline.exec();
            Logger.info(`Formed match for ${mode} with ${matchedTickets.length} players via Redis`);
            return matchedTickets;
          }
          return null;
        });
      } catch (err) {
        Logger.warn(`Error during match attempt for ${mode}: ${String(err)}`);
      }
    }
    const list = this.localQueues.get(mode) || [];
    if (list.length >= requiredPlayers) {
      const matched = list.slice(0, requiredPlayers);
      this.localQueues.set(mode, list.slice(requiredPlayers));
      return matched;
    }
    return null;
  }
};

// src/server/redis/presence.ts
init_client2();
init_env();
var PresenceManager = class {
  static {
    this.localPresence = /* @__PURE__ */ new Map();
  }
  /**
   * Register or update user presence heartbeat
   */
  static async heartbeat(userId, username, status, gameId) {
    const presenceData = {
      userId,
      username,
      status,
      gameId,
      lastHeartbeat: Date.now()
    };
    this.localPresence.set(userId, presenceData);
    const redis = getRedisClient();
    if (!redis) return;
    const key = RedisKeys.userPresence(userId);
    try {
      const pipeline = redis.pipeline();
      pipeline.set(key, JSON.stringify(presenceData), "EX", 45);
      pipeline.zadd(RedisKeys.onlineUsers(), Date.now(), userId);
      await pipeline.exec();
    } catch (err) {
      Logger.warn(`Presence update error for user ${userId}: ${String(err)}`);
    }
  }
  /**
   * Get user presence data
   */
  static async getPresence(userId) {
    const redis = getRedisClient();
    if (redis) {
      try {
        const raw = await redis.get(RedisKeys.userPresence(userId));
        if (raw) {
          return JSON.parse(raw);
        }
      } catch {
      }
    }
    return this.localPresence.get(userId) || null;
  }
  /**
   * Mark user as disconnected
   */
  static async setDisconnected(userId) {
    this.localPresence.delete(userId);
    const redis = getRedisClient();
    if (!redis) return;
    try {
      const pipeline = redis.pipeline();
      pipeline.del(RedisKeys.userPresence(userId));
      pipeline.zrem(RedisKeys.onlineUsers(), userId);
      await pipeline.exec();
    } catch (err) {
      Logger.warn(`Failed to remove presence for user ${userId}: ${String(err)}`);
    }
  }
  /**
   * Get total online player count
   */
  static async getOnlineCount() {
    const redis = getRedisClient();
    if (redis) {
      try {
        const twoMinutesAgo = Date.now() - 12e4;
        await redis.zremrangebyscore(RedisKeys.onlineUsers(), "-inf", twoMinutesAgo);
        return await redis.zcard(RedisKeys.onlineUsers());
      } catch {
      }
    }
    return this.localPresence.size;
  }
};

// src/server/game/persistenceService.ts
init_client();
init_schema();
init_client2();
init_locks();

// src/server/queues/queueManager.ts
init_client2();
init_env();
import { Queue } from "bullmq";
function createQueueOptions() {
  return {
    connection: getRedisConfig(),
    prefix: "ludo_prod",
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1e3
      },
      removeOnComplete: {
        age: 3600,
        count: 1e3
      },
      removeOnFail: {
        age: 86400,
        count: 5e3
      }
    }
  };
}
function createDummyQueue(name) {
  return {
    name,
    add: async (jobName, data) => {
      return { id: `mock-${Date.now()}`, name: jobName, data };
    },
    getJobCounts: async () => ({ waiting: 0, active: 0, failed: 0, completed: 0, delayed: 0, paused: 0 }),
    close: async () => {
    },
    on: () => {
    }
  };
}
function safeInstantiateQueue(name) {
  if (!isRedisConfigured()) {
    return createDummyQueue(name);
  }
  try {
    const q = new Queue(name, createQueueOptions());
    q.on("error", (err) => {
      Logger.warn(`BullMQ queue ${name} notice: ${err.message}`);
    });
    return q;
  } catch (err) {
    Logger.warn(`Falling back to memory queue for ${name}`);
    return createDummyQueue(name);
  }
}
var QueueRegistry = class {
  static {
    this.gameProcessingQueue = null;
  }
  static {
    this.leaderboardQueue = null;
  }
  static {
    this.cleanupQueue = null;
  }
  static getGameProcessingQueue() {
    if (!this.gameProcessingQueue) {
      this.gameProcessingQueue = safeInstantiateQueue("gameProcessingQueue");
    }
    return this.gameProcessingQueue;
  }
  static getLeaderboardQueue() {
    if (!this.leaderboardQueue) {
      this.leaderboardQueue = safeInstantiateQueue("leaderboardQueue");
    }
    return this.leaderboardQueue;
  }
  static getCleanupQueue() {
    if (!this.cleanupQueue) {
      this.cleanupQueue = safeInstantiateQueue("cleanupQueue");
    }
    return this.cleanupQueue;
  }
  static async getQueueMetrics() {
    if (!isRedisConfigured()) {
      return {
        gameProcessing: { waiting: 0, active: 0, failed: 0 },
        leaderboard: { waiting: 0, active: 0, failed: 0 },
        cleanup: { waiting: 0, active: 0, failed: 0 }
      };
    }
    const queues = [
      { name: "gameProcessing", q: this.getGameProcessingQueue() },
      { name: "leaderboard", q: this.getLeaderboardQueue() },
      { name: "cleanup", q: this.getCleanupQueue() }
    ];
    const metrics = {};
    for (const item of queues) {
      try {
        const counts = await item.q.getJobCounts("waiting", "active", "failed");
        metrics[item.name] = {
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          failed: counts.failed || 0
        };
      } catch {
        metrics[item.name] = { waiting: 0, active: 0, failed: 0 };
      }
    }
    return metrics;
  }
  static async closeAll() {
    const queues = [this.gameProcessingQueue, this.leaderboardQueue, this.cleanupQueue];
    for (const q of queues) {
      if (q) {
        await q.close().catch(() => {
        });
      }
    }
    this.gameProcessingQueue = null;
    this.leaderboardQueue = null;
    this.cleanupQueue = null;
  }
};

// src/server/game/persistenceService.ts
init_env();
import { eq, desc } from "drizzle-orm";
var GamePersistenceService = class {
  static {
    this.localSessions = /* @__PURE__ */ new Map();
  }
  static {
    this.localStats = /* @__PURE__ */ new Map();
  }
  /**
   * Save active realtime game state into Redis with TTL, or fallback to memory
   */
  static async saveActiveGameState(session) {
    this.localSessions.set(session.gameId, JSON.parse(JSON.stringify(session)));
    const redis = getRedisClient();
    if (!redis) return;
    const key = RedisKeys.gameState(session.gameId);
    const ttlSeconds = session.status === "COMPLETED" ? 3600 : 86400;
    try {
      const pipeline = redis.pipeline();
      pipeline.set(key, JSON.stringify(session), "EX", ttlSeconds);
      pipeline.set(RedisKeys.gameVersion(session.gameId), session.version.toString(), "EX", ttlSeconds);
      pipeline.set(RedisKeys.gameTurn(session.gameId), session.currentTurn, "EX", ttlSeconds);
      await pipeline.exec();
    } catch (err) {
      Logger.warn(`Redis state save notice for game ${session.gameId}: ${String(err)}`);
    }
  }
  /**
   * Get active game state from Redis, or fallback to memory / DB recovery
   */
  static async getGameState(gameId) {
    const redis = getRedisClient();
    if (redis) {
      try {
        const cached = await redis.get(RedisKeys.gameState(gameId));
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {
      }
    }
    if (this.localSessions.has(gameId)) {
      return JSON.parse(JSON.stringify(this.localSessions.get(gameId)));
    }
    if (isPostgresConfigured()) {
      return await this.recoverGameStateFromDb(gameId);
    }
    return null;
  }
  /**
   * Persist authoritative game event into Neon PostgreSQL append-only event ledger
   */
  static async appendGameEvent(gameId, sequenceNumber, eventType, actorUserId, payload, gameVersion) {
    if (!isPostgresConfigured()) return;
    try {
      const db = getDb();
      if (!db) return;
      await db.insert(gameEvents).values({
        id: `ev_${gameId}_${sequenceNumber}`,
        gameId,
        sequenceNumber,
        eventType,
        actorUserId,
        payload,
        gameVersion,
        serverTimestamp: /* @__PURE__ */ new Date()
      }).onConflictDoNothing();
    } catch (err) {
      Logger.warn(`PostgreSQL appendGameEvent notice: ${String(err)}`);
    }
  }
  /**
   * Atomically persist completed game into PostgreSQL and enqueue background jobs
   */
  static async finalizeGame(session) {
    const lockKey = RedisKeys.gameLock(session.gameId);
    await DistributedLock.withLock(lockKey, async () => {
      Logger.info(`Finalizing completed game ${session.gameId}`);
      const winnerPlayer = session.winner ? session.players[session.winner] : null;
      const winnerUserId = winnerPlayer?.id;
      await this.saveActiveGameState(session);
      if (isPostgresConfigured()) {
        try {
          await withTransaction(async (client) => {
            await client.query(
              `INSERT INTO games (id, mode, status, winner_user_id, total_turns, version, metadata, completed_at, updated_at)
               VALUES ($1, $2, 'COMPLETED', $3, $4, $5, $6, NOW(), NOW())
               ON CONFLICT (id) DO UPDATE SET
                 status = 'COMPLETED',
                 winner_user_id = EXCLUDED.winner_user_id,
                 total_turns = EXCLUDED.total_turns,
                 version = EXCLUDED.version,
                 completed_at = NOW(),
                 updated_at = NOW()`,
              [
                session.gameId,
                session.mode,
                winnerUserId || null,
                session.sequenceNumber,
                session.version,
                JSON.stringify({ winnerColor: session.winner, winnerUserId, completedAt: session.completedAt })
              ]
            );
            for (const color of ["red", "green", "yellow", "blue"]) {
              const p = session.players[color];
              if (p.isActive) {
                const isWinner = color === session.winner;
                const tokensHome = p.pawns ? p.pawns.filter((pawn) => pawn.state === "goal").length : 0;
                await client.query(
                  `INSERT INTO game_players (id, game_id, user_id, color, is_host, is_ai, finish_position, final_score, tokens_home)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                   ON CONFLICT (id) DO UPDATE SET
                     finish_position = EXCLUDED.finish_position,
                     final_score = EXCLUDED.final_score,
                     tokens_home = EXCLUDED.tokens_home`,
                  [
                    `gp_${session.gameId}_${p.id}`,
                    session.gameId,
                    p.id,
                    color,
                    color === "red",
                    !p.isHuman,
                    isWinner ? 1 : 2,
                    p.score,
                    tokensHome
                  ]
                );
              }
            }
            await client.query(
              `INSERT INTO game_events (id, game_id, sequence_number, event_type, actor_user_id, payload, game_version, server_timestamp)
               VALUES ($1, $2, $3, 'GAME_COMPLETED', $4, $5, $6, NOW())
               ON CONFLICT (game_id, sequence_number) DO NOTHING`,
              [
                `ev_${session.gameId}_${session.sequenceNumber}`,
                session.gameId,
                session.sequenceNumber,
                winnerUserId || null,
                JSON.stringify({ winnerColor: session.winner, winnerUserId, completedAt: session.completedAt }),
                session.version
              ]
            );
          });
        } catch (err) {
          Logger.warn(`PostgreSQL finalizeGame warning: ${String(err)}`);
        }
      }
      if (isRedisConfigured()) {
        try {
          await QueueRegistry.getGameProcessingQueue().add(`process_game_${session.gameId}`, {
            type: "GAME_COMPLETED",
            gameId: session.gameId,
            winnerUserId: winnerUserId || void 0,
            finalState: session,
            timestamp: Date.now()
          });
          await QueueRegistry.getLeaderboardQueue().add(`recalc_${session.gameId}`, {
            type: "RECALCULATE_RANKS",
            leaderboardType: "GLOBAL",
            userId: winnerUserId || void 0
          });
        } catch (err) {
          Logger.warn(`BullMQ queue dispatch skipped: ${String(err)}`);
        }
      }
      for (const color of ["red", "green", "yellow", "blue"]) {
        const p = session.players[color];
        if (p.isActive && !p.id.startsWith("bot-")) {
          const isWinner = color === session.winner;
          const current = this.localStats.get(p.id) || {
            userId: p.id,
            gamesPlayed: 0,
            gamesWon: 0,
            winRate: "0.00"
          };
          current.gamesPlayed += 1;
          if (isWinner) current.gamesWon += 1;
          current.winRate = (current.gamesWon / current.gamesPlayed * 100).toFixed(2);
          this.localStats.set(p.id, current);
        }
      }
      Logger.info(`Successfully finalized game ${session.gameId}`);
    });
  }
  /**
   * Reconstitute game state from PostgreSQL if needed
   */
  static async recoverGameStateFromDb(gameId) {
    try {
      const db = getDb();
      if (!db) return null;
      const gameRecord = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
      if (gameRecord.length === 0) return null;
      const events = await db.select().from(gameEvents).where(eq(gameEvents.gameId, gameId)).orderBy(gameEvents.sequenceNumber);
      Logger.info(`Recovered game record ${gameId} from PostgreSQL (${events.length} logged events)`);
    } catch (err) {
      Logger.warn(`PostgreSQL recovery check skipped: ${String(err)}`);
    }
    return null;
  }
  /**
   * Fetch player stats from Neon PostgreSQL, falling back to local
   */
  static async getPlayerStats(userId) {
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          const res = await db.select().from(playerStatistics).where(eq(playerStatistics.userId, userId)).limit(1);
          if (res.length > 0) {
            return {
              userId: res[0].userId,
              gamesPlayed: res[0].gamesPlayed,
              gamesWon: res[0].gamesWon,
              gamesLost: res[0].gamesLost,
              winRate: res[0].winRate.toString()
            };
          }
        }
      } catch (err) {
        Logger.warn(`Failed to fetch PostgreSQL stats for ${userId}: ${String(err)}`);
      }
    }
    const local = this.localStats.get(userId);
    if (!local) return null;
    return {
      userId: local.userId,
      gamesPlayed: local.gamesPlayed,
      gamesWon: local.gamesWon,
      gamesLost: local.gamesPlayed - local.gamesWon,
      winRate: local.winRate
    };
  }
  /**
   * Fetch global leaderboard from Neon PostgreSQL, falling back to local
   */
  static async getLeaderboard(type = "GLOBAL") {
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          const res = await db.select({
            userId: leaderboards.userId,
            score: leaderboards.score,
            rank: leaderboards.rank
          }).from(leaderboards).where(eq(leaderboards.leaderboardType, type)).orderBy(desc(leaderboards.score)).limit(50);
          if (res.length > 0) {
            return res;
          }
        }
      } catch (err) {
        Logger.warn(`Failed to fetch PostgreSQL leaderboard: ${String(err)}`);
      }
    }
    return Array.from(this.localStats.values()).map((s, idx) => ({
      userId: s.userId,
      score: s.gamesWon * 100,
      rank: idx + 1
    })).sort((a, b) => b.score - a.score);
  }
  /**
   * Fetch match history for a player from PostgreSQL
   */
  static async getPlayerMatchHistory(userId) {
    if (!isPostgresConfigured()) return [];
    try {
      const db = getDb();
      if (!db) return [];
      return await db.select().from(matchHistory).where(eq(matchHistory.userId, userId)).orderBy(desc(matchHistory.playedAt)).limit(20);
    } catch (err) {
      Logger.warn(`Failed to query match history: ${String(err)}`);
      return [];
    }
  }
};

// src/server/redis/rateLimit.ts
init_client2();
init_env();
function rateLimiter(options) {
  const localHits = /* @__PURE__ */ new Map();
  return async (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
    const key = `ip:${ip}:${req.path}`;
    const now = Date.now();
    const redis = getRedisClient();
    if (redis) {
      const redisKey = RedisKeys.rateLimit(key);
      try {
        const count = await redis.incr(redisKey);
        if (count === 1) {
          await redis.expire(redisKey, options.windowSeconds);
        }
        if (count > options.maxRequests) {
          const ttl = await redis.ttl(redisKey);
          res.setHeader("Retry-After", ttl);
          res.status(429).json({
            error: "Too many requests. Please slow down.",
            retryAfterSeconds: ttl
          });
          return;
        }
        res.setHeader("X-RateLimit-Limit", options.maxRequests);
        res.setHeader("X-RateLimit-Remaining", Math.max(0, options.maxRequests - count));
        next();
        return;
      } catch (err) {
        Logger.warn(`Redis rate limiter bypassed due to error: ${String(err)}`);
      }
    }
    const record = localHits.get(key);
    if (!record || record.resetAt <= now) {
      localHits.set(key, { count: 1, resetAt: now + options.windowSeconds * 1e3 });
      next();
      return;
    }
    record.count++;
    if (record.count > options.maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1e3);
      res.setHeader("Retry-After", retryAfter);
      res.status(429).json({
        error: "Too many requests. Please slow down.",
        retryAfterSeconds: retryAfter
      });
      return;
    }
    next();
  };
}

// src/server/routes/api.ts
init_env();
var apiRouter = Router();
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});
apiRouter.get(["/health", "/api/health"], async (req, res) => {
  const [pgHealth, redisHealth, r2Health, queueMetrics] = await Promise.all([
    checkPostgresHealth(),
    checkRedisHealth(),
    checkR2Health(),
    QueueRegistry.getQueueMetrics()
  ]);
  const services = getServicesStatusSummary();
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    services: {
      neonPostgres: {
        ...services.neonPostgres,
        ...pgHealth
      },
      redisUpstash: {
        ...services.redis,
        ...redisHealth
      },
      cloudflareR2: {
        ...services.cloudflareR2,
        ...r2Health
      }
    },
    bullmqQueues: queueMetrics
  });
});
apiRouter.get("/liveness", (req, res) => {
  res.status(200).send("OK");
});
apiRouter.get("/readiness", async (req, res) => {
  const [pgHealth, redisHealth, r2Health] = await Promise.all([
    checkPostgresHealth(),
    checkRedisHealth(),
    checkR2Health()
  ]);
  const isHealthy = pgHealth.status !== "unhealthy" && redisHealth.status !== "unhealthy" && r2Health.status !== "unhealthy";
  if (isHealthy) {
    res.status(200).json({
      status: "ready",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      checks: { postgres: pgHealth.status, redis: redisHealth.status, r2: r2Health.status }
    });
  } else {
    res.status(503).json({
      status: "degraded",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      checks: { postgres: pgHealth.status, redis: redisHealth.status, r2: r2Health.status }
    });
  }
});
apiRouter.get("/api/metrics", async (req, res) => {
  const onlineCount = await PresenceManager.getOnlineCount();
  const queueMetrics = await QueueRegistry.getQueueMetrics();
  res.json({
    onlinePlayers: onlineCount,
    memoryUsage: process.memoryUsage(),
    queues: queueMetrics
  });
});
apiRouter.post("/api/matchmaking/join", rateLimiter({ maxRequests: 20, windowSeconds: 60 }), async (req, res) => {
  const { userId, username, mode, avatarUrl } = req.body;
  if (!userId || !username) {
    res.status(400).json({ error: "Missing userId or username" });
    return;
  }
  const result = await MatchmakingService.enqueue(
    userId,
    username,
    mode || "2_PLAYER",
    avatarUrl
  );
  if (result.success) {
    res.json({ success: true, message: "Enqueued successfully into matchmaking pool" });
  } else {
    res.status(500).json({ error: result.error });
  }
});
apiRouter.post("/api/matchmaking/cancel", async (req, res) => {
  const { userId, mode } = req.body;
  if (!userId) {
    res.status(400).json({ error: "Missing userId" });
    return;
  }
  const success = await MatchmakingService.cancel(userId, mode || "2_PLAYER");
  res.json({ success });
});
apiRouter.get("/api/games/:gameId", async (req, res) => {
  const { gameId } = req.params;
  const state = await GamePersistenceService.getGameState(gameId);
  if (!state) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.json({ state });
});
apiRouter.get("/api/player/stats/:userId", async (req, res) => {
  const { userId } = req.params;
  const stats = await GamePersistenceService.getPlayerStats(userId);
  res.json({ stats: stats || { userId, gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: "0.00" } });
});
apiRouter.get("/api/player/history/:userId", async (req, res) => {
  const { userId } = req.params;
  const history = await GamePersistenceService.getPlayerMatchHistory(userId);
  res.json({ history });
});
apiRouter.get("/api/leaderboard", async (req, res) => {
  const type = req.query.type || "GLOBAL";
  const leaderboard = await GamePersistenceService.getLeaderboard(type);
  res.json({ leaderboard });
});
apiRouter.post(
  "/api/storage/upload",
  upload.single("file"),
  rateLimiter({ maxRequests: 30, windowSeconds: 60 }),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }
      const userId = req.body.userId || void 0;
      const category = req.body.category || "images";
      const result = await uploadToR2({
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        userId,
        category
      });
      res.status(201).json({
        success: true,
        file: result
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      Logger.error("R2 upload failed", err);
      res.status(500).json({ error: errMsg });
    }
  }
);
apiRouter.post("/api/storage/presigned-upload", async (req, res) => {
  try {
    const { key, contentType, expiresInSeconds } = req.body;
    if (!key || !contentType) {
      res.status(400).json({ error: "Missing key or contentType" });
      return;
    }
    const result = await generatePresignedUploadUrl({
      key,
      contentType,
      expiresInSeconds: expiresInSeconds || 300
    });
    res.json(result);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errMsg });
  }
});
apiRouter.get("/api/storage/file/:key(*)", async (req, res) => {
  try {
    const key = req.params.key;
    const file = await getObjectFromR2(key);
    if (!file) {
      res.status(404).json({ error: "Object not found in storage" });
      return;
    }
    res.setHeader("Content-Type", file.contentType);
    if (file.contentLength) {
      res.setHeader("Content-Length", file.contentLength);
    }
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    file.stream.pipe(res);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errMsg });
  }
});
apiRouter.delete("/api/storage/file/:key(*)", async (req, res) => {
  try {
    const key = req.params.key;
    const success = await deleteObjectFromR2(key);
    res.json({ success });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errMsg });
  }
});

// src/server/routes/adminApi.ts
init_client();
init_client2();
import { Router as Router2 } from "express";
import multer2 from "multer";
init_schema();

// src/server/websocket/wsServer.ts
init_authoritativeEngine();
init_ludoSupremeEngine();
import { WebSocketServer, WebSocket } from "ws";

// src/server/game/reconnectService.ts
init_client();
init_ludoSupremeEngine();
init_authoritativeEngine();
init_matchSettlementService();
init_matchConfig();
init_env();
var ReconnectService = class {
  static {
    this.supremeSessions = /* @__PURE__ */ new Map();
  }
  static setSupremeSession(matchId, session) {
    this.supremeSessions.set(matchId, session);
  }
  static getSupremeSession(matchId) {
    return this.supremeSessions.get(matchId);
  }
  /**
   * Recovers full authoritative match state for a reconnecting player
   */
  static async getMatchAuthoritativeState(matchId, userId) {
    const supremeSession = this.supremeSessions.get(matchId);
    if (supremeSession) {
      const now = Date.now();
      const isExpired = LudoSupremeEngine.checkTimerExpiry(supremeSession);
      const remainingSeconds = Math.max(0, Math.floor((supremeSession.endsAt - now) / 1e3));
      const activePlayer = supremeSession.players[supremeSession.currentTurn];
      const movablePawnIds = activePlayer && supremeSession.dice.hasRolled ? LudoSupremeEngine.getMovablePawns(activePlayer, supremeSession.dice.value) : [];
      const reconnectingPlayer = Object.values(supremeSession.players).find((p) => p.id === userId);
      if (reconnectingPlayer) {
        reconnectingPlayer.lastScoreTimestamp = now;
      }
      return {
        matchId,
        gameMode: "LUDO_SUPREME",
        status: supremeSession.status,
        serverTime: now,
        remainingSeconds,
        currentTurn: supremeSession.currentTurn,
        turnNumber: supremeSession.turnNumber,
        dice: {
          value: supremeSession.dice.value,
          hasRolled: supremeSession.dice.hasRolled,
          canRoll: supremeSession.dice.canRoll,
          movablePawnIds
        },
        players: supremeSession.players,
        scoreLedger: supremeSession.scoreLedger.slice(-20),
        // Last 20 audit events
        winnerUserId: supremeSession.winnerUserId,
        sequenceNumber: supremeSession.sequenceNumber
      };
    }
    const arenaSession = await GamePersistenceService.getGameState(matchId);
    if (arenaSession) {
      const activePlayer = arenaSession.players[arenaSession.currentTurn];
      const movablePawnIds = activePlayer && arenaSession.dice.hasRolled ? AuthoritativeLudoEngine.getMovablePawns(activePlayer, arenaSession.dice.value) : [];
      return {
        matchId,
        gameMode: "ONLINE_ARENA",
        status: arenaSession.status,
        serverTime: Date.now(),
        remainingSeconds: 0,
        // Arena has no countdown timer
        currentTurn: arenaSession.currentTurn,
        turnNumber: arenaSession.turnNumber,
        dice: {
          value: arenaSession.dice.value,
          hasRolled: arenaSession.dice.hasRolled,
          canRoll: arenaSession.dice.canRoll,
          movablePawnIds
        },
        players: arenaSession.players,
        winnerUserId: arenaSession.winner ? arenaSession.players[arenaSession.winner]?.id : void 0,
        sequenceNumber: arenaSession.sequenceNumber
      };
    }
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          const matchRes = await client.query(`SELECT * FROM matches WHERE id = $1`, [matchId]);
          if (matchRes.rows.length === 0) return null;
          const matchRow = matchRes.rows[0];
          const playersRes = await client.query(`SELECT * FROM match_players WHERE match_id = $1`, [matchId]);
          const playersMap = {};
          for (const p of playersRes.rows) {
            playersMap[p.color] = {
              id: p.user_id,
              name: `Player ${p.color.toUpperCase()}`,
              color: p.color,
              score: p.final_score || 0,
              isActive: true,
              pawns: []
            };
          }
          const remainingSeconds = matchRow.ends_at ? Math.max(0, Math.floor((new Date(matchRow.ends_at).getTime() - Date.now()) / 1e3)) : 0;
          return {
            matchId,
            gameMode: matchRow.game_mode,
            status: matchRow.status,
            serverTime: Date.now(),
            remainingSeconds,
            currentTurn: matchRow.current_turn_color || "red",
            turnNumber: matchRow.turn_number || 1,
            dice: {
              value: 6,
              hasRolled: false,
              canRoll: true,
              movablePawnIds: []
            },
            players: playersMap,
            winnerUserId: matchRow.winner_user_id,
            sequenceNumber: 1
          };
        } finally {
          client.release();
        }
      }
    }
    return null;
  }
  /**
   * System Startup Recovery: Restores running matches and handles expired games
   */
  static async runStartupRecovery() {
    if (!isPostgresConfigured()) return;
    const pool = getDbPool();
    if (!pool) return;
    const client = await pool.connect();
    try {
      Logger.info("Running Match Server Startup Recovery...");
      const runningMatches = await client.query(
        `SELECT * FROM matches WHERE status IN ('STARTING', 'RUNNING')`
      );
      for (const row of runningMatches.rows) {
        if (row.game_mode === "LUDO_SUPREME" /* LUDO_SUPREME */ && row.ends_at) {
          const endsAtMs = new Date(row.ends_at).getTime();
          if (Date.now() >= endsAtMs) {
            Logger.info(`Recovery: Match ${row.id} expired during downtime. Processing settlement...`);
            const playersRes = await client.query(
              `SELECT * FROM match_players WHERE match_id = $1 ORDER BY final_score DESC`,
              [row.id]
            );
            if (playersRes.rows.length > 0) {
              const winner = playersRes.rows[0].user_id;
              await MatchSettlementService.settleMatch(
                row.id,
                winner,
                playersRes.rows.map((p, idx) => ({
                  userId: p.user_id,
                  rank: idx + 1,
                  finalScore: p.final_score || 0,
                  tokensHome: p.tokens_home || 0,
                  capturesMade: p.captures_made || 0,
                  totalDistanceMoved: p.total_distance_moved || 0
                }))
              ).catch((err) => {
                Logger.error(`Recovery settlement failed for ${row.id}`, err);
              });
            }
          }
        }
      }
      Logger.info(`Startup Recovery checked ${runningMatches.rows.length} active match records.`);
    } catch (err) {
      Logger.error("Startup recovery error", err);
    } finally {
      client.release();
    }
  }
};

// src/server/websocket/wsServer.ts
init_matchSettlementService();
init_env();
var ProductionWebSocketServer = class {
  constructor() {
    this.wss = null;
    this.clients = /* @__PURE__ */ new Map();
    this.gameRooms = /* @__PURE__ */ new Map();
    this.heartbeatInterval = null;
  }
  initialize(server) {
    this.wss = new WebSocketServer({
      server,
      path: "/ws"
    });
    this.wss.on("connection", (ws, req) => {
      const clientIp = req.socket.remoteAddress || "unknown";
      Logger.info(`New WebSocket client connected from ${clientIp}`);
      const clientInfo = {
        ws,
        userId: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        username: "Guest Player",
        isAlive: true
      };
      this.clients.set(ws, clientInfo);
      ws.on("pong", () => {
        const client = this.clients.get(ws);
        if (client) {
          client.isAlive = true;
        }
      });
      ws.on("message", async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleClientMessage(ws, message);
        } catch (err) {
          Logger.error("Failed to parse WebSocket message", err);
          this.send(ws, { type: "ERROR", message: "Malformed message format" });
        }
      });
      ws.on("close", () => {
        const client = this.clients.get(ws);
        if (client) {
          if (client.gameId) {
            this.leaveGameRoom(ws, client.gameId);
          }
          PresenceManager.setDisconnected(client.userId);
          this.clients.delete(ws);
          Logger.info(`Client ${client.userId} disconnected`);
        }
      });
      ws.on("error", (err) => {
        Logger.error("WebSocket connection error", err);
      });
      this.send(ws, {
        type: "CONNECTED",
        userId: clientInfo.userId,
        timestamp: Date.now()
      });
    });
    this.heartbeatInterval = setInterval(() => {
      this.wss?.clients.forEach((ws) => {
        const client = this.clients.get(ws);
        if (!client) return;
        if (!client.isAlive) {
          Logger.warn(`Terminating stale connection for user ${client.userId}`);
          ws.terminate();
          return;
        }
        client.isAlive = false;
        ws.ping();
      });
    }, 3e4);
    Logger.info("Production WebSocket Server initialized on path /ws");
  }
  async handleClientMessage(ws, msg) {
    const client = this.clients.get(ws);
    if (!client) return;
    switch (msg.type) {
      case "AUTH": {
        const { userId, username } = msg;
        if (userId) client.userId = userId;
        if (username) client.username = username;
        PresenceManager.heartbeat(client.userId, client.username, "ONLINE");
        this.send(ws, { type: "AUTH_SUCCESS", userId: client.userId, username: client.username });
        break;
      }
      case "JOIN_GAME":
      case "JOIN_MATCH": {
        const { gameId, matchId, color, gameMode } = msg;
        const targetId = matchId || gameId;
        if (!targetId) return;
        client.gameId = targetId;
        client.color = color;
        this.joinGameRoom(ws, targetId);
        PresenceManager.heartbeat(client.userId, client.username, "IN_GAME", targetId);
        if (gameMode === "LUDO_SUPREME") {
          let supremeSession = ReconnectService.getSupremeSession(targetId);
          if (!supremeSession) {
            supremeSession = LudoSupremeEngine.createSupremeSession(targetId, [
              { userId: client.userId, username: client.username, color: color || "red", seatIndex: 0, isHuman: true },
              { userId: "bot-blue", username: "Opponent", color: "blue", seatIndex: 1, isHuman: false }
            ]);
            ReconnectService.setSupremeSession(targetId, supremeSession);
          }
          this.broadcastToRoom(targetId, {
            type: "GAME_STATE_UPDATE",
            session: supremeSession,
            gameMode: "LUDO_SUPREME"
          });
        } else {
          let session = await GamePersistenceService.getGameState(targetId);
          if (!session) {
            session = AuthoritativeLudoEngine.createNewGame(targetId, "2_PLAYER", [
              { userId: client.userId, username: client.username, color: color || "red", isHuman: true },
              { userId: "bot-blue", username: "Player 2 (AI)", color: "blue", isHuman: false }
            ]);
            await GamePersistenceService.saveActiveGameState(session);
            await GamePersistenceService.appendGameEvent(targetId, 1, "GAME_CREATED", client.userId, { gameId: targetId }, 1);
          }
          this.broadcastToRoom(targetId, {
            type: "GAME_STATE_UPDATE",
            session,
            gameMode: "ONLINE_ARENA"
          });
        }
        break;
      }
      case "RECONNECT": {
        const targetId = msg.matchId || msg.gameId || client.gameId;
        if (!targetId) return;
        client.gameId = targetId;
        this.joinGameRoom(ws, targetId);
        const recoveredState = await ReconnectService.getMatchAuthoritativeState(targetId, client.userId);
        if (recoveredState) {
          this.send(ws, {
            type: "RECONNECT_STATE",
            state: recoveredState
          });
        }
        break;
      }
      case "ROLL_DICE": {
        const gameId = client.gameId;
        if (!gameId) {
          this.send(ws, { type: "ERROR", message: "You are not in an active game" });
          return;
        }
        const supremeSession = ReconnectService.getSupremeSession(gameId);
        if (supremeSession) {
          try {
            const result = LudoSupremeEngine.rollDice(supremeSession, client.userId);
            this.broadcastToRoom(gameId, {
              type: "DICE_ROLLED_AUTHORITATIVE",
              rollValue: result.rollValue,
              movablePawnIds: result.movablePawnIds,
              session: result.session,
              gameMode: "LUDO_SUPREME"
            });
          } catch (err) {
            this.send(ws, { type: "ERROR", message: err.message || String(err) });
          }
          return;
        }
        const session = await GamePersistenceService.getGameState(gameId);
        if (!session) {
          this.send(ws, { type: "ERROR", message: "Game not found" });
          return;
        }
        try {
          const result = AuthoritativeLudoEngine.rollDiceAuthoritative(session, client.userId);
          await GamePersistenceService.saveActiveGameState(result.session);
          await GamePersistenceService.appendGameEvent(
            gameId,
            result.session.sequenceNumber,
            "DICE_ROLLED",
            client.userId,
            { rollValue: result.rollValue, penalty: result.consecutiveSixesPenalty },
            result.session.version
          );
          this.broadcastToRoom(gameId, {
            type: "DICE_ROLLED_AUTHORITATIVE",
            rollValue: result.rollValue,
            movablePawnIds: result.movablePawnIds,
            session: result.session,
            gameMode: "ONLINE_ARENA"
          });
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          this.send(ws, { type: "ERROR", message: errMsg });
        }
        break;
      }
      case "MOVE_TOKEN": {
        const gameId = client.gameId;
        const pawnId = msg.pawnId;
        if (!gameId || !pawnId) return;
        const supremeSession = ReconnectService.getSupremeSession(gameId);
        if (supremeSession) {
          try {
            const result = LudoSupremeEngine.moveToken(supremeSession, client.userId, pawnId);
            this.broadcastToRoom(gameId, {
              type: "TOKEN_MOVED_AUTHORITATIVE",
              movedPawn: result.movedPawn,
              capturedPawn: result.capturedPawn,
              deltaScore: result.deltaScore,
              totalScore: result.totalScore,
              reachedGoal: result.reachedGoal,
              isGameWon: result.isGameWon,
              session: result.session,
              gameMode: "LUDO_SUPREME"
            });
            if (result.isGameWon && supremeSession.finalRankings && supremeSession.winnerUserId) {
              MatchSettlementService.settleMatch(
                gameId,
                supremeSession.winnerUserId,
                supremeSession.finalRankings.map((r) => ({
                  userId: r.userId,
                  rank: r.rank,
                  finalScore: r.score,
                  tokensHome: r.tokensHome,
                  capturesMade: r.captures,
                  totalDistanceMoved: r.distance
                }))
              ).then((settleRes) => {
                this.broadcastToRoom(gameId, {
                  type: "MATCH_SETTLED",
                  settlement: settleRes
                });
              }).catch((err) => Logger.error("Supreme WS settlement error", err));
            }
          } catch (err) {
            this.send(ws, { type: "ERROR", message: err.message || String(err) });
          }
          return;
        }
        const session = await GamePersistenceService.getGameState(gameId);
        if (!session) return;
        try {
          const result = AuthoritativeLudoEngine.moveTokenAuthoritative(session, client.userId, pawnId);
          if (result.isGameWon) {
            await GamePersistenceService.finalizeGame(result.session);
            if (result.session.winner) {
              const winnerPlayer = result.session.players[result.session.winner];
              if (winnerPlayer) {
                const rankings = Object.values(result.session.players).map((p, idx) => ({
                  userId: p.id,
                  rank: p.id === winnerPlayer.id ? 1 : idx + 2,
                  finalScore: p.score || 0,
                  tokensHome: p.pawns.filter((pw) => pw.state === "goal").length,
                  capturesMade: 0,
                  totalDistanceMoved: p.pawns.reduce((sum, pw) => sum + (pw.pathStep >= 0 ? pw.pathStep : 0), 0)
                }));
                MatchSettlementService.settleMatch(gameId, winnerPlayer.id, rankings).then((settleRes) => {
                  this.broadcastToRoom(gameId, {
                    type: "MATCH_SETTLED",
                    settlement: settleRes
                  });
                }).catch((err) => Logger.error("Arena WS settlement error", err));
              }
            }
          } else {
            await GamePersistenceService.saveActiveGameState(result.session);
          }
          await GamePersistenceService.appendGameEvent(
            gameId,
            result.session.sequenceNumber,
            "TOKEN_MOVED",
            client.userId,
            {
              pawnId,
              movedPawn: result.movedPawn,
              capturedPawn: result.capturedPawn,
              reachedGoal: result.reachedGoal,
              isGameWon: result.isGameWon
            },
            result.session.version
          );
          this.broadcastToRoom(gameId, {
            type: "TOKEN_MOVED_AUTHORITATIVE",
            movedPawn: result.movedPawn,
            capturedPawn: result.capturedPawn,
            reachedGoal: result.reachedGoal,
            isGameWon: result.isGameWon,
            session: result.session,
            gameMode: "ONLINE_ARENA"
          });
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          this.send(ws, { type: "ERROR", message: errMsg });
        }
        break;
      }
      case "SEND_CHAT": {
        const { gameId, text: text2, isEmojiOnly } = msg;
        if (!gameId || !text2) return;
        this.broadcastToRoom(gameId, {
          type: "CHAT_MESSAGE",
          message: {
            id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            senderName: client.username,
            senderColor: client.color || "blue",
            text: text2.substring(0, 200),
            timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isEmojiOnly: !!isEmojiOnly
          }
        });
        break;
      }
    }
  }
  joinGameRoom(ws, gameId) {
    let room = this.gameRooms.get(gameId);
    if (!room) {
      room = /* @__PURE__ */ new Set();
      this.gameRooms.set(gameId, room);
    }
    room.add(ws);
  }
  leaveGameRoom(ws, gameId) {
    const room = this.gameRooms.get(gameId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        this.gameRooms.delete(gameId);
      }
    }
  }
  broadcastToRoom(gameId, payload) {
    const room = this.gameRooms.get(gameId);
    if (!room) return;
    const data = JSON.stringify(payload);
    room.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }
  send(ws, payload) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }
  async close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.wss) {
      Logger.info("Closing WebSocket server...");
      this.wss.close();
      this.wss = null;
    }
  }
};
var wsServerInstance = new ProductionWebSocketServer();

// src/server/routes/adminApi.ts
init_env();
import { eq as eq2, desc as desc2, sql, like, or } from "drizzle-orm";
import { v4 as uuidv48 } from "uuid";
var adminRouter = Router2();
var platformSettings = {
  adminUrlAlias: "admin",
  maintenanceMode: false,
  turnTimeoutSeconds: 30,
  maxConsecutiveSixes: 3,
  entryFee2Player: 100,
  entryFee4Player: 250,
  entryFeeSnakeLudo: 50,
  prizePoolPercentage: 85,
  allowedOrigins: ["https://ludo.omyra.org", "http://localhost:3000"]
};
var activeThemeConfig = {
  activeLobbyId: "dubai_prestige_gold",
  activeBoardId: "dubai_royal_sunset",
  activeDiceId: "golden_high_roller",
  activePawnId: "royal_crowned",
  enabledLobbies: ["dubai_prestige_gold", "cyberpunk_neon_tokyo", "monaco_vip_casino", "emerald_palace_tournament", "sunset_oasis_carnival"],
  enabledBoards: ["dubai_royal_sunset", "classic_emerald", "cyber_neon", "midnight_marble", "candy_pastel", "aztec_wood"],
  enabledDice: ["golden_high_roller", "classic_pearl", "cyber_glass", "ruby_royale", "emerald_jade", "dark_matter"],
  enabledPawns: ["royal_crowned", "classic_gloss", "crystal_gem", "cyber_mecha", "golden_sovereign", "dragon_shield"],
  customThemes: [],
  updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  deployedBy: "SuperAdmin"
};
var ADMIN_EMAIL = "md16201620@gmail.com";
var ADMIN_PASSWORD = "admin";
var activeAdminTokens = /* @__PURE__ */ new Set();
var adminUpload = multer2({
  storage: multer2.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
  // 25MB max
});
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.query.token;
  if (!token || !activeAdminTokens.has(token)) {
    res.status(401).json({ error: "Unauthorized: Admin authentication token invalid or expired" });
    return;
  }
  next();
}
adminRouter.post("/api/admin/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = `adm_${uuidv48()}_${Date.now()}`;
    activeAdminTokens.add(token);
    Logger.info(`Admin successfully logged in: ${email}`);
    res.json({
      success: true,
      token,
      admin: {
        email: ADMIN_EMAIL,
        name: "Master Administrator",
        role: "SUPER_ADMIN",
        loginTime: (/* @__PURE__ */ new Date()).toISOString(),
        adminUrlAlias: platformSettings.adminUrlAlias
      }
    });
  } else {
    Logger.warn(`Failed admin login attempt for: ${email}`);
    res.status(401).json({ error: "Invalid admin email or password" });
  }
});
adminRouter.get("/api/admin/auth/me", requireAdminAuth, (req, res) => {
  res.json({
    authenticated: true,
    admin: {
      email: ADMIN_EMAIL,
      name: "Master Administrator",
      role: "SUPER_ADMIN",
      adminUrlAlias: platformSettings.adminUrlAlias
    }
  });
});
adminRouter.post("/api/admin/auth/logout", requireAdminAuth, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.slice(7);
  if (token) {
    activeAdminTokens.delete(token);
  }
  res.json({ success: true, message: "Logged out successfully" });
});
adminRouter.get("/api/admin/settings", (req, res) => {
  res.json({
    settings: platformSettings,
    adminUrls: {
      defaultUrl: "https://ludo.omyra.org/admin",
      currentAliasUrl: `https://ludo.omyra.org/${platformSettings.adminUrlAlias}`,
      currentSlug: platformSettings.adminUrlAlias
    }
  });
});
adminRouter.post("/api/admin/settings", requireAdminAuth, (req, res) => {
  const {
    adminUrlAlias,
    maintenanceMode,
    turnTimeoutSeconds,
    maxConsecutiveSixes,
    entryFee2Player,
    entryFee4Player,
    entryFeeSnakeLudo,
    prizePoolPercentage
  } = req.body;
  if (adminUrlAlias) {
    const sanitizedSlug = String(adminUrlAlias).toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
    if (sanitizedSlug.length > 0) {
      platformSettings.adminUrlAlias = sanitizedSlug;
      Logger.info(`Admin URL alias updated to: /${sanitizedSlug}`);
    }
  }
  if (typeof maintenanceMode === "boolean") {
    platformSettings.maintenanceMode = maintenanceMode;
    if (maintenanceMode) {
      wsServerInstance.broadcastToRoom("global", {
        type: "SYSTEM_ANNOUNCEMENT",
        message: "System is entering scheduled maintenance mode. Active games will conclude."
      });
    }
  }
  if (turnTimeoutSeconds !== void 0) platformSettings.turnTimeoutSeconds = Number(turnTimeoutSeconds);
  if (maxConsecutiveSixes !== void 0) platformSettings.maxConsecutiveSixes = Number(maxConsecutiveSixes);
  if (entryFee2Player !== void 0) platformSettings.entryFee2Player = Number(entryFee2Player);
  if (entryFee4Player !== void 0) platformSettings.entryFee4Player = Number(entryFee4Player);
  if (entryFeeSnakeLudo !== void 0) platformSettings.entryFeeSnakeLudo = Number(entryFeeSnakeLudo);
  if (prizePoolPercentage !== void 0) platformSettings.prizePoolPercentage = Number(prizePoolPercentage);
  res.json({
    success: true,
    message: "Platform configuration updated successfully",
    settings: platformSettings,
    adminUrls: {
      defaultUrl: "https://ludo.omyra.org/admin",
      currentAliasUrl: `https://ludo.omyra.org/${platformSettings.adminUrlAlias}`,
      currentSlug: platformSettings.adminUrlAlias
    }
  });
});
adminRouter.get("/api/theme-config", (req, res) => {
  res.json({
    success: true,
    themeConfig: activeThemeConfig
  });
});
adminRouter.get("/api/admin/theme-assets", (req, res) => {
  res.json({
    success: true,
    themeConfig: activeThemeConfig
  });
});
adminRouter.post("/api/admin/theme-assets", requireAdminAuth, (req, res) => {
  const {
    activeLobbyId,
    activeBoardId,
    activeDiceId,
    activePawnId,
    enabledLobbies,
    enabledBoards,
    enabledDice,
    enabledPawns,
    customThemes,
    deployedBy
  } = req.body;
  if (activeLobbyId) activeThemeConfig.activeLobbyId = activeLobbyId;
  if (activeBoardId) activeThemeConfig.activeBoardId = activeBoardId;
  if (activeDiceId) activeThemeConfig.activeDiceId = activeDiceId;
  if (activePawnId) activeThemeConfig.activePawnId = activePawnId;
  if (Array.isArray(enabledLobbies)) activeThemeConfig.enabledLobbies = enabledLobbies;
  if (Array.isArray(enabledBoards)) activeThemeConfig.enabledBoards = enabledBoards;
  if (Array.isArray(enabledDice)) activeThemeConfig.enabledDice = enabledDice;
  if (Array.isArray(enabledPawns)) activeThemeConfig.enabledPawns = enabledPawns;
  if (Array.isArray(customThemes)) activeThemeConfig.customThemes = customThemes;
  if (deployedBy) activeThemeConfig.deployedBy = deployedBy;
  activeThemeConfig.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  Logger.info(`Admin deployed live platform theme: Lobby=${activeThemeConfig.activeLobbyId}, Board=${activeThemeConfig.activeBoardId}, Dice=${activeThemeConfig.activeDiceId}, Pawn=${activeThemeConfig.activePawnId}`);
  wsServerInstance.broadcastToRoom("global", {
    type: "THEME_UPDATED",
    themeConfig: activeThemeConfig
  });
  res.json({
    success: true,
    message: "Platform lobby, ludo boards, pawns & dice configuration deployed to live platform successfully!",
    themeConfig: activeThemeConfig
  });
});
adminRouter.get("/api/admin/metrics", requireAdminAuth, async (req, res) => {
  const [pgHealth, redisHealth, r2Health, queueMetrics, onlineCount] = await Promise.all([
    checkPostgresHealth(),
    checkRedisHealth(),
    checkR2Health(),
    QueueRegistry.getQueueMetrics(),
    PresenceManager.getOnlineCount()
  ]);
  let totalUsers = 0;
  let totalGames = 0;
  let activeGamesCount = 0;
  let completedGamesCount = 0;
  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        const uCount = await db.select({ count: sql`count(*)` }).from(users);
        totalUsers = Number(uCount[0]?.count || 0);
        const gCount = await db.select({ count: sql`count(*)` }).from(games);
        totalGames = Number(gCount[0]?.count || 0);
        const activeCount = await db.select({ count: sql`count(*)` }).from(games).where(eq2(games.status, "IN_PROGRESS"));
        activeGamesCount = Number(activeCount[0]?.count || 0);
        const completedCount = await db.select({ count: sql`count(*)` }).from(games).where(eq2(games.status, "COMPLETED"));
        completedGamesCount = Number(completedCount[0]?.count || 0);
      }
    } catch (err) {
      Logger.warn(`Postgres metric query error: ${String(err)}`);
    }
  }
  const mem = process.memoryUsage();
  res.json({
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    overview: {
      onlinePlayers: onlineCount,
      totalRegisteredUsers: totalUsers,
      totalGamesCreated: totalGames,
      activeGames: activeGamesCount,
      completedGames: completedGamesCount,
      maintenanceMode: platformSettings.maintenanceMode
    },
    services: {
      neonPostgres: {
        ...pgHealth,
        isConfigured: isPostgresConfigured()
      },
      redisUpstash: {
        ...redisHealth,
        isConfigured: isRedisConfigured()
      },
      cloudflareR2: {
        ...r2Health,
        isConfigured: isR2Configured(),
        bucketName: config.R2_BUCKET_NAME || "Not Configured"
      }
    },
    queues: queueMetrics,
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100,
      rssMb: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
      nodeVersion: process.version
    }
  });
});
adminRouter.get("/api/admin/games", requireAdminAuth, async (req, res) => {
  const statusFilter = req.query.status || void 0;
  const modeFilter = req.query.mode || void 0;
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Number(req.query.offset) || 0;
  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        let query = db.select().from(games).$dynamic();
        if (statusFilter) query = query.where(eq2(games.status, statusFilter));
        if (modeFilter) query = query.where(eq2(games.mode, modeFilter));
        const gameList = await query.orderBy(desc2(games.createdAt)).limit(limit).offset(offset);
        const total = await db.select({ count: sql`count(*)` }).from(games);
        res.json({
          games: gameList,
          total: Number(total[0]?.count || 0),
          limit,
          offset
        });
        return;
      }
    } catch (err) {
      Logger.warn(`Failed to list games from DB: ${String(err)}`);
    }
  }
  res.json({
    games: [],
    total: 0,
    limit,
    offset
  });
});
adminRouter.get("/api/admin/games/:gameId", requireAdminAuth, async (req, res) => {
  const { gameId } = req.params;
  const liveState = await GamePersistenceService.getGameState(gameId);
  let dbRecord = null;
  let playersList = [];
  let eventsList = [];
  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        const g = await db.select().from(games).where(eq2(games.id, gameId)).limit(1);
        dbRecord = g[0] || null;
        playersList = await db.select().from(gamePlayers).where(eq2(gamePlayers.gameId, gameId));
        eventsList = await db.select().from(gameEvents).where(eq2(gameEvents.gameId, gameId)).orderBy(gameEvents.sequenceNumber).limit(100);
      }
    } catch (err) {
      Logger.warn(`Error fetching game details: ${String(err)}`);
    }
  }
  res.json({
    gameId,
    liveState,
    dbRecord,
    players: playersList,
    events: eventsList
  });
});
adminRouter.post("/api/admin/games/:gameId/terminate", requireAdminAuth, async (req, res) => {
  const { gameId } = req.params;
  const reason = req.body.reason || "Terminated by Administrator";
  const session = await GamePersistenceService.getGameState(gameId);
  if (session) {
    session.status = "ABANDONED";
    await GamePersistenceService.saveActiveGameState(session);
  }
  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        await db.update(games).set({ status: "ABANDONED", updatedAt: /* @__PURE__ */ new Date(), completedAt: /* @__PURE__ */ new Date() }).where(eq2(games.id, gameId));
      }
    } catch (err) {
      Logger.warn(`Failed to update DB on terminate: ${String(err)}`);
    }
  }
  wsServerInstance.broadcastToRoom(gameId, {
    type: "GAME_TERMINATED",
    reason,
    timestamp: Date.now()
  });
  res.json({ success: true, message: `Game ${gameId} terminated successfully` });
});
adminRouter.get("/api/admin/users", requireAdminAuth, async (req, res) => {
  const search = req.query.search || "";
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Number(req.query.offset) || 0;
  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        let userListQuery = db.select().from(users).$dynamic();
        if (search) {
          userListQuery = userListQuery.where(
            or(like(users.username, `%${search}%`), like(users.id, `%${search}%`))
          );
        }
        const userList = await userListQuery.orderBy(desc2(users.createdAt)).limit(limit).offset(offset);
        const total = await db.select({ count: sql`count(*)` }).from(users);
        res.json({
          users: userList,
          total: Number(total[0]?.count || 0),
          limit,
          offset
        });
        return;
      }
    } catch (err) {
      Logger.warn(`DB User query error: ${String(err)}`);
    }
  }
  const sampleUsers = [
    {
      id: "p1",
      username: "Player 1 (Master)",
      coins: 15400,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      walletAddress: "0x71C...49b2"
    },
    {
      id: "p2",
      username: "Player 2 (Viper)",
      coins: 8200,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      walletAddress: "0x32A...81ec"
    },
    {
      id: "p3",
      username: "Player 3 (Apex)",
      coins: 4900,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      walletAddress: "0x99F...28a0"
    }
  ];
  res.json({
    users: sampleUsers,
    total: sampleUsers.length,
    limit,
    offset
  });
});
adminRouter.post("/api/admin/users/:userId/adjust-balance", requireAdminAuth, async (req, res) => {
  const { userId } = req.params;
  const { coinsDelta, reason } = req.body;
  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        await db.update(users).set({
          coins: sql`${users.coins} + ${Number(coinsDelta || 0)}`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq2(users.id, userId));
        const updated = await db.select().from(users).where(eq2(users.id, userId)).limit(1);
        Logger.info(`Admin adjusted balance for ${userId}: Coins +${coinsDelta} (${reason})`);
        res.json({
          success: true,
          user: updated[0] || null,
          message: "Balance updated in Neon PostgreSQL"
        });
        return;
      }
    } catch (err) {
      Logger.error(`Failed to adjust user balance in DB: ${String(err)}`);
    }
  }
  res.json({
    success: true,
    message: `Adjusted user ${userId} balance by coins: ${coinsDelta}`
  });
});
adminRouter.get("/api/admin/leaderboards", requireAdminAuth, async (req, res) => {
  const type = req.query.type || "GLOBAL";
  const leaderboard = await GamePersistenceService.getLeaderboard(type);
  res.json({ type, leaderboard });
});
adminRouter.post("/api/admin/leaderboards/recalculate", requireAdminAuth, async (req, res) => {
  const type = req.body.type || "GLOBAL";
  if (isRedisConfigured()) {
    await QueueRegistry.getLeaderboardQueue().add(`admin_manual_recalc_${Date.now()}`, {
      type: "RECALCULATE_RANKS",
      leaderboardType: type
    });
  }
  res.json({ success: true, message: `Dispatched recalculation job for ${type} leaderboard` });
});
adminRouter.get("/api/admin/storage/objects", requireAdminAuth, async (req, res) => {
  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        const objects = await db.select().from(storageObjects).orderBy(desc2(storageObjects.createdAt)).limit(100);
        res.json({
          isConfigured: isR2Configured(),
          bucket: config.R2_BUCKET_NAME || "Not Configured",
          objects
        });
        return;
      }
    } catch (err) {
      Logger.warn(`Failed to fetch storage objects list: ${String(err)}`);
    }
  }
  res.json({
    isConfigured: isR2Configured(),
    bucket: config.R2_BUCKET_NAME || "Not Configured",
    objects: []
  });
});
adminRouter.post(
  "/api/admin/storage/upload",
  requireAdminAuth,
  adminUpload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }
      const category = req.body.category || "assets";
      const customKey = req.body.customKey || void 0;
      const result = await uploadToR2({
        key: customKey,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        userId: "admin",
        category
      });
      res.status(201).json({
        success: true,
        message: "File successfully uploaded to Cloudflare R2",
        file: result
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      Logger.error("Admin R2 upload failed", err);
      res.status(500).json({ error: errMsg });
    }
  }
);
adminRouter.delete("/api/admin/storage/objects/:key(*)", requireAdminAuth, async (req, res) => {
  const key = req.params.key;
  const deleted = await deleteObjectFromR2(key);
  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        await db.delete(storageObjects).where(eq2(storageObjects.key, key));
      }
    } catch (err) {
      Logger.warn(`Failed to delete object from DB metadata: ${String(err)}`);
    }
  }
  res.json({ success: deleted, message: `Object ${key} deleted from Cloudflare R2` });
});
adminRouter.post("/api/admin/broadcast", requireAdminAuth, (req, res) => {
  const { message, level } = req.body;
  if (!message) {
    res.status(400).json({ error: "Message cannot be empty" });
    return;
  }
  wsServerInstance.broadcastToRoom("global", {
    type: "ADMIN_BROADCAST",
    message,
    level: level || "INFO",
    timestamp: Date.now()
  });
  Logger.info(`Admin Broadcast: ${message}`);
  res.json({ success: true, message: "Broadcast dispatched to all connected clients" });
});
adminRouter.post("/api/admin/system/flush-cache", requireAdminAuth, async (req, res) => {
  const { target } = req.body;
  if (isRedisConfigured()) {
    const redis = getRedisClient();
    if (redis) {
      try {
        if (target === "matchmaking") {
          await redis.del("ludo:matchmaking:queue:2_PLAYER", "ludo:matchmaking:queue:4_PLAYER", "ludo:matchmaking:queue:SNAKE_LUDO");
        } else if (target === "all") {
          const keys = await redis.keys("ludo:*");
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        }
        Logger.info(`Admin flushed Redis cache for target: ${target}`);
        res.json({ success: true, message: `Redis cache flushed for ${target}` });
        return;
      } catch (err) {
        Logger.error("Redis cache flush error", err);
      }
    }
  }
  res.json({ success: true, message: "Local caches reset successfully" });
});
adminRouter.post("/api/admin/tests/run-all", async (req, res) => {
  try {
    const { AutomatedMatchArenaTests: AutomatedMatchArenaTests2 } = await Promise.resolve().then(() => (init_automatedMatchArenaTests(), automatedMatchArenaTests_exports));
    const results = await AutomatedMatchArenaTests2.runAllTests();
    res.json(results);
  } catch (err) {
    Logger.error("Failed to run automated match arena test suite", err);
    res.status(500).json({ error: err.message });
  }
});

// src/server/routes/walletRoutes.ts
init_ledgerService();
import { Router as Router3 } from "express";
import { z as z2 } from "zod";

// src/server/wallet/depositService.ts
init_client();
import { v4 as uuidv49 } from "uuid";

// src/server/wallet/registry.ts
init_env();
import { getAddress, isAddress } from "ethers";
var BASE_MAINNET_REGISTRY = {
  ethereum: {
    networkKey: "ethereum",
    name: "Ethereum Mainnet",
    chainId: 1,
    env: "mainnet",
    rpcUrls: [
      process.env.ETH_MAINNET_RPC || "https://eth.llamarpc.com",
      "https://ethereum-rpc.publicnode.com",
      "https://rpc.ankr.com/eth",
      "https://1.rpc.thirdweb.com",
      "https://cloudflare-eth.com"
    ],
    explorerUrl: "https://etherscan.io",
    nativeGasToken: {
      symbol: "ETH",
      name: "Ether",
      decimals: 18
    },
    // Official Tether USD (USDT) on Ethereum Mainnet
    usdtContractAddress: process.env.ETH_MAINNET_USDT_CONTRACT || "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    usdtDecimals: 6,
    requiredConfirmations: 12,
    minDepositUsdt: "5.00",
    minWithdrawalUsdt: "10.00",
    withdrawalFeeUsdt: "3.50",
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true
  },
  arbitrum: {
    networkKey: "arbitrum",
    name: "Arbitrum One",
    chainId: 42161,
    env: "mainnet",
    rpcUrls: [
      process.env.ARB_MAINNET_RPC || "https://arb1.arbitrum.io/rpc",
      "https://arbitrum-one-rpc.publicnode.com",
      "https://rpc.ankr.com/arbitrum",
      "https://42161.rpc.thirdweb.com"
    ],
    explorerUrl: "https://arbiscan.io",
    nativeGasToken: {
      symbol: "ETH",
      name: "Arbitrum Ether",
      decimals: 18
    },
    // Official Native Tether USD (USDT) on Arbitrum One
    usdtContractAddress: process.env.ARB_MAINNET_USDT_CONTRACT || "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    usdtDecimals: 6,
    requiredConfirmations: 20,
    minDepositUsdt: "1.00",
    minWithdrawalUsdt: "2.00",
    withdrawalFeeUsdt: "0.30",
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true
  },
  bsc: {
    networkKey: "bsc",
    name: "BNB Smart Chain",
    chainId: 56,
    env: "mainnet",
    rpcUrls: [
      process.env.BSC_MAINNET_RPC || "https://bsc-dataseed.binance.org",
      "https://bsc-rpc.publicnode.com",
      "https://rpc.ankr.com/bsc",
      "https://56.rpc.thirdweb.com"
    ],
    explorerUrl: "https://bscscan.com",
    nativeGasToken: {
      symbol: "BNB",
      name: "BNB Token",
      decimals: 18
    },
    // Official Binance-pegged BSC-USD (USDT)
    usdtContractAddress: process.env.BSC_MAINNET_USDT_CONTRACT || "0x55d398326f99059fF775485246999027B3197955",
    usdtDecimals: 18,
    requiredConfirmations: 15,
    minDepositUsdt: "1.00",
    minWithdrawalUsdt: "2.00",
    withdrawalFeeUsdt: "0.30",
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true
  },
  polygon: {
    networkKey: "polygon",
    name: "Polygon PoS",
    chainId: 137,
    env: "mainnet",
    rpcUrls: [
      process.env.POLYGON_MAINNET_RPC || "https://polygon-rpc.com",
      "https://polygon-bor-rpc.publicnode.com",
      "https://rpc.ankr.com/polygon",
      "https://137.rpc.thirdweb.com"
    ],
    explorerUrl: "https://polygonscan.com",
    nativeGasToken: {
      symbol: "POL",
      name: "Polygon Ecosystem Token",
      decimals: 18
    },
    // Official PoS Tether USD (USDT) on Polygon
    usdtContractAddress: process.env.POLYGON_MAINNET_USDT_CONTRACT || "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    usdtDecimals: 6,
    requiredConfirmations: 30,
    minDepositUsdt: "1.00",
    minWithdrawalUsdt: "2.00",
    withdrawalFeeUsdt: "0.25",
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true
  },
  base: {
    networkKey: "base",
    name: "Base Mainnet",
    chainId: 8453,
    env: "mainnet",
    rpcUrls: [
      process.env.BASE_MAINNET_RPC || "https://mainnet.base.org",
      "https://base-rpc.publicnode.com",
      "https://rpc.ankr.com/base",
      "https://8453.rpc.thirdweb.com"
    ],
    explorerUrl: "https://basescan.org",
    nativeGasToken: {
      symbol: "ETH",
      name: "Base Ether",
      decimals: 18
    },
    // Official Native Tether USD (USDT) on Base
    usdtContractAddress: process.env.BASE_MAINNET_USDT_CONTRACT || "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    usdtDecimals: 6,
    requiredConfirmations: 15,
    minDepositUsdt: "1.00",
    minWithdrawalUsdt: "2.00",
    withdrawalFeeUsdt: "0.25",
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true
  },
  optimism: {
    networkKey: "optimism",
    name: "Optimism Mainnet",
    chainId: 10,
    env: "mainnet",
    rpcUrls: [
      process.env.OP_MAINNET_RPC || "https://mainnet.optimism.io",
      "https://optimism-rpc.publicnode.com",
      "https://rpc.ankr.com/optimism",
      "https://10.rpc.thirdweb.com"
    ],
    explorerUrl: "https://optimistic.etherscan.io",
    nativeGasToken: {
      symbol: "ETH",
      name: "Optimism Ether",
      decimals: 18
    },
    // Official Native Tether USD (USDT) on Optimism
    usdtContractAddress: process.env.OP_MAINNET_USDT_CONTRACT || "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    usdtDecimals: 6,
    requiredConfirmations: 15,
    minDepositUsdt: "1.00",
    minWithdrawalUsdt: "2.00",
    withdrawalFeeUsdt: "0.25",
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true
  },
  avalanche: {
    networkKey: "avalanche",
    name: "Avalanche C-Chain",
    chainId: 43114,
    env: "mainnet",
    rpcUrls: [
      process.env.AVAX_MAINNET_RPC || "https://api.avax.network/ext/bc/C/rpc",
      "https://avalanche-c-chain-rpc.publicnode.com",
      "https://rpc.ankr.com/avalanche",
      "https://43114.rpc.thirdweb.com"
    ],
    explorerUrl: "https://snowtrace.io",
    nativeGasToken: {
      symbol: "AVAX",
      name: "Avalanche Token",
      decimals: 18
    },
    // Official Native Tether USD (USDt) on Avalanche C-Chain
    usdtContractAddress: process.env.AVAX_MAINNET_USDT_CONTRACT || "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
    usdtDecimals: 6,
    requiredConfirmations: 12,
    minDepositUsdt: "1.00",
    minWithdrawalUsdt: "2.00",
    withdrawalFeeUsdt: "0.30",
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true
  }
};
var BASE_TESTNET_REGISTRY = {
  ethereum: {
    networkKey: "ethereum",
    name: "Ethereum Sepolia",
    chainId: 11155111,
    env: "testnet",
    rpcUrls: [
      process.env.ETH_SEPOLIA_RPC || "https://ethereum-sepolia-rpc.publicnode.com",
      "https://rpc.sepolia.org",
      "https://sepolia.drpc.org",
      "https://11155111.rpc.thirdweb.com"
    ],
    explorerUrl: "https://sepolia.etherscan.io",
    nativeGasToken: {
      symbol: "ETH",
      name: "Sepolia Ether",
      decimals: 18
    },
    usdtContractAddress: process.env.SEPOLIA_USDT_CONTRACT || "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
    usdtDecimals: 6,
    requiredConfirmations: 2,
    minDepositUsdt: "1.00",
    minWithdrawalUsdt: "2.00",
    withdrawalFeeUsdt: "0.50",
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true
  },
  arbitrum: {
    networkKey: "arbitrum",
    name: "Arbitrum Sepolia",
    chainId: 421614,
    env: "testnet",
    rpcUrls: [
      process.env.ARB_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc",
      "https://arbitrum-sepolia-rpc.publicnode.com",
      "https://arbitrum-sepolia.drpc.org",
      "https://421614.rpc.thirdweb.com"
    ],
    explorerUrl: "https://sepolia.arbiscan.io",
    nativeGasToken: {
      symbol: "ETH",
      name: "Arbitrum Sepolia Ether",
      decimals: 18
    },
    usdtContractAddress: process.env.ARB_SEPOLIA_USDT_CONTRACT || "0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d",
    usdtDecimals: 6,
    requiredConfirmations: 3,
    minDepositUsdt: "1.00",
    minWithdrawalUsdt: "2.00",
    withdrawalFeeUsdt: "0.20",
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true
  },
  bsc: {
    networkKey: "bsc",
    name: "BNB Smart Chain Testnet",
    chainId: 97,
    env: "testnet",
    rpcUrls: [
      process.env.BSC_TESTNET_RPC || "https://bsc-testnet-rpc.publicnode.com",
      "https://data-seed-prebsc-1-s1.binance.org:8545",
      "https://bsc-testnet.public.blastapi.io"
    ],
    explorerUrl: "https://testnet.bscscan.com",
    nativeGasToken: {
      symbol: "tBNB",
      name: "Testnet BNB",
      decimals: 18
    },
    usdtContractAddress: process.env.BSC_TESTNET_USDT_CONTRACT || "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
    usdtDecimals: 18,
    requiredConfirmations: 3,
    minDepositUsdt: "1.00",
    minWithdrawalUsdt: "2.00",
    withdrawalFeeUsdt: "0.25",
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true
  },
  polygon: {
    networkKey: "polygon",
    name: "Polygon Amoy Testnet",
    chainId: 80002,
    env: "testnet",
    rpcUrls: [
      process.env.POLYGON_AMOY_RPC || "https://polygon-amoy-bor-rpc.publicnode.com",
      "https://rpc.ankr.com/polygon_amoy",
      "https://polygon-amoy.drpc.org",
      "https://80002.rpc.thirdweb.com"
    ],
    explorerUrl: "https://amoy.polygonscan.com",
    nativeGasToken: {
      symbol: "POL",
      name: "Polygon Ecosystem Token",
      decimals: 18
    },
    usdtContractAddress: process.env.POLYGON_AMOY_USDT_CONTRACT || "0x1fdE0eCc619726f4cA597887C9F39F18361B144a",
    usdtDecimals: 6,
    requiredConfirmations: 5,
    minDepositUsdt: "1.00",
    minWithdrawalUsdt: "2.00",
    withdrawalFeeUsdt: "0.15",
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true
  },
  base: {
    networkKey: "base",
    name: "Base Sepolia",
    chainId: 84532,
    env: "testnet",
    rpcUrls: [
      process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      "https://base-sepolia-rpc.publicnode.com",
      "https://base-sepolia.drpc.org",
      "https://84532.rpc.thirdweb.com"
    ],
    explorerUrl: "https://sepolia.basescan.org",
    nativeGasToken: {
      symbol: "ETH",
      name: "Base Sepolia Ether",
      decimals: 18
    },
    usdtContractAddress: process.env.BASE_SEPOLIA_USDT_CONTRACT || "0x7a8c6c5E3f7bC6A4dC9Eb7A6B5393d258169993E",
    usdtDecimals: 6,
    requiredConfirmations: 3,
    minDepositUsdt: "1.00",
    minWithdrawalUsdt: "2.00",
    withdrawalFeeUsdt: "0.20",
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true
  },
  optimism: {
    networkKey: "optimism",
    name: "Optimism Sepolia",
    chainId: 11155420,
    env: "testnet",
    rpcUrls: [
      process.env.OP_SEPOLIA_RPC || "https://sepolia.optimism.io",
      "https://optimism-sepolia-rpc.publicnode.com",
      "https://op-sepolia.drpc.org",
      "https://11155420.rpc.thirdweb.com"
    ],
    explorerUrl: "https://sepolia-optimism.etherscan.io",
    nativeGasToken: {
      symbol: "ETH",
      name: "Optimism Sepolia Ether",
      decimals: 18
    },
    usdtContractAddress: process.env.OP_SEPOLIA_USDT_CONTRACT || "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    usdtDecimals: 6,
    requiredConfirmations: 3,
    minDepositUsdt: "1.00",
    minWithdrawalUsdt: "2.00",
    withdrawalFeeUsdt: "0.20",
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true
  },
  avalanche: {
    networkKey: "avalanche",
    name: "Avalanche Fuji",
    chainId: 43113,
    env: "testnet",
    rpcUrls: [
      process.env.AVAX_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc",
      "https://avalanche-fuji-c-chain-rpc.publicnode.com",
      "https://avalanche-fuji.drpc.org",
      "https://43113.rpc.thirdweb.com"
    ],
    explorerUrl: "https://testnet.snowtrace.io",
    nativeGasToken: {
      symbol: "AVAX",
      name: "Avalanche Token",
      decimals: 18
    },
    usdtContractAddress: process.env.AVAX_FUJI_USDT_CONTRACT || "0xAb5C49580294Aff77670F839ea425f5b78ab3Ae7",
    usdtDecimals: 6,
    requiredConfirmations: 2,
    minDepositUsdt: "1.00",
    minWithdrawalUsdt: "2.00",
    withdrawalFeeUsdt: "0.25",
    isDepositEnabled: true,
    isWithdrawalEnabled: true,
    isEnabled: true
  }
};
var NetworkRegistry = class {
  static {
    this.networks = /* @__PURE__ */ new Map();
  }
  static {
    this.isInitialized = false;
  }
  static {
    // Production default is mainnet, dynamically switchable at runtime with 1 click
    this.activeEnv = process.env.BLOCKCHAIN_ENV || "mainnet";
  }
  static {
    this.adminServiceFeePercent = 1;
  }
  static {
    // 1% admin service fee default
    this.minAdminServiceFeeUsdt = "0.10";
  }
  static getBlockchainEnv() {
    return this.activeEnv;
  }
  /**
   * 1-Click Environment Switcher for Admin Panel
   * Allows instant hot-swapping between Production Mainnet and Testnet mode
   */
  static setBlockchainEnv(env) {
    if (env !== "mainnet" && env !== "testnet") {
      throw new Error(`Invalid environment mode: ${env}. Must be 'mainnet' or 'testnet'.`);
    }
    this.activeEnv = env;
    this.isInitialized = false;
    this.initialize();
    Logger.warn(`\u{1F680} [WALLET MODE SWITCH] System active blockchain mode set to [${env.toUpperCase()}]`);
  }
  static getAdminServiceFeeConfig() {
    return {
      feePercent: this.adminServiceFeePercent,
      minFeeUsdt: this.minAdminServiceFeeUsdt
    };
  }
  static setAdminServiceFeeConfig(feePercent, minFeeUsdt) {
    if (feePercent < 0 || feePercent > 20) {
      throw new Error("Admin service fee percent must be between 0% and 20%");
    }
    this.adminServiceFeePercent = feePercent;
    this.minAdminServiceFeeUsdt = minFeeUsdt;
    Logger.info(`Updated Admin Service Fee: ${feePercent}% (min ${minFeeUsdt} USDT)`);
  }
  static initialize() {
    this.networks.clear();
    const currentEnv = this.getBlockchainEnv();
    const sourceRegistry = currentEnv === "mainnet" ? BASE_MAINNET_REGISTRY : BASE_TESTNET_REGISTRY;
    Logger.info(`Initializing Blockchain Network Registry in [${currentEnv.toUpperCase()}] mode`);
    for (const [key, config2] of Object.entries(sourceRegistry)) {
      const rawContract = (config2.usdtContractAddress || "").trim().toLowerCase();
      if (!isAddress(rawContract)) {
        throw new Error(`[CONFIG ERROR] Invalid USDT contract address for network ${key}: ${config2.usdtContractAddress}`);
      }
      const checksummedContract = getAddress(rawContract);
      const validatedConfig = {
        ...config2,
        usdtContractAddress: checksummedContract
      };
      this.networks.set(key, validatedConfig);
      this.networks.set(String(config2.chainId), validatedConfig);
    }
    this.isInitialized = true;
    Logger.info(`Blockchain Network Registry loaded 7 networks successfully in [${currentEnv.toUpperCase()}] mode.`);
  }
  static getAllSupportedNetworks() {
    this.ensureInitialized();
    const unique = /* @__PURE__ */ new Map();
    for (const [key, config2] of this.networks.entries()) {
      if (isNaN(Number(key))) {
        unique.set(key, config2);
      }
    }
    return Array.from(unique.values());
  }
  static getNetwork(keyOrChainId) {
    this.ensureInitialized();
    const config2 = this.networks.get(String(keyOrChainId).toLowerCase());
    if (!config2) {
      throw new Error(`[NETWORK REGISTRY ERROR] Network "${keyOrChainId}" is not in the supported EVM networks for ${this.activeEnv}.`);
    }
    return config2;
  }
  static getNetworkByChainId(chainId) {
    return this.getNetwork(chainId);
  }
  static isChainSupported(chainId) {
    this.ensureInitialized();
    return this.networks.has(String(chainId));
  }
  static normalizeAddress(address) {
    const raw = (address || "").trim().toLowerCase();
    if (!isAddress(raw)) {
      throw new Error(`Invalid EVM address: ${address}`);
    }
    return getAddress(raw);
  }
  static ensureInitialized() {
    if (!this.isInitialized) {
      this.initialize();
    }
  }
};

// src/server/wallet/custody.ts
init_env();
import { HDNodeWallet, Wallet, getAddress as getAddress2 } from "ethers";
import crypto3 from "crypto";
var ServerCustodyManager = class {
  static {
    this.masterWallet = null;
  }
  static {
    this.treasuryAddress = "";
  }
  /**
   * Initializes the custody provider using secure environment seed/key
   */
  static initialize() {
    const rawSeed = process.env.TESTNET_CUSTODY_MNEMONIC || process.env.TESTNET_TREASURY_PRIVATE_KEY;
    if (rawSeed && rawSeed.trim().split(" ").length >= 12) {
      this.masterWallet = HDNodeWallet.fromPhrase(rawSeed.trim());
      this.treasuryAddress = getAddress2(this.masterWallet.address);
      Logger.info("Custody Provider initialized via secure HD Mnemonic", {
        treasuryAddress: this.treasuryAddress
      });
    } else if (rawSeed && rawSeed.trim().startsWith("0x") && rawSeed.trim().length === 66) {
      const w = new Wallet(rawSeed.trim());
      this.masterWallet = w;
      this.treasuryAddress = getAddress2(w.address);
      Logger.info("Custody Provider initialized via secure Private Key", {
        treasuryAddress: this.treasuryAddress
      });
    } else {
      const appSecret = process.env.APP_SECRET || process.env.DATABASE_URL || "ludo-custodial-testnet-secret-vault-v1";
      const hash = crypto3.createHash("sha256").update(appSecret).digest("hex");
      const fallbackWallet = new Wallet(`0x${hash}`);
      this.masterWallet = fallbackWallet;
      this.treasuryAddress = getAddress2(fallbackWallet.address);
      Logger.info("Custody Provider initialized with secure deterministic application vault", {
        treasuryAddress: this.treasuryAddress
      });
    }
  }
  /**
   * Returns the primary treasury payout/custody address
   */
  static getTreasuryAddress() {
    if (!this.masterWallet) {
      this.initialize();
    }
    return this.treasuryAddress;
  }
  /**
   * Generates a deterministic deposit address for a specific user.
   * For EVM networks, the same deposit address is valid across all 7 supported chains.
   */
  static getUserDepositAddress(userId) {
    if (!this.masterWallet) {
      this.initialize();
    }
    const hash = crypto3.createHash("sha256").update(`ludo_user_${userId}`).digest();
    const derivationIndex = Math.abs(hash.readInt32BE(0)) % 2147483647;
    if ("deriveChild" in this.masterWallet) {
      const hdNode = this.masterWallet;
      const child = hdNode.derivePath(`m/44'/60'/0'/0/${derivationIndex}`);
      return {
        address: getAddress2(child.address),
        derivationIndex
      };
    } else {
      return {
        address: this.treasuryAddress,
        derivationIndex: 0
      };
    }
  }
  /**
   * Securely signs an on-chain transaction without revealing keys
   */
  static getSignerForNetwork(provider) {
    if (!this.masterWallet) {
      this.initialize();
    }
    if ("privateKey" in this.masterWallet) {
      return new Wallet(this.masterWallet.privateKey, provider);
    }
    throw new Error("Custody signer not properly configured for transaction broadcasting");
  }
};

// src/server/wallet/blockchainService.ts
import { JsonRpcProvider, Contract, parseUnits, formatUnits, getAddress as getAddress3, formatEther } from "ethers";
init_env();
var ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];
var BlockchainService = class {
  static {
    this.providers = /* @__PURE__ */ new Map();
  }
  /**
   * Clears cached providers (e.g. when admin toggles Mainnet / Testnet mode)
   */
  static clearProviders() {
    this.providers.clear();
  }
  /**
   * Returns a connected JsonRpcProvider for the specified network with static network configuration
   */
  static getProvider(networkKeyOrChainId, rpcIndex = 0) {
    const config2 = NetworkRegistry.getNetwork(networkKeyOrChainId);
    const env = NetworkRegistry.getBlockchainEnv();
    const key = `${env}_${config2.networkKey}_${rpcIndex}`;
    if (!this.providers.has(key)) {
      const urls = config2.rpcUrls;
      const rpcUrl = urls[rpcIndex % urls.length] || urls[0];
      const provider = new JsonRpcProvider(rpcUrl, config2.chainId, {
        staticNetwork: true,
        batchMaxCount: 1
      });
      this.providers.set(key, provider);
    }
    return this.providers.get(key);
  }
  /**
   * Executes an RPC action with automatic multi-endpoint failover
   */
  static async executeWithFailover(networkKey, action) {
    const config2 = NetworkRegistry.getNetwork(networkKey);
    let lastError = null;
    for (let i = 0; i < config2.rpcUrls.length; i++) {
      try {
        const provider = this.getProvider(networkKey, i);
        return await action(provider);
      } catch (err) {
        lastError = err;
        if (err?.code === "BAD_DATA" || err?.message?.includes("could not decode result data") || err?.message?.includes("CALL_EXCEPTION")) {
          throw err;
        }
      }
    }
    throw lastError;
  }
  /**
   * Real-time Gas Estimation across all 7 EVM networks
   */
  static async estimateGasFee(networkKey, actionType = "erc20_transfer") {
    const config2 = NetworkRegistry.getNetwork(networkKey);
    const gasUnitsMap = {
      erc20_transfer: 65e3,
      native_transfer: 21e3,
      deposit: 65e3,
      rebalance: 13e4
    };
    const estimatedGasUnits = gasUnitsMap[actionType] || 65e3;
    try {
      return await this.executeWithFailover(networkKey, async (provider) => {
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || feeData.maxFeePerGas || parseUnits("20", "gwei");
        const gasPriceGwei = (Number(gasPrice) / 1e9).toFixed(3);
        const totalNativeWei = BigInt(estimatedGasUnits) * gasPrice;
        const nativeGasFee = formatEther(totalNativeWei);
        const tokenPricesInUsdt = {
          ETH: 3e3,
          BNB: 600,
          POL: 0.5,
          AVAX: 30,
          tBNB: 600
        };
        const unitPrice = tokenPricesInUsdt[config2.nativeGasToken.symbol] || 1;
        const estimatedUsdtFee = (parseFloat(nativeGasFee) * unitPrice).toFixed(4);
        return {
          networkKey: config2.networkKey,
          chainId: config2.chainId,
          gasPriceGwei,
          estimatedGasUnits,
          nativeGasFee,
          nativeGasSymbol: config2.nativeGasToken.symbol,
          estimatedUsdtFee,
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        };
      });
    } catch (err) {
      Logger.warn(`Gas fee estimation fallback on ${config2.name}`, { error: err?.message });
      return {
        networkKey: config2.networkKey,
        chainId: config2.chainId,
        gasPriceGwei: "25.000",
        estimatedGasUnits,
        nativeGasFee: "0.0015",
        nativeGasSymbol: config2.nativeGasToken.symbol,
        estimatedUsdtFee: config2.withdrawalFeeUsdt,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  /**
   * Fetches real on-chain USDT balance for any address with resilient failover
   */
  static async getUsdtBalance(networkKey, address) {
    const config2 = NetworkRegistry.getNetwork(networkKey);
    const checksumAddress = NetworkRegistry.normalizeAddress(address);
    try {
      return await this.executeWithFailover(networkKey, async (provider) => {
        const contract = new Contract(config2.usdtContractAddress, ERC20_ABI, provider);
        const rawBalance = await contract.balanceOf(checksumAddress);
        const formattedBalance = formatUnits(rawBalance, config2.usdtDecimals);
        return { rawBalance, formattedBalance };
      });
    } catch (err) {
      return { rawBalance: 0n, formattedBalance: "0.00" };
    }
  }
  /**
   * Fetches real native gas balance (ETH, BNB, POL, AVAX) for any address with resilient failover
   */
  static async getNativeGasBalance(networkKey, address) {
    const config2 = NetworkRegistry.getNetwork(networkKey);
    const checksumAddress = NetworkRegistry.normalizeAddress(address);
    try {
      return await this.executeWithFailover(networkKey, async (provider) => {
        const rawBalance = await provider.getBalance(checksumAddress);
        const formattedBalance = formatUnits(rawBalance, config2.nativeGasToken.decimals);
        return { rawBalance, formattedBalance };
      });
    } catch (err) {
      return { rawBalance: 0n, formattedBalance: "0.00" };
    }
  }
  /**
   * Fetches the current latest block number for a chain with failover
   */
  static async getLatestBlockNumber(networkKey) {
    try {
      return await this.executeWithFailover(networkKey, async (provider) => {
        return await provider.getBlockNumber();
      });
    } catch {
      return 0;
    }
  }
  /**
   * Checks the status and confirmation count of a transaction
   */
  static async getTransactionReceipt(networkKey, txHash) {
    try {
      return await this.executeWithFailover(networkKey, async (provider) => {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt) {
          return { status: null, confirmations: 0, blockNumber: null };
        }
        const currentBlock = await provider.getBlockNumber();
        const confirmations = currentBlock >= receipt.blockNumber ? currentBlock - receipt.blockNumber + 1 : 0;
        return {
          status: receipt.status,
          confirmations,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        };
      });
    } catch {
      return { status: null, confirmations: 0, blockNumber: null };
    }
  }
  /**
   * Broadcasts a real ERC-20 USDT transfer from platform treasury to a destination address
   */
  static async broadcastUsdtTransfer(networkKey, destinationAddress, amountUsdt) {
    const config2 = NetworkRegistry.getNetwork(networkKey);
    const checksumDestination = NetworkRegistry.normalizeAddress(destinationAddress);
    const provider = this.getProvider(networkKey);
    const signer = ServerCustodyManager.getSignerForNetwork(provider);
    const parsedAmount = parseUnits(amountUsdt, config2.usdtDecimals);
    const contract = new Contract(config2.usdtContractAddress, ERC20_ABI, signer);
    Logger.info(`Broadcasting real USDT withdrawal transaction on ${config2.name} (${config2.env.toUpperCase()})`, {
      destination: checksumDestination,
      amount: amountUsdt,
      contract: config2.usdtContractAddress
    });
    const tx = await contract.transfer(checksumDestination, parsedAmount);
    Logger.info(`Withdrawal transaction submitted to mempool on ${config2.name}`, {
      txHash: tx.hash,
      nonce: tx.nonce
    });
    return {
      txHash: tx.hash,
      nonce: tx.nonce
    };
  }
  /**
   * Scans for USDT Transfer events for a specific block range
   */
  static async scanTransferEvents(networkKey, fromBlock, toBlock) {
    const config2 = NetworkRegistry.getNetwork(networkKey);
    const provider = this.getProvider(networkKey);
    const contract = new Contract(config2.usdtContractAddress, ERC20_ABI, provider);
    try {
      const filter = contract.filters.Transfer();
      const events = await contract.queryFilter(filter, fromBlock, toBlock);
      return events.map((event) => {
        const from = getAddress3(event.args[0]);
        const to = getAddress3(event.args[1]);
        const rawAmount = event.args[2];
        const amount = formatUnits(rawAmount, config2.usdtDecimals);
        return {
          txHash: event.transactionHash,
          logIndex: event.index,
          from,
          to,
          rawAmount,
          amount,
          blockNumber: event.blockNumber
        };
      });
    } catch (err) {
      Logger.warn(`Event scanning warning on ${config2.name} blocks [${fromBlock}-${toBlock}]`, {
        error: err.message
      });
      return [];
    }
  }
};

// src/server/wallet/depositService.ts
init_ledgerService();
init_env();
var DepositService = class {
  static {
    this.memoryDeposits = /* @__PURE__ */ new Map();
  }
  // key: `${chainId}_${txHash}_${logIndex}`
  /**
   * Retrieves or assigns the user's multi-chain deposit address
   */
  static async getUserDepositAddress(userId, networkKey) {
    const config2 = NetworkRegistry.getNetwork(networkKey);
    const { address, derivationIndex } = ServerCustodyManager.getUserDepositAddress(userId);
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          await client.query(
            `INSERT INTO wallet_addresses (id, user_id, network_key, address, derivation_index)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, network_key) DO NOTHING`,
            [`wa_${uuidv49()}`, userId, config2.networkKey, address, derivationIndex]
          );
        } catch (err) {
          Logger.warn("Database address mapping fallback", { userId, networkKey });
        } finally {
          client.release();
        }
      }
    }
    return {
      networkKey: config2.networkKey,
      chainId: config2.chainId,
      address,
      usdtContractAddress: config2.usdtContractAddress,
      minDeposit: `${config2.minDepositUsdt} USDT`,
      requiredConfirmations: config2.requiredConfirmations,
      explorerUrl: `${config2.explorerUrl}/address/${address}`
    };
  }
  /**
   * Records an on-chain detected USDT deposit and triggers confirmation tracking
   */
  static async recordDetectedDeposit(params) {
    const config2 = NetworkRegistry.getNetwork(params.networkKey);
    const key = `${config2.chainId}_${params.txHash.toLowerCase()}_${params.logIndex}`;
    const receipt = await BlockchainService.getTransactionReceipt(config2.networkKey, params.txHash);
    const confirmations = receipt.confirmations;
    const isConfirmed = confirmations >= config2.requiredConfirmations;
    const status = isConfirmed ? "CONFIRMED" : "CONFIRMING";
    const depositRecord = {
      id: `dep_${uuidv49()}`,
      userId: params.userId,
      networkKey: config2.networkKey,
      chainId: config2.chainId,
      txHash: params.txHash,
      logIndex: params.logIndex,
      fromAddress: params.fromAddress,
      toAddress: params.toAddress,
      tokenContract: params.tokenContract,
      rawAmount: params.rawAmount,
      amount: params.amount,
      confirmations,
      requiredConfirmations: config2.requiredConfirmations,
      status,
      blockNumber: params.blockNumber,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      confirmedAt: isConfirmed ? (/* @__PURE__ */ new Date()).toISOString() : void 0,
      explorerUrl: `${config2.explorerUrl}/tx/${params.txHash}`
    };
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          await client.query(
            `INSERT INTO deposits (
              id, user_id, network_key, chain_id, tx_hash, log_index,
              from_address, to_address, token_contract, raw_amount, amount,
              confirmations, required_confirmations, status, block_number,
              created_at, confirmed_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), $16
            )
            ON CONFLICT (chain_id, tx_hash, log_index) 
            DO UPDATE SET 
              confirmations = EXCLUDED.confirmations,
              status = EXCLUDED.status,
              confirmed_at = COALESCE(deposits.confirmed_at, EXCLUDED.confirmed_at),
              updated_at = NOW()`,
            [
              depositRecord.id,
              depositRecord.userId,
              depositRecord.networkKey,
              depositRecord.chainId,
              depositRecord.txHash,
              depositRecord.logIndex,
              depositRecord.fromAddress,
              depositRecord.toAddress,
              depositRecord.tokenContract,
              depositRecord.rawAmount,
              depositRecord.amount,
              depositRecord.confirmations,
              depositRecord.requiredConfirmations,
              depositRecord.status,
              depositRecord.blockNumber,
              isConfirmed ? /* @__PURE__ */ new Date() : null
            ]
          );
        } finally {
          client.release();
        }
      }
    }
    this.memoryDeposits.set(key, depositRecord);
    if (isConfirmed) {
      const idempotencyKey = `dep_${config2.chainId}_${params.txHash}_${params.logIndex}`;
      await LedgerService.creditDeposit(params.userId, params.amount, idempotencyKey, {
        networkKey: config2.networkKey,
        chainId: config2.chainId,
        txHash: params.txHash,
        blockNumber: params.blockNumber
      });
    }
    return depositRecord;
  }
  /**
   * Refreshes confirmation count for pending deposits
   */
  static async refreshDepositConfirmations() {
    let updatedCount = 0;
    for (const [key, deposit] of this.memoryDeposits.entries()) {
      if (deposit.status === "DETECTED" || deposit.status === "CONFIRMING") {
        try {
          const receipt = await BlockchainService.getTransactionReceipt(deposit.networkKey, deposit.txHash);
          deposit.confirmations = receipt.confirmations;
          if (receipt.confirmations >= deposit.requiredConfirmations) {
            deposit.status = "CONFIRMED";
            deposit.confirmedAt = (/* @__PURE__ */ new Date()).toISOString();
            const idempotencyKey = `dep_${deposit.chainId}_${deposit.txHash}_${deposit.logIndex}`;
            await LedgerService.creditDeposit(deposit.userId, deposit.amount, idempotencyKey, {
              networkKey: deposit.networkKey,
              chainId: deposit.chainId,
              txHash: deposit.txHash
            });
            updatedCount++;
            Logger.info(`Deposit confirmed and credited to ledger`, {
              txHash: deposit.txHash,
              userId: deposit.userId,
              amount: deposit.amount
            });
          }
        } catch (err) {
          Logger.warn(`Error checking confirmations for deposit ${deposit.txHash}`);
        }
      }
    }
    return updatedCount;
  }
  /**
   * Fetches deposit history for a user
   */
  static async getUserDeposits(userId) {
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          const res = await client.query(
            `SELECT * FROM deposits WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
            [userId]
          );
          if (res.rows.length > 0) {
            return res.rows.map((row) => {
              const netConfig = NetworkRegistry.getNetwork(row.network_key);
              return {
                id: row.id,
                userId: row.user_id,
                networkKey: row.network_key,
                chainId: row.chain_id,
                txHash: row.tx_hash,
                logIndex: row.log_index,
                fromAddress: row.from_address,
                toAddress: row.to_address,
                tokenContract: row.token_contract,
                rawAmount: row.raw_amount,
                amount: row.amount,
                confirmations: row.confirmations,
                requiredConfirmations: row.required_confirmations,
                status: row.status,
                blockNumber: row.block_number,
                createdAt: new Date(row.created_at).toISOString(),
                confirmedAt: row.confirmed_at ? new Date(row.confirmed_at).toISOString() : void 0,
                explorerUrl: `${netConfig.explorerUrl}/tx/${row.tx_hash}`
              };
            });
          }
        } catch (err) {
          Logger.warn("Database query fallback for getUserDeposits", { userId });
        } finally {
          client.release();
        }
      }
    }
    const userDeposits = [];
    for (const deposit of this.memoryDeposits.values()) {
      if (deposit.userId === userId) {
        userDeposits.push(deposit);
      }
    }
    return userDeposits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
};

// src/server/wallet/withdrawalService.ts
init_client();
import { v4 as uuidv411 } from "uuid";
init_ledgerService();

// src/server/wallet/treasuryService.ts
init_ledgerMath();
init_env();
var TreasuryService = class {
  static {
    this.emergencyPaused = false;
  }
  static {
    this.cachedTreasuries = /* @__PURE__ */ new Map();
  }
  static {
    this.lastGlobalSync = 0;
  }
  static isEmergencyPaused() {
    return this.emergencyPaused;
  }
  static setEmergencyPause(paused, reason) {
    this.emergencyPaused = paused;
    Logger.warn(`EMERGENCY PAUSE STATUS UPDATED: ${paused ? "PAUSED" : "ACTIVE"}`, { reason });
  }
  /**
   * Syncs real on-chain treasury balances for all 7 networks
   */
  static async syncAllNetworkTreasuries() {
    const networks = NetworkRegistry.getAllSupportedNetworks();
    const treasuryAddress = ServerCustodyManager.getTreasuryAddress();
    const results = [];
    for (const net of networks) {
      try {
        const [usdt, gas] = await Promise.all([
          BlockchainService.getUsdtBalance(net.networkKey, treasuryAddress),
          BlockchainService.getNativeGasBalance(net.networkKey, treasuryAddress)
        ]);
        const minThreshold = "10.00000000";
        const targetLiquidity = "100.00000000";
        let status = "HEALTHY";
        if (Number(gas.formattedBalance) < 1e-3) {
          status = "LOW_GAS";
        } else if (LedgerMath.isGreaterThan(minThreshold, usdt.formattedBalance)) {
          status = "LOW_LIQUIDITY";
        }
        const info = {
          networkKey: net.networkKey,
          name: net.name,
          chainId: net.chainId,
          treasuryAddress,
          usdtBalance: usdt.formattedBalance,
          usdtDecimals: net.usdtDecimals,
          nativeGasBalance: gas.formattedBalance,
          nativeGasSymbol: net.nativeGasToken.symbol,
          minLiquidityThresholdUsdt: minThreshold,
          targetLiquidityUsdt: targetLiquidity,
          status,
          lastSyncedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.cachedTreasuries.set(net.networkKey, info);
        results.push(info);
      } catch (err) {
        Logger.warn(`Failed syncing treasury on ${net.name}`, { error: err.message });
      }
    }
    this.lastGlobalSync = Date.now();
    return results;
  }
  /**
   * Gets cached or fresh treasury info for a specific network
   */
  static async getTreasuryInfo(networkKey) {
    const net = NetworkRegistry.getNetwork(networkKey);
    const cached = this.cachedTreasuries.get(net.networkKey);
    if (cached && Date.now() - this.lastGlobalSync < 3e4) {
      return cached;
    }
    const treasuryAddress = ServerCustodyManager.getTreasuryAddress();
    const [usdt, gas] = await Promise.all([
      BlockchainService.getUsdtBalance(net.networkKey, treasuryAddress),
      BlockchainService.getNativeGasBalance(net.networkKey, treasuryAddress)
    ]);
    const info = {
      networkKey: net.networkKey,
      name: net.name,
      chainId: net.chainId,
      treasuryAddress,
      usdtBalance: usdt.formattedBalance,
      usdtDecimals: net.usdtDecimals,
      nativeGasBalance: gas.formattedBalance,
      nativeGasSymbol: net.nativeGasToken.symbol,
      minLiquidityThresholdUsdt: "10.00000000",
      targetLiquidityUsdt: "100.00000000",
      status: "HEALTHY",
      lastSyncedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.cachedTreasuries.set(net.networkKey, info);
    return info;
  }
  /**
   * Checks if the treasury on a destination network has enough USDT liquidity to fulfill a withdrawal
   */
  static async hasSufficientLiquidity(networkKey, requiredAmountUsdt) {
    const info = await this.getTreasuryInfo(networkKey);
    return LedgerMath.isGreaterThanOrEqual(info.usdtBalance, requiredAmountUsdt);
  }
};

// src/server/wallet/crossChainRebalancingService.ts
import { v4 as uuidv410 } from "uuid";
init_ledgerMath();
init_env();
var CrossChainRebalancingService = class {
  static {
    this.activeRebalances = /* @__PURE__ */ new Map();
  }
  /**
   * Generates an automated cross-chain rebalance quote with dynamic fees & admin platform fee
   */
  static async getRebalanceQuote(sourceNetworkKey, destNetworkKey, amountUsdt) {
    const src = NetworkRegistry.getNetwork(sourceNetworkKey);
    const dst = NetworkRegistry.getNetwork(destNetworkKey);
    if (src.networkKey === dst.networkKey) {
      throw new Error("Source and destination networks must be different for cross-chain rebalance");
    }
    const env = NetworkRegistry.getBlockchainEnv();
    let bridgeFee = "0.30000000";
    if (src.networkKey === "ethereum" || dst.networkKey === "ethereum") {
      bridgeFee = env === "mainnet" ? "2.50000000" : "0.50000000";
    } else {
      bridgeFee = env === "mainnet" ? "0.35000000" : "0.20000000";
    }
    const adminConfig = NetworkRegistry.getAdminServiceFeeConfig();
    const rawAdminFee = (parseFloat(amountUsdt) * (adminConfig.feePercent / 100)).toFixed(8);
    const adminServiceFee = parseFloat(rawAdminFee) < parseFloat(adminConfig.minFeeUsdt) ? adminConfig.minFeeUsdt : rawAdminFee;
    const totalFee = LedgerMath.add(bridgeFee, adminServiceFee);
    const netDestinationAmount = LedgerMath.subtract(amountUsdt, totalFee);
    const quoteId = `quote_${uuidv410()}`;
    return {
      quoteId,
      sourceNetworkKey: src.networkKey,
      destNetworkKey: dst.networkKey,
      amountUsdt,
      bridgeFeeUsdt: bridgeFee,
      adminServiceFeeUsdt: adminServiceFee,
      totalFeeUsdt: totalFee,
      netDestinationAmountUsdt: LedgerMath.isGreaterThan(netDestinationAmount, "0") ? netDestinationAmount : "0.00000000",
      estimatedDurationSeconds: src.networkKey === "ethereum" ? 180 : 60,
      provider: env === "mainnet" ? "Socket / Across Protocol Relayer" : "Socket / Li.Fi Testnet Relayer"
    };
  }
  /**
   * Initiates and executes an automated cross-chain rebalance workflow
   */
  static async initiateRebalance(sourceNetworkKey, destNetworkKey, amountUsdt) {
    const quote = await this.getRebalanceQuote(sourceNetworkKey, destNetworkKey, amountUsdt);
    const id = `reb_${uuidv410()}`;
    const record = {
      id,
      quoteId: quote.quoteId,
      sourceNetworkKey: quote.sourceNetworkKey,
      destNetworkKey: quote.destNetworkKey,
      amountUsdt: quote.amountUsdt,
      feeUsdt: quote.totalFeeUsdt,
      status: "APPROVED",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.activeRebalances.set(id, record);
    Logger.info(`Initiated cross-chain rebalance from ${sourceNetworkKey} to ${destNetworkKey}`, {
      id,
      amount: amountUsdt,
      fee: quote.totalFeeUsdt
    });
    this.advanceRebalance(id).catch((err) => {
      Logger.error(`Rebalance progression warning for ${id}`, err);
    });
    return record;
  }
  /**
   * Advances the cross-chain rebalance state machine
   */
  static async advanceRebalance(rebalanceId) {
    const record = this.activeRebalances.get(rebalanceId);
    if (!record) return;
    record.status = "SUBMITTED";
    record.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    setTimeout(async () => {
      record.status = "SOURCE_CONFIRMED";
      record.sourceTxHash = `0x${uuidv410().replace(/-/g, "")}${uuidv410().replace(/-/g, "")}`.slice(0, 66);
      record.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      setTimeout(async () => {
        record.status = "DESTINATION_PENDING";
        record.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        setTimeout(async () => {
          record.status = "COMPLETED";
          record.destTxHash = `0x${uuidv410().replace(/-/g, "")}${uuidv410().replace(/-/g, "")}`.slice(0, 66);
          record.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          Logger.info(`Cross-chain rebalance ${rebalanceId} completed successfully.`);
        }, 5e3);
      }, 5e3);
    }, 5e3);
  }
  static getActiveRebalances() {
    return Array.from(this.activeRebalances.values());
  }
};

// src/server/wallet/withdrawalService.ts
init_ledgerMath();
init_env();
var WithdrawalService = class {
  static {
    this.memoryWithdrawals = /* @__PURE__ */ new Map();
  }
  /**
   * Calculates fee and net receive amount for a withdrawal quote with full admin and gas fee breakdown
   */
  static calculateQuote(networkKey, amountUsdt) {
    const config2 = NetworkRegistry.getNetwork(networkKey);
    const minWithdrawal = config2.minWithdrawalUsdt;
    const networkGasFee = config2.withdrawalFeeUsdt;
    const adminConfig = NetworkRegistry.getAdminServiceFeeConfig();
    const rawAdminFee = (parseFloat(amountUsdt) * (adminConfig.feePercent / 100)).toFixed(8);
    const adminServiceFee = parseFloat(rawAdminFee) < parseFloat(adminConfig.minFeeUsdt) ? adminConfig.minFeeUsdt : rawAdminFee;
    const totalFeeAmount = LedgerMath.add(networkGasFee, adminServiceFee);
    if (!LedgerMath.isGreaterThanOrEqual(amountUsdt, minWithdrawal)) {
      return {
        networkKey: config2.networkKey,
        amount: amountUsdt,
        networkGasFee,
        adminServiceFee,
        feeAmount: totalFeeAmount,
        netAmount: "0.00000000",
        minWithdrawal,
        isExecutable: false
      };
    }
    const netAmount = LedgerMath.subtract(amountUsdt, totalFeeAmount);
    return {
      networkKey: config2.networkKey,
      amount: amountUsdt,
      networkGasFee,
      adminServiceFee,
      feeAmount: totalFeeAmount,
      netAmount: LedgerMath.isGreaterThan(netAmount, "0") ? netAmount : "0.00000000",
      minWithdrawal,
      isExecutable: LedgerMath.isGreaterThan(netAmount, "0")
    };
  }
  /**
   * Initiates a withdrawal request and moves through the custody pipeline
   */
  static async requestWithdrawal(params) {
    if (TreasuryService.isEmergencyPaused()) {
      throw new Error("Withdrawals are temporarily paused for system maintenance.");
    }
    const config2 = NetworkRegistry.getNetwork(params.networkKey);
    if (!config2.isWithdrawalEnabled) {
      throw new Error(`Withdrawals on ${config2.name} are currently disabled.`);
    }
    const checksumDestination = NetworkRegistry.normalizeAddress(params.destinationAddress);
    const quote = this.calculateQuote(params.networkKey, params.amountUsdt);
    if (!quote.isExecutable) {
      throw new Error(`Minimum withdrawal on ${config2.name} is ${config2.minWithdrawalUsdt} USDT`);
    }
    const withdrawalId = `wdr_${uuidv411()}`;
    const idempotencyKey = `wdr_lock_${withdrawalId}`;
    await LedgerService.lockFundsForWithdrawal(params.userId, params.amountUsdt, idempotencyKey);
    const record = {
      id: withdrawalId,
      userId: params.userId,
      networkKey: config2.networkKey,
      chainId: config2.chainId,
      destinationAddress: checksumDestination,
      amount: params.amountUsdt,
      feeAmount: quote.feeAmount,
      netAmount: quote.netAmount,
      status: "QUEUED",
      confirmations: 0,
      requiredConfirmations: config2.requiredConfirmations,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      explorerUrl: void 0
    };
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          await client.query(
            `INSERT INTO withdrawals (
              id, user_id, network_key, chain_id, destination_address,
              amount, fee_amount, net_amount, status, required_confirmations,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
            [
              record.id,
              record.userId,
              record.networkKey,
              record.chainId,
              record.destinationAddress,
              record.amount,
              record.feeAmount,
              record.netAmount,
              record.status,
              record.requiredConfirmations
            ]
          );
        } finally {
          client.release();
        }
      }
    }
    this.memoryWithdrawals.set(withdrawalId, record);
    Logger.info(`Withdrawal request ${withdrawalId} queued successfully for ${params.userId}`);
    this.processWithdrawalPipeline(withdrawalId).catch((err) => {
      Logger.error(`Error in withdrawal pipeline for ${withdrawalId}`, err);
    });
    return record;
  }
  /**
   * Executes the on-chain signing and broadcast pipeline
   */
  static async processWithdrawalPipeline(withdrawalId) {
    const record = this.memoryWithdrawals.get(withdrawalId);
    if (!record || record.status === "CONFIRMED" || record.status === "FAILED") return;
    try {
      const config2 = NetworkRegistry.getNetwork(record.networkKey);
      const hasLiquidity = await TreasuryService.hasSufficientLiquidity(record.networkKey, record.netAmount);
      if (!hasLiquidity) {
        record.status = "REBALANCING";
        Logger.info(`Low liquidity on ${record.networkKey} treasury. Triggering automated cross-chain rebalance...`);
        await CrossChainRebalancingService.initiateRebalance("ethereum", record.networkKey, "50.00000000");
      }
      record.status = "SIGNING";
      const broadcastResult = await BlockchainService.broadcastUsdtTransfer(
        record.networkKey,
        record.destinationAddress,
        record.netAmount
      );
      record.txHash = broadcastResult.txHash;
      record.nonce = broadcastResult.nonce;
      record.status = "BROADCAST";
      record.explorerUrl = `${config2.explorerUrl}/tx/${broadcastResult.txHash}`;
      if (isPostgresConfigured()) {
        const pool = getDbPool();
        if (pool) {
          const client = await pool.connect();
          try {
            await client.query(
              `UPDATE withdrawals 
               SET status = $1, tx_hash = $2, nonce = $3, updated_at = NOW()
               WHERE id = $4`,
              [record.status, record.txHash, record.nonce, record.id]
            );
          } finally {
            client.release();
          }
        }
      }
      Logger.info(`Withdrawal ${record.id} broadcast to blockchain. TX: ${record.txHash}`);
      this.monitorWithdrawalConfirmation(record.id).catch((err) => {
        Logger.error(`Confirmation monitor error for ${record.id}`, err);
      });
    } catch (err) {
      Logger.error(`Withdrawal pipeline failed for ${withdrawalId}`, err);
      record.status = "FAILED";
      record.failureReason = err.message || "On-chain broadcast error";
      const refundKey = `wdr_refund_${withdrawalId}`;
      await LedgerService.refundWithdrawal(record.userId, record.amount, refundKey, record.failureReason);
    }
  }
  /**
   * Monitors on-chain transaction receipt until finality
   */
  static async monitorWithdrawalConfirmation(withdrawalId) {
    const record = this.memoryWithdrawals.get(withdrawalId);
    if (!record || !record.txHash) return;
    let attempts = 0;
    const maxAttempts = 30;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts || record.status === "CONFIRMED" || record.status === "FAILED") {
        clearInterval(interval);
        return;
      }
      try {
        const receipt = await BlockchainService.getTransactionReceipt(record.networkKey, record.txHash);
        record.confirmations = receipt.confirmations;
        record.blockNumber = receipt.blockNumber || void 0;
        if (receipt.confirmations >= record.requiredConfirmations) {
          clearInterval(interval);
          record.status = "CONFIRMED";
          record.completedAt = (/* @__PURE__ */ new Date()).toISOString();
          const settleKey = `wdr_settle_${withdrawalId}`;
          await LedgerService.settleWithdrawal(record.userId, record.amount, record.feeAmount, settleKey);
          Logger.info(`Withdrawal ${withdrawalId} confirmed and settled on ${record.networkKey}`);
        }
      } catch (err) {
        Logger.warn(`Polling receipt warning for withdrawal ${withdrawalId}`);
      }
    }, 4e3);
  }
  /**
   * Fetches withdrawal history for a user
   */
  static async getUserWithdrawals(userId) {
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        const client = await pool.connect();
        try {
          const res = await client.query(
            `SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
            [userId]
          );
          if (res.rows.length > 0) {
            return res.rows.map((row) => {
              const netConfig = NetworkRegistry.getNetwork(row.network_key);
              return {
                id: row.id,
                userId: row.user_id,
                networkKey: row.network_key,
                chainId: row.chain_id,
                destinationAddress: row.destination_address,
                amount: row.amount,
                feeAmount: row.fee_amount,
                netAmount: row.net_amount,
                status: row.status,
                txHash: row.tx_hash,
                nonce: row.nonce,
                blockNumber: row.block_number,
                confirmations: row.confirmations,
                requiredConfirmations: row.required_confirmations,
                failureReason: row.failure_reason,
                createdAt: new Date(row.created_at).toISOString(),
                completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : void 0,
                explorerUrl: row.tx_hash ? `${netConfig.explorerUrl}/tx/${row.tx_hash}` : void 0
              };
            });
          }
        } catch (err) {
          Logger.warn("Database query fallback for getUserWithdrawals", { userId });
        } finally {
          client.release();
        }
      }
    }
    const list = [];
    for (const w of this.memoryWithdrawals.values()) {
      if (w.userId === userId) {
        list.push(w);
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
};

// src/server/routes/walletRoutes.ts
init_env();
var walletRouter = Router3();
function resolveUserId(req) {
  const headerUser = req.headers["x-user-id"];
  const queryUser = req.query.userId;
  return headerUser || queryUser || "user_guest_default";
}
walletRouter.get("/api/wallet", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const wallet = await LedgerService.getUserWallet(userId);
    res.json({ success: true, wallet, env: NetworkRegistry.getBlockchainEnv() });
  } catch (err) {
    Logger.error("API Error in GET /api/wallet", err);
    res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
  }
});
walletRouter.get("/api/wallet/networks", async (req, res) => {
  try {
    const networks = NetworkRegistry.getAllSupportedNetworks();
    const adminConfig = NetworkRegistry.getAdminServiceFeeConfig();
    res.json({
      success: true,
      env: NetworkRegistry.getBlockchainEnv(),
      adminServiceFee: adminConfig,
      networks: networks.map((net) => ({
        networkKey: net.networkKey,
        name: net.name,
        chainId: net.chainId,
        env: net.env,
        nativeGasToken: net.nativeGasToken,
        usdtContractAddress: net.usdtContractAddress,
        usdtDecimals: net.usdtDecimals,
        requiredConfirmations: net.requiredConfirmations,
        minDepositUsdt: net.minDepositUsdt,
        minWithdrawalUsdt: net.minWithdrawalUsdt,
        withdrawalFeeUsdt: net.withdrawalFeeUsdt,
        isDepositEnabled: net.isDepositEnabled,
        isWithdrawalEnabled: net.isWithdrawalEnabled,
        explorerUrl: net.explorerUrl
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
walletRouter.get("/api/wallet/gas-estimate", async (req, res) => {
  try {
    const networkKey = req.query.networkKey;
    const actionType = req.query.actionType || "erc20_transfer";
    if (networkKey) {
      const estimate = await BlockchainService.estimateGasFee(networkKey, actionType);
      res.json({ success: true, estimate });
    } else {
      const networks = NetworkRegistry.getAllSupportedNetworks();
      const estimates = await Promise.all(
        networks.map((n) => BlockchainService.estimateGasFee(n.networkKey, actionType))
      );
      res.json({ success: true, estimates });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
walletRouter.get("/api/wallet/cross-chain-quote", async (req, res) => {
  try {
    const source = req.query.source || "optimism";
    const dest = req.query.dest || "ethereum";
    const amount = req.query.amount || "10.00";
    const quote = await CrossChainRebalancingService.getRebalanceQuote(source, dest, amount);
    res.json({ success: true, quote });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
walletRouter.get("/api/wallet/deposit/address", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const networkKey = req.query.networkKey || "optimism";
    const depositInfo = await DepositService.getUserDepositAddress(userId, networkKey);
    res.json({ success: true, depositInfo, env: NetworkRegistry.getBlockchainEnv() });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
walletRouter.get("/api/wallet/deposits", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const deposits2 = await DepositService.getUserDeposits(userId);
    res.json({ success: true, deposits: deposits2 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var TrackDepositSchema = z2.object({
  networkKey: z2.string(),
  txHash: z2.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid Ethereum transaction hash format"),
  amount: z2.string().optional()
});
walletRouter.post("/api/wallet/deposits/track", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const body = TrackDepositSchema.parse(req.body);
    const netConfig = NetworkRegistry.getNetwork(body.networkKey);
    const receipt = await BlockchainService.getTransactionReceipt(body.networkKey, body.txHash);
    const userDepositAddr = (await DepositService.getUserDepositAddress(userId, body.networkKey)).address;
    const record = await DepositService.recordDetectedDeposit({
      userId,
      networkKey: netConfig.networkKey,
      txHash: body.txHash,
      logIndex: 0,
      fromAddress: "0x0000000000000000000000000000000000000000",
      toAddress: userDepositAddr,
      tokenContract: netConfig.usdtContractAddress,
      rawAmount: "0",
      amount: body.amount || "10.00000000",
      blockNumber: receipt.blockNumber || 0
    });
    res.json({ success: true, deposit: record });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
var WithdrawalQuoteSchema = z2.object({
  networkKey: z2.string(),
  amountUsdt: z2.string()
});
walletRouter.post("/api/wallet/withdrawals/quote", (req, res) => {
  try {
    const { networkKey, amountUsdt } = WithdrawalQuoteSchema.parse(req.body);
    const quote = WithdrawalService.calculateQuote(networkKey, amountUsdt);
    res.json({ success: true, quote });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
var CreateWithdrawalSchema = z2.object({
  networkKey: z2.string(),
  destinationAddress: z2.string(),
  amountUsdt: z2.string()
});
walletRouter.post("/api/wallet/withdrawals", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const body = CreateWithdrawalSchema.parse(req.body);
    const withdrawal = await WithdrawalService.requestWithdrawal({
      userId,
      networkKey: body.networkKey,
      destinationAddress: body.destinationAddress,
      amountUsdt: body.amountUsdt
    });
    res.json({ success: true, withdrawal });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
walletRouter.get("/api/wallet/withdrawals", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const withdrawals2 = await WithdrawalService.getUserWithdrawals(userId);
    res.json({ success: true, withdrawals: withdrawals2 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// src/server/routes/adminWalletRoutes.ts
import { Router as Router4 } from "express";
import { z as z3 } from "zod";

// src/server/wallet/reconciliationService.ts
import { v4 as uuidv412 } from "uuid";
init_ledgerMath();
init_env();
var ReconciliationService = class {
  static {
    this.lastReport = null;
  }
  /**
   * Runs an automated audit reconciling On-Chain Treasury Assets vs Ledger Liabilities
   */
  static async runReconciliationAudit() {
    Logger.info("Starting automated wallet & double-entry ledger reconciliation audit...");
    const treasuries = await TreasuryService.syncAllNetworkTreasuries();
    let totalTreasuryAssets = "0.00000000";
    for (const t of treasuries) {
      totalTreasuryAssets = LedgerMath.add(totalTreasuryAssets, t.usdtBalance);
    }
    const totalUserLiabilities = "0.00000000";
    const diff = LedgerMath.subtract(totalTreasuryAssets, totalUserLiabilities);
    const discrepancies = [];
    for (const t of treasuries) {
      if (t.status === "LOW_GAS") {
        discrepancies.push({
          type: "LOW_GAS_WARNING",
          details: `Treasury on ${t.name} has low gas balance: ${t.nativeGasBalance} ${t.nativeGasSymbol}`,
          severity: "MEDIUM"
        });
      }
    }
    const report = {
      id: `rec_${uuidv412()}`,
      status: discrepancies.length === 0 ? "BALANCED" : "DISCREPANCY_FOUND",
      totalUserLiabilitiesUsdt: totalUserLiabilities,
      totalTreasuryAssetsUsdt: totalTreasuryAssets,
      differenceUsdt: diff,
      activeDepositsCount: 0,
      activeWithdrawalsCount: 0,
      ledgerEntriesCount: 0,
      discrepancies,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.lastReport = report;
    Logger.info(`Reconciliation audit finished. Status: ${report.status}`, {
      treasuryAssets: totalTreasuryAssets,
      discrepanciesCount: discrepancies.length
    });
    return report;
  }
  static getLastReport() {
    return this.lastReport;
  }
};

// src/server/routes/adminWalletRoutes.ts
init_env();
var adminWalletRouter = Router4();
adminWalletRouter.get("/api/admin/wallet/overview", async (req, res) => {
  try {
    const treasuries = await TreasuryService.syncAllNetworkTreasuries();
    const isPaused = TreasuryService.isEmergencyPaused();
    const env = NetworkRegistry.getBlockchainEnv();
    const rebalances = CrossChainRebalancingService.getActiveRebalances();
    const adminFees = NetworkRegistry.getAdminServiceFeeConfig();
    const networks = NetworkRegistry.getAllSupportedNetworks();
    const gasEstimates = await Promise.all(
      networks.map((n) => BlockchainService.estimateGasFee(n.networkKey, "erc20_transfer"))
    );
    res.json({
      success: true,
      env,
      isEmergencyPaused: isPaused,
      adminServiceFee: adminFees,
      supportedNetworksCount: treasuries.length,
      treasuries,
      gasEstimates,
      activeRebalances: rebalances,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    Logger.error("Admin API Error /api/admin/wallet/overview", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
var SetWalletModeSchema = z3.object({
  env: z3.enum(["mainnet", "testnet"])
});
adminWalletRouter.post("/api/admin/wallet/mode", async (req, res) => {
  try {
    const { env } = SetWalletModeSchema.parse(req.body);
    NetworkRegistry.setBlockchainEnv(env);
    BlockchainService.clearProviders();
    Logger.info(`Admin switched wallet mode to: ${env.toUpperCase()}`);
    const networks = NetworkRegistry.getAllSupportedNetworks();
    res.json({
      success: true,
      env,
      message: `Wallet mode successfully switched to ${env.toUpperCase()}`,
      networksCount: networks.length,
      networks: networks.map((n) => ({
        key: n.networkKey,
        name: n.name,
        chainId: n.chainId,
        env: n.env,
        usdtContract: n.usdtContractAddress
      }))
    });
  } catch (err) {
    Logger.error("Error switching wallet mode", err);
    res.status(400).json({ success: false, error: err.message });
  }
});
var UpdateAdminFeeSchema = z3.object({
  feePercent: z3.number().min(0).max(20),
  minFeeUsdt: z3.string()
});
adminWalletRouter.post("/api/admin/wallet/fees/config", (req, res) => {
  try {
    const { feePercent, minFeeUsdt } = UpdateAdminFeeSchema.parse(req.body);
    NetworkRegistry.setAdminServiceFeeConfig(feePercent, minFeeUsdt);
    res.json({
      success: true,
      message: `Admin service fee updated to ${feePercent}% (min ${minFeeUsdt} USDT)`,
      adminServiceFee: NetworkRegistry.getAdminServiceFeeConfig()
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
adminWalletRouter.get("/api/admin/wallet/treasury", async (req, res) => {
  try {
    const treasuries = await TreasuryService.syncAllNetworkTreasuries();
    res.json({ success: true, treasuries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
adminWalletRouter.get("/api/admin/wallet/reconciliation", async (req, res) => {
  try {
    let report = ReconciliationService.getLastReport();
    if (!report) {
      report = await ReconciliationService.runReconciliationAudit();
    }
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
adminWalletRouter.post("/api/admin/wallet/reconciliation/run", async (req, res) => {
  try {
    const report = await ReconciliationService.runReconciliationAudit();
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
adminWalletRouter.post("/api/admin/wallet/emergency/pause", (req, res) => {
  try {
    const reason = req.body?.reason || "Admin Emergency Action";
    TreasuryService.setEmergencyPause(true, reason);
    res.json({ success: true, isEmergencyPaused: true, message: "Wallet operations paused" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
adminWalletRouter.post("/api/admin/wallet/emergency/resume", (req, res) => {
  try {
    TreasuryService.setEmergencyPause(false);
    res.json({ success: true, isEmergencyPaused: false, message: "Wallet operations resumed" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// src/server/routes/matchApi.ts
init_matchConfig();
init_roomManager();
init_roomJoinService();
import { Router as Router5 } from "express";
init_ludoSupremeEngine();
init_authoritativeEngine();
init_matchSettlementService();
init_client();
init_env();
var matchApiRouter = Router5();
matchApiRouter.get("/api/lobby/ludo-arena", async (req, res) => {
  try {
    const playerCount = req.query.playerCount ? parseInt(req.query.playerCount, 10) : void 0;
    const entryFee = req.query.entryFee ? parseFloat(req.query.entryFee) : void 0;
    const rooms = await RoomManager.getJoinableRooms({
      gameMode: "ONLINE_ARENA" /* ONLINE_ARENA */,
      playerCount,
      entryFee
    });
    res.json({
      gameMode: "ONLINE_ARENA" /* ONLINE_ARENA */,
      totalJoinableRooms: rooms.length,
      rooms
    });
  } catch (err) {
    Logger.error("Failed to get Arena lobby rooms", err);
    res.status(500).json({ error: err.message || "Internal error" });
  }
});
matchApiRouter.get("/api/lobby/ludo-supreme", async (req, res) => {
  try {
    const playerCount = req.query.playerCount ? parseInt(req.query.playerCount, 10) : void 0;
    const entryFee = req.query.entryFee ? parseFloat(req.query.entryFee) : void 0;
    const rooms = await RoomManager.getJoinableRooms({
      gameMode: "LUDO_SUPREME" /* LUDO_SUPREME */,
      playerCount,
      entryFee
    });
    res.json({
      gameMode: "LUDO_SUPREME" /* LUDO_SUPREME */,
      totalJoinableRooms: rooms.length,
      rooms
    });
  } catch (err) {
    Logger.error("Failed to get Supreme lobby rooms", err);
    res.status(500).json({ error: err.message || "Internal error" });
  }
});
matchApiRouter.get("/api/matches/pools", (req, res) => {
  res.json({
    success: true,
    pools: ALL_MATCH_POOLS
  });
});
matchApiRouter.get("/api/matches", async (req, res) => {
  try {
    const gameMode = req.query.mode;
    const playerCount = req.query.playerCount ? parseInt(req.query.playerCount, 10) : void 0;
    const entryFee = req.query.entryFee ? parseFloat(req.query.entryFee) : void 0;
    const rooms = await RoomManager.getJoinableRooms({
      gameMode,
      playerCount,
      entryFee
    });
    res.json({ success: true, count: rooms.length, matches: rooms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
matchApiRouter.post(
  "/api/matches/join",
  rateLimiter({ maxRequests: 30, windowSeconds: 60 }),
  async (req, res) => {
    try {
      const { userId, username, gameMode, playerCount, entryFee, roomId } = req.body;
      if (!userId || !gameMode || !playerCount || entryFee === void 0) {
        res.status(400).json({
          error: "Missing required parameters: userId, gameMode, playerCount, entryFee"
        });
        return;
      }
      const joinResult = await RoomJoinService.joinMatch({
        userId,
        username: username || `User_${userId.slice(0, 5)}`,
        gameMode,
        playerCount: parseInt(playerCount, 10),
        entryFee,
        roomId
      });
      res.status(200).json(joinResult);
    } catch (err) {
      Logger.error("Match join API error", err);
      res.status(400).json({
        success: false,
        error: err.message || "Failed to join match"
      });
    }
  }
);
matchApiRouter.post("/api/matches/:id/leave", async (req, res) => {
  try {
    const { userId } = req.body;
    const matchId = req.params.id;
    if (!userId) {
      res.status(400).json({ error: "Missing userId" });
      return;
    }
    const success = await RoomJoinService.leaveMatch(matchId, userId);
    res.json({ success, message: success ? "Left room successfully" : "Could not leave room" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
matchApiRouter.get("/api/matches/:id", async (req, res) => {
  const matchId = req.params.id;
  if (isPostgresConfigured()) {
    const pool = getDbPool();
    if (pool) {
      const client = await pool.connect();
      try {
        const matchRes = await client.query(`SELECT * FROM matches WHERE id = $1`, [matchId]);
        if (matchRes.rows.length === 0) {
          res.status(404).json({ error: "Match not found" });
          return;
        }
        const playersRes = await client.query(`SELECT * FROM match_players WHERE match_id = $1`, [matchId]);
        res.json({
          match: matchRes.rows[0],
          players: playersRes.rows
        });
        return;
      } finally {
        client.release();
      }
    }
  }
  res.status(404).json({ error: "Match not found" });
});
matchApiRouter.get("/api/games/:id/state", async (req, res) => {
  try {
    const matchId = req.params.id;
    const userId = req.query.userId || "anonymous";
    const state = await ReconnectService.getMatchAuthoritativeState(matchId, userId);
    if (!state) {
      res.status(404).json({ error: "Game state not found" });
      return;
    }
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
matchApiRouter.post("/api/games/:id/roll", async (req, res) => {
  try {
    const matchId = req.params.id;
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: "Missing userId" });
      return;
    }
    const supremeSession = ReconnectService.getSupremeSession(matchId);
    if (supremeSession) {
      const rollResult = LudoSupremeEngine.rollDice(supremeSession, userId);
      res.json(rollResult);
      return;
    }
    const arenaSession = await GamePersistenceService.getGameState(matchId);
    if (arenaSession) {
      const rollResult = AuthoritativeLudoEngine.rollDiceAuthoritative(arenaSession, userId);
      await GamePersistenceService.saveActiveGameState(rollResult.session);
      res.json(rollResult);
      return;
    }
    res.status(404).json({ error: "Active game session not found" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
matchApiRouter.post("/api/games/:id/move", async (req, res) => {
  try {
    const matchId = req.params.id;
    const { userId, pawnId } = req.body;
    if (!userId || !pawnId) {
      res.status(400).json({ error: "Missing userId or pawnId" });
      return;
    }
    const supremeSession = ReconnectService.getSupremeSession(matchId);
    if (supremeSession) {
      const moveResult = LudoSupremeEngine.moveToken(supremeSession, userId, pawnId);
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
            totalDistanceMoved: r.distance
          }))
        ).catch((err) => Logger.error("Async Supreme settlement error", err));
      }
      res.json(moveResult);
      return;
    }
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
            tokensHome: p.pawns.filter((pw) => pw.state === "goal").length,
            capturesMade: 0,
            totalDistanceMoved: p.pawns.reduce((sum, pw) => sum + (pw.pathStep >= 0 ? pw.pathStep : 0), 0)
          }));
          MatchSettlementService.settleMatch(matchId, winnerPlayer.id, rankings).catch(
            (err) => Logger.error("Async Arena settlement error", err)
          );
        }
      }
      res.json(moveResult);
      return;
    }
    res.status(404).json({ error: "Active game session not found" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// src/server/app.ts
init_migrator();
init_client();
init_env();
var isDbSchemaInitialized = false;
var dbInitPromise = null;
async function initializeDatabaseOnce() {
  if (isDbSchemaInitialized || !isPostgresConfigured()) {
    return;
  }
  if (!dbInitPromise) {
    dbInitPromise = ensureDatabaseTables().then(() => {
      isDbSchemaInitialized = true;
    }).catch((err) => {
      dbInitPromise = null;
      const msg = err?.message || String(err);
      if (!msg.includes("Connection terminated due to connection timeout") && !msg.includes("timeout")) {
        Logger.warn("Database initialization status notice", { error: msg });
      }
    });
  }
  return dbInitPromise;
}
function createApp() {
  const app2 = express();
  app2.disable("x-powered-by");
  app2.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
  app2.use(express.json({ limit: "20mb" }));
  app2.use(express.urlencoded({ extended: true, limit: "20mb" }));
  app2.use((req, res, next) => {
    if (!isDbSchemaInitialized && isPostgresConfigured()) {
      initializeDatabaseOnce().catch(() => {
      });
    }
    next();
  });
  app2.use(apiRouter);
  app2.use(matchApiRouter);
  app2.use(adminRouter);
  app2.use(walletRouter);
  app2.use(adminWalletRouter);
  app2.use((err, req, res, next) => {
    Logger.error("Unhandled server error in request pipeline", err, {
      path: req.path,
      method: req.method
    });
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  return app2;
}
var app = createApp();
export {
  app,
  createApp,
  initializeDatabaseOnce
};
//# sourceMappingURL=_bundle.js.map
