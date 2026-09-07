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
  Trash2,
  Zap,
  Trophy,
  Lock,
  Flame,
  CheckCheck
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
  const [depositBalance, setDepositBalance] = useState<number>(0);
  const [winningBalance, setWinningBalance] = useState<number>(0);
  const [lockedBalance, setLockedBalance] = useState<number>(0);
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

  // Real-time 5% Fee Calculation for Withdrawal
  const numWithdraw = parseFloat(withdrawAmount) || 0;
  const withdrawFee = numWithdraw > 0 ? parseFloat((numWithdraw * 0.05).toFixed(2)) : 0;
  const netWithdraw = numWithdraw > 0 ? parseFloat((numWithdraw - withdrawFee).toFixed(2)) : 0;

  const fetchFiatData = async () => {
    setIsLoading(true);
    try {
      const [gRes, bRes, dRes, wRes] = await Promise.all([
        fetch(`/api/manual-payments/gateways?_t=${Date.now()}`, { cache: 'no-store' }).catch(() => null),
        fetch(`/api/user/wallet?userId=${encodeURIComponent(userId)}&_t=${Date.now()}`, { cache: 'no-store' }).catch(() => null),
        fetch(`/api/manual-payments/deposits/user?userId=${encodeURIComponent(userId)}&_t=${Date.now()}`, { cache: 'no-store' }).catch(() => null),
        fetch(`/api/manual-payments/withdrawals/user?userId=${encodeURIComponent(userId)}&_t=${Date.now()}`, { cache: 'no-store' }).catch(() => null),
      ]);

      const gData = gRes && gRes.ok ? await gRes.json().catch(() => ({})) : {};
      const bData = bRes && bRes.ok ? await bRes.json().catch(() => ({})) : {};
      const dData = dRes && dRes.ok ? await dRes.json().catch(() => ({})) : {};
      const wData = wRes && wRes.ok ? await wRes.json().catch(() => ({})) : {};

      if (gData.success && Array.isArray(gData.gateways)) {
        const gwList: PaymentGateway[] = gData.gateways;
        setGateways(gwList);
        setSelectedGateway((prev) => {
          if (!prev && gwList.length > 0) return gwList[0];
          if (prev) {
            const found = gwList.find((g) => g.id === prev.id);
            if (found) return found;
          }
          return gwList[0] || null;
        });
      }

      if (bData.success && bData.wallet) {
        const bal = parseFloat(bData.wallet.availableBalance || '0');
        const depBal = parseFloat(bData.wallet.depositBalance || '0');
        const winBal = parseFloat(bData.wallet.winningBalance || '0');
        const lockBal = parseFloat(bData.wallet.lockedBalance || '0');
        setBalance(bal);
        setDepositBalance(depBal);
        setWinningBalance(winBal);
        setLockedBalance(lockBal);
        if (onBalanceUpdate) onBalanceUpdate(bal.toFixed(2));
      }

      if (dData.success) setDepositHistory(dData.deposits || []);
      if (wData.success) setWithdrawalHistory(dData.withdrawals || wData.withdrawals || []);
    } catch (err) {
      console.warn('Notice fetching fiat wallet data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiatData();

    // Listen to custom updates or external triggers across all tabs and components
    const handleGatewayUpdate = () => {
      fetchFiatData();
    };
    window.addEventListener('ludo_gateways_updated', handleGatewayUpdate);
    window.addEventListener('ludo_platform_mode_changed', handleGatewayUpdate);
    window.addEventListener('storage', handleGatewayUpdate);
    window.addEventListener('focus', handleGatewayUpdate);
    return () => {
      window.removeEventListener('ludo_gateways_updated', handleGatewayUpdate);
      window.removeEventListener('ludo_platform_mode_changed', handleGatewayUpdate);
      window.removeEventListener('storage', handleGatewayUpdate);
      window.removeEventListener('focus', handleGatewayUpdate);
    };
  }, [userId]);

  // Generate live dynamic UPI QR code whenever gateway or deposit amount changes
  useEffect(() => {
    const activeGateway = selectedGateway || (gateways.length > 0 ? gateways[0] : null);
    
    // If admin uploaded a static custom QR code image
    if (activeGateway?.qrCodeUrl && activeGateway.qrCodeUrl.trim().length > 0) {
      setDynamicQrUrl(activeGateway.qrCodeUrl);
      return;
    }

    const upiId = activeGateway?.upiId?.trim() || '';
    if (!upiId) {
      setDynamicQrUrl('');
      return;
    }

    const payeeName = encodeURIComponent(activeGateway?.accountHolderName || 'Platform Treasury');
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
    setDepositErrorMsg(null);

    // Read base64 for persistent client-side preview & reliable fallback
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setScreenshotPreview(base64Data);

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
          // If direct R2 endpoint returned error, use base64 data URL fallback so server can process it
          setUploadedScreenshotUrl(base64Data);
        }
      } catch (err) {
        console.warn('Screenshot upload fallback to base64 payload:', err);
        setUploadedScreenshotUrl(base64Data);
      } finally {
        setIsUploadingScreenshot(false);
      }
    };
    reader.readAsDataURL(file);
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

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length !== 12 || !/^[0-9A-Za-z]{12}$/.test(cleanUtr)) {
      setDepositErrorMsg('A valid 12-digit Indian banking UTR / REF / RRN number is strictly required (e.g. 4248XXXXXXXX).');
      return;
    }

    if (!uploadedScreenshotUrl && !screenshotPreview) {
      setDepositErrorMsg('Transaction payment screenshot receipt is strictly required. Please upload your proof.');
      return;
    }

    setIsSubmittingDeposit(true);
    try {
      SoundManager.play('click');

      let finalScreenshotUrl = uploadedScreenshotUrl;
      // If file was selected but server upload is not yet complete or missing
      if (screenshotFile && (!finalScreenshotUrl || finalScreenshotUrl.startsWith('blob:'))) {
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
          // If multipart upload fails, fallback to screenshotPreview base64
          if (screenshotPreview && screenshotPreview.startsWith('data:image/')) {
            finalScreenshotUrl = screenshotPreview;
          }
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
          utrNumber: cleanUtr,
          senderName: senderName.trim() || undefined,
          senderUpiOrAccount: senderAccount.trim() || undefined,
          screenshotUrl: finalScreenshotUrl || screenshotPreview || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDepositSuccessMsg(
          `Deposit submission successful! 12-digit UTR #${cleanUtr} with payment screenshot has been sent to the Priority Verification Queue. Balance will credit automatically upon approval.`
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

  // Submit manual withdrawal form with Winning Balance check & 5% Platform Fee
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawSuccessMsg(null);
    setWithdrawErrorMsg(null);

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawErrorMsg('Please enter a valid amount.');
      return;
    }

    if (amt < 100) {
      setWithdrawErrorMsg(`Minimum withdrawal amount is ${currencySymbol}100.00 of Winning Balance.`);
      return;
    }

    if (amt > winningBalance) {
      setWithdrawErrorMsg(
        `Cannot withdraw deposited balance. Only winning amount is eligible for withdrawal. Your Winning Balance: ${currencySymbol}${winningBalance.toFixed(2)}, Deposited Balance: ${currencySymbol}${depositBalance.toFixed(2)}. Play matches to win withdrawable cash!`
      );
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
          `Withdrawal request submitted! Payout of ${currencySymbol}${withdrawAmount} (Net ${currencySymbol}${netWithdraw.toFixed(2)} after 5% fee) is in process. Winning balance locked securely.`
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
    <div className="relative z-10 w-full max-w-[440px] sm:max-w-[460px] flex flex-col items-center select-none box-border">
      {/* ========================================================================= */}
      {/* 2. THE TORN PARCHMENT SCROLL BOARD */}
      {/* ========================================================================= */}
      <div className="relative w-full filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.7)] my-1 box-border">
        {/* TOP PUSHPINS (Deep Glossy Violet 3D Spheres with specularity and cast shadow) */}
        {/* Left Pushpin */}
        <div className="absolute -top-2 left-4 z-30 pointer-events-none">
          <div className="relative w-5 h-5 rounded-full bg-gradient-to-tr from-[#3b0764] via-[#581c87] to-[#7e22ce] shadow-[0_3px_6px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.6)] border border-[#a855f7]/60 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/90 absolute top-1 left-1 blur-[0.3px]" />
          </div>
          <div className="w-4 h-2 bg-black/40 rounded-full blur-[1px] absolute -bottom-0.5 left-0.5" />
        </div>

        {/* Right Pushpin */}
        <div className="absolute -top-2 right-4 z-30 pointer-events-none">
          <div className="relative w-5 h-5 rounded-full bg-gradient-to-tr from-[#3b0764] via-[#581c87] to-[#7e22ce] shadow-[0_3px_6px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.6)] border border-[#a855f7]/60 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/90 absolute top-1 left-1 blur-[0.3px]" />
          </div>
          <div className="w-4 h-2 bg-black/40 rounded-full blur-[1px] absolute -bottom-0.5 left-0.5" />
        </div>

        {/* Parchment Body */}
        <div
          className="relative w-full bg-gradient-to-b from-[#fde79b] via-[#fde492] to-[#f8d47b] text-[#5c2411] px-4 sm:px-6 pt-5 pb-12 shadow-inner overflow-hidden border border-[#dfb35e]/70"
          style={{
            clipPath: `polygon(
              0% 0%, 
              100% 0%, 
              100% 32%, 
              98% 34%, 
              100% 36%, 
              100% 68%, 
              97.5% 70%, 
              100% 72%, 
              100% 97%, 
              97.5% 98.5%, 
              95% 97%, 
              85% 98.5%, 
              75% 97%, 
              65% 99%, 
              50% 96.5%, 
              35% 99%, 
              25% 97%, 
              15% 98.5%, 
              5% 97%, 
              0% 99%, 
              0% 75%, 
              2.5% 73%, 
              0% 71%, 
              0% 40%, 
              2% 38%, 
              0% 36%
            )`,
          }}
        >
          {/* Vintage Corner Flourishes / Filigree SVG */}
          <svg className="absolute top-2 left-2 w-8 h-8 text-[#caa050]/40 pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
            <path d="M10,10 Q40,15 50,40 Q25,35 15,60 Q10,35 10,10 Z M20,10 Q60,10 70,50 Q40,30 20,10 Z" />
          </svg>
          <svg className="absolute top-2 right-2 w-8 h-8 text-[#caa050]/40 pointer-events-none rotate-90" viewBox="0 0 100 100" fill="currentColor">
            <path d="M10,10 Q40,15 50,40 Q25,35 15,60 Q10,35 10,10 Z M20,10 Q60,10 70,50 Q40,30 20,10 Z" />
          </svg>
          <svg className="absolute bottom-5 left-2 w-8 h-8 text-[#caa050]/40 pointer-events-none -rotate-90" viewBox="0 0 100 100" fill="currentColor">
            <path d="M10,10 Q40,15 50,40 Q25,35 15,60 Q10,35 10,10 Z M20,10 Q60,10 70,50 Q40,30 20,10 Z" />
          </svg>
          <svg className="absolute bottom-5 right-2 w-8 h-8 text-[#caa050]/40 pointer-events-none rotate-180" viewBox="0 0 100 100" fill="currentColor">
            <path d="M10,10 Q40,15 50,40 Q25,35 15,60 Q10,35 10,10 Z M20,10 Q60,10 70,50 Q40,30 20,10 Z" />
          </svg>

          {/* Header Title on Parchment */}
          <div className="relative flex flex-col items-center mb-3 text-center px-4">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-[#5c2411] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] truncate max-w-full">
              Ludo Royale Vault
            </h2>
            <div className="flex items-center justify-center flex-wrap gap-1.5 mt-0.5 max-w-full">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping shrink-0" />
              <span className="text-[10.5px] sm:text-[11px] font-extrabold uppercase tracking-wide text-[#78350f]">
                Official Real Escrow • Instant Settlements
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BALANCE OVERVIEW (TOTAL, WINNINGS & DEPOSITED) */}
          {/* ========================================================================= */}
          <div className="relative bg-[#fff7d6] border-2 border-[#caa050] rounded-2xl p-3 sm:p-4 mb-3.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_4px_12px_rgba(92,36,17,0.12)] w-full box-border">
            <div className="flex items-baseline justify-between flex-wrap gap-1 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#78350f] flex items-center gap-1 shrink-0">
                <Wallet className="w-3.5 h-3.5 text-[#b45309]" />
                Total Playing Balance
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#5c2411] font-mono shrink-0">
                {currencySymbol}{balance.toFixed(2)}
              </span>
            </div>

            {/* Split Breakdown: WINNING vs DEPOSIT */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#dfb35e]/60 w-full box-border">
              {/* Winning Balance (Withdrawable) */}
              <div className="bg-gradient-to-br from-[#fef08a]/60 to-[#fde047]/40 border border-[#ca8a04]/50 rounded-xl p-2 text-left shadow-sm min-w-0 box-border">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#713f12] flex items-center gap-1 shrink-0">
                    <Trophy className="w-3 h-3 text-[#ca8a04]" />
                    Winning
                  </span>
                  <span className="text-[9px] font-extrabold bg-emerald-700 text-white px-1.5 py-0.2 rounded-full shadow-xs shrink-0">
                    Withdrawable
                  </span>
                </div>
                <div className="text-base sm:text-lg font-black text-[#451a03] font-mono mt-0.5 truncate">
                  {currencySymbol}{winningBalance.toFixed(2)}
                </div>
                <span className="text-[9px] text-[#854d0e] font-semibold block leading-tight truncate">
                  Instant cashout
                </span>
              </div>

              {/* Deposit Balance (In-Play Only) */}
              <div className="bg-gradient-to-br from-[#fef3c7]/60 to-[#fed7aa]/30 border border-[#d97706]/40 rounded-xl p-2 text-left shadow-sm min-w-0 box-border">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#7c2d12] flex items-center gap-1 shrink-0">
                    <Lock className="w-3 h-3 text-[#d97706]" />
                    Deposit
                  </span>
                  <span className="text-[9px] font-extrabold bg-[#b45309] text-white px-1.5 py-0.2 rounded-full shadow-xs shrink-0">
                    In-Play
                  </span>
                </div>
                <div className="text-base sm:text-lg font-black text-[#451a03] font-mono mt-0.5 truncate">
                  {currencySymbol}{depositBalance.toFixed(2)}
                </div>
                <span className="text-[9px] text-[#9a3412] font-semibold block leading-tight truncate">
                  Play matches to win
                </span>
              </div>
            </div>

            {/* Locked in Match notice if applicable */}
            {lockedBalance > 0 && (
              <div className="mt-2 text-[10px] font-bold text-[#b45309] flex items-center justify-between flex-wrap gap-1 bg-amber-100/80 px-2 py-1 rounded-lg border border-amber-300 w-full box-border">
                <span className="shrink-0">In Active Match / Locked Escrow:</span>
                <span className="font-mono font-black shrink-0">{currencySymbol}{lockedBalance.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 3. 3D PILL NAVIGATION TABS (MATCHING LOBBY 3D BUTTONS) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3.5">
            {/* Add Money Tab */}
            <button
              type="button"
              onClick={() => {
                SoundManager.play('click');
                setActiveTab('deposit');
              }}
              className={`py-2 px-1 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'deposit'
                  ? 'bg-gradient-to-b from-[#fde047] via-[#eab308] to-[#ca8a04] border-2 border-[#fef08a] shadow-[0_3px_8px_rgba(202,138,4,0.5),inset_0_2px_3px_rgba(255,255,255,0.7)] text-[#451a03] scale-[1.02]'
                  : 'bg-[#e5be6b]/60 border border-[#b45309]/30 text-[#78350f] hover:bg-[#e5be6b]'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 stroke-[3]" />
              <span className="truncate">Add Cash</span>
            </button>

            {/* Withdraw Tab */}
            <button
              type="button"
              onClick={() => {
                SoundManager.play('click');
                setActiveTab('withdraw');
              }}
              className={`py-2 px-1 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'withdraw'
                  ? 'bg-gradient-to-b from-[#fde047] via-[#eab308] to-[#ca8a04] border-2 border-[#fef08a] shadow-[0_3px_8px_rgba(202,138,4,0.5),inset_0_2px_3px_rgba(255,255,255,0.7)] text-[#451a03] scale-[1.02]'
                  : 'bg-[#e5be6b]/60 border border-[#b45309]/30 text-[#78350f] hover:bg-[#e5be6b]'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
              <span className="truncate">Withdraw</span>
            </button>

            {/* History Tab */}
            <button
              type="button"
              onClick={() => {
                SoundManager.play('click');
                setActiveTab('activity');
              }}
              className={`py-2 px-1 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'activity'
                  ? 'bg-gradient-to-b from-[#fde047] via-[#eab308] to-[#ca8a04] border-2 border-[#fef08a] shadow-[0_3px_8px_rgba(202,138,4,0.5),inset_0_2px_3px_rgba(255,255,255,0.7)] text-[#451a03] scale-[1.02]'
                  : 'bg-[#e5be6b]/60 border border-[#b45309]/30 text-[#78350f] hover:bg-[#e5be6b]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="truncate">Passbook</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB CONTENTS */}
          {/* ========================================================================= */}
          <AnimatePresence mode="wait">
            {/* ----------------- TAB 1: ADD CASH (DEPOSIT) ----------------- */}
            {activeTab === 'deposit' && (
              <motion.div
                key="tab-deposit"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                {/* Step 1 Box: Amount & Dynamic UPI QR */}
                <div className="bg-[#fff9e6] border-2 border-[#caa050] rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#caa050]/40">
                    <span className="text-xs font-black uppercase text-[#5c2411] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#ca8a04] text-white flex items-center justify-center font-black text-[11px]">
                        1
                      </span>
                      Scan & Pay with Any UPI App
                    </span>
                    <span className="text-[9.5px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      Zero Fees
                    </span>
                  </div>

                  {/* Quick Chips */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {['100', '500', '1000', '2000'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          SoundManager.play('click');
                          setDepositAmount(amt);
                        }}
                        className={`py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                          depositAmount === amt
                            ? 'bg-gradient-to-b from-[#fde047] via-[#eab308] to-[#ca8a04] border-[#fef08a] text-[#451a03] shadow-[0_2px_6px_rgba(202,138,4,0.4)] scale-[1.02]'
                            : 'bg-[#fff7d6] text-[#78350f] border-[#caa050] hover:bg-[#fde79b]'
                        }`}
                      >
                        {currencySymbol}{amt}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount Input */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78350f] font-black text-sm">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="10"
                      placeholder="Enter custom deposit amount"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-[#fffdf5] border-2 border-[#caa050] rounded-xl pl-7 pr-3 py-2 text-sm text-[#451a03] font-mono font-black focus:border-[#b45309] focus:outline-none"
                    />
                  </div>

                  {/* QR Code Container */}
                  <div className="bg-[#fffdf5] border border-[#caa050] rounded-xl p-3 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="relative p-2 bg-white rounded-xl shadow-md border-2 border-[#ca8a04]">
                      {dynamicQrUrl ? (
                        <img
                          src={dynamicQrUrl}
                          alt="Dynamic UPI QR Code"
                          className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-md"
                        />
                      ) : (
                        <div className="w-40 h-40 flex flex-col items-center justify-center text-[#78350f] font-bold text-xs p-2">
                          <QrCodeIcon className="w-8 h-8 mb-1 opacity-60 animate-pulse" />
                          <span>Generating Dynamic QR...</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] font-bold text-[#5c2411]">
                      Amount of <span className="text-[#b45309] font-black">{currencySymbol}{depositAmount || '0'}</span> is auto-filled.
                    </p>

                    {/* Official UPI ID with Copy */}
                    {(selectedGateway?.upiId || gateways.find((g) => g.upiId)?.upiId) && (
                      <div className="w-full flex items-center justify-between gap-2 bg-[#fff7d6] border border-[#caa050] p-2 rounded-lg text-left box-border">
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] text-[#78350f] uppercase font-bold">Official UPI ID</div>
                          <div className="text-xs font-mono font-black text-[#5c2411] truncate select-all">
                            {selectedGateway?.upiId || gateways.find((g) => g.upiId)?.upiId}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedGateway?.upiId || gateways.find((g) => g.upiId)?.upiId || '')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] text-white text-xs font-black shadow-xs cursor-pointer border border-[#7dd3fc] shrink-0"
                        >
                          {copiedUpi ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2 Box: Mandatory 12-Digit UTR and Mandatory Screenshot */}
                <form
                  onSubmit={handleDepositSubmit}
                  className="bg-[#fff9e6] border-2 border-[#caa050] rounded-2xl p-3 sm:p-4 shadow-sm space-y-3 w-full box-border"
                >
                  <div className="flex items-center justify-between flex-wrap gap-1 pb-1.5 border-b border-[#caa050]/40">
                    <span className="text-xs font-black uppercase text-[#5c2411] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#ca8a04] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                        2
                      </span>
                      Mandatory Payment Verification
                    </span>
                    <span className="text-[9.5px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full uppercase shrink-0">
                      Both Required
                    </span>
                  </div>

                  {/* 12-Digit UTR Field */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#5c2411] flex items-center justify-between flex-wrap gap-1">
                      <span>12-Digit UTR / REF / RRN Number <span className="text-rose-600">*</span></span>
                      <span className="text-[10px] font-mono font-bold text-[#b45309]">12 Digits Strict</span>
                    </label>
                    <div className="relative w-full">
                      <input
                        type="text"
                        required
                        maxLength={12}
                        placeholder="e.g. 4248XXXXXXXX"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                        className={`w-full bg-[#fffdf5] border-2 rounded-xl pl-3 pr-20 py-2 text-sm font-mono font-black focus:outline-none box-border ${
                          utrNumber.trim().length === 12
                            ? 'border-emerald-600 text-emerald-900 bg-emerald-50/40'
                            : 'border-[#caa050] text-[#451a03] focus:border-[#b45309]'
                        }`}
                      />
                      {utrNumber.trim().length === 12 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center gap-1 text-[11px] font-bold shrink-0 pointer-events-none">
                          <CheckCheck className="w-4 h-4 stroke-[3]" />
                          <span>Valid</span>
                        </div>
                      )}
                    </div>
                    {utrNumber.trim().length > 0 && utrNumber.trim().length !== 12 && (
                      <p className="text-[10px] font-bold text-rose-700">
                        UTR must be exactly 12 characters ({utrNumber.trim().length}/12 entered)
                      </p>
                    )}
                  </div>

                  {/* Mandatory Payment Screenshot Upload */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#5c2411] flex items-center justify-between flex-wrap gap-1">
                      <span>Transaction Screenshot Receipt <span className="text-rose-600">*</span></span>
                      <span className="text-[10px] font-bold text-emerald-700">Encrypted Cloud Storage</span>
                    </label>

                    {!screenshotPreview ? (
                      <label className="border-2 border-dashed border-[#ca8a04] hover:border-[#b45309] rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center cursor-pointer bg-[#fffdf5] hover:bg-[#fff7d6] transition-all text-center group">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={handleScreenshotChange}
                          className="hidden"
                        />
                        <div className="w-9 h-9 rounded-full bg-[#ca8a04]/20 border border-[#ca8a04] flex items-center justify-center text-[#78350f] mb-1.5 group-hover:scale-105 transition-transform">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black text-[#5c2411]">
                          Click to Upload Payment Screenshot Receipt
                        </span>
                        <span className="text-[10px] text-[#78350f]">
                          JPG, PNG, WEBP (Max 10MB) • Mandatory for approval
                        </span>
                      </label>
                    ) : (
                      <div className="relative bg-[#fffdf5] border-2 border-emerald-600/70 rounded-xl p-2.5 flex items-center justify-between gap-2.5 shadow-xs">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <img
                            src={screenshotPreview}
                            alt="Receipt Preview"
                            className="w-12 h-12 object-cover rounded-lg border border-[#caa050] shrink-0"
                          />
                          <div className="truncate">
                            <div className="text-xs font-black text-[#5c2411] truncate">
                              {screenshotFile?.name || 'Payment_Proof.jpg'}
                            </div>
                            <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-bold">
                              {isUploadingScreenshot ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>Securing upload...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Proof Verified & Attached</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={removeScreenshot}
                          className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300 transition cursor-pointer"
                          title="Remove Screenshot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {depositSuccessMsg && (
                    <div className="p-2.5 bg-emerald-100 border border-emerald-400 rounded-xl text-xs font-bold text-emerald-900 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
                      <span>{depositSuccessMsg}</span>
                    </div>
                  )}

                  {depositErrorMsg && (
                    <div className="p-2.5 bg-rose-100 border border-rose-400 rounded-xl text-xs font-bold text-rose-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
                      <span>{depositErrorMsg}</span>
                    </div>
                  )}

                  {/* 3D Gold Submit Button */}
                  <button
                    type="submit"
                    disabled={
                      isSubmittingDeposit ||
                      isUploadingScreenshot ||
                      utrNumber.trim().length !== 12 ||
                      (!screenshotPreview && !uploadedScreenshotUrl)
                    }
                    className="w-full py-3 mb-2 bg-gradient-to-b from-[#fde047] via-[#eab308] to-[#ca8a04] hover:from-[#fef08a] hover:via-[#fde047] hover:to-[#eab308] text-[#451a03] font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_4px_12px_rgba(202,138,4,0.6),inset_0_2px_4px_rgba(255,255,255,0.8)] border-2 border-[#fef08a] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingDeposit ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending to Priority Queue...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-[#451a03]" />
                        <span>Submit for verification</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ----------------- TAB 2: WITHDRAW (WINNINGS ONLY & 5% FEE) ----------------- */}
            {activeTab === 'withdraw' && (
              <motion.div
                key="tab-withdraw"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                <form
                  onSubmit={handleWithdrawSubmit}
                  className="bg-[#fff9e6] border-2 border-[#caa050] rounded-2xl p-3 sm:p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#caa050]/40">
                    <span className="text-xs font-black uppercase text-[#5c2411] flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-[#ca8a04]" />
                      Withdraw Winning Amount
                    </span>
                    <span className="text-[10px] font-black font-mono text-[#451a03] bg-[#fde047] px-2 py-0.5 rounded-md border border-[#ca8a04]">
                      Max Winnings: {currencySymbol}{winningBalance.toFixed(2)}
                    </span>
                  </div>

                  {/* Notice about Winning vs Deposited balance */}
                  <div className="p-2.5 bg-amber-100/90 border border-amber-300 rounded-xl text-[11px] text-[#78350f] space-y-1">
                    <div className="font-extrabold text-[#5c2411] flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-[#ca8a04]" />
                      Withdrawal Policy:
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 font-bold text-[10.5px]">
                      <li>Deposited balance is for playing matches only and cannot be withdrawn.</li>
                      <li>Only Winning Balance is eligible for payout.</li>
                      <li>Minimum withdrawal is <span className="text-rose-800 font-extrabold">{currencySymbol}100.00</span>.</li>
                      <li>Platform fee: <span className="text-[#b45309] font-extrabold">5%</span> (deducted from gross request).</li>
                    </ul>
                  </div>

                  {/* Payout Channel Selector (UPI vs Bank) */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        SoundManager.play('click');
                        setPayoutMethod('UPI');
                      }}
                      className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                        payoutMethod === 'UPI'
                          ? 'bg-gradient-to-b from-[#fde047] via-[#eab308] to-[#ca8a04] border-[#fef08a] text-[#451a03] shadow-[0_2px_6px_rgba(202,138,4,0.4)]'
                          : 'bg-[#fff7d6] text-[#78350f] border-[#caa050]'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Direct UPI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        SoundManager.play('click');
                        setPayoutMethod('BANK_TRANSFER');
                      }}
                      className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                        payoutMethod === 'BANK_TRANSFER'
                          ? 'bg-gradient-to-b from-[#fde047] via-[#eab308] to-[#ca8a04] border-[#fef08a] text-[#451a03] shadow-[0_2px_6px_rgba(202,138,4,0.4)]'
                          : 'bg-[#fff7d6] text-[#78350f] border-[#caa050]'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>Bank Account</span>
                    </button>
                  </div>

                  {/* Withdrawal Amount Input with MAX button */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#5c2411]">Withdraw Amount ({currencySymbol})</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78350f] font-black text-sm">
                        {currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="100"
                        step="1"
                        required
                        placeholder="Enter amount (min ₹100)"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-[#fffdf5] border-2 border-[#caa050] rounded-xl pl-7 pr-28 py-2 text-sm text-[#451a03] font-mono font-black focus:border-[#b45309] focus:outline-none box-border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          SoundManager.play('click');
                          setWithdrawAmount(winningBalance > 0 ? winningBalance.toString() : '0');
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#f87171] via-[#ef4444] to-[#b91c1c] text-white text-[10px] font-black uppercase shadow-xs border border-[#fca5a5] active:scale-95 transition-transform shrink-0"
                      >
                        Max Winnings
                      </button>
                    </div>
                  </div>

                  {/* REAL-TIME 5% PLATFORM FEE CALCULATION BREAKDOWN BOX */}
                  {numWithdraw > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-gradient-to-br from-[#fff7d6] to-[#fef08a]/50 border-2 border-[#caa050] rounded-xl p-3 space-y-1.5 shadow-xs w-full box-border"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-1 text-xs font-bold text-[#5c2411]">
                        <span>Gross Withdrawal Request:</span>
                        <span className="font-mono font-black shrink-0">{currencySymbol}{numWithdraw.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between flex-wrap gap-1 text-xs font-bold text-[#7c2d12]">
                        <span className="flex items-center gap-1">
                          <span>Platform Service Fee:</span>
                          <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full font-mono font-black">
                            5%
                          </span>
                        </span>
                        <span className="font-mono font-black text-rose-700 shrink-0">
                          -{currencySymbol}{withdrawFee.toFixed(2)}
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-[#caa050]/60 flex items-center justify-between flex-wrap gap-1 text-sm font-black text-[#451a03]">
                        <span>Total Amount You Receive:</span>
                        <span className="text-base font-black font-mono text-emerald-800 shrink-0">
                          {currencySymbol}{netWithdraw.toFixed(2)}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Live Validation Warnings */}
                  {numWithdraw > 0 && numWithdraw < 100 && (
                    <div className="p-2 bg-amber-100 border border-amber-300 rounded-xl text-[11px] font-bold text-amber-900 flex items-center gap-1.5 w-full box-border">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Minimum withdrawal amount is {currencySymbol}100.00 of winning balance.</span>
                    </div>
                  )}

                  {numWithdraw > winningBalance && (
                    <div className="p-2 bg-rose-100 border border-rose-300 rounded-xl text-[11px] font-bold text-rose-900 flex items-center gap-1.5 w-full box-border">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                      <span>
                        Cannot withdraw deposited balance. Only winning balance ({currencySymbol}{winningBalance.toFixed(2)}) is withdrawable.
                      </span>
                    </div>
                  )}

                  {/* UPI Inputs */}
                  {payoutMethod === 'UPI' && (
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#5c2411]">Your UPI ID (GPay / PhonePe / Paytm / BHIM)</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. yourname@oksbi"
                        value={payoutUpiId}
                        onChange={(e) => setPayoutUpiId(e.target.value)}
                        className="w-full bg-[#fffdf5] border-2 border-[#caa050] rounded-xl px-3 py-2 text-sm text-[#451a03] font-mono font-bold focus:border-[#b45309] focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Bank Account Inputs */}
                  {payoutMethod === 'BANK_TRANSFER' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#5c2411]">Account Holder Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ramesh Kumar"
                            value={payoutHolderName}
                            onChange={(e) => setPayoutHolderName(e.target.value)}
                            className="w-full bg-[#fffdf5] border-2 border-[#caa050] rounded-xl px-2.5 py-1.5 text-xs text-[#451a03] font-bold focus:border-[#b45309] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#5c2411]">Account Number</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 109283746501"
                            value={payoutAccNo}
                            onChange={(e) => setPayoutAccNo(e.target.value)}
                            className="w-full bg-[#fffdf5] border-2 border-[#caa050] rounded-xl px-2.5 py-1.5 text-xs text-[#451a03] font-mono font-bold focus:border-[#b45309] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#5c2411]">IFSC Code</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. SBIN0001234"
                            value={payoutIfsc}
                            onChange={(e) => setPayoutIfsc(e.target.value.toUpperCase())}
                            className="w-full bg-[#fffdf5] border-2 border-[#caa050] rounded-xl px-2.5 py-1.5 text-xs text-[#451a03] font-mono font-bold focus:border-[#b45309] focus:outline-none uppercase"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#5c2411]">Bank Name</label>
                          <input
                            type="text"
                            placeholder="e.g. State Bank of India"
                            value={payoutBankName}
                            onChange={(e) => setPayoutBankName(e.target.value)}
                            className="w-full bg-[#fffdf5] border-2 border-[#caa050] rounded-xl px-2.5 py-1.5 text-xs text-[#451a03] font-bold focus:border-[#b45309] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {withdrawSuccessMsg && (
                    <div className="p-2.5 bg-emerald-100 border border-emerald-400 rounded-xl text-xs font-bold text-emerald-900 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
                      <span>{withdrawSuccessMsg}</span>
                    </div>
                  )}

                  {withdrawErrorMsg && (
                    <div className="p-2.5 bg-rose-100 border border-rose-400 rounded-xl text-xs font-bold text-rose-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
                      <span>{withdrawErrorMsg}</span>
                    </div>
                  )}

                  {/* 3D Emerald Green Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingWithdraw || numWithdraw < 100 || numWithdraw > winningBalance}
                    className="w-full py-3 mb-2 bg-gradient-to-b from-[#4ade80] via-[#22c55e] to-[#15803d] hover:from-[#86efac] hover:via-[#4ade80] hover:to-[#22c55e] text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_4px_12px_rgba(22,101,52,0.6),inset_0_2px_4px_rgba(255,255,255,0.8)] border-2 border-[#86efac] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingWithdraw ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Locking Funds & Requesting Payout...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Confirm Withdrawal ({currencySymbol}{netWithdraw.toFixed(2)} Net)</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ----------------- TAB 3: PASSBOOK / HISTORY ----------------- */}
            {activeTab === 'activity' && (
              <motion.div
                key="tab-activity"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-2.5"
              >
                {depositHistory.length === 0 && withdrawalHistory.length === 0 ? (
                  <div className="bg-[#fff9e6] border-2 border-[#caa050] rounded-2xl p-6 text-center space-y-1.5">
                    <FileText className="w-8 h-8 text-[#ca8a04] mx-auto" />
                    <p className="text-xs font-black text-[#5c2411]">No transactions recorded yet.</p>
                    <p className="text-[11px] text-[#78350f]">Add cash or withdraw winnings to view your ledger history.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {depositHistory.map((d) => (
                      <div
                        key={`dep-${d.id}`}
                        className="bg-[#fffdf5] border-2 border-[#caa050] rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-xs min-w-0 box-border"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">
                            <ArrowDownLeft className="w-4 h-4 stroke-[3]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-[#5c2411]">Deposit</span>
                              <span
                                className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md shrink-0 ${
                                  d.status === 'APPROVED'
                                    ? 'bg-emerald-700 text-white'
                                    : d.status === 'REJECTED'
                                    ? 'bg-rose-700 text-white'
                                    : 'bg-amber-600 text-white'
                                }`}
                              >
                                {d.status}
                              </span>
                              {d.screenshotUrl && (
                                <a
                                  href={d.screenshotUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9px] font-bold text-[#0284c7] hover:underline flex items-center gap-0.5 shrink-0"
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  <span>Receipt</span>
                                </a>
                              )}
                            </div>
                            <div className="text-[9.5px] text-[#78350f] font-mono truncate max-w-full">
                              UTR: {d.utrNumber} • {new Date(d.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-black font-mono text-emerald-800">
                            +{currencySymbol}{parseFloat(d.amount).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {withdrawalHistory.map((w) => (
                      <div
                        key={`wth-${w.id}`}
                        className="bg-[#fffdf5] border-2 border-[#caa050] rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-xs min-w-0 box-border"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-[#ca8a04] text-white flex items-center justify-center font-black shrink-0">
                            <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-[#5c2411]">Withdrawal</span>
                              <span
                                className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md shrink-0 ${
                                  w.status === 'PROCESSED' || w.status === 'APPROVED'
                                    ? 'bg-emerald-700 text-white'
                                    : w.status === 'REJECTED'
                                    ? 'bg-rose-700 text-white'
                                    : 'bg-amber-600 text-white'
                                }`}
                              >
                                {w.status}
                              </span>
                            </div>
                            <div className="text-[9.5px] text-[#78350f] font-mono truncate max-w-full">
                              {w.payoutReference ? `Ref: ${w.payoutReference}` : 'Pending Payout'} • {new Date(w.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-black font-mono text-rose-700">
                            -{currencySymbol}{parseFloat(w.amount).toFixed(2)}
                          </div>
                          {w.feeAmount && parseFloat(w.feeAmount) > 0 && (
                            <div className="text-[9px] text-[#78350f] font-bold">
                              Fee: {currencySymbol}{parseFloat(w.feeAmount).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
