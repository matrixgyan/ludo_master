import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Clock,
  Swords,
  Crown,
  Medal,
  X,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Award,
  Wallet,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundManager } from '../../audio/soundManager';
import { usePlatformMode } from '../../hooks/usePlatformMode';
import woodBgImg from '../../assets/images/wood_plank_bg_1787143024792.jpg';

interface TournamentParticipation {
  id: string;
  matchesPlayed: number;
  maxMatches: number;
  highestScore: number;
  status: string;
  tier: {
    tier: string;
    badge: string;
    color: string;
  };
  isCompleted: boolean;
}

interface TournamentItem {
  id: string;
  gameType: 'supreme' | 'snake';
  cadence: 'DAILY' | 'WEEKLY';
  title: string;
  description: string;
  entryFee: number;
  maxMatches: number;
  prizePool: number;
  startsAt: string;
  endsAt: string;
  status: string;
  participation: TournamentParticipation | null;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  highestScore: number;
  matchesPlayed: number;
  maxMatches: number;
  tier: string;
  tierBadge: string;
  tierColor: string;
  isCompleted: boolean;
}

interface SupremeLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  balance: number;
  onPlayTournamentMatch: (gameType: 'supreme' | 'snake', tournamentId: string) => void;
  onRefreshBalance?: () => void;
  onOpenDeposit?: () => void;
}

export const SupremeLeagueModal: React.FC<SupremeLeagueModalProps> = ({
  isOpen,
  onClose,
  userId = 'default_user',
  balance,
  onPlayTournamentMatch,
  onRefreshBalance,
  onOpenDeposit,
}) => {
  const { platformMode } = usePlatformMode();
  const sym = platformMode.currencySymbol;

  const [selectedGameType, setSelectedGameType] = useState<'supreme' | 'snake'>('supreme');
  const [selectedCadence, setSelectedCadence] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'rules'>('overview');

  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myStanding, setMyStanding] = useState<LeaderboardEntry | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Time left calculation
  const [countdown, setCountdown] = useState<string>('');

  // Fetch active tournaments
  const fetchTournaments = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/tournaments/active?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tournaments)) {
          setTournaments(data.tournaments);
        }
      }
    } catch (err) {
      console.warn('Error fetching tournaments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      fetchTournaments();
    }
  }, [isOpen, fetchTournaments]);

  // Identify currently selected tournament
  const currentTournament = tournaments.find(
    (t) => t.gameType === selectedGameType && t.cadence === selectedCadence
  );

  // Fetch tournament leaderboard when tab changes or tournament changes
  const fetchLeaderboard = useCallback(async (tournamentId: string) => {
    try {
      const res = await fetch(
        `/api/tournaments/${encodeURIComponent(tournamentId)}/leaderboard?userId=${encodeURIComponent(userId)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLeaderboard(data.leaderboard || []);
          setMyStanding(data.myStanding || null);
        }
      }
    } catch (err) {
      console.warn('Error fetching tournament leaderboard:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (currentTournament) {
      fetchLeaderboard(currentTournament.id);
    }
  }, [currentTournament, fetchLeaderboard]);

  // Countdown timer for active tournament end time
  useEffect(() => {
    if (!currentTournament?.endsAt) return;

    const updateCountdown = () => {
      const diff = new Date(currentTournament.endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('Ended');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${hours}h ${mins}m ${secs}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentTournament]);

  // Join Tournament Handler (Deducts ₹25 via authoritative backend ledger)
  const handleJoinTournament = async () => {
    if (!currentTournament) return;
    if (balance < currentTournament.entryFee) {
      setErrorMsg(`Insufficient balance (${sym}${balance.toFixed(2)}). Please add funds!`);
      SoundManager.play('score-minus');
      return;
    }

    try {
      setIsJoining(true);
      setErrorMsg(null);
      SoundManager.play('click');

      const res = await fetch('/api/tournaments/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tournamentId: currentTournament.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to join tournament');
      }

      SoundManager.play('score-double');
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      // Refresh list & balance
      await fetchTournaments();
      onRefreshBalance?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not join tournament');
      SoundManager.play('score-minus');
    } finally {
      setIsJoining(false);
    }
  };

  const handleStartMatch = () => {
    if (!currentTournament) return;
    SoundManager.play('dice-roll');
    onPlayTournamentMatch(currentTournament.gameType, currentTournament.id);
  };

  if (!isOpen) return null;

  const participation = currentTournament?.participation;
  const matchesPlayed = participation?.matchesPlayed ?? 0;
  const maxMatches = currentTournament?.maxMatches ?? 25;
  const highestScore = participation?.highestScore ?? 0;
  const isEnrolled = !!participation;
  const isCompleted = matchesPlayed >= maxMatches;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm"
        />

        {/* 1. WOODEN PLANK BACKGROUND CONTAINER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)] border-4 border-[#5c2411]/90 my-auto flex flex-col max-h-[94vh]"
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

          {/* TOP CLOSE BUTTON (Wooden / Gold circular button matching MatchArenaListView) */}
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
          <div className="relative z-10 px-3 sm:px-4 py-4 flex flex-col items-center flex-1 overflow-y-auto">
            {/* 2. THE TORN PARCHMENT SCROLL BOARD */}
            <div className="relative w-full max-w-[360px] sm:max-w-[440px] filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.7)] flex flex-col">
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
                className="relative w-full bg-gradient-to-b from-[#fde79b] via-[#fde492] to-[#f8d47b] text-[#5c2411] px-3.5 sm:px-4 pt-4 pb-6 shadow-inner overflow-hidden border border-[#dfb35e]/60"
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
                <svg className="absolute top-2 left-2 w-8 h-8 text-[#caa050]/40 pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M10,10 Q40,15 50,40 Q25,35 15,60 Q10,35 10,10 Z M20,10 Q60,10 70,50 Q40,30 20,10 Z" />
                </svg>
                <svg className="absolute top-2 right-2 w-8 h-8 text-[#caa050]/40 pointer-events-none rotate-90" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M10,10 Q40,15 50,40 Q25,35 15,60 Q10,35 10,10 Z M20,10 Q60,10 70,50 Q40,30 20,10 Z" />
                </svg>
                <svg className="absolute bottom-5 left-2 w-8 h-8 text-[#caa050]/40 pointer-events-none -rotate-90" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M10,10 Q40,15 50,40 Q25,35 15,60 Q10,35 10,10 Z M20,10 Q60,10 70,50 Q40,30 20,10 Z" />
                </svg>
                <svg className="absolute bottom-5 right-2 w-8 h-8 text-[#caa050]/40 pointer-events-none rotate-180" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M10,10 Q40,15 50,40 Q25,35 15,60 Q10,35 10,10 Z M20,10 Q60,10 70,50 Q40,30 20,10 Z" />
                </svg>

                {/* 3. TOURNAMENT TITLE & HEADER */}
                <div className="relative flex flex-col items-center mb-3 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-100 font-bold text-[10px] uppercase tracking-wider shadow-sm mb-1">
                    <Trophy className="w-3 h-3 fill-amber-100" />
                    <span>Ludo Supreme League</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#5c2411] tracking-tight leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                    TOURNAMENTS
                  </h1>
                  <p className="text-[11px] text-[#78350f] mt-0.5 max-w-xs leading-tight">
                    Compete in 25 matches. Highest peak score wins the cash pool!
                  </p>
                </div>

                {/* 4. GAME TYPE & CADENCE SELECTORS */}
                <div className="space-y-1.5 mb-3">
                  {/* Game Type Selector */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#421b0b]/90 rounded-xl border border-[#dfb35e]/60 text-xs font-bold shadow-inner">
                    <button
                      onClick={() => {
                        SoundManager.play('click');
                        setSelectedGameType('supreme');
                      }}
                      className={`py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        selectedGameType === 'supreme'
                          ? 'bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 text-white shadow-[0_2px_6px_rgba(0,0,0,0.4)]'
                          : 'text-amber-200/80 hover:text-white'
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-300" />
                      Ludo Supreme
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play('click');
                        setSelectedGameType('snake');
                      }}
                      className={`py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        selectedGameType === 'snake'
                          ? 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white shadow-[0_2px_6px_rgba(0,0,0,0.4)]'
                          : 'text-amber-200/80 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                      Snake Ludo
                    </button>
                  </div>

                  {/* Cadence Selector */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#2e1307]/80 rounded-xl border border-[#dfb35e]/40 text-xs font-bold">
                    <button
                      onClick={() => {
                        SoundManager.play('click');
                        setSelectedCadence('DAILY');
                      }}
                      className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        selectedCadence === 'DAILY'
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow font-black'
                          : 'text-amber-200/70 hover:text-amber-100'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      Daily (25 Matches)
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play('click');
                        setSelectedCadence('WEEKLY');
                      }}
                      className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        selectedCadence === 'WEEKLY'
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow font-black'
                          : 'text-amber-200/70 hover:text-amber-100'
                      }`}
                    >
                      <Award className="w-3 h-3" />
                      Weekly League
                    </button>
                  </div>
                </div>

                {/* 5. TAB NAVIGATION */}
                <div className="flex gap-2 justify-center mb-3 pb-1 border-b border-[#caa050]/50 text-xs font-bold">
                  <button
                    onClick={() => {
                      SoundManager.play('click');
                      setActiveTab('overview');
                    }}
                    className={`pb-1 px-1.5 border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'overview'
                        ? 'border-[#5c2411] text-[#5c2411]'
                        : 'border-transparent text-[#78350f]/70 hover:text-[#5c2411]'
                    }`}
                  >
                    Tournament Info
                  </button>
                  <button
                    onClick={() => {
                      SoundManager.play('click');
                      setActiveTab('leaderboard');
                    }}
                    className={`pb-1 px-1.5 border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'leaderboard'
                        ? 'border-[#5c2411] text-[#5c2411]'
                        : 'border-transparent text-[#78350f]/70 hover:text-[#5c2411]'
                    }`}
                  >
                    Leaderboard
                  </button>
                  <button
                    onClick={() => {
                      SoundManager.play('click');
                      setActiveTab('rules');
                    }}
                    className={`pb-1 px-1.5 border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'rules'
                        ? 'border-[#5c2411] text-[#5c2411]'
                        : 'border-transparent text-[#78350f]/70 hover:text-[#5c2411]'
                    }`}
                  >
                    Rules & Scoring
                  </button>
                </div>

                {/* ERROR BANNER */}
                {errorMsg && (
                  <div className="mb-3 p-2.5 rounded-xl bg-red-100 border border-red-400 text-red-900 text-xs flex items-center justify-between shadow-sm">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                      {errorMsg}
                    </span>
                    {onOpenDeposit && (
                      <button
                        onClick={onOpenDeposit}
                        className="px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] cursor-pointer"
                      >
                        Add Funds
                      </button>
                    )}
                  </div>
                )}

                {/* TAB 1: OVERVIEW & PLAY MATCH */}
                {activeTab === 'overview' && (
                  <div className="space-y-2.5">
                    {/* TOURNAMENT HERO STATS CARD */}
                    <div className="p-3.5 rounded-2xl bg-[#fffdf2]/90 border-2 border-[#dfb35e]/80 shadow-[0_4px_12px_rgba(92,36,17,0.12)] space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-[#5c2411]">
                            {currentTournament?.title || 'Championship Tournament'}
                          </h3>
                          <p className="text-[11px] text-[#78350f] mt-0.5 leading-snug">
                            {currentTournament?.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <span className="text-[9px] font-black text-[#78350f] block uppercase tracking-wider">
                            Prize Pool
                          </span>
                          <span className="text-base sm:text-lg font-black text-amber-700">
                            {sym}
                            {currentTournament?.prizePool?.toLocaleString('en-IN') || '5,000'}
                          </span>
                        </div>
                      </div>

                      {/* Key Stats Row */}
                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#caa050]/40 text-center">
                        <div className="p-1.5 rounded-xl bg-amber-50/80 border border-[#caa050]/30">
                          <span className="text-[9px] text-[#78350f] block font-bold">Entry Fee</span>
                          <span className="text-xs font-black text-[#5c2411]">
                            {sym}
                            {currentTournament?.entryFee ?? 25}
                          </span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-amber-50/80 border border-[#caa050]/30">
                          <span className="text-[9px] text-[#78350f] block font-bold">Target</span>
                          <span className="text-xs font-black text-amber-800">
                            {maxMatches} Matches
                          </span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-amber-50/80 border border-[#caa050]/30">
                          <span className="text-[9px] text-[#78350f] block font-bold">Closes In</span>
                          <span className="text-xs font-black text-emerald-700 font-mono">
                            {countdown || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* USER PARTICIPATION PROGRESS CARD */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-100/90 to-yellow-100/90 border-2 border-amber-400/80 shadow-[0_4px_12px_rgba(92,36,17,0.12)] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-800 font-black text-xs">
                            {isEnrolled ? '✓' : '!'}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-[#5c2411]">
                              {isEnrolled ? 'Your Tournament Ticket' : 'Not Registered Yet'}
                            </h4>
                            <span className="text-[10px] text-[#78350f]">
                              {isEnrolled
                                ? 'Highest score across 25 matches wins'
                                : `Entry ticket: ${sym}25 for ${maxMatches} matches`}
                            </span>
                          </div>
                        </div>

                        {isEnrolled && (
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-[#78350f] block uppercase">
                              Peak Score
                            </span>
                            <span className="text-sm font-black text-amber-800">
                              {highestScore > 0 ? `${highestScore} PTS` : '0 PTS'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 25 Matches Progress Bar (if enrolled) */}
                      {isEnrolled && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-[#5c2411]">
                              Matches: {matchesPlayed} / {maxMatches}
                            </span>
                            <span className="text-amber-800 font-black text-[10px]">
                              {isCompleted
                                ? 'Quota Completed'
                                : `${maxMatches - matchesPlayed} left`}
                            </span>
                          </div>
                          <div className="w-full bg-[#5c2411]/20 h-2.5 rounded-full overflow-hidden p-0.5 border border-[#5c2411]/30">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300 shadow-sm"
                              style={{
                                width: `${Math.min(100, (matchesPlayed / maxMatches) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* ACTION BUTTON */}
                      <div className="pt-1">
                        {!isEnrolled ? (
                          <button
                            onClick={handleJoinTournament}
                            disabled={isJoining}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(217,119,6,0.4)] border border-amber-200 active:scale-98 transition-all cursor-pointer"
                          >
                            {isJoining ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                                Registering Ticket...
                              </>
                            ) : (
                              <>
                                <Trophy className="w-4 h-4 fill-slate-950" />
                                Join League ({sym}{currentTournament?.entryFee ?? 25} Entry Fee)
                              </>
                            )}
                          </button>
                        ) : isCompleted ? (
                          <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-400 text-center">
                            <div className="text-xs font-black text-emerald-800 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              All 25 Matches Finished!
                            </div>
                            <p className="text-[10px] text-emerald-700 mt-0.5">
                              Highest score of <strong className="text-emerald-900">{highestScore} PTS</strong> is locked.
                              Winners receive prize money at tournament close!
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={handleStartMatch}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(5,150,105,0.4)] border border-emerald-300 active:scale-98 transition-all cursor-pointer"
                          >
                            <Swords className="w-4 h-4 fill-white" />
                            Play Tournament Match ({matchesPlayed + 1}/{maxMatches})
                          </button>
                        )}
                      </div>
                    </div>

                    {/* HOW WINNER IS DECIDED */}
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-[#caa050]/40 text-[11px] text-[#78350f] space-y-1">
                      <span className="font-bold text-[#5c2411] block">🏆 How to Win:</span>
                      <p className="leading-snug">
                        Every player gets <strong>25 tournament matches</strong>. You don't need to win every match — 
                        what counts is your <strong>single highest peak score</strong>. Make high pawn runs and double points
                        at home to top the rank board!
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 2: LIVE LEADERBOARD */}
                {activeTab === 'leaderboard' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#78350f] px-1 font-bold">
                      <span>
                        Tournament: <strong className="text-[#5c2411]">{currentTournament?.title}</strong>
                      </span>
                      <span className="text-amber-800">Ranked by Highest Score</span>
                    </div>

                    {leaderboard.length === 0 ? (
                      <div className="py-8 text-center text-[#78350f] text-xs flex flex-col items-center justify-center gap-1.5 bg-[#fffdf2]/70 rounded-xl border border-[#caa050]/40">
                        <Trophy className="w-7 h-7 text-amber-600" />
                        <span className="font-bold">No scores recorded yet.</span>
                        <span className="text-[10px]">
                          Join and play your first match to top the leaderboard!
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-0.5">
                        <div className="px-2.5 py-1 text-[10px] font-black text-[#78350f] flex items-center justify-between border-b border-[#caa050]/40 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <span className="w-5 text-center">#</span>
                            <span>Player</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span>Matches</span>
                            <span className="w-16 text-right">High Score</span>
                          </div>
                        </div>

                        {leaderboard.map((item) => (
                          <div
                            key={item.userId}
                            className={`px-2.5 py-2 rounded-xl border flex items-center justify-between transition-colors ${
                              item.userId === userId
                                ? 'bg-amber-100 border-amber-400 text-[#5c2411] shadow-sm font-bold'
                                : 'bg-[#fffdf2]/90 hover:bg-[#fffdf2] border-[#caa050]/40 text-[#5c2411]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 text-center font-black text-xs text-amber-800">
                                {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                              </span>
                              <img
                                src={item.avatar}
                                alt={item.username}
                                className="w-6 h-6 rounded-full border border-[#caa050] object-cover bg-amber-100"
                              />
                              <div className="leading-tight">
                                <span className="text-xs font-bold block truncate max-w-[110px] sm:max-w-[140px]">
                                  {item.username}
                                </span>
                                <span className="text-[9px] text-[#78350f]">
                                  {item.tierBadge} {item.tier}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-[#78350f] font-mono font-bold">
                                {item.matchesPlayed}/{item.maxMatches}
                              </span>
                              <div className="w-16 text-right leading-none">
                                <span className="text-xs sm:text-sm font-black text-amber-800">
                                  {item.highestScore}
                                </span>
                                <span className="text-[8px] block text-[#78350f] uppercase font-bold mt-0.5">
                                  PTS
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: RULES & SCORING */}
                {activeTab === 'rules' && (
                  <div className="space-y-2 text-xs text-[#5c2411]">
                    <div className="p-3 rounded-2xl bg-[#fffdf2]/90 border border-[#caa050]/50 space-y-1.5 shadow-sm">
                      <h4 className="font-black text-[#5c2411] text-xs flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-600" />
                        Tournament Rules & Participation
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-[#78350f] leading-relaxed">
                        <li>
                          <strong>Entry Fee:</strong> {sym}25 fixed entry fee debited from your game wallet.
                        </li>
                        <li>
                          <strong>Match Limit:</strong> In the Daily Tournament, each registered player has exactly <strong>25 match attempts</strong>.
                        </li>
                        <li>
                          <strong>Game Modes:</strong> You can play either <strong>Ludo Supreme Tournament</strong> or <strong>Snake Ludo Tournament</strong>.
                        </li>
                        <li>
                          <strong>Winner:</strong> When the tournament concludes, the player with the <strong>highest single match peak score</strong> wins 🏆.
                        </li>
                      </ul>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#fffdf2]/90 border border-[#caa050]/50 space-y-1.5 shadow-sm">
                      <h4 className="font-black text-[#5c2411] text-xs flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-purple-700" />
                        Score Tiers & Ranks
                      </h4>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className="p-1.5 rounded-lg bg-amber-50/90 border border-amber-300">
                          <span className="text-amber-800 font-black block">🥉 Challenger (Bronze)</span>
                          <span className="text-[#78350f]">1 – 400 PTS</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-amber-50/90 border border-amber-300">
                          <span className="text-slate-700 font-black block">🥈 Warrior (Silver)</span>
                          <span className="text-[#78350f]">401 – 1,000 PTS</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-amber-50/90 border border-amber-300">
                          <span className="text-yellow-700 font-black block">🥇 Champion (Gold)</span>
                          <span className="text-[#78350f]">1,001 – 2,000 PTS</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-amber-50/90 border border-amber-300">
                          <span className="text-blue-700 font-black block">⚡ Master (Platinum)</span>
                          <span className="text-[#78350f]">2,001 – 5,000 PTS</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-amber-50/90 border border-amber-300">
                          <span className="text-rose-700 font-black block">💎 Grandmaster (Ruby)</span>
                          <span className="text-[#78350f]">5,001 – 10,000 PTS</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-amber-50/90 border border-amber-300">
                          <span className="text-purple-700 font-black block">👑 Crown Sovereign</span>
                          <span className="text-[#78350f]">10,000+ PTS</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. BOTTOM PARCHMENT FOOTER BAR */}
                <div className="mt-3 pt-2 border-t border-[#caa050]/50 flex items-center justify-between text-xs font-bold text-[#5c2411]">
                  <div className="flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-amber-700" />
                    <span>
                      Wallet: <strong className="text-amber-900">{sym}{balance.toFixed(2)}</strong>
                    </span>
                  </div>

                  {myStanding && (
                    <div className="text-right text-[10px] text-[#78350f]">
                      Rank:{' '}
                      <strong className="text-amber-800 font-black">
                        {myStanding.rank === 1 ? '🥇 #1' : `#${myStanding.rank}`}
                      </strong>{' '}
                      ({myStanding.highestScore} PTS)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
