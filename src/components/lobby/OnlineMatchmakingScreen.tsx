import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Zap, X, Trophy, Wifi, Radio, Swords } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import { PlayerColor } from '../../types/game';

export interface MatchedOpponent {
  id: string;
  name: string;
  avatarUrl: string;
  color: PlayerColor;
  country: string;
  rating: number;
  ping: number;
  isReady: boolean;
}

interface OnlineMatchmakingScreenProps {
  playerCount: 2 | 3 | 4;
  entryFee: number;
  prizePool: number;
  userName: string;
  userAvatar: string;
  onCancel: () => void;
  onMatchComplete: (matchedOpponents: MatchedOpponent[]) => void;
}

// Rich realistic active online player roster pool
const ONLINE_PLAYERS_POOL: Omit<MatchedOpponent, 'color' | 'isReady'>[] = [
  {
    id: 'p_alex',
    name: 'Alex_Viper',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    country: 'US',
    rating: 1840,
    ping: 28,
  },
  {
    id: 'p_elena',
    name: 'Elena_R',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    country: 'GB',
    rating: 1910,
    ping: 34,
  },
  {
    id: 'p_rashid',
    name: 'Rashid_DXB',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    country: 'AE',
    rating: 2050,
    ping: 18,
  },
  {
    id: 'p_maya',
    name: 'Maya_LudoQueen',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    country: 'IN',
    rating: 1980,
    ping: 42,
  },
  {
    id: 'p_david',
    name: 'David_King99',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    country: 'CA',
    rating: 1790,
    ping: 30,
  },
  {
    id: 'p_sakura',
    name: 'Sakura_Tokyo',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    country: 'JP',
    rating: 2120,
    ping: 55,
  },
];

const COLOR_MAP: Record<number, PlayerColor[]> = {
  2: ['blue', 'green'],
  3: ['blue', 'red', 'green'],
  4: ['blue', 'red', 'green', 'yellow'],
};

export const OnlineMatchmakingScreen: React.FC<OnlineMatchmakingScreenProps> = ({
  playerCount,
  entryFee,
  prizePool,
  userName,
  userAvatar,
  onCancel,
  onMatchComplete,
}) => {
  const [matchedPlayers, setMatchedPlayers] = useState<MatchedOpponent[]>([]);
  const [statusMessage, setStatusMessage] = useState('SEARCHING MATCHING QUEUE...');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [searchTime, setSearchTime] = useState(0);

  // Search Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSearchTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Radar audio ping periodically during search
  useEffect(() => {
    if (countdown !== null) return;
    const interval = setInterval(() => {
      SoundManager.play('radar-ping');
    }, 1800);
    return () => clearInterval(interval);
  }, [countdown]);

  // Matchmaking Sequence
  useEffect(() => {
    const colors = COLOR_MAP[playerCount];
    const opponentsNeeded = playerCount - 1;

    // Pick random unique opponents from pool
    const shuffledPool = [...ONLINE_PLAYERS_POOL].sort(() => Math.random() - 0.5);
    const chosenOpponents = shuffledPool.slice(0, opponentsNeeded);

    const timeouts: NodeJS.Timeout[] = [];

    // Progressive Matchmaking Lock-in
    chosenOpponents.forEach((opp, idx) => {
      const delay = 1400 + idx * 1200; // sequential lock-in
      const t = setTimeout(() => {
        SoundManager.play('match-found');
        setMatchedPlayers((prev) => [
          ...prev,
          {
            ...opp,
            color: colors[idx + 1],
            isReady: true,
          },
        ]);
      }, delay);
      timeouts.push(t);
    });

    // When all opponents are locked in, start countdown
    const allFoundDelay = 1400 + (opponentsNeeded - 1) * 1200 + 700;
    const tAll = setTimeout(() => {
      setStatusMessage('ALL PLAYERS LOCKED IN! GET READY!');
      SoundManager.play('battle-horn');
      setCountdown(3);
    }, allFoundDelay);
    timeouts.push(tAll);

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [playerCount]);

  // Countdown timer logic
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      SoundManager.play('countdown-tick');
      const t = setTimeout(() => {
        setCountdown((c) => (c !== null ? c - 1 : null));
      }, 1000);
      return () => clearTimeout(t);
    } else if (countdown === 0) {
      SoundManager.play('battle-horn');
      const t = setTimeout(() => {
        onMatchComplete(matchedPlayers);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [countdown, matchedPlayers, onMatchComplete]);

  const opponentSlots = Array.from({ length: playerCount - 1 });

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-[#120524] via-[#090214] to-[#04010a] text-white select-none">
      {/* Top Header */}
      <div className="w-full max-w-lg flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 bg-violet-950/70 border border-violet-500/40 backdrop-blur-md px-3.5 py-1.5 rounded-full">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-black text-cyan-200">
            {playerCount === 2 ? '1v1 DUEL MATCH' : playerCount === 3 ? '3-WAY ARENA' : '4P ROYAL BATTLE'}
          </span>
        </div>

        {countdown === null ? (
          <button
            onClick={() => {
              SoundManager.play('click');
              onCancel();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-xs font-bold text-red-200 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-400/50 text-xs font-black text-emerald-300 animate-pulse">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>TABLE READY</span>
          </div>
        )}
      </div>

      {/* Center Radar Scanner & Match Arena */}
      <div className="relative w-full max-w-md my-auto flex flex-col items-center justify-center">
        {/* Holographic Radar Scanner */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          {/* Radar Circles */}
          <div className="absolute inset-0 rounded-full border border-violet-500/20" />
          <div className="absolute inset-8 rounded-full border border-violet-500/30" />
          <div className="absolute inset-16 rounded-full border border-cyan-500/40" />
          <div className="absolute inset-24 rounded-full border border-cyan-400/50 bg-cyan-950/20" />

          {/* Rotating Scanner Line */}
          {countdown === null && (
            <div
              className="absolute inset-0 rounded-full animate-spin pointer-events-none"
              style={{ animationDuration: '3s' }}
            >
              <div className="w-1/2 h-1/2 bg-gradient-to-br from-cyan-400/30 to-transparent rounded-tl-full origin-bottom-right" />
            </div>
          )}

          {/* Center Status / Countdown Icon */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            {countdown !== null ? (
              <motion.div
                key={countdown}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <span className="text-6xl font-black text-amber-300 drop-shadow-[0_0_20px_#f59e0b]">
                  {countdown === 0 ? 'START!' : countdown}
                </span>
                <span className="text-xs font-bold text-amber-200 uppercase tracking-widest mt-1">
                  Launching Table
                </span>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center">
                <Swords className="w-10 h-10 text-cyan-300 animate-bounce drop-shadow-[0_0_10px_#38bdf8]" />
                <span className="text-xs font-black text-violet-200 mt-2">
                  00:{searchTime < 10 ? `0${searchTime}` : searchTime}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Status Text */}
        <motion.p
          key={statusMessage}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs sm:text-sm font-black text-cyan-300 tracking-wider uppercase text-center mt-4 drop-shadow"
        >
          {statusMessage}
        </motion.p>
      </div>

      {/* Bottom Player Matching Slots */}
      <div className="w-full max-w-lg space-y-2.5 pb-4">
        {/* Prize Pool Info */}
        <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-gradient-to-r from-violet-950/80 to-purple-950/80 border border-violet-500/30 text-xs">
          <div className="flex items-center gap-1.5 text-violet-200">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Prize Pool:</span>
            <strong className="text-amber-300 font-black">
              {prizePool > 0 ? `$${prizePool.toFixed(2)}` : 'Practice Free'}
            </strong>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-300">
            <Wifi className="w-3 h-3 text-green-400" />
            <span>Ping: 24ms (Optimal)</span>
          </div>
        </div>

        {/* Matched Slots Grid */}
        <div className={`grid gap-2 ${playerCount === 2 ? 'grid-cols-2' : playerCount === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {/* SLOT 1: YOU (Player 1 - Blue) */}
          <div className="p-2.5 rounded-2xl bg-gradient-to-b from-blue-950/80 to-cyan-950/80 border-2 border-cyan-400/80 shadow-[0_0_15px_rgba(56,189,248,0.3)] flex flex-col items-center text-center">
            <div className="relative">
              <img
                src={userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={userName}
                className="w-11 h-11 rounded-full object-cover border-2 border-cyan-400"
              />
              <span className="absolute -bottom-1 -right-1 text-[10px] px-1 bg-blue-600 rounded-full font-bold">
                P1
              </span>
            </div>
            <span className="text-xs font-black text-white mt-1 truncate max-w-full">{userName} (You)</span>
            <span className="text-[10px] text-cyan-300 font-bold flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300" /> READY
            </span>
          </div>

          {/* SLOTS 2..N: OPPONENTS */}
          {opponentSlots.map((_, idx) => {
            const opp = matchedPlayers[idx];
            const color = COLOR_MAP[playerCount][idx + 1];

            return (
              <AnimatePresence key={idx} mode="wait">
                {opp ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className={`p-2.5 rounded-2xl border-2 flex flex-col items-center text-center shadow-lg ${
                      color === 'red'
                        ? 'bg-rose-950/80 border-rose-500 shadow-rose-900/40'
                        : color === 'green'
                        ? 'bg-emerald-950/80 border-emerald-500 shadow-emerald-900/40'
                        : 'bg-amber-950/80 border-amber-500 shadow-amber-900/40'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={opp.avatarUrl}
                        alt={opp.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white/80"
                      />
                      <span className="absolute -bottom-1 -right-1 text-[10px] px-1 bg-slate-800 rounded-full font-bold border border-white/40">
                        {opp.country}
                      </span>
                    </div>
                    <span className="text-xs font-black text-white mt-1 truncate max-w-full">{opp.name}</span>
                    <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" /> READY
                    </span>
                  </motion.div>
                ) : (
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center text-center min-h-[105px]">
                    <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                      <Radio className="w-5 h-5 text-violet-300" />
                    </div>
                    <span className="text-[11px] font-bold text-violet-300/80 mt-1">Player {idx + 2}</span>
                    <span className="text-[9px] text-cyan-300/70 animate-pulse">Matching...</span>
                  </div>
                )}
              </AnimatePresence>
            );
          })}
        </div>
      </div>
    </div>
  );
};
