import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Sparkles,
  TrendingUp,
  Award,
  Users,
  X,
  RefreshCw,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  IndianRupee
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import confetti from 'canvas-confetti';

interface LiveWinnerItem {
  id: string;
  username: string;
  avatar: string;
  amount: number;
  gameMode: string;
  timeAgo: string;
  badge: string;
  streak?: number;
}

interface RankedChampionItem {
  rank: number;
  username: string;
  avatar: string;
  totalWon: number;
  matchesWon: number;
  winRate: string;
  tier: string;
  state?: string;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBalance?: number;
  onPlayGame?: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  userBalance = 0,
  onPlayGame,
}) => {
  const [activeTab, setActiveTab] = useState<'live-winners' | 'daily' | 'weekly' | 'all-time'>('live-winners');
  const [isLoading, setIsLoading] = useState(false);
  const [liveWinners, setLiveWinners] = useState<LiveWinnerItem[]>([]);
  const [topRanked, setTopRanked] = useState<RankedChampionItem[]>([]);
  const [totalPaidOutToday, setTotalPaidOutToday] = useState('₹3,42,850');
  const [activeChampionsCount, setActiveChampionsCount] = useState(1420);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  const fetchLeaderboardData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/leaderboard/live-winners');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLiveWinners(data.liveWinners || []);
          setTopRanked(data.topRanked || []);
          if (data.totalPaidOutToday) setTotalPaidOutToday(data.totalPaidOutToday);
          if (data.activeChampionsCount) setActiveChampionsCount(data.activeChampionsCount);
          setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    } catch (err) {
      console.warn('Leaderboard fetch notice', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboardData();
      const interval = setInterval(fetchLeaderboardData, 15000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualRefresh = () => {
    SoundManager.play('click');
    fetchLeaderboardData();
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/40 border-2 border-yellow-100">
          <Crown className="w-4 h-4 fill-slate-950 stroke-[2.5]" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-400 text-slate-950 flex items-center justify-center font-black shadow-md border-2 border-white">
          <Medal className="w-4 h-4 fill-slate-950 stroke-[2.5]" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center font-black shadow-md border-2 border-orange-200">
          <Medal className="w-4 h-4 fill-white stroke-[2.5]" />
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-lg bg-white/10 text-slate-300 flex items-center justify-center font-bold text-xs font-mono border border-white/10">
        #{rank}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          className="relative w-full max-w-xl rounded-3xl bg-[#0c0822] border-2 border-amber-500/40 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(245,158,11,0.25)] text-white overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Top Laser Strip */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-orange-500 z-10" />

          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#130d36]/90 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center text-slate-950">
                <Trophy className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                    Live Leaderboard & Winners
                  </h3>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 font-extrabold text-[10px] uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live Feed
                  </span>
                </div>
                <p className="text-xs text-amber-300/80 font-medium">
                  Real-time Verified Winning Payouts & Daily Champions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleManualRefresh}
                disabled={isLoading}
                title="Refresh Live Data"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              </button>

              <button
                onClick={() => {
                  SoundManager.play('click');
                  onClose();
                }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* TOTAL CASH PAYOUT TODAY HIGHLIGHT BANNER */}
          <div className="bg-gradient-to-r from-[#1a1240] via-[#231758] to-[#1a1240] px-4 py-3 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Total Paid Out Today
                </span>
                <span className="text-base sm:text-lg font-black text-amber-300 font-mono tracking-tight drop-shadow">
                  {totalPaidOutToday}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Active Champions
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center justify-end gap-1 font-mono">
                <Users className="w-3.5 h-3.5" />
                {activeChampionsCount.toLocaleString()} Playing
              </span>
            </div>
          </div>

          {/* TAB SELECTOR */}
          <div className="px-4 pt-3">
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/10">
              <button
                onClick={() => setActiveTab('live-winners')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'live-winners'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Live Winners</span>
              </button>

              <button
                onClick={() => setActiveTab('daily')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'daily'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Daily Top</span>
              </button>

              <button
                onClick={() => setActiveTab('weekly')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'weekly'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Weekly Mega</span>
              </button>

              <button
                onClick={() => setActiveTab('all-time')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'all-time'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>All-Time</span>
              </button>
            </div>
          </div>

          {/* MAIN LIST BODY */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            
            {/* TAB 1: LIVE WINNERS STREAM */}
            {activeTab === 'live-winners' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="flex items-center gap-1 font-bold text-amber-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    Live Cash Match Winners (Auto-updating)
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Last update: {lastRefreshed}
                  </span>
                </div>

                {liveWinners.map((winner, idx) => (
                  <motion.div
                    key={winner.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative p-3 rounded-2xl bg-gradient-to-r from-[#150f38] via-[#1a1346] to-[#150f38] border border-white/10 hover:border-amber-500/40 shadow-md flex items-center justify-between gap-3 group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={winner.avatar}
                          alt={winner.username}
                          className="w-11 h-11 rounded-2xl object-cover border-2 border-amber-400/60 shadow-inner"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black shadow">
                          ✓
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-white group-hover:text-amber-300 transition-colors">
                            {winner.username}
                          </h4>
                          <span className="px-2 py-0.2 rounded-md bg-amber-500/20 text-amber-300 font-extrabold text-[9.5px] uppercase tracking-wider border border-amber-500/30">
                            {winner.badge}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span className="text-slate-300 font-medium">{winner.gameMode}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-emerald-400 font-mono text-[11px]">
                            <Clock className="w-3 h-3" /> {winner.timeAgo}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
                        +₹{winner.amount.toLocaleString()}
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold text-[9.5px] uppercase tracking-wider">
                        Cash Won
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* TAB 2, 3, 4: RANKED CHAMPIONS LEADERBOARD (Daily, Weekly, All-Time) */}
            {activeTab !== 'live-winners' && (
              <div className="space-y-2.5">
                
                {/* PODIUM HIGHLIGHT FOR TOP 3 */}
                <div className="grid grid-cols-3 gap-2 pb-2">
                  {/* Rank 2 */}
                  {topRanked[1] && (
                    <div className="p-2.5 rounded-2xl bg-[#140e36] border border-slate-400/30 text-center flex flex-col items-center justify-end relative mt-3">
                      <div className="absolute -top-3.5">
                        {getRankBadge(2)}
                      </div>
                      <img src={topRanked[1].avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-slate-300 my-1" />
                      <span className="text-xs font-bold text-white truncate max-w-full">{topRanked[1].username}</span>
                      <span className="text-xs font-black font-mono text-amber-300 mt-0.5">₹{topRanked[1].totalWon.toLocaleString()}</span>
                      <span className="text-[9.5px] text-slate-400">{topRanked[1].matchesWon} Wins</span>
                    </div>
                  )}

                  {/* Rank 1 (Supreme Gold) */}
                  {topRanked[0] && (
                    <div className="p-3 rounded-2xl bg-gradient-to-b from-[#2a1d63] to-[#170e42] border-2 border-amber-400 text-center flex flex-col items-center justify-end relative shadow-lg shadow-amber-500/20">
                      <div className="absolute -top-4">
                        {getRankBadge(1)}
                      </div>
                      <img src={topRanked[0].avatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 my-1 shadow-md" />
                      <span className="text-xs font-black text-amber-300 truncate max-w-full">{topRanked[0].username}</span>
                      <span className="text-sm font-black font-mono text-emerald-400 mt-0.5">₹{topRanked[0].totalWon.toLocaleString()}</span>
                      <span className="text-[10px] text-amber-200 font-bold">{topRanked[0].matchesWon} Wins • {topRanked[0].winRate}</span>
                    </div>
                  )}

                  {/* Rank 3 */}
                  {topRanked[2] && (
                    <div className="p-2.5 rounded-2xl bg-[#140e36] border border-orange-500/30 text-center flex flex-col items-center justify-end relative mt-3">
                      <div className="absolute -top-3.5">
                        {getRankBadge(3)}
                      </div>
                      <img src={topRanked[2].avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-orange-300 my-1" />
                      <span className="text-xs font-bold text-white truncate max-w-full">{topRanked[2].username}</span>
                      <span className="text-xs font-black font-mono text-amber-300 mt-0.5">₹{topRanked[2].totalWon.toLocaleString()}</span>
                      <span className="text-[9.5px] text-slate-400">{topRanked[2].matchesWon} Wins</span>
                    </div>
                  )}
                </div>

                {/* REST OF RANKINGS (4 TO 10) */}
                <div className="space-y-2">
                  {topRanked.slice(3).map((item) => (
                    <div
                      key={item.rank}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 hover:bg-white/10 transition"
                    >
                      <div className="flex items-center gap-3">
                        {getRankBadge(item.rank)}
                        <img src={item.avatar} alt={item.username} className="w-9 h-9 rounded-xl object-cover border border-white/20" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{item.username}</h4>
                            <span className="text-[9.5px] text-slate-400 font-mono">({item.state || 'India'})</span>
                          </div>
                          <span className="text-[10.5px] text-slate-400">
                            {item.matchesWon} Matches Won • <span className="text-amber-300">{item.winRate} Win Rate</span>
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black font-mono text-amber-300">
                          ₹{item.totalWon.toLocaleString()}
                        </span>
                        <span className="block text-[9px] text-slate-400 uppercase font-bold">Total Winnings</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* USER'S OWN LIVE RANK HUD FOOTER */}
          <div className="p-4 border-t border-white/10 bg-[#120b33] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center font-black text-amber-300 text-xs">
                #42
              </div>
              <div>
                <span className="text-xs font-black text-white">Your Rank: #42</span>
                <span className="block text-[10px] text-slate-400">Play matches to climb to Top 10</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                SoundManager.play('click');
                onClose();
                if (onPlayGame) onPlayGame();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Play & Win Cash</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
