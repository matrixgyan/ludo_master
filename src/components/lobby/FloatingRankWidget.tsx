import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
  Award,
  Crown,
  Sparkles,
  Swords,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';

interface UserDailySummary {
  todayHighestScore: number;
  dailyRank: number | null;
  tier: {
    tier: string;
    badge: string;
    color: string;
    minScore: number;
    nextMinScore: number | null;
  };
  matchesPlayedToday: number;
  activeTournament: {
    id: string;
    title: string;
    gameType: string;
    matchesPlayed: number;
    maxMatches: number;
    highestScore: number;
    isCompleted: boolean;
  } | null;
}

interface FloatingRankWidgetProps {
  userId?: string;
  onOpenLeaderboard?: () => void;
  onOpenLeague?: () => void;
}

export const FloatingRankWidget: React.FC<FloatingRankWidgetProps> = ({
  userId = 'default_user',
  onOpenLeaderboard,
  onOpenLeague,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [autoCollapseProgress, setAutoCollapseProgress] = useState<number>(100);
  const [summary, setSummary] = useState<UserDailySummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch real daily user rank and score stats
  const fetchRankSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/leaderboard/user-daily-rank?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSummary(data);
        }
      }
    } catch (err) {
      console.warn('Failed to load user daily rank summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRankSummary();
    const interval = setInterval(fetchRankSummary, 20000);
    return () => clearInterval(interval);
  }, [fetchRankSummary]);

  // Auto-collapse after 5 seconds when expanded
  useEffect(() => {
    if (isExpanded) {
      setAutoCollapseProgress(100);
      const DURATION = 5000;
      const INTERVAL = 50;
      const step = (INTERVAL / DURATION) * 100;

      progressIntervalRef.current = setInterval(() => {
        setAutoCollapseProgress((prev) => Math.max(0, prev - step));
      }, INTERVAL);

      timerRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, DURATION);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isExpanded]);

  const toggleExpand = () => {
    SoundManager.play('click');
    setIsExpanded((prev) => !prev);
  };

  const highestScore = summary?.todayHighestScore ?? 0;
  const rank = summary?.dailyRank;
  const tier = summary?.tier ?? {
    tier: 'Challenger',
    badge: '🥉',
    color: '#cd7f32',
    minScore: 1,
    nextMinScore: 401,
  };
  const activeTourn = summary?.activeTournament;

  // Calculate progress to next tier
  let tierProgress = 100;
  let ptsToNextTier = 0;
  if (tier.nextMinScore) {
    const range = tier.nextMinScore - tier.minScore;
    const currentOverMin = Math.max(0, highestScore - tier.minScore);
    tierProgress = Math.min(100, Math.max(5, Math.round((currentOverMin / range) * 100)));
    ptsToNextTier = Math.max(0, tier.nextMinScore - highestScore);
  }

  return (
    <div
      id="docked-rank-widget-container"
      className="fixed right-0 top-[48%] -translate-y-1/2 z-40 select-none flex items-center justify-end"
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* COLLAPSED STATE: Clean, sleek right-docked badge */
          <motion.button
            key="collapsed-rank-tab"
            id="floating-rank-btn-collapsed"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            whileHover={{ scale: 1.05, x: -3 }}
            whileTap={{ scale: 0.96 }}
            onClick={toggleExpand}
            className="group flex items-center gap-2 bg-[#120a2a]/95 hover:bg-[#1c103e] text-white pl-3 pr-2.5 py-2.5 rounded-l-2xl border-y border-l border-amber-400/40 shadow-[0_8px_25px_rgba(0,0,0,0.7)] backdrop-blur-md cursor-pointer transition-colors"
            title="Click to view daily rank & high score"
          >
            {/* Animated Left Arrow */}
            <motion.div
              animate={{ x: [0, -3, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="text-amber-400"
            >
              <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            </motion.div>

            {/* Tier Badge / Trophy */}
            <div
              className="relative w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shadow-inner"
              style={{ backgroundColor: `${tier.color}25`, border: `1.5px solid ${tier.color}` }}
            >
              <span>{tier.badge}</span>
              {rank && rank <= 3 && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                </span>
              )}
            </div>

            {/* Rank & Score Info */}
            <div className="flex flex-col items-start leading-none pr-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Today
                </span>
                {activeTourn && (
                  <span className="text-[9px] font-semibold text-amber-300 bg-amber-500/20 px-1 rounded">
                    {activeTourn.matchesPlayed}/{activeTourn.maxMatches}
                  </span>
                )}
              </div>
              <span className="text-sm font-black text-amber-300 drop-shadow-sm flex items-center gap-1 mt-0.5">
                {rank ? `#${rank}` : 'Unranked'}
                <span className="text-[11px] font-bold text-slate-300">
                  {highestScore > 0 ? `${highestScore} pts` : ''}
                </span>
              </span>
            </div>
          </motion.button>
        ) : (
          /* EXPANDED STATE: Clean, purpose-built card with real highest-score standings */
          <motion.div
            key="expanded-rank-card"
            id="floating-rank-card-expanded"
            initial={{ x: 120, opacity: 0, scale: 0.94 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 120, opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="relative mr-2 w-72 sm:w-80 rounded-2xl bg-gradient-to-br from-[#12082b] via-[#0c051f] to-[#080315] border border-amber-400/40 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-white overflow-hidden"
          >
            {/* Auto-collapse Progress Bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-white/5">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-75"
                style={{ width: `${autoCollapseProgress}%` }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm"
                  style={{ backgroundColor: `${tier.color}25`, border: `1px solid ${tier.color}60` }}
                >
                  <span>{tier.badge}</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                    Daily Standings
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Live
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">Based on highest score today</p>
                </div>
              </div>

              {/* Close / Collapse Button */}
              <button
                onClick={toggleExpand}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Collapse"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Rank & Score Spotlight */}
            <div className="my-3 p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Highest Score Today
                </span>
                <div className="text-2xl font-black text-amber-300 tracking-tight flex items-baseline gap-1 mt-0.5">
                  {highestScore > 0 ? (
                    <>
                      {highestScore}{' '}
                      <span className="text-xs font-bold text-amber-400/80 uppercase">PTS</span>
                    </>
                  ) : (
                    <span className="text-base text-slate-400">No match today</span>
                  )}
                </div>
                <div className="text-[11px] font-medium text-slate-300 mt-0.5 flex items-center gap-1">
                  Daily Rank: {rank ? <span className="font-bold text-emerald-400">#{rank}</span> : 'Unranked'}
                </div>
              </div>

              <div className="text-right">
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: `${tier.color}20`,
                    color: tier.color,
                    border: `1px solid ${tier.color}50`,
                  }}
                >
                  {tier.tier}
                </span>
                <span className="block text-[9.5px] text-slate-400 mt-1">
                  {summary?.matchesPlayedToday ?? 0} matches today
                </span>
              </div>
            </div>

            {/* Active 25-Match Tournament Quota (If Enrolled) */}
            {activeTourn ? (
              <div className="my-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center justify-between text-[10px] font-bold text-amber-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-400" />
                    {activeTourn.title}
                  </span>
                  <span>
                    {activeTourn.matchesPlayed} / {activeTourn.maxMatches}
                  </span>
                </div>
                <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden p-0.5 border border-amber-400/20">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (activeTourn.matchesPlayed / activeTourn.maxMatches) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-300 mt-1">
                  <span>
                    {activeTourn.isCompleted
                      ? '✅ All 25 matches completed!'
                      : `${activeTourn.maxMatches - activeTourn.matchesPlayed} matches remaining`}
                  </span>
                  <span className="font-bold text-amber-300">
                    Best: {activeTourn.highestScore} pts
                  </span>
                </div>
              </div>
            ) : (
              /* Tier Progression Bar */
              tier.nextMinScore && (
                <div className="space-y-1 my-2.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-300 font-medium">
                    <span>Next Tier Milestone</span>
                    <span className="text-amber-300 font-bold">+{ptsToNextTier} PTS needed</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${tierProgress}%`,
                        backgroundColor: tier.color,
                      }}
                    />
                  </div>
                </div>
              )
            )}

            {/* Quick Actions */}
            <div className="pt-2.5 border-t border-white/10 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  SoundManager.play('click');
                  setIsExpanded(false);
                  onOpenLeaderboard?.();
                }}
                className="w-full py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Leaderboard
              </button>

              <button
                onClick={() => {
                  SoundManager.play('click');
                  setIsExpanded(false);
                  onOpenLeague?.();
                }}
                className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-[11px] font-black text-slate-950 flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Swords className="w-3.5 h-3.5 fill-slate-950" />
                Supreme League
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
