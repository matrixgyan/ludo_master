import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Trophy, Zap, Sparkles } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      icon: Trophy,
      color: 'text-amber-400',
      title: '$50K Mega Cash Tournament Live!',
      desc: 'Registration is now open. Join the supreme league arena.',
      time: '10m ago',
    },
    {
      id: 2,
      icon: Zap,
      color: 'text-cyan-400',
      title: 'Multi-Chain EVM Deposit Active',
      desc: 'Instant USDT deposits on Optimism, Arbitrum, BSC, Base & Polygon.',
      time: '1h ago',
    },
    {
      id: 3,
      icon: Sparkles,
      color: 'text-emerald-400',
      title: 'Snake Ludo Arena Ranked Season #59',
      desc: 'You advanced to Rank #59 with a 4-win streak!',
      time: '1d ago',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-sm rounded-3xl bg-[#0f1130] border border-blue-500/30 p-5 shadow-2xl text-white"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-black text-white">Notifications</h3>
            </div>
            <button
              onClick={() => {
                SoundManager.play('click');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
            {notifications.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/5 flex-shrink-0">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      <span className="text-[9px] text-slate-400">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
