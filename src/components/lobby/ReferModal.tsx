import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Users,
  Copy,
  Check,
  Gift,
  Sparkles,
  Share2,
  Send,
  Trophy,
  Crown,
  Zap,
  ArrowRight,
  ShieldCheck,
  Award,
  ChevronRight,
  TrendingUp,
  HelpCircle
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import confetti from 'canvas-confetti';

interface ReferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFunds?: (amount: number) => void;
}

export const ReferModal: React.FC<ReferModalProps> = ({ isOpen, onClose, onAddFunds }) => {
  const [copied, setCopied] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimableBalance, setClaimableBalance] = useState(350);
  const [totalEarned, setTotalEarned] = useState(1400);
  const [totalInvited, setTotalInvited] = useState(14);
  const [inputCode, setInputCode] = useState('');
  const [applyCodeStatus, setApplyCodeStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' });
  const [activeTab, setActiveTab] = useState<'rewards' | 'milestones' | 'history' | 'faqs'>('rewards');

  const referralCode = 'SUPREME777';

  if (!isOpen) return null;

  const handleCopy = () => {
    SoundManager.play('click');
    navigator.clipboard?.writeText(referralCode);
    setCopied(true);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    SoundManager.play('click');
    const shareText = encodeURIComponent(
      `🎲 *Play Ludo Supreme & Win Real Cash Daily!*\n\nUse my exclusive referral code *${referralCode}* to get *₹50 FREE Cash Bonus* directly in your wallet!\n\n👉 Join & Play Now: ${window.location.origin}`
    );
    window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
  };

  const handleTelegramShare = () => {
    SoundManager.play('click');
    const shareUrl = encodeURIComponent(window.location.origin);
    const shareText = encodeURIComponent(
      `🎲 Join Ludo Supreme & get ₹50 FREE Sign-up Cash! Use Referral Code: ${referralCode}`
    );
    window.open(`https://t.me/share/url?url=${shareUrl}&text=${shareText}`, '_blank');
  };

  const handleNativeShare = async () => {
    SoundManager.play('click');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ludo Supreme - Play & Earn Real Cash',
          text: `Join Ludo Supreme using referral code ${referralCode} to get ₹50 free bonus!`,
          url: window.location.origin,
        });
      } catch (e) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleClaimRewards = () => {
    if (claimableBalance <= 0) return;
    SoundManager.play('score-double');
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });

    const amountToClaim = claimableBalance;
    if (onAddFunds) {
      onAddFunds(amountToClaim);
    }
    setTotalEarned((prev) => prev + amountToClaim);
    setClaimableBalance(0);
    setClaimSuccess(true);
    setTimeout(() => setClaimSuccess(false), 4000);
  };

  const handleApplyFriendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    SoundManager.play('click');
    if (inputCode.trim().toUpperCase() === referralCode) {
      setApplyCodeStatus({
        type: 'error',
        message: 'You cannot use your own referral code.',
      });
      return;
    }

    if (inputCode.trim().length >= 4) {
      SoundManager.play('score-double');
      confetti({ particleCount: 60, spread: 60 });
      if (onAddFunds) {
        onAddFunds(25);
      }
      setApplyCodeStatus({
        type: 'success',
        message: '🎉 Referral Code Applied! ₹25 Sign-up Bonus added to your wallet.',
      });
      setInputCode('');
    } else {
      setApplyCodeStatus({
        type: 'error',
        message: 'Invalid code format. Please check and retry.',
      });
    }
  };

  const milestones = [
    { tier: 1, title: 'Starter Tier', target: 1, reward: '₹50 Cash', isCompleted: true, icon: Zap },
    { tier: 2, title: 'Champion Tier', target: 5, reward: '₹300 Cash + VIP Badge', isCompleted: true, icon: Trophy },
    { tier: 3, title: 'Grandmaster Tier', target: 15, reward: '₹1,000 Cash + Golden Dice', isCompleted: false, progress: '14 / 15', icon: Award },
    { tier: 4, title: 'Supreme Legend', target: 30, reward: '₹3,000 Cash + 2% Extra Rakeback', isCompleted: false, progress: '14 / 30', icon: Crown },
  ];

  const recentReferrals = [
    { name: 'Rahul Sharma', time: '15m ago', reward: '₹50', status: 'Played 1st Match', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80' },
    { name: 'Priya Patel', time: '2h ago', reward: '₹50', status: 'Played 1st Match', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
    { name: 'Amit Verma', time: '6h ago', reward: '₹50', status: 'Played 1st Match', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80' },
    { name: 'Rohit K.', time: '1d ago', reward: '₹50', status: 'Joined via WhatsApp', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&auto=format&fit=crop&q=80' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl bg-[#0d0a21] border-2 border-amber-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.2)] text-white overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Top Laser Accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600 z-10" />

          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#140f33]/90 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center text-slate-950">
                <Gift className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">Refer & Earn Program</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 font-extrabold text-[10px] tracking-wider uppercase">
                    Instant ₹50 / Friend
                  </span>
                </div>
                <p className="text-xs text-amber-300/90 font-medium">
                  Unlimited 100% Real Cash with Direct UPI Withdrawal
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                SoundManager.play('click');
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content - Scrollable */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            
            {/* 1. HERO EARNINGS STATS BAR */}
            <div className="relative rounded-2xl bg-gradient-to-br from-[#1c1445] to-[#120c30] border border-amber-500/30 p-4 shadow-lg overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="grid grid-cols-3 gap-2 text-center pb-3.5 border-b border-white/10">
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-400">Friends Joined</span>
                  <div className="flex items-center gap-1 mt-0.5 text-white font-black text-lg sm:text-xl">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>{totalInvited}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center border-x border-white/10 px-1">
                  <span className="text-[11px] font-bold text-slate-400">Total Earned</span>
                  <div className="flex items-center gap-1 mt-0.5 text-amber-400 font-black text-lg sm:text-xl font-mono">
                    <span>₹{totalEarned.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-emerald-400">Claimable Cash</span>
                  <div className="flex items-center gap-1 mt-0.5 text-emerald-300 font-black text-lg sm:text-xl font-mono">
                    <span>₹{claimableBalance}</span>
                  </div>
                </div>
              </div>

              {/* Claim Reward Action */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="text-left">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    <span>Instant Balance Credit Available</span>
                  </div>
                  <span className="text-[10px] text-slate-400">No wagering required • Directly playable & withdrawable</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleClaimRewards}
                  disabled={claimableBalance <= 0}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    claimableBalance > 0
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/30'
                      : 'bg-white/10 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Gift className="w-4 h-4" />
                  <span>{claimableBalance > 0 ? `Claim ₹${claimableBalance} Now` : 'All Claimed'}</span>
                </motion.button>
              </div>

              {claimSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center text-xs font-bold text-emerald-300"
                >
                  🎉 Success! Funds have been added to your in-game balance.
                </motion.div>
              )}
            </div>

            {/* 2. REFERRAL CODE & 1-CLICK SOCIAL SHARING */}
            <div className="p-4 rounded-2xl bg-[#140f33] border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Your Exclusive Referral Code
                </span>
                <span className="text-[10px] text-slate-400 font-mono">1 Code = Unlimited Friends</span>
              </div>

              {/* Code Box */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#080514] border-2 border-amber-400/50">
                <div className="flex-1 text-center font-mono text-xl font-black text-amber-300 tracking-widest select-all">
                  {referralCode}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[2.5]" />}
                  <span>{copied ? 'COPIED!' : 'COPY'}</span>
                </motion.button>
              </div>

              {/* Share Buttons Row */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {/* WhatsApp */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleWhatsAppShare}
                  className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Send className="w-4 h-4 fill-slate-950" />
                  <span>WhatsApp</span>
                </motion.button>

                {/* Telegram */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleTelegramShare}
                  className="py-2.5 px-3 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Telegram</span>
                </motion.button>

                {/* More / Share */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleNativeShare}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-amber-400" />
                  <span>More Share</span>
                </motion.button>
              </div>
            </div>

            {/* 3. NAV TABS: REWARDS, MILESTONES, HISTORY, FAQ */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setActiveTab('rewards')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'rewards' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                How It Works
              </button>
              <button
                onClick={() => setActiveTab('milestones')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'milestones' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                VIP Tiers
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'history' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Recent Invites
              </button>
              <button
                onClick={() => setActiveTab('faqs')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'faqs' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Rules & FAQs
              </button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'rewards' && (
              <div className="space-y-2.5">
                {/* 3 Steps */}
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Share Your Link / Code</h4>
                      <p className="text-[11px] text-slate-300">Send your code to friends on WhatsApp, Telegram, or SMS.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Friend Joins & Plays</h4>
                      <p className="text-[11px] text-slate-300">Your friend installs & plays their first cash match of ₹10+.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="w-7 h-7 rounded-lg bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-300">You & Friend Both Get Cash!</h4>
                      <p className="text-[11px] text-slate-300">You instantly get ₹50 and your friend receives ₹25 sign-up bonus.</p>
                    </div>
                  </div>
                </div>

                {/* Apply Friend's Code Box */}
                <div className="p-3.5 rounded-2xl bg-[#140f33] border border-white/10 space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Have a Friend's Referral Code?
                  </label>
                  <form onSubmit={handleApplyFriendCode} className="flex gap-2">
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      placeholder="ENTER REFERRAL CODE"
                      className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-amber-400 tracking-wider"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs transition cursor-pointer shadow hover:from-amber-400 hover:to-yellow-300"
                    >
                      Apply Code
                    </button>
                  </form>
                  {applyCodeStatus.type === 'success' && (
                    <p className="text-[11px] text-emerald-400 font-bold">{applyCodeStatus.message}</p>
                  )}
                  {applyCodeStatus.type === 'error' && (
                    <p className="text-[11px] text-rose-400 font-bold">{applyCodeStatus.message}</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'milestones' && (
              <div className="space-y-2.5">
                <div className="text-xs text-slate-400 mb-1">
                  Hit milestone targets to unlock exclusive cash bonuses and VIP status:
                </div>
                {milestones.map((m) => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.tier}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                        m.isCompleted
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-white'
                          : 'bg-white/5 border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            m.isCompleted ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-slate-400'
                          }`}
                        >
                          <Icon className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{m.title}</h4>
                            <span className="text-[10px] text-amber-300 font-bold font-mono">
                              ({m.target} {m.target === 1 ? 'Friend' : 'Friends'})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{m.reward}</p>
                        </div>
                      </div>

                      <div>
                        {m.isCompleted ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-[10.5px] border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Completed
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 font-mono text-[10.5px] border border-amber-500/20 font-bold">
                            {m.progress}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                  <span>Recent Friends</span>
                  <span>Cash Reward</span>
                </div>
                {recentReferrals.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2.5">
                      <img src={r.avatar} alt={r.name} className="w-8 h-8 rounded-full object-cover border border-white/20" />
                      <div>
                        <h4 className="text-xs font-bold text-white">{r.name}</h4>
                        <span className="text-[10px] text-slate-400">{r.status} • {r.time}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black font-mono text-emerald-400">+{r.reward}</span>
                      <span className="block text-[9px] text-emerald-500/90 font-bold uppercase">Credited</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'faqs' && (
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <h4 className="font-bold text-amber-300">Is there a limit on how much I can earn?</h4>
                  <p className="text-slate-300 text-[11px] leading-relaxed">No! There is zero limit. You can invite 10, 100, or 1,000 friends and earn ₹50 on every single referral.</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <h4 className="font-bold text-amber-300">Can I withdraw my referral cash?</h4>
                  <p className="text-slate-300 text-[11px] leading-relaxed">Yes! All referral rewards are added directly to your main wallet and can be withdrawn immediately to your UPI or Bank account.</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <h4 className="font-bold text-amber-300">When does the cash get credited?</h4>
                  <p className="text-slate-300 text-[11px] leading-relaxed">Instantly! As soon as your friend plays their first match on Ludo Supreme, the reward hits your wallet automatically.</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
