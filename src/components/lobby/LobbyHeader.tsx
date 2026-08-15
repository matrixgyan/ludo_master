import React from 'react';
import { Bell, CreditCard, User, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { SoundManager } from '../../audio/soundManager';

interface LobbyHeaderProps {
  balance: number;
  onOpenMysteryBox: () => void;
  onOpenWallet: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const LobbyHeader: React.FC<LobbyHeaderProps> = ({
  balance,
  onOpenMysteryBox,
  onOpenWallet,
  onOpenNotifications,
  onOpenProfile,
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
        className="flex items-center gap-2 bg-gradient-to-b from-[#1a1c4b] to-[#0d0f2f] hover:from-[#242766] hover:to-[#141740] border border-amber-400/40 rounded-xl px-3 py-1.5 shadow-[0_2px_10px_rgba(251,191,36,0.15)] group transition-all"
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

      {/* Right Controls: Notifications, Dollar Balance Pill, Profile Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Bell */}
        <motion.button
          id="lobby-notifications-btn"
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            SoundManager.play('click');
            onOpenNotifications();
          }}
          className="relative w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0a0d24]" />
        </motion.button>

        {/* Balance Pill with USDT Tether symbol */}
        <motion.button
          id="lobby-wallet-btn"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          onClick={() => {
            SoundManager.play('click');
            onOpenWallet();
          }}
          className="flex items-center gap-1.5 bg-gradient-to-r from-[#0d2a20] via-[#093527] to-[#122838] hover:from-[#13382c] hover:to-[#173448] border border-teal-400/50 rounded-full pl-2 pr-2.5 py-1 shadow-[0_2px_12px_rgba(20,184,166,0.3)] transition-all group cursor-pointer"
          title="Decentralized USDT EVM Wallet"
        >
          {/* Tether USDT Badge */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border border-emerald-200/50 flex items-center justify-center text-slate-950 font-black text-[11px] shadow-sm">
            ₮
          </div>

          {/* USDT Balance */}
          <span className="text-white font-black text-xs sm:text-sm tracking-tight flex items-center">
            {balance.toFixed(2)} <span className="text-[10px] text-teal-300 font-extrabold ml-1">USDT</span>
          </span>

          {/* Plus Add Badge */}
          <span className="w-4 h-4 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center text-[10px] font-black ml-0.5 shadow-sm group-hover:scale-110 transition-transform">
            +
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
          className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 border-2 border-purple-300/60 p-0.5 flex items-center justify-center shadow-md overflow-hidden"
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
