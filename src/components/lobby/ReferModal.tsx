import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Copy, Check, Gift, Sparkles, DollarSign } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import confetti from 'canvas-confetti';

interface ReferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferModal: React.FC<ReferModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const referralCode = 'LUDO777';

  if (!isOpen) return null;

  const handleCopy = () => {
    SoundManager.play('click');
    navigator.clipboard?.writeText(referralCode);
    setCopied(true);
    confetti({ particleCount: 40, spread: 60 });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-md rounded-3xl bg-[#110e2e] border border-amber-400/40 p-5 shadow-2xl text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Refer & Earn</h3>
                <span className="text-[11px] text-amber-300">Get $5 Free per Friend</span>
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

          {/* Banner */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-center shadow-lg border border-yellow-300">
            <Gift className="w-8 h-8 text-white mx-auto mb-1" />
            <h4 className="text-xl font-black text-white">Earn Unlimited Cash!</h4>
            <p className="text-xs text-yellow-100 mt-1">
              Invite your friends to play Ludo Supreme & Snake Ludo. You both get $5.00 cash bonus!
            </p>
          </div>

          {/* Referral Code Box */}
          <div className="mt-4">
            <label className="text-xs font-bold text-slate-400 block mb-1.5">
              Your Exclusive Referral Code
            </label>
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/5 border border-white/20">
              <span className="flex-1 text-center font-mono text-lg font-black text-amber-300 tracking-wider">
                {referralCode}
              </span>
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5">
              <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px]">
                1
              </div>
              <span className="text-slate-300">Share your link or code with your friends</span>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5">
              <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px]">
                2
              </div>
              <span className="text-slate-300">They join & play their first Ludo match</span>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5">
              <div className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-[10px]">
                3
              </div>
              <span className="text-emerald-300 font-bold">You instantly receive $5.00 cash!</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
