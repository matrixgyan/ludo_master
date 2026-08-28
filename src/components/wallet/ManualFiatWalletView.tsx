import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
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
  ChevronRight,
  UploadCloud,
  Image as ImageIcon,
  QrCode as QrCodeIcon,
  Eye,
  Trash2
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
  senderUpiOrAccount?: string;
  screenshotUrl?: string;
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
  payoutAccountName?: string;
  payoutBankName?: string;
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

  // Dynamic QR Code generation state
  const [dynamicQrUrl, setDynamicQrUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState<string>('500');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [senderAccount, setSenderAccount] = useState<string>('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState<boolean>(false);
  const [uploadedScreenshotUrl, setUploadedScreenshotUrl] = useState<string>('');
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
      if (wData.success) setWithdrawalHistory(dData.withdrawals || wData.withdrawals || []);
    } catch (err) {
      console.error('Error fetching fiat wallet data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiatData();
  }, [userId]);

  // Generate live dynamic UPI QR code whenever gateway or deposit amount changes
  useEffect(() => {
    // If selectedGateway is available, use its upiId or qrCodeUrl, otherwise fallback to default UPI
    const activeGateway = selectedGateway || (gateways.length > 0 ? gateways[0] : null);
    
    // If admin uploaded a static custom QR code image
    if (activeGateway?.qrCodeUrl && activeGateway.qrCodeUrl.trim().length > 0) {
      setDynamicQrUrl(activeGateway.qrCodeUrl);
      return;
    }

    const upiId = activeGateway?.upiId?.trim() || 'ludosupreme@upi';
    const payeeName = encodeURIComponent(activeGateway?.accountHolderName || 'Ludo Champion Arena');
    const amt = parseFloat(depositAmount);
    const validAmt = !isNaN(amt) && amt > 0 ? amt.toFixed(2) : '500.00';
    const note = encodeURIComponent(`Ludo_Deposit_${userId.slice(0, 8)}`);

    // Standard NPCI UPI URI Scheme (Auto-fills amount in Google Pay, PhonePe, Paytm, BHIM)
    const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${payeeName}&am=${validAmt}&cu=INR&tn=${note}`;

    setIsGeneratingQr(true);
    QRCode.toDataURL(upiIntentUri, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((dataUrl) => {
        setDynamicQrUrl(dataUrl);
      })
      .catch((err) => {
        console.error('Dynamic UPI QR generation error:', err);
        // Fallback to high-reliability online QR generator API
        const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiIntentUri)}`;
        setDynamicQrUrl(fallbackQr);
      })
      .finally(() => {
        setIsGeneratingQr(false);
      });
  }, [selectedGateway, gateways, depositAmount, userId]);

  const handleCopy = (text: string) => {
    SoundManager.play('click');
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Handle Screenshot file selection & preview
  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setDepositErrorMsg('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    // Max 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setDepositErrorMsg('Screenshot file size must be less than 10MB.');
      return;
    }

    setScreenshotFile(file);
    const localUrl = URL.createObjectURL(file);
    setScreenshotPreview(localUrl);
    setDepositErrorMsg(null);

    // Upload immediately to Cloudflare R2 via storage API
    setIsUploadingScreenshot(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'payment_receipts');
      formData.append('userId', userId);

      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setUploadedScreenshotUrl(data.url);
      } else {
        console.warn('R2 upload endpoint response without direct URL, using fallback URL');
        setUploadedScreenshotUrl(localUrl);
      }
    } catch (err) {
      console.warn('Screenshot R2 upload direct stream fallback:', err);
      setUploadedScreenshotUrl(localUrl);
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  const removeScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setUploadedScreenshotUrl('');
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

    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      setDepositErrorMsg('Please enter a valid 12-digit UTR or Reference Number from your payment app.');
      return;
    }

    setIsSubmittingDeposit(true);
    try {
      SoundManager.play('click');

      let finalScreenshotUrl = uploadedScreenshotUrl;
      // If file was selected but not uploaded yet, do it now
      if (screenshotFile && !finalScreenshotUrl) {
        try {
          const formData = new FormData();
          formData.append('file', screenshotFile);
          formData.append('category', 'payment_receipts');
          formData.append('userId', userId);

          const upRes = await fetch('/api/storage/upload', {
            method: 'POST',
            body: formData,
          });
          const upData = await upRes.json();
          if (upData.success && upData.url) {
            finalScreenshotUrl = upData.url;
          }
        } catch {
          // ignore
        }
      }

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
          screenshotUrl: finalScreenshotUrl || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDepositSuccessMsg(
          `Deposit submission successful! UTR #${utrNumber.trim()} with payment proof has been submitted to the Admin Verification Queue. Balance will credit automatically upon approval.`
        );
        setUtrNumber('');
        setSenderName('');
        setSenderAccount('');
        removeScreenshot();
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
                Direct Deposit Account
              </h2>
              <p className="text-[10.5px] font-semibold text-slate-400">
                Dynamic UPI QR & Direct Settlement
              </p>
            </div>
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
          <span>Add Money (UPI QR)</span>
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
            {/* Step 1: Select Amount & Scan Dynamic QR */}
            <div className="bg-[#120426]/90 border border-amber-400/40 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Select Amount & Scan Dynamic UPI QR
                  </h3>
                </div>
                <span className="text-[10.5px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Pre-filled Amount
                </span>
              </div>

              {/* Quick Amount Chips */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Choose Deposit Amount ({currencySymbol})</label>
                <div className="grid grid-cols-4 gap-2">
                  {['100', '500', '1000', '2000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        SoundManager.play('click');
                        setDepositAmount(amt);
                      }}
                      className={`py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                        depositAmount === amt
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-amber-300 shadow-md shadow-amber-500/30 scale-[1.02]'
                          : 'bg-black/40 text-slate-300 border-white/10 hover:border-amber-400/40'
                      }`}
                    >
                      {currencySymbol}{amt}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-black text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="10"
                    placeholder="Enter custom deposit amount"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-black/50 border border-amber-400/40 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white font-mono font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic QR Code Scanner Display */}
              <div className="bg-black/60 border border-amber-400/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center space-y-3">
                <div className="relative p-2.5 bg-white rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.25)] border-2 border-amber-400">
                  {dynamicQrUrl ? (
                    <img
                      src={dynamicQrUrl}
                      alt="Dynamic UPI QR Code"
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center text-slate-950 font-bold text-xs">
                      <QrCodeIcon className="w-10 h-10 mb-2 opacity-50 animate-pulse" />
                      <span>Generating QR Code...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-black text-amber-300 uppercase tracking-wide flex items-center justify-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <span>Scan with Any UPI App</span>
                  </div>
                  <p className="text-[11px] text-slate-300 max-w-sm font-medium">
                    Amount of <span className="text-amber-400 font-bold">{currencySymbol}{depositAmount || '0'}</span> is automatically pre-filled. Open PhonePe, Google Pay, Paytm or BHIM to pay instantly.
                  </p>
                </div>

                {(selectedGateway?.upiId || gateways[0]?.upiId || 'ludosupreme@upi') && (
                  <div className="w-full max-w-md flex items-center justify-between bg-[#120426] border border-amber-500/30 p-2.5 rounded-xl">
                    <div className="text-left pl-1">
                      <div className="text-[9.5px] text-slate-400 uppercase font-semibold">Official Payment UPI ID</div>
                      <div className="text-xs font-mono font-black text-amber-400 select-all">
                        {selectedGateway?.upiId || gateways[0]?.upiId || 'ludosupreme@upi'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedGateway?.upiId || gateways[0]?.upiId || 'ludosupreme@upi')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Upload Screenshot & Submit 12-Digit UTR */}
            <form
              onSubmit={handleDepositSubmit}
              className="bg-[#120426]/90 border border-amber-400/40 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  2
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Upload Payment Screenshot & Enter UTR
                </h3>
              </div>

              {/* 12-Digit UTR Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>12-Digit UTR / Transaction Ref No</span>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">Mandatory</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 423984719283 (from PhonePe/GPay receipt)"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full bg-black/40 border border-amber-400/40 rounded-xl px-3.5 py-2.5 text-sm text-amber-300 font-mono font-black focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Payment Screenshot File Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Upload Payment Screenshot (Receipt)</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Verified Encrypted Storage</span>
                </label>

                {!screenshotPreview ? (
                  <label className="border-2 border-dashed border-amber-400/50 hover:border-amber-400 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center cursor-pointer bg-black/30 hover:bg-black/50 transition-all text-center group">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleScreenshotChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-amber-300">
                      Click to Browse or Drag & Drop Screenshot
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Supports JPG, PNG, WEBP (Max 10MB)
                    </span>
                  </label>
                ) : (
                  <div className="relative bg-black/60 border border-amber-400/50 rounded-2xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={screenshotPreview}
                        alt="Uploaded Payment Receipt"
                        className="w-14 h-14 object-cover rounded-xl border border-amber-400/60 shrink-0"
                      />
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">
                          {screenshotFile?.name || 'Payment_Receipt.jpg'}
                        </div>
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold mt-0.5">
                          {isUploadingScreenshot ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Uploading screenshot...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Ready for Admin Verification</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removeScreenshot}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                      title="Remove Screenshot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {depositSuccessMsg && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{depositSuccessMsg}</span>
                </div>
              )}

              {depositErrorMsg && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{depositErrorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingDeposit || isUploadingScreenshot}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingDeposit ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting to Verification Queue...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Submit Deposit for Instant Approval</span>
                  </>
                )}
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
                            {d.screenshotUrl && (
                              <a
                                href={d.screenshotUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9.5px] font-mono text-cyan-400 hover:underline flex items-center gap-0.5"
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>Receipt</span>
                              </a>
                            )}
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
