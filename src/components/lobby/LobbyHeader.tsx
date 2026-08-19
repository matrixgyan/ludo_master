import React from 'react';
import { Bell, User, Sparkles, Coins } from 'lucide-react';
import { motion } from 'motion/react';
import { SoundManager } from '../../audio/soundManager';

interface LobbyHeaderProps {
  balance: number;
  usdtBalance?: string;
  onOpenMysteryBox: () => void;
  onOpenShop?: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenWallet?: () => void;
}

export const LobbyHeader: React.FC<LobbyHeaderProps> = ({
  balance,
  usdtBalance = '$0.00',
  onOpenMysteryBox,
  onOpenShop,
  onOpenNotifications,
  onOpenProfile,
  onOpenWallet,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#0a0d24]/95 backdrop-blur-md px-3.5 py-2.5 border-b border-white/10 flex items-center justify-between shadow-lg select-none">
      {/* Left: Mystery Gift Box "Open" Button */}
      <motion.button
        id="lobby-mystery-box-btn"
        whileTap={{ scale: 0.94 }}
        whileHover={{ scale: 1.04 }}
        onClick={() => {
          SoundManager.play('click');
          onOpenMysteryBox();
        }}
        className="flex items-center gap-2 bg-gradient-to-b from-[#1a1c4b] to-[#0d0f2f] hover:from-[#242766] hover:to-[#141740] border border-amber-400/40 rounded-xl px-3 py-1.5 shadow-[0_2px_10px_rgba(251,191,36,0.15)] group transition-all cursor-pointer"
      >
        {/* Animated 3D Gift Box Cube Icon */}
        <div className="relative w-7 h-7 flex items-center justify-center">
          <motion.div
            animate={{ rotateY: [0, 180, 360], y: [0, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 border border-yellow-300 shadow-md flex items-center justify-center text-[10px] font-black text-white"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-200 animate-spin" style={{ animationDuration: '6s' }} />
          </motion.div>
          {/* Notification Ping on Box */}
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
          </span>
        </div>

        <div className="flex flex-col text-left leading-none">
          <span className="text-[11px] font-black tracking-wide text-amber-300 uppercase drop-shadow">
            Open
          </span>
          <span className="text-[8px] font-medium text-slate-400">Free Gift</span>
        </div>
      </motion.button>

      {/* Right Controls: Notifications, Coins Pill, Profile Avatar */}
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

        {/* USDT Vault Pill */}
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

        {/* Game Coins Pill */}
        <motion.button
          id="lobby-coins-btn"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          onClick={() => {
            SoundManager.play('click');
            if (onOpenShop) onOpenShop();
            else onOpenMysteryBox();
          }}
          className="flex items-center gap-1.5 bg-gradient-to-r from-amber-950/60 via-amber-900/40 to-yellow-950/50 hover:from-amber-900/80 hover:to-yellow-900/70 border border-amber-400/40 rounded-full pl-2 pr-2.5 py-1 shadow-[0_2px_12px_rgba(245,158,11,0.2)] transition-all group cursor-pointer"
          title="Game Coins"
        >
          {/* Gold Coin Icon */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border border-yellow-200 flex items-center justify-center text-slate-950 font-black text-[11px] shadow-sm">
            🪙
          </div>

          {/* Coins Amount */}
          <span className="text-amber-200 font-black text-xs sm:text-sm tracking-tight flex items-center">
            {balance.toFixed(0)} <span className="text-[10px] text-amber-400/90 font-extrabold ml-1">COINS</span>
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
