import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Swords, Zap, Award, Star } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, balance }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-sm rounded-3xl bg-[#0f1133] border border-purple-500/30 p-5 shadow-2xl text-white"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-lg font-black text-white">Player Profile</h3>
            <button
              onClick={() => {
                SoundManager.play('click');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Avatar & Username */}
          <div className="flex flex-col items-center mt-3">
            <div className="relative w-20 h-20 rounded-full border-4 border-amber-400 p-1 shadow-lg bg-indigo-900">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80"
                alt="Avatar"
                className="w-full h-full object-cover rounded-full"
              />
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-md">
                LVL 18
              </div>
            </div>

            <h4 className="text-xl font-black text-white mt-2">Player 1</h4>
            <span className="text-xs text-purple-300 font-bold">Ludo Master & Snake Explorer</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <span className="text-xs text-slate-400">Total Winnings</span>
              <span className="block text-lg font-black text-white">${balance.toFixed(2)}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <Swords className="w-4 h-4 text-rose-400 mx-auto mb-1" />
              <span className="text-xs text-slate-400">Win Rate</span>
              <span className="block text-lg font-black text-emerald-400">74.5%</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <Zap className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
              <span className="text-xs text-slate-400">Matches Played</span>
              <span className="block text-lg font-black text-white">128</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <Award className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <span className="text-xs text-slate-400">National Rank</span>
              <span className="block text-lg font-black text-amber-300">#59</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
