import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Zap,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Megaphone,
  Check,
  Trash2,
  RefreshCw,
  Clock,
  ShieldCheck,
  Coins
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';

export interface AppNotification {
  id: string;
  userId: string;
  type:
    | 'DEPOSIT_SUBMITTED'
    | 'DEPOSIT_APPROVED'
    | 'DEPOSIT_REJECTED'
    | 'WITHDRAWAL_REQUESTED'
    | 'WITHDRAWAL_PROCESSED'
    | 'MATCH_WON'
    | 'REFERRAL_BONUS'
    | 'ANNOUNCEMENT';
  title: string;
  message: string;
  amount?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  userId = 'user_guest_default',
  onUnreadCountChange,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PAYMENTS' | 'WINNINGS' | 'ANNOUNCEMENTS'>('ALL');

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
          if (onUnreadCountChange) onUnreadCountChange(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.warn('Fetch notifications notice', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleMarkAsRead = async (id: string) => {
    try {
      SoundManager.play('click');
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (onUnreadCountChange) onUnreadCountChange(Math.max(0, unreadCount - 1));

      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch (err) {
      console.warn('Mark read error', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      SoundManager.play('click');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      if (onUnreadCountChange) onUnreadCountChange(0);

      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch (err) {
      console.warn('Mark all read error', err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      SoundManager.play('click');
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      await fetch('/api/notifications/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch (err) {
      console.warn('Clear notifications error', err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PAYMENTS') {
      return (
        n.type === 'DEPOSIT_SUBMITTED' ||
        n.type === 'DEPOSIT_APPROVED' ||
        n.type === 'DEPOSIT_REJECTED' ||
        n.type === 'WITHDRAWAL_REQUESTED' ||
        n.type === 'WITHDRAWAL_PROCESSED'
      );
    }
    if (activeFilter === 'WINNINGS') {
      return n.type === 'MATCH_WON' || n.type === 'REFERRAL_BONUS';
    }
    if (activeFilter === 'ANNOUNCEMENTS') {
      return n.type === 'ANNOUNCEMENT';
    }
    return true;
  });

  const getNotificationVisuals = (type: AppNotification['type']) => {
    switch (type) {
      case 'DEPOSIT_APPROVED':
        return {
          icon: CheckCircle2,
          bgColor: 'bg-emerald-500/15',
          borderColor: 'border-emerald-500/40',
          textColor: 'text-emerald-400',
          iconColor: 'text-emerald-400',
          badgeText: 'Deposit Credited',
        };
      case 'DEPOSIT_SUBMITTED':
        return {
          icon: ArrowDownLeft,
          bgColor: 'bg-amber-500/15',
          borderColor: 'border-amber-500/40',
          textColor: 'text-amber-300',
          iconColor: 'text-amber-400',
          badgeText: 'Under Verification',
        };
      case 'DEPOSIT_REJECTED':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-rose-500/15',
          borderColor: 'border-rose-500/40',
          textColor: 'text-rose-400',
          iconColor: 'text-rose-400',
          badgeText: 'Deposit Failed',
        };
      case 'WITHDRAWAL_PROCESSED':
        return {
          icon: ArrowUpRight,
          bgColor: 'bg-teal-500/15',
          borderColor: 'border-teal-500/40',
          textColor: 'text-teal-300',
          iconColor: 'text-teal-400',
          badgeText: 'Withdrawal Sent',
        };
      case 'WITHDRAWAL_REQUESTED':
        return {
          icon: Clock,
          bgColor: 'bg-blue-500/15',
          borderColor: 'border-blue-500/40',
          textColor: 'text-blue-300',
          iconColor: 'text-blue-400',
          badgeText: 'Payout Queue',
        };
      case 'MATCH_WON':
        return {
          icon: Trophy,
          bgColor: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/15',
          borderColor: 'border-yellow-400/50',
          textColor: 'text-amber-300',
          iconColor: 'text-yellow-400',
          badgeText: 'Match Victory',
        };
      case 'REFERRAL_BONUS':
        return {
          icon: Coins,
          bgColor: 'bg-purple-500/15',
          borderColor: 'border-purple-500/40',
          textColor: 'text-purple-300',
          iconColor: 'text-purple-400',
          badgeText: 'Referral Bonus',
        };
      case 'ANNOUNCEMENT':
      default:
        return {
          icon: Megaphone,
          bgColor: 'bg-indigo-500/15',
          borderColor: 'border-indigo-500/40',
          textColor: 'text-indigo-300',
          iconColor: 'text-indigo-400',
          badgeText: 'Notice',
        };
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recent';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl bg-[#0c0924] border-2 border-amber-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.2)] text-white overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Top Laser Accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600 z-10" />

          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#140f36]/90 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center text-slate-950">
                <Bell className="w-5 h-5 stroke-[2.4]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center border-2 border-[#140f36] shadow animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                    Live Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-extrabold text-[10px] uppercase">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-300/80 font-medium">
                  Real-time Status Updates, Approvals & Announcements
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={fetchNotifications}
                disabled={isLoading}
                title="Refresh"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              </button>

              <button
                onClick={() => {
                  SoundManager.play('click');
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Actions & Category Filters */}
          <div className="p-3 bg-[#100c2e] border-b border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                {(['ALL', 'PAYMENTS', 'WINNINGS', 'ANNOUNCEMENTS'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      SoundManager.play('click');
                      setActiveFilter(filter);
                    }}
                    className={`px-3 py-1 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition cursor-pointer ${
                      activeFilter === filter
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {filter === 'ALL'
                      ? 'All'
                      : filter === 'PAYMENTS'
                      ? '💰 Deposits & Payouts'
                      : filter === 'WINNINGS'
                      ? '🏆 Winnings'
                      : '📢 Notices'}
                  </button>
                ))}
              </div>

              {/* Bulk Actions */}
              {notifications.length > 0 && (
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-400 text-[10.5px] font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Mark all as read"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span className="hidden sm:inline">Mark Read</span>
                    </button>
                  )}
                  <button
                    onClick={handleClearNotifications}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-[10.5px] transition cursor-pointer"
                    title="Clear read notifications"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notifications List Body */}
          <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                  <Bell className="w-7 h-7 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-300">You're All Caught Up!</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                    No notifications in this category right now. Any deposit updates, match winnings, or bonuses will show up here instantly.
                  </p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const visuals = getNotificationVisuals(notif.type);
                const Icon = visuals.icon;

                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      if (!notif.isRead) handleMarkAsRead(notif.id);
                    }}
                    className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 group ${
                      notif.isRead
                        ? 'bg-white/[0.03] border-white/10 hover:border-white/20 opacity-80'
                        : `${visuals.bgColor} ${visuals.borderColor} shadow-md`
                    }`}
                  >
                    {/* Unread Glow Dot */}
                    {!notif.isRead && (
                      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
                    )}

                    {/* Icon Box */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow ${
                        notif.isRead ? 'bg-white/10 text-slate-400' : `${visuals.bgColor} ${visuals.iconColor} border ${visuals.borderColor}`
                      }`}
                    >
                      <Icon className="w-5 h-5 stroke-[2.4]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase tracking-wider border ${visuals.bgColor} ${visuals.textColor} ${visuals.borderColor}`}
                        >
                          {visuals.badgeText}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatTimestamp(notif.createdAt)}
                        </span>
                      </div>

                      <h4
                        className={`text-xs sm:text-sm font-black truncate ${
                          notif.isRead ? 'text-slate-300' : 'text-white group-hover:text-amber-300'
                        }`}
                      >
                        {notif.title}
                      </h4>

                      <p className="text-xs text-slate-300/90 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Optional Amount or Ref Tag */}
                      {(notif.amount || notif.referenceId) && (
                        <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-white/10 text-[11px] font-mono">
                          {notif.amount && (
                            <span className="font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
                              ₹{parseFloat(notif.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          {notif.referenceId && (
                            <span className="text-slate-400 text-[10px] truncate max-w-[200px]">
                              Ref: {notif.referenceId}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3.5 border-t border-white/10 bg-[#120e33] flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Real-time Secure Sync</span>
            </div>
            <button
              onClick={() => {
                SoundManager.play('click');
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
