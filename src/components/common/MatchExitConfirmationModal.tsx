import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ArrowLeft, Swords } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';

interface MatchExitConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const MatchExitConfirmationModal: React.FC<MatchExitConfirmationModalProps> = ({
  isOpen,
  title = 'Leave Active Match?',
  message = 'Leaving now will forfeit your active match and any entered stakes. Are you sure you want to return to the lobby?',
  confirmText = 'Leave Match',
  cancelText = 'Stay in Game',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            SoundManager.play('click');
            onCancel();
          }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#1a0b36] via-[#120524] to-[#0a0217] border-2 border-amber-400/60 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-slate-100 flex flex-col items-center select-none"
        >
          {/* Header Warning Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-amber-400/50 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <AlertTriangle className="w-7 h-7 text-amber-300 stroke-[2.5]" />
          </div>

          <h3 className="text-lg font-black text-amber-200 tracking-wide text-center uppercase drop-shadow-md">
            {title}
          </h3>

          <p className="text-xs text-slate-300/90 text-center leading-relaxed mt-2 mb-5 px-2">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="w-full grid grid-cols-2 gap-2.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                SoundManager.play('click');
                onCancel();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Swords className="w-3.5 h-3.5 text-amber-300" />
              <span>{cancelText}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                SoundManager.play('click');
                onConfirm();
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 border border-rose-400/60 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(225,29,72,0.4)] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{confirmText}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
