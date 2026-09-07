import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
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

export interface LeaderboardItem {
  rank: number;
  userId: string;
  idNumber: string;
  username: string;
  avatar: string;
  highestScore: number;
  matchesPlayed: number;
  matchesWon: number;
  playingMatch?: string;
  isPlaying?: boolean;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onPlayGame?: () => void;
}

type MatchTypeOption = 'all' | 'supreme' | 'snake' | 'arena';

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  userId = 'default_user',
}) => {
  const [gameType, setGameType] = useState<MatchTypeOption>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Clean, production-ready display name formatter
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

  const fetchRealLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetches real database records for this match mode
      const url = `/api/leaderboard/highest-scores?timeframe=all-time&gameType=${gameType}&userId=${encodeURIComponent(
        userId
      )}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard);
        }
      }
    } catch (err) {
      console.warn('Failed to load real leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [gameType, userId]);

  useEffect(() => {
    if (isOpen) {
      fetchRealLeaderboard();
    }
  }, [isOpen, fetchRealLeaderboard]);

  if (!isOpen) return null;

  const top1 = leaderboard[0] || null;
  const top2 = leaderboard[1] || null;
  const top3 = leaderboard[2] || null;
  const crewList = leaderboard.slice(3);

  const matchTypes: { id: MatchTypeOption; label: string }[] = [
    { id: 'all', label: 'All Matches' },
    { id: 'supreme', label: 'Ludo Supreme' },
    { id: 'snake', label: 'Snake Ludo' },
    { id: 'arena', label: 'Online Arena' },
  ];

  return (
    <AnimatePresence>
      <div
        id="leaderboard-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm select-none overflow-y-auto"
      >
        {/* Outer Background Wrapper styled with warm desert sand tone matching screenshot */}
        <motion.div
          id="leaderboard-dialog-frame"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-[480px] my-auto flex flex-col items-center"
        >
          {/* Close Button Top-Right (Styled as ornate wax seal / vintage button) */}
          <button
            id="leaderboard-close-btn"
            onClick={() => {
              SoundManager.play('click');
              onClose();
            }}
            className="absolute -top-3 -right-2 sm:-top-4 sm:-right-3 z-30 w-9 h-9 rounded-full bg-[#45210d] hover:bg-[#321607] active:scale-95 text-[#fef3c7] flex items-center justify-center shadow-lg border-2 border-[#d97706]/70 transition-all cursor-pointer"
            aria-label="Close Leaderboard"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Refresh Button Top-Left */}
          <button
            id="leaderboard-refresh-btn"
            onClick={() => {
              SoundManager.play('click');
              fetchRealLeaderboard();
            }}
            disabled={isLoading}
            className="absolute -top-3 -left-2 sm:-top-4 sm:-left-3 z-30 w-9 h-9 rounded-full bg-[#45210d] hover:bg-[#321607] active:scale-95 text-[#fef3c7] flex items-center justify-center shadow-lg border-2 border-[#d97706]/70 transition-all cursor-pointer disabled:opacity-50"
            aria-label="Refresh Scores"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Realistic Torn Parchment Map Container */}
          <div
            id="leaderboard-parchment"
            className="relative w-full bg-gradient-to-b from-[#ceb28a] via-[#c4a67d] to-[#b9986c] p-4 sm:p-6 shadow-[0_20px_50px_rgba(25,12,4,0.55)] border border-[#a17e52]/40"
            style={{
              clipPath:
                'polygon(0% 3%, 1.5% 1.5%, 3% 2.8%, 6% 0.8%, 10% 2.2%, 15% 1%, 20% 2.5%, 26% 0.8%, 32% 2%, 38% 0.5%, 45% 2%, 52% 0.8%, 60% 2.2%, 67% 0.5%, 74% 2%, 81% 0.8%, 88% 2.2%, 94% 0.8%, 98% 2.5%, 100% 4.5%, 98.8% 9%, 99.8% 15%, 98.2% 21%, 99.5% 28%, 98.5% 35%, 99.8% 42%, 98.2% 50%, 99.6% 58%, 98.4% 66%, 99.8% 74%, 98.2% 82%, 99.5% 90%, 98% 96%, 95.5% 99%, 89% 97.5%, 83% 99.5%, 76% 98%, 69% 99.2%, 62% 97.8%, 55% 99.5%, 48% 98%, 41% 99.2%, 34% 97.8%, 27% 99.5%, 20% 98%, 13% 99.2%, 6% 97.8%, 2% 99%, 0.5% 96%, 1.6% 90%, 0.5% 83%, 1.8% 76%, 0.4% 68%, 1.6% 60%, 0.5% 52%, 1.8% 44%, 0.4% 36%, 1.6% 28%, 0.5% 20%, 1.8% 12%, 0.5% 5%)',
            }}
          >
            {/* Corner Decorative Asset 1: Pirate Galleon perched on Top-Right */}
            <div className="absolute top-1 right-2 pointer-events-none z-20">
              <PirateShipSvg className="w-20 h-20 sm:w-24 sm:h-24 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]" />
            </div>

            {/* Corner Decorative Asset 2: Open Golden Treasure Chest perched on Bottom-Left */}
            <div className="absolute -bottom-2 -left-2 pointer-events-none z-20">
              <TreasureChestSvg className="w-22 h-20 sm:w-26 sm:h-22 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]" />
            </div>

            {/* 1. Header Title: "Leaderboard" (Exactly as requested by user) */}
            <div className="text-center pt-2 pb-1 relative z-10">
              <h1
                id="leaderboard-title"
                className="font-serif text-2xl sm:text-3xl font-extrabold text-[#291407] tracking-wider drop-shadow-sm"
              >
                Leaderboard
              </h1>
            </div>

            {/* 2. Match Type Selection Feature */}
            <div
              id="leaderboard-match-types"
              className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap mt-2 mb-4 relative z-10 px-1"
            >
              {matchTypes.map((type) => {
                const isActive = gameType === type.id;
                return (
                  <button
                    key={type.id}
                    id={`leaderboard-tab-${type.id}`}
                    onClick={() => {
                      SoundManager.play('click');
                      setGameType(type.id);
                    }}
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-serif font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#3b1c09] text-[#fef08a] shadow-[0_2px_4px_rgba(0,0,0,0.3)] border border-[#d97706]/60 scale-105'
                        : 'bg-[#432512]/15 text-[#381a08] hover:bg-[#432512]/25 border border-[#6b4226]/30'
                    }`}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>

            {/* Content Area with Top 3 Podium and Crew List */}
            <div className="relative min-h-[440px] max-h-[64vh] overflow-y-auto px-1 sm:px-2 py-2">
              {/* Dotted Treasure Trail SVG background */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                viewBox="0 0 400 550"
                fill="none"
                preserveAspectRatio="none"
              >
                {/* Dashed trail weaving from Rank 2 -> Rank 1 -> Rank 3 -> through list -> Chest */}
                <path
                  d="M 85 85 C 130 50, 160 50, 200 75 C 240 100, 280 60, 315 85 C 345 110, 320 170, 290 195 C 250 230, 200 240, 140 270 C 80 300, 80 360, 140 390 C 210 425, 270 450, 250 495 C 230 540, 130 520, 70 510"
                  stroke="#7c6043"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              </svg>

              {/* 3. Top 3 Podium Arrangement (Matching Screenshot) */}
              <div
                id="leaderboard-top-podium"
                className="relative z-10 grid grid-cols-3 gap-1 sm:gap-2 items-end pt-1 pb-4"
              >
                {/* Rank 2 (Left) */}
                <div className="flex flex-col items-center text-center relative">
                  {/* Pair of Rum Barrels near Rank 2 */}
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
                    *{formatName(top2?.username || 'No crew')}*
                  </span>
                  <span className="font-serif text-[11px] sm:text-xs font-semibold text-[#3b1c09]">
                    Score : {top2 ? top2.highestScore : 0}
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
                  {/* Ship's Wheel / Helm Icon */}
                  <div className="my-0.5">
                    <ShipWheelSvg className="w-4 h-4 sm:w-5 sm:h-5 text-[#451a03]" />
                  </div>
                  <span className="font-serif text-xs sm:text-sm font-bold text-[#291407]">
                    Score : {top1 ? top1.highestScore : 0}
                  </span>
                </div>

                {/* Rank 3 (Right) */}
                <div className="flex flex-col items-center text-center relative">
                  {/* Crossed Swords between Rank 1 and Rank 3 */}
                  <div className="absolute -left-4 sm:-left-6 top-6 pointer-events-none opacity-85">
                    <CrossedSwordsSvg className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  {/* Pirate Cannon near Rank 3 */}
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
                    *{formatName(top3?.username || 'No crew')}*
                  </span>
                  <span className="font-serif text-[11px] sm:text-xs font-semibold text-[#3b1c09]">
                    Score : {top3 ? top3.highestScore : 0}
                  </span>
                </div>
              </div>

              {/* 4. Ranks 4, 5, 6, etc. List (Crew Members) */}
              <div id="leaderboard-crew-list" className="relative z-10 flex flex-col gap-2.5 mt-2 px-1">
                {crewList.length > 0 ? (
                  crewList.map((player) => {
                    const isCurrentUser = player.userId === userId;
                    return (
                      <div
                        key={player.userId || player.rank}
                        id={`leaderboard-rank-${player.rank}`}
                        className={`flex items-center justify-between py-1.5 px-2 rounded-xl transition-colors ${
                          isCurrentUser
                            ? 'bg-[#d97706]/20 border border-[#b45309]/50'
                            : 'hover:bg-[#432512]/10'
                        }`}
                      >
                        {/* Left: Avatar with white circular border */}
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

                          {/* Player Name and Real Score */}
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
                              Score : {player.highestScore}
                            </span>
                          </div>
                        </div>

                        {/* Right: Laurel Wreath with Rank Number */}
                        <div className="shrink-0 pr-1">
                          <LaurelWreathSvg rank={player.rank} className="w-8 h-8 sm:w-9 sm:h-9" />
                        </div>
                      </div>
                    );
                  })
                ) : !top1 && !top2 && !top3 ? (
                  <div className="text-center py-12 px-4">
                    <p className="font-serif text-sm font-semibold text-[#3b1c09]">
                      No recorded matches found for this match type yet.
                    </p>
                    <p className="font-serif text-xs text-[#542d12] mt-1">
                      Play a match now to establish the high score!
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Decorative Nautical Anchor near bottom right of list */}
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
