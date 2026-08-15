import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, Award, CheckCircle2, Zap } from 'lucide-react';

interface LeaderboardsTabProps {
  token: string;
}

export const LeaderboardsTab: React.FC<LeaderboardsTabProps> = ({ token }) => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [type, setType] = useState('GLOBAL');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcSuccess, setRecalcSuccess] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/leaderboards?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerRecalculate = async () => {
    setIsRecalculating(true);
    setRecalcSuccess(null);
    try {
      const res = await fetch('/api/admin/leaderboards/recalculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });

      if (res.ok) {
        setRecalcSuccess(`Recalculation job queued in Redis BullMQ for ${type} ranking ladder!`);
        setTimeout(() => {
          fetchLeaderboard();
          setRecalcSuccess(null);
        }, 2000);
      }
    } catch {
      // Handle error
    } finally {
      setIsRecalculating(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [type]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0e131f] border border-slate-800/80 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-base font-bold text-white">Leaderboards & Global Ranking Ladder</h3>
            <p className="text-xs text-slate-400">Aggregated player scores and tournament ranks</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl bg-[#141b2d] p-1 border border-slate-700">
            {['GLOBAL', 'WEEKLY', 'DAILY'].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  type === t
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleTriggerRecalculate}
            disabled={isRecalculating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            {isRecalculating ? 'Queuing...' : 'Recalculate Ranks'}
          </button>
        </div>
      </div>

      {recalcSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {recalcSuccess}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#141b2d] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Player / User ID</th>
                <th className="py-3 px-4">Score / Wins</th>
                <th className="py-3 px-4">Tier Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No leaderboard rankings recorded yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((item, idx) => (
                  <tr key={item.userId || idx} className="hover:bg-[#141b2d]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold">
                      <div className="flex items-center gap-2">
                        {idx === 0 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center text-xs font-black">
                            1
                          </span>
                        ) : idx === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-300 text-black flex items-center justify-center text-xs font-black">
                            2
                          </span>
                        ) : idx === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center text-xs font-black">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 pl-2">#{idx + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100">{item.userId}</div>
                      <div className="text-[11px] text-slate-400">Competitive Ladder</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400 text-sm">
                      {(item.score || 0).toLocaleString()} PTS
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {idx < 3 ? 'Grandmaster' : idx < 10 ? 'Master' : 'Challenger'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
