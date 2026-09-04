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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-xl rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)] border-4 border-[#5c2411]/90 text-white flex flex-col max-h-[92vh]"
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
                'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(255, 238, 187, 0.4) 0%, rgba(0, 0, 0, 0.65) 100%)',
            }}
          />

          {/* TOP CLOSE BUTTON */}
          <button
            onClick={() => {
              SoundManager.play('click');
              onClose();
            }}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* HEADER SECTION */}
          <div className="px-6 pt-5 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md">
                <Trophy className="w-5 h-5 fill-slate-950" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                  Ludo Supreme League
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold uppercase">
                    Tournaments
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Compete in daily & weekly tournaments. Highest score takes the prize pool!
                </p>
              </div>
            </div>

            {/* TOURNAMENT SELECTORS */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              {/* 1. Game Type Selector: Ludo Supreme vs Snake Ludo */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 text-xs font-bold">
                <button
                  onClick={() => {
                    SoundManager.play('click');
                    setSelectedGameType('supreme');
                  }}
                  className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedGameType === 'supreme'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
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
                  className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedGameType === 'snake'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  Snake Ludo
                </button>
              </div>

              {/* 2. Cadence Selector: Daily (25 Matches Target) vs Weekly */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 text-xs font-bold">
                <button
                  onClick={() => {
                    SoundManager.play('click');
                    setSelectedCadence('DAILY');
                  }}
                  className={`py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    selectedCadence === 'DAILY'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
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
                  className={`py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    selectedCadence === 'WEEKLY'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Award className="w-3 h-3" />
                  Weekly League
                </button>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-4 mt-3 pt-2 border-t border-white/5 text-xs font-semibold">
              <button
                onClick={() => {
                  SoundManager.play('click');
                  setActiveTab('overview');
                }}
                className={`pb-1 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Tournament Info & Play
              </button>
              <button
                onClick={() => {
                  SoundManager.play('click');
                  setActiveTab('leaderboard');
                }}
                className={`pb-1 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'leaderboard'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Live Scores & Ranks
              </button>
              <button
                onClick={() => {
                  SoundManager.play('click');
                  setActiveTab('rules');
                }}
                className={`pb-1 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'rules'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Rules & Scoring
              </button>
            </div>
          </div>

          {/* MAIN MODAL BODY */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorMsg}
                </span>
                {onOpenDeposit && (
                  <button
                    onClick={onOpenDeposit}
                    className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold text-[11px] cursor-pointer"
                  >
                    Add Funds
                  </button>
                )}
              </div>
            )}

            {/* TAB 1: OVERVIEW & PLAY MATCH */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* TOURNAMENT HERO STATS CARD */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-black text-white">
                        {currentTournament?.title || 'Championship Tournament'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {currentTournament?.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Prize Pool
                      </span>
                      <span className="text-base font-black text-amber-300">
                        {sym}
                        {currentTournament?.prizePool?.toLocaleString('en-IN') || '5,000'}
                      </span>
                    </div>
                  </div>

                  {/* Key Stats Row */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                    <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-medium">Entry Fee</span>
                      <span className="text-xs font-black text-white">
                        {sym}
                        {currentTournament?.entryFee ?? 25}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-medium">Target Limit</span>
                      <span className="text-xs font-black text-amber-300">
                        {maxMatches} Matches
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-medium">Closes In</span>
                      <span className="text-xs font-black text-emerald-400 font-mono">
                        {countdown || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* USER PARTICIPATION PROGRESS CARD */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-xs">
                        {isEnrolled ? '✓' : '!'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          {isEnrolled ? 'Your Tournament Ticket' : 'Not Registered Yet'}
                        </h4>
                        <span className="text-[10px] text-slate-300">
                          {isEnrolled
                            ? 'Target: Highest score across your 25 matches wins'
                            : `Entry ticket is ${sym}25 for ${maxMatches} matches`}
                        </span>
                      </div>
                    </div>

                    {isEnrolled && (
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Peak Score
                        </span>
                        <span className="text-sm font-black text-amber-300">
                          {highestScore > 0 ? `${highestScore} PTS` : '0 PTS'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 25 Matches Progress Bar (if enrolled) */}
                  {isEnrolled && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">
                          Matches Played: {matchesPlayed} / {maxMatches}
                        </span>
                        <span className="text-amber-300 font-semibold text-[11px]">
                          {isCompleted
                            ? 'Quota Completed'
                            : `${maxMatches - matchesPlayed} matches remaining`}
                        </span>
                      </div>
                      <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden p-0.5 border border-amber-400/30">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (matchesPlayed / maxMatches) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ACTION BUTTON */}
                  <div className="pt-2">
                    {!isEnrolled ? (
                      <button
                        onClick={handleJoinTournament}
                        disabled={isJoining}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer"
                      >
                        {isJoining ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
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
                      <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-center">
                        <div className="text-xs font-black text-emerald-300 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          All 25 Matches Finished!
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">
                          Your highest score of <strong className="text-amber-300">{highestScore} PTS</strong> is locked.
                          Winners receive their prize money automatically at tournament end!
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={handleStartMatch}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
                      >
                        <Swords className="w-4 h-4 fill-slate-950" />
                        Play Tournament Match ({matchesPlayed + 1}/{maxMatches})
                      </button>
                    )}
                  </div>
                </div>

                {/* HOW WINNER IS DECIDED EXPLANATION */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400 space-y-1">
                  <span className="font-bold text-slate-300 block">🏆 How to Win:</span>
                  <p>
                    Every player gets <strong>25 tournament matches</strong>. You don't need to win every match — 
                    what counts is your <strong>single highest peak score</strong>. Make high pawn runs and double points
                    at home to achieve the highest score and win the top cash prize!
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE TOURNAMENT LEADERBOARD */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>
                    Tournament: <strong className="text-white">{currentTournament?.title}</strong>
                  </span>
                  <span className="text-amber-400 font-medium">Ranked by Highest Score</span>
                </div>

                {leaderboard.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                    <Trophy className="w-8 h-8 text-amber-400/60" />
                    <span>No scores recorded yet in this tournament.</span>
                    <span className="text-xs text-slate-500">
                      Join and play your first match to top the leaderboard!
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 flex items-center justify-between border-b border-white/5 uppercase tracking-wider">
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center">#</span>
                        <span>Player</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>Matches</span>
                        <span className="w-20 text-right">High Score</span>
                      </div>
                    </div>

                    {leaderboard.map((item) => (
                      <div
                        key={item.userId}
                        className={`px-3 py-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                          item.userId === userId
                            ? 'bg-amber-500/15 border-amber-400/50 text-white'
                            : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/5 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center font-bold text-xs text-amber-300">
                            {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                          </span>
                          <img
                            src={item.avatar}
                            alt={item.username}
                            className="w-7 h-7 rounded-full border border-white/10 object-cover bg-black/40"
                          />
                          <div className="leading-tight">
                            <span className="text-xs font-bold block truncate max-w-[130px] sm:max-w-[180px]">
                              {item.username}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.tierBadge} {item.tier}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {item.matchesPlayed}/{item.maxMatches}
                          </span>
                          <div className="w-20 text-right leading-none">
                            <span className="text-sm font-black text-amber-300">
                              {item.highestScore}
                            </span>
                            <span className="text-[9px] block text-slate-400 uppercase font-bold mt-0.5">
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
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Tournament Rules & Participation
                  </h4>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300 leading-relaxed">
                    <li>
                      <strong>Entry Fee:</strong> {sym}25 fixed entry fee debited securely from your game wallet.
                    </li>
                    <li>
                      <strong>Match Limit:</strong> In the Daily Tournament, every registered user has exactly <strong>25 match attempts</strong>.
                    </li>
                    <li>
                      <strong>Game Modes:</strong> You can choose either <strong>Ludo Supreme Tournament</strong> or <strong>Snake Ludo Tournament</strong>. Both have independent 25-match daily quotas and prize pools.
                    </li>
                    <li>
                      <strong>Winner Determination:</strong> When the tournament concludes, the player who achieved the <strong>highest single match score</strong> is crowned the winner 🏆.
                    </li>
                    <li>
                      <strong>Weekly Marathon:</strong> Weekly championships run across 7 days allowing up to 100 matches to achieve your ultimate peak score.
                    </li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-purple-400" />
                    Score Tiers & Ranks
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                      <span className="text-amber-600 font-bold block">🥉 Challenger (Bronze)</span>
                      <span className="text-slate-400">1 – 400 PTS</span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                      <span className="text-slate-300 font-bold block">🥈 Warrior (Silver)</span>
                      <span className="text-slate-400">401 – 1,000 PTS</span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                      <span className="text-yellow-400 font-bold block">🥇 Champion (Gold)</span>
                      <span className="text-slate-400">1,001 – 2,000 PTS</span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                      <span className="text-cyan-400 font-bold block">⚡ Master (Platinum)</span>
                      <span className="text-slate-400">2,001 – 5,000 PTS</span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                      <span className="text-rose-400 font-bold block">💎 Grandmaster (Ruby)</span>
                      <span className="text-slate-400">5,001 – 10,000 PTS</span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                      <span className="text-purple-400 font-bold block">👑 Crown Sovereign</span>
                      <span className="text-slate-400">10,000+ PTS</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER BAR */}
          <div className="px-6 py-3 border-t border-white/10 bg-[#070210] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">
                Wallet Balance: <strong className="text-white">{sym}{balance.toFixed(2)}</strong>
              </span>
            </div>

            {myStanding && (
              <div className="text-right text-[11px] text-slate-300">
                Your Rank:{' '}
                <strong className="text-amber-300">
                  {myStanding.rank === 1 ? '🥇 #1' : `#${myStanding.rank}`}
                </strong>{' '}
                ({myStanding.highestScore} PTS)
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
