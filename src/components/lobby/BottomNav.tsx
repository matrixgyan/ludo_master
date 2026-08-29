import React from 'react';
import { motion } from 'motion/react';
import { Gamepad2, Trophy, Swords, Gift, Wallet, Crown } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';

export type NavTab = 'home' | 'leaderboard' | 'battle' | 'refer' | 'assets' | 'studio';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onBattle?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onBattle,
}) => {
  const handleTabClick = (tabId: NavTab) => {
    SoundManager.play('click');
    if (tabId === 'battle') {
      if (onBattle) onBattle();
      else onSelectTab('battle');
    } else {
      onSelectTab(tabId);
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none flex justify-center pb-2 px-2 sm:px-4 select-none">
      {/* Outer Gaming HUD Wrapper */}
      <div className="pointer-events-auto relative w-full max-w-lg">
        
        {/* ========================================================================= */}
        {/* GAMING PLATFORM HUD DECK CONTAINER */}
        {/* ========================================================================= */}
        <div className="relative w-full">
          
          {/* Ambient Cyber Neon Under-glow */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-cyan-500/20 blur-lg opacity-70 pointer-events-none" />

          {/* Main Chamfered Gaming Bar Chassis */}
          <nav
            id="gaming-hud-navigation"
            className="relative w-full bg-[#0b0518]/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border-2 border-[#ffb703]/60 shadow-[0_12px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(255,183,3,0.15)] px-2 sm:px-3 py-1.5 flex items-center justify-between overflow-visible"
          >
            {/* Top Laser Accent Strip */}
            <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-[#ffd166] to-transparent pointer-events-none" />

            {/* Micro Corner Brackets (AAA Gaming HUD style) */}
            <div className="absolute top-1 left-2 text-[8px] font-mono text-amber-400/40 pointer-events-none tracking-widest">
              SYS.HUD
            </div>
            <div className="absolute top-1 right-2 text-[8px] font-mono text-cyan-400/40 pointer-events-none tracking-widest">
              v2.6
            </div>

            {/* ===================================================================== */}
            {/* 1. LOBBY (Home Arena) */}
            {/* ===================================================================== */}
            <motion.button
              id="hud-nav-home"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleTabClick('home')}
              className="flex-1 flex flex-col items-center justify-center py-1 cursor-pointer group relative"
            >
              {/* Active Tab Hologram Island */}
              {activeTab === 'home' && (
                <motion.div
                  layoutId="hud-active-glow"
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-b from-amber-500/20 via-amber-500/10 to-transparent border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.3)] -z-0"
                />
              )}

              {/* Icon with Glowing Halo */}
              <div
                className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 mb-0.5 ${
                  activeTab === 'home'
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.6)] border border-amber-200 scale-105'
                    : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-amber-300 border border-white/5'
                }`}
              >
                <Gamepad2 className="w-5 h-5 stroke-[2.4]" />
              </div>

              <span
                className={`relative z-10 text-[10.5px] font-black uppercase tracking-wider transition-colors ${
                  activeTab === 'home' ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                Lobby
              </span>
            </motion.button>

            {/* ===================================================================== */}
            {/* 2. LEADERBOARD & LIVE WINNERS */}
            {/* ===================================================================== */}
            <motion.button
              id="hud-nav-leaderboard"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleTabClick('leaderboard')}
              className="flex-1 flex flex-col items-center justify-center py-1 cursor-pointer group relative"
            >
              {(activeTab === 'leaderboard' || activeTab === 'studio') && (
                <motion.div
                  layoutId="hud-active-glow"
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.3)] -z-0"
                />
              )}

              <div
                className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 mb-0.5 ${
                  activeTab === 'leaderboard' || activeTab === 'studio'
                    ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.6)] border border-yellow-200 scale-105'
                    : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-amber-300 border border-white/5'
                }`}
              >
                <Trophy className="w-5 h-5 stroke-[2.4]" />
              </div>

              <span
                className={`relative z-10 text-[10.5px] font-black uppercase tracking-wider transition-colors ${
                  activeTab === 'leaderboard' || activeTab === 'studio' ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                Leaderboard
              </span>
            </motion.button>

            {/* ===================================================================== */}
            {/* 3. CENTER HERO "PLAY / BATTLE" POWER CORE (AAA Gaming Diamond Badge) */}
            {/* ===================================================================== */}
            <div className="relative flex flex-col items-center justify-center -mt-7 sm:-mt-8 mx-1 z-30">
              {/* Outer Energy Pulse Ring */}
              <motion.div
                animate={{ scale: [1, 1.14, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 blur-md opacity-80 -z-10"
              />

              <motion.button
                id="hud-nav-battle"
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleTabClick('battle')}
                className="relative cursor-pointer group focus:outline-none flex flex-col items-center"
              >
                {/* 3D Beveled Industrial Hex-Button */}
                <div className="relative w-[70px] sm:w-[76px] h-[64px] sm:h-[68px] rounded-2xl bg-gradient-to-b from-[#ffd166] via-[#f59e0b] to-[#b45309] p-[2.5px] shadow-[0_10px_25px_rgba(245,158,11,0.6),0_4px_10px_rgba(0,0,0,0.5)] border-b-4 border-[#78350f] flex flex-col items-center justify-between pt-1.5 pb-1 overflow-hidden">
                  
                  {/* Top Specular Arc Sheen */}
                  <div className="absolute top-0 inset-x-2 h-4 bg-gradient-to-b from-white/80 to-transparent rounded-t-xl pointer-events-none" />

                  {/* Dual Crossed Laser Swords */}
                  <div className="relative z-10 text-amber-950 flex items-center justify-center mt-0.5">
                    <Swords className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.8] drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)] animate-pulse" />
                  </div>

                  {/* High-Impact "PLAY" Banner */}
                  <span className="relative z-10 text-[10.5px] sm:text-[11px] font-black uppercase tracking-widest text-[#451a03] leading-none drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] block">
                    PLAY
                  </span>
                </div>
              </motion.button>
            </div>

            {/* ===================================================================== */}
            {/* 4. REWARDS / QUESTS */}
            {/* ===================================================================== */}
            <motion.button
              id="hud-nav-refer"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleTabClick('refer')}
              className="flex-1 flex flex-col items-center justify-center py-1 cursor-pointer group relative"
            >
              {activeTab === 'refer' && (
                <motion.div
                  layoutId="hud-active-glow"
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-b from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] -z-0"
                />
              )}

              <div
                className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 mb-0.5 ${
                  activeTab === 'refer'
                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.6)] border border-emerald-200 scale-105'
                    : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-emerald-300 border border-white/5'
                }`}
              >
                <Gift className="w-5 h-5 stroke-[2.4]" />
              </div>

              <span
                className={`relative z-10 text-[10.5px] font-black uppercase tracking-wider transition-colors ${
                  activeTab === 'refer' ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                Refer
              </span>
            </motion.button>

            {/* ===================================================================== */}
            {/* 5. ASSETS & WALLET */}
            {/* ===================================================================== */}
            <motion.button
              id="hud-nav-assets"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleTabClick('assets')}
              className="flex-1 flex flex-col items-center justify-center py-1 cursor-pointer group relative"
            >
              {activeTab === 'assets' && (
                <motion.div
                  layoutId="hud-active-glow"
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-b from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] -z-0"
                />
              )}

              <div
                className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 mb-0.5 ${
                  activeTab === 'assets'
                    ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.6)] border border-cyan-200 scale-105'
                    : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-cyan-300 border border-white/5'
                }`}
              >
                <Wallet className="w-5 h-5 stroke-[2.4]" />
              </div>

              <span
                className={`relative z-10 text-[10.5px] font-black uppercase tracking-wider transition-colors ${
                  activeTab === 'assets' ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                Assets
              </span>
            </motion.button>
          </nav>
        </div>
      </div>
    </div>
  );
};
