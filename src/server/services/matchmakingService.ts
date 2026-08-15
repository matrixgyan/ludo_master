import { Logger } from '../config/env';

export interface MatchmakingTicket {
  userId: string;
  username: string;
  avatarUrl?: string;
  mode: '2_PLAYER' | '4_PLAYER' | 'SNAKE_LUDO';
  enqueuedAt: number;
}

export type PresenceStatus = 'ONLINE' | 'IN_LOBBY' | 'MATCHMAKING' | 'IN_GAME' | 'DISCONNECTED';

export interface UserPresenceData {
  userId: string;
  username: string;
  status: PresenceStatus;
  gameId?: string;
  lastHeartbeat: number;
}

export class MatchmakingService {
  private static queues = new Map<string, MatchmakingTicket[]>();

  static enqueue(
    userId: string,
    username: string,
    mode: '2_PLAYER' | '4_PLAYER' | 'SNAKE_LUDO',
    avatarUrl?: string
  ): { success: boolean; error?: string } {
    const list = this.queues.get(mode) || [];
    const filtered = list.filter((t) => t.userId !== userId);
    filtered.push({
      userId,
      username,
      avatarUrl,
      mode,
      enqueuedAt: Date.now(),
    });
    this.queues.set(mode, filtered);
    Logger.info(`User ${userId} (${username}) enqueued for mode ${mode}`);
    return { success: true };
  }

  static cancel(userId: string, mode: string): boolean {
    const list = this.queues.get(mode);
    if (list) {
      this.queues.set(
        mode,
        list.filter((t) => t.userId !== userId)
      );
    }
    return true;
  }

  static tryMatch(mode: '2_PLAYER' | '4_PLAYER' | 'SNAKE_LUDO'): MatchmakingTicket[] | null {
    const requiredPlayers = mode === '2_PLAYER' ? 2 : mode === '4_PLAYER' ? 4 : 2;
    const list = this.queues.get(mode) || [];
    if (list.length >= requiredPlayers) {
      const matched = list.slice(0, requiredPlayers);
      this.queues.set(mode, list.slice(requiredPlayers));
      return matched;
    }
    return null;
  }
}

export class PresenceManager {
  private static presence = new Map<string, UserPresenceData>();

  static heartbeat(
    userId: string,
    username: string,
    status: PresenceStatus,
    gameId?: string
  ): void {
    this.presence.set(userId, {
      userId,
      username,
      status,
      gameId,
      lastHeartbeat: Date.now(),
    });
  }

  static getPresence(userId: string): UserPresenceData | null {
    return this.presence.get(userId) || null;
  }

  static setDisconnected(userId: string): void {
    this.presence.delete(userId);
  }

  static getOnlineCount(): number {
    return this.presence.size;
  }
}
