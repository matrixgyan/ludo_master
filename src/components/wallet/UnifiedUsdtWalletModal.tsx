import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
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
} from 'lucide-react';
import {
  UnifiedWalletService,
  UserWalletData,
  SupportedNetwork,
  DepositInfo,
  DepositItem,
  WithdrawalItem,
  WithdrawalQuote,
} from '../../services/unifiedWalletService';

interface UnifiedUsdtWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onBalanceUpdate?: (newBalance: string) => void;
}

export const UnifiedUsdtWalletModal: React.FC<UnifiedUsdtWalletModalProps> = ({
  isOpen,
  onClose,
  userId,
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

  // Local QR code generation
  useEffect(() => {
    if (depositInfo?.address) {
      QRCode.toDataURL(depositInfo.address, {
        width: 256,
        margin: 1,
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [depositInfo?.address]);

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
  const [trackMsg, setTrackMsg] = useState<string | null>(null);

  // Fetch initial wallet data
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [walletData, nets, deps, withds] = await Promise.all([
        UnifiedWalletService.fetchWallet(userId),
        UnifiedWalletService.fetchNetworks(),
        UnifiedWalletService.fetchDeposits(userId),
        UnifiedWalletService.fetchWithdrawals(userId),
      ]);

      setWallet(walletData);
      setNetworks(nets);
      setDeposits(deps);
      setWithdrawals(withds);
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
    if (isOpen) {
      refreshData();
    }
  }, [isOpen, userId]);

  // Fetch deposit address when deposit network changes
  useEffect(() => {
    if (!isOpen || !selectedDepositNet) return;

    UnifiedWalletService.fetchDepositAddress(userId, selectedDepositNet)
      .then((info) => setDepositInfo(info))
      .catch((err) => console.error('Failed to load deposit address', err));
  }, [isOpen, selectedDepositNet, userId]);

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
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit withdrawal
  const handleExecuteWithdrawal = async () => {
    if (!withdrawAddress.trim() || !withdrawAmount.trim()) {
      setWithdrawErrorMsg('Please enter a valid destination address and amount');
      return;
    }

    setIsSubmittingWithdraw(true);
    setWithdrawErrorMsg(null);
    setWithdrawSuccessMsg(null);

    try {
      const res = await UnifiedWalletService.requestWithdrawal(
        userId,
        selectedWithdrawNet,
        withdrawAddress.trim(),
        withdrawAmount.trim()
      );
      setWithdrawSuccessMsg(`Withdrawal ${res.id} queued successfully! Broadcasting to blockchain.`);
      setWithdrawAddress('');
      setWithdrawAmount('');
      refreshData();
    } catch (err: any) {
      setWithdrawErrorMsg(err.message || 'Withdrawal failed');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Track deposit helper
  const handleTrackTx = async () => {
    if (!manualTxHash.trim()) return;
    setIsTrackingTx(true);
    setTrackMsg(null);
    try {
      await UnifiedWalletService.trackDeposit(userId, selectedDepositNet, manualTxHash.trim());
      setTrackMsg('Transaction detected! Polling blockchain confirmations...');
      setManualTxHash('');
      refreshData();
    } catch (err: any) {
      setTrackMsg(`Notice: ${err.message}`);
    } finally {
      setIsTrackingTx(false);
    }
  };

  if (!isOpen) return null;

  const currentDepositNetwork = networks.find((n) => n.networkKey === selectedDepositNet);
  const currentWithdrawNetwork = networks.find((n) => n.networkKey === selectedWithdrawNet);

  return (
    <div id="unified-wallet-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">Unified USDT Vault</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 rounded-full">
                  TESTNET MODE
                </span>
              </div>
              <p className="text-xs text-slate-400">7 EVM Networks • Unified Multi-Chain Liquidity</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-wallet-btn"
              onClick={refreshData}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
              title="Refresh Balance"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              id="close-wallet-modal-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* UNIFIED PORTFOLIO CARD */}
        <div className="p-6 pb-2">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-850 to-slate-900 border border-slate-700/80 p-5 shadow-xl">
            {/* Cyber glow background */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Unified Available Balance
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {wallet?.formattedAvailable || '$0.00'}
                  </span>
                  <span className="text-sm font-semibold text-emerald-400">USDT</span>
                </div>
                {wallet && Number(wallet.lockedBalance) > 0 && (
                  <p className="text-xs text-amber-400/90 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Locked in active withdrawal/games: {wallet.lockedBalance} USDT
                  </p>
                )}
              </div>

              {/* Supported Network Badges */}
              <div className="flex flex-wrap gap-1.5 max-w-xs justify-start sm:justify-end">
                {networks.map((net) => {
                  const displayName =
                    net.networkKey === 'optimism'
                      ? 'Optimism'
                      : net.networkKey === 'bsc'
                      ? 'BNB Chain'
                      : net.networkKey === 'ethereum'
                      ? 'Ethereum'
                      : net.networkKey === 'arbitrum'
                      ? 'Arbitrum'
                      : net.networkKey === 'polygon'
                      ? 'Polygon'
                      : net.networkKey === 'base'
                      ? 'Base'
                      : net.networkKey === 'avalanche'
                      ? 'Avalanche'
                      : net.name.split(' ')[0];

                  return (
                    <span
                      key={net.networkKey}
                      className="px-2 py-0.5 text-[10px] font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60 rounded-md"
                    >
                      {displayName}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* TAB CONTROLS */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800">
          <button
            id="tab-deposit-btn"
            onClick={() => setActiveTab('deposit')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 ${
              activeTab === 'deposit'
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Deposit USDT
          </button>
          <button
            id="tab-withdraw-btn"
            onClick={() => setActiveTab('withdraw')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 ${
              activeTab === 'withdraw'
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Withdraw USDT
          </button>
          <button
            id="tab-activity-btn"
            onClick={() => setActiveTab('activity')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 ${
              activeTab === 'activity'
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Activity ({deposits.length + withdrawals.length})
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">

          {/* TAB 1: DEPOSIT */}
          {activeTab === 'deposit' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Network Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Select Deposit Network (7 EVM Chains)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {networks.map((net) => {
                    const isSelected = selectedDepositNet === net.networkKey;
                    return (
                      <button
                        key={net.networkKey}
                        onClick={() => setSelectedDepositNet(net.networkKey)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500/80 text-white shadow-md shadow-emerald-500/10'
                            : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-xs font-bold truncate">{net.name}</span>
                        <span className="text-[10px] text-slate-500 mt-1">Chain ID {net.chainId}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Deposit Address Box */}
              {depositInfo ? (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* QR Code */}
                    <div className="p-2 bg-white rounded-xl shadow-md shrink-0 flex items-center justify-center min-w-[112px] min-h-[112px]">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Deposit QR"
                          className="w-28 h-28 rounded-lg"
                        />
                      ) : (
                        <div className="w-28 h-28 flex items-center justify-center">
                          <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Your Custodial Deposit Address</span>
                        <span className="text-[11px] text-emerald-400 font-medium">Auto-credited to Unified Balance</span>
                      </div>

                      <div className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-700/80 rounded-xl">
                        <span className="text-xs font-mono text-slate-200 truncate flex-1 select-all">
                          {depositInfo.address}
                        </span>
                        <button
                          id="copy-deposit-address-btn"
                          onClick={() => handleCopy(depositInfo.address)}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                          title="Copy Address"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                        <div>
                          <span className="text-slate-500">Min Deposit:</span>{' '}
                          <span className="font-semibold text-slate-300">{depositInfo.minDeposit}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Confirmations:</span>{' '}
                          <span className="font-semibold text-slate-300">{depositInfo.requiredConfirmations} Blocks</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contract Info Banner */}
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                      <Info className="w-3.5 h-3.5 text-teal-400" />
                      Official {currentDepositNetwork?.name} USDT Contract:
                    </div>
                    <p className="font-mono text-[11px] text-slate-400 break-all select-all">
                      {depositInfo.usdtContractAddress}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">Loading deposit details...</div>
              )}

              {/* Manual Tx Hash Fast-Track Tool */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-emerald-400" />
                  Have a Testnet Deposit Transaction Hash?
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste 0x... transaction hash to track"
                    value={manualTxHash}
                    onChange={(e) => setManualTxHash(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleTrackTx}
                    disabled={isTrackingTx || !manualTxHash.trim()}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition shrink-0"
                  >
                    {isTrackingTx ? 'Tracking...' : 'Track'}
                  </button>
                </div>
                {trackMsg && <p className="text-xs text-emerald-400">{trackMsg}</p>}
              </div>
            </div>
          )}

          {/* TAB 2: WITHDRAW */}
          {activeTab === 'withdraw' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Network Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Select Payout Network (Withdraw to ANY of the 7 chains)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {networks.map((net) => {
                    const isSelected = selectedWithdrawNet === net.networkKey;
                    return (
                      <button
                        key={net.networkKey}
                        onClick={() => setSelectedWithdrawNet(net.networkKey)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500/80 text-white shadow-md shadow-emerald-500/10'
                            : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-xs font-bold truncate">{net.name}</span>
                        <span className="text-[10px] text-slate-500 mt-1">Fee: {net.withdrawalFeeUsdt} USDT</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Destination Address Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Recipient EVM Address ({currentWithdrawNetwork?.name})
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    USDT Amount
                  </label>
                  <span className="text-xs text-slate-400">
                    Available: <span className="font-semibold text-slate-200">{wallet?.availableBalance || '0.00'} USDT</span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 pr-16"
                  />
                  <button
                    onClick={() => setWithdrawAmount(wallet?.availableBalance || '0')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 rounded-lg transition"
                  >
                    MAX
                  </button>
                </div>

                {/* Quick Chips */}
                <div className="flex gap-2 mt-2">
                  {['5', '10', '25', '50', '100'].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setWithdrawAmount(chip)}
                      className="px-2.5 py-1 text-xs bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition"
                    >
                      ${chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Fee Breakdown */}
              {withdrawQuote && (
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Requested Amount:</span>
                    <span className="font-semibold text-slate-200">{withdrawQuote.amount} USDT</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Network Relayer Fee:</span>
                    <span className="font-semibold text-slate-200">-{withdrawQuote.feeAmount} USDT</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between text-emerald-400 font-bold text-sm">
                    <span>Net Receive on Destination:</span>
                    <span>{withdrawQuote.netAmount} USDT</span>
                  </div>
                </div>
              )}

              {/* Messages */}
              {withdrawSuccessMsg && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  {withdrawSuccessMsg}
                </div>
              )}
              {withdrawErrorMsg && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  {withdrawErrorMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                id="execute-withdraw-btn"
                onClick={handleExecuteWithdrawal}
                disabled={isSubmittingWithdraw || !withdrawQuote?.isExecutable}
                className="w-full py-3 text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 disabled:opacity-40 rounded-xl transition shadow-lg shadow-emerald-500/20"
              >
                {isSubmittingWithdraw ? 'Broadcasting to Blockchain...' : 'Confirm & Broadcast Withdrawal'}
              </button>
            </div>
          )}

          {/* TAB 3: ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Unified Ledger Activity
              </h3>

              {deposits.length === 0 && withdrawals.length === 0 ? (
                <div className="p-10 text-center text-slate-500 text-sm">
                  No transaction activity yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Deposits */}
                  {deposits.map((dep) => (
                    <div
                      key={dep.id}
                      className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <ArrowDownLeft className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">Deposit USDT</span>
                            <span className="text-[10px] text-slate-400 font-medium capitalize">
                              • {dep.networkKey}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-[180px] sm:max-w-xs">
                            {dep.txHash}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-400">+{dep.amount} USDT</div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 justify-end">
                          <span className={dep.status === 'CONFIRMED' ? 'text-emerald-400' : 'text-amber-400'}>
                            {dep.status} ({dep.confirmations}/{dep.requiredConfirmations})
                          </span>
                          <a
                            href={dep.explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-slate-300"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Withdrawals */}
                  {withdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">Withdraw USDT</span>
                            <span className="text-[10px] text-slate-400 font-medium capitalize">
                              • {w.networkKey}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-[180px] sm:max-w-xs">
                            {w.destinationAddress}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-rose-400">-{w.amount} USDT</div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 justify-end">
                          <span
                            className={
                              w.status === 'CONFIRMED'
                                ? 'text-emerald-400'
                                : w.status === 'FAILED'
                                ? 'text-rose-400'
                                : 'text-amber-400'
                            }
                          >
                            {w.status}
                          </span>
                          {w.explorerUrl && (
                            <a
                              href={w.explorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-slate-300"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
