import React from 'react';
import { Activity, Server, Cpu, Database, Zap, HardDrive, Layers, RefreshCw, Terminal } from 'lucide-react';

interface InfrastructureTabProps {
  metrics: any;
  onRefresh: () => void;
}

export const InfrastructureTab: React.FC<InfrastructureTabProps> = ({ metrics, onRefresh }) => {
  const services = metrics?.services || {};
  const pg = services.neonPostgres || {};
  const redis = services.redisUpstash || {};
  const r2 = services.cloudflareR2 || {};
  const system = metrics?.system || {};
  const queues = metrics?.queues || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0e131f] border border-slate-800/80 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-base font-bold text-white">Cloud Infrastructure & Telemetry Diagnostics</h3>
            <p className="text-xs text-slate-400">Direct status probes across Neon, Redis, and Cloudflare R2</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Run Health Diagnostics
        </button>
      </div>

      {/* Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Neon PostgreSQL */}
        <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-sky-400" />
              <h4 className="text-sm font-bold text-white">Neon PostgreSQL</h4>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                pg.status === 'healthy'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {pg.status || 'Checking'}
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-slate-200 font-bold">{pg.message || 'Probing...'}</span>
            </div>
            <div className="flex justify-between">
              <span>Latency:</span>
              <span className="text-emerald-400 font-bold">{pg.latencyMs || 0} ms</span>
            </div>
            <div className="flex justify-between">
              <span>Config Key:</span>
              <span className="text-sky-400">DATABASE_URL</span>
            </div>
          </div>
        </div>

        {/* Redis / Upstash */}
        <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-rose-400" />
              <h4 className="text-sm font-bold text-white">Redis / Upstash</h4>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                redis.status === 'healthy'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {redis.status || 'Checking'}
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-slate-200 font-bold">{redis.message || 'Probing...'}</span>
            </div>
            <div className="flex justify-between">
              <span>Latency:</span>
              <span className="text-emerald-400 font-bold">{redis.latencyMs || 0} ms</span>
            </div>
            <div className="flex justify-between">
              <span>Config Key:</span>
              <span className="text-rose-400">REDIS_URL</span>
            </div>
          </div>
        </div>

        {/* Cloudflare R2 */}
        <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold text-white">Cloudflare R2</h4>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                r2.status === 'healthy'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {r2.status || 'Checking'}
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-slate-200 font-bold">{r2.message || 'Probing...'}</span>
            </div>
            <div className="flex justify-between">
              <span>Bucket:</span>
              <span className="text-amber-400 font-bold truncate max-w-[120px]">{r2.bucketName || 'Auto'}</span>
            </div>
            <div className="flex justify-between">
              <span>Config Key:</span>
              <span className="text-amber-400">R2_ENDPOINT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Node Runtime & System Specs */}
      <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h4 className="text-sm font-bold text-white">Node.js Production Runtime Metrics</h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-[#141b2d] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase block">Node Engine</span>
            <span className="text-slate-200 font-bold">{system.nodeVersion || 'v20.x'}</span>
          </div>
          <div className="bg-[#141b2d] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase block">Uptime</span>
            <span className="text-emerald-400 font-bold">{Math.floor((system.uptimeSeconds || 0) / 60)} minutes</span>
          </div>
          <div className="bg-[#141b2d] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase block">Heap Used</span>
            <span className="text-amber-400 font-bold">{system.heapUsedMb || 0} MB</span>
          </div>
          <div className="bg-[#141b2d] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase block">RSS Allocated</span>
            <span className="text-cyan-400 font-bold">{system.rssMb || 0} MB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
