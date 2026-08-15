import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Gift, Check, PartyPopper } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import confetti from 'canvas-confetti';

interface MysteryBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimReward: (amount: number) => void;
}

export const MysteryBoxModal: React.FC<MysteryBoxModalProps> = ({
  isOpen,
  onClose,
  onClaimReward,
}) => {
  const [isOpened, setIsOpened] = useState(false);
  const [rewardAmount] = useState(1.00);

  if (!isOpen) return null;

  const handleOpenChest = () => {
    SoundManager.play('pawn-finish');
    setIsOpened(true);
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.5 },
    });
    onClaimReward(rewardAmount);
  };

  const handleDone = () => {
    SoundManager.play('click');
    setIsOpened(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#1b1547] via-[#120f38] to-[#0a0822] border border-amber-400/40 p-6 shadow-[0_15px_40px_rgba(251,191,36,0.3)] text-center text-white overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={handleDone}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {!isOpened ? (
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-300/40 px-3 py-1 rounded-full text-amber-300 text-xs font-black uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" /> Daily Free Gift
              </div>

              {/* 3D Animated Gift Chest */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotateZ: [-3, 3, -3],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative my-4 w-32 h-32 flex items-center justify-center"
              >
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-amber-600 via-pink-500 to-purple-600 border-4 border-yellow-300 shadow-[0_10px_30px_rgba(234,179,8,0.5)] flex items-center justify-center">
                  <Gift className="w-14 h-14 text-white drop-shadow-md" />
                </div>
                {/* Glowing Aura Ring */}
                <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl -z-10 animate-ping" />
              </motion.div>

              <h3 className="text-xl font-black text-white mt-2">
                Unlock Daily Mystery Box!
              </h3>
              <p className="text-xs text-slate-300 mt-1 mb-5">
                Tap below to open your free chest and claim surprise Dollar bonus rewards.
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenChest}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-base shadow-[0_6px_20px_rgba(251,191,36,0.5)] hover:brightness-105 transition-all"
              >
                Open Mystery Box
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2">
              <PartyPopper className="w-12 h-12 text-amber-300 animate-bounce mb-2" />
              <h3 className="text-2xl font-black text-white">Congratulations!</h3>
              <p className="text-xs text-purple-200 mt-1">You unlocked free bonus cash</p>

              {/* Reward Amount Display */}
              <div className="my-5 py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 border-2 border-emerald-200 shadow-xl">
                <span className="text-xs font-black uppercase text-emerald-100 block">
                  Reward Added
                </span>
                <span className="text-4xl font-black text-white tracking-tight">
                  +${rewardAmount.toFixed(2)}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDone}
                className="w-full py-3 rounded-2xl bg-white text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Claim & Continue</span>
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
