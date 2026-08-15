import React from 'react';
import { motion } from 'motion/react';
import { Play, Sparkles, Zap, ShieldAlert } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import { RealisticSnakeAndStairs } from './RealisticSnakeAndStairs';

interface LobbyCardSnakeLudoProps {
  onPlay: () => void;
}

export const LobbyCardSnakeLudo: React.FC<LobbyCardSnakeLudoProps> = ({
  onPlay,
}) => {
  return (
    <motion.div
      id="lobby-card-snake-ludo"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="relative w-full rounded-2xl overflow-hidden shadow-[0_10px_25px_rgba(5,30,20,0.5)] border border-emerald-500/30 bg-gradient-to-r from-[#062417] via-[#0d3b2c] to-[#1a1236] p-4 select-none min-h-[175px] flex flex-col justify-between"
    >
      {/* Background Snake Scales Texture & Subtle Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <div
          className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl animate-pulse"
          style={{ animationDuration: '5s' }}
        />
        <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-purple-600/20 blur-2xl" />
      </div>

      {/* Decorative Floating Sparkles */}
      <div className="absolute top-4 left-24 pointer-events-none">
        <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
      </div>
      <div className="absolute bottom-4 right-28 pointer-events-none">
        <Sparkles className="w-3 h-3 text-amber-300 animate-ping opacity-60" style={{ animationDuration: '2.5s' }} />
      </div>

      {/* Top Header Section inside Card: Game Mode Badge */}
      <div className="relative z-10 flex items-center justify-between">
        {/* Left: Quick Mode Tag */}
        <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-300">
          <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
          <span>FAST 5-MIN RUSH</span>
        </div>

        {/* Right: Quick Rules Tag */}
        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-200 bg-emerald-900/40 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          <span>⚡ Ladders Up • Snakes Down</span>
        </div>
      </div>

      {/* Center & Bottom: Realistic 3D Animated Snake & Stairs Illustration + Snake Ludo Title & Play Button */}
      <div className="relative z-10 flex items-center justify-between mt-1">
        {/* Left Visual: Realistic Animated 3D Snake & Stairs */}
        <div className="relative -ml-2">
          <RealisticSnakeAndStairs />
        </div>

        {/* Right: Title, Subtitle, and Yellow Start Button */}
        <div className="flex flex-col items-end text-right pl-2 flex-1 z-20">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-tight">
            Snake Ludo
          </h2>
          <p className="text-[10.5px] font-medium text-emerald-200/90 mt-0.5 mb-2.5">
            Climb Ladders & Dodge Snakes!
          </p>

          {/* Yellow Action Button with Play Icon */}
          <motion.button
            id="snake-ludo-play-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              SoundManager.play('click');
              onPlay();
            }}
            className="bg-gradient-to-b from-[#ffea30] via-[#ffd000] to-[#e6b800] hover:from-[#fff04d] hover:to-[#ffd000] text-slate-950 font-black text-xs sm:text-sm px-5 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-[0_4px_14px_rgba(255,208,0,0.45)] border border-yellow-200 active:brightness-95 flex items-center gap-1.5 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
            <span>Play Now</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
