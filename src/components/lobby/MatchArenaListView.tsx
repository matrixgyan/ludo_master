import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  Trophy,
  Play,
  Sparkles,
  RefreshCw,
  Info,
  ShieldCheck,
  Flame,
  Crown,
  Zap,
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import { PlayerModeOption, GameVariation, PlayerConfig } from './LudoModeSelectorModal';
import { ArenaRulesInfoModal } from './ArenaRulesInfoModal';
import arabAvatarImg from '../../assets/images/arab_avatar_man_1787143002600.jpg';
import woodBgImg from '../../assets/images/wood_plank_bg_1787143024792.jpg';
import { useGameSettings } from '../../hooks/useGameSettings';

export interface MatchRoomItem {
  roomId: string;
  matchCode: string;
  poolId: string;
  gameMode: 'ONLINE_ARENA' | 'LUDO_SUPREME';
  playerCount: number;
  entryFee: string;
  entryFeeUsdt: number;
  grossPrizePool: string;
  platformFee: string;
  netPrizePool: string;
  status: 'OPEN' | 'FILLING' | 'STARTING';
  joinedPlayers: number;
  maxPlayers: number;
  remainingSlots: number;
  fillPercentage: number;
  createdAt: string;
}

interface MatchArenaListViewProps {
  isOpen: boolean;
  initialMode?: 'classic' | 'supreme' | 'snake';
  balance: number;
  onClose: () => void;
  onSelectAndJoinMatch: (
    mode: PlayerModeOption,
    entryFee: number,
    prizePool: number,
    gameType: 'classic' | 'supreme' | 'snake',
    variation?: GameVariation,
    playersConfig?: PlayerConfig[]
  ) => void;
  onOpenDeposit?: () => void;
  onOpenLocalPassAndPlay?: () => void;
}

// Deterministic Pool Tier Definitions
interface PoolTier {
  fee: number;
  title: string;
  tag?: string;
  isHot?: boolean;
  colorName: 'red' | 'yellow' | 'green' | 'blue';
}

const POOLS_BY_PLAYER_COUNT: Record<PlayerModeOption, PoolTier[]> = {
  2: [
    { fee: 0, title: 'Free Training', tag: 'Practice', colorName: 'red' },
    { fee: 1, title: 'Micro Duel', tag: 'Beginner', isHot: true, colorName: 'yellow' },
    { fee: 5, title: 'Popular Duel', tag: 'Popular', isHot: true, colorName: 'red' },
    { fee: 10, title: 'High Stakes 1v1', tag: 'High Roller', colorName: 'yellow' },
    { fee: 25, title: 'Grand Arena', tag: 'Pro League', colorName: 'red' },
    { fee: 50, title: 'VIP Championship', tag: 'VIP Elite', colorName: 'yellow' },
    { fee: 100, title: 'High Roller Legend', tag: 'Supreme', colorName: 'red' },
  ],
  3: [
    { fee: 0, title: 'Free Trio Arena', tag: 'Practice', colorName: 'red' },
    { fee: 1, title: 'Trio Micro Clash', tag: 'Quick 3P', isHot: true, colorName: 'yellow' },
    { fee: 5, title: 'Trio Showdown', tag: 'Popular', isHot: true, colorName: 'green' },
    { fee: 10, title: 'Master 3P Clash', tag: 'High Stakes', colorName: 'red' },
    { fee: 25, title: 'Grand Trio League', tag: 'Pro', colorName: 'yellow' },
    { fee: 50, title: 'VIP 3P Royal', tag: 'VIP', colorName: 'green' },
    { fee: 100, title: 'VIP 3P Supreme', tag: 'High Roller', colorName: 'yellow' },
  ],
  4: [
    { fee: 0, title: 'Free 4P Rumble', tag: 'Practice', colorName: 'red' },
    { fee: 1, title: '4P Mini Rumble', tag: 'Beginner', isHot: true, colorName: 'yellow' },
    { fee: 5, title: 'Classic 4P Battle', tag: 'Most Popular', isHot: true, colorName: 'green' },
    { fee: 10, title: 'Supreme 4P Rumble', tag: 'Stakes', colorName: 'blue' },
    { fee: 25, title: 'Master 4P League', tag: 'Grand Prize', colorName: 'red' },
    { fee: 50, title: 'VIP 4P Championship', tag: 'High Roller', colorName: 'yellow' },
    { fee: 100, title: 'Ultimate 4P Crown', tag: 'Supreme Royal', colorName: 'green' },
  ],
};

const COLOR_MAP: Record<string, { bg: string; border: string }> = {
  red: { bg: '#f23c4d', border: '#b91c1c' },
  yellow: { bg: '#f7d800', border: '#ca8a04' },
  green: { bg: '#2ecc71', border: '#15803d' },
  blue: { bg: '#3498db', border: '#1d4ed8' },
};

export const MatchArenaListView: React.FC<MatchArenaListViewProps> = ({
  isOpen,
  initialMode = 'classic',
  balance,
  onClose,
  onSelectAndJoinMatch,
  onOpenDeposit,
}) => {
  const { getPoolsForCount, calculateNetPrize, prizePoolPercentage } = useGameSettings();
  const [activeGameType, setActiveGameType] = useState<'classic' | 'supreme' | 'snake'>(initialMode);
  const [variation, setVariation] = useState<GameVariation>('Classic');
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<PlayerModeOption>(2);
  const [rooms, setRooms] = useState<MatchRoomItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [joiningPoolKey, setJoiningPoolKey] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveGameType(initialMode);
    }
  }, [isOpen, initialMode]);

  // Fetch Rooms from API
  const fetchLobbyRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      const apiEndpoint =
        activeGameType === 'classic'
          ? '/api/lobby/ludo-arena'
          : activeGameType === 'snake'
          ? '/api/lobby/snake-ludo'
          : '/api/lobby/ludo-supreme';

      const url = `${apiEndpoint}?playerCount=${selectedPlayerCount}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.rooms && Array.isArray(data.rooms)) {
          setRooms(data.rooms);
        }
      }
    } catch (err) {
      console.warn('Could not fetch server rooms:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeGameType, selectedPlayerCount]);

  useEffect(() => {
    if (!isOpen) return;
    fetchLobbyRooms();
    const interval = setInterval(fetchLobbyRooms, 5000);
    return () => clearInterval(interval);
  }, [isOpen, fetchLobbyRooms]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Join Match Arena
  const handleJoinMatchRoom = async (
    count: PlayerModeOption,
    entryFee: number,
    prizePool: number,
    roomId?: string
  ) => {
    SoundManager.play('click');
    const poolKey = `${count}p_${entryFee}_${roomId || 'pool'}`;
    setJoiningPoolKey(poolKey);

    // If entry fee > 0 and balance is lower, notify and redirect to deposit if available
    if (entryFee > 0 && balance < entryFee) {
      showToast(`⚠️ Insufficient USDT balance ($${balance.toFixed(2)}). Deposit USDT or try free practice!`);
      if (onOpenDeposit) {
        setTimeout(() => onOpenDeposit(), 700);
      }
      setJoiningPoolKey(null);
      return;
    }

    try {
      // Direct API Call to reserve room
      await fetch('/api/matches/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: `user_guest_${Date.now().toString().slice(-6)}`,
          username: 'Muonimoon',
          gameMode: activeGameType === 'classic' ? 'ONLINE_ARENA' : 'LUDO_SUPREME',
          playerCount: count,
          entryFee: entryFee,
          roomId: roomId,
        }),
      });

      showToast('✓ Match found! Starting arena...');
      setTimeout(() => {
        onSelectAndJoinMatch(
          count,
          entryFee,
          prizePool,
          activeGameType,
          variation,
          [
            {
              id: 'p1',
              name: 'Muonimoon',
              color: 'red',
              avatarUrl: arabAvatarImg,
              isHuman: true,
            },
            {
              id: 'p2',
              name: 'Player 2',
              color: 'yellow',
              avatarUrl: arabAvatarImg,
              isHuman: false,
            },
            {
              id: 'p3',
              name: 'Player 3',
              color: 'green',
              avatarUrl: arabAvatarImg,
              isHuman: false,
            },
            {
              id: 'p4',
              name: 'Player 4',
              color: 'blue',
              avatarUrl: arabAvatarImg,
              isHuman: false,
            },
          ]
        );
      }, 350);
    } catch {
      // Fallback
      onSelectAndJoinMatch(count, entryFee, prizePool, activeGameType, variation);
    } finally {
      setJoiningPoolKey(null);
    }
  };

  const currentPoolTiers = getPoolsForCount(selectedPlayerCount, activeGameType);

  return (
    <>
      <AnimatePresence>
        <div key="match-arena-list-view-root" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 select-none overflow-y-auto">
          {/* Backdrop Overlay */}
          <motion.div
            key="match-arena-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
          />

          {/* 1. WOODEN PLANK BACKGROUND CONTAINER */}
          <motion.div
            key="match-arena-modal-card"
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-sm sm:max-w-md rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)] border-4 border-[#5c2411]/90 my-auto"
          style={{
            backgroundImage: `url(${woodBgImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#8b4513',
          }}
        >
          {/* Warm Conical Spotlight from Top */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(255, 238, 187, 0.45) 0%, rgba(0, 0, 0, 0.6) 100%)',
            }}
          />

          {/* Close button (top right of wooden canvas) */}
          <button
            onClick={() => {
              SoundManager.play('click');
              onClose();
            }}
            className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/55 hover:bg-black/85 text-amber-100 flex items-center justify-center border border-amber-300/40 shadow-lg cursor-pointer transition-transform active:scale-95"
            title="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Inner Padding Container */}
          <div className="relative z-10 px-3 sm:px-4 py-5 flex flex-col items-center">
            {/* 2. THE TORN PARCHMENT SCROLL BOARD */}
            <div className="relative w-full max-w-[360px] sm:max-w-[390px] filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.7)]">
              {/* TOP PUSHPINS (Deep Glossy Violet 3D Spheres with specularity and cast shadow) */}
              {/* Left Pushpin */}
              <div className="absolute -top-2 left-3 z-30 pointer-events-none">
                <div className="relative w-5 h-5 rounded-full bg-gradient-to-tr from-[#3b0764] via-[#581c87] to-[#7e22ce] shadow-[0_3px_6px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.6)] border border-[#a855f7]/60 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/90 absolute top-1 left-1 blur-[0.3px]" />
                </div>
                <div className="w-4 h-2 bg-black/40 rounded-full blur-[1px] absolute -bottom-0.5 left-0.5" />
              </div>

              {/* Right Pushpin */}
              <div className="absolute -top-2 right-3 z-30 pointer-events-none">
                <div className="relative w-5 h-5 rounded-full bg-gradient-to-tr from-[#3b0764] via-[#581c87] to-[#7e22ce] shadow-[0_3px_6px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.6)] border border-[#a855f7]/60 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/90 absolute top-1 left-1 blur-[0.3px]" />
                </div>
                <div className="w-4 h-2 bg-black/40 rounded-full blur-[1px] absolute -bottom-0.5 left-0.5" />
              </div>

              {/* Parchment Body */}
              <div
                className="relative w-full bg-gradient-to-b from-[#fde79b] via-[#fde492] to-[#f8d47b] text-[#5c2411] px-4 pt-5 pb-6 shadow-inner overflow-hidden border border-[#dfb35e]/60"
                style={{
                  clipPath: `polygon(
                    0% 0%, 
                    100% 0%, 
                    100% 32%, 
                    97.2% 34%, 
                    100% 36%, 
                    100% 68%, 
                    96.5% 70%, 
                    100% 72%, 
                    100% 94%, 
                    97% 96%, 
                    94% 94%, 
                    85% 96%, 
                    75% 94%, 
                    65% 98%, 
                    50% 93%, 
                    35% 97%, 
                    25% 94%, 
                    15% 96%, 
                    5% 94%, 
                    0% 97%, 
                    0% 75%, 
                    3.5% 73%, 
                    0% 71%, 
                    0% 40%, 
                    3.2% 38%, 
                    0% 36%
                  )`,
                }}
              >
                {/* Vintage Corner Flourishes / Filigree SVG */}
                {/* Top-Left Filigree */}
                <svg className="absolute top-2 left-2 w-8 h-8 text-[#caa050]/40 pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M10,10 Q40,15 50,40 Q25,35 15,60 Q10,35 10,10 Z M20,10 Q60,10 70,50 Q40,30 20,10 Z" />
                </svg>
                {/* Top-Right Filigree */}
                <svg className="absolute top-2 right-2 w-8 h-8 text-[#caa050]/40 pointer-events-none rotate-90" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M10,10 Q40,15 50,40 Q25,35 15,60 Q10,35 10,10 Z M20,10 Q60,10 70,50 Q40,30 20,10 Z" />
                </svg>
                {/* Bottom-Left Filigree */}
                <svg className="absolute bottom-5 left-2 w-8 h-8 text-[#caa050]/40 pointer-events-none -rotate-90" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M10,10 Q40,15 50,40 Q25,35 15,60 Q10,35 10,10 Z M20,10 Q60,10 70,50 Q40,30 20,10 Z" />
                </svg>
                {/* Bottom-Right Filigree */}
                <svg className="absolute bottom-5 right-2 w-8 h-8 text-[#caa050]/40 pointer-events-none rotate-180" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M10,10 Q40,15 50,40 Q25,35 15,60 Q10,35 10,10 Z M20,10 Q60,10 70,50 Q40,30 20,10 Z" />
                </svg>

                {/* 3. GAME MODE HEADER & CYAN INFO BUTTON (Exact Match to Screenshot) */}
                <div className="relative flex flex-col items-center mb-3 text-center">
                  {/* Sky-Blue Beveled 3D Info Button (Top Right) */}
                  <button
                    onClick={() => {
                      SoundManager.play('click');
                      setShowInfoModal(true);
                    }}
                    className="absolute -top-1 right-0 w-8 h-8 rounded-lg bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] border-2 border-[#7dd3fc] shadow-[0_3px_8px_rgba(2,132,199,0.5),inset_0_2px_3px_rgba(255,255,255,0.7)] flex items-center justify-center text-white font-serif font-black text-sm active:scale-95 transition-transform cursor-pointer"
                    title="Rules Information"
                  >
                    i
                  </button>

                  <h2 className="text-base sm:text-lg font-black text-[#5c2411] tracking-wider uppercase drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] font-sans">
                    GAME MODE
                  </h2>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#5c2411] tracking-tight leading-none mt-0.5">
                    {activeGameType === 'snake'
                      ? 'Snake Ludo'
                      : activeGameType === 'classic'
                      ? 'Online Arena'
                      : 'Ludo Supreme'}
                  </h1>
                </div>

                {/* 4. ARENA TOURNAMENT FORMAT BANNER */}
                <div className="mb-3">
                  <div className="bg-gradient-to-r from-[#2e1307]/95 via-[#421b0b]/95 to-[#2e1307]/95 rounded-2xl p-2 sm:p-2.5 border border-[#dfb35e]/60 shadow-[0_3px_8px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,0.12)] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#ffd166] via-[#f59e0b] to-[#b45309] border border-amber-300 shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.6)] flex items-center justify-center text-slate-950 shrink-0">
                        {activeGameType === 'snake' ? (
                          <Flame className="w-4 h-4 fill-slate-950 text-slate-950" />
                        ) : activeGameType === 'classic' ? (
                          <Trophy className="w-4 h-4 fill-slate-950 text-slate-950" />
                        ) : (
                          <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-black text-amber-300 uppercase tracking-wider leading-none flex items-center gap-1.5">
                          <span>
                            {activeGameType === 'snake'
                              ? 'Snake Ludo Race'
                              : activeGameType === 'classic'
                              ? 'Full Classic Match'
                              : '3-Min Speed Battle'}
                          </span>
                          <span className="bg-emerald-600/90 text-white text-[8.5px] px-1.5 py-0.5 rounded font-mono font-black shadow-sm">
                            {activeGameType === 'snake'
                              ? 'TILE 100 FINISH'
                              : activeGameType === 'classic'
                              ? '4 PAWNS HOME'
                              : '3 MIN RACE'}
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-100/85 font-semibold leading-tight mt-0.5">
                          {activeGameType === 'snake'
                            ? 'First to reach Tile 100 wins • Ladders & Snakes • 90% Net Payout'
                            : activeGameType === 'classic'
                            ? 'First to clear 4 pawns wins • Safe Stars • 90% Net Payout'
                            : 'Highest score in 3 min wins • Points Race • 90% Net Payout'}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 bg-amber-950/80 border border-amber-500/40 px-2 py-1 rounded-lg text-[9px] font-black text-amber-300 shadow-inner">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">PROVABLY</span> FAIR
                    </div>
                  </div>
                </div>

                {/* 5. PLAYER SELECTION (2P / 3P / 4P Checkbox Capsules - Exact Screenshot Match) */}
                <div className="mb-3">
                  <h3 className="text-xs sm:text-sm font-black text-[#5c2411] uppercase tracking-wider text-center mb-1.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                    PLAYER INFORMATION
                  </h3>

                  {/* 2P, 3P, 4P Capsule Selectors */}
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2.5">
                    {([2, 3, 4] as PlayerModeOption[]).map((count) => {
                      const isSelected = selectedPlayerCount === count;
                      return (
                        <motion.button
                          key={`count-${count}`}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            SoundManager.play('click');
                            setSelectedPlayerCount(count);
                          }}
                          className="flex items-center gap-1.5 bg-gradient-to-b from-[#944a69] via-[#813a58] to-[#6a2b45] text-white px-3 py-1.5 rounded-full border-2 border-[#b86d8c] shadow-[0_4px_8px_rgba(0,0,0,0.35),inset_0_2px_3px_rgba(255,255,255,0.4)] cursor-pointer"
                        >
                          <span className="font-black text-xs sm:text-sm tracking-wide">{count}P</span>

                          {/* Checkbox Square (Green with check when selected, lavender box when unselected) */}
                          <div
                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-gradient-to-b from-[#4ade80] to-[#22c55e] border border-[#bbf7d0] shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] text-white'
                                : 'bg-gradient-to-b from-[#9aa3b8] to-[#7f889e] border border-[#c3cbd9] shadow-inner'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3.5]" />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Toast Feedback */}
                  {toastMessage && (
                    <div className="mb-2 py-1 px-2.5 rounded-xl bg-amber-950/80 border border-amber-400 text-amber-200 text-[11px] font-bold text-center flex items-center justify-center gap-1.5 shadow-md">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{toastMessage}</span>
                    </div>
                  )}

                  {/* 6. DYNAMIC PRIZE POOL MATCH LIST (NO INPUT BOXES - Filtered by 2P, 3P, or 4P) */}
                  <div className="space-y-2 max-h-[230px] overflow-y-auto pr-0.5 custom-scroll">
                    {currentPoolTiers.map((pool, idx) => {
                      const netPrize = calculateNetPrize(selectedPlayerCount, pool.fee);
                      const isJoining = joiningPoolKey === `${selectedPlayerCount}p_${pool.fee}_pool`;

                      return (
                        <motion.div
                          key={`${selectedPlayerCount}p-${pool.fee}-${idx}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => handleJoinMatchRoom(selectedPlayerCount, pool.fee, netPrize)}
                          className="w-full cursor-pointer group select-none"
                        >
                          {/* Caramel Wood Match Info Banner */}
                          <div className="w-full bg-gradient-to-r from-[#cf7d54] via-[#c6744a] to-[#b86b44] group-hover:from-[#d9875d] group-hover:via-[#ce7e54] group-hover:to-[#c4744d] text-white px-3.5 py-2.5 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.25),0_3px_6px_rgba(0,0,0,0.2)] border border-[#e89b72]/90 flex items-center justify-between transition-all group-hover:scale-[1.01] active:scale-[0.99]">
                            <div className="flex flex-col text-left">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-sm tracking-wide text-white leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
                                  {pool.title}
                                </span>
                                {pool.isHot && (
                                  <span className="bg-rose-600 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider text-white shadow-sm animate-pulse">
                                    HOT
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-amber-100 font-bold leading-tight mt-1 flex items-center gap-1">
                                <span className="text-amber-200/80 font-normal">Entry:</span>
                                <span className="text-amber-100 font-black font-mono">
                                  {pool.fee === 0 ? 'FREE PRACTICE' : `$${pool.fee.toFixed(2)} USDT`}
                                </span>
                              </div>
                            </div>

                            {/* Prize Payout & Play Button */}
                            <div className="flex items-center gap-2.5">
                              <div className="text-right">
                                <div className="text-[9px] text-amber-200/90 uppercase font-black tracking-wider">WIN PRIZE</div>
                                <div className="text-sm font-black font-mono text-yellow-300 drop-shadow flex items-center justify-end gap-1">
                                  <Trophy className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                                  <span>{netPrize === 0 ? 'Practice' : `$${netPrize.toFixed(2)}`}</span>
                                </div>
                              </div>

                              <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] border border-[#7dd3fc] shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] flex items-center justify-center text-white group-hover:scale-105 active:scale-95 transition-transform">
                                {isJoining ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Play className="w-4 h-4 fill-white translate-x-0.5" />
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* 7. BOTTOM STAKES FOOTER */}
                <div className="pt-2 border-t border-[#dfb35e]/70 flex items-center justify-between text-[11px] font-bold text-[#5c2411]">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Balance: ${balance.toFixed(2)} USDT</span>
                  </div>
                  <button
                    onClick={() => {
                      SoundManager.play('click');
                      fetchLobbyRooms();
                    }}
                    className="text-[10px] text-[#78350f] hover:text-[#5c2411] underline font-black cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh Pools</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      </AnimatePresence>

      {/* RICH ARENA RULES & PAYOUT INFO MODAL */}
      <ArenaRulesInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        gameType={activeGameType}
      />
    </>
  );
};
