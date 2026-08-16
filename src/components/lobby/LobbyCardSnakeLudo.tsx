import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Flame } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import snakeLudoHeroImg from '../../assets/images/snake_ludo_3d_hero_1786855315006.jpg';

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
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        SoundManager.play('click');
        onPlay();
      }}
      className="relative w-full aspect-[16/9] sm:h-52 rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(4,35,20,0.75)] border-2 border-emerald-400/60 bg-[#041a12] select-none cursor-pointer group transition-all duration-300 flex flex-col justify-between p-3.5"
    >
      {/* 1. BACKGROUND 3D ARTWORK WITH DYNAMIC FLOATING ANIMATION */}
      <motion.img
        src={snakeLudoHeroImg}
        alt="Snake Ludo 3D Arena"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover select-none"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* 2. GLOSS & AMBIENT RADIAL LIGHTING */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/40 via-transparent to-teal-950/40 pointer-events-none" />

      {/* 3. LIGHT SWEEP / SHIMMER EFFECT ACROSS THE CARD */}
      <motion.div
        className="absolute -inset-full w-[200%] h-full bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
      />

      {/* 4. TOP BADGES & LIVE AMBIENCE */}
      <div className="relative z-10 flex items-center justify-between w-full">
        {/* Glowing Emerald Badge */}
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 font-black text-[11px] px-3 py-1 rounded-full shadow-[0_4px_12px_rgba(52,211,153,0.6)] border border-emerald-200 uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5 fill-slate-950" />
          <span>Rush Mode</span>
        </div>

        {/* Floating Sparkles */}
        <motion.div
          animate={{ rotate: [0, 180, 360], scale: [0.9, 1.2, 0.9] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-5 h-5 text-emerald-300 drop-shadow-[0_0_8px_#34d399]" />
        </motion.div>
      </div>

      {/* 5. BOTTOM 3D GOLDEN RIBBON BANNER */}
      <div className="relative z-10 w-full flex items-center justify-center">
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full max-w-[240px] py-1.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 text-slate-950 font-black text-center shadow-[0_6px_20px_rgba(0,0,0,0.8)] border border-yellow-200 uppercase tracking-wide flex items-center justify-center gap-1.5"
        >
          <span className="text-sm sm:text-base font-black tracking-wider text-slate-950 drop-shadow-sm">
            SNAKE LUDO
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};
