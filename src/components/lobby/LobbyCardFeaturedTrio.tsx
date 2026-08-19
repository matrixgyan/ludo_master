import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, Trophy, Flame } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';

// 3D Generated Assets
import supremeTallImg from '../../assets/images/ludo_supreme_tall_card_1787035763000.jpg';
import snakeLadderImg from '../../assets/images/snakes_ladder_game_card_1787035781738.jpg';
import ludoTurboImg from '../../assets/images/ludo_turbo_speed_card_1787035796849.jpg';

interface LobbyCardFeaturedTrioProps {
  onPlaySupreme: () => void;
  onPlaySnakesLadders: () => void;
  onPlayLudoTurbo: () => void;
}

export const LobbyCardFeaturedTrio: React.FC<LobbyCardFeaturedTrioProps> = ({
  onPlaySupreme,
  onPlaySnakesLadders,
  onPlayLudoTurbo,
}) => {
  return (
    <div className="w-full flex flex-col items-start gap-3 select-none pt-1">
      {/* SECTION TITLE */}
      <div className="flex items-center justify-between w-full px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 flex items-center justify-center shadow-[0_2px_8px_rgba(245,158,11,0.35)]">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 drop-shadow-sm">
            Instant Action Arenas
          </h2>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
          <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>Speed Modes</span>
        </div>
      </div>

      {/* 3-CARD ASYMMETRICAL GRID LAYOUT WITH CRISP HIGH-DEFINITION CARDS */}
      <div className="w-full grid grid-cols-2 gap-3 sm:gap-3.5 items-stretch">
        {/* ========================================================================= */}
        {/* 1. LEFT TALL CARD: LUDO SUPREME LEAGUE (Spans full height) */}
        {/* ========================================================================= */}
        <motion.div
          id="card-ludo-supreme-league-tall"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            SoundManager.play('click');
            onPlaySupreme();
          }}
          className="relative rounded-3xl overflow-hidden bg-[#100726] border-2 border-amber-400/80 hover:border-amber-300 shadow-[0_16px_40px_rgba(20,4,45,0.75)] hover:shadow-[0_20px_45px_rgba(245,158,11,0.3)] flex flex-col justify-between cursor-pointer group p-3.5 sm:p-4 min-h-[350px] transition-all duration-300 select-none"
        >
          {/* Background 3D Graphic - Crystal Clear High Definition */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              src={supremeTallImg}
              alt="Ludo Supreme League"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center opacity-95 group-hover:scale-105 transition-transform duration-500 ease-out select-none"
            />
            {/* Dark Vignette & Gradient Overlays for high contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0319] via-[#0a0319]/25 to-[#100726]/50 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f0624]/10 to-[#0a0319]/90 pointer-events-none" />
          </div>

          {/* Shimmer light bar */}
          <motion.div
            className="absolute -inset-full w-[200%] h-full bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
          />

          {/* Top-Right Multiplier Badge */}
          <div className="relative z-10 w-full flex justify-end">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 border border-emerald-300/80 shadow-[0_4px_12px_rgba(16,185,129,0.5)] px-2.5 py-1 rounded-full text-white text-[11px] font-black tracking-wide">
              <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shadow-inner">
                <Zap className="w-2.5 h-2.5 text-amber-900 fill-amber-900" />
              </div>
              <span>Win 10X</span>
            </div>
          </div>

          {/* Center Space for Visual Focus */}
          <div className="flex-1" />

          {/* Bottom Content Area */}
          <div className="relative z-10 w-full flex flex-col items-center text-center gap-3">
            <div className="text-left w-full">
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                Ludo<br />Supreme<br />League
              </h3>
            </div>

            {/* Bright Yellow Pill "Play Now" Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                SoundManager.play('click');
                onPlaySupreme();
              }}
              className="w-full py-2.5 px-4 rounded-full bg-[#ffea00] hover:bg-[#ffd600] text-purple-950 font-black text-sm sm:text-base shadow-[0_6px_20px_rgba(255,234,0,0.5)] border-2 border-yellow-300 active:brightness-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-purple-900 fill-purple-900" />
              <span>Play Now</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* 2. RIGHT STACK: TOP CARD (Snakes & Ladders) + BOTTOM CARD (Ludo Turbo) */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-3 sm:gap-3.5 justify-between">
          {/* ------------------------------------------------------------- */}
          {/* TOP RIGHT: SNAKES & LADDERS */}
          {/* ------------------------------------------------------------- */}
          <motion.div
            id="card-snakes-ladders-trio"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              SoundManager.play('click');
              onPlaySnakesLadders();
            }}
            className="relative rounded-3xl overflow-hidden bg-[#0141a6] border-2 border-blue-300/80 shadow-[0_16px_36px_rgba(2,100,247,0.55)] flex flex-col justify-between cursor-pointer group p-3 sm:p-3.5 flex-1 min-h-[168px] transition-all duration-300 select-none"
          >
            {/* Background 3D Graphic - Sharp & Vivid */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img
                src={snakeLadderImg}
                alt="Snakes and Ladders"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center opacity-95 group-hover:scale-105 transition-transform duration-500 ease-out select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#013894]/90 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Shimmer light bar */}
            <motion.div
              className="absolute -inset-full w-[200%] h-full bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }}
            />

            {/* Top Live Badge */}
            <div className="relative z-10 w-full flex justify-end">
              <span className="bg-blue-900/60 border border-blue-200/60 text-white text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-sm">
                Classic 3D
              </span>
            </div>

            {/* Bottom Title & Yellow Play Button */}
            <div className="relative z-10 w-full flex flex-col items-center text-center gap-2">
              <h4 className="text-sm sm:text-base font-black text-white leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                Snakes &amp; Ladders
              </h4>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  SoundManager.play('click');
                  onPlaySnakesLadders();
                }}
                className="w-full py-2 px-3 rounded-full bg-[#ffea00] hover:bg-[#ffd600] text-blue-950 font-black text-xs sm:text-sm shadow-[0_4px_16px_rgba(255,234,0,0.45)] border-2 border-yellow-300 active:brightness-95 transition-all flex items-center justify-center gap-1"
              >
                <span>Play Now</span>
              </motion.button>
            </div>
          </motion.div>

          {/* ------------------------------------------------------------- */}
          {/* BOTTOM RIGHT: LUDO TURBO */}
          {/* ------------------------------------------------------------- */}
          <motion.div
            id="card-ludo-turbo-trio"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              SoundManager.play('click');
              onPlayLudoTurbo();
            }}
            className="relative rounded-3xl overflow-hidden bg-[#16171a] border-2 border-amber-400/60 shadow-[0_16px_36px_rgba(0,0,0,0.7)] flex flex-col justify-between cursor-pointer group p-3 sm:p-3.5 flex-1 min-h-[168px] transition-all duration-300 select-none"
          >
            {/* Background 3D Graphic - Sharp & Crisp */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img
                src={ludoTurboImg}
                alt="Ludo Turbo Speed"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center opacity-95 group-hover:scale-105 transition-transform duration-500 ease-out select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111215]/95 via-[#111215]/40 to-transparent pointer-events-none" />
            </div>

            {/* Shimmer light bar */}
            <motion.div
              className="absolute -inset-full w-[200%] h-full bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 1.9, ease: 'easeInOut' }}
            />

            {/* Top Turbo Fast Badge */}
            <div className="relative z-10 w-full flex justify-end">
              <div className="flex items-center gap-1 bg-amber-500 border border-amber-200 text-slate-950 text-[9.5px] font-black px-2.5 py-0.5 rounded-full tracking-wider shadow-[0_2px_8px_rgba(245,158,11,0.4)]">
                <Flame className="w-3 h-3 fill-slate-950 text-slate-950" />
                <span>Fast 1m</span>
              </div>
            </div>

            {/* Bottom Title & Yellow Play Button */}
            <div className="relative z-10 w-full flex flex-col items-center text-center gap-2">
              <h4 className="text-sm sm:text-base font-black text-white leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                Ludo Turbo
              </h4>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  SoundManager.play('click');
                  onPlayLudoTurbo();
                }}
                className="w-full py-2 px-3 rounded-full bg-[#ffea00] hover:bg-[#ffd600] text-slate-950 font-black text-xs sm:text-sm shadow-[0_4px_16px_rgba(255,234,0,0.45)] border-2 border-yellow-300 active:brightness-95 transition-all flex items-center justify-center gap-1"
              >
                <span>Play Now</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
