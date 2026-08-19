import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Crown, Zap, Shield, Flame } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';

interface ZupeePlusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZupeePlusModal: React.FC<ZupeePlusModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#21094e] via-[#150a36] to-[#0a0520] border border-amber-400/40 p-5 shadow-2xl text-white"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="text-lg font-black text-white">Zupee Plus Club</h3>
                <span className="text-[11px] text-amber-300">VIP Exclusive Perks</span>
              </div>
            </div>

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

          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-400/40 text-center">
            <Sparkles className="w-8 h-8 text-amber-300 mx-auto mb-1" />
            <h4 className="text-base font-black text-white">VIP Club Pass Active</h4>
            <p className="text-xs text-slate-300 mt-1">
              Enjoy 0% withdrawal gateway fees, VIP tournament access, and premium leaderboard badges!
            </p>
          </div>

          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Instant High-Speed Matchmaking</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>High-Roller Arena VIP Access</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Priority Customer & Wallet Support</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
