import React, { useState, useEffect } from 'react';
import { Users, Search, Wallet, PlusCircle, MinusCircle, RefreshCw, X, ShieldAlert, Check } from 'lucide-react';

interface UserManagementTabProps {
  token: string;
}

export const UserManagementTab: React.FC<UserManagementTabProps> = ({ token }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [coinsDelta, setCoinsDelta] = useState('100');
  const [adjustReason, setAdjustReason] = useState('Admin Reward / Tournament Payout');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const url = search ? `/api/admin/users?search=${encodeURIComponent(search)}` : '/api/admin/users';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsAdjusting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/adjust-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coinsDelta: Number(coinsDelta),
          reason: adjustReason,
        }),
      });

      if (res.ok) {
        setActionSuccess(`Updated balance for user ${selectedUser.username || selectedUser.id}`);
        fetchUsers();
        setTimeout(() => {
          setActionSuccess(null);
          setSelectedUser(null);
        }, 2000);
      }
    } catch {
      // Handle error
    } finally {
      setIsAdjusting(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0e131f] border border-slate-800/80 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Player Accounts & Wallet Management</h3>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or user ID..."
              className="w-full bg-[#141b2d] border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-400"
            />
          </div>

          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#141b2d] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User ID / Username</th>
                <th className="py-3 px-4">Player Balance</th>
                <th className="py-3 px-4">Wallet Address</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No user accounts found matching query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#141b2d]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100">{u.username || 'Guest Player'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
                        <Wallet className="w-4 h-4" />
                        <span>${(Number(u.coins || 0) / 100).toFixed(2)} USDT</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {u.walletAddress ? `${u.walletAddress.substring(0, 8)}...` : 'None'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-semibold transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <Wallet className="w-3 h-3" />
                        Adjust Funds
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Funds Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e131f] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Adjust Player Balance</h4>
                <p className="text-xs text-slate-400">User: {selectedUser.username} ({selectedUser.id})</p>
              </div>
            </div>

            {actionSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" />
                {actionSuccess}
              </div>
            ) : (
              <form onSubmit={handleAdjustBalance} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1">
                    Balance Delta (+ to credit, - to debit in cents/units)
                  </label>
                  <input
                    type="number"
                    required
                    value={coinsDelta}
                    onChange={(e) => setCoinsDelta(e.target.value)}
                    className="w-full bg-[#141b2d] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-1">
                    Administrative Reason / Memo
                  </label>
                  <input
                    type="text"
                    required
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full bg-[#141b2d] border border-slate-700 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdjusting}
                    className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isAdjusting ? 'Updating...' : 'Confirm Update'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
