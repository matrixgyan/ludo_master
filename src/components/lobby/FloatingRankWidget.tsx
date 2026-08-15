import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Award, Zap, Clock } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';

interface FloatingRankWidgetProps {
  rank?: number;
  onOpenLeaderboard?: () => void;
}

export const FloatingRankWidget: React.FC<FloatingRankWidgetProps> = ({
  rank = 59,
  onOpenLeaderboard,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [autoCollapseProgress, setAutoCollapseProgress] = useState<number>(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-collapse after 4.5 seconds when expanded
  useEffect(() => {
    if (isExpanded) {
      setAutoCollapseProgress(100);
      const DURATION = 4500;
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

  return (
    <div
      id="docked-rank-widget-container"
      className="fixed right-0 top-[48%] -translate-y-1/2 z-40 select-none flex items-center justify-end"
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* COLLAPSED STATE: Sleek Right-Docked Tab */
          <motion.button
            key="collapsed-rank-tab"
            id="floating-rank-btn-collapsed"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            whileHover={{ scale: 1.06, x: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleExpand}
            className="group flex items-center gap-1.5 bg-gradient-to-l from-[#2c0b6b] via-[#43149e] to-[#6b21a8] text-white pl-3 pr-2 py-2 rounded-l-2xl border-y border-l border-amber-300/50 shadow-[0_4px_20px_rgba(107,33,168,0.6)] cursor-pointer"
            title="Click to view your rank details"
          >
            {/* Pulsing Left Chevron Prompt */}
            <motion.div
              animate={{ x: [0, -3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="text-amber-300"
            >
              <ChevronLeft className="w-3.5 h-3.5 stroke-[3]" />
            </motion.div>

            {/* Golden Trophy Icon in Circle */}
            <div className="relative w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-md flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 fill-amber-950 text-amber-950 stroke-[2.5]" />
              <span className="absolute -top-1 -left-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
            </div>

            {/* Text details */}
            <div className="flex flex-col items-start leading-none pr-1">
              <span className="text-[9px] font-bold text-purple-200 uppercase tracking-wider">
                Rank
              </span>
              <span className="text-sm font-black text-amber-300 drop-shadow flex items-center gap-0.5">
                #{rank}
              </span>
            </div>
          </motion.button>
        ) : (
          /* EXPANDED STATE: Interactive Rank Card with Auto-Collapse timer */
          <motion.div
            key="expanded-rank-card"
            id="floating-rank-card-expanded"
            initial={{ x: 120, opacity: 0, scale: 0.92 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 120, opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="relative mr-2 w-72 sm:w-80 rounded-2xl bg-gradient-to-br from-[#1b0844] via-[#130630] to-[#0c0320] border-2 border-amber-400/60 p-3.5 shadow-[0_12px_35px_rgba(0,0,0,0.8)] text-white overflow-hidden"
          >
            {/* Auto-collapse Progress Indicator Bar at Top */}
            <div className="absolute top-0 inset-x-0 h-1 bg-purple-950/80">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-75"
                style={{ width: `${autoCollapseProgress}%` }}
              />
            </div>

            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-400/15 blur-2xl pointer-events-none" />

            {/* Header: Title + Collapse Arrow Button */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
                  <Trophy className="w-3.5 h-3.5 fill-amber-950 text-amber-950 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white tracking-wide">National Standings</h4>
                  <span className="text-[9px] text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Season 14 Live
                  </span>
                </div>
              </div>

              {/* Close / Collapse Button */}
              <button
                onClick={toggleExpand}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                title="Collapse"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Rank Spotlight */}
            <div className="my-2.5 p-2.5 rounded-xl bg-gradient-to-r from-purple-900/60 to-indigo-900/50 border border-purple-400/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-200 uppercase">Your Live Rank</span>
                <div className="text-2xl font-black text-amber-300 tracking-tight flex items-baseline gap-1">
                  #{rank}
                  <span className="text-[10px] font-semibold text-emerald-400 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-0.5 inline" /> +4 today
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-[10px] font-black">
                  Diamond Tier
                </span>
                <span className="block text-[9.5px] text-slate-300 mt-0.5">Top 1.5% Players</span>
              </div>
            </div>

            {/* Points to Next Rank Progress */}
            <div className="space-y-1 my-2">
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                <span>Next Milestone: Rank #50</span>
                <span className="text-amber-300">+140 PTS needed</span>
              </div>
              <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div className="bg-gradient-to-r from-purple-500 via-amber-400 to-yellow-300 h-full rounded-full w-[72%] shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              </div>
            </div>

            {/* Rewards & Footer Notice */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9.5px] text-slate-300">
              <span className="flex items-center gap-1 text-emerald-300 font-bold">
                <Award className="w-3 h-3 text-amber-400" /> $250 Tier Prize
              </span>
              <span className="flex items-center gap-0.5 text-purple-200">
                <Clock className="w-2.5 h-2.5" /> Auto-collapsing...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
