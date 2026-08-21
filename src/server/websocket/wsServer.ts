import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { AuthoritativeLudoEngine } from '../game/authoritativeEngine';
import { LudoSupremeEngine } from '../game/ludoSupremeEngine';
import { GamePersistenceService } from '../game/persistenceService';
import { ReconnectService } from '../game/reconnectService';
import { MatchSettlementService } from '../wallet/matchSettlementService';
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

      case 'JOIN_GAME':
      case 'JOIN_MATCH': {
        const { gameId, matchId, color, gameMode } = msg as unknown as {
          gameId?: string;
          matchId?: string;
          color?: string;
          gameMode?: string;
        };
        const targetId = matchId || gameId;
        if (!targetId) return;

        client.gameId = targetId;
        client.color = color;
        this.joinGameRoom(ws, targetId);

        PresenceManager.heartbeat(client.userId, client.username, 'IN_GAME', targetId);

        if (gameMode === 'LUDO_SUPREME') {
          let supremeSession = ReconnectService.getSupremeSession(targetId);
          if (!supremeSession) {
            supremeSession = LudoSupremeEngine.createSupremeSession(targetId, [
              { userId: client.userId, username: client.username, color: (color as any) || 'red', seatIndex: 0, isHuman: true },
              { userId: 'bot-blue', username: 'Opponent', color: 'blue', seatIndex: 1, isHuman: false },
            ]);
            ReconnectService.setSupremeSession(targetId, supremeSession);
          }

          this.broadcastToRoom(targetId, {
            type: 'GAME_STATE_UPDATE',
            session: supremeSession,
            gameMode: 'LUDO_SUPREME',
          });
        } else {
          // Online Arena Engine
          let session = await GamePersistenceService.getGameState(targetId);
          if (!session) {
            session = AuthoritativeLudoEngine.createNewGame(targetId, '2_PLAYER', [
              { userId: client.userId, username: client.username, color: (color as any) || 'red', isHuman: true },
              { userId: 'bot-blue', username: 'Player 2 (AI)', color: 'blue', isHuman: false },
            ]);
            await GamePersistenceService.saveActiveGameState(session);
            await GamePersistenceService.appendGameEvent(targetId, 1, 'GAME_CREATED', client.userId, { gameId: targetId }, 1);
          }

          this.broadcastToRoom(targetId, {
            type: 'GAME_STATE_UPDATE',
            session,
            gameMode: 'ONLINE_ARENA',
          });
        }
        break;
      }

      case 'RECONNECT': {
        const targetId = (msg.matchId || msg.gameId || client.gameId) as string;
        if (!targetId) return;

        client.gameId = targetId;
        this.joinGameRoom(ws, targetId);

        const recoveredState = await ReconnectService.getMatchAuthoritativeState(targetId, client.userId);
        if (recoveredState) {
          this.send(ws, {
            type: 'RECONNECT_STATE',
            state: recoveredState,
          });
        }
        break;
      }

      case 'ROLL_DICE': {
        const gameId = client.gameId;
        if (!gameId) {
          this.send(ws, { type: 'ERROR', message: 'You are not in an active game' });
          return;
        }

        // 1. Check Supreme Session
        const supremeSession = ReconnectService.getSupremeSession(gameId);
        if (supremeSession) {
          try {
            const result = LudoSupremeEngine.rollDice(supremeSession, client.userId);
            this.broadcastToRoom(gameId, {
              type: 'DICE_ROLLED_AUTHORITATIVE',
              rollValue: result.rollValue,
              movablePawnIds: result.movablePawnIds,
              session: result.session,
              gameMode: 'LUDO_SUPREME',
            });
          } catch (err: any) {
            this.send(ws, { type: 'ERROR', message: err.message || String(err) });
          }
          return;
        }

        // 2. Check Arena Session
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
            gameMode: 'ONLINE_ARENA',
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

        // 1. Check Supreme Session
        const supremeSession = ReconnectService.getSupremeSession(gameId);
        if (supremeSession) {
          try {
            const result = LudoSupremeEngine.moveToken(supremeSession, client.userId, pawnId);

            this.broadcastToRoom(gameId, {
              type: 'TOKEN_MOVED_AUTHORITATIVE',
              movedPawn: result.movedPawn,
              capturedPawn: result.capturedPawn,
              deltaScore: result.deltaScore,
              totalScore: result.totalScore,
              reachedGoal: result.reachedGoal,
              isGameWon: result.isGameWon,
              session: result.session,
              gameMode: 'LUDO_SUPREME',
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
                  totalDistanceMoved: r.distance,
                }))
              ).then((settleRes) => {
                this.broadcastToRoom(gameId, {
                  type: 'MATCH_SETTLED',
                  settlement: settleRes,
                });
              }).catch((err) => Logger.error('Supreme WS settlement error', err));
            }
          } catch (err: any) {
            this.send(ws, { type: 'ERROR', message: err.message || String(err) });
          }
          return;
        }

        // 2. Check Arena Session
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
                  tokensHome: p.pawns.filter((pw) => pw.state === 'goal').length,
                  capturesMade: 0,
                  totalDistanceMoved: p.pawns.reduce((sum, pw) => sum + (pw.pathStep >= 0 ? pw.pathStep : 0), 0),
                }));

                MatchSettlementService.settleMatch(gameId, winnerPlayer.id, rankings).then((settleRes) => {
                  this.broadcastToRoom(gameId, {
                    type: 'MATCH_SETTLED',
                    settlement: settleRes,
                  });
                }).catch((err) => Logger.error('Arena WS settlement error', err));
              }
            }
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
            gameMode: 'ONLINE_ARENA',
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
