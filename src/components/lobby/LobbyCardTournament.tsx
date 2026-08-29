import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Trophy, Sparkles, DollarSign, Coins } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import { usePlatformMode } from '../../hooks/usePlatformMode';

interface LobbyCardTournamentProps {
  onPlay: () => void;
}

export const LobbyCardTournament: React.FC<LobbyCardTournamentProps> = ({ onPlay }) => {
  const { platformMode, isCryptoMode } = usePlatformMode();
  // Dynamic countdown timer for "Closes in 06d 10h"
  const [timeLeft, setTimeLeft] = useState({ days: 6, hours: 10, minutes: 42, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      id="lobby-card-mega-tournament"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="relative w-full rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(40,10,80,0.55)] border border-purple-400/30 bg-gradient-to-b from-[#49168f] via-[#24105a] to-[#150a36] p-4 select-none flex flex-col justify-between"
    >
      {/* Background Starry Nebula Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-pink-500/20 blur-3xl" />
      </div>

      {/* Top Countdown Pill Banner (matching reference: "Closes in 06d 10h") */}
      <div className="relative z-10 flex justify-center -mt-1 mb-2">
        <div className="inline-flex items-center gap-1.5 bg-emerald-500/90 border border-emerald-300/60 shadow-[0_2px_8px_rgba(16,185,129,0.4)] px-3.5 py-1 rounded-full text-white text-[11px] font-extrabold tracking-wide">
          <Clock className="w-3 h-3 text-white" />
          <span>
            Closes in {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
          </span>
        </div>
      </div>

      {/* Main Headline: "Play for FREE & Win Up to Cash!" */}
      <div className="relative z-10 text-center mb-3">
        <p className="text-white text-xs sm:text-sm font-bold tracking-wide">
          Play for <span className="text-emerald-300 font-extrabold uppercase">FREE</span> & Win
        </p>
        <h3 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight drop-shadow-[0_2px_10px_rgba(251,191,36,0.6)]">
          {isCryptoMode ? 'Up to $50K USDT!' : 'Up to ₹50,000 Cash!'}
        </h3>
      </div>

      {/* Middle Dual Badge Row: "40 Lakh Winners" & "1st Prize $50,000 / ₹50,000" */}
      <div className="relative z-10 grid grid-cols-2 gap-3 items-center mb-3">
        {/* Left Badge: 40 Lakh Winners */}
        <div className="relative bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-2.5 rounded-xl border border-amber-300/40 shadow-lg text-center flex flex-col items-center justify-center">
          <div className="text-[13px] sm:text-sm font-black text-white uppercase tracking-wider drop-shadow">
            40 Lakh
          </div>
          <div className="bg-emerald-800/90 text-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full mt-1 border border-emerald-400/40 flex items-center gap-1">
            <span>★</span>
            <span>WINNERS</span>
            <span>★</span>
          </div>
        </div>

        {/* Right Badge: Cash Visual + Prize Box */}
        <div className="relative flex flex-col items-center">
          {/* Fan of Cash Notes / Trophy Visual */}
          <div className="relative -mb-2 z-10 flex items-center justify-center">
            <div className="w-14 h-8 bg-emerald-700 rounded border border-emerald-300 shadow-md rotate-[-12deg] -mr-3 flex items-center justify-center text-[9px] font-black text-emerald-100">
              {isCryptoMode ? <DollarSign className="w-3 h-3 text-emerald-200" /> : <span className="text-xs font-black">₹</span>}
            </div>
            <div className="w-14 h-8 bg-emerald-600 rounded border border-emerald-200 shadow-md rotate-[12deg] flex items-center justify-center text-[9px] font-black text-white">
              {isCryptoMode ? <DollarSign className="w-3.5 h-3.5 text-white" /> : <span className="text-xs font-black">₹</span>}
            </div>
            {/* Golden Trophy Center */}
            <div className="absolute -top-1 w-6 h-6 rounded-full bg-amber-400 border border-yellow-200 flex items-center justify-center shadow-md text-amber-950">
              <Trophy className="w-3.5 h-3.5 fill-amber-950 stroke-[2.5]" />
            </div>
          </div>

          {/* Purple Prize Box */}
          <div className="w-full bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 border border-purple-400/50 rounded-xl px-2 py-1.5 text-center shadow-md z-0">
            <span className="block text-[9.5px] font-bold text-purple-200 uppercase tracking-wide">
              1st Prize
            </span>
            <span className="block text-sm sm:text-base font-black text-amber-300 tracking-wide drop-shadow">
              {platformMode.currencySymbol}50,000
            </span>
          </div>
        </div>
      </div>

      {/* Small Legal Disclaimer (as seen on real Zupee screen) */}
      <p className="relative z-10 text-[9px] text-slate-400 text-center leading-tight mb-3 px-2">
        All games on Zupee are free to play and skill based, and do not involve staking, wagering or betting of any kind.
      </p>

      {/* Big Full-Width Yellow "Play Now" Button */}
      <motion.button
        id="tournament-play-btn"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          SoundManager.play('click');
          onPlay();
        }}
        className="relative z-10 w-full bg-gradient-to-b from-[#ffea30] via-[#ffd000] to-[#e6b800] hover:from-[#fff04d] hover:to-[#ffd000] text-slate-950 font-black text-base sm:text-lg py-3 rounded-full shadow-[0_6px_20px_rgba(255,208,0,0.5)] border border-yellow-200 active:brightness-95 flex items-center justify-center gap-2 transition-all"
      >
        <Sparkles className="w-4 h-4 text-amber-900 fill-amber-900" />
        <span>Play Now</span>
      </motion.button>
    </motion.div>
  );
};
