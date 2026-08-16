import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Crown, Sparkles, RotateCcw, Home, DollarSign } from 'lucide-react';
import { Player, PlayerColor } from '../../../types/game';
import { SoundManager } from '../../../audio/soundManager';

interface VictoryModalProps {
  isOpen: boolean;
  winnerColor: PlayerColor | null;
  players: Record<PlayerColor, Player>;
  prizePool: number;
  onRematch: () => void;
  onBackToLobby: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  winnerColor,
  players,
  prizePool,
  onRematch,
  onBackToLobby,
}) => {
  if (!isOpen || !winnerColor) return null;

  const winner = players[winnerColor];
  const isHumanWinner = winner.isHuman;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          className="relative w-full max-w-sm bg-gradient-to-b from-[#2a0b4d] via-[#16062a] to-[#0b0217] rounded-3xl border-2 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.5)] p-6 text-center text-white flex flex-col items-center overflow-hidden"
        >
          {/* Radiating Victory Rays */}
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_50%_40%,rgba(251,191,36,0.6)_0%,transparent_70%)] animate-pulse" />

          {/* Crown & Trophy Icon */}
          <div className="relative mb-3">
            <motion.div
              animate={{ rotate: [-5, 5, -5], y: [-4, 0, -4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-3 border-white shadow-[0_0_30px_rgba(251,191,36,0.8)] flex items-center justify-center mx-auto"
            >
              <Trophy className="w-10 h-10 text-slate-950 fill-slate-950" />
            </motion.div>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Crown className="w-7 h-7 text-amber-300 fill-amber-300 drop-shadow-[0_0_8px_#f59e0b]" />
            </div>
          </div>

          <div className="flex items-center gap-1 text-amber-300 text-xs font-black tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MATCH FINISHED</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
            {isHumanWinner ? 'VICTORY!' : `${winner.name} WINS!`}
          </h2>

          <p className="text-xs text-violet-200 mt-1">
            {isHumanWinner
              ? 'Outstanding performance! You conquered the board!'
              : 'Better luck next time! Keep rolling to win!'}
          </p>

          {/* Winner Profile Chip */}
          <div className="flex items-center gap-3 bg-white/10 border border-white/20 px-4 py-2.5 rounded-2xl my-4 w-full justify-center">
            <img
              src={winner.avatarUrl}
              alt={winner.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-amber-400"
            />
            <div className="text-left">
              <span className="text-sm font-black text-white block">{winner.name}</span>
              <span className="text-[11px] text-amber-300 font-bold uppercase">{winner.color} CHAMPION</span>
            </div>
          </div>

          {/* Prize Won Banner */}
          {prizePool > 0 && isHumanWinner && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-900/90 to-teal-900/90 border border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)] mb-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Prize Credited</span>
              </div>
              <span className="text-base font-black text-emerald-300">+${prizePool.toFixed(2)} USD</span>
            </motion.div>
          )}

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
