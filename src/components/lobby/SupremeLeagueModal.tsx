import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Clock, Users, Sparkles, X, ChevronRight, CheckCircle2, Flame, Award, Zap } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import confetti from 'canvas-confetti';
import leagueBannerImg from '../../assets/images/ludo_supreme_league_ticket_bg_1787019798437.jpg';

interface SupremeLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinLeague: () => void;
  balance: number;
}

export const SupremeLeagueModal: React.FC<SupremeLeagueModalProps> = ({
  isOpen,
  onClose,
  onJoinLeague,
  balance,
}) => {
  const [joined, setJoined] = useState(false);
  const [activeTab, setActiveTab] = useState<'prizes' | 'leaderboard' | 'rules'>('prizes');

  // Dynamic countdown timer
  const [timeLeft, setTimeLeft] = useState({ hours: 1, minutes: 14, seconds: 28 });

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleJoin = () => {
    SoundManager.play('score-double');
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    setJoined(true);
    setTimeout(() => {
      setJoined(false);
      onJoinLeague();
    }, 900);
  };

  const prizeDistribution = [
    { rank: '# 1', prize: '₹50', tag: 'Mega Winner', highlight: true, color: 'text-amber-300' },
    { rank: '# 2', prize: '₹20', tag: 'Runner Up', highlight: false, color: 'text-slate-200' },
    { rank: '# 3 - 10', prize: '₹10', tag: 'Top Tier', highlight: false, color: 'text-amber-400' },
    { rank: '# 11 - 100', prize: '₹5', tag: 'Champion Club', highlight: false, color: 'text-emerald-300' },
    { rank: '# 101 - 65,000', prize: '₹2', tag: 'Assured Winner', highlight: false, color: 'text-cyan-300' },
  ];

  const sampleLeaderboard = [
    { rank: 1, name: 'Aarav Sharma', score: 1420, prize: '₹50', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' },
    { rank: 2, name: 'Vikram Singh', score: 1360, prize: '₹20', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop' },
    { rank: 3, name: 'Priya Patel', score: 1290, prize: '₹10', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
    { rank: 4, name: 'Rahul Verma', score: 1180, prize: '₹10', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
    { rank: 5, name: 'Ananya Roy', score: 1110, prize: '₹10', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-gradient-to-b from-[#180b33] via-[#0f0724] to-[#090317] rounded-3xl border border-amber-400/40 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden text-white flex flex-col max-h-[90vh]"
        >
          {/* TOP CLOSE BUTTON */}
          <button
            onClick={() => {
              SoundManager.play('click');
              onClose();
            }}
            className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>

          {/* HERO BANNER SECTION */}
          <div className="relative w-full h-44 overflow-hidden flex-shrink-0">
            <img
              src={leagueBannerImg}
              alt="Ludo Supreme League Banner"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#180b33] via-[#180b33]/40 to-transparent" />
            
            {/* Top Live Badge */}
            <div className="absolute top-3 left-3.5 z-10 flex items-center gap-1.5 bg-emerald-500/90 border border-emerald-300/60 shadow-[0_2px_10px_rgba(16,185,129,0.4)] px-3 py-1 rounded-full text-white text-[11px] font-extrabold tracking-wide">
              <Clock className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>
                Closes in {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
              </span>
            </div>

            {/* Banner Titles */}
            <div className="absolute bottom-3 left-4 right-4 z-10">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                  BIG REWARDS LEAGUE
                </span>
                <span className="text-emerald-300 text-xs font-black flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 65,000 Assured Winners
                </span>
              </div>
              <h2 className="text-2xl font-black text-white drop-shadow-md tracking-tight">
                Ludo Supreme League
              </h2>
            </div>
          </div>

          {/* TAB BAR NAVIGATION */}
          <div className="flex items-center border-b border-white/10 px-4 bg-white/5 flex-shrink-0">
            <button
              onClick={() => {
                SoundManager.play('click');
                setActiveTab('prizes');
              }}
              className={`flex-1 py-2.5 text-xs font-bold transition-all relative ${
                activeTab === 'prizes' ? 'text-amber-300' : 'text-white/60 hover:text-white'
              }`}
            >
              Prize Breakup
              {activeTab === 'prizes' && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
              )}
            </button>
            <button
              onClick={() => {
                SoundManager.play('click');
                setActiveTab('leaderboard');
              }}
              className={`flex-1 py-2.5 text-xs font-bold transition-all relative ${
                activeTab === 'leaderboard' ? 'text-amber-300' : 'text-white/60 hover:text-white'
              }`}
            >
              Leaderboard
              {activeTab === 'leaderboard' && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
              )}
            </button>
            <button
              onClick={() => {
                SoundManager.play('click');
                setActiveTab('rules');
              }}
              className={`flex-1 py-2.5 text-xs font-bold transition-all relative ${
                activeTab === 'rules' ? 'text-amber-300' : 'text-white/60 hover:text-white'
              }`}
            >
              Rules & Scoring
              {activeTab === 'rules' && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
              )}
            </button>
          </div>

          {/* TAB CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-purple-500/30">
            {activeTab === 'prizes' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/50 px-2 font-medium">
                  <span>RANK</span>
                  <span>WINNING PRIZE</span>
                </div>
                {prizeDistribution.map((item, idx) => (
                  <div
                    key={`prize-rank-${item.rank}-${idx}`}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      item.highlight
                        ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border-amber-400/50 shadow-[0_4px_16px_rgba(245,158,11,0.15)]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950 shadow-md'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-white/10 text-white/80'
                        }`}
                      >
                        {idx + 1 <= 3 ? <Trophy className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{item.rank}</div>
                        <div className="text-[10px] text-white/60 font-medium">{item.tag}</div>
                      </div>
                    </div>
                    <div className={`text-base font-black tracking-tight ${item.color}`}>
                      {item.prize}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/50 px-2 font-medium">
                  <span>PLAYER</span>
                  <span>POINTS / PRIZE</span>
                </div>
                {sampleLeaderboard.map((player, idx) => (
                  <div
                    key={`sl-player-${player.rank}-${player.name}-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center text-xs font-black text-amber-300">
                        #{player.rank}
                      </span>
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className="w-8 h-8 rounded-full border border-white/20 object-cover"
                      />
                      <span className="text-xs font-bold text-white">{player.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-amber-300">{player.score} pts</div>
                      <div className="text-[10px] text-emerald-400 font-bold">{player.prize}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="space-y-2.5 text-xs text-white/80 leading-relaxed bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white font-bold block">Open Tokens (No 6 Required):</strong>
                    All pawns start active and moving from the start tile immediately.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white font-bold block">2X Home Multiplier:</strong>
                    First pawn reaching Home instantly doubles your entire match score (2X multiplier)!
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white font-bold block">3:00 Fast Match Timer:</strong>
                    Highest score when timer finishes wins the 1st prize directly.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM FIXED ACTION DOCK */}
          <div className="p-4 bg-gradient-to-t from-black via-black/80 to-transparent border-t border-white/10 flex items-center justify-between gap-3 flex-shrink-0">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">
                ENTRY FEE
              </div>
              <div className="text-lg font-black text-emerald-400 flex items-center gap-1">
                FREE <span className="text-xs line-through text-white/40">₹25</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleJoin}
              disabled={joined}
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-sm sm:text-base shadow-[0_6px_20px_rgba(16,185,129,0.45)] border border-emerald-300/40 flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-white fill-white" />
              <span>{joined ? 'Joining Match...' : 'Join Tournament (Free)'}</span>
              <ChevronRight className="w-4 h-4 text-white/80" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
