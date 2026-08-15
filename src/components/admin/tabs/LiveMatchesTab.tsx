import React, { useState, useEffect } from 'react';
import { Gamepad2, AlertTriangle, Eye, RefreshCw, X, ShieldAlert, CheckCircle, Trophy, User } from 'lucide-react';

interface LiveMatchesTabProps {
  token: string;
}

export const LiveMatchesTab: React.FC<LiveMatchesTabProps> = ({ token }) => {
  const [games, setGames] = useState<any[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [gameDetails, setGameDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchGames = async () => {
    setIsLoading(true);
    try {
      const url = statusFilter === 'ALL' ? '/api/admin/games' : `/api/admin/games?status=${statusFilter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setGames(data.games || []);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGameDetails = async (gameId: string) => {
    setSelectedGameId(gameId);
    setGameDetails(null);
    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setGameDetails(data);
    } catch {
      // Handle error
    }
  };

  const handleTerminateGame = async (gameId: string) => {
    if (!window.confirm(`Are you sure you want to terminate game room ${gameId}?`)) return;

    setIsTerminating(true);
    try {
      const res = await fetch(`/api/admin/games/${gameId}/terminate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'Terminated by Platform Administrator' }),
      });

      if (res.ok) {
        fetchGames();
        if (selectedGameId === gameId) {
          fetchGameDetails(gameId);
        }
      }
    } catch {
      // Handle error
    } finally {
      setIsTerminating(false);
    }
  };

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 10000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0e131f] border border-slate-800/80 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">Live Game Rooms & Match Engine</h3>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#141b2d] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING">Waiting in Lobby</option>
            <option value="COMPLETED">Completed</option>
            <option value="ABANDONED">Terminated / Abandoned</option>
          </select>

          <button
            onClick={fetchGames}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Grid: Game List + Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game List Table */}
        <div className="lg:col-span-2 bg-[#0e131f] border border-slate-800/80 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active & Historic Matches ({games.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#141b2d] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Game ID / Mode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Turns</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {games.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No game rooms found for selected filter.
                    </td>
                  </tr>
                ) : (
                  games.map((g) => (
                    <tr
                      key={g.id}
                      className={`hover:bg-[#141b2d]/60 transition-colors cursor-pointer ${
                        selectedGameId === g.id ? 'bg-[#141b2d]' : ''
                      }`}
                      onClick={() => fetchGameDetails(g.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100">{g.id}</div>
                        <div className="text-[11px] text-amber-400/90 font-mono">{g.mode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            g.status === 'IN_PROGRESS'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : g.status === 'WAITING'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : g.status === 'COMPLETED'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {g.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{g.totalTurns || 0}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {g.createdAt ? new Date(g.createdAt).toLocaleTimeString() : 'Recent'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchGameDetails(g.id);
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                            title="Inspect Game Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {g.status === 'IN_PROGRESS' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTerminateGame(g.id);
                              }}
                              className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition-colors"
                              title="Terminate Match"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Game Details Inspector Drawer */}
        <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              Room Inspector
            </h4>
            {selectedGameId && (
              <button
                onClick={() => setSelectedGameId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {!selectedGameId ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Select any game room from the list to inspect live board state, player HUDs, and event logs.
            </div>
          ) : !gameDetails ? (
            <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              Loading room session...
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Room Header */}
              <div className="bg-[#141b2d] p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-amber-400">{gameDetails.gameId}</span>
                  <span className="text-[10px] font-bold uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                    {gameDetails.dbRecord?.mode || '2_PLAYER'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Status: <strong className="text-white">{gameDetails.dbRecord?.status || 'Active'}</strong></span>
                  <span>Version: <strong className="text-white">{gameDetails.dbRecord?.version || 1}</strong></span>
                </div>
              </div>

              {/* Connected Players in Room */}
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-2">
                  Room Players ({gameDetails.players?.length || 0})
                </span>
                <div className="space-y-2">
                  {gameDetails.players?.map((p: any) => (
                    <div
                      key={p.id}
                      className="bg-[#141b2d] p-2.5 rounded-xl border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            p.color === 'red'
                              ? 'bg-rose-500'
                              : p.color === 'green'
                              ? 'bg-emerald-500'
                              : p.color === 'yellow'
                              ? 'bg-amber-400'
                              : 'bg-sky-500'
                          }`}
                        />
                        <span className="font-semibold text-slate-200">{p.userId}</span>
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        Score: {p.finalScore || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Logs */}
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-2">
                  Event Sequence ({gameDetails.events?.length || 0})
                </span>
                <div className="bg-[#141b2d] p-2.5 rounded-xl border border-slate-800 max-h-40 overflow-y-auto space-y-1.5 font-mono text-[10px]">
                  {gameDetails.events?.map((ev: any) => (
                    <div key={ev.id} className="flex items-center justify-between text-slate-400 border-b border-slate-800/60 pb-1">
                      <span className="text-amber-400 font-bold">#{ev.sequenceNumber} {ev.eventType}</span>
                      <span>{new Date(ev.serverTimestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                  {(!gameDetails.events || gameDetails.events.length === 0) && (
                    <div className="text-slate-500">No events logged yet.</div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2">
                <button
                  onClick={() => handleTerminateGame(gameDetails.gameId)}
                  disabled={isTerminating}
                  className="w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Force Terminate Room
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
