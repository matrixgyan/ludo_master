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
  Coins,
  ShieldCheck,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundManager } from '../../audio/soundManager';
import { ReferralClientService, UserReferralProfile } from '../../services/referralClientService';
import {
  PirateShipSvg,
  TreasureChestSvg,
  LaurelWreathSvg,
  CrossedSwordsSvg,
  RumBarrelsSvg,
  ShipWheelSvg,
  PirateCannonSvg,
  NauticalAnchorSvg,
  PirateAvatarSvg,
} from './PirateLeaderboardAssets';

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
  userId = 'user_guest_default',
}) => {
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
  const [viewTab, setViewTab] = useState<'ranks' | 'my_crew'>('ranks');

  // Player actual user ID is strictly the referral code
  const actualReferCode = profile?.code || userId;

  const formatName = (rawName: string): string => {
    if (!rawName) return 'Player';
    if (rawName.startsWith('bot_')) {
      const botPart = rawName.replace('bot_', '');
      return `Captain ${botPart.charAt(0).toUpperCase() + botPart.slice(1)}`;
    }
    if (rawName.startsWith('opponent_bot_')) {
      return `Pirate ${rawName.replace('opponent_bot_', '')}`;
    }
    if (/^\d+$/.test(rawName)) {
      return `Player ${rawName.slice(-4)}`;
    }
    return rawName;
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userProf, topList] = await Promise.all([
        ReferralClientService.getUserReferralProfile(userId),
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
  }, [userId]);

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
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    SoundManager.play('click');
    const shareText = encodeURIComponent(
      `🏴‍☠️ *Treasure Hunt Refer & Earn!*\n\nUse my Referral Code (User ID) *${actualReferCode}* to join and win cash!\n\nDeposit and play your first match to claim cash rewards!\n\n👉 Join Now: ${window.location.origin}`
    );
    window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
  };

  const handleNativeShare = async () => {
    SoundManager.play('click');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Treasure Hunt - Refer & Earn Cash',
          text: `Join using my Referral Code (User ID) ${actualReferCode} and start winning cash!`,
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

    try {
      const res = await ReferralClientService.applyReferralCode(inputCode.trim(), userId);
      if (res.success) {
        setApplyStatus({
          type: 'success',
          message: res.message || 'Referral applied successfully!',
        });
        setInputCode('');
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
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

  const top1 = topReferrers[0] || null;
  const top2 = topReferrers[1] || null;
  const top3 = topReferrers[2] || null;
  const crewList = topReferrers.slice(3);

  return (
    <AnimatePresence>
      <div
        id="refer-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm select-none overflow-y-auto"
      >
        {/* Outer Dialog Frame */}
        <motion.div
          id="refer-dialog-frame"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-[490px] my-auto flex flex-col items-center"
        >
          {/* Close Button Top-Right */}
          <button
            id="refer-close-btn"
            onClick={() => {
              SoundManager.play('click');
              onClose();
            }}
            className="absolute -top-3 -right-2 sm:-top-4 sm:-right-3 z-30 w-9 h-9 rounded-full bg-[#45210d] hover:bg-[#321607] active:scale-95 text-[#fef3c7] flex items-center justify-center shadow-lg border-2 border-[#d97706]/70 transition-all cursor-pointer"
            aria-label="Close Refer Section"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Refresh Button Top-Left */}
          <button
            id="refer-refresh-btn"
            onClick={() => {
              SoundManager.play('click');
              loadData();
            }}
            disabled={isLoading}
            className="absolute -top-3 -left-2 sm:-top-4 sm:-left-3 z-30 w-9 h-9 rounded-full bg-[#45210d] hover:bg-[#321607] active:scale-95 text-[#fef3c7] flex items-center justify-center shadow-lg border-2 border-[#d97706]/70 transition-all cursor-pointer disabled:opacity-50"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Realistic Torn Parchment Map Container */}
          <div
            id="refer-parchment"
            className="relative w-full bg-gradient-to-b from-[#ceb28a] via-[#c4a67d] to-[#b9986c] p-4 sm:p-6 shadow-[0_20px_50px_rgba(25,12,4,0.55)] border border-[#a17e52]/40"
            style={{
              clipPath:
                'polygon(0% 3%, 1.5% 1.5%, 3% 2.8%, 6% 0.8%, 10% 2.2%, 15% 1%, 20% 2.5%, 26% 0.8%, 32% 2%, 38% 0.5%, 45% 2%, 52% 0.8%, 60% 2.2%, 67% 0.5%, 74% 2%, 81% 0.8%, 88% 2.2%, 94% 0.8%, 98% 2.5%, 100% 4.5%, 98.8% 9%, 99.8% 15%, 98.2% 21%, 99.5% 28%, 98.5% 35%, 99.8% 42%, 98.2% 50%, 99.6% 58%, 98.4% 66%, 99.8% 74%, 98.2% 82%, 99.5% 90%, 98% 96%, 95.5% 99%, 89% 97.5%, 83% 99.5%, 76% 98%, 69% 99.2%, 62% 97.8%, 55% 99.5%, 48% 98%, 41% 99.2%, 34% 97.8%, 27% 99.5%, 20% 98%, 13% 99.2%, 6% 97.8%, 2% 99%, 0.5% 96%, 1.6% 90%, 0.5% 83%, 1.8% 76%, 0.4% 68%, 1.6% 60%, 0.5% 52%, 1.8% 44%, 0.4% 36%, 1.6% 28%, 0.5% 20%, 1.8% 12%, 0.5% 5%)',
            }}
          >
            {/* Pirate Ship perched on Top-Right Corner */}
            <div className="absolute top-1 right-2 pointer-events-none z-20">
              <PirateShipSvg className="w-20 h-20 sm:w-24 sm:h-24 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]" />
            </div>

            {/* Open Golden Treasure Chest perched on Bottom-Left Corner */}
            <div className="absolute -bottom-2 -left-2 pointer-events-none z-20">
              <TreasureChestSvg className="w-22 h-20 sm:w-26 sm:h-22 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]" />
            </div>

            {/* Header Title matching screenshot typography: "Treasure Hunt Leaderboard / Refer & Earn" */}
            <div className="text-center pt-2 pb-1 relative z-10">
              <h1
                id="refer-title"
                className="font-serif text-2xl sm:text-3xl font-extrabold text-[#291407] tracking-wider drop-shadow-sm"
              >
                Treasure Hunt Refer & Earn
              </h1>
              <p className="font-serif text-[11px] sm:text-xs text-[#4a270f] mt-0.5">
                Earn ₹20 instantly for every recruited pirate!
              </p>
            </div>

            {/* PLAYER ACTUAL USER ID AS REFER CODE BANNER */}
            <div
              id="player-refer-code-card"
              className="relative z-10 mt-2.5 mb-3 bg-[#f5e5cf]/90 border-2 border-[#8d5b2d]/60 rounded-xl p-2.5 sm:p-3 shadow-inner text-[#291407]"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-serif font-bold text-[11px] sm:text-xs text-[#522b10] uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#b45309]" />
                  Your Refer Code (Actual User ID)
                </span>
                <span className="text-[10px] font-bold bg-[#3b1c09] text-[#fef08a] px-2 py-0.5 rounded-full font-serif">
                  ₹20 / Invite
                </span>
              </div>

              {/* User ID Display & One-Tap Copy */}
              <div className="flex items-center justify-between gap-2 bg-[#ecd5b8] border border-[#a1723f]/50 rounded-lg p-1.5 sm:p-2">
                <span
                  id="refer-actual-user-id"
                  className="font-mono font-black text-sm sm:text-base text-[#291407] tracking-wider truncate px-1"
                >
                  {actualReferCode}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id="refer-copy-code-btn"
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#3b1c09] hover:bg-[#271205] active:scale-95 text-[#fef08a] text-xs font-serif font-bold transition-all shadow cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
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
                    className="p-1.5 rounded bg-[#15803d] hover:bg-[#166534] active:scale-95 text-white transition-all shadow cursor-pointer"
                    title="Share via WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id="refer-share-native-btn"
                    onClick={handleNativeShare}
                    className="p-1.5 rounded bg-[#3b1c09] hover:bg-[#271205] active:scale-95 text-[#fef08a] transition-all shadow cursor-pointer"
                    title="Share"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* User Real Stats Bar */}
              <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-[#8d5b2d]/30 text-center">
                <div>
                  <span className="block text-[10px] font-serif text-[#5c3516]">Total Recruits</span>
                  <span className="font-serif font-extrabold text-xs sm:text-sm text-[#291407]">
                    {profile?.totalInvited || 0}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-serif text-[#5c3516]">Total Bounty</span>
                  <span className="font-serif font-extrabold text-xs sm:text-sm text-[#291407]">
                    ₹{profile?.totalEarned || 0}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-serif text-[#5c3516]">Qualified</span>
                  <span className="font-serif font-extrabold text-xs sm:text-sm text-emerald-800">
                    {profile?.totalQualified || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* APPLY FRIEND'S USER ID / REFER CODE */}
            <form
              onSubmit={handleApplyFriendCode}
              id="apply-refer-form"
              className="relative z-10 mb-3 flex items-center gap-1.5 px-0.5"
            >
              <input
                id="apply-refer-input"
                type="text"
                placeholder="Enter Friend's User ID..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="flex-1 bg-[#f5e5cf]/90 border border-[#8d5b2d]/50 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-mono text-[#291407] placeholder-[#7d512a]/70 focus:outline-none focus:ring-1 focus:ring-[#8d5b2d]"
              />
              <button
                id="apply-refer-submit-btn"
                type="submit"
                disabled={isApplying || !inputCode.trim()}
                className="px-3 py-1.5 rounded-lg bg-[#3b1c09] hover:bg-[#271205] active:scale-95 text-[#fef08a] text-xs font-serif font-bold transition-all shadow cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isApplying ? 'Checking...' : 'Apply Code'}
              </button>
            </form>

            {applyStatus.message && (
              <div
                className={`relative z-10 mb-2 px-2.5 py-1 rounded text-xs font-serif text-center ${
                  applyStatus.type === 'success'
                    ? 'bg-emerald-800/20 text-emerald-900 border border-emerald-700/40'
                    : 'bg-rose-800/20 text-rose-950 border border-rose-700/40'
                }`}
              >
                {applyStatus.message}
              </div>
            )}

            {/* Navigation Tabs (Top Captains / My Recruited Crew) */}
            <div className="relative z-10 flex items-center justify-center gap-2 mb-3">
              <button
                id="refer-tab-captains"
                onClick={() => {
                  SoundManager.play('click');
                  setViewTab('ranks');
                }}
                className={`px-3 py-1 rounded-full text-xs font-serif font-bold transition-all cursor-pointer ${
                  viewTab === 'ranks'
                    ? 'bg-[#3b1c09] text-[#fef08a] shadow border border-[#d97706]/60 scale-105'
                    : 'bg-[#432512]/15 text-[#381a08] hover:bg-[#432512]/25'
                }`}
              >
                Top Bounty Captains
              </button>
              <button
                id="refer-tab-mycrew"
                onClick={() => {
                  SoundManager.play('click');
                  setViewTab('my_crew');
                }}
                className={`px-3 py-1 rounded-full text-xs font-serif font-bold transition-all cursor-pointer ${
                  viewTab === 'my_crew'
                    ? 'bg-[#3b1c09] text-[#fef08a] shadow border border-[#d97706]/60 scale-105'
                    : 'bg-[#432512]/15 text-[#381a08] hover:bg-[#432512]/25'
                }`}
              >
                My Recruits ({profile?.referralsList?.length || 0})
              </button>
            </div>

            {/* Content Area with Top 3 Podium and Crew List */}
            <div className="relative min-h-[380px] max-h-[50vh] overflow-y-auto px-1 sm:px-2 py-1">
              {/* Dotted Treasure Trail SVG Background */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                viewBox="0 0 400 500"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M 85 85 C 130 50, 160 50, 200 75 C 240 100, 280 60, 315 85 C 345 110, 320 170, 290 195 C 250 230, 200 240, 140 270 C 80 300, 80 360, 140 390 C 210 425, 270 450, 250 495"
                  stroke="#7c6043"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              </svg>

              {viewTab === 'ranks' ? (
                <>
                  {/* Top 3 Captains Podium matching screenshot */}
                  <div
                    id="refer-top-podium"
                    className="relative z-10 grid grid-cols-3 gap-1 sm:gap-2 items-end pt-1 pb-4"
                  >
                    {/* Rank 2 (Left) */}
                    <div className="flex flex-col items-center text-center relative">
                      <div className="absolute -left-2 sm:-left-3 top-10 pointer-events-none opacity-90">
                        <RumBarrelsSvg className="w-8 h-8 sm:w-9 sm:h-9" />
                      </div>
                      <div className="mb-0.5">
                        <LaurelWreathSvg rank={2} className="w-8 h-8 sm:w-9 sm:h-9" />
                      </div>
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-white shadow-md overflow-hidden bg-[#e0c7a5]">
                        {top2?.avatar && !top2.avatar.includes('dicebear') ? (
                          <img
                            src={top2.avatar}
                            alt={top2.username}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <PirateAvatarSvg type={2} className="w-full h-full" />
                        )}
                      </div>
                      <span className="font-serif font-bold text-xs sm:text-sm text-[#291407] mt-1 line-clamp-1">
                        *{formatName(top2?.username || 'Open Spot')}*
                      </span>
                      <span className="font-serif text-[11px] sm:text-xs font-semibold text-[#3b1c09]">
                        Score : ₹{top2 ? top2.totalEarned : 0}
                      </span>
                    </div>

                    {/* Rank 1 (Center - "Our captain") */}
                    <div className="flex flex-col items-center text-center relative -mt-3">
                      <div className="mb-0.5">
                        <LaurelWreathSvg rank={1} isGold={true} className="w-9 h-9 sm:w-11 sm:h-11" />
                      </div>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-[#ecd1b0]">
                        {top1?.avatar && !top1.avatar.includes('dicebear') ? (
                          <img
                            src={top1.avatar}
                            alt={top1.username}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <PirateAvatarSvg type={1} className="w-full h-full" />
                        )}
                      </div>
                      <span className="font-serif italic text-[11px] sm:text-xs text-[#3d200e] mt-1">
                        Our captain
                      </span>
                      <span className="font-serif font-bold text-xs sm:text-base text-[#291407] line-clamp-1">
                        *{formatName(top1?.username || 'Open Spot')}*
                      </span>
                      <div className="my-0.5">
                        <ShipWheelSvg className="w-4 h-4 sm:w-5 sm:h-5 text-[#451a03]" />
                      </div>
                      <span className="font-serif text-xs sm:text-sm font-bold text-[#291407]">
                        Score : ₹{top1 ? top1.totalEarned : 0}
                      </span>
                    </div>

                    {/* Rank 3 (Right) */}
                    <div className="flex flex-col items-center text-center relative">
                      <div className="absolute -left-4 sm:-left-6 top-6 pointer-events-none opacity-85">
                        <CrossedSwordsSvg className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      <div className="absolute -right-2 sm:-right-3 top-10 pointer-events-none opacity-90">
                        <PirateCannonSvg className="w-8 h-8 sm:w-9 sm:h-9" />
                      </div>
                      <div className="mb-0.5">
                        <LaurelWreathSvg rank={3} className="w-8 h-8 sm:w-9 sm:h-9" />
                      </div>
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-white shadow-md overflow-hidden bg-[#dfc6a3]">
                        {top3?.avatar && !top3.avatar.includes('dicebear') ? (
                          <img
                            src={top3.avatar}
                            alt={top3.username}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <PirateAvatarSvg type={3} className="w-full h-full" />
                        )}
                      </div>
                      <span className="font-serif font-bold text-xs sm:text-sm text-[#291407] mt-1 line-clamp-1">
                        *{formatName(top3?.username || 'Open Spot')}*
                      </span>
                      <span className="font-serif text-[11px] sm:text-xs font-semibold text-[#3b1c09]">
                        Score : ₹{top3 ? top3.totalEarned : 0}
                      </span>
                    </div>
                  </div>

                  {/* Ranks 4, 5, 6... Crew List */}
                  <div id="refer-crew-list" className="relative z-10 flex flex-col gap-2.5 mt-2 px-1">
                    {crewList.length > 0 ? (
                      crewList.map((player) => {
                        const isCurrentUser = player.userId === userId;
                        return (
                          <div
                            key={player.userId || player.rank}
                            id={`refer-rank-${player.rank}`}
                            className={`flex items-center justify-between py-1.5 px-2 rounded-xl transition-colors ${
                              isCurrentUser
                                ? 'bg-[#d97706]/20 border border-[#b45309]/50'
                                : 'hover:bg-[#432512]/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-sm overflow-hidden bg-[#e8cfad] shrink-0">
                                {player.avatar && !player.avatar.includes('dicebear') ? (
                                  <img
                                    src={player.avatar}
                                    alt={player.username}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <PirateAvatarSvg type={player.rank} className="w-full h-full" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-serif font-bold text-xs sm:text-sm text-[#291407] flex items-center gap-1.5">
                                  <span>*{formatName(player.username)}*</span>
                                  {isCurrentUser && (
                                    <span className="text-[10px] bg-[#3b1c09] text-[#fef08a] px-1.5 py-0.2 rounded font-sans font-medium">
                                      You
                                    </span>
                                  )}
                                </span>
                                <span className="font-serif text-[11px] sm:text-xs font-semibold text-[#3d200e]">
                                  Score : ₹{player.totalEarned} • {player.totalInvited} Recruits
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0 pr-1">
                              <LaurelWreathSvg rank={player.rank} className="w-8 h-8 sm:w-9 sm:h-9" />
                            </div>
                          </div>
                        );
                      })
                    ) : !top1 && !top2 && !top3 ? (
                      <div className="text-center py-10 px-4">
                        <p className="font-serif text-sm font-semibold text-[#3b1c09]">
                          No referral bounty recorded yet.
                        </p>
                        <p className="font-serif text-xs text-[#542d12] mt-1">
                          Share your User ID with friends to become the first Captain!
                        </p>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                /* My Recruits View */
                <div id="refer-my-recruits" className="relative z-10 flex flex-col gap-2 py-1">
                  {profile && profile.referralsList && profile.referralsList.length > 0 ? (
                    profile.referralsList.map((ref, idx) => (
                      <div
                        key={ref.id || idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#f5e5cf]/85 border border-[#8d5b2d]/40 shadow-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-[#e0c7a5]">
                            <PirateAvatarSvg type={idx + 4} className="w-full h-full" />
                          </div>
                          <div>
                            <span className="font-serif font-bold text-xs sm:text-sm text-[#291407] block">
                              *{formatName(ref.refereeName || ref.refereeId)}*
                            </span>
                            <span className="text-[11px] font-serif text-[#542d12]">
                              Status:{' '}
                              {ref.status === 'COMPLETED' || ref.rewardCredited
                                ? 'Qualified (+₹20)'
                                : 'Pending 1st Match'}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-serif font-bold px-2 py-0.5 rounded-full ${
                            ref.status === 'COMPLETED' || ref.rewardCredited
                              ? 'bg-emerald-800 text-emerald-100'
                              : 'bg-amber-800 text-amber-100'
                          }`}
                        >
                          {ref.status === 'COMPLETED' || ref.rewardCredited ? 'Earned ₹20' : 'Pending'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 px-4">
                      <Users className="w-10 h-10 mx-auto text-[#7c502b] mb-2 opacity-80" />
                      <p className="font-serif text-sm font-semibold text-[#3b1c09]">
                        No recruited pirates yet!
                      </p>
                      <p className="font-serif text-xs text-[#542d12] mt-1">
                        Send your User ID ({actualReferCode}) to your crew to earn ₹20 each!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Decorative Nautical Anchor near bottom-right */}
              <div className="flex justify-end pr-3 pt-3 pb-1 pointer-events-none opacity-85">
                <NauticalAnchorSvg className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
