import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Crown, Sparkles, RotateCcw, Home, Coins, PartyPopper, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Player, PlayerColor } from '../../../types/game';
import { SoundManager } from '../../../audio/soundManager';
import { usePlatformMode } from '../../../hooks/usePlatformMode';

interface VictoryModalProps {
  isOpen: boolean;
  winnerColor: PlayerColor | null;
  players: Record<PlayerColor, Player>;
  prizePool: number;
  entryFee?: number;
  onRematch: () => void;
  onBackToLobby: () => void;
  gameType?: 'classic' | 'supreme' | 'snake';
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  winnerColor,
  players,
  prizePool,
  entryFee = 0,
  onRematch,
  onBackToLobby,
  gameType = 'supreme',
}) => {
  const { currencySymbol, platformCurrency } = usePlatformMode();

  // Multi-wave Celebratory Blast Party 🎉 Animation
  useEffect(() => {
    if (!isOpen) return;

    // Trigger victory sound
    SoundManager.play('pawn-finish');

    // Blast 1: Center mega burst with stars & geometric shapes
    confetti({
      particleCount: 160,
      spread: 120,
      startVelocity: 45,
      origin: { y: 0.5, x: 0.5 },
      colors: ['#FFD700', '#FFA500', '#FF4500', '#00E676', '#00B0FF', '#E040FB'],
      shapes: ['star', 'circle'],
      scalar: 1.2,
      zIndex: 9999,
    });

    // Blast 2: Left stadium cannon (after 250ms)
    const t1 = setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 80,
        origin: { x: 0.05, y: 0.65 },
        colors: ['#FFD700', '#FF1493', '#00FFFF', '#76FF03'],
        zIndex: 9999,
      });
    }, 250);

    // Blast 3: Right stadium cannon (after 450ms)
    const t2 = setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 80,
        origin: { x: 0.95, y: 0.65 },
        colors: ['#FFD700', '#FF1493', '#00FFFF', '#76FF03'],
        zIndex: 9999,
      });
    }, 450);

    // Blast 4: Raining gold & party sparkles (after 750ms)
    const t3 = setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 160,
        startVelocity: 35,
        origin: { y: 0.2, x: 0.5 },
        colors: ['#FFD700', '#F59E0B', '#FBBF24', '#FFFFFF'],
        shapes: ['star'],
        scalar: 1.3,
        zIndex: 9999,
      });
    }, 750);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  if (!isOpen || !winnerColor) return null;

  const winner = players[winnerColor];
  const isHumanWinner = winner?.isHuman ?? false;

  // Rank players by score descending
  const activePlayersList = (Object.keys(players) as PlayerColor[])
    .map((c) => players[c])
    .filter((p) => p && p.isActive)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  // Determine effective prize pool display
  const effectivePrize = prizePool > 0 ? prizePool : (entryFee > 0 ? entryFee * 1.8 : 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          className="relative w-full max-w-sm bg-gradient-to-b from-[#2a0b4d] via-[#16062a] to-[#0b0217] rounded-3xl border-2 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.6)] p-5 sm:p-6 text-center text-white flex flex-col items-center overflow-hidden max-h-[92vh] overflow-y-auto"
          id="victory-modal-content"
        >
          {/* Radiating Victory Rays */}
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_50%_40%,rgba(251,191,36,0.6)_0%,transparent_70%)] animate-pulse" />

          {/* Floating Party Emojis */}
          <div className="absolute top-3 left-4 text-2xl animate-bounce pointer-events-none">🎉</div>
          <div className="absolute top-3 right-4 text-2xl animate-bounce pointer-events-none" style={{ animationDelay: '200ms' }}>✨</div>

          {/* Crown & Trophy Icon */}
          <div className="relative mb-2">
            <motion.div
              animate={{ rotate: [-6, 6, -6], y: [-4, 2, -4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-yellow-200 border-4 border-white shadow-[0_0_35px_rgba(251,191,36,0.9)] flex items-center justify-center mx-auto"
            >
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-slate-950 fill-slate-950" />
            </motion.div>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300 fill-amber-300 drop-shadow-[0_0_10px_#f59e0b]" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black tracking-widest uppercase mb-1">
            <PartyPopper className="w-4 h-4 text-amber-400" />
            <span>
              {gameType === 'supreme'
                ? 'SUPREME MATCH FINISHED'
                : gameType === 'snake'
                ? 'SNAKE LUDO FINISHED'
                : 'MATCH FINISHED'}
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
            {isHumanWinner ? '🏆 CONGRATULATIONS! YOU WON!' : `🏆 ${winner?.name || 'Player'} WINS!`}
          </h2>

          {/* Winner Profile Banner */}
          {winner && (
            <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-amber-600/30 border border-amber-400/60 px-3.5 py-2.5 rounded-2xl my-2.5 w-full shadow-inner">
              <div className="flex items-center gap-2.5">
                <img
                  src={winner.avatarUrl}
                  alt={winner.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shadow-md"
                />
                <div className="text-left">
                  <span className="text-sm font-black text-white block">{winner.name}</span>
                  <span className="text-[10px] text-amber-300 font-extrabold uppercase flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    {winner.color} CHAMPION
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-300 block font-bold">Total Score</span>
                <span className="text-base font-black text-amber-300 font-mono">⭐ {winner.score ?? 0}</span>
              </div>
            </div>
          )}

          {/* Prominent Winning Amount Banner */}
          {effectivePrize > 0 ? (
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: [0.98, 1.02, 0.98] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className={`w-full py-2.5 px-3.5 rounded-2xl mb-3 border shadow-[0_0_25px_rgba(52,211,153,0.35)] flex flex-col gap-1 ${
                isHumanWinner
                  ? 'bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-emerald-950/90 border-emerald-400 text-emerald-300'
                  : 'bg-gradient-to-r from-amber-950/90 via-purple-950/90 to-slate-900/90 border-amber-400/60 text-amber-300'
              }`}
              id="victory-prize-banner"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span>{isHumanWinner ? '💰 Winning Cash Prize' : '🏆 Match Winning Amount'}</span>
                </div>
                <span className="text-base sm:text-lg font-black text-white font-mono drop-shadow">
                  {currencySymbol}{effectivePrize.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {platformCurrency}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-300 pt-0.5 border-t border-white/10">
                <span>{isHumanWinner ? 'Status: Credited to Account' : `Winner: ${winner?.name || 'Opponent'}`}</span>
                <span className="font-bold text-emerald-400">100% Real Cash Settlement</span>
              </div>
            </motion.div>
          ) : (
            <div className="w-full py-2 px-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 mb-3 text-xs font-bold text-amber-200">
              🎉 Practice Match Completed
            </div>
          )}

          {/* Full Match Scoreboard Ranking */}
          <div className="w-full bg-black/40 rounded-2xl p-2.5 border border-white/10 mb-4 space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                Final Scoreboard
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {activePlayersList.length} Players
              </span>
            </div>
            {activePlayersList.map((p, idx) => (
              <div
                key={`player-rank-${p.id || p.color || idx}`}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold ${
                  idx === 0
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40 shadow-sm'
                    : 'bg-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 text-left font-black text-slate-400">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="truncate max-w-[120px]">{p.name} {p.isHuman ? '(You)' : ''}</span>
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
              className="w-full py-3 rounded-xl font-black text-sm bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 text-slate-950 shadow-[0_4px_15px_rgba(251,191,36,0.5)] border border-yellow-200 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              id="victory-rematch-btn"
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
              id="victory-lobby-btn"
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

