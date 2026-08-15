import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  Copy,
  TrendingUp,
  RefreshCw,
  Coins,
  QrCode,
  Zap,
  Check,
  Wallet,
  Ticket,
  Gift,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import confetti from 'canvas-confetti';

interface EvmWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onAddFunds: (amount: number) => void;
  onDeductFunds?: (amount: number) => void;
}

export type EvmNetwork = 'polygon' | 'bsc' | 'arbitrum' | 'ethereum';

interface NetworkOption {
  id: EvmNetwork;
  name: string;
  badge: string;
  gas: string;
}

const NETWORKS: NetworkOption[] = [
  { id: 'polygon', name: 'Polygon', badge: 'Recommended', gas: 'Zero Fee' },
  { id: 'bsc', name: 'BNB Chain', badge: 'Fast', gas: '< $0.01' },
  { id: 'arbitrum', name: 'Arbitrum', badge: 'L2', gas: '< $0.01' },
  { id: 'ethereum', name: 'Ethereum', badge: 'Mainnet', gas: '~ $1.00' },
];

const DUMMY_WALLET_ADDRESS = '0x71C83908F38644B9b0057F71A6996f0f5b4E3E49';

interface TransactionItem {
  id: string;
  type: 'deposit' | 'win_payout' | 'entry_fee' | 'withdrawal';
  title: string;
  amount: number;
  currency: string;
  time: string;
  txHash: string;
}

const INITIAL_TRANSACTIONS: TransactionItem[] = [
  {
    id: 'tx-1',
    type: 'win_payout',
    title: 'Match Win - Ludo Supreme 🏆',
    amount: 15.0,
    currency: 'USDT',
    time: '10 mins ago',
    txHash: '0x8f2a...c4e1',
  },
  {
    id: 'tx-2',
    type: 'deposit',
    title: 'Deposit USDT Added',
    amount: 50.0,
    currency: 'USDT',
    time: '2 hours ago',
    txHash: '0x3d91...99a2',
  },
  {
    id: 'tx-3',
    type: 'entry_fee',
    title: 'Mega Tournament Ticket',
    amount: -5.0,
    currency: 'USDT',
    time: 'Yesterday',
    txHash: '0x1b77...22e4',
  },
  {
    id: 'tx-4',
    type: 'withdrawal',
    title: 'Instant Payout to Wallet',
    amount: -20.0,
    currency: 'USDT',
    time: '2 days ago',
    txHash: '0x6e44...88f0',
  },
];

export const EvmWalletModal: React.FC<EvmWalletModalProps> = ({
  isOpen,
  onClose,
  balance,
  onAddFunds,
  onDeductFunds,
}) => {
  const [activeView, setActiveView] = useState<'portfolio' | 'deposit' | 'withdraw'>('portfolio');
  const [selectedNetwork, setSelectedNetwork] = useState<EvmNetwork>('polygon');
  const [customDeposit, setCustomDeposit] = useState<number>(25);
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TRANSACTIONS);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    SoundManager.play('click');
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleQuickDeposit = (amount: number) => {
    setIsProcessing(true);
    SoundManager.play('click');

    setTimeout(() => {
      onAddFunds(amount);
      SoundManager.play('pawn-finish');
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#34d399', '#f59e0b'],
      });

      const newTx: TransactionItem = {
        id: `tx-${Date.now()}`,
        type: 'deposit',
        title: `Added ${amount} USDT (${selectedNetwork.toUpperCase()})`,
        amount: amount,
        currency: 'USDT',
        time: 'Just now',
        txHash: `0x${Math.random().toString(16).substring(2, 8)}...`,
      };
      setTransactions((prev) => [newTx, ...prev]);
      setStatusMessage({
        text: `Successfully added +${amount.toFixed(2)} USDT to your assets!`,
        type: 'success',
      });
      setIsProcessing(false);
      setActiveView('portfolio');
      setTimeout(() => setStatusMessage(null), 3500);
    }, 800);
  };

  const handleWithdraw = () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setStatusMessage({ text: 'Please enter a valid amount to withdraw.', type: 'error' });
      return;
    }
    if (amt > balance) {
      setStatusMessage({ text: 'Insufficient USDT balance.', type: 'error' });
      return;
    }
    if (!withdrawAddress.trim() || !withdrawAddress.startsWith('0x') || withdrawAddress.length < 10) {
      setStatusMessage({ text: 'Please enter a valid recipient 0x address.', type: 'error' });
      return;
    }

    setIsProcessing(true);
    SoundManager.play('click');

    setTimeout(() => {
      if (onDeductFunds) {
        onDeductFunds(amt);
      } else {
        onAddFunds(-amt);
      }
      SoundManager.play('pawn-finish');
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
      });

      const newTx: TransactionItem = {
        id: `tx-${Date.now()}`,
        type: 'withdrawal',
        title: `Withdrawal to ${withdrawAddress.substring(0, 6)}...`,
        amount: -amt,
        currency: 'USDT',
        time: 'Just now',
        txHash: `0x${Math.random().toString(16).substring(2, 8)}...`,
      };
      setTransactions((prev) => [newTx, ...prev]);
      setStatusMessage({
        text: `Payout sent! ${amt.toFixed(2)} USDT on the way to your wallet.`,
        type: 'success',
      });
      setWithdrawAmount('');
      setIsProcessing(false);
      setActiveView('portfolio');
      setTimeout(() => setStatusMessage(null), 4000);
    }, 1000);
  };

  // Sparkline Chart Points for Visual Animation
  const sparklineData = [35, 42, 38, 55, 48, 62, 58, 75, balance > 0 ? balance + 40 : 60];
  const maxVal = Math.max(...sparklineData);
  const minVal = Math.min(...sparklineData);
  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * 260;
      const y = 50 - ((val - minVal) / (maxVal - minVal || 1)) * 40;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] text-slate-800 p-5 sm:p-6"
        >
          {/* 1. TOP HEADER: Clean Navigation & Close Button */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 font-black text-lg">
                ₮
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  My Assets
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">Decentralized Game Portfolio</p>
              </div>
            </div>

            <button
              onClick={() => {
                SoundManager.play('click');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Message Alert */}
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage.text}</span>
            </motion.div>
          )}

          {/* 2. BEAUTIFULLY ANIMATED PORTFOLIO HERO CARD */}
          <div className="mt-4 p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white shadow-xl relative overflow-hidden">
            {/* Animated Ambient Glow Spheres */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"
            />
            <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-teal-500/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Total Balance
                </span>

                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                    ₮{balance.toFixed(2)}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-400">USDT</span>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-300">≈ ${balance.toFixed(2)} USD</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +14.8% Wins
                  </span>
                </div>
              </div>

              {/* Quick Network Pill */}
              <div className="text-right">
                <span className="inline-block text-[10px] font-black px-2.5 py-1 rounded-full bg-white/10 text-emerald-300 border border-white/15 backdrop-blur-md">
                  Polygon PoS
                </span>
                <span className="block text-[9px] text-slate-400 mt-1">Gasless Paymaster</span>
              </div>
            </div>

            {/* Smooth Animated Mini Sparkline Trend Line */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] text-slate-300 font-medium">Performance Trend</span>
              <svg className="w-36 h-8 overflow-visible" viewBox="0 0 260 60">
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <motion.polyline
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                  fill="none"
                  stroke="url(#chartGlow)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
              </svg>
            </div>
          </div>

          {/* 3. CLEAN 2-BUTTON MAIN ACTION BAR (Deposit & Withdraw) */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                SoundManager.play('click');
                setActiveView('deposit');
              }}
              className={`py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                activeView === 'deposit'
                  ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              <span>Deposit USDT</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                SoundManager.play('click');
                setActiveView('withdraw');
              }}
              className={`py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                activeView === 'withdraw'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-slate-600 stroke-[2.5]" />
              <span>Withdraw</span>
            </motion.button>
          </div>

          {/* 4. ASSET HOLDING BREAKDOWN CARDS */}
          {activeView === 'portfolio' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="mt-4 space-y-3"
            >
              {/* Asset Allocation Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-slate-800">
                  <span>Holdings</span>
                  <span className="text-[11px] text-slate-400 font-normal">3 Asset Types</span>
                </div>

                {/* 1. Tether USDT */}
                <div className="flex items-center justify-between py-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
                      ₮
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">Tether USDT</span>
                      <span className="text-[10px] text-slate-400">Available for game stakes</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">₮{balance.toFixed(2)}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">100% Liquid</span>
                  </div>
                </div>

                {/* 2. Tournament Tickets */}
                <div className="flex items-center justify-between py-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">Tournament Passes</span>
                      <span className="text-[10px] text-slate-400">Mega $50K Access</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">2 Tickets</span>
                    <span className="text-[10px] text-amber-600 font-bold">Worth $10.00</span>
                  </div>
                </div>

                {/* 3. Welcome Bonus Credits */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">Bonus Play Credits</span>
                      <span className="text-[10px] text-slate-400">Daily Login Reward</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">$5.00</span>
                    <span className="text-[10px] text-purple-600 font-bold">Free Entry</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity List */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-900">Recent Transactions</span>
                  <span className="text-[10px] text-slate-400">Instant Settlement</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {transactions.slice(0, 3).map((tx) => (
                    <div key={tx.id} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            tx.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tx.amount > 0 ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block text-[11px]">{tx.title}</span>
                          <span className="text-[9px] text-slate-400">{tx.time}</span>
                        </div>
                      </div>
                      <span
                        className={`font-black text-xs ${
                          tx.amount > 0 ? 'text-emerald-600' : 'text-slate-700'
                        }`}
                      >
                        {tx.amount > 0 ? `+₮${tx.amount.toFixed(2)}` : `-₮${Math.abs(tx.amount).toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW B: EASY 1-TAP DEPOSIT */}
          {activeView === 'deposit' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-3"
            >
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">Choose Deposit Amount</span>
                  <button
                    onClick={() => setActiveView('portfolio')}
                    className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Back
                  </button>
                </div>

                {/* Quick 1-Tap Preset Amounts */}
                <div className="grid grid-cols-3 gap-2">
                  {[10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        SoundManager.play('click');
                        setCustomDeposit(amt);
                      }}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center ${
                        customDeposit === amt
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-sm font-black">+₮{amt}</span>
                      <span className="text-[9px] opacity-80">{amt === 25 ? 'Popular' : 'USDT'}</span>
                    </button>
                  ))}
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={isProcessing}
                  onClick={() => handleQuickDeposit(customDeposit)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 hover:brightness-105 transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Coins className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span>Deposit ₮{customDeposit} USDT Now</span>
                </motion.button>
              </div>

              {/* Scan & Send QR Option */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Wallet Deposit Address</span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {DUMMY_WALLET_ADDRESS.substring(0, 10)}...{DUMMY_WALLET_ADDRESS.substring(DUMMY_WALLET_ADDRESS.length - 6)}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(DUMMY_WALLET_ADDRESS)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* VIEW C: INSTANT WITHDRAWAL */}
          {activeView === 'withdraw' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-3"
            >
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">Instant USDT Withdrawal</span>
                  <button
                    onClick={() => setActiveView('portfolio')}
                    className="text-[11px] font-bold text-slate-600 hover:underline cursor-pointer"
                  >
                    Back
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Your EVM / Crypto Wallet Address (0x...)
                  </label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="0x71C83908F38644B9b..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px]">
                    <label className="font-bold text-slate-600">Amount to Withdraw</label>
                    <span className="text-slate-400">
                      Available: <strong className="text-emerald-600 font-black">₮{balance.toFixed(2)}</strong>
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 pr-14 rounded-xl bg-white border border-slate-200 text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => setWithdrawAmount(balance.toString())}
                      className="absolute right-2 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-extrabold hover:bg-emerald-100 cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={isProcessing}
                  onClick={handleWithdraw}
                  className="w-full py-3 rounded-xl bg-slate-900 text-white font-black text-sm shadow-md shadow-slate-900/20 flex items-center justify-center gap-2 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                  )}
                  <span>Confirm Payout to Wallet</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* 5. FOOTER TRUST & SECURITY */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Non-Custodial EVM Escrow
            </span>
            <span className="text-slate-500 font-semibold">Instant Settlement • 0% Fee</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
