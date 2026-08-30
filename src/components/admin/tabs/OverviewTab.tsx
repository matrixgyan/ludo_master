import React, { useState } from 'react';
import {
  Users,
  Gamepad2,
  Trophy,
  Database,
  Layers,
  HardDrive,
  Activity,
  Zap,
  Radio,
  RefreshCw,
  Clock,
  ShieldCheck,
  Send,
  AlertTriangle,
  Palette,
  Grid,
  Dice5,
  Crown,
  Sparkles,
} from 'lucide-react';
import { getActiveThemeConfig } from '../../../game/themeRegistry';

interface OverviewTabProps {
  metrics: any;
  token: string;
  onRefresh: () => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ metrics, token, onRefresh, onNavigateTab }) => {
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;

    setIsBroadcasting(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: broadcastMsg, level: 'INFO' }),
      });

      if (res.ok) {
        setBroadcastStatus('Broadcast successfully sent to all connected players!');
        setBroadcastMsg('');
        setTimeout(() => setBroadcastStatus(null), 4000);
      }
    } catch {
      setBroadcastStatus('Failed to send broadcast');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const overview = metrics?.overview || {
    onlinePlayers: 0,
    totalRegisteredUsers: 0,
    totalGamesCreated: 0,
    activeGames: 0,
    completedGames: 0,
    maintenanceMode: false,
  };

  const services = metrics?.services || {};
  const pg = services.neonPostgres || {};
  const redis = services.redisUpstash || {};
  const r2 = services.cloudflareR2 || {};
  const system = metrics?.system || {};
  const queues = metrics?.queues || {};

  return (
    <div className="space-y-6">
      {/* 1. Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Online Players */}
        <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Online Players</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{overview.onlinePlayers}</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Presence
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Heartbeat managed via Redis / memory</p>
        </div>

        {/* Card 2: Active Matches */}
        <div
          onClick={() => onNavigateTab('live_matches')}
          className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Game Rooms</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{overview.activeGames}</span>
            <span className="text-xs text-slate-400">rooms in progress</span>
          </div>
          <p className="text-xs text-amber-400/90 font-medium mt-2 flex items-center gap-1">
            Click to inspect live boards →
          </p>
        </div>

        {/* Card 3: Total Users */}
        <div
          onClick={() => onNavigateTab('users')}
          className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/40 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registered Users</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{overview.totalRegisteredUsers}</span>
            <span className="text-xs text-slate-400">in Neon PostgreSQL</span>
          </div>
          <p className="text-xs text-cyan-400/90 font-medium mt-2 flex items-center gap-1">
            Manage wallets & players →
          </p>
        </div>

        {/* Card 4: Total Completed */}
        <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Games Created</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{overview.totalGamesCreated}</span>
            <span className="text-xs text-slate-400">({overview.completedGames} completed)</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Historical match logs stored</p>
        </div>
      </div>

      {/* 1.5 Live Applied Game Visuals Quick Manager */}
      {(() => {
        const theme = getActiveThemeConfig();
        return (
          <div className="bg-gradient-to-r from-[#0e131f] via-[#111728] to-[#0e131f] border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                    CURRENTLY APPLIED
                  </span>
                  <span className="text-xs font-bold text-slate-400">Live Visual Assets</span>
                </div>
                <h4 className="text-base font-black text-white mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Grid className="w-3.5 h-3.5 text-amber-400" />
                    Board: <strong className="text-amber-300">{theme.board.name}</strong>
                  </span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="flex items-center gap-1">
                    <Dice5 className="w-3.5 h-3.5 text-amber-400" />
                    Dice: <strong className="text-amber-300">{theme.dice.name}</strong>
                  </span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Pawns: <strong className="text-amber-300">{theme.pawn.name}</strong>
                  </span>
                </h4>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('game_themes')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-all shrink-0 self-stretch md:self-auto justify-center"
            >
              <Palette className="w-4 h-4" />
              <span>Change Board / Dice / Pawns</span>
            </button>
          </div>
        );
      })()}

      {/* 2. Core 3 Production Services Live Matrix */}
      <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              Core External Production Services Infrastructure
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live connectivity probes, latency status, and permanent storage health
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Probes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Service 1: Neon PostgreSQL */}
          <div className="bg-[#131929] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-sky-400" />
                  <span className="font-bold text-slate-200 text-sm">Neon PostgreSQL</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    pg.status === 'healthy'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : pg.status === 'unconfigured'
                      ? 'bg-slate-700 text-slate-300'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {pg.status || 'Checking'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Permanent source of truth for users, games, event ledger, and match history.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Latency: <strong className="text-white">{pg.latencyMs || 0}ms</strong></span>
              <span className="text-[11px] text-sky-400">DATABASE_URL</span>
            </div>
          </div>

          {/* Service 2: Redis / Upstash */}
          <div className="bg-[#131929] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-rose-400" />
                  <span className="font-bold text-slate-200 text-sm">Redis / Upstash</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    redis.status === 'healthy'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : redis.status === 'unconfigured'
                      ? 'bg-slate-700 text-slate-300'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {redis.status || 'Checking'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Realtime game states, player presence, atomic locks, matchmaking, and queues.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Latency: <strong className="text-white">{redis.latencyMs || 0}ms</strong></span>
              <span className="text-[11px] text-rose-400">REDIS_URL</span>
            </div>
          </div>

          {/* Service 3: Cloudflare R2 */}
          <div className="bg-[#131929] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-slate-200 text-sm">Cloudflare R2</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    r2.status === 'healthy'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : r2.status === 'unconfigured'
                      ? 'bg-slate-700 text-slate-300'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {r2.status || 'Checking'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Object storage for player avatars, dice textures, board assets, and uploads.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Bucket: <strong className="text-white truncate max-w-[100px]">{r2.bucketName || 'Auto'}</strong></span>
              <span className="text-[11px] text-amber-400">R2_ENDPOINT</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Broadcast & Background BullMQ Workers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time System Broadcast */}
        <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Live Player In-Game Broadcast</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Push real-time system alerts, tournament start announcements, or server maintenance warnings to all connected game rooms.
            </p>

            {broadcastStatus && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-medium">
                {broadcastStatus}
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-3">
              <textarea
                rows={3}
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="Type system announcement (e.g. Mega Tournament starting in 10 minutes!)..."
                className="w-full bg-[#131929] border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 outline-none resize-none transition-all"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Delivered via WebSocket broadcast</span>
                <button
                  type="submit"
                  disabled={isBroadcasting || !broadcastMsg.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* BullMQ Background Queues & System Runtime */}
        <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">BullMQ Worker Queues & System Runtime</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Background job processing status for game finalization and rank recalculations.
            </p>

            <div className="space-y-3">
              {/* Queue 1: gameProcessing */}
              <div className="bg-[#131929] p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-200">gameProcessingQueue</span>
                  <p className="text-[11px] text-slate-500">Persists match results, player stats & wins</p>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Waiting: {queues.gameProcessing?.waiting || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    Active: {queues.gameProcessing?.active || 0}
                  </span>
                </div>
              </div>

              {/* Queue 2: leaderboard */}
              <div className="bg-[#131929] p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-200">leaderboardQueue</span>
                  <p className="text-[11px] text-slate-500">Aggregates Global & Weekly rank ladders</p>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Waiting: {queues.leaderboard?.waiting || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    Active: {queues.leaderboard?.active || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Uptime: {Math.floor((system.uptimeSeconds || 0) / 60)} mins
            </span>
            <span className="font-mono text-slate-300">
              Heap: {system.heapUsedMb || 0} MB / {system.heapTotalMb || 0} MB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
