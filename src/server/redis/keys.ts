/**
 * Structured Redis Key Patterns
 * Prevents arbitrary key pollution and guarantees proper namespacing and TTL enforcement.
 */
export const RedisKeys = {
  // Game state & locks
  gameState: (gameId: string) => `ludo:game:${gameId}:state`,
  gamePlayers: (gameId: string) => `ludo:game:${gameId}:players`,
  gameTurn: (gameId: string) => `ludo:game:${gameId}:turn`,
  gameVersion: (gameId: string) => `ludo:game:${gameId}:version`,
  gameLock: (gameId: string) => `ludo:lock:game:${gameId}`,
  gamePresence: (gameId: string) => `ludo:game:${gameId}:presence`,
  gameEventsPubSub: (gameId: string) => `ludo:pubsub:game:${gameId}`,

  // Player Presence
  userPresence: (userId: string) => `ludo:presence:user:${userId}`,
  onlineUsersSet: () => `ludo:presence:online_users`,

  // Matchmaking
  matchmakingQueue: (mode: string) => `ludo:matchmaking:${mode}`,
  matchmakingTicket: (userId: string) => `ludo:matchmaking:ticket:${userId}`,
  matchmakingLock: (mode: string) => `ludo:lock:matchmaking:${mode}`,

  // Rate Limiting
  rateLimit: (action: string, identifier: string) => `ludo:ratelimit:${action}:${identifier}`,

  // Cache & Session
  userSession: (sessionId: string) => `ludo:session:${sessionId}`,
  leaderboardCache: (type: string, period: string) => `ludo:cache:leaderboard:${type}:${period}`,
};
