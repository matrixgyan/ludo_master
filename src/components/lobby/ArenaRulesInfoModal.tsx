import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Trophy,
  Zap,
  ShieldCheck,
  Coins,
  Clock,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';

interface ArenaRulesInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameType?: 'classic' | 'supreme' | 'snake';
}

export const ArenaRulesInfoModal: React.FC<ArenaRulesInfoModalProps> = ({
  isOpen,
  onClose,
  gameType = 'classic',
}) => {
  if (!isOpen) return null;

  const isClassic = gameType === 'classic';
  const isSnake = gameType === 'snake';

  const modalTitle = isSnake
    ? 'Snake Ludo (Tile 100 Race)'
    : isClassic
    ? 'Online Arena (Classic)'
    : 'Ludo Supreme (3-Min)';

  const modalSubtitle = isSnake
    ? 'First to Reach Tile 100 Rules'
    : isClassic
    ? 'Full 4-Pawns Home Game Rules'
    : '3-Minute Speed Score Rules';

  const ruleBadge = isSnake
    ? 'Reach 100 Win'
    : isClassic
    ? 'Classic Rule'
    : 'Score Based';

  const ruleTitle = isSnake
    ? 'How to Win (First to 100)'
    : isClassic
    ? 'How to Win (Full Match)'
    : 'How to Win (3-Min Speed)';

  return (
    <AnimatePresence>
      <motion.div
        key="arena-info-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto"
      >
        <motion.div
          key="arena-info-modal-card"
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#2b1407] via-[#1f0d04] to-[#120702] rounded-3xl p-4 sm:p-5 border-2 border-[#dfb35e] shadow-[0_10px_35px_rgba(0,0,0,0.85)] text-amber-100 space-y-3.5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] border border-cyan-300 shadow flex items-center justify-center text-white font-serif font-black text-sm">
                i
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-amber-300 tracking-wide">
                  {modalTitle}
                </h3>
                <p className="text-[10px] text-amber-200/70 font-medium">
                  {modalSubtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                SoundManager.play('click');
                onClose();
              }}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-amber-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Short Information Cards */}
          <div className="space-y-2 text-xs">
            {/* 1. GAMEPLAY & WINNING CONDITION */}
            <div className="bg-black/45 p-3 rounded-2xl border border-amber-500/25 space-y-1.5">
              <div className="flex items-center justify-between text-amber-300 font-black text-xs">
                <span className="flex items-center gap-1.5">
                  {isSnake ? (
                    <Trophy className="w-4 h-4 text-emerald-400" />
                  ) : isClassic ? (
                    <Trophy className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400" />
                  )}
                  {ruleTitle}
                </span>
                <span className="bg-amber-500/20 text-amber-300 text-[9px] px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                  {ruleBadge}
                </span>
              </div>

              {isSnake ? (
                <div className="space-y-1 text-[11px] text-amber-100/90 leading-relaxed">
                  <p>
                    • <strong>First to 100:</strong> The player who reaches <strong>Tile 100 first</strong> wins the match!
                  </p>
                  <p>
                    • <strong>Ladders & Snakes:</strong> Climb ladders to jump ahead fast; avoid snake heads that slide you down. Rolling a <strong>6</strong> gives an extra turn.
                  </p>
                </div>
              ) : isClassic ? (
                <div className="space-y-1 text-[11px] text-amber-100/90 leading-relaxed">
                  <p>
                    • <strong>Full Game:</strong> The first player to bring all <strong>4 pawns safely into Home</strong> wins the match!
                  </p>
                  <p>
                    • <strong>Captures & Safe Zones:</strong> Capture opponent pawns to send them back to base & earn bonus turns. Star tiles protect pawns.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 text-[11px] text-amber-100/90 leading-relaxed">
                  <p>
                    • <strong>3-Minute Timer:</strong> Player with the <strong>highest score</strong> before the 3-minute timer ends wins the match!
                  </p>
                  <p>
                    • <strong>Scoring:</strong> <strong>+1 pt</strong> per step forward, <strong>+56 bonus pts</strong> when a pawn enters Home. Extra roll on captures & 6s.
                  </p>
                </div>
              )}
            </div>

            {/* 2. ENTRY & WINNER PAYOUT */}
            <div className="bg-black/45 p-3 rounded-2xl border border-amber-500/25 space-y-1.5">
              <div className="flex items-center justify-between text-amber-300 font-black text-xs">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span>Entry & Payout (USDT)</span>
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  Instant Credit
                </span>
              </div>

              <div className="space-y-1 text-[11px] text-amber-100/90 leading-relaxed">
                <p>
                  • <strong>90% Winner Payout:</strong> Winner takes <strong>90% of the total prize pool</strong> (10% platform fee).
                </p>
                <p>
                  • <strong>Instant Settlement:</strong> Winnings are credited automatically to your USDT wallet balance upon victory.
                </p>
              </div>
            </div>

            {/* 3. 100% INSTANT REFUND */}
            <div className="bg-black/45 p-2.5 rounded-2xl border border-amber-500/25 flex items-start gap-2.5">
              <RotateCcw className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-100/90 leading-snug">
                <strong className="text-cyan-300 font-bold block mb-0.5">100% Safe Escrow Refund:</strong>
                If a match is cancelled or you exit the lobby before it starts, your entry fee is refunded 100% instantly.
              </div>
            </div>
          </div>

          {/* Footer Action Button */}
          <button
            onClick={() => {
              SoundManager.play('click');
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ffd166] via-[#f59e0b] to-[#b45309] text-slate-950 font-black text-xs uppercase tracking-wider shadow hover:brightness-110 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Got It, Let's Play!</span>
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
