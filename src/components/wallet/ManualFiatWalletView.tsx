import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Copy,
  Check,
  Building,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  IndianRupee,
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';

interface ManualFiatWalletViewProps {
  userId: string;
  currencySymbol: string;
  currencyCode: string;
  onBalanceUpdate?: (newBalance: string) => void;
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
  qrCodeUrl?: string;
  minDepositAmount: string;
  maxDepositAmount: string;
  depositInstructions?: string;
}

interface DepositRecord {
  id: string;
  amount: string;
  currency: string;
  utrNumber: string;
  senderName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
}

interface WithdrawalRecord {
  id: string;
  amount: string;
  currency: string;
  payoutMethod: 'UPI' | 'BANK_TRANSFER';
  payoutUpiId?: string;
  payoutAccountNumber?: string;
  payoutIfscCode?: string;
  feeAmount: string;
  netAmount: string;
  status: 'PENDING' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
  payoutReference?: string;
  adminNotes?: string;
  createdAt: string;
}

export const ManualFiatWalletView: React.FC<ManualFiatWalletViewProps> = ({
  userId,
  currencySymbol = '₹',
  currencyCode = 'INR',
  onBalanceUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'activity'>('deposit');
  const [balance, setBalance] = useState<number>(0);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [depositHistory, setDepositHistory] = useState<DepositRecord[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState<string>('500');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [senderAccount, setSenderAccount] = useState<string>('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState<boolean>(false);
  const [depositSuccessMsg, setDepositSuccessMsg] = useState<string | null>(null);
  const [depositErrorMsg, setDepositErrorMsg] = useState<string | null>(null);

  // Withdrawal Form State
  const [payoutMethod, setPayoutMethod] = useState<'UPI' | 'BANK_TRANSFER'>('UPI');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [payoutUpiId, setPayoutUpiId] = useState<string>('');
  const [payoutAccNo, setPayoutAccNo] = useState<string>('');
  const [payoutIfsc, setPayoutIfsc] = useState<string>('');
  const [payoutHolderName, setPayoutHolderName] = useState<string>('');
  const [payoutBankName, setPayoutBankName] = useState<string>('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState<boolean>(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState<string | null>(null);

  const fetchFiatData = async () => {
    setIsLoading(true);
    try {
      const [gRes, bRes, dRes, wRes] = await Promise.all([
        fetch('/api/manual-payments/gateways'),
        fetch(`/api/user/wallet?userId=${encodeURIComponent(userId)}`),
        fetch(`/api/manual-payments/deposits/user?userId=${encodeURIComponent(userId)}`),
        fetch(`/api/manual-payments/withdrawals/user?userId=${encodeURIComponent(userId)}`),
      ]);

      const gData = await gRes.json();
      const bData = await bRes.json();
      const dData = await dRes.json();
      const wData = await wRes.json();

      if (gData.success && Array.isArray(gData.gateways)) {
        setGateways(gData.gateways);
        if (gData.gateways.length > 0 && !selectedGateway) {
          setSelectedGateway(gData.gateways[0]);
        }
      }

      if (bData.success && bData.wallet) {
        const bal = parseFloat(bData.wallet.availableBalance || '0');
        setBalance(bal);
        if (onBalanceUpdate) onBalanceUpdate(bal.toFixed(2));
      }

      if (dData.success) setDepositHistory(dData.deposits || []);
      if (wData.success) setWithdrawalHistory(wData.withdrawals || []);
    } catch (err) {
      console.error('Error fetching fiat wallet data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiatData();
  }, [userId]);

  const handleCopy = (text: string) => {
    SoundManager.play('click');
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Submit manual deposit form
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositSuccessMsg(null);
    setDepositErrorMsg(null);

    if (!selectedGateway) {
      setDepositErrorMsg('Please select a payment method.');
      return;
    }

    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt < parseFloat(selectedGateway.minDepositAmount)) {
      setDepositErrorMsg(`Minimum deposit amount is ${currencySymbol}${selectedGateway.minDepositAmount}`);
      return;
    }

    if (!utrNumber.trim() || utrNumber.trim().length < 8) {
      setDepositErrorMsg('Please enter a valid 12-digit UTR or Reference Number from your payment app.');
      return;
    }

    setIsSubmittingDeposit(true);
    try {
      SoundManager.play('click');
      const res = await fetch('/api/manual-payments/deposits/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          gatewayId: selectedGateway.id,
          amount: depositAmount,
          currency: currencyCode,
          utrNumber: utrNumber.trim(),
          senderName: senderName.trim() || undefined,
          senderUpiOrAccount: senderAccount.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDepositSuccessMsg(
          `Deposit submission successful! UTR #${utrNumber.trim()} has been sent to the Admin Verification Queue. Balance will credit automatically upon approval.`
        );
        setUtrNumber('');
        setSenderName('');
        setSenderAccount('');
        fetchFiatData();
      } else {
        setDepositErrorMsg(data.error || 'Failed to submit deposit.');
      }
    } catch (err: any) {
      setDepositErrorMsg(err?.message || 'Server error submitting deposit.');
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  // Submit manual withdrawal form
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawSuccessMsg(null);
    setWithdrawErrorMsg(null);

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawErrorMsg('Please enter a valid amount.');
      return;
    }

    if (amt > balance) {
      setWithdrawErrorMsg(`Insufficient balance. Your available balance is ${currencySymbol}${balance.toFixed(2)}.`);
      return;
    }

    if (payoutMethod === 'UPI' && (!payoutUpiId.trim() || !payoutUpiId.includes('@'))) {
      setWithdrawErrorMsg('Please enter a valid UPI ID (e.g. yourname@oksbi).');
      return;
    }

    if (payoutMethod === 'BANK_TRANSFER' && (!payoutAccNo.trim() || !payoutIfsc.trim())) {
      setWithdrawErrorMsg('Please enter both Bank Account Number and valid IFSC Code.');
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      SoundManager.play('click');
      const res = await fetch('/api/manual-payments/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: withdrawAmount,
          currency: currencyCode,
          payoutMethod,
          payoutUpiId: payoutMethod === 'UPI' ? payoutUpiId.trim() : undefined,
          payoutAccountNumber: payoutMethod === 'BANK_TRANSFER' ? payoutAccNo.trim() : undefined,
          payoutIfscCode: payoutMethod === 'BANK_TRANSFER' ? payoutIfsc.trim().toUpperCase() : undefined,
          payoutAccountName: payoutHolderName.trim() || undefined,
          payoutBankName: payoutBankName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWithdrawSuccessMsg(
          `Withdrawal request submitted! Payout of ${currencySymbol}${withdrawAmount} is in process. Balance has been locked securely.`
        );
        setWithdrawAmount('');
        fetchFiatData();
      } else {
        setWithdrawErrorMsg(data.error || 'Failed to submit withdrawal.');
      }
    } catch (err: any) {
      setWithdrawErrorMsg(err?.message || 'Server error submitting withdrawal.');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. Hero Balance Card (Fiat Mode) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(20,4,45,0.75)] border-2 border-amber-400/80 bg-[#120426] select-none flex flex-col justify-between p-4 sm:p-5"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-purple-950/40 to-[#0b0319] pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between w-full mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.5)] border border-amber-200">
              <Wallet className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-amber-200 uppercase tracking-wider">
                Direct Fiat Account
              </h2>
              <p className="text-[10.5px] font-semibold text-slate-400">
                Instant UPI & Bank Transfer System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full shadow-[0_2px_8px_rgba(251,191,36,0.6)] border border-yellow-200 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 fill-slate-950" />
            <span>{currencyCode} Mode</span>
          </div>
        </div>

        {/* Balance Display */}
        <div className="relative z-10 bg-black/40 backdrop-blur-md rounded-2xl border border-amber-400/30 p-3.5 sm:p-4 my-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-widest flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              Available Playing Balance
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
              100% SECURE ESCROW
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
              {currencySymbol}{balance.toFixed(2)}
            </span>
            <span className="text-sm sm:text-base font-black text-amber-400 uppercase tracking-wider">
              {currencyCode}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. Navigation Tabs */}
      <div className="w-full flex items-center gap-2 p-1 bg-[#120426]/90 backdrop-blur-md rounded-2xl border border-amber-400/40 shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
        <button
          onClick={() => {
            SoundManager.play('click');
            setActiveTab('deposit');
          }}
          className={`flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'deposit'
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-[0_4px_12px_rgba(245,158,11,0.5)] border border-yellow-200'
              : 'text-slate-400 hover:text-amber-200 hover:bg-white/5'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 stroke-[2.8]" />
          <span>Add Money (UPI)</span>
        </button>

        <button
          onClick={() => {
            SoundManager.play('click');
            setActiveTab('withdraw');
          }}
          className={`flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'withdraw'
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-[0_4px_12px_rgba(245,158,11,0.5)] border border-yellow-200'
              : 'text-slate-400 hover:text-amber-200 hover:bg-white/5'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 stroke-[2.8]" />
          <span>Withdraw</span>
        </button>

        <button
          onClick={() => {
            SoundManager.play('click');
            setActiveTab('activity');
          }}
          className={`flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-[0_4px_12px_rgba(245,158,11,0.5)] border border-yellow-200'
              : 'text-slate-400 hover:text-amber-200 hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>History</span>
        </button>
      </div>

      {/* 3. Dynamic Tab Content */}
      <AnimatePresence mode="wait">
        {/* ===================== TAB 1: DEPOSIT / ADD MONEY ===================== */}
        {activeTab === 'deposit' && (
          <motion.div
            key="fiat-deposit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Step 1: Select Channel */}
            <div className="bg-[#120426]/90 border border-amber-400/40 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  1
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Select Official Receiving Channel
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gateways.map((gw) => (
                  <div
                    key={gw.id}
                    onClick={() => {
                      SoundManager.play('click');
                      setSelectedGateway(gw);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedGateway?.id === gw.id
                        ? 'bg-[#1f0b3d] border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-[#0d031c] border-white/10 hover:border-amber-400/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        {gw.type === 'UPI' ? <Smartphone className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{gw.title}</div>
                        <div className="text-[10px] text-slate-400">{gw.accountHolderName}</div>
                      </div>
                    </div>

                    {selectedGateway?.id === gw.id && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Channel Details & UPI Copy */}
              {selectedGateway && (
                <div className="bg-black/50 border border-amber-400/30 rounded-2xl p-4 space-y-3">
                  <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pay To The Following Verified Details</span>
                  </div>

                  {selectedGateway.upiId && (
                    <div className="flex items-center justify-between bg-[#120426] border border-amber-500/40 p-3 rounded-xl">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Official UPI ID</div>
                        <div className="text-sm font-mono font-black text-amber-400 select-all">
                          {selectedGateway.upiId}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedGateway.upiId!)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}

                  {selectedGateway.accountNumber && (
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#120426] p-3 rounded-xl border border-white/10">
                      <div>
                        <span className="text-slate-400 block text-[10px]">A/C Number:</span>
                        <span className="text-white font-bold select-all">{selectedGateway.accountNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">IFSC Code:</span>
                        <span className="text-amber-400 font-bold select-all">{selectedGateway.ifscCode}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Bank Name:</span>
                        <span className="text-slate-200">{selectedGateway.bankName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Name:</span>
                        <span className="text-slate-200">{selectedGateway.accountHolderName}</span>
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-300 leading-relaxed bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    {selectedGateway.depositInstructions ||
                      'Open Google Pay, PhonePe, Paytm or BHIM, send exact amount to the UPI above, and copy the 12-digit UTR / Ref Number.'}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Submit UTR & Amount Form */}
            <form
              onSubmit={handleDepositSubmit}
              className="bg-[#120426]/90 border border-amber-400/40 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  2
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Submit Deposit Details (12-Digit UTR)
                </h3>
              </div>

              {/* Quick Amount Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Amount ({currencySymbol})</label>
                <div className="grid grid-cols-4 gap-2">
                  {['100', '500', '1000', '2000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                        depositAmount === amt
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-black/40 text-slate-300 border-white/10 hover:border-amber-400/40'
                      }`}
                    >
                      {currencySymbol}{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  required
                  placeholder="Or enter custom amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-black/40 border border-amber-400/40 rounded-xl px-3.5 py-2 text-sm text-white font-mono font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>12-Digit UTR / Transaction Ref No</span>
                  <span className="text-[10px] text-amber-400">Mandatory</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 423984719283 (From Google Pay / PhonePe)"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full bg-black/40 border border-amber-400/40 rounded-xl px-3.5 py-2.5 text-sm text-amber-300 font-mono font-black focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Your Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Your UPI ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. rahul@okaxis"
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {depositSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{depositSuccessMsg}</span>
                </div>
              )}

              {depositErrorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{depositErrorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingDeposit}
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmittingDeposit ? 'Submitting Verification...' : 'Submit Deposit for Instant Approval'}
              </button>
            </form>
          </motion.div>
        )}

        {/* ===================== TAB 2: WITHDRAW ===================== */}
        {activeTab === 'withdraw' && (
          <motion.div
            key="fiat-withdraw"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <form
              onSubmit={handleWithdrawSubmit}
              className="bg-[#120426]/90 border border-amber-400/40 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-amber-400" />
                  <span>Request Outgoing Payout</span>
                </h3>
                <span className="text-xs font-mono text-amber-400 font-bold">
                  Max: {currencySymbol}{balance.toFixed(2)}
                </span>
              </div>

              {/* Method Switcher */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('UPI')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border transition cursor-pointer ${
                    payoutMethod === 'UPI'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-black/40 text-slate-400 border-white/10'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Direct UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutMethod('BANK_TRANSFER')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border transition cursor-pointer ${
                    payoutMethod === 'BANK_TRANSFER'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-black/40 text-slate-400 border-white/10'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Bank Account</span>
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Amount ({currencySymbol})</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    placeholder="Enter withdrawal amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-black/40 border border-amber-400/40 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono font-bold focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(balance.toString())}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black uppercase"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {payoutMethod === 'UPI' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Your UPI ID (GPay / PhonePe / Paytm)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. yourname@oksbi"
                    value={payoutUpiId}
                    onChange={(e) => setPayoutUpiId(e.target.value)}
                    className="w-full bg-black/40 border border-amber-400/40 rounded-xl px-3.5 py-2 text-sm text-amber-400 font-mono font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>
              )}

              {payoutMethod === 'BANK_TRANSFER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Account Holder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amit Kumar"
                      value={payoutHolderName}
                      onChange={(e) => setPayoutHolderName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Account Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 109283746501"
                      value={payoutAccNo}
                      onChange={(e) => setPayoutAccNo(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">IFSC Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SBIN0001234"
                      value={payoutIfsc}
                      onChange={(e) => setPayoutIfsc(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. State Bank of India"
                      value={payoutBankName}
                      onChange={(e) => setPayoutBankName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {withdrawSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{withdrawSuccessMsg}</span>
                </div>
              )}

              {withdrawErrorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{withdrawErrorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingWithdraw}
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmittingWithdraw ? 'Processing Payout Request...' : 'Confirm Withdrawal Request'}
              </button>
            </form>
          </motion.div>
        )}

        {/* ===================== TAB 3: HISTORY ===================== */}
        {activeTab === 'activity' && (
          <motion.div
            key="fiat-history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="space-y-2.5">
              {depositHistory.length === 0 && withdrawalHistory.length === 0 ? (
                <div className="bg-[#120426]/90 border border-amber-400/40 rounded-3xl p-8 text-center space-y-2">
                  <FileText className="w-8 h-8 text-amber-400/60 mx-auto" />
                  <p className="text-xs font-bold text-slate-300">No payment transactions yet.</p>
                  <p className="text-[11px] text-slate-500">Deposit money or request payout to see history.</p>
                </div>
              ) : (
                <>
                  {depositHistory.map((d) => (
                    <div
                      key={`dep-${d.id}`}
                      className="bg-[#120426]/95 border border-amber-400/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black">
                          <ArrowDownLeft className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">Deposit</span>
                            <span
                              className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md ${
                                d.status === 'APPROVED'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                  : d.status === 'REJECTED'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {d.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            UTR: {d.utrNumber} • {new Date(d.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black font-mono text-emerald-400">
                          +{currencySymbol}{parseFloat(d.amount).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {withdrawalHistory.map((w) => (
                    <div
                      key={`wth-${w.id}`}
                      className="bg-[#120426]/95 border border-amber-400/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">Withdrawal ({w.payoutMethod})</span>
                            <span
                              className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md ${
                                w.status === 'PROCESSED' || w.status === 'APPROVED'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                  : w.status === 'REJECTED'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {w.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {w.payoutReference ? `Ref: ${w.payoutReference}` : 'Pending Payout'} • {new Date(w.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black font-mono text-rose-400">
                          -{currencySymbol}{parseFloat(w.amount).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
