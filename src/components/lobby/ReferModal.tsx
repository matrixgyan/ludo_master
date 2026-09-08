import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Copy,
  Check,
  Share2,
  RefreshCw,
  Send,
  Users,
  Wallet,
  CheckCircle2,
  Clock,
  Award,
  ArrowRight,
  ShieldCheck,
  Gamepad2,
  CircleDollarSign,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundManager } from '../../audio/soundManager';
import { ReferralClientService, UserReferralProfile } from '../../services/referralClientService';
import { AuthClientService } from '../../services/authClientService';

interface ReferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFunds?: (amount: number) => void;
  userId?: string;
}

interface TopReferrerItem {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  totalEarned: number;
  totalInvited: number;
  totalQualified?: number;
}

export const ReferModal: React.FC<ReferModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  // Always ensure actual player User ID is used, never 'user_guest_default'
  const resolvedUserId = (userId && userId !== 'user_guest_default')
    ? userId
    : AuthClientService.getEffectiveUserId();

  const [profile, setProfile] = useState<UserReferralProfile | null>(null);
  const [topReferrers, setTopReferrers] = useState<TopReferrerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applyStatus, setApplyStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });
  const [activeTab, setActiveTab] = useState<'rules' | 'recruits' | 'leaderboard'>('rules');

  // Player's actual User ID is strictly the referral code
  const actualReferCode = (profile?.code && profile.code !== 'user_guest_default')
    ? profile.code
    : resolvedUserId;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userProf, topList] = await Promise.all([
        ReferralClientService.getUserReferralProfile(resolvedUserId),
        ReferralClientService.getTopReferrers(),
      ]);

      if (userProf) {
        setProfile(userProf);
      }
      if (Array.isArray(topList)) {
        setTopReferrers(topList);
      }
    } catch (err) {
      console.warn('Failed to load referral data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [resolvedUserId]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setApplyStatus({ type: 'idle' });
      setInputCode('');
    }
  }, [isOpen, loadData]);

  if (!isOpen) return null;

  const handleCopy = () => {
    SoundManager.play('click');
    navigator.clipboard?.writeText(actualReferCode);
    setCopied(true);
    confetti({ particleCount: 35, spread: 55, origin: { y: 0.65 } });
    setTimeout(() => setCopied(false), 2000);
  };

  const getShareLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}?ref=${actualReferCode}`;
  };

  const handleWhatsAppShare = () => {
    SoundManager.play('click');
    const shareText = encodeURIComponent(
      `Play Ludo & Win Real Cash! 🎲\n\nUse my Referral Code (User ID): *${actualReferCode}*\n\nDeposit and play 1 match to get started.\n\n👉 Join Here: ${getShareLink()}`
    );
    window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
  };

  const handleNativeShare = async () => {
    SoundManager.play('click');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Refer - Play & Win',
          text: `Join using my Referral Code: ${actualReferCode}`,
          url: getShareLink(),
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

    try {
      const res = await ReferralClientService.applyReferralCode(inputCode.trim(), resolvedUserId);
      if (res.success) {
        setApplyStatus({
          type: 'success',
          message: res.message || 'Referral applied successfully!',
        });
        setInputCode('');
        confetti({ particleCount: 45, spread: 65, origin: { y: 0.6 } });
        loadData();
      } else {
        setApplyStatus({
          type: 'error',
          message: res.message || 'Invalid referral code or user ID.',
        });
      }
    } catch (err: any) {
      setApplyStatus({
        type: 'error',
        message: err.message || 'Could not connect to server.',
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        id="refer-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm select-none overflow-y-auto"
      >
        <motion.div
          id="refer-dialog"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-[460px] my-auto bg-gradient-to-b from-[#2a170b] via-[#1c0f07] to-[#120904] text-[#fef3c7] rounded-2xl border border-[#d97706]/50 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
        >
          {/* Top Bar / Header */}
          <div className="relative px-4 py-3.5 bg-gradient-to-r from-[#3e200f] via-[#522b13] to-[#3e200f] border-b border-[#d97706]/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                id="refer-refresh-btn"
                onClick={() => {
                  SoundManager.play('click');
                  loadData();
                }}
                disabled={isLoading}
                className="w-8 h-8 rounded-full bg-[#271206] hover:bg-[#1b0c04] active:scale-95 text-[#fef08a] flex items-center justify-center border border-[#d97706]/40 transition-all cursor-pointer disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <div>
                <h1 id="refer-title" className="text-xl font-serif font-black text-[#fef08a] tracking-wide leading-tight">
                  Refer
                </h1>
                <p className="text-[11px] text-[#fde68a]/80 font-medium">
                  Earn ₹25 Cash for every friend who deposits & plays 1 match
                </p>
              </div>
            </div>

            <button
              id="refer-close-btn"
              onClick={() => {
                SoundManager.play('click');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-[#271206] hover:bg-[#1b0c04] active:scale-95 text-[#fde68a] flex items-center justify-center border border-[#d97706]/40 transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-3.5 sm:p-4 space-y-3 overflow-y-auto max-h-[78vh]">
            {/* PLAYER ACTUAL USER ID AS REFER CODE CARD */}
            <div
              id="refer-code-card"
              className="bg-gradient-to-br from-[#3b1d0c] to-[#261106] border border-[#d97706]/60 rounded-xl p-3 shadow-md"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-[#fde68a] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Your Refer Code (User ID)
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  ₹25 / Referral
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 bg-[#170a04] border border-[#d97706]/40 rounded-lg p-2">
                <span
                  id="refer-user-id-value"
                  className="font-mono text-base sm:text-lg font-black tracking-widest text-[#fef08a] px-1 select-all"
                >
                  {actualReferCode}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id="refer-copy-code-btn"
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gradient-to-r from-[#d97706] to-[#b45309] hover:brightness-110 active:scale-95 text-white text-xs font-bold transition-all shadow cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    id="refer-share-whatsapp-btn"
                    onClick={handleWhatsAppShare}
                    className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all shadow cursor-pointer"
                    title="Share on WhatsApp"
                  >
                    <Send className="w-4 h-4" />
                  </button>

                  <button
                    id="refer-share-native-btn"
                    onClick={handleNativeShare}
                    className="p-1.5 rounded-md bg-[#45210c] hover:bg-[#5a2c11] active:scale-95 text-[#fef08a] border border-[#d97706]/40 transition-all shadow cursor-pointer"
                    title="Share Link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2.5 border-t border-[#d97706]/20 text-center">
                <div className="bg-[#190c05] p-1.5 rounded-lg border border-[#d97706]/20">
                  <span className="text-[10px] text-[#fde68a]/70 block">Total Joined</span>
                  <span className="text-sm font-black text-[#fef08a]">{profile?.totalInvited || 0}</span>
                </div>
                <div className="bg-[#190c05] p-1.5 rounded-lg border border-[#d97706]/20">
                  <span className="text-[10px] text-emerald-400 block">Qualified</span>
                  <span className="text-sm font-black text-emerald-300">{profile?.totalQualified || 0}</span>
                </div>
                <div className="bg-[#190c05] p-1.5 rounded-lg border border-[#d97706]/20">
                  <span className="text-[10px] text-[#fde68a]/70 block">Cash Won</span>
                  <span className="text-sm font-black text-[#fde68a]">
                    ₹{profile?.totalEarned ? parseFloat(profile.totalEarned).toFixed(0) : '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex rounded-lg bg-[#190c05] p-1 border border-[#d97706]/30 text-xs font-semibold">
              <button
                id="refer-tab-rules-btn"
                onClick={() => {
                  SoundManager.play('click');
                  setActiveTab('rules');
                }}
                className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer text-center ${
                  activeTab === 'rules'
                    ? 'bg-[#d97706] text-white shadow font-bold'
                    : 'text-[#fde68a]/70 hover:text-[#fde68a]'
                }`}
              >
                How It Works
              </button>
              <button
                id="refer-tab-recruits-btn"
                onClick={() => {
                  SoundManager.play('click');
                  setActiveTab('recruits');
                }}
                className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer text-center ${
                  activeTab === 'recruits'
                    ? 'bg-[#d97706] text-white shadow font-bold'
                    : 'text-[#fde68a]/70 hover:text-[#fde68a]'
                }`}
              >
                My Friends ({profile?.referralsList?.length || 0})
              </button>
              <button
                id="refer-tab-leaderboard-btn"
                onClick={() => {
                  SoundManager.play('click');
                  setActiveTab('leaderboard');
                }}
                className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer text-center ${
                  activeTab === 'leaderboard'
                    ? 'bg-[#d97706] text-white shadow font-bold'
                    : 'text-[#fde68a]/70 hover:text-[#fde68a]'
                }`}
              >
                Top Earners
              </button>
            </div>

            {/* TAB 1: HOW IT WORKS / STRICT RULES & APPLY FRIEND'S CODE */}
            {activeTab === 'rules' && (
              <div className="space-y-3">
                {/* 3 Step Instruction Banner */}
                <div className="bg-[#241107] border border-[#d97706]/30 rounded-xl p-3 space-y-2.5 text-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#d97706]">
                    Referral Rules
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#d97706]/20 border border-[#d97706] text-[#fef08a] font-black flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-[#fef3c7]">Share your User ID</p>
                      <p className="text-[11px] text-[#fde68a]/70">
                        Give your Referral Code (User ID) or referral link to your friend.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#d97706]/20 border border-[#d97706] text-[#fef08a] font-black flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-[#fef3c7]">Friend Deposits & Plays 1 Match</p>
                      <p className="text-[11px] text-[#fde68a]/70">
                        Your friend joins, completes any deposit, and plays at least one match.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 font-black flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-300">Get ₹25 in Your Wallet</p>
                      <p className="text-[11px] text-emerald-200/80">
                        ₹25 Cash is instantly credited into your wallet upon completion.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Apply Friend's Referral Code Box */}
                <div className="bg-[#241107] border border-[#d97706]/30 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-[#fde68a] mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#d97706]" />
                    Have a Friend's Refer Code?
                  </div>

                  <form onSubmit={handleApplyFriendCode} className="flex items-center gap-2">
                    <input
                      id="apply-refer-input"
                      type="text"
                      placeholder="Enter Friend's User ID..."
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      className="flex-1 bg-[#150a04] border border-[#d97706]/40 rounded-lg px-3 py-1.5 text-xs font-mono text-[#fef08a] placeholder-[#d97706]/50 focus:outline-none focus:border-[#d97706]"
                    />
                    <button
                      id="apply-refer-submit-btn"
                      type="submit"
                      disabled={isApplying || !inputCode.trim()}
                      className="px-3.5 py-1.5 rounded-lg bg-[#d97706] hover:bg-[#b45309] active:scale-95 text-white text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isApplying ? 'Checking...' : 'Apply'}
                    </button>
                  </form>

                  {applyStatus.message && (
                    <div
                      className={`mt-2 p-2 rounded-md text-xs text-center ${
                        applyStatus.type === 'success'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-700/50'
                      }`}
                    >
                      {applyStatus.message}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MY FRIENDS / RECRUITS WITH REAL CONDITION TRACKING */}
            {activeTab === 'recruits' && (
              <div className="space-y-2">
                {profile?.referralsList && profile.referralsList.length > 0 ? (
                  profile.referralsList.map((ref, idx) => {
                    const isFullyQualified = ref.status === 'COMPLETED' || ref.rewardCredited;
                    return (
                      <div
                        key={ref.id || idx}
                        className="bg-[#241107] border border-[#d97706]/30 rounded-xl p-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#3d1d0c] border border-[#d97706]/40 flex items-center justify-center font-mono font-bold text-xs text-[#fef08a]">
                            {idx + 1}
                          </div>
                          <div>
                            <span className="font-mono font-bold text-xs text-[#fef08a] block">
                              User ID: {ref.refereeId}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] mt-0.5">
                              <span
                                className={`flex items-center gap-1 ${
                                  ref.depositCompleted ? 'text-emerald-400 font-semibold' : 'text-amber-400/70'
                                }`}
                              >
                                {ref.depositCompleted ? '✓ Deposit Done' : '○ Deposit Pending'}
                              </span>
                              <span className="text-[#d97706]/40">•</span>
                              <span
                                className={`flex items-center gap-1 ${
                                  ref.firstMatchPlayed ? 'text-emerald-400 font-semibold' : 'text-amber-400/70'
                                }`}
                              >
                                {ref.firstMatchPlayed ? '✓ 1st Match Done' : '○ Match Pending'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {isFullyQualified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/50">
                              <CheckCircle2 className="w-3 h-3" />
                              +₹25 Credited
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/40">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 px-4 bg-[#241107] border border-[#d97706]/30 rounded-xl">
                    <Users className="w-8 h-8 mx-auto text-[#d97706]/60 mb-2" />
                    <p className="text-xs font-semibold text-[#fde68a]">No referrals joined yet</p>
                    <p className="text-[11px] text-[#fde68a]/60 mt-1">
                      Share your User ID ({actualReferCode}) to earn ₹25 when they deposit & play 1 match!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TOP EARNERS LEADERBOARD */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-1.5">
                {topReferrers.length > 0 ? (
                  topReferrers.map((user) => (
                    <div
                      key={user.userId || user.rank}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                        user.rank === 1
                          ? 'bg-gradient-to-r from-[#422006] to-[#2e1404] border-[#eab308]/60 shadow'
                          : user.rank === 2
                          ? 'bg-[#291307] border-slate-400/40'
                          : user.rank === 3
                          ? 'bg-[#291307] border-amber-700/40'
                          : 'bg-[#1e0d04] border-[#d97706]/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            user.rank === 1
                              ? 'bg-yellow-500 text-black shadow'
                              : user.rank === 2
                              ? 'bg-slate-300 text-black'
                              : user.rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'text-[#fde68a]/70'
                          }`}
                        >
                          {user.rank}
                        </div>
                        <div>
                          <span className="font-mono text-xs font-bold text-[#fef08a] block">
                            {user.username || `User ${user.userId.slice(-6)}`}
                          </span>
                          <span className="text-[10px] text-[#fde68a]/60">
                            {user.totalInvited} Invited • {user.totalQualified || 0} Qualified
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-300 block">
                          ₹{user.totalEarned.toFixed(0)}
                        </span>
                        <span className="text-[9px] text-[#fde68a]/50">Total Earned</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-[#fde68a]/60">
                    No referrers recorded yet. Be the first to refer!
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
