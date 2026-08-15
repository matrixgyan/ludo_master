import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Trophy, Users, Flame } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import { RealisticLudoDiceAndPawns } from './RealisticLudoDiceAndPawns';

interface LobbyCardLudoProps {
  onPlay: () => void;
}

export const LobbyCardLudo: React.FC<LobbyCardLudoProps> = ({ onPlay }) => {
  return (
    <motion.div
      id="lobby-card-ludo-supreme"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative w-full rounded-2xl overflow-hidden shadow-[0_10px_25px_rgba(10,25,80,0.5)] border border-blue-400/30 bg-gradient-to-br from-[#1239aa] via-[#0d2677] to-[#081548] p-4 select-none min-h-[175px] flex flex-col justify-between"
    >
      {/* Background Radiating Speed-Lines & Starfield Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
        <div
          className="absolute inset-[-50%] bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.5)_0%,rgba(13,38,119,0)_70%)] animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        {/* Decorative Sunburst Rays */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[conic-gradient(from_0deg,transparent_0deg_15deg,rgba(255,255,255,0.08)_15deg_30deg,transparent_30deg_45deg,rgba(255,255,255,0.08)_45deg_60deg,transparent_60deg_75deg,rgba(255,255,255,0.08)_75deg_90deg,transparent_90deg_105deg,rgba(255,255,255,0.08)_105deg_120deg,transparent_120deg_135deg,rgba(255,255,255,0.08)_135deg_150deg,transparent_150deg_165deg,rgba(255,255,255,0.08)_165deg_180deg,transparent_180deg_195deg,rgba(255,255,255,0.08)_195deg_210deg,transparent_210deg_225deg,rgba(255,255,255,0.08)_225deg_240deg,transparent_240deg_255deg,rgba(255,255,255,0.08)_255deg_270deg,transparent_270deg_285deg,rgba(255,255,255,0.08)_285deg_300deg,transparent_300deg_315deg,rgba(255,255,255,0.08)_315deg_330deg,transparent_330deg_345deg,rgba(255,255,255,0.08)_345deg_360deg)] opacity-40 animate-[spin_24s_linear_infinite]" />
      </div>

      {/* Floating Sparkles in Space */}
      <div className="absolute top-3 left-10 pointer-events-none">
        <Sparkles className="w-4 h-4 text-blue-200 animate-bounce opacity-80" />
      </div>
      <div className="absolute bottom-6 left-28 pointer-events-none">
        <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
      </div>
      <div className="absolute top-6 right-20 pointer-events-none">
        <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-ping opacity-60" style={{ animationDuration: '3s' }} />
      </div>

      {/* Top Banner Tag */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-blue-950/70 border border-blue-400/40 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-bold text-cyan-300">
          <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>#1 MOST POPULAR</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-200 bg-blue-900/40 px-2 py-0.5 rounded-full">
          <Users className="w-3 h-3 text-blue-300" />
          <span>2.4M Live</span>
        </div>
      </div>

      {/* Main Content Layout: Photorealistic 3D Clashing Visual on Left, Title + Action on Right */}
      <div className="relative z-10 flex items-center justify-between mt-1">
        {/* Left: Photorealistic 3D Animated Dice & Colliding Pawns */}
        <div className="relative -ml-2">
          <RealisticLudoDiceAndPawns />
        </div>

        {/* Right: Title & High-Energy "Play Now" Button */}
        <div className="flex flex-col items-end text-right pl-2 z-20">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-tight">
            Ludo Supreme
          </h2>
          <p className="text-[11px] font-medium text-blue-200/90 mt-0.5 mb-3 flex items-center gap-1 justify-end">
            <Trophy className="w-3 h-3 text-amber-300" />
            <span>Classic 4-Player Battle</span>
          </p>

          {/* Bright Yellow Pill "Play Now" Button */}
          <motion.button
            id="ludo-supreme-play-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              SoundManager.play('click');
              onPlay();
            }}
            className="bg-gradient-to-b from-[#ffea30] via-[#ffd000] to-[#e6b800] hover:from-[#fff04d] hover:to-[#ffd000] text-slate-950 font-black text-sm sm:text-base px-6 sm:px-7 py-2 sm:py-2.5 rounded-full shadow-[0_4px_16px_rgba(255,208,0,0.5)] border border-yellow-200 active:brightness-95 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Play Now</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
