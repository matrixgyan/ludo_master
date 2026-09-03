import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Crown,
  Medal,
  X,
  RefreshCw,
  Sparkles,
  Swords,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';

interface LeaderboardItem {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  highestScore: number;
  matchesPlayed: number;
  matchesWon: number;
  tier: string;
  tierBadge: string;
  tierColor: string;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onPlayGame?: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  userId = 'default_user',
  onPlayGame,
}) => {
  const [timeframe, setTimeframe] = useState<'today' | 'weekly' | 'all-time'>('today');
  const [gameType, setGameType] = useState<'all' | 'supreme' | 'snake'>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [myStanding, setMyStanding] = useState<LeaderboardItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = `/api/leaderboard/highest-scores?timeframe=${timeframe}&gameType=${gameType}&userId=${encodeURIComponent(userId)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLeaderboard(data.leaderboard || []);
          setMyStanding(data.myStanding || null);
        }
      }
    } catch (err) {
      console.warn('Error fetching highest score leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, gameType, userId]);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
      const interval = setInterval(fetchLeaderboard, 15000);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchLeaderboard]);

  if (!isOpen) return null;

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-xl bg-[#0e0a1f] border border-white/15 rounded-3xl shadow-2xl text-white flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* TOP HEADER */}
          <div className="px-5 pt-4 pb-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  Highest Score Leaderboard
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/20 font-semibold">
                    Live Scores
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Rankings based strictly on peak match score</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  SoundManager.play('click');
                  fetchLeaderboard();
                }}
                disabled={isLoading}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Refresh rankings"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
              <button
                onClick={() => {
                  SoundManager.play('click');
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TIMEFRAME FILTER PILLS */}
          <div className="px-5 pt-3 pb-2 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between border-b border-white/5 bg-white/[0.02]">
            {/* Timeframe selector */}
            <div className="inline-flex rounded-xl bg-black/40 p-1 border border-white/10 text-xs font-semibold">
              <button
                onClick={() => {
                  SoundManager.play('click');
                  setTimeframe('today');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeframe === 'today'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Today (Daily)
              </button>
              <button
                onClick={() => {
                  SoundManager.play('click');
                  setTimeframe('weekly');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeframe === 'weekly'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => {
                  SoundManager.play('click');
                  setTimeframe('all-time');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeframe === 'all-time'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All-Time
              </button>
            </div>

            {/* Game mode selector */}
            <div className="inline-flex rounded-xl bg-black/40 p-1 border border-white/10 text-xs font-medium">
              <button
                onClick={() => {
                  SoundManager.play('click');
                  setGameType('all');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  gameType === 'all'
                    ? 'bg-white/20 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  SoundManager.play('click');
                  setGameType('supreme');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  gameType === 'supreme'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👑 Supreme
              </button>
              <button
                onClick={() => {
                  SoundManager.play('click');
                  setGameType('snake');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  gameType === 'snake'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🐍 Snake
              </button>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {isLoading && leaderboard.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                <span>Loading latest scores...</span>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">No match scores yet</h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Be the first player to complete a match {timeframe === 'today' ? 'today' : ''} and take the #1 rank!
                  </p>
                </div>
                {onPlayGame && (
                  <button
                    onClick={() => {
                      SoundManager.play('click');
                      onClose();
                      onPlayGame();
                    }}
                    className="mt-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    Play Match Now
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* TOP 3 PODIUM */}
                {topThree.length > 0 && (
                  <div className="grid grid-cols-3 gap-2.5 pt-2 pb-3">
                    {/* Rank 2 (Left) */}
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/[0.03] border border-white/10 relative order-1 sm:order-1 mt-3">
                      <div className="relative mb-2">
                        <img
                          src={topThree[1]?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=p2'}
                          alt={topThree[1]?.username || 'Player'}
                          className="w-12 h-12 rounded-full border-2 border-slate-300 object-cover bg-black/40"
                        />
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 text-slate-950 font-black text-[10px] flex items-center justify-center shadow">
                          2
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white truncate max-w-[90px]">
                        {topThree[1]?.username || 'Player 2'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {topThree[1]?.tier || 'Warrior'}
                      </span>
                      <div className="mt-2 text-sm font-black text-slate-200">
                        {topThree[1]?.highestScore ?? 0} <span className="text-[10px] font-bold text-slate-400">PTS</span>
                      </div>
                    </div>

                    {/* Rank 1 (Center) */}
                    <div className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent border-2 border-amber-400/50 relative order-2 sm:order-2 shadow-lg shadow-amber-500/10">
                      <div className="absolute -top-3">
                        <Crown className="w-6 h-6 fill-amber-400 text-amber-300 drop-shadow" />
                      </div>
                      <div className="relative mb-2 mt-1">
                        <img
                          src={topThree[0]?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=p1'}
                          alt={topThree[0]?.username || 'Player'}
                          className="w-14 h-14 rounded-full border-2 border-amber-400 object-cover bg-black/40 shadow-md shadow-amber-500/30"
                        />
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-[11px] flex items-center justify-center shadow">
                          1
                        </span>
                      </div>
                      <span className="text-xs font-black text-amber-300 truncate max-w-[100px]">
                        {topThree[0]?.username || 'Champion'}
                      </span>
                      <span className="text-[10px] text-amber-400/80 font-bold mt-0.5">
                        {topThree[0]?.tier || 'Master'}
                      </span>
                      <div className="mt-2 text-base font-black text-amber-300">
                        {topThree[0]?.highestScore ?? 0} <span className="text-[10px] font-bold text-amber-400/80">PTS</span>
                      </div>
                    </div>

                    {/* Rank 3 (Right) */}
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/[0.03] border border-white/10 relative order-3 sm:order-3 mt-4">
                      <div className="relative mb-2">
                        <img
                          src={topThree[2]?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=p3'}
                          alt={topThree[2]?.username || 'Player'}
                          className="w-12 h-12 rounded-full border-2 border-amber-700 object-cover bg-black/40"
                        />
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white font-black text-[10px] flex items-center justify-center shadow">
                          3
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white truncate max-w-[90px]">
                        {topThree[2]?.username || 'Player 3'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {topThree[2]?.tier || 'Challenger'}
                      </span>
                      <div className="mt-2 text-sm font-black text-amber-600">
                        {topThree[2]?.highestScore ?? 0} <span className="text-[10px] font-bold text-slate-400">PTS</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* RANKINGS LIST (#4 to #50) */}
                {remaining.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 flex items-center justify-between border-b border-white/5 uppercase tracking-wider">
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center">#</span>
                        <span>Player</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="hidden sm:inline">Tier</span>
                        <span className="w-20 text-right">Highest Score</span>
                      </div>
                    </div>

                    {remaining.map((item) => (
                      <div
                        key={item.userId}
                        className={`px-3 py-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                          item.userId === userId
                            ? 'bg-amber-500/10 border-amber-400/40 text-white'
                            : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/5 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center font-mono font-bold text-xs text-slate-400">
                            #{item.rank}
                          </span>
                          <img
                            src={item.avatar}
                            alt={item.username}
                            className="w-8 h-8 rounded-full border border-white/10 object-cover bg-black/40"
                          />
                          <div className="leading-tight">
                            <span className="text-xs font-bold block truncate max-w-[120px] sm:max-w-[180px]">
                              {item.username}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.matchesWon} wins • {item.matchesPlayed} games
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span
                            className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{
                              backgroundColor: `${item.tierColor}20`,
                              color: item.tierColor,
                              border: `1px solid ${item.tierColor}40`,
                            }}
                          >
                            {item.tier}
                          </span>

                          <div className="w-20 text-right leading-none">
                            <span className="text-sm font-black text-amber-300">
                              {item.highestScore}
                            </span>
                            <span className="text-[9px] block text-slate-400 uppercase font-bold mt-0.5">
                              PTS
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* STICKY BOTTOM BAR: YOUR PERSONAL STANDING */}
          <div className="px-5 py-3 border-t border-white/10 bg-[#090516] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs text-amber-300">
                {myStanding?.rank ? `#${myStanding.rank}` : '-'}
              </div>
              <div className="leading-tight">
                <span className="text-xs font-bold text-white block">
                  Your Standing {timeframe === 'today' ? 'Today' : ''}
                </span>
                <span className="text-[11px] text-slate-400">
                  {myStanding?.highestScore
                    ? `Peak Score: ${myStanding.highestScore} PTS (${myStanding.tier})`
                    : 'No score registered yet'}
                </span>
              </div>
            </div>

            {onPlayGame && (
              <button
                onClick={() => {
                  SoundManager.play('click');
                  onClose();
                  onPlayGame();
                }}
                className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black flex items-center gap-1 shadow cursor-pointer active:scale-95 transition-all"
              >
                <Swords className="w-3.5 h-3.5 fill-slate-950" />
                Play & Climb
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
