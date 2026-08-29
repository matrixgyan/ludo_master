import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Crown, Sparkles, RotateCcw, Home, Coins } from 'lucide-react';
import { Player, PlayerColor } from '../../../types/game';
import { SoundManager } from '../../../audio/soundManager';
import { usePlatformMode } from '../../../hooks/usePlatformMode';

interface VictoryModalProps {
  isOpen: boolean;
  winnerColor: PlayerColor | null;
  players: Record<PlayerColor, Player>;
  prizePool: number;
  onRematch: () => void;
  onBackToLobby: () => void;
  gameType?: 'classic' | 'supreme';
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  winnerColor,
  players,
  prizePool,
  onRematch,
  onBackToLobby,
  gameType = 'supreme',
}) => {
  const { currencySymbol, platformCurrency } = usePlatformMode();

  if (!isOpen || !winnerColor) return null;

  const winner = players[winnerColor];
  const isHumanWinner = winner?.isHuman ?? false;

  // Rank players by score descending
  const activePlayersList = (Object.keys(players) as PlayerColor[])
    .map((c) => players[c])
    .filter((p) => p && p.isActive)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          className="relative w-full max-w-sm bg-gradient-to-b from-[#2a0b4d] via-[#16062a] to-[#0b0217] rounded-3xl border-2 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.5)] p-5 sm:p-6 text-center text-white flex flex-col items-center overflow-hidden max-h-[92vh] overflow-y-auto"
        >
          {/* Radiating Victory Rays */}
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_50%_40%,rgba(251,191,36,0.6)_0%,transparent_70%)] animate-pulse" />

          {/* Crown & Trophy Icon */}
          <div className="relative mb-2">
            <motion.div
              animate={{ rotate: [-5, 5, -5], y: [-4, 0, -4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-3 border-white shadow-[0_0_30px_rgba(251,191,36,0.8)] flex items-center justify-center mx-auto"
            >
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-slate-950 fill-slate-950" />
            </motion.div>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 fill-amber-300 drop-shadow-[0_0_8px_#f59e0b]" />
            </div>
          </div>

          <div className="flex items-center gap-1 text-amber-300 text-xs font-black tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{gameType === 'supreme' ? 'SUPREME MATCH FINISHED' : 'MATCH FINISHED'}</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
            {isHumanWinner ? '🏆 YOU WON!' : `${winner?.name || 'Player'} WINS!`}
          </h2>

          {/* Winner Profile Banner */}
          {winner && (
            <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/30 to-yellow-500/20 border border-amber-400/50 px-3.5 py-2 rounded-2xl my-3 w-full">
              <div className="flex items-center gap-2.5">
                <img
                  src={winner.avatarUrl}
                  alt={winner.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-400"
                />
                <div className="text-left">
                  <span className="text-sm font-black text-white block">{winner.name}</span>
                  <span className="text-[10px] text-amber-300 font-bold uppercase">{winner.color} CHAMPION</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-300 block font-bold">Total Score</span>
                <span className="text-base font-black text-amber-300">⭐ {winner.score ?? 0}</span>
              </div>
            </div>
          )}

          {/* Prize Won Banner */}
          {prizePool > 0 && isHumanWinner && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: [0.97, 1.03, 0.97] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-full py-2 px-3 rounded-2xl bg-gradient-to-r from-emerald-900/90 to-teal-900/90 border border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)] mb-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
                <Coins className="w-4 h-4 text-emerald-400" />
                <span>Prize Money Credited</span>
              </div>
              <span className="text-sm sm:text-base font-black text-emerald-300">+{currencySymbol}{prizePool.toFixed(2)} {platformCurrency}</span>
            </motion.div>
          )}

          {/* Full Match Scoreboard Ranking */}
          <div className="w-full bg-black/40 rounded-2xl p-2.5 border border-white/10 mb-4 space-y-1.5">
            <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block text-left px-1">
              Final Scoreboard
            </span>
            {activePlayersList.map((p, idx) => (
              <div
                key={`player-rank-${p.id || p.color || idx}`}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold ${
                  idx === 0
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
                    : 'bg-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 text-left font-black text-slate-400">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span>{p.name}</span>
                </div>
                <span className="font-mono font-black text-white">⭐ {p.score ?? 0} pts</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-2">
            <button
              onClick={() => {
                SoundManager.play('click');
                onRematch();
              }}
              className="w-full py-3 rounded-xl font-black text-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-[0_4px_15px_rgba(251,191,36,0.4)] border border-yellow-200 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>

            <button
              onClick={() => {
                SoundManager.play('click');
                onBackToLobby();
              }}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/15 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>RETURN TO LOBBY</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
