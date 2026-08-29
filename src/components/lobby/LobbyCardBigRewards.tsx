import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Sparkles, Trophy, Flame } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import leagueBgImg from '../../assets/images/ludo_supreme_league_ticket_bg_1787019798437.jpg';
import { usePlatformMode } from '../../hooks/usePlatformMode';

interface LobbyCardBigRewardsProps {
  onOpenLeague: () => void;
}

export const LobbyCardBigRewards: React.FC<LobbyCardBigRewardsProps> = ({
  onOpenLeague,
}) => {
  const { platformMode, isCryptoMode } = usePlatformMode();
  // Live ticking countdown timer
  const [timeLeft, setTimeLeft] = useState({ hours: 1, minutes: 14, seconds: 40 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 2, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedHours = String(timeLeft.hours).padStart(2, '0');
  const formattedMinutes = String(timeLeft.minutes).padStart(2, '0');

  return (
    <div className="w-full flex flex-col items-start gap-2.5 select-none pt-1">
      {/* SECTION HEADER: "Big Rewards" */}
      <div className="flex items-center justify-between w-full px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center shadow-[0_2px_8px_rgba(245,158,11,0.4)]">
            <Flame className="w-4 h-4 fill-white text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 drop-shadow-sm flex items-center gap-1.5">
              Big Rewards
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
          <Trophy className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>Mega League</span>
        </div>
      </div>

      {/* TICKET / VOUCHER STYLED CARD CONTAINER */}
      <motion.div
        id="lobby-card-big-rewards"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -3 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          SoundManager.play('click');
          onOpenLeague();
        }}
        className="relative w-full rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(20,4,45,0.65)] hover:shadow-[0_20px_45px_rgba(245,158,11,0.3)] border-2 border-amber-400/80 bg-white cursor-pointer group flex items-stretch transition-all duration-300 min-h-[175px] select-none"
      >
        {/* ================= LEFT SECTION: ROYAL BLUE GRADIENT & 3D ARTWORK ================= */}
        <div className="relative w-[56%] bg-[#170c38] p-4 flex flex-col justify-between overflow-hidden text-white">
          {/* 3D Background Artwork - Crisp and Sharp */}
          <img
            src={leagueBgImg}
            alt="Ludo Supreme League 3D"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500 ease-out select-none"
          />

          {/* Vignette Overlays for perfect legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0726]/90 via-transparent to-[#180d3e]/50 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f0726]/75 via-transparent to-transparent pointer-events-none" />

          {/* Shimmer sweep effect on hover */}
          <motion.div
            className="absolute -inset-full w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
          />

          {/* Top Title with Underline */}
          <div className="relative z-10">
            <h3 className="text-lg sm:text-xl font-black leading-tight text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Ludo<br />Supreme League
            </h3>
            {/* Accent Underline */}
            <div className="w-10 h-1 bg-amber-400 rounded-full mt-1.5 shadow-[0_1px_4px_rgba(245,158,11,0.8)]" />
          </div>

          {/* Bottom First Prize Block */}
          <div className="relative z-10 mt-3">
            <div className="text-[10px] sm:text-[11px] font-extrabold tracking-wider text-amber-300 uppercase">
              FIRST PRIZE
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] flex items-center leading-none mt-0.5">
              <span>{platformMode.currencySymbol}50</span>
              <span className="text-[11px] font-bold text-amber-300 ml-1.5 opacity-90">({platformMode.platformCurrency})</span>
            </div>
          </div>
        </div>

        {/* ================= CENTER ZIGZAG / PERFORATED TICKET DIVIDER ================= */}
        <div className="relative w-4 -ml-2 -mr-2 z-20 flex flex-col justify-between items-center pointer-events-none overflow-hidden">
          {/* Top Ticket Punch Hole */}
          <div className="w-4 h-4 rounded-full bg-slate-100 border-b border-slate-300/60 -mt-2 shadow-inner" />

          {/* Perforated Zigzag Teeth Line */}
          <div className="flex-1 w-full flex flex-col items-center justify-around py-1 opacity-90">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={`perforate-tooth-${i}`}
                className="w-1.5 h-1.5 rotate-45 bg-slate-200 shadow-[0_0_1px_rgba(0,0,0,0.2)] my-0.5"
              />
            ))}
          </div>

          {/* Bottom Ticket Punch Hole */}
          <div className="w-4 h-4 rounded-full bg-slate-100 border-t border-slate-300/60 -mb-2 shadow-inner" />
        </div>

        {/* ================= RIGHT SECTION: LIGHT CARD STUB ================= */}
        <div className="relative flex-1 bg-gradient-to-b from-white via-slate-50 to-slate-100 p-3 sm:p-4 flex flex-col justify-between items-center text-center">
          {/* Top Closes-in Pill Badge */}
          <div className="w-full flex justify-end -mt-0.5">
            <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full text-emerald-700 text-[10.5px] font-black shadow-sm">
              <Clock className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>
                Closes in {formattedHours}h {formattedMinutes}m
              </span>
            </div>
          </div>

          {/* Center Metric: 65000 Assured Winners */}
          <div className="my-auto py-1">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              65000
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-600 leading-tight mt-0.5">
              Assured Winners
            </div>
          </div>

          {/* Bottom Entry Button */}
          <div className="w-full flex flex-col items-center mt-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
              ENTRY
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                SoundManager.play('click');
                onOpenLeague();
              }}
              className="w-full max-w-[130px] py-1.5 px-4 rounded-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-black text-sm sm:text-base shadow-[0_4px_14px_rgba(34,197,94,0.45)] border border-emerald-400 active:brightness-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
              <span>Free</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
