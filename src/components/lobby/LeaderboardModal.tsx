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
  Flame,
  Gamepad2,
  Radio,
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import woodBgImg from '../../assets/images/wood_plank_bg_1787143024792.jpg';

interface LeaderboardItem {
  rank: number;
  userId: string;
  idNumber: string;
  username: string;
  avatar: string;
  highestScore: number;
  matchesPlayed: number;
  matchesWon: number;
  playingMatch?: string;
  isPlaying?: boolean;
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
      const interval = setInterval(fetchLeaderboard, 12000);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchLeaderboard]);

  if (!isOpen) return null;

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
        {/* 1. WOODEN PLANK BACKGROUND CONTAINER (Exact match to Ludo Supreme match selection) */}
        <motion.div
          key="leaderboard-modal-card"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg sm:max-w-xl md:max-w-2xl rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)] border-4 border-[#5c2411]/90 my-auto flex flex-col max-h-[93vh]"
          style={{
            backgroundImage: `url(${woodBgImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#8b4513',
          }}
        >
          {/* Warm Conical Spotlight from Top */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(255, 238, 187, 0.45) 0%, rgba(0, 0, 0, 0.6) 100%)',
            }}
          />

          {/* TOP PUSHPINS (Deep Glossy Violet 3D Spheres with specularity and cast shadow) */}
          <div className="absolute top-2 left-4 z-30 pointer-events-none">
            <div className="relative w-5 h-5 rounded-full bg-gradient-to-tr from-[#3b0764] via-[#581c87] to-[#7e22ce] shadow-[0_3px_6px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.6)] border border-[#a855f7]/60 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/90 absolute top-1 left-1 blur-[0.3px]" />
            </div>
            <div className="w-4 h-2 bg-black/40 rounded-full blur-[1px] absolute -bottom-0.5 left-0.5" />
          </div>

          <div className="absolute top-2 right-12 z-30 pointer-events-none">
            <div className="relative w-5 h-5 rounded-full bg-gradient-to-tr from-[#3b0764] via-[#581c87] to-[#7e22ce] shadow-[0_3px_6px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.6)] border border-[#a855f7]/60 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/90 absolute top-1 left-1 blur-[0.3px]" />
            </div>
            <div className="w-4 h-2 bg-black/40 rounded-full blur-[1px] absolute -bottom-0.5 left-0.5" />
          </div>

          {/* Wooden Circular Close Button */}
          <button
            onClick={() => {
              SoundManager.play('click');
              onClose();
            }}
            className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-amber-100 flex items-center justify-center border border-amber-300/40 shadow-lg cursor-pointer transition-transform active:scale-95"
            title="Close Leaderboard"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* 2. PARCHMENT SCROLL BOARD CONTAINER */}
          <div className="relative z-10 m-2 sm:m-3 flex-1 flex flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-[#fff7d6] via-[#fdefbe] to-[#ebd498] border-2 border-[#caa050] text-[#5c2411] shadow-[0_12px_28px_rgba(0,0,0,0.6)]">
            
            {/* TOP HEADER */}
            <div className="px-4 py-3 border-b-2 border-[#caa050]/60 bg-gradient-to-r from-[#f7e4af] via-[#fff4d1] to-[#f7e4af] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 border border-amber-600/50 flex items-center justify-center text-[#5c2411] shadow-md">
                  <Trophy className="w-5 h-5 drop-shadow-sm fill-[#5c2411]/20" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-[#5c2411] tracking-tight flex items-center gap-1.5">
                    Highest Score Leaderboard
                    <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold tracking-wide uppercase shadow flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5 animate-pulse" />
                      Live
                    </span>
                  </h2>
                  <p className="text-[11px] text-[#78350f] font-semibold">
                    Real players playing matches & highest game scores
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mr-6">
                <button
                  onClick={() => {
                    SoundManager.play('click');
                    fetchLeaderboard();
                  }}
                  disabled={isLoading}
                  className="w-8 h-8 rounded-full bg-[#5c2411]/10 hover:bg-[#5c2411]/20 border border-[#caa050] flex items-center justify-center text-[#5c2411] transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Refresh standings"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-700' : ''}`} />
                </button>
              </div>
            </div>

            {/* TIMEFRAME & GAME MODE FILTER PILLS */}
            <div className="px-3 sm:px-4 py-2 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between border-b border-[#caa050]/40 bg-[#f9e9be]/70">
              {/* Timeframe selector */}
              <div className="inline-flex rounded-xl bg-[#5c2411]/15 p-1 border border-[#caa050]/50 text-xs font-bold">
                <button
                  onClick={() => {
                    SoundManager.play('click');
                    setTimeframe('today');
                  }}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    timeframe === 'today'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-[#3b1700] font-black shadow-md border border-amber-300'
                      : 'text-[#78350f] hover:text-[#5c2411]'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    SoundManager.play('click');
                    setTimeframe('weekly');
                  }}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    timeframe === 'weekly'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-[#3b1700] font-black shadow-md border border-amber-300'
                      : 'text-[#78350f] hover:text-[#5c2411]'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => {
                    SoundManager.play('click');
                    setTimeframe('all-time');
                  }}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    timeframe === 'all-time'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-[#3b1700] font-black shadow-md border border-amber-300'
                      : 'text-[#78350f] hover:text-[#5c2411]'
                  }`}
                >
                  All-Time
                </button>
              </div>

              {/* Game mode selector */}
              <div className="inline-flex rounded-xl bg-[#5c2411]/15 p-1 border border-[#caa050]/50 text-xs font-bold">
                <button
                  onClick={() => {
                    SoundManager.play('click');
                    setGameType('all');
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    gameType === 'all'
                      ? 'bg-[#5c2411] text-amber-100 shadow'
                      : 'text-[#78350f] hover:text-[#5c2411]'
                  }`}
                >
                  All Modes
                </button>
                <button
                  onClick={() => {
                    SoundManager.play('click');
                    setGameType('supreme');
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    gameType === 'supreme'
                      ? 'bg-purple-700 text-white shadow'
                      : 'text-[#78350f] hover:text-[#5c2411]'
                  }`}
                >
                  👑 Supreme
                </button>
                <button
                  onClick={() => {
                    SoundManager.play('click');
                    setGameType('snake');
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    gameType === 'snake'
                      ? 'bg-emerald-700 text-white shadow'
                      : 'text-[#78350f] hover:text-[#5c2411]'
                  }`}
                >
                  🐍 Snake
                </button>
              </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-3">
              {isLoading && leaderboard.length === 0 ? (
                <div className="py-16 text-center text-[#78350f] text-sm flex flex-col items-center justify-center gap-2 font-bold">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
                  <span>Loading match standings & active players...</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="py-16 text-center text-[#78350f] text-sm flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#5c2411]/10 border border-[#caa050] flex items-center justify-center text-amber-600">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-[#5c2411] font-black text-base">No match scores yet</h3>
                    <p className="text-xs text-[#78350f] max-w-xs mt-1 font-medium">
                      Complete a match and secure your spot on the official leaderboard!
                    </p>
                  </div>
                  {onPlayGame && (
                    <button
                      onClick={() => {
                        SoundManager.play('click');
                        onClose();
                        onPlayGame();
                      }}
                      className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 border border-amber-300"
                    >
                      <Swords className="w-4 h-4" />
                      Play Match Now
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* TOP 3 PODIUM */}
                  {topThree.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-1 pb-2">
                      {/* Rank 2 (Left) */}
                      <div className="flex flex-col items-center text-center p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-[#e5e7eb]/80 to-[#d1d5db]/90 border-2 border-slate-300 relative order-1 shadow-md mt-3">
                        <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center shadow-md border-2 border-white mb-1.5">
                          #2
                        </div>
                        <span className="text-xs font-black text-slate-900 truncate max-w-[85px] sm:max-w-[110px]">
                          {topThree[1]?.username || 'Player 2'}
                        </span>
                        <span className="font-mono text-[10px] font-black text-slate-700 bg-white/70 px-1.5 py-0.5 rounded border border-slate-300 mt-1">
                          ID: {topThree[1]?.idNumber || '#200002'}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-400 px-1.5 py-0.5 rounded-full mt-1.5 truncate max-w-[90px]">
                          {topThree[1]?.playingMatch || 'Playing Arena'}
                        </span>
                        <div className="mt-2 text-sm font-black text-slate-900">
                          {topThree[1]?.highestScore ?? 0} <span className="text-[10px] font-bold text-slate-700">PTS</span>
                        </div>
                      </div>

                      {/* Rank 1 (Center) */}
                      <div className="flex flex-col items-center text-center p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-[#fef08a] via-[#fde047] to-[#eab308] border-2 border-amber-500 relative order-2 shadow-lg shadow-amber-500/20">
                        <div className="absolute -top-3.5">
                          <Crown className="w-7 h-7 fill-amber-500 text-amber-700 drop-shadow-md" />
                        </div>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center shadow-md border-2 border-white mb-1.5 mt-1">
                          #1
                        </div>
                        <span className="text-xs sm:text-sm font-black text-amber-950 truncate max-w-[95px] sm:max-w-[125px]">
                          {topThree[0]?.username || 'Champion'}
                        </span>
                        <span className="font-mono text-[10px] font-black text-amber-950 bg-white/80 px-2 py-0.5 rounded border border-amber-400 mt-1 shadow-xs">
                          ID: {topThree[0]?.idNumber || '#100001'}
                        </span>
                        <span className="text-[9px] font-black text-emerald-900 bg-emerald-200/95 border border-emerald-500 px-2 py-0.5 rounded-full mt-1.5 shadow-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                          {topThree[0]?.playingMatch || 'Playing Supreme'}
                        </span>
                        <div className="mt-2 text-base font-black text-amber-950">
                          {topThree[0]?.highestScore ?? 0} <span className="text-[10px] font-black text-amber-800">PTS</span>
                        </div>
                      </div>

                      {/* Rank 3 (Right) */}
                      <div className="flex flex-col items-center text-center p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-[#fed7aa]/80 to-[#fdba74]/90 border-2 border-amber-400 relative order-3 shadow-md mt-4">
                        <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white mb-1.5">
                          #3
                        </div>
                        <span className="text-xs font-black text-amber-950 truncate max-w-[85px] sm:max-w-[110px]">
                          {topThree[2]?.username || 'Player 3'}
                        </span>
                        <span className="font-mono text-[10px] font-black text-amber-900 bg-white/70 px-1.5 py-0.5 rounded border border-amber-400 mt-1">
                          ID: {topThree[2]?.idNumber || '#300003'}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-400 px-1.5 py-0.5 rounded-full mt-1.5 truncate max-w-[90px]">
                          {topThree[2]?.playingMatch || 'Playing Arena'}
                        </span>
                        <div className="mt-2 text-sm font-black text-amber-950">
                          {topThree[2]?.highestScore ?? 0} <span className="text-[10px] font-bold text-amber-800">PTS</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BOTTOM PLAYERS SECTION - ACTUAL PLAYERS PLAYING MATCHES WITH THEIR ID NUMBERS (NO BOTTOM PICTURES) */}
                  {remaining.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="px-3 py-1.5 text-[11px] font-extrabold text-[#78350f] flex items-center justify-between border-b-2 border-[#caa050]/50 uppercase tracking-wider bg-[#f8e7ba]/60 rounded-lg">
                        <div className="flex items-center gap-4">
                          <span className="w-7 text-center">RANK</span>
                          <span>ACTIVE MATCH PLAYER & ID</span>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-6">
                          <span className="hidden sm:inline">TIER</span>
                          <span className="w-20 text-right">PEAK SCORE</span>
                        </div>
                      </div>

                      {remaining.map((item) => {
                        const isSelf = item.userId === userId;
                        return (
                          <div
                            key={item.userId}
                            className={`px-3 py-2.5 rounded-xl border-2 flex items-center justify-between transition-all ${
                              isSelf
                                ? 'bg-gradient-to-r from-amber-400/30 via-yellow-300/40 to-amber-400/30 border-amber-600 text-[#451a03] shadow-md ring-2 ring-amber-400/50'
                                : 'bg-[#fffaf0]/80 hover:bg-[#fffdf7] border-[#caa050]/40 text-[#5c2411] shadow-xs'
                            }`}
                          >
                            {/* Left: Rank & Player Info with ID Number (NO PICTURES) */}
                            <div className="flex items-center gap-3">
                              <span className="w-7 text-center font-mono font-black text-xs px-1.5 py-0.5 rounded-lg bg-[#5c2411]/15 text-[#5c2411] border border-[#5c2411]/25">
                                #{item.rank}
                              </span>

                              <div className="leading-tight flex flex-col gap-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm font-black text-[#5c2411] truncate max-w-[130px] sm:max-w-[180px]">
                                    {item.username}
                                  </span>

                                  {/* Player ID Number */}
                                  <span className="font-mono text-[10px] font-black px-1.5 py-0.2 rounded bg-[#5c2411]/10 text-[#78350f] border border-[#78350f]/25">
                                    ID: {item.idNumber}
                                  </span>

                                  {isSelf && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider">
                                      YOU
                                    </span>
                                  )}
                                </div>

                                {/* Active Match Status */}
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-400/70 px-2 py-0.5 rounded-full shadow-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                                    {item.playingMatch || 'Playing ₹50 Ludo Supreme'}
                                  </span>
                                  <span className="text-[10px] font-bold text-[#78350f] hidden sm:inline">
                                    • {item.matchesWon} wins / {item.matchesPlayed} games
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Tier Badge & Highest Score */}
                            <div className="flex items-center gap-3 sm:gap-5">
                              <span
                                className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black border shadow-xs"
                                style={{
                                  backgroundColor: `${item.tierColor}20`,
                                  color: '#451a03',
                                  borderColor: item.tierColor,
                                }}
                              >
                                {item.tier}
                              </span>

                              <div className="w-18 sm:w-20 text-right leading-none">
                                <span className="text-sm sm:text-base font-black text-[#451a03]">
                                  {item.highestScore}
                                </span>
                                <span className="text-[9px] block text-[#78350f] uppercase font-black mt-0.5">
                                  PTS
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* STICKY BOTTOM BAR: YOUR PERSONAL STANDING (NO PICTURES) */}
            <div className="px-4 py-2.5 border-t-2 border-[#caa050]/60 bg-gradient-to-r from-[#f7e4af] via-[#fff4d1] to-[#f7e4af] flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 border-2 border-amber-600 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                  {myStanding?.rank ? `#${myStanding.rank}` : '-'}
                </div>
                <div className="leading-tight">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#5c2411]">
                      Your Standing (YOU)
                    </span>
                    <span className="font-mono text-[10px] font-black text-[#78350f] bg-[#5c2411]/10 px-1.5 py-0.2 rounded border border-[#78350f]/20">
                      ID: {myStanding?.idNumber || '#999999'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#78350f]">
                    {myStanding?.highestScore
                      ? `Peak Score: ${myStanding.highestScore} PTS • ${myStanding.playingMatch || 'Ready for match'}`
                      : 'Play a match to register your official ranking!'}
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
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition-all border border-amber-300"
                >
                  <Swords className="w-3.5 h-3.5 fill-slate-950" />
                  Play & Climb
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
