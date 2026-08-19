import React from 'react';
import { Bell, User, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { SoundManager } from '../../audio/soundManager';

interface LobbyHeaderProps {
  balance?: number;
  usdtBalance?: string;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenWallet?: () => void;
}

export const LobbyHeader: React.FC<LobbyHeaderProps> = ({
  usdtBalance = '$0.00',
  onOpenNotifications,
  onOpenProfile,
  onOpenWallet,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#0a0d24]/95 backdrop-blur-md px-3.5 py-2.5 border-b border-white/10 flex items-center justify-between shadow-lg select-none">
      {/* Left: Brand Badge */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 border border-yellow-200 shadow-md shadow-amber-500/20 flex items-center justify-center text-slate-950 font-black">
          <Zap className="w-4 h-4 fill-slate-950 stroke-[2.5]" />
        </div>
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent uppercase drop-shadow">
              Ludo Supreme
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="text-[9px] font-bold text-slate-400 tracking-tight">On-Chain Arena</span>
        </div>
      </div>

      {/* Right Controls: Notifications, USDT Vault, Profile Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Bell */}
        <motion.button
          id="lobby-notifications-btn"
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            SoundManager.play('click');
            onOpenNotifications();
          }}
          className="relative w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0a0d24]" />
        </motion.button>

        {/* Unified USDT Multi-Chain Vault Pill */}
        <motion.button
          id="lobby-usdt-vault-btn"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          onClick={() => {
            SoundManager.play('click');
            if (onOpenWallet) onOpenWallet();
          }}
          className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/70 hover:from-emerald-900 hover:to-teal-900 border border-emerald-500/50 rounded-full pl-2 pr-2.5 py-1 shadow-[0_2px_12px_rgba(16,185,129,0.25)] transition-all group cursor-pointer"
          title="Unified USDT Multi-Chain Vault"
        >
          {/* Emerald USDT Icon */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-300 border border-emerald-200 flex items-center justify-center text-slate-950 font-black text-[10px] shadow-sm">
            ₮
          </div>

          {/* USDT Amount */}
          <span className="text-emerald-300 font-black text-xs sm:text-sm tracking-tight flex items-center">
            {usdtBalance} <span className="text-[10px] text-emerald-400/90 font-extrabold ml-1">USDT</span>
          </span>
        </motion.button>

        {/* User Profile Avatar */}
        <motion.button
          id="lobby-profile-btn"
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            SoundManager.play('click');
            onOpenProfile();
          }}
          className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 border-2 border-purple-300/60 p-0.5 flex items-center justify-center shadow-md overflow-hidden cursor-pointer"
          title="Player Profile"
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
            alt="Player Avatar"
            className="w-full h-full object-cover rounded-full"
          />
        </motion.button>
      </div>
    </header>
  );
};
