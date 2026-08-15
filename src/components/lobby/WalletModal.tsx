import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Plus, ArrowUpRight, ShieldCheck, Sparkles, CheckCircle } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import confetti from 'canvas-confetti';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onAddFunds: (amount: number) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  balance,
  onAddFunds,
}) => {
  const [depositAmount, setDepositAmount] = useState<number>(5);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDeposit = (amount: number) => {
    SoundManager.play('pawn-finish');
    onAddFunds(amount);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    setSuccessMsg(`Successfully added $${amount.toFixed(2)} to your wallet!`);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md rounded-3xl bg-[#0f1233] border border-purple-500/30 p-5 shadow-2xl text-white select-none overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
                <CreditCard className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Wallet & Balance</h3>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> 100% Safe & Secure
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                SoundManager.play('click');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Success Notification */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Total Balance Card with Dollar Symbol */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 border border-purple-400/40 shadow-inner flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-purple-200 uppercase tracking-wide">
                Total Usable Balance
              </span>
              <div className="text-3xl font-black text-white tracking-tight mt-0.5 flex items-center">
                <span className="text-amber-300 font-extrabold mr-0.5">$</span>
                {balance.toFixed(2)}
              </div>
            </div>

            <div className="flex flex-col text-right text-xs">
              <span className="text-slate-400">Bonus Cash</span>
              <span className="text-emerald-400 font-bold">$1.50</span>
            </div>
          </div>

          {/* Quick Add Cash Buttons */}
          <div className="mt-4">
            <label className="text-xs font-bold text-slate-300 mb-2 block">
              Quick Add Cash
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 5, 10].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    SoundManager.play('click');
                    setDepositAmount(amt);
                  }}
                  className={`py-2 px-3 rounded-xl border text-sm font-extrabold transition-all flex flex-col items-center justify-center ${
                    depositAmount === amt
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md scale-105'
                      : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>+${amt}</span>
                  <span className="text-[9px] font-medium opacity-80">
                    {amt === 10 ? 'Best Value' : 'Instant'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Deposit Button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleDeposit(depositAmount)}
            className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-base shadow-[0_4px_16px_rgba(251,191,36,0.4)] flex items-center justify-center gap-2 hover:brightness-105 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add ${depositAmount.toFixed(2)} Cash</span>
          </motion.button>

          {/* Bottom Security Info */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Instant zero-fee withdrawal
            </span>
            <span className="text-purple-300 font-bold">256-Bit SSL Encrypted</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
