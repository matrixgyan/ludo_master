var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/server/app.ts
import express from "express";

// src/server/routes/api.ts
import { Router } from "express";
import multer from "multer";

// src/server/db/client.ts
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// src/server/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  gameEvents: () => gameEvents,
  gamePlayers: () => gamePlayers,
  games: () => games,
  leaderboards: () => leaderboards,
  matchHistory: () => matchHistory,
  playerStatistics: () => playerStatistics,
  storageObjects: () => storageObjects,
  users: () => users
});
import { pgTable, text, timestamp, integer, boolean, jsonb, numeric, index, uniqueIndex } from "drizzle-orm/pg-core";
var users = pgTable("users", {
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
var games = pgTable("games", {
  id: text("id").primaryKey(),
  mode: text("mode").notNull().default("2_PLAYER"),
  // '2_PLAYER' | '4_PLAYER' | 'SNAKE_LUDO'
  status: text("status").notNull().default("WAITING"),
  // 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
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
var gamePlayers = pgTable("game_players", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  color: text("color").notNull(),
  // 'red' | 'green' | 'yellow' | 'blue'
  isHost: boolean("is_host").notNull().default(false),
  isAi: boolean("is_ai").notNull().default(false),
  finishPosition: integer("finish_position"),
  finalScore: integer("final_score").notNull().default(0),
  tokensHome: integer("tokens_home").notNull().default(0),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  gameUserIdx: index("game_players_game_user_idx").on(table.gameId, table.userId)
}));
var gameEvents = pgTable("game_events", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  sequenceNumber: integer("sequence_number").notNull(),
  eventType: text("event_type").notNull(),
  // 'GAME_CREATED', 'DICE_ROLLED', 'TOKEN_MOVED', 'GAME_COMPLETED', etc.
  actorUserId: text("actor_user_id"),
  payload: jsonb("payload").notNull(),
  gameVersion: integer("game_version").notNull().default(1),
  serverTimestamp: timestamp("server_timestamp", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  gameSeqUnique: uniqueIndex("game_events_seq_uniq").on(table.gameId, table.sequenceNumber),
  gameIdIdx: index("game_events_game_id_idx").on(table.gameId)
}));
var playerStatistics = pgTable("player_statistics", {
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
var leaderboards = pgTable("leaderboards", {
  id: text("id").primaryKey(),
  leaderboardType: text("leaderboard_type").notNull().default("GLOBAL"),
  // 'GLOBAL' | 'WEEKLY' | 'DAILY'
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
var matchHistory = pgTable("match_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  mode: text("mode").notNull(),
  result: text("result").notNull(),
  // 'WON' | 'LOST' | 'ABANDONED'
  score: integer("score").notNull().default(0),
  tokensHome: integer("tokens_home").notNull().default(0),
  playedAt: timestamp("played_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  userHistoryIdx: index("match_history_user_idx").on(table.userId, table.playedAt)
}));
var storageObjects = pgTable("storage_objects", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  bucket: text("bucket").notNull(),
  userId: text("user_id"),
  contentType: text("content_type").notNull().default("application/octet-stream"),
  sizeBytes: integer("size_bytes").notNull().default(0),
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

// src/server/config/env.ts
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();
var envSchema = z.object({
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
function parseEnv() {
  const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);
  const raw = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3,
    IS_VERCEL: isVercel,
    // Neon PostgreSQL resolution
    DATABASE_URL: process.env.DATABASE_URL,
    // Redis / Upstash resolution
    REDIS_URL: process.env.REDIS_URL,
    // Cloudflare R2 resolution
    R2_ENDPOINT: process.env.R2_ENDPOINT || process.env.CLOUDFLARE_R2_ENDPOINT || process.env.AWS_ENDPOINT_URL_S3,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET || process.env.R2_BUCKET || process.env.AWS_BUCKET_NAME,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
  };
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    console.error("\u274C Environment configuration validation warning:", result.error.format());
    return envSchema.parse(raw);
  }
  return result.data;
}
var config = parseEnv();
var Logger = class {
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

// src/server/db/client.ts
var { Pool } = pg;
function isPostgresConfigured() {
  return Boolean(config.DATABASE_URL && config.DATABASE_URL.trim().length > 0);
}
function getDbPool() {
  if (!isPostgresConfigured()) {
    return null;
  }
  if (!globalThis.__ludo_pg_pool) {
    const isLocal = config.DATABASE_URL?.includes("localhost") || config.DATABASE_URL?.includes("127.0.0.1");
    globalThis.__ludo_pg_pool = new Pool({
      connectionString: config.DATABASE_URL,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      min: 0,
      // Serverless scale-to-zero friendly
      max: config.IS_VERCEL ? 3 : 10,
      idleTimeoutMillis: 1e4,
      // Reclaim idle clients before serverless gateway drops
      connectionTimeoutMillis: 8e3,
      keepAlive: true,
      keepAliveInitialDelayMillis: 1e4
    });
    globalThis.__ludo_pg_pool.on("error", (err) => {
      const errMsg = err?.message || String(err);
      if (errMsg.includes("Connection terminated unexpectedly") || err?.code === "ECONNRESET") {
        Logger.info("Idle Neon PostgreSQL client socket recycled by server.");
        return;
      }
      Logger.warn("Neon PostgreSQL pool warning", { error: errMsg });
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

// src/server/redis/client.ts
import Redis from "ioredis";
var lastConnectionError = null;
function isRedisConfigured() {
  return Boolean(
    config.REDIS_URL && config.REDIS_URL.trim().length > 0 && !config.REDIS_URL.includes("samplepassword")
  );
}
function getRedisConfig() {
  return {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    enableOfflineQueue: true,
    connectTimeout: 1e4,
    commandTimeout: 8e3,
    // Automatic TLS support for Upstash rediss:// or Cloud Redis
    tls: config.REDIS_URL?.startsWith("rediss://") ? { rejectUnauthorized: false } : void 0,
    retryStrategy(times) {
      if (times > 5) {
        return null;
      }
      return Math.min(times * 200, 2e3);
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

// src/server/storage/r2Client.ts
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

// src/server/redis/locks.ts
import { v4 as uuidv42 } from "uuid";
var DistributedLock = class {
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

// src/server/redis/matchmaking.ts
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

// src/server/queues/queueManager.ts
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
import { Router as Router2 } from "express";
import multer2 from "multer";

// src/server/websocket/wsServer.ts
import { WebSocketServer, WebSocket } from "ws";

// src/server/game/authoritativeEngine.ts
import crypto from "crypto";

// src/game/boardGeometry.ts
var MAIN_PATH = [
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
var COLOR_START_INDEX = {
  blue: 0,
  // (1, 6)
  red: 13,
  // (8, 1)
  green: 26,
  // (13, 8)
  yellow: 39
  // (6, 13)
};
var SAFE_CELL_INDEXES = [0, 8, 13, 21, 26, 34, 39, 47];
var HOME_STRETCH_PATHS = {
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
var HOME_SLOTS = {
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

// src/server/game/authoritativeEngine.ts
var AuthoritativeLudoEngine = class {
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

// src/server/websocket/wsServer.ts
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
      case "JOIN_GAME": {
        const { gameId, color } = msg;
        if (!gameId) return;
        client.gameId = gameId;
        client.color = color;
        this.joinGameRoom(ws, gameId);
        PresenceManager.heartbeat(client.userId, client.username, "IN_GAME", gameId);
        let session = await GamePersistenceService.getGameState(gameId);
        if (!session) {
          session = AuthoritativeLudoEngine.createNewGame(gameId, "2_PLAYER", [
            { userId: client.userId, username: client.username, color: "red", isHuman: true },
            { userId: "bot-blue", username: "Player 2 (AI)", color: "blue", isHuman: false }
          ]);
          await GamePersistenceService.saveActiveGameState(session);
          await GamePersistenceService.appendGameEvent(gameId, 1, "GAME_CREATED", client.userId, { gameId }, 1);
        }
        this.broadcastToRoom(gameId, {
          type: "GAME_STATE_UPDATE",
          session
        });
        break;
      }
      case "ROLL_DICE": {
        const gameId = client.gameId;
        if (!gameId) {
          this.send(ws, { type: "ERROR", message: "You are not in an active game" });
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
            session: result.session
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
        const session = await GamePersistenceService.getGameState(gameId);
        if (!session) return;
        try {
          const result = AuthoritativeLudoEngine.moveTokenAuthoritative(session, client.userId, pawnId);
          if (result.isGameWon) {
            await GamePersistenceService.finalizeGame(result.session);
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
            session: result.session
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
import { eq as eq2, desc as desc2, sql, like, or } from "drizzle-orm";
import { v4 as uuidv43 } from "uuid";
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
    const token = `adm_${uuidv43()}_${Date.now()}`;
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
      diamonds: 120,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      walletAddress: "0x71C...49b2"
    },
    {
      id: "p2",
      username: "Player 2 (Viper)",
      coins: 8200,
      diamonds: 45,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      walletAddress: "0x32A...81ec"
    },
    {
      id: "p3",
      username: "Player 3 (Apex)",
      coins: 4900,
      diamonds: 10,
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
  const { coinsDelta, diamondsDelta, reason } = req.body;
  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        await db.update(users).set({
          coins: sql`${users.coins} + ${Number(coinsDelta || 0)}`,
          diamonds: sql`${users.diamonds} + ${Number(diamondsDelta || 0)}`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq2(users.id, userId));
        const updated = await db.select().from(users).where(eq2(users.id, userId)).limit(1);
        Logger.info(`Admin adjusted balance for ${userId}: Coins +${coinsDelta}, Diamonds +${diamondsDelta} (${reason})`);
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
    message: `Adjusted user ${userId} balance by coins: ${coinsDelta}, diamonds: ${diamondsDelta}`
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
    Logger.info("Initializing Neon PostgreSQL database schema...");
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
    Logger.info("Neon PostgreSQL tables initialized successfully.");
  } catch (err) {
    Logger.error("Failed to initialize Neon PostgreSQL database schema", err);
  } finally {
    client.release();
  }
}

// src/server/app.ts
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
      Logger.warn("Background database table initialization warning", { error: String(err) });
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
  app2.use(adminRouter);
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
