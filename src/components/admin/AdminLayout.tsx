import React, { useState, useEffect } from 'react';
import {
  Shield,
  LayoutDashboard,
  Gamepad2,
  Users,
  Trophy,
  HardDrive,
  Activity,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Copy,
  CheckCircle2,
  ExternalLink,
  Radio,
  Zap,
  Database,
  Palette,
} from 'lucide-react';
import { OverviewTab } from './tabs/OverviewTab';
import { LiveMatchesTab } from './tabs/LiveMatchesTab';
import { UserManagementTab } from './tabs/UserManagementTab';
import { LeaderboardsTab } from './tabs/LeaderboardsTab';
import { R2StorageTab } from './tabs/R2StorageTab';
import { SettingsTab } from './tabs/SettingsTab';
import { InfrastructureTab } from './tabs/InfrastructureTab';
import { BoardAssetsStudioTab } from './tabs/BoardAssetsStudioTab';
import { UsdtTreasuryCustodyTab } from './tabs/UsdtTreasuryCustodyTab';
import { RpcManagementTab } from './tabs/RpcManagementTab';
import { ManualPaymentsTab } from './tabs/ManualPaymentsTab';
import { Coins } from 'lucide-react';

interface AdminLayoutProps {
  token: string;
  adminData: any;
  adminAlias: string;
  onLogout: () => void;
  onAdminAliasChange: (newAlias: string) => void;
  onBackToGame: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  token,
  adminData,
  adminAlias,
  onLogout,
  onAdminAliasChange,
  onBackToGame,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rpc_management' | 'usdt_custody' | 'assets_studio' | 'live_matches' | 'users' | 'leaderboards' | 'storage' | 'infrastructure' | 'settings'>('overview');
  const [metrics, setMetrics] = useState<any | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copiedAliasUrl, setCopiedAliasUrl] = useState(false);

  const fetchMetrics = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        // Token is genuinely invalid or revoked
        onLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch {
      // Keep existing metrics on network latency, do not logout
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 8000);
    return () => clearInterval(interval);
  }, [token]);

  const copyAliasUrl = () => {
    const url = `https://ludo.omyra.org/${adminAlias}`;
    navigator.clipboard.writeText(url);
    setCopiedAliasUrl(true);
    setTimeout(() => setCopiedAliasUrl(false), 2000);
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'rpc_management', label: 'Blockchain RPCs & Mode', icon: Radio, badge: '7 LIVE' },
    { id: 'manual_payments', label: 'Manual Payments (UPI/Bank)', icon: Coins, badge: 'GATEWAY' },
    { id: 'usdt_custody', label: 'USDT Vault & Custody', icon: Shield, badge: 'TESTNET' },
    { id: 'assets_studio', label: 'Lobby, Boards & Assets', icon: Palette, badge: 'PRO' },
    { id: 'live_matches', label: 'Live Match Engine', icon: Gamepad2, badge: metrics?.overview?.activeGames },
    { id: 'users', label: 'User & Wallets', icon: Users },
    { id: 'leaderboards', label: 'Rankings & Tournaments', icon: Trophy },
    { id: 'storage', label: 'Cloudflare R2 Assets', icon: HardDrive },
    { id: 'infrastructure', label: 'System Health & Probes', icon: Activity },
    { id: 'settings', label: 'Platform & URL Alias', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans flex flex-col md:flex-row selection:bg-amber-500 selection:text-black">
      {/* 1. Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-[#0a0e1a] border-r border-slate-800/80 p-5 shrink-0 justify-between">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white leading-tight">
                LUDO CONTROL
              </h1>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                Executive Admin
              </span>
            </div>
          </div>

          {/* Current URL Alias Quick Widget */}
          <div className="bg-[#101626] border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center justify-between">
              <span>Admin Path Slug</span>
              <span className="text-amber-400 font-mono font-semibold">/{adminAlias}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="truncate max-w-[150px] text-slate-400">.../{adminAlias}</span>
              <button
                onClick={copyAliasUrl}
                className="text-amber-400 hover:text-amber-300 transition-colors p-1"
                title="Copy Full Admin URL"
              >
                {copiedAliasUrl ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Quick Controls */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <button
            onClick={onBackToGame}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-cyan-400" />
            <span>Switch to Game Player Lobby</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-[#0a0e1a]/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div>
              <h2 className="text-sm font-bold text-white capitalize">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h2>
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
                <span>Production Server Active</span>
                <span>•</span>
                <span className="text-amber-400 font-mono">https://ludo.omyra.org/{adminAlias}</span>
              </div>
            </div>
          </div>

          {/* Quick Service Health Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Neon PG */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141b2d] border border-slate-800 text-[11px]">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-300 font-medium">Postgres:</span>
              <span className="text-emerald-400 font-bold font-mono">
                {metrics?.services?.neonPostgres?.latencyMs || 0}ms
              </span>
            </div>

            {/* Redis */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141b2d] border border-slate-800 text-[11px]">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-slate-300 font-medium">Redis:</span>
              <span className="text-emerald-400 font-bold font-mono">
                {metrics?.services?.redisUpstash?.latencyMs || 0}ms
              </span>
            </div>

            {/* Admin Badge */}
            <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-800">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                A
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-200">md16201620</div>
                <div className="text-[10px] text-amber-400 font-mono leading-none">SUPER_ADMIN</div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0a0e1a] border-b border-slate-800 p-4 space-y-2 z-20">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-950 text-amber-400">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button onClick={onBackToGame} className="text-xs text-cyan-400 font-semibold">
                Return to Game Lobby
              </button>
              <button onClick={onLogout} className="text-xs text-rose-400 font-semibold">
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              metrics={metrics}
              token={token}
              onRefresh={fetchMetrics}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'rpc_management' && <RpcManagementTab token={token} />}
          {activeTab === 'manual_payments' && <ManualPaymentsTab token={token} />}
          {activeTab === 'usdt_custody' && <UsdtTreasuryCustodyTab token={token} />}

          {activeTab === 'assets_studio' && <BoardAssetsStudioTab token={token} />}

          {activeTab === 'live_matches' && <LiveMatchesTab token={token} />}

          {activeTab === 'users' && <UserManagementTab token={token} />}

          {activeTab === 'leaderboards' && <LeaderboardsTab token={token} />}

          {activeTab === 'storage' && <R2StorageTab token={token} />}

          {activeTab === 'infrastructure' && (
            <InfrastructureTab metrics={metrics} onRefresh={fetchMetrics} />
          )}

          {activeTab === 'settings' && (
            <SettingsTab token={token} onAdminAliasChange={onAdminAliasChange} />
          )}
        </main>
      </div>
    </div>
  );
};
