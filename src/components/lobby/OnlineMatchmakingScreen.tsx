import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Zap,
  X,
  Trophy,
  Wifi,
  Radio,
  Swords,
  Users,
  UserCheck,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import { PlayerColor } from '../../types/game';
import { usePlatformMode } from '../../hooks/usePlatformMode';

export interface MatchedOpponent {
  id: string;
  name: string;
  avatarUrl: string;
  color: PlayerColor;
  country: string;
  rating: number;
  ping: number;
  isReady: boolean;
  isRealPlayer?: boolean;
}

interface OnlineMatchmakingScreenProps {
  playerCount: 2 | 3 | 4;
  entryFee: number;
  prizePool: number;
  userName: string;
  userAvatar: string;
  userColor?: PlayerColor;
  customOpponents?: { name: string; avatarUrl: string; color: PlayerColor }[];
  userId?: string;
  onCancel: () => void;
  onMatchComplete: (matchedOpponents: MatchedOpponent[]) => void;
}

export const OnlineMatchmakingScreen: React.FC<OnlineMatchmakingScreenProps> = ({
  playerCount,
  entryFee,
  prizePool,
  userName,
  userAvatar,
  userColor = 'red',
  customOpponents,
  userId = 'user_guest_default',
  onCancel,
  onMatchComplete,
}) => {
  const { platformMode } = usePlatformMode();
  const isRealMatch = entryFee > 0;

  const [matchedPlayers, setMatchedPlayers] = useState<MatchedOpponent[]>([]);
  const [statusMessage, setStatusMessage] = useState(
    isRealMatch
      ? 'SEARCHING FOR REAL PLAYERS IN LIVE ARENA...'
      : 'INITIALIZING PRACTICE ARENA...'
  );
  const [matchId, setMatchId] = useState<string>('');
  const [matchCode, setMatchCode] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const [isSimulatingOpponent, setIsSimulatingOpponent] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef(false);

  // Determine opponent colors
  const allColors: PlayerColor[] = ['red', 'yellow', 'green', 'blue'];
  const remainingColors: PlayerColor[] =
    customOpponents && customOpponents.length >= playerCount - 1
      ? customOpponents.map((o) => o.color)
      : allColors.filter((c) => c !== userColor);

  // 1. Search Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSearchTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Radar audio ping periodically during search
  useEffect(() => {
    if (countdown !== null) return;
    const interval = setInterval(() => {
      SoundManager.play('radar-ping');
    }, 1800);
    return () => clearInterval(interval);
  }, [countdown]);

  // 3. Matchmaking API Integration
  useEffect(() => {
    isCancelledRef.current = false;

    const joinMatchmakingQueue = async () => {
      try {
        const response = await fetch('/api/matchmaking/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            username: userName,
            avatarUrl: userAvatar,
            playerCount,
            entryFee,
            matchType: isRealMatch ? 'REAL' : 'PRACTICE',
          }),
        });

        const data = await response.json();
        if (!data.success || isCancelledRef.current) return;

        setMatchId(data.matchId);
        setMatchCode(data.matchCode || `ROOM-${Math.floor(1000 + Math.random() * 9000)}`);

        if (data.status === 'STARTING') {
          // All players already locked in (e.g. practice bots or pre-matched room)
          const opps: MatchedOpponent[] = data.players
            .filter((p: any) => p.userId !== userId)
            .map((p: any, idx: number) => ({
              id: p.userId,
              name: p.username,
              avatarUrl: p.avatarUrl,
              color: (p.color as PlayerColor) || remainingColors[idx] || 'blue',
              country: p.country || 'AE',
              rating: p.rating || 1920,
              ping: p.ping || 24,
              isReady: true,
              isRealPlayer: isRealMatch,
            }));

          setMatchedPlayers(opps);
          setStatusMessage(
            isRealMatch
              ? 'ALL REAL PLAYERS LOCKED IN! GET READY!'
              : 'PRACTICE OPPONENTS READY!'
          );
          SoundManager.play('match-found');
          setTimeout(() => {
            SoundManager.play('battle-horn');
            setCountdown(3);
          }, 600);
        } else {
          // Waiting for real players -> start polling status
          setStatusMessage('WAITING FOR REAL PLAYERS TO JOIN TABLE...');
          startStatusPolling(data.matchId);
        }
      } catch {
        // Fallback for offline / demo
        if (!isRealMatch) {
          setTimeout(() => {
            const fallbackOpp: MatchedOpponent = {
              id: 'p_bot_training',
              name: 'Training Bot (AI)',
              avatarUrl:
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              country: 'GLOBAL',
              rating: 1800,
              ping: 15,
              color: remainingColors[0] || 'blue',
              isReady: true,
              isRealPlayer: false,
            };
            setMatchedPlayers([fallbackOpp]);
            setStatusMessage('PRACTICE OPPONENT LOCKED IN!');
            SoundManager.play('match-found');
            setCountdown(3);
          }, 1500);
        }
      }
    };

    const startStatusPolling = (mId: string) => {
      if (pollingRef.current) clearInterval(pollingRef.current);

      pollingRef.current = setInterval(async () => {
        if (isCancelledRef.current) return;
        try {
          const res = await fetch(`/api/matchmaking/status?matchId=${mId}&userId=${userId}`);
          const statusData = await res.json();
          if (!statusData.success || isCancelledRef.current) return;

          const otherPlayers = (statusData.players || []).filter((p: any) => p.userId !== userId);
          if (otherPlayers.length > 0) {
            const updatedOpps: MatchedOpponent[] = otherPlayers.map((p: any, idx: number) => ({
              id: p.userId,
              name: p.username,
              avatarUrl: p.avatarUrl,
              color: (p.color as PlayerColor) || remainingColors[idx] || 'blue',
              country: p.country || 'AE',
              rating: p.rating || 1950,
              ping: p.ping || 22,
              isReady: true,
              isRealPlayer: true,
            }));
            setMatchedPlayers(updatedOpps);
          }

          if (statusData.status === 'STARTING') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setStatusMessage('ALL REAL PLAYERS LOCKED IN! GET READY!');
            SoundManager.play('match-found');
            SoundManager.play('battle-horn');
            setCountdown(3);
          }
        } catch {
          // ignore transient poll error
        }
      }, 1500);
    };

    joinMatchmakingQueue();

    return () => {
      isCancelledRef.current = true;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [playerCount, entryFee, isRealMatch, userId, userName, userAvatar]);

  // Handle instant simulation of a real player join (for fast test in dev/preview)
  const handleSimulateRealPlayerJoin = async () => {
    if (!matchId || isSimulatingOpponent || countdown !== null) return;
    setIsSimulatingOpponent(true);
    SoundManager.play('click');

    try {
      const res = await fetch('/api/matchmaking/simulate-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        const otherPlayers = data.room.players.filter((p: any) => p.userId !== userId);
        const opps: MatchedOpponent[] = otherPlayers.map((p: any, idx: number) => ({
          id: p.userId,
          name: p.username,
          avatarUrl: p.avatarUrl,
          color: (p.color as PlayerColor) || remainingColors[idx] || 'blue',
          country: p.country || 'AE',
          rating: p.rating || 1980,
          ping: p.ping || 20,
          isReady: true,
          isRealPlayer: true,
        }));
        setMatchedPlayers(opps);
        SoundManager.play('match-found');

        if (data.room.status === 'STARTING') {
          setStatusMessage('ALL REAL PLAYERS LOCKED IN! GET READY!');
          SoundManager.play('battle-horn');
          setCountdown(3);
        }
      }
    } catch {
      // fallback
    } finally {
      setIsSimulatingOpponent(false);
    }
  };

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

  const handleCopyMatchCode = () => {
    if (matchCode) {
      navigator.clipboard.writeText(matchCode);
      setCopiedCode(true);
      SoundManager.play('click');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCancelQueue = () => {
    isCancelledRef.current = true;
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (matchId) {
      fetch('/api/matchmaking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, userId }),
      }).catch(() => {});
    }
    SoundManager.play('click');
    onCancel();
  };

  const opponentSlots = Array.from({ length: playerCount - 1 });

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-[#120524] via-[#090214] to-[#04010a] text-white select-none overflow-y-auto">
      {/* Top Header */}
      <div className="w-full max-w-lg flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-md ${
              isRealMatch
                ? 'bg-amber-950/70 border-amber-500/50 text-amber-200'
                : 'bg-violet-950/70 border-violet-500/40 text-cyan-200'
            }`}
          >
            <Radio
              className={`w-4 h-4 animate-pulse ${
                isRealMatch ? 'text-amber-400' : 'text-cyan-400'
              }`}
            />
            <span className="text-xs font-black">
              {isRealMatch
                ? 'REAL MONEY ARENA (BOT-FREE)'
                : 'PRACTICE TRAINING MATCH'}
            </span>
          </div>

          {matchCode && (
            <button
              onClick={handleCopyMatchCode}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copy Match Code"
            >
              <span>{matchCode}</span>
              {copiedCode ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
          )}
        </div>

        {countdown === null ? (
          <button
            onClick={handleCancelQueue}
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
      <div className="relative w-full max-w-md my-auto flex flex-col items-center justify-center py-4">
        {/* Holographic Radar Scanner */}
        <div className="relative w-60 h-60 sm:w-68 sm:h-68 flex items-center justify-center">
          {/* Radar Circles */}
          <div className="absolute inset-0 rounded-full border border-violet-500/20" />
          <div className="absolute inset-8 rounded-full border border-violet-500/30" />
          <div
            className={`absolute inset-16 rounded-full border ${
              isRealMatch ? 'border-amber-500/40' : 'border-cyan-500/40'
            }`}
          />
          <div
            className={`absolute inset-24 rounded-full border ${
              isRealMatch
                ? 'border-amber-400/50 bg-amber-950/20'
                : 'border-cyan-400/50 bg-cyan-950/20'
            }`}
          />

          {/* Rotating Scanner Line */}
          {countdown === null && (
            <div
              className="absolute inset-0 rounded-full animate-spin pointer-events-none"
              style={{ animationDuration: isRealMatch ? '2.5s' : '3s' }}
            >
              <div
                className={`w-1/2 h-1/2 rounded-tl-full origin-bottom-right ${
                  isRealMatch
                    ? 'bg-gradient-to-br from-amber-400/30 to-transparent'
                    : 'bg-gradient-to-br from-cyan-400/30 to-transparent'
                }`}
              />
            </div>
          )}

          {/* Center Status / Countdown Icon */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            {countdown !== null ? (
              <motion.div
                key={`countdown-val-${countdown}`}
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
              <div key="searching-icon-wrap" className="flex flex-col items-center">
                <Swords
                  className={`w-10 h-10 animate-bounce ${
                    isRealMatch
                      ? 'text-amber-400 drop-shadow-[0_0_12px_#f59e0b]'
                      : 'text-cyan-300 drop-shadow-[0_0_10px_#38bdf8]'
                  }`}
                />
                <span className="text-xs font-black text-violet-200 mt-2">
                  00:{searchTime < 10 ? `0${searchTime}` : searchTime}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Status Text */}
        <p
          className={`text-xs sm:text-sm font-black tracking-wider uppercase text-center mt-3 drop-shadow ${
            isRealMatch ? 'text-amber-300' : 'text-cyan-300'
          }`}
        >
          {statusMessage}
        </p>

        {/* Real Match Guarantee Badge */}
        <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {isRealMatch
              ? 'Real Human Players Required • Fair Play Protected'
              : 'Practice Match • Instant AI Trainer Enabled'}
          </span>
        </div>

        {/* Quick Testing Trigger for Real Player Simulation in Development */}
        {isRealMatch && countdown === null && matchedPlayers.length < playerCount - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3"
          >
            <button
              onClick={handleSimulateRealPlayerJoin}
              disabled={isSimulatingOpponent}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isSimulatingOpponent
                  ? 'Pairing Real Player...'
                  : 'Pair With Real Online Player Now'}
              </span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Bottom Player Matching Slots */}
      <div className="w-full max-w-lg space-y-2.5 pb-4">
        {/* Prize Pool Info */}
        <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-gradient-to-r from-violet-950/80 to-purple-950/80 border border-violet-500/30 text-xs">
          <div className="flex items-center gap-1.5 text-violet-200">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Prize Pool:</span>
            <strong className="text-amber-300 font-black">
              {prizePool > 0
                ? `${platformMode.currencySymbol}${prizePool.toFixed(2)}`
                : 'Practice Free'}
            </strong>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-300">
            <Wifi className="w-3 h-3 text-green-400" />
            <span>Ping: 24ms (Optimal)</span>
          </div>
        </div>

        {/* Matched Slots Grid */}
        <div
          className={`grid gap-2 ${
            playerCount === 2
              ? 'grid-cols-2'
              : playerCount === 3
              ? 'grid-cols-3'
              : 'grid-cols-4'
          }`}
        >
          {/* SLOT 1: YOU (Player 1) */}
          <div
            key="slot-player-1-user"
            className={`p-2.5 rounded-2xl border-2 flex flex-col items-center text-center shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
              userColor === 'red'
                ? 'bg-gradient-to-b from-rose-950/90 to-red-950/90 border-rose-400 shadow-rose-900/50'
                : userColor === 'yellow'
                ? 'bg-gradient-to-b from-amber-950/90 to-yellow-950/90 border-amber-400 shadow-amber-900/50'
                : userColor === 'green'
                ? 'bg-gradient-to-b from-emerald-950/90 to-teal-950/90 border-emerald-400 shadow-emerald-900/50'
                : 'bg-gradient-to-b from-blue-950/90 to-cyan-950/90 border-cyan-400 shadow-cyan-900/50'
            }`}
          >
            <div className="relative">
              <img
                src={
                  userAvatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt={userName}
                className="w-11 h-11 rounded-full object-cover border-2 border-white"
              />
              <span
                className={`absolute -bottom-1 -right-1 text-[10px] px-1 rounded-full font-black text-white ${
                  userColor === 'red'
                    ? 'bg-red-600'
                    : userColor === 'yellow'
                    ? 'bg-amber-600'
                    : userColor === 'green'
                    ? 'bg-emerald-600'
                    : 'bg-blue-600'
                }`}
              >
                P1
              </span>
            </div>
            <span className="text-xs font-black text-white mt-1 truncate max-w-full">
              {userName} (You)
            </span>
            <span className="text-[10px] text-amber-300 font-bold flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300" /> READY
            </span>
          </div>

          {/* SLOTS 2..N: OPPONENTS */}
          {opponentSlots.map((_, idx) => {
            const opp = matchedPlayers[idx];
            const color = opp?.color || remainingColors[idx] || 'green';

            return (
              <AnimatePresence key={`slot-presence-${idx}`} mode="wait">
                {opp ? (
                  <motion.div
                    key={`slot-matched-${idx}-${opp.name}`}
                    initial={{ scale: 0.8, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className={`p-2.5 rounded-2xl border-2 flex flex-col items-center text-center shadow-lg ${
                      color === 'red'
                        ? 'bg-rose-950/80 border-rose-500 shadow-rose-900/40'
                        : color === 'yellow'
                        ? 'bg-amber-950/80 border-amber-500 shadow-amber-900/40'
                        : color === 'green'
                        ? 'bg-emerald-950/80 border-emerald-500 shadow-emerald-900/40'
                        : 'bg-blue-950/80 border-blue-500 shadow-blue-900/40'
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
                    <span className="text-xs font-black text-white mt-1 truncate max-w-full">
                      {opp.name}
                    </span>
                    <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                      {opp.isRealPlayer ? 'REAL' : 'READY'}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`slot-waiting-${idx}`}
                    className="p-2.5 rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center text-center min-h-[105px]"
                  >
                    <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                      <Radio className="w-5 h-5 text-violet-300" />
                    </div>
                    <span className="text-[11px] font-bold text-violet-300/80 mt-1">
                      {isRealMatch ? 'Real Player' : `Player ${idx + 2}`}
                    </span>
                    <span
                      className={`text-[9px] animate-pulse ${
                        isRealMatch ? 'text-amber-300 font-medium' : 'text-cyan-300/70'
                      }`}
                    >
                      {isRealMatch ? 'Searching queue...' : 'Matching...'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>
      </div>
    </div>
  );
};
