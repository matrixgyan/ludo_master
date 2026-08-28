import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Save,
  QrCode,
  Building,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Eye,
  X,
  IndianRupee,
  DollarSign,
  UploadCloud,
  Image as ImageIcon
} from 'lucide-react';

interface ManualPaymentsTabProps {
  token: string;
}

interface PaymentGateway {
  id: string;
  type: 'UPI' | 'BANK_TRANSFER' | 'QR_CODE' | 'WALLET' | 'CUSTOM';
  title: string;
  accountHolderName: string;
  upiId?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branchName?: string;
  qrCodeUrl?: string;
  minDepositAmount: string;
  maxDepositAmount: string;
  depositInstructions?: string;
  isEnabled: boolean;
  displayOrder: number;
}

interface DepositRequest {
  id: string;
  userId: string;
  gatewayId: string;
  gatewayTitle?: string;
  amount: string;
  currency: string;
  utrNumber: string;
  senderName?: string;
  senderUpiOrAccount?: string;
  screenshotUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  payoutMethod: 'UPI' | 'BANK_TRANSFER';
  payoutUpiId?: string;
  payoutAccountNumber?: string;
  payoutIfscCode?: string;
  payoutAccountName?: string;
  payoutBankName?: string;
  feeAmount: string;
  netAmount: string;
  status: 'PENDING' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
  payoutReference?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export const ManualPaymentsTab: React.FC<ManualPaymentsTabProps> = ({ token }) => {
  const [activeSubTab, setActiveSubTab] = useState<'deposits' | 'withdrawals' | 'gateways'>('deposits');
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal / Verification action state
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [payoutRefInput, setPayoutRefInput] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isUploadingGatewayQr, setIsUploadingGatewayQr] = useState(false);

  // Gateway form state
  const [isEditingGateway, setIsEditingGateway] = useState(false);
  const [gatewayForm, setGatewayForm] = useState<Partial<PaymentGateway>>({
    type: 'UPI',
    title: '',
    accountHolderName: '',
    upiId: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    qrCodeUrl: '',
    minDepositAmount: '100',
    maxDepositAmount: '50000',
    depositInstructions: '',
    isEnabled: true,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [gRes, dRes, wRes] = await Promise.all([
        fetch('/api/admin/manual-payments/gateways', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/manual-payments/deposits', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/manual-payments/withdrawals', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const gData = await gRes.json();
      const dData = await dRes.json();
      const wData = await wRes.json();

      if (gData.success) setGateways(gData.gateways || []);
      if (dData.success) setDeposits(dData.deposits || []);
      if (wData.success) setWithdrawals(wData.withdrawals || []);
    } catch (err) {
      console.error('Failed to load manual payment data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handle Deposit Verification
  const handleVerifyDeposit = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedDeposit) return;
    setIsProcessingAction(true);
    try {
      const res = await fetch(`/api/admin/manual-payments/deposits/${selectedDeposit.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          adminNotes: adminNoteInput,
          reviewedBy: 'SuperAdmin',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(
          action === 'APPROVE'
            ? `Deposit #${selectedDeposit.id} Approved & Balance Credited!`
            : `Deposit #${selectedDeposit.id} Marked as Rejected.`
        );
        setSelectedDeposit(null);
        setAdminNoteInput('');
        fetchData();
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Verify error', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Withdrawal Settlement
  const handleProcessWithdrawal = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedWithdrawal) return;
    setIsProcessingAction(true);
    try {
      const res = await fetch(`/api/admin/manual-payments/withdrawals/${selectedWithdrawal.id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          payoutReference: payoutRefInput,
          adminNotes: adminNoteInput,
          reviewedBy: 'SuperAdmin',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(
          action === 'APPROVE'
            ? `Withdrawal #${selectedWithdrawal.id} Processed & Marked Complete!`
            : `Withdrawal #${selectedWithdrawal.id} Rejected & User Balance Refunded.`
        );
        setSelectedWithdrawal(null);
        setPayoutRefInput('');
        setAdminNoteInput('');
        fetchData();
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Payout process error', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Save / Update Gateway
  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/manual-payments/gateways', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(gatewayForm),
      });

      const data = await res.json();
      if (data.success) {
        setIsEditingGateway(false);
        setGatewayForm({
          type: 'UPI',
          title: '',
          accountHolderName: '',
          upiId: '',
          accountNumber: '',
          ifscCode: '',
          bankName: '',
          minDepositAmount: '100',
          maxDepositAmount: '50000',
          depositInstructions: '',
          isEnabled: true,
        });
        fetchData();
      }
    } catch (err) {
      console.error('Save gateway error', err);
    }
  };

  const handleDeleteGateway = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment channel?')) return;
    try {
      await fetch(`/api/admin/manual-payments/gateways/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) {
      console.error('Delete gateway error', err);
    }
  };

  // Filtered lists
  const filteredDeposits = deposits.filter((d) => {
    const matchesSearch =
      d.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.utrNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.senderName && d.senderName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'ALL' || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesSearch =
      w.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.payoutUpiId && w.payoutUpiId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.payoutAccountNumber && w.payoutAccountNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'ALL' || w.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingDepositsCount = deposits.filter((d) => d.status === 'PENDING').length;
  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'PENDING').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0d1322] via-[#10172c] to-[#0d1322] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Coins className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Manual Payments & Fiat Gateway Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Active Verification Engine
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Verify real user UPI/Bank deposits via 12-digit UTR references, approve instant balance credits, manage custom payment methods, and process outgoing bank payouts with atomic database security.
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Verification Queues</span>
          </button>
        </div>

        {/* Action Success Alert */}
        {actionSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Quick Tabs Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-800/80">
          <button
            onClick={() => {
              setActiveSubTab('deposits');
              setFilterStatus('ALL');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'deposits'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Deposit Requests</span>
            {pendingDepositsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {pendingDepositsCount} PENDING
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveSubTab('withdrawals');
              setFilterStatus('ALL');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'withdrawals'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdrawal Requests</span>
            {pendingWithdrawalsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {pendingWithdrawalsCount} PENDING
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('gateways')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'gateways'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Payment Channels & UPIs</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-400 font-mono">
              {gateways.length}
            </span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. DEPOSIT REQUESTS QUEUE TAB */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'deposits' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a0e1a] border border-slate-800 rounded-xl p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by User ID, UTR / Reference No, Sender Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#101726] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Status:</span>
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterStatus === st
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-[#101726] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Deposits List */}
          <div className="bg-[#0a0e1a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e1424] text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Request ID / Date</th>
                    <th className="p-4">User ID</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">UTR / Ref Number</th>
                    <th className="p-4">Sender Details</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDeposits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        No manual deposit submissions found matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDeposits.map((dep) => (
                      <tr key={dep.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4">
                          <div className="font-mono font-bold text-white">{dep.id}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(dep.createdAt).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-slate-300 font-semibold bg-slate-800/80 px-2 py-1 rounded">
                            {dep.userId}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-black text-emerald-400 font-mono">
                            ₹{parseFloat(dep.amount).toFixed(2)} {dep.currency}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-mono font-bold text-amber-400 select-all bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 inline-block">
                            {dep.utrNumber}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-200 font-semibold">{dep.senderName || 'Not specified'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {dep.senderUpiOrAccount || 'Direct UPI'}
                          </div>
                          {dep.screenshotUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewImageUrl(dep.screenshotUrl!)}
                              className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold cursor-pointer transition"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>View Receipt Screenshot</span>
                            </button>
                          )}
                        </td>
                        <td className="p-4">
                          {dep.status === 'PENDING' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" />
                              PENDING
                            </span>
                          )}
                          {dep.status === 'APPROVED' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              APPROVED
                            </span>
                          )}
                          {dep.status === 'REJECTED' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" />
                              REJECTED
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {dep.status === 'PENDING' ? (
                            <button
                              onClick={() => {
                                setSelectedDeposit(dep);
                                setAdminNoteInput('');
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                            >
                              Verify / Settle
                            </button>
                          ) : (
                            <div className="text-[11px] text-slate-400 font-mono">
                              By: {dep.reviewedBy || 'Admin'}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. WITHDRAWAL REQUESTS QUEUE TAB */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'withdrawals' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a0e1a] border border-slate-800 rounded-xl p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by User ID, UPI ID, Bank Account Number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#101726] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Status:</span>
              {['ALL', 'PENDING', 'PROCESSED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterStatus === st
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-[#101726] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Withdrawals List */}
          <div className="bg-[#0a0e1a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e1424] text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Withdrawal ID / Date</th>
                    <th className="p-4">User ID</th>
                    <th className="p-4">Payout Amount</th>
                    <th className="p-4">Method & Account</th>
                    <th className="p-4">Payout Ref / UTR</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        No manual withdrawal requests found matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredWithdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4">
                          <div className="font-mono font-bold text-white">{w.id}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(w.createdAt).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-slate-300 font-semibold bg-slate-800/80 px-2 py-1 rounded">
                            {w.userId}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-black text-rose-400 font-mono">
                            ₹{parseFloat(w.amount).toFixed(2)} {w.currency}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            {w.payoutMethod === 'UPI' ? (
                              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                            ) : (
                              <Building className="w-3.5 h-3.5 text-amber-400" />
                            )}
                            <span>{w.payoutMethod}</span>
                          </div>
                          {w.payoutMethod === 'UPI' ? (
                            <div className="font-mono text-amber-400 text-[11px] mt-0.5 select-all font-semibold">
                              {w.payoutUpiId}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                              A/C: {w.payoutAccountNumber} | IFSC: {w.payoutIfscCode}
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-mono text-slate-400">
                          {w.payoutReference ? (
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {w.payoutReference}
                            </span>
                          ) : (
                            'Pending Transfer'
                          )}
                        </td>
                        <td className="p-4">
                          {w.status === 'PENDING' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" />
                              PENDING PAYOUT
                            </span>
                          )}
                          {w.status === 'PROCESSED' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              COMPLETED
                            </span>
                          )}
                          {w.status === 'REJECTED' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" />
                              REJECTED & REFUNDED
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {w.status === 'PENDING' ? (
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setPayoutRefInput('');
                                setAdminNoteInput('');
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                            >
                              Process Payout
                            </button>
                          ) : (
                            <div className="text-[11px] text-slate-400 font-mono">
                              By: {w.reviewedBy || 'Admin'}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. PAYMENT GATEWAYS & UPI CONFIGURATION TAB */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'gateways' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Active Payment Receiving Channels</h3>
              <p className="text-xs text-slate-400">
                These channels are directly shown to players inside the Deposit section when manual mode is active.
              </p>
            </div>

            {!isEditingGateway && (
              <button
                onClick={() => {
                  setGatewayForm({
                    type: 'UPI',
                    title: '',
                    accountHolderName: '',
                    upiId: '',
                    accountNumber: '',
                    ifscCode: '',
                    bankName: '',
                    minDepositAmount: '100',
                    maxDepositAmount: '50000',
                    depositInstructions: '',
                    isEnabled: true,
                  });
                  setIsEditingGateway(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Payment Method</span>
              </button>
            )}
          </div>

          {/* New / Edit Gateway Form */}
          {isEditingGateway && (
            <form
              onSubmit={handleSaveGateway}
              className="bg-[#0a0e1a] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-amber-400" />
                  <span>Configure Payment Receiving Channel</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditingGateway(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Channel Type</label>
                  <select
                    value={gatewayForm.type}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, type: e.target.value as any })}
                    className="w-full bg-[#101726] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                  >
                    <option value="UPI">UPI Direct (GPay, PhonePe, Paytm)</option>
                    <option value="BANK_TRANSFER">Bank Account (IMPS / NEFT)</option>
                    <option value="QR_CODE">Scan QR Code</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Display Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Official Google Pay / PhonePe UPI"
                    value={gatewayForm.title}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, title: e.target.value })}
                    className="w-full bg-[#101726] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ludo Arena Pvt Ltd"
                    value={gatewayForm.accountHolderName}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, accountHolderName: e.target.value })}
                    className="w-full bg-[#101726] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                  />
                </div>

                {gatewayForm.type === 'UPI' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Receiving UPI ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. payment@upi"
                      value={gatewayForm.upiId}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, upiId: e.target.value })}
                      className="w-full bg-[#101726] border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold focus:border-amber-500"
                    />
                  </div>
                )}

                {gatewayForm.type === 'BANK_TRANSFER' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Bank Account Number</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 918273645012"
                        value={gatewayForm.accountNumber}
                        onChange={(e) => setGatewayForm({ ...gatewayForm, accountNumber: e.target.value })}
                        className="w-full bg-[#101726] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Bank IFSC Code</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HDFC0001234"
                        value={gatewayForm.ifscCode}
                        onChange={(e) => setGatewayForm({ ...gatewayForm, ifscCode: e.target.value })}
                        className="w-full bg-[#101726] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Bank"
                        value={gatewayForm.bankName}
                        onChange={(e) => setGatewayForm({ ...gatewayForm, bankName: e.target.value })}
                        className="w-full bg-[#101726] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                      />
                    </div>
                  </>
                )}

                {gatewayForm.type === 'QR_CODE' && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-400 block">QR Code Scanner Image (Cloudflare R2)</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="https://... or upload image below"
                        value={gatewayForm.qrCodeUrl || ''}
                        onChange={(e) => setGatewayForm({ ...gatewayForm, qrCodeUrl: e.target.value })}
                        className="flex-1 bg-[#101726] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 font-mono"
                      />
                      <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold cursor-pointer transition shrink-0">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{isUploadingGatewayQr ? 'Uploading...' : 'Upload QR Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingGatewayQr(true);
                            try {
                              const fd = new FormData();
                              fd.append('file', file);
                              fd.append('category', 'admin_qr');
                              const res = await fetch('/api/storage/upload', {
                                method: 'POST',
                                body: fd,
                              });
                              const data = await res.json();
                              if (data.success && data.url) {
                                setGatewayForm((prev) => ({ ...prev, qrCodeUrl: data.url }));
                              }
                            } catch (err) {
                              console.error('Error uploading admin QR code', err);
                            } finally {
                              setIsUploadingGatewayQr(false);
                            }
                          }}
                        />
                      </label>
                    </div>
                    {gatewayForm.qrCodeUrl && (
                      <div className="mt-2 flex items-center gap-2 p-2 bg-[#101726] border border-slate-700 rounded-xl w-fit">
                        <img src={gatewayForm.qrCodeUrl} alt="QR Preview" className="w-12 h-12 object-contain rounded-lg border border-slate-600 bg-white" />
                        <span className="text-[11px] text-emerald-400 font-medium">QR Code Linked Successfully</span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Min Deposit (₹)</label>
                  <input
                    type="number"
                    value={gatewayForm.minDepositAmount}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, minDepositAmount: e.target.value })}
                    className="w-full bg-[#101726] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Max Deposit (₹)</label>
                  <input
                    type="number"
                    value={gatewayForm.maxDepositAmount}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, maxDepositAmount: e.target.value })}
                    className="w-full bg-[#101726] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Deposit Instructions for Players</label>
                <textarea
                  rows={2}
                  value={gatewayForm.depositInstructions}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, depositInstructions: e.target.value })}
                  placeholder="e.g. Pay exact amount, copy 12-digit UTR/Ref no from GPay/PhonePe and submit below."
                  className="w-full bg-[#101726] border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingGateway(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Channel</span>
                </button>
              </div>
            </form>
          )}

          {/* Gateways Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gateways.map((gw) => (
              <div
                key={gw.id}
                className="bg-[#0a0e1a] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 shadow-xl relative"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      {gw.type === 'UPI' ? <Smartphone className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{gw.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400">{gw.type}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteGateway(gw.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                    title="Delete Channel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 bg-[#101726] border border-slate-800/80 rounded-xl p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Name:</span>
                    <span className="text-slate-200 font-semibold">{gw.accountHolderName}</span>
                  </div>
                  {gw.upiId && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">UPI ID:</span>
                      <span className="text-amber-400 font-mono font-bold select-all">{gw.upiId}</span>
                    </div>
                  )}
                  {gw.accountNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account No:</span>
                      <span className="text-slate-200 font-mono">{gw.accountNumber}</span>
                    </div>
                  )}
                  {gw.ifscCode && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">IFSC:</span>
                      <span className="text-slate-200 font-mono">{gw.ifscCode}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-800 pt-2 text-[11px]">
                    <span className="text-slate-400">Limits:</span>
                    <span className="text-emerald-400 font-mono">
                      ₹{gw.minDepositAmount} - ₹{gw.maxDepositAmount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL: VERIFY DEPOSIT */}
      {/* ------------------------------------------------------------- */}
      {selectedDeposit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0e1a] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Verify Manual Deposit</h3>
              </div>
              <button onClick={() => setSelectedDeposit(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#101726] border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Deposit ID:</span>
                <span className="font-mono text-white font-bold">{selectedDeposit.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Player User ID:</span>
                <span className="font-mono text-slate-200 font-semibold">{selectedDeposit.userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deposit Amount:</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  ₹{parseFloat(selectedDeposit.amount).toFixed(2)} {selectedDeposit.currency}
                </span>
              </div>
              <div className="flex justify-between items-center bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                <span className="text-amber-300 font-bold">12-Digit UTR / Ref No:</span>
                <span className="text-sm font-mono font-black text-amber-400 select-all">
                  {selectedDeposit.utrNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sender Name:</span>
                <span className="text-slate-200">{selectedDeposit.senderName || 'Not given'}</span>
              </div>

              {/* Uploaded Screenshot Proof */}
              {selectedDeposit.screenshotUrl && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Payment Screenshot Proof:</span>
                    </span>
                    <a
                      href={selectedDeposit.screenshotUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5 font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Full Size</span>
                    </a>
                  </div>
                  <div
                    onClick={() => setPreviewImageUrl(selectedDeposit.screenshotUrl!)}
                    className="relative cursor-pointer group rounded-xl overflow-hidden border border-slate-700 max-h-48 flex items-center justify-center bg-black/60"
                  >
                    <img
                      src={selectedDeposit.screenshotUrl}
                      alt="Deposit Proof"
                      className="max-h-48 object-contain w-full group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs transition-opacity gap-1.5">
                      <Eye className="w-4 h-4" />
                      <span>Click to Zoom</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Admin Notes / Verification Memo (Optional)
              </label>
              <input
                type="text"
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                placeholder="e.g. Bank statement checked, UTR verified."
                className="w-full bg-[#101726] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => handleVerifyDeposit('REJECT')}
                className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-xl cursor-pointer transition-all disabled:opacity-50"
              >
                Reject Request
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => handleVerifyDeposit('APPROVE')}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-all disabled:opacity-50"
              >
                {isProcessingAction ? 'Crediting...' : 'Approve & Credit Balance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. MODAL: PROCESS WITHDRAWAL */}
      {/* ------------------------------------------------------------- */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0e1a] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Process Outgoing Payout</h3>
              </div>
              <button onClick={() => setSelectedWithdrawal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#101726] border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Withdrawal ID:</span>
                <span className="font-mono text-white font-bold">{selectedWithdrawal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Player User ID:</span>
                <span className="font-mono text-slate-200 font-semibold">{selectedWithdrawal.userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payout Amount:</span>
                <span className="text-base font-black text-rose-400 font-mono">
                  ₹{parseFloat(selectedWithdrawal.amount).toFixed(2)} {selectedWithdrawal.currency}
                </span>
              </div>
              <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 space-y-1">
                <div className="text-amber-300 font-bold">Transfer To:</div>
                {selectedWithdrawal.payoutMethod === 'UPI' ? (
                  <div className="text-sm font-mono font-black text-white select-all">
                    UPI: {selectedWithdrawal.payoutUpiId}
                  </div>
                ) : (
                  <div className="font-mono text-xs text-white">
                    A/C: {selectedWithdrawal.payoutAccountNumber} | IFSC: {selectedWithdrawal.payoutIfscCode}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Bank / IMPS UTR Reference Number (Provided upon transfer)
              </label>
              <input
                type="text"
                value={payoutRefInput}
                onChange={(e) => setPayoutRefInput(e.target.value)}
                placeholder="e.g. IMPS293847291048"
                className="w-full bg-[#101726] border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold focus:border-amber-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => handleProcessWithdrawal('REJECT')}
                className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-xl cursor-pointer transition-all disabled:opacity-50"
              >
                Reject & Refund Balance
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => handleProcessWithdrawal('APPROVE')}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-all disabled:opacity-50"
              >
                {isProcessingAction ? 'Processing...' : 'Confirm Transfer & Settle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. MODAL: FULLSCREEN IMAGE VIEWER (R2 SCREENSHOTS & QR CODES) */}
      {/* ------------------------------------------------------------- */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative bg-[#0d1321] border border-amber-400/60 rounded-3xl p-3 sm:p-5 max-w-2xl w-full flex flex-col items-center gap-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Payment Proof / Receipt Viewer</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full max-h-[70vh] overflow-auto flex items-center justify-center bg-black/80 rounded-2xl p-2">
              <img
                src={previewImageUrl}
                alt="Fullscreen Proof"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>

            <div className="w-full flex items-center justify-between pt-1">
              <a
                href={previewImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in New Tab</span>
              </a>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black cursor-pointer shadow"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
