import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { AuthoritativeLudoEngine } from '../game/authoritativeEngine';
import { GamePersistenceService } from '../game/persistenceService';
import { PresenceManager } from '../redis/presence';
import { Logger } from '../config/env';

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  username: string;
  gameId?: string;
  isAlive: boolean;
  color?: string;
}

export class ProductionWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ClientConnection> = new Map();
  private gameRooms: Map<string, Set<WebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: HttpServer): void {
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientIp = req.socket.remoteAddress || 'unknown';
      Logger.info(`New WebSocket client connected from ${clientIp}`);

      const clientInfo: ClientConnection = {
        ws,
        userId: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        username: 'Guest Player',
        isAlive: true,
      };
      this.clients.set(ws, clientInfo);

      ws.on('pong', () => {
        const client = this.clients.get(ws);
        if (client) {
          client.isAlive = true;
        }
      });

      ws.on('message', async (data: string) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleClientMessage(ws, message);
        } catch (err) {
          Logger.error('Failed to parse WebSocket message', err);
          this.send(ws, { type: 'ERROR', message: 'Malformed message format' });
        }
      });

      ws.on('close', () => {
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

      ws.on('error', (err) => {
        Logger.error('WebSocket connection error', err);
      });

      // Send initial welcome & connected state
      this.send(ws, {
        type: 'CONNECTED',
        userId: clientInfo.userId,
        timestamp: Date.now(),
      });
    });

    // 30s Heartbeat Check
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
    }, 30000);

    Logger.info('Production WebSocket Server initialized on path /ws');
  }

  private async handleClientMessage(ws: WebSocket, msg: { type: string; [key: string]: unknown }): Promise<void> {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (msg.type) {
      case 'AUTH': {
        const { userId, username } = msg as unknown as { userId?: string; username?: string };
        if (userId) client.userId = userId;
        if (username) client.username = username;
        PresenceManager.heartbeat(client.userId, client.username, 'ONLINE');
        this.send(ws, { type: 'AUTH_SUCCESS', userId: client.userId, username: client.username });
        break;
      }

      case 'JOIN_GAME': {
        const { gameId, color } = msg as unknown as { gameId: string; color?: string };
        if (!gameId) return;

        client.gameId = gameId;
        client.color = color;
        this.joinGameRoom(ws, gameId);

        PresenceManager.heartbeat(client.userId, client.username, 'IN_GAME', gameId);

        // Fetch or create authoritative session
        let session = await GamePersistenceService.getGameState(gameId);
        if (!session) {
          session = AuthoritativeLudoEngine.createNewGame(gameId, '2_PLAYER', [
            { userId: client.userId, username: client.username, color: 'red', isHuman: true },
            { userId: 'bot-blue', username: 'Player 2 (AI)', color: 'blue', isHuman: false },
          ]);
          await GamePersistenceService.saveActiveGameState(session);
          await GamePersistenceService.appendGameEvent(gameId, 1, 'GAME_CREATED', client.userId, { gameId }, 1);
        }

        // Broadcast current authoritative state
        this.broadcastToRoom(gameId, {
          type: 'GAME_STATE_UPDATE',
          session,
        });
        break;
      }

      case 'ROLL_DICE': {
        const gameId = client.gameId;
        if (!gameId) {
          this.send(ws, { type: 'ERROR', message: 'You are not in an active game' });
          return;
        }

        const session = await GamePersistenceService.getGameState(gameId);
        if (!session) {
          this.send(ws, { type: 'ERROR', message: 'Game not found' });
          return;
        }

        try {
          const result = AuthoritativeLudoEngine.rollDiceAuthoritative(session, client.userId);
          await GamePersistenceService.saveActiveGameState(result.session);
          await GamePersistenceService.appendGameEvent(
            gameId,
            result.session.sequenceNumber,
            'DICE_ROLLED',
            client.userId,
            { rollValue: result.rollValue, penalty: result.consecutiveSixesPenalty },
            result.session.version
          );

          this.broadcastToRoom(gameId, {
            type: 'DICE_ROLLED_AUTHORITATIVE',
            rollValue: result.rollValue,
            movablePawnIds: result.movablePawnIds,
            session: result.session,
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          this.send(ws, { type: 'ERROR', message: errMsg });
        }
        break;
      }

      case 'MOVE_TOKEN': {
        const gameId = client.gameId;
        const pawnId = msg.pawnId as string;
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
            'TOKEN_MOVED',
            client.userId,
            {
              pawnId,
              movedPawn: result.movedPawn,
              capturedPawn: result.capturedPawn,
              reachedGoal: result.reachedGoal,
              isGameWon: result.isGameWon,
            },
            result.session.version
          );

          this.broadcastToRoom(gameId, {
            type: 'TOKEN_MOVED_AUTHORITATIVE',
            movedPawn: result.movedPawn,
            capturedPawn: result.capturedPawn,
            reachedGoal: result.reachedGoal,
            isGameWon: result.isGameWon,
            session: result.session,
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          this.send(ws, { type: 'ERROR', message: errMsg });
        }
        break;
      }

      case 'SEND_CHAT': {
        const { gameId, text, isEmojiOnly } = msg as { gameId?: string; text?: string; isEmojiOnly?: boolean };
        if (!gameId || !text) return;

        this.broadcastToRoom(gameId, {
          type: 'CHAT_MESSAGE',
          message: {
            id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            senderName: client.username,
            senderColor: client.color || 'blue',
            text: text.substring(0, 200),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isEmojiOnly: !!isEmojiOnly,
          },
        });
        break;
      }
    }
  }

  private joinGameRoom(ws: WebSocket, gameId: string): void {
    let room = this.gameRooms.get(gameId);
    if (!room) {
      room = new Set();
      this.gameRooms.set(gameId, room);
    }
    room.add(ws);
  }

  private leaveGameRoom(ws: WebSocket, gameId: string): void {
    const room = this.gameRooms.get(gameId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        this.gameRooms.delete(gameId);
      }
    }
  }

  public broadcastToRoom(gameId: string, payload: Record<string, unknown>): void {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    const data = JSON.stringify(payload);
    room.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  private send(ws: WebSocket, payload: Record<string, unknown>): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  public async close(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.wss) {
      Logger.info('Closing WebSocket server...');
      this.wss.close();
      this.wss = null;
    }
  }
}

export const wsServerInstance = new ProductionWebSocketServer();
