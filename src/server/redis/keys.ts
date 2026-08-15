export const RedisKeys = {
  // 1. Realtime Game State
  gameState: (gameId: string) => `ludo:state:${gameId}`,
  gameVersion: (gameId: string) => `ludo:version:${gameId}`,
  gameTurn: (gameId: string) => `ludo:turn:${gameId}`,
  gameRoomMembers: (gameId: string) => `ludo:room:${gameId}:members`,

  // 2. Distributed Locks
  gameLock: (gameId: string) => `ludo:lock:game:${gameId}`,
  userLock: (userId: string) => `ludo:lock:user:${userId}`,
  matchmakingLock: (mode: string) => `ludo:lock:matchmaking:${mode}`,

  // 3. Player Presence
  userPresence: (userId: string) => `ludo:presence:${userId}`,
  onlineUsers: () => 'ludo:presence:online_set',

  // 4. Matchmaking
  matchmakingQueue: (mode: string) => `ludo:matchmaking:queue:${mode}`,
  playerTicket: (userId: string) => `ludo:matchmaking:ticket:${userId}`,

  // 5. Rate Limiting
  rateLimit: (key: string) => `ludo:ratelimit:${key}`,

  // 6. Cache
  leaderboardCache: (type: string) => `ludo:cache:leaderboard:${type}`,
  userStatsCache: (userId: string) => `ludo:cache:stats:${userId}`,
};
