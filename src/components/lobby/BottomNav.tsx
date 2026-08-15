import React from 'react';
import { motion } from 'motion/react';
import { Home, PlaySquare, WalletCards, Users2 } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';

export type NavTab = 'home' | 'studio' | 'refer' | 'wallet';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

interface TabConfig {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    color: string;
    pulse?: boolean;
  };
  activeColor: {
    text: string;
    iconBg: string;
    glow: string;
    border: string;
    lightBar: string;
  };
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs: TabConfig[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      activeColor: {
        text: 'text-amber-300',
        iconBg: 'from-amber-400 to-yellow-500',
        glow: 'rgba(251, 191, 36, 0.4)',
        border: 'border-amber-400/40',
        lightBar: 'from-amber-400 via-yellow-300 to-amber-500',
      },
    },
    {
      id: 'studio',
      label: 'Studio',
      icon: PlaySquare,
      activeColor: {
        text: 'text-rose-300',
        iconBg: 'from-rose-500 to-pink-600',
        glow: 'rgba(244, 63, 94, 0.4)',
        border: 'border-rose-400/40',
        lightBar: 'from-rose-500 via-pink-400 to-rose-600',
      },
    },
    {
      id: 'refer',
      label: 'Refer',
      icon: Users2,
      activeColor: {
        text: 'text-emerald-300',
        iconBg: 'from-emerald-400 to-teal-500',
        glow: 'rgba(52, 211, 153, 0.4)',
        border: 'border-emerald-400/40',
        lightBar: 'from-emerald-400 via-teal-300 to-emerald-500',
      },
    },
    {
      id: 'wallet',
      label: 'Assets',
      icon: WalletCards,
      activeColor: {
        text: 'text-teal-300',
        iconBg: 'from-emerald-400 via-teal-400 to-cyan-500',
        glow: 'rgba(20, 184, 166, 0.4)',
        border: 'border-teal-400/40',
        lightBar: 'from-emerald-400 via-teal-300 to-cyan-400',
      },
    },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none flex justify-center pb-2 px-3 sm:px-4">
      {/* Floating Curved Luxury Nav Container */}
      <nav
        id="bottom-lobby-navigation"
        className="pointer-events-auto relative w-full max-w-lg bg-gradient-to-b from-[#13072f]/95 via-[#0b031d]/98 to-[#060112]/98 backdrop-blur-2xl rounded-3xl border border-white/15 px-2.5 py-2 shadow-[0_10px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(107,33,168,0.25)] flex items-center justify-around select-none"
      >
        {/* Subtle Ambient Top Border Highlight */}
        <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-purple-300/40 to-transparent pointer-events-none" />

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              id={`bottom-nav-${tab.id}`}
              onClick={() => {
                SoundManager.play('click');
                onSelectTab(tab.id);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className="relative flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-colors cursor-pointer group"
            >
              {/* Active Tab Sliding Island Glow */}
              {isActive && (
                <motion.div
                  layoutId="active-tab-glow"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 shadow-inner pointer-events-none"
                />
              )}

              {/* Active Top Colored Light Bar */}
              {isActive && (
                <motion.div
                  layoutId="active-tab-lightbar"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className={`absolute -top-2 w-10 h-1 rounded-full bg-gradient-to-r ${tab.activeColor.lightBar} shadow-[0_0_12px_rgba(255,255,255,0.8)]`}
                />
              )}

              {/* Icon Container with 3D Depth & Active Specular Sheen */}
              <div className="relative flex items-center justify-center mb-1">
                {/* Micro Pill Badge if defined */}
                {tab.badge && (
                  <span
                    className={`absolute -top-1.5 -right-3 text-[8.5px] px-1.5 py-0.2 rounded-full leading-tight font-black z-20 flex items-center gap-0.5 border border-white/20 ${
                      tab.badge.color
                    }`}
                  >
                    {tab.badge.pulse && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-0.5" />
                    )}
                    {tab.badge.text}
                  </span>
                )}

                {/* 3D Circular Backdrop for Active Tab */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-tr ${tab.activeColor.iconBg} text-slate-950 shadow-lg border border-white/40 scale-105`
                      : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-slate-200 border border-white/5'
                  }`}
                  style={{
                    boxShadow: isActive ? `0 4px 18px ${tab.activeColor.glow}` : undefined,
                  }}
                >
                  <Icon
                    className={`w-4.5 h-4.5 transition-transform ${
                      isActive ? 'stroke-[2.5] scale-105' : 'stroke-2'
                    }`}
                  />
                </div>
              </div>

              {/* Label Text */}
              <span
                className={`text-[10.5px] font-extrabold tracking-tight transition-all duration-200 ${
                  isActive
                    ? `${tab.activeColor.text} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
};
