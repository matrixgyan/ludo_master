import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  ChevronRight,
  Zap,
  Globe,
  Send
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import { NetworkLogo } from './NetworkLogo';
import { ManualFiatWalletView } from './ManualFiatWalletView';
import { usePlatformMode } from '../../hooks/usePlatformMode';
import {
  UnifiedWalletService,
  UserWalletData,
  SupportedNetwork,
  DepositInfo,
  DepositItem,
  WithdrawalItem,
  WithdrawalQuote,
  DEFAULT_SUPPORTED_NETWORKS,
} from '../../services/unifiedWalletService';

interface AssetsViewProps {
  userId: string;
  onBack: () => void;
  onBalanceUpdate?: (newBalance: string) => void;
}

export const AssetsView: React.FC<AssetsViewProps> = ({
  userId,
  onBack,
  onBalanceUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'activity'>('deposit');
  const [wallet, setWallet] = useState<UserWalletData | null>(() => UnifiedWalletService.getCachedWallet(userId));
  const [networks, setNetworks] = useState<SupportedNetwork[]>(() => UnifiedWalletService.getCachedNetworks());
  const [selectedDepositNet, setSelectedDepositNet] = useState<string>('optimism');
  const [selectedWithdrawNet, setSelectedWithdrawNet] = useState<string>('optimism');
  const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(() => UnifiedWalletService.getCachedDepositAddress(userId, 'optimism'));
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'deposits' | 'withdrawals'>('all');

  // Withdrawal form state
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawQuote, setWithdrawQuote] = useState<WithdrawalQuote | null>(null);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState<boolean>(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState<string | null>(null);

  // Manual Tx Hash Tracker state
  const [manualTxHash, setManualTxHash] = useState<string>('');
  const [isTrackingTx, setIsTrackingTx] = useState<boolean>(false);
  const [trackMsg, setTrackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchronized Platform Mode State (Instant zero-delay cache + background server sync)
  const { platformMode, refreshPlatformMode } = usePlatformMode();

  // Instant local QR code generator
  useEffect(() => {
    if (depositInfo?.address) {
      QRCode.toDataURL(depositInfo.address, {
        width: 256,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Local QR Code Generation Error:', err));
    }
  }, [depositInfo?.address]);

  // Fetch / Sync wallet data in background without blocking UI
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [walletData, nets, deps, withds, depInfo] = await Promise.all([
        UnifiedWalletService.fetchWallet(userId),
        UnifiedWalletService.fetchNetworks(),
        UnifiedWalletService.fetchDeposits(userId),
        UnifiedWalletService.fetchWithdrawals(userId),
        UnifiedWalletService.fetchDepositAddress(userId, selectedDepositNet),
      ]);

      setWallet(walletData);
      setNetworks(nets);
      setDeposits(deps);
      setWithdrawals(withds);
      setDepositInfo(depInfo);
      if (onBalanceUpdate) {
        onBalanceUpdate(walletData.availableBalance);
      }
    } catch (err: any) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshPlatformMode();
    refreshData();
  }, [userId]);

  // Fetch deposit address when deposit network changes (instant from cache if available)
  useEffect(() => {
    if (!selectedDepositNet) return;

    UnifiedWalletService.fetchDepositAddress(userId, selectedDepositNet)
      .then((info) => setDepositInfo(info))
      .catch((err) => console.error('Failed to load deposit address', err));
  }, [selectedDepositNet, userId]);

  // Update withdrawal quote when amount or network changes
  useEffect(() => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      setWithdrawQuote(null);
      return;
    }

    UnifiedWalletService.quoteWithdrawal(selectedWithdrawNet, withdrawAmount)
      .then((quote) => setWithdrawQuote(quote))
      .catch(() => setWithdrawQuote(null));
  }, [selectedWithdrawNet, withdrawAmount]);

  // Copy to clipboard helper
  const handleCopy = (text: string) => {
    SoundManager.play('click');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit withdrawal handler
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawSuccessMsg(null);
    setWithdrawErrorMsg(null);

    if (!withdrawAddress.trim() || !withdrawAddress.startsWith('0x') || withdrawAddress.length !== 42) {
      setWithdrawErrorMsg('Please enter a valid 0x EVM recipient address (42 hex characters).');
      return;
    }

    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      setWithdrawErrorMsg('Please enter a valid USDT amount greater than 0.');
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      SoundManager.play('click');
      const item = await UnifiedWalletService.requestWithdrawal(
        userId,
        selectedWithdrawNet,
        withdrawAddress.trim(),
        withdrawAmount.trim()
      );
      setWithdrawSuccessMsg(`Withdrawal requested! TX ID: ${item.id.slice(0, 8)}... Status: ${item.status}`);
      setWithdrawAddress('');
      setWithdrawAmount('');
      setWithdrawQuote(null);
      await refreshData();
    } catch (err: any) {
      setWithdrawErrorMsg(err.message || 'Withdrawal request failed. Please check balance.');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Track deposit manually handler
  const handleTrackTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackMsg(null);

    if (!manualTxHash.trim() || !manualTxHash.startsWith('0x') || manualTxHash.length !== 66) {
      setTrackMsg({ type: 'error', text: 'Enter a valid 66-character EVM Transaction Hash starting with 0x.' });
      return;
    }

    setIsTrackingTx(true);
    try {
      SoundManager.play('click');
      const dep = await UnifiedWalletService.trackDeposit(userId, selectedDepositNet, manualTxHash.trim());
      setTrackMsg({
        type: 'success',
        text: `Transaction tracked! Status: ${dep.status}. ${dep.amount} USDT detected on ${dep.networkKey}.`,
      });
      setManualTxHash('');
      await refreshData();
    } catch (err: any) {
      setTrackMsg({
        type: 'error',
        text: err.message || 'Failed to detect transaction on-chain. Please ensure the TX was mined.',
      });
    } finally {
      setIsTrackingTx(false);
    }
  };

  const selectedNetObj = networks.find((n) => n.networkKey === selectedDepositNet);
  const selectedWithdrawNetObj = networks.find((n) => n.networkKey === selectedWithdrawNet);

  // Network naming helpers for clarity
  const getNetworkDisplayName = (networkKey: string, fullName?: string): string => {
    switch (networkKey.toLowerCase()) {
      case 'optimism':
        return 'Optimism';
      case 'ethereum':
        return 'Ethereum';
      case 'arbitrum':
        return 'Arbitrum';
      case 'bsc':
        return 'BNB Chain';
      case 'polygon':
        return 'Polygon';
      case 'base':
        return 'Base';
      case 'avalanche':
        return 'Avalanche';
      default:
        if (fullName) return fullName;
        return networkKey.charAt(0).toUpperCase() + networkKey.slice(1);
    }
  };

  const getNetworkFullName = (networkKey: string, fallbackName?: string): string => {
    switch (networkKey.toLowerCase()) {
      case 'optimism':
        return 'Optimism Sepolia';
      case 'ethereum':
        return 'Ethereum Sepolia';
      case 'arbitrum':
        return 'Arbitrum Sepolia';
      case 'bsc':
        return 'BNB Smart Chain Testnet';
      case 'polygon':
        return 'Polygon Amoy Testnet';
      case 'base':
        return 'Base Sepolia';
      case 'avalanche':
        return 'Avalanche Fuji';
      default:
        return fallbackName || networkKey;
    }
  };

  // Filter combined activities
  const allActivities = [
    ...deposits.map((d) => ({ ...d, type: 'DEPOSIT' as const })),
    ...withdrawals.map((w) => ({ ...w, type: 'WITHDRAWAL' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredActivities = allActivities.filter((act) => {
    if (activityFilter === 'deposits') return act.type === 'DEPOSIT';
    if (activityFilter === 'withdrawals') return act.type === 'WITHDRAWAL';
    return true;
  });

  return (
    <div className="w-full max-w-lg px-3.5 pt-2 pb-24 space-y-4 flex flex-col items-center select-none animate-fadeIn z-10">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER NAVIGATION BAR */}
      {/* ========================================================================= */}
      <div className="w-full flex items-center justify-between py-1 px-1">
        <motion.button
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            SoundManager.play('click');
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#120426]/90 border border-amber-400/40 text-amber-300 font-bold text-xs shadow-md shadow-black/40 hover:bg-[#1f0b3d] hover:border-amber-400 cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Lobby</span>
        </motion.button>

        <div className="flex items-center gap-2">
          {platformMode.cryptoWalletEnabled ? (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-400/40 px-2.5 py-1 rounded-full text-[11px] font-black text-emerald-300 uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span>7 EVM Networks Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-400/40 px-2.5 py-1 rounded-full text-[11px] font-black text-amber-300 uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]" />
              <span>UPI / Bank Gateway Active</span>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              SoundManager.play('click');
              refreshPlatformMode();
              refreshData();
            }}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-[#120426]/90 border border-amber-400/40 text-amber-300 shadow-md shadow-black/40 hover:bg-[#1f0b3d] hover:border-amber-400 cursor-pointer transition-all"
            title="Refresh Ledger Balance"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* RENDER MANUAL FIAT MODE IF CRYPTO IS DISABLED */}
      {!platformMode.cryptoWalletEnabled ? (
        <ManualFiatWalletView
          userId={userId}
          currencySymbol={platformMode.currencySymbol}
          currencyCode={platformMode.platformCurrency}
          onBalanceUpdate={onBalanceUpdate}
        />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 2. AAA HERO PORTFOLIO CARD (MATCHING LOBBY CARD ONLINE HERO & BIG REWARDS) */}
          {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(20,4,45,0.75)] border-2 border-amber-400/80 bg-[#120426] select-none flex flex-col justify-between p-4 sm:p-5"
      >
        {/* Ambient Radial Lighting & Cyber Patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-purple-950/40 to-[#0b0319] pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-400/10 to-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Shimmer sweep effect */}
        <motion.div
          className="absolute -inset-full w-[200%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
        />

        {/* Card Header */}
        <div className="relative z-10 flex items-center justify-between w-full mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.5)] border border-amber-200">
              <Wallet className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-amber-200 uppercase tracking-wider flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Unified USDT Vault
              </h2>
              <p className="text-[10.5px] font-semibold text-slate-400 tracking-wide">
                Multi-Chain Double-Entry Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full shadow-[0_2px_8px_rgba(251,191,36,0.6)] border border-yellow-200 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 fill-slate-950" />
            <span>Real Vault</span>
          </div>
        </div>

        {/* Main Balance Display */}
        <div className="relative z-10 bg-black/40 backdrop-blur-md rounded-2xl border border-amber-400/30 p-3.5 sm:p-4 my-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-widest flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              Available USDT Balance
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
              1:1 FIAT VALUE
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
              {wallet?.formattedAvailable || '$0.00'}
            </span>
            <span className="text-sm sm:text-base font-black text-amber-400 uppercase tracking-wider">
              USDT
            </span>
          </div>

          {wallet && Number(wallet.lockedBalance) > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold mt-2 pt-2 border-t border-white/10">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>In Active Match / Queued: {wallet.lockedBalance} USDT</span>
            </div>
          )}
        </div>

        {/* Multi-Chain Badges Strip */}
        <div className="relative z-10 mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Globe className="w-3 h-3 text-amber-400" />
            Chains:
          </span>
          {networks.map((net) => (
            <span
              key={net.networkKey}
              className="px-2.5 py-1 text-[10px] font-bold bg-[#1d0a3d] text-amber-200 border border-amber-400/30 rounded-xl shrink-0 shadow-sm flex items-center gap-1.5"
            >
              <NetworkLogo networkKey={net.networkKey} size="xs" />
              <span>{getNetworkDisplayName(net.networkKey, net.name)}</span>
            </span>
          ))}
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE TAB SELECTOR (MATCHING 3D LOBBY PILL RIBBONS) */}
      {/* ========================================================================= */}
      <div className="w-full flex items-center gap-2 p-1 bg-[#120426]/90 backdrop-blur-md rounded-2xl border border-amber-400/40 shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            SoundManager.play('click');
            setActiveTab('deposit');
          }}
          className={`flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'deposit'
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-[0_4px_12px_rgba(245,158,11,0.5)] border border-yellow-200'
              : 'text-slate-400 hover:text-amber-200 hover:bg-white/5'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 stroke-[2.8]" />
          <span>Deposit</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            SoundManager.play('click');
            setActiveTab('withdraw');
          }}
          className={`flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'withdraw'
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-[0_4px_12px_rgba(245,158,11,0.5)] border border-yellow-200'
              : 'text-slate-400 hover:text-amber-200 hover:bg-white/5'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 stroke-[2.8]" />
          <span>Withdraw</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            SoundManager.play('click');
            setActiveTab('activity');
          }}
          className={`flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'activity'
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-[0_4px_12px_rgba(245,158,11,0.5)] border border-yellow-200'
              : 'text-slate-400 hover:text-amber-200 hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4 stroke-[2.8]" />
          <span>Activity ({deposits.length + withdrawals.length})</span>
        </motion.button>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB CONTENTS */}
      {/* ========================================================================= */}
      <AnimatePresence mode="wait">
        
        {/* =================== TAB 1: DEPOSIT USDT =================== */}
        {activeTab === 'deposit' && (
          <motion.div
            key="deposit-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full space-y-3.5"
          >
            {/* Step 1: Select Chain Grid */}
            <div className="w-full bg-[#120426]/95 border-2 border-amber-400/60 rounded-3xl p-4 shadow-[0_12px_30px_rgba(20,4,45,0.7)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-amber-400" />
                  1. Select EVM Deposit Network
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {networks.length} Chains Available
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {networks.map((net) => {
                  const isSelected = selectedDepositNet === net.networkKey;
                  return (
                    <motion.button
                      key={net.networkKey}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        SoundManager.play('click');
                        setSelectedDepositNet(net.networkKey);
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-br from-amber-500/20 to-purple-900/50 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                          : 'bg-[#1b0a38]/80 border-white/10 text-slate-400 hover:border-amber-400/40 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <NetworkLogo networkKey={net.networkKey} size="sm" showGlow={isSelected} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black truncate text-white">
                              {getNetworkDisplayName(net.networkKey, net.name)}
                            </span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />}
                          </div>
                          <div className="flex items-center justify-between text-[9.5px] text-amber-300/80 font-mono mt-0.5">
                            <span className="truncate">{getNetworkFullName(net.networkKey, net.name).replace(' Testnet', '')}</span>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Custodial Address & QR Code */}
            {depositInfo && (
              <div className="w-full bg-[#120426]/95 border-2 border-amber-400/60 rounded-3xl p-4 sm:p-5 shadow-[0_12px_30px_rgba(20,4,45,0.7)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <NetworkLogo networkKey={selectedDepositNet} size="sm" showGlow />
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      2. Custodial Deposit Address ({getNetworkDisplayName(selectedDepositNet, selectedNetObj?.name)})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <NetworkLogo networkKey="usdt" size="xs" />
                    <span className="text-[10px] font-bold text-emerald-400">
                      Auto-Credited
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/40 rounded-2xl border border-amber-400/30 p-4">
                  {/* QR Code (Instant local generation) */}
                  <div className="p-2 bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.5)] shrink-0 border-2 border-amber-400/40 flex items-center justify-center min-w-[104px] min-h-[104px]">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="Deposit QR"
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Address Text & Copy */}
                  <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                    <div className="text-[11px] font-mono font-bold text-slate-300 break-all bg-[#1b0a38] p-2.5 rounded-xl border border-white/10 select-all">
                      {depositInfo.address}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleCopy(depositInfo.address)}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_4px_12px_rgba(245,158,11,0.4)] border border-yellow-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
                          <span>Address Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                          <span>Copy Deposit Address</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200/90 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Real Blockchain Custody Specs:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[10.5px] text-slate-300">
                    <li>Send ONLY <strong className="text-amber-300">USDT</strong> on <strong>{getNetworkFullName(selectedDepositNet, selectedNetObj?.name)}</strong>.</li>
                    <li>Min Deposit: <strong className="text-white">{depositInfo.minDeposit} USDT</strong>.</li>
                    <li>Required Confirmations: <strong className="text-white">{depositInfo.requiredConfirmations} blocks</strong>.</li>
                  </ul>
                </div>

                {/* Manual Tx Hash Verification / Faucet Tracker */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <Search className="w-3.5 h-3.5 text-amber-400" />
                      Pasted Faucet Tx Hash (Immediate Sync)
                    </span>
                  </div>

                  <form onSubmit={handleTrackTxSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="0x... (66-char transaction hash)"
                      value={manualTxHash}
                      onChange={(e) => setManualTxHash(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs font-mono bg-black/50 border border-amber-400/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={isTrackingTx || !manualTxHash}
                      className="px-3.5 py-2 bg-[#1f0b3d] hover:bg-[#2c1056] border border-amber-400/60 text-amber-300 font-black text-xs rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isTrackingTx ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Verify</span>
                    </motion.button>
                  </form>

                  {trackMsg && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-medium ${
                        trackMsg.type === 'success'
                          ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                          : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                      }`}
                    >
                      {trackMsg.text}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* =================== TAB 2: WITHDRAW USDT =================== */}
        {activeTab === 'withdraw' && (
          <motion.div
            key="withdraw-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full space-y-3.5"
          >
            <div className="w-full bg-[#120426]/95 border-2 border-amber-400/60 rounded-3xl p-4 sm:p-5 shadow-[0_12px_30px_rgba(20,4,45,0.7)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-amber-400" />
                  Instant On-Chain Withdrawal
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Available: {wallet?.formattedAvailable || '$0.00'} USDT
                </span>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                {/* Network Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Destination Network
                    </label>
                    <div className="flex items-center gap-1.5">
                      <NetworkLogo networkKey={selectedWithdrawNet} size="xs" showGlow />
                      <span className="text-[10px] font-bold text-amber-400 font-mono">
                        {getNetworkDisplayName(selectedWithdrawNet)}
                      </span>
                    </div>
                  </div>
                  <select
                    value={selectedWithdrawNet}
                    onChange={(e) => setSelectedWithdrawNet(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-bold bg-black/60 border border-amber-400/40 rounded-xl text-amber-200 focus:outline-none focus:border-amber-400"
                  >
                    {networks.map((net) => (
                      <option key={net.networkKey} value={net.networkKey} className="bg-[#120426] text-white">
                        {getNetworkFullName(net.networkKey, net.name)} (Min: {net.minWithdrawalUsdt} USDT • Fee: {net.withdrawalFeeUsdt} USDT)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recipient Address */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Recipient Address (0x EVM)
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-mono bg-black/60 border border-amber-400/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Amount with Quick Chips */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Withdrawal Amount (USDT)
                    </label>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(wallet?.availableBalance || '0')}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 uppercase cursor-pointer"
                    >
                      Use Max ({wallet?.availableBalance || '0'})
                    </button>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm font-black bg-black/60 border border-amber-400/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-16"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-black text-amber-400">
                      USDT
                    </span>
                  </div>

                  {/* Preset Amount Chips */}
                  <div className="flex gap-1.5 mt-2">
                    {['10', '25', '50', '100'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWithdrawAmount(preset)}
                        className="flex-1 py-1 rounded-lg bg-[#1b0a38] hover:bg-[#280f54] border border-amber-400/30 text-amber-300 font-bold text-[10.5px] cursor-pointer"
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fee Breakdown Quote */}
                {withdrawQuote && (
                  <div className="p-3 rounded-2xl bg-black/40 border border-amber-400/30 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Network Gas & Gateway Fee:</span>
                      <span className="font-mono text-amber-300 font-bold">{withdrawQuote.feeAmount} USDT</span>
                    </div>
                    <div className="flex justify-between text-white font-black pt-1 border-t border-white/10">
                      <span>Net Amount to Receive:</span>
                      <span className="font-mono text-emerald-400 text-sm font-black">{withdrawQuote.netAmount} USDT</span>
                    </div>
                  </div>
                )}

                {/* Messages */}
                {withdrawErrorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{withdrawErrorMsg}</span>
                  </div>
                )}
                {withdrawSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{withdrawSuccessMsg}</span>
                  </div>
                )}

                {/* Submit Action Button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmittingWithdraw}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_6px_20px_rgba(245,158,11,0.5)] border border-yellow-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingWithdraw ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Broadcasting On-Chain...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                      <span>Confirm & Broadcast Withdrawal</span>
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}

        {/* =================== TAB 3: ACTIVITY / HISTORY =================== */}
        {activeTab === 'activity' && (
          <motion.div
            key="activity-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full space-y-3"
          >
            {/* Filter Buttons */}
            <div className="flex gap-2">
              {(['all', 'deposits', 'withdrawals'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                    activityFilter === filter
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                      : 'bg-[#120426]/80 text-slate-400 border border-white/10 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-2.5">
              {filteredActivities.length === 0 ? (
                <div className="w-full bg-[#120426]/90 border border-amber-400/40 rounded-3xl p-8 text-center space-y-2">
                  <Layers className="w-8 h-8 text-amber-400/60 mx-auto" />
                  <p className="text-xs font-bold text-slate-300">No on-chain ledger records yet.</p>
                  <p className="text-[11px] text-slate-500">Deposit or withdraw USDT to view live tracking.</p>
                </div>
              ) : (
                filteredActivities.map((item, idx) => {
                  const isDep = item.type === 'DEPOSIT';
                  return (
                    <div
                      key={`act-${item.type}-${item.id || idx}`}
                      className="w-full bg-[#120426]/95 border border-amber-400/40 rounded-2xl p-3.5 shadow-md shadow-black/50 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
                            isDep
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}
                        >
                          {isDep ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">
                              {isDep ? 'Deposit' : 'Withdrawal'}
                            </span>
                            <span
                              className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md ${
                                item.status === 'CONFIRMED'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                  : item.status === 'FAILED' || item.status === 'REJECTED'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                            <NetworkLogo networkKey={item.networkKey} size="xs" />
                            <span>{getNetworkFullName(item.networkKey)} • {new Date(item.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-sm font-black font-mono ${
                            isDep ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {isDep ? '+' : '-'}{item.amount} USDT
                        </span>
                        {item.explorerUrl && (
                          <a
                            href={item.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center justify-end gap-1 mt-0.5"
                          >
                            <span>Explorer</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
};
