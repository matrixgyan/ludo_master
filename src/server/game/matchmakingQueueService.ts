import { v4 as uuidv4 } from 'uuid';
import { GameMode, PlayerCount } from './matchConfig';
import { Logger } from '../config/env';
import { getDbPool, isPostgresConfigured } from '../db/client';

export interface QueueEntry {
  queueId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  country: string;
  rating: number;
  ping: number;
  gameMode: GameMode;
  playerCount: PlayerCount;
  entryFee: number;
  matchType: 'REAL' | 'PRACTICE';
  joinedAt: number;
  lastHeartbeat: number;
  matchId?: string;
  color?: string;
  seatIndex?: number;
}

export interface MatchedRoom {
  matchId: string;
  matchCode: string;
  gameMode: GameMode;
  playerCount: PlayerCount;
  entryFee: number;
  prizePool: number;
  matchType: 'REAL' | 'PRACTICE';
  status: 'WAITING_FOR_REAL_PLAYERS' | 'STARTING' | 'ACTIVE' | 'COMPLETED';
  players: QueueEntry[];
  createdAt: number;
  startedAt?: number;
}

// In-Memory live matchmaking pools for sub-millisecond atomic queue pairing
export class MatchmakingQueueService {
  private static queues: Map<string, QueueEntry[]> = new Map(); // poolKey -> QueueEntry[]
  private static activeRooms: Map<string, MatchedRoom> = new Map(); // matchId -> MatchedRoom
  private static userRoomMap: Map<string, string> = new Map(); // userId -> matchId

  private static getPoolKey(gameMode: GameMode, playerCount: PlayerCount, entryFee: number): string {
    return `${gameMode}_${playerCount}P_${entryFee.toFixed(2)}`;
  }

  /**
   * Join live matchmaking queue
   */
  public static async joinQueue(params: {
    userId: string;
    username: string;
    avatarUrl: string;
    country?: string;
    rating?: number;
    ping?: number;
    gameMode?: GameMode;
    playerCount?: PlayerCount;
    entryFee?: number;
    matchType?: 'REAL' | 'PRACTICE';
  }): Promise<{
    status: MatchedRoom['status'];
    matchId: string;
    matchCode: string;
    matchType: 'REAL' | 'PRACTICE';
    assignedColor: string;
    seatIndex: number;
    players: QueueEntry[];
    entryFee: number;
    prizePool: number;
  }> {
    const gameMode = params.gameMode || GameMode.LUDO_SUPREME;
    const playerCount = (params.playerCount || 2) as PlayerCount;
    const entryFee = params.entryFee ?? 0;
    const matchType = entryFee > 0 ? 'REAL' : (params.matchType || 'PRACTICE');
    const poolKey = this.getPoolKey(gameMode, playerCount, entryFee);

    // Clean user id
    const cleanUserId = params.userId || `user_${Date.now()}`;
    const cleanUsername = params.username || `Player_${cleanUserId.slice(-4)}`;
    const avatar = params.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    Logger.info(`[MATCHMAKING QUEUE] User ${cleanUserId} (${cleanUsername}) joining ${matchType} queue for ${poolKey}`);

    // Colors palette
    const colors = playerCount === 2 ? ['red', 'blue'] : playerCount === 3 ? ['red', 'green', 'yellow'] : ['red', 'green', 'yellow', 'blue'];

    // 1. PRACTICE MATCH -> Immediate launch with AI / Practice Player
    if (matchType === 'PRACTICE' || entryFee === 0) {
      const matchId = `prac_${Date.now()}_${uuidv4().slice(0, 6)}`;
      const matchCode = `PRAC-${Math.floor(1000 + Math.random() * 9000)}`;

      const userEntry: QueueEntry = {
        queueId: uuidv4(),
        userId: cleanUserId,
        username: cleanUsername,
        avatarUrl: avatar,
        country: params.country || 'AE',
        rating: params.rating || 1850,
        ping: params.ping || 24,
        gameMode,
        playerCount,
        entryFee: 0,
        matchType: 'PRACTICE',
        joinedAt: Date.now(),
        lastHeartbeat: Date.now(),
        matchId,
        color: colors[0],
        seatIndex: 0,
      };

      // Fill practice opponents (AI trainers)
      const botNames = ['Apex_Bot', 'Viper_AI', 'Shadow_Knight', 'Cyber_Ace'];
      const botAvatars = [
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      ];

      const allPlayers: QueueEntry[] = [userEntry];
      for (let i = 1; i < playerCount; i++) {
        allPlayers.push({
          queueId: uuidv4(),
          userId: `ai_bot_${i}_${Date.now()}`,
          username: botNames[(i - 1) % botNames.length],
          avatarUrl: botAvatars[(i - 1) % botAvatars.length],
          country: 'GLOBAL',
          rating: 1750 + i * 40,
          ping: 15 + i * 5,
          gameMode,
          playerCount,
          entryFee: 0,
          matchType: 'PRACTICE',
          joinedAt: Date.now(),
          lastHeartbeat: Date.now(),
          matchId,
          color: colors[i],
          seatIndex: i,
        });
      }

      const room: MatchedRoom = {
        matchId,
        matchCode,
        gameMode,
        playerCount,
        entryFee: 0,
        prizePool: 0,
        matchType: 'PRACTICE',
        status: 'STARTING',
        players: allPlayers,
        createdAt: Date.now(),
        startedAt: Date.now(),
      };

      this.activeRooms.set(matchId, room);
      this.userRoomMap.set(cleanUserId, matchId);

      return {
        status: 'STARTING',
        matchId,
        matchCode,
        matchType: 'PRACTICE',
        assignedColor: userEntry.color!,
        seatIndex: 0,
        players: allPlayers,
        entryFee: 0,
        prizePool: 0,
      };
    }

    // 2. REAL MATCH -> Strict Real Player Matchmaking
    // Check if user is already in an active room
    const existingRoomId = this.userRoomMap.get(cleanUserId);
    if (existingRoomId && this.activeRooms.has(existingRoomId)) {
      const room = this.activeRooms.get(existingRoomId)!;
      if (room.status === 'WAITING_FOR_REAL_PLAYERS' || room.status === 'STARTING') {
        const userP = room.players.find((p) => p.userId === cleanUserId);
        return {
          status: room.status,
          matchId: room.matchId,
          matchCode: room.matchCode,
          matchType: 'REAL',
          assignedColor: userP?.color || colors[0],
          seatIndex: userP?.seatIndex || 0,
          players: room.players,
          entryFee: room.entryFee,
          prizePool: room.prizePool,
        };
      }
    }

    // Look for existing waiting real room in this pool
    let targetRoom: MatchedRoom | undefined;
    for (const [, r] of this.activeRooms.entries()) {
      const rPoolKey = this.getPoolKey(r.gameMode, r.playerCount, r.entryFee);
      if (
        rPoolKey === poolKey &&
        r.matchType === 'REAL' &&
        r.status === 'WAITING_FOR_REAL_PLAYERS' &&
        r.players.length < playerCount &&
        !r.players.some((p) => p.userId === cleanUserId)
      ) {
        targetRoom = r;
        break;
      }
    }

    const grossPrize = entryFee * playerCount;
    const netPrize = grossPrize * 0.9; // 10% platform rake

    if (targetRoom) {
      // Join existing waiting real room!
      const seatIndex = targetRoom.players.length;
      const assignedColor = colors[seatIndex] || colors[0];

      const newEntry: QueueEntry = {
        queueId: uuidv4(),
        userId: cleanUserId,
        username: cleanUsername,
        avatarUrl: avatar,
        country: params.country || 'AE',
        rating: params.rating || 1920,
        ping: params.ping || 28,
        gameMode,
        playerCount,
        entryFee,
        matchType: 'REAL',
        joinedAt: Date.now(),
        lastHeartbeat: Date.now(),
        matchId: targetRoom.matchId,
        color: assignedColor,
        seatIndex,
      };

      targetRoom.players.push(newEntry);
      this.userRoomMap.set(cleanUserId, targetRoom.matchId);

      // Check if room is now full of real players!
      if (targetRoom.players.length >= playerCount) {
        targetRoom.status = 'STARTING';
        targetRoom.startedAt = Date.now();
        Logger.info(`[MATCHMAKING QUEUE] Real Room ${targetRoom.matchId} is FULL with ${playerCount} REAL PLAYERS! Starting match!`);
      } else {
        Logger.info(`[MATCHMAKING QUEUE] Real Room ${targetRoom.matchId} now has ${targetRoom.players.length}/${playerCount} real players.`);
      }

      return {
        status: targetRoom.status,
        matchId: targetRoom.matchId,
        matchCode: targetRoom.matchCode,
        matchType: 'REAL',
        assignedColor,
        seatIndex,
        players: targetRoom.players,
        entryFee,
        prizePool: netPrize,
      };
    } else {
      // Create a new waiting room for real players
      const matchId = `real_${Date.now()}_${uuidv4().slice(0, 6)}`;
      const matchCode = `LUDO-${Math.floor(1000 + Math.random() * 9000)}`;

      const userEntry: QueueEntry = {
        queueId: uuidv4(),
        userId: cleanUserId,
        username: cleanUsername,
        avatarUrl: avatar,
        country: params.country || 'AE',
        rating: params.rating || 1920,
        ping: params.ping || 28,
        gameMode,
        playerCount,
        entryFee,
        matchType: 'REAL',
        joinedAt: Date.now(),
        lastHeartbeat: Date.now(),
        matchId,
        color: colors[0],
        seatIndex: 0,
      };

      const newRoom: MatchedRoom = {
        matchId,
        matchCode,
        gameMode,
        playerCount,
        entryFee,
        prizePool: netPrize,
        matchType: 'REAL',
        status: 'WAITING_FOR_REAL_PLAYERS',
        players: [userEntry],
        createdAt: Date.now(),
      };

      this.activeRooms.set(matchId, newRoom);
      this.userRoomMap.set(cleanUserId, matchId);

      Logger.info(`[MATCHMAKING QUEUE] Created waiting real room ${matchId} for user ${cleanUserId}. Waiting for real opponents...`);

      return {
        status: 'WAITING_FOR_REAL_PLAYERS',
        matchId,
        matchCode,
        matchType: 'REAL',
        assignedColor: colors[0],
        seatIndex: 0,
        players: [userEntry],
        entryFee,
        prizePool: netPrize,
      };
    }
  }

  /**
   * Poll current matchmaking status for a room or user
   */
  public static pollStatus(matchId: string, userId: string): {
    found: boolean;
    status: 'WAITING_FOR_REAL_PLAYERS' | 'STARTING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    matchId: string;
    matchCode: string;
    matchType: 'REAL' | 'PRACTICE';
    playerCount: number;
    joinedCount: number;
    players: QueueEntry[];
    prizePool: number;
    entryFee: number;
  } {
    const room = this.activeRooms.get(matchId);
    if (!room) {
      return {
        found: false,
        status: 'CANCELLED',
        matchId,
        matchCode: '',
        matchType: 'REAL',
        playerCount: 2,
        joinedCount: 0,
        players: [],
        prizePool: 0,
        entryFee: 0,
      };
    }

    // Update heartbeat for polling user
    const p = room.players.find((pl) => pl.userId === userId);
    if (p) {
      p.lastHeartbeat = Date.now();
    }

    return {
      found: true,
      status: room.status,
      matchId: room.matchId,
      matchCode: room.matchCode,
      matchType: room.matchType,
      playerCount: room.playerCount,
      joinedCount: room.players.length,
      players: room.players,
      prizePool: room.prizePool,
      entryFee: room.entryFee,
    };
  }

  /**
   * Simulate or force a real verified 2nd player to join (for preview / demo / multi-device testing)
   */
  public static simulateRealPlayerJoin(matchId: string): {
    success: boolean;
    message: string;
    room?: MatchedRoom;
  } {
    const room = this.activeRooms.get(matchId);
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    if (room.players.length >= room.playerCount) {
      return { success: true, message: 'Room is already full', room };
    }

    const colors = room.playerCount === 2 ? ['red', 'blue'] : room.playerCount === 3 ? ['red', 'green', 'yellow'] : ['red', 'green', 'yellow', 'blue'];
    const seatIndex = room.players.length;
    const assignedColor = colors[seatIndex] || 'blue';

    const realOpponents = [
      {
        userId: '8910482019',
        username: 'Vikram_Pro99',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        country: 'IN',
        rating: 1980,
        ping: 22,
      },
      {
        userId: '6591028374',
        username: 'Elena_Dubai',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        country: 'AE',
        rating: 2040,
        ping: 18,
      },
      {
        userId: '4829103857',
        username: 'Rashid_Winner',
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        country: 'SA',
        rating: 2110,
        ping: 25,
      },
    ];

    const oppData = realOpponents[(seatIndex - 1) % realOpponents.length];

    const newRealPlayer: QueueEntry = {
      queueId: uuidv4(),
      userId: oppData.userId,
      username: oppData.username,
      avatarUrl: oppData.avatarUrl,
      country: oppData.country,
      rating: oppData.rating,
      ping: oppData.ping,
      gameMode: room.gameMode,
      playerCount: room.playerCount,
      entryFee: room.entryFee,
      matchType: 'REAL',
      joinedAt: Date.now(),
      lastHeartbeat: Date.now(),
      matchId: room.matchId,
      color: assignedColor,
      seatIndex,
    };

    room.players.push(newRealPlayer);
    this.userRoomMap.set(newRealPlayer.userId, room.matchId);

    if (room.players.length >= room.playerCount) {
      room.status = 'STARTING';
      room.startedAt = Date.now();
      Logger.info(`[MATCHMAKING QUEUE] Real Player ${newRealPlayer.username} joined room ${room.matchId}. Table is FULL!`);
    }

    return {
      success: true,
      message: `Real player ${newRealPlayer.username} joined match`,
      room,
    };
  }

  /**
   * Cancel and leave queue
   */
  public static cancelQueue(userId: string, matchId?: string): boolean {
    const targetRoomId = matchId || this.userRoomMap.get(userId);
    if (!targetRoomId) return false;

    const room = this.activeRooms.get(targetRoomId);
    if (room) {
      room.players = room.players.filter((p) => p.userId !== userId);
      if (room.players.length === 0) {
        this.activeRooms.delete(targetRoomId);
      } else {
        room.status = 'WAITING_FOR_REAL_PLAYERS';
      }
    }

    this.userRoomMap.delete(userId);
    Logger.info(`[MATCHMAKING QUEUE] User ${userId} left matchmaking queue ${targetRoomId}`);
    return true;
  }
}
