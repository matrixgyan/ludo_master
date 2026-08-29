import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Copy,
  Check,
  Gift,
  Share2,
  Send,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Coins,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Users
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import { usePlatformMode } from '../../hooks/usePlatformMode';
import { ReferralClientService, UserReferralProfile } from '../../services/referralClientService';
import confetti from 'canvas-confetti';

interface ReferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFunds?: (amount: number) => void;
  userId?: string;
}

export const ReferModal: React.FC<ReferModalProps> = ({
  isOpen,
  onClose,
  onAddFunds,
  userId = 'user_guest_default',
}) => {
  const { currencySymbol, platformCurrency } = usePlatformMode();
  const [profile, setProfile] = useState<UserReferralProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applyStatus, setApplyStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  const loadReferralData = useCallback(async () => {
    setIsLoading(true);
    const data = await ReferralClientService.getUserReferralProfile(userId);
    if (data) {
      setProfile(data);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      loadReferralData();
      setApplyStatus({ type: 'idle' });
      setInputCode('');
    }
  }, [isOpen, loadReferralData]);

  // Real-time synchronization for referral events
  useEffect(() => {
    const handleReferralUpdate = () => {
      loadReferralData();
    };

    window.addEventListener('ludo_referral_updated', handleReferralUpdate);
    return () => {
      window.removeEventListener('ludo_referral_updated', handleReferralUpdate);
    };
  }, [loadReferralData]);

  if (!isOpen) return null;

  const referralCode = profile?.code || 'LUDO777';
  const rewardPerReferral = 20;

  const handleCopy = () => {
    SoundManager.play('click');
    navigator.clipboard?.writeText(referralCode);
    setCopied(true);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    SoundManager.play('click');
    const shareText = encodeURIComponent(
      `🎲 *Play Ludo Supreme & Win Real Cash!*\n\nUse my Referral Code *${referralCode}* to get started.\n\nDeposit and play your 1st match to unlock cash rewards!\n\n👉 Join Now: ${window.location.origin}`
    );
    window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
  };

  const handleNativeShare = async () => {
    SoundManager.play('click');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ludo Supreme - Play & Win Cash',
          text: `Join Ludo Supreme using referral code ${referralCode} and play with real players!`,
          url: window.location.origin,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleApplyFriendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim() || isApplying) return;

    SoundManager.play('click');
    setIsApplying(true);
    setApplyStatus({ type: 'idle' });

    const result = await ReferralClientService.applyReferralCode(inputCode.trim().toUpperCase(), userId);
    setIsApplying(false);

    if (result.success) {
      SoundManager.play('score-double');
      confetti({ particleCount: 60, spread: 70 });
      setApplyStatus({
        type: 'success',
        message: result.message || `Referral code ${inputCode.toUpperCase()} applied successfully!`,
      });
      setInputCode('');
      loadReferralData();
    } else {
      SoundManager.play('score-minus');
      setApplyStatus({
        type: 'error',
        message: result.message || 'Failed to apply referral code.',
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl bg-[#0d0a21] border border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.15)] text-white overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Top Laser Accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600 z-10" />

          {/* Modal Header */}
          <div className="relative px-5 py-4 sm:px-6 sm:py-4.5 flex items-center justify-between border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                <div className="w-full h-full bg-[#0e0a24] rounded-[14px] flex items-center justify-center text-amber-400">
                  <Gift className="w-5 h-5 stroke-[2.4]" />
                </div>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                  Refer a Friend
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    +{currencySymbol}{rewardPerReferral} Cash
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Anti-fraud verified referral reward system
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                SoundManager.play('click');
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content Scroll Area */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 custom-scrollbar">

            {/* 1. Referral Code Box Card */}
            <div className="relative rounded-2xl bg-gradient-to-br from-[#1b143f] to-[#120d2d] border border-amber-400/40 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  Your Unique Referral Code
                </span>
                <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                  Lifetime Valid
                </span>
              </div>

              {/* Code Display + Copy Button */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-black/60 border border-amber-400/40 rounded-xl py-2.5 px-4 flex items-center justify-between">
                  <span className="font-mono text-lg sm:text-xl font-black text-yellow-300 tracking-wider">
                    {isLoading ? 'LOADING...' : referralCode}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold">Tap to Copy</span>
                </div>

                <button
                  onClick={handleCopy}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 transition-transform cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 stroke-[2.4]" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sharing Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleWhatsAppShare}
                  className="py-2.5 px-3 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-[0_0_12px_rgba(37,211,102,0.2)]"
                >
                  <Send className="w-4 h-4 fill-current" />
                  <span>Share on WhatsApp</span>
                </button>

                <button
                  onClick={handleNativeShare}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>More Options</span>
                </button>
              </div>
            </div>

            {/* 2. Clear Anti-Fraud Reward Rules Banner */}
            <div className="rounded-2xl bg-black/40 border border-white/10 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-200 uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>How to Get Your {currencySymbol}{rewardPerReferral} Cash Reward:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-start gap-2 bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30">
                    1
                  </div>
                  <div className="text-slate-300 leading-snug">
                    <span className="font-bold text-white">Friend Joins:</span> Your friend downloads & registers using your referral code.
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                    2
                  </div>
                  <div className="text-slate-300 leading-snug">
                    <span className="font-bold text-emerald-300">Deposit & 1 Match:</span> When they make 1 deposit & play 1 match, <span className="font-black text-amber-300">{currencySymbol}{rewardPerReferral} Cash</span> is instantly credited to your wallet!
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Real-Time Stats Metric Chips */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-[#151030] border border-white/10 rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Earned</span>
                <span className="text-sm sm:text-base font-black text-emerald-400 mt-0.5">
                  {currencySymbol}{profile?.totalEarned?.toFixed(0) || '0'}
                </span>
              </div>

              <div className="bg-[#151030] border border-white/10 rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Invited</span>
                <span className="text-sm sm:text-base font-black text-amber-300 mt-0.5">
                  {profile?.totalInvited || 0}
                </span>
              </div>

              <div className="bg-[#151030] border border-white/10 rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending</span>
                <span className="text-sm sm:text-base font-black text-cyan-300 mt-0.5">
                  {profile?.pendingCount || 0}
                </span>
              </div>

              <div className="bg-[#151030] border border-white/10 rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Qualified</span>
                <span className="text-sm sm:text-base font-black text-emerald-300 mt-0.5">
                  {profile?.totalQualified || 0}
                </span>
              </div>
            </div>

            {/* 4. "Apply Friend's Code" Box (if not already referred) */}
            {profile?.referredBy ? (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-200 font-semibold">
                    Joined using code: <strong className="text-white font-mono">{profile.referredBy.code}</strong>
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {profile.referredBy.status === 'COMPLETED' ? 'Completed' : 'Pending Activation'}
                </span>
              </div>
            ) : (
              <div className="rounded-2xl bg-black/40 border border-white/10 p-3.5">
                <div className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  Have a Friend's Referral Code?
                </div>

                <form onSubmit={handleApplyFriendCode} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="ENTER REFERRAL CODE"
                    maxLength={15}
                    className="flex-1 bg-white/5 border border-white/15 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white placeholder-slate-500 uppercase outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputCode.trim() || isApplying}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                  >
                    {isApplying ? 'Applying...' : 'Apply Code'}
                  </button>
                </form>

                {applyStatus.type === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-rose-400 text-[11px] font-semibold mt-2"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{applyStatus.message}</span>
                  </motion.div>
                )}

                {applyStatus.type === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold mt-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{applyStatus.message}</span>
                  </motion.div>
                )}
              </div>
            )}

            {/* 5. Live Referral Activity / Track Invites */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  Your Invited Friends ({profile?.referralsList?.length || 0})
                </span>
                <span className="text-[10px] text-slate-400">Live Status</span>
              </div>

              {profile?.referralsList && profile.referralsList.length > 0 ? (
                <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                  {profile.referralsList.map((ref) => {
                    const isFullyCompleted = ref.status === 'COMPLETED' || ref.rewardCredited;
                    return (
                      <div
                        key={ref.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-amber-300">
                            {ref.refereeId.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {ref.refereeName || `Player ${ref.refereeId.slice(0, 6)}`}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Joined {new Date(ref.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          {isFullyCompleted ? (
                            <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>+{currencySymbol}{ref.rewardAmount || '20'} Paid</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="flex items-center gap-1 text-amber-400 font-bold text-[10px]">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {!ref.depositCompleted && !ref.firstMatchPlayed
                                    ? 'Needs Deposit & Match'
                                    : !ref.depositCompleted
                                    ? 'Deposit Pending'
                                    : '1st Match Pending'}
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-400">Reward: {currencySymbol}{ref.rewardAmount || '20'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-1">
                  <p className="text-xs text-slate-300 font-semibold">No referrals yet</p>
                  <p className="text-[11px] text-slate-400">
                    Share your code with friends. When they deposit & play a match, you earn {currencySymbol}{rewardPerReferral} cash!
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Strict anti-sybil & fake-account protection active</span>
            </div>
            <button
              onClick={() => {
                SoundManager.play('click');
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs active:scale-95 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
