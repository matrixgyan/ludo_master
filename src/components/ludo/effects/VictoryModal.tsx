import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Crown, Sparkles, RotateCcw, Home, Coins, CheckCircle2, Copy, Check, Flame, Award, ShieldCheck, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Player, PlayerColor } from '../../../types/game';
import { SoundManager } from '../../../audio/soundManager';
import { usePlatformMode } from '../../../hooks/usePlatformMode';

interface VictoryModalProps {
  isOpen: boolean;
  winnerColor: PlayerColor | null;
  players: Record<PlayerColor, Player>;
  prizePool: number;
  userId?: string;
  onRematch: () => void;
  onBackToLobby: () => void;
  gameType?: 'classic' | 'supreme' | 'snake';
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  winnerColor,
  players,
  prizePool,
  userId,
  onRematch,
  onBackToLobby,
  gameType = 'supreme',
}) => {
  const { currencySymbol, platformCurrency } = usePlatformMode();
  const [copiedId, setCopiedId] = useState(false);

  // Trigger high-production victory blast animation and sounds
  useEffect(() => {
    if (!isOpen || !winnerColor) return;

    // 1. Play Royal Trumpet Victory Fanfare
    try {
      SoundManager.play('match-won');
      setTimeout(() => SoundManager.play('coin-reward'), 400);
    } catch {}

    // 2. Triple Sequential Confetti Cannon Blasts
    const fireBlast = (originX: number, particleCount: number, spread: number) => {
      confetti({
        particleCount,
        spread,
        origin: { x: originX, y: 0.55 },
        colors: ['#FFD700', '#FFA500', '#10B981', '#3B82F6', '#EC4899', '#FFFFFF'],
        ticks: 240,
        gravity: 0.9,
        scalar: 1.15,
      });
    };

    // Blast 1: Center Golden Burst
    fireBlast(0.5, 120, 100);

    // Blast 2: Left Side Cannon
    const t1 = setTimeout(() => {
      fireBlast(0.2, 90, 80);
    }, 220);

    // Blast 3: Right Side Cannon
    const t2 = setTimeout(() => {
      fireBlast(0.8, 90, 80);
    }, 450);

    // Blast 4: Golden Glitter Rain
    const t3 = setTimeout(() => {
      confetti({
        particleCount: 70,
        angle: 90,
        spread: 120,
        origin: { x: 0.5, y: 0.1 },
        colors: ['#FFE066', '#FFD700', '#F59E0B'],
        gravity: 0.7,
        scalar: 1.2,
      });
    }, 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, winnerColor]);

  if (!isOpen || !winnerColor) return null;

  const winner = players[winnerColor];
  const isHumanWinner = winner?.isHuman ?? false;

  // Resolved 10-digit ID display (clean and formatted)
  const displayUserId = userId && userId !== 'anonymous' && userId !== 'user_guest_default'
    ? userId
    : (winner?.id && winner.id.length >= 8 ? winner.id : '7849102834');

  // Rank players by score descending
  const activePlayersList = (Object.keys(players) as PlayerColor[])
    .map((c) => players[c])
    .filter((p) => p && p.isActive)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    SoundManager.play('click');
    navigator.clipboard.writeText(displayUserId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.75, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="relative w-full max-w-md bg-gradient-to-b from-[#1f093d] via-[#120424] to-[#080112] rounded-3xl border-2 border-amber-400/90 shadow-[0_0_80px_rgba(245,158,11,0.6)] p-5 sm:p-7 text-center text-white flex flex-col items-center overflow-hidden my-auto max-h-[94vh]"
        >
          {/* Animated Sunburst Victory Glow */}
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.7)_0%,rgba(147,51,234,0.3)_45%,transparent_75%)] animate-pulse" />
          
          {/* Shimmer Light Rays */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none animate-spin" style={{ animationDuration: '18s' }} />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Floating Blast Sparkle Badges */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: 'spring' }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-amber-500/30 border border-amber-400/60 px-4 py-1 rounded-full text-amber-300 text-xs font-black tracking-widest uppercase mb-3 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            <span>{gameType.toUpperCase()} VICTORY CELEBRATION</span>
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
          </motion.div>

          {/* Grand Crown & 3D Glowing Trophy */}
          <div className="relative mb-3 mt-1">
            <motion.div
              animate={{ 
                rotate: [-4, 4, -4], 
                y: [-6, 2, -6],
                scale: [1, 1.05, 1] 
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-4 border-white shadow-[0_0_40px_rgba(251,191,36,0.9)] flex items-center justify-center mx-auto"
            >
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-slate-950 fill-slate-950 drop-shadow-md" />
            </motion.div>

            {/* Glowing Crown on Top */}
            <motion.div
              animate={{ y: [-4, 3, -4], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 left-1/2 -translate-x-1/2"
            >
              <Crown className="w-8 h-8 sm:w-9 sm:h-9 text-amber-300 fill-amber-300 drop-shadow-[0_0_12px_#f59e0b]" />
            </motion.div>

            {/* Side Stars */}
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-amber-300 animate-ping opacity-75">
              ✨
            </div>
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-amber-300 animate-ping opacity-75" style={{ animationDelay: '0.4s' }}>
              ⭐
            </div>
          </div>

          {/* Animated Congratulations Blast Heading */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="mb-3"
          >
            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 tracking-tight drop-shadow-[0_2px_12px_rgba(251,191,36,0.5)]">
              {isHumanWinner ? '🎉 CONGRATULATIONS!' : '🏆 MATCH COMPLETED!'}
            </h1>
            <p className="text-xs sm:text-sm font-extrabold text-amber-200/90 tracking-wide mt-0.5">
              {isHumanWinner ? 'YOU ARE THE CHAMPION!' : `${winner?.name || 'Player'} WON THE MATCH!`}
            </p>
          </motion.div>

          {/* PROMINENT PLAYER USER ID BADGE */}
          <div className="w-full bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400/70 rounded-2xl p-3 mb-3 shadow-[0_0_20px_rgba(251,191,36,0.25)] flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-1">
              <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-black tracking-wider uppercase">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>PLAYER USER ID</span>
              </div>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-400/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> VERIFIED
              </span>
            </div>

            <div className="flex items-center justify-between w-full bg-black/60 rounded-xl px-3 py-2 border border-white/15">
              <div className="flex items-center gap-2.5 text-left">
                {winner?.avatarUrl && (
                  <img
                    src={winner.avatarUrl}
                    alt={winner.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-amber-400"
                  />
                )}
                <div>
                  <span className="text-xs font-black text-white block leading-tight">{winner?.name || 'Player 1'}</span>
                  <span className="text-sm sm:text-base font-mono font-black text-amber-300 tracking-wider">
                    {displayUserId}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCopyId}
                className="px-2.5 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                title="Copy Player User ID"
              >
                {copiedId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* PROMINENT WINNING AMOUNT PRIZE BANNER */}
          {prizePool > 0 && isHumanWinner && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 15 }}
              className="w-full bg-gradient-to-r from-emerald-950 via-[#073824] to-emerald-950 border-2 border-emerald-400 rounded-2xl p-3.5 mb-3 shadow-[0_0_30px_rgba(52,211,153,0.5)] flex flex-col items-center relative overflow-hidden"
            >
              {/* Glowing animated background aura */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.25)_0%,transparent_70%)] animate-pulse pointer-events-none" />

              <div className="flex items-center justify-between w-full relative z-10">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.4)]">
                    <Coins className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase text-emerald-300 tracking-wider block">
                      TOTAL WINNING PRIZE
                    </span>
                    <span className="text-[10px] text-slate-300 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" /> Credited Directly to Wallet
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-green-300 to-emerald-100 font-mono drop-shadow-[0_2px_10px_rgba(52,211,153,0.6)]">
                    +{currencySymbol}{prizePool.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-300 font-bold block uppercase">
                    {platformCurrency}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Full Match Scoreboard Breakdown */}
          <div className="w-full bg-black/50 rounded-2xl p-3 border border-white/15 mb-4 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> FINAL MATCH SCOREBOARD
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                {activePlayersList.length} PLAYERS
              </span>
            </div>

            <div className="space-y-1.5">
              {activePlayersList.map((p, idx) => (
                <div
                  key={`player-rank-${p.id || p.color || idx}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    idx === 0
                      ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/15 text-amber-100 border border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                      : 'bg-white/5 text-slate-300 border border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <div className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: p.color }} />
                    <div className="text-left">
                      <span className="block font-black text-white leading-tight">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium capitalize">
                        {p.color} Player {p.isHuman ? '(You)' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-xs sm:text-sm font-black text-amber-300">
                      ⭐ {p.score ?? 0}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-normal">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-2.5">
            <button
              onClick={() => {
                SoundManager.play('click');
                onRematch();
              }}
              className="w-full py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-[0_4px_25px_rgba(251,191,36,0.5)] border-2 border-yellow-200 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>PLAY NEXT MATCH</span>
            </button>

            <button
              onClick={() => {
                SoundManager.play('click');
                onBackToLobby();
              }}
              className="w-full py-3 rounded-2xl font-bold text-xs bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
            >
              <Home className="w-4 h-4" />
              <span>RETURN TO GAME LOBBY</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

