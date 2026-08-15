import { pgTable, text, timestamp, integer, boolean, jsonb, numeric, index, uniqueIndex } from 'drizzle-orm/pg-core';

// -----------------------------------------------------------------------------
// 1. USERS (Permanent Source of Truth)
// -----------------------------------------------------------------------------
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  email: text('email'),
  avatarUrl: text('avatar_url'),
  walletAddress: text('wallet_address'),
  coins: integer('coins').notNull().default(1000),
  diamonds: integer('diamonds').notNull().default(10),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// 2. GAMES (Authoritative Game Sessions)
// -----------------------------------------------------------------------------
export const games = pgTable('games', {
  id: text('id').primaryKey(),
  mode: text('mode').notNull().default('2_PLAYER'), // '2_PLAYER' | '4_PLAYER' | 'SNAKE_LUDO'
  status: text('status').notNull().default('WAITING'), // 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
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

// -----------------------------------------------------------------------------
// 3. GAME PLAYERS (Participants per Game)
// -----------------------------------------------------------------------------
export const gamePlayers = pgTable('game_players', {
  id: text('id').primaryKey(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  color: text('color').notNull(), // 'red' | 'green' | 'yellow' | 'blue'
  isHost: boolean('is_host').notNull().default(false),
  isAi: boolean('is_ai').notNull().default(false),
  finishPosition: integer('finish_position'),
  finalScore: integer('final_score').notNull().default(0),
  tokensHome: integer('tokens_home').notNull().default(0),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  gameUserIdx: index('game_players_game_user_idx').on(table.gameId, table.userId),
}));

// -----------------------------------------------------------------------------
// 4. GAME EVENTS (Append-Only Immutable Event Ledger)
// -----------------------------------------------------------------------------
export const gameEvents = pgTable('game_events', {
  id: text('id').primaryKey(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  sequenceNumber: integer('sequence_number').notNull(),
  eventType: text('event_type').notNull(), // 'GAME_CREATED', 'DICE_ROLLED', 'TOKEN_MOVED', 'GAME_COMPLETED', etc.
  actorUserId: text('actor_user_id'),
  payload: jsonb('payload').notNull(),
  gameVersion: integer('game_version').notNull().default(1),
  serverTimestamp: timestamp('server_timestamp', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  gameSeqUnique: uniqueIndex('game_events_seq_uniq').on(table.gameId, table.sequenceNumber),
  gameIdIdx: index('game_events_game_id_idx').on(table.gameId),
}));

// -----------------------------------------------------------------------------
// 5. PLAYER STATISTICS (Aggregated Player Performance)
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// 6. LEADERBOARDS (Global, Weekly, Daily Ranks)
// -----------------------------------------------------------------------------
export const leaderboards = pgTable('leaderboards', {
  id: text('id').primaryKey(),
  leaderboardType: text('leaderboard_type').notNull().default('GLOBAL'), // 'GLOBAL' | 'WEEKLY' | 'DAILY'
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

// -----------------------------------------------------------------------------
// 7. MATCH HISTORY (User Historical Match Logs)
// -----------------------------------------------------------------------------
export const matchHistory = pgTable('match_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  mode: text('mode').notNull(),
  result: text('result').notNull(), // 'WON' | 'LOST' | 'ABANDONED'
  score: integer('score').notNull().default(0),
  tokensHome: integer('tokens_home').notNull().default(0),
  playedAt: timestamp('played_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userHistoryIdx: index('match_history_user_idx').on(table.userId, table.playedAt),
}));

// -----------------------------------------------------------------------------
// 8. STORAGE OBJECTS (Cloudflare R2 File Metadata)
// -----------------------------------------------------------------------------
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
