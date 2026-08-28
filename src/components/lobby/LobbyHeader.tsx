import React from 'react';
import { Bell, User, Sparkles, Zap, ShieldCheck, Landmark } from 'lucide-react';
import { motion } from 'motion/react';
import { SoundManager } from '../../audio/soundManager';
import { usePlatformMode } from '../../hooks/usePlatformMode';

interface LobbyHeaderProps {
  balance?: number;
  usdtBalance?: string;
  unreadNotificationsCount?: number;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenWallet?: () => void;
}

export const LobbyHeader: React.FC<LobbyHeaderProps> = ({
  balance = 0,
  usdtBalance = '$0.00',
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenProfile,
  onOpenWallet,
}) => {
  const { platformMode, isCryptoMode } = usePlatformMode();

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
          <span className="text-[9px] font-bold text-slate-400 tracking-tight">
            {isCryptoMode ? 'On-Chain Arena' : 'Pro Gaming Arena'}
          </span>
        </div>
      </div>

      {/* Right Controls: Notifications, USDT/Fiat Vault, Profile Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Bell */}
        <motion.button
          id="lobby-notifications-btn"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.06 }}
          onClick={() => {
            SoundManager.play('click');
            onOpenNotifications();
          }}
          className="relative w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Notifications & Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-[9.5px] flex items-center justify-center border-2 border-[#0a0d24] shadow-md shadow-rose-500/40 animate-pulse">
              {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
            </span>
          ) : (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400/80 ring-2 ring-[#0a0d24]" />
          )}
        </motion.button>

        {/* Dynamic Multi-Chain / Fiat Vault Pill */}
        <motion.button
          id="lobby-usdt-vault-btn"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          onClick={() => {
            SoundManager.play('click');
            if (onOpenWallet) onOpenWallet();
          }}
          className={`flex items-center gap-1.5 border rounded-full pl-2 pr-2.5 py-1 transition-all group cursor-pointer ${
            isCryptoMode
              ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/70 hover:from-emerald-900 hover:to-teal-900 border-emerald-500/50 shadow-[0_2px_12px_rgba(16,185,129,0.25)]'
              : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-orange-950/70 hover:from-amber-900 hover:to-orange-900 border-amber-500/50 shadow-[0_2px_12px_rgba(245,158,11,0.25)]'
          }`}
          title={isCryptoMode ? 'Unified USDT Multi-Chain Vault' : 'Manual Fiat Wallet & Gateway'}
        >
          {/* Icon Badge */}
          {isCryptoMode ? (
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-300 border border-emerald-200 flex items-center justify-center text-slate-950 font-black text-[10px] shadow-sm">
              ₮
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border border-amber-200 flex items-center justify-center text-slate-950 font-black text-[11px] shadow-sm">
              {platformMode.currencySymbol || '₹'}
            </div>
          )}

          {/* Amount and Currency */}
          {isCryptoMode ? (
            <span className="text-emerald-300 font-black text-xs sm:text-sm tracking-tight flex items-center">
              {usdtBalance} <span className="text-[10px] text-emerald-400/90 font-extrabold ml-1">USDT</span>
            </span>
          ) : (
            <span className="text-amber-300 font-black text-xs sm:text-sm tracking-tight flex items-center">
              {platformMode.currencySymbol}{balance.toFixed(2)} <span className="text-[10px] text-amber-400/90 font-extrabold ml-1">{platformMode.platformCurrency}</span>
            </span>
          )}
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

