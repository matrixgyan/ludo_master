export type PlayerColor = 'blue' | 'red' | 'green' | 'yellow';

export type PawnState = 'home' | 'path' | 'goal';

export interface Pawn {
  id: string; // e.g., 'blue-0', 'red-2'
  playerId: string;
  color: PlayerColor;
  pawnIndex: number; // 0, 1, 2, 3
  state: PawnState;
  pathStep: number; // -1 if home, 0..50 if on path, 51..56 if on home stretch/goal
  gridX: number;
  gridY: number;
}

export interface Player {
  id: string;
  name: string;
  avatarUrl: string;
  color: PlayerColor;
  level: number;
  isActive: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  isHuman: boolean;
  pawns: Pawn[];
  score: number;
}

export interface DiceState {
  value: number;
  isRolling: boolean;
  hasRolled: boolean;
  canRoll: boolean;
}

export interface GameState {
  players: Record<PlayerColor, Player>;
  currentTurn: PlayerColor;
  dice: DiceState;
  selectedPawnId: string | null;
  movablePawnIds: string[];
  statusText: string;
  winner: PlayerColor | null;
  isAutoPlay: boolean;
  isMuted: boolean;
  theme: 'dubai_sunset' | 'classic_emerald' | 'royal_gold';
  consecutiveSixes: number;
  gameType?: 'classic' | 'supreme';
  homesCount?: Record<PlayerColor, number>;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderColor: PlayerColor;
  text: string;
  timestamp: string;
  isEmojiOnly?: boolean;
}
