import React, { useState, useEffect } from 'react';
import { saveLocalPlatformMode } from '../../../hooks/usePlatformMode';
import {
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Globe,
  HelpCircle,
  ExternalLink,
  Save,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Activity,
  Layers,
  ArrowRight,
  Info,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface NetworkRpcDetail {
  networkKey: string;
  name: string;
  chainId: number;
  env: 'mainnet' | 'testnet';
  currentActiveRpc: string;
  rpcUrls: string[];
  customRpcUrls: string[];
  nativeGasSymbol: string;
  explorerUrl: string;
  usdtContractAddress: string;
  usdtDecimals: number;
  requiredConfirmations: number;
  minDepositUsdt: string;
  minWithdrawalUsdt: string;
  withdrawalFeeUsdt: string;
  isDepositEnabled: boolean;
  isWithdrawalEnabled: boolean;
  isEnabled: boolean;
  status: 'healthy' | 'degraded' | 'error' | 'untested';
  latencyMs?: number;
  blockNumber?: number;
  lastTestedAt?: string;
  errorMessage?: string;
}

interface RpcManagementTabProps {
  token: string;
}

// Recommended Top Tier Providers Guide where admins can get instant free & dedicated high-performance RPCs
const RECOMMENDED_RPC_PROVIDERS = [
  {
    name: 'Alchemy',
    website: 'https://dashboard.alchemy.com',
    description: 'Enterprise Ethereum, Polygon, Arbitrum, Optimism, Base, Solana. Generous 300M monthly compute units free tier.',
    chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base', 'Solana'],
    tier: 'Recommended (#1 Enterprise)',
    color: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/30 text-cyan-400',
  },
  {
    name: 'Infura (ConsenSys)',
    website: 'https://app.infura.io',
    description: 'Direct ConsenSys official RPC network. High-uptime Ethereum, Polygon, Arbitrum, Avalanche, Optimism endpoints.',
    chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Avalanche', 'Optimism', 'Base'],
    tier: 'ConsenSys Standard',
    color: 'from-amber-500/20 to-orange-600/20 border-amber-500/30 text-amber-400',
  },
  {
    name: 'QuickNode',
    website: 'https://www.quicknode.com',
    description: 'Ultra-low latency global node network supporting all 7 chains including BSC and Avalanche with 1-click test endpoints.',
    chains: ['Ethereum', 'BSC', 'Polygon', 'Arbitrum', 'Avalanche', 'Optimism', 'Base', 'Solana'],
    tier: 'Multi-Chain Superfast',
    color: 'from-purple-500/20 to-indigo-600/20 border-purple-500/30 text-purple-400',
  },
  {
    name: 'Ankr RPC',
    website: 'https://www.ankr.com/rpc',
    description: 'Decentralized RPC endpoints across BNB Chain, Polygon, Arbitrum, Ethereum with free public & premium tiers.',
    chains: ['BSC', 'Polygon', 'Ethereum', 'Avalanche', 'Arbitrum'],
    tier: 'BNB & EVM Ready',
    color: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/30 text-emerald-400',
  },
  {
    name: 'PublicNode / LlamaNodes',
    website: 'https://chainlist.org',
    description: 'Chainlist.org curates verified public fallback RPC URLs tested for high uptime with no account or sign-up needed.',
    chains: ['All 7 Networks'],
    tier: 'Zero-Config Instant',
    color: 'from-slate-500/20 to-slate-700/20 border-slate-500/30 text-slate-300',
  },
];

export const RpcManagementTab: React.FC<RpcManagementTabProps> = ({ token }) => {
  const [networks, setNetworks] = useState<NetworkRpcDetail[]>([]);
  const [currentEnv, setCurrentEnv] = useState<'mainnet' | 'testnet'>('mainnet');
  const [isLoading, setIsLoading] = useState(true);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Per-network editable forms
  const [editingForms, setEditingForms] = useState<Record<string, {
    primaryRpc: string;
    fallbacks: string;
    usdtContract: string;
    requiredConfirmations: number;
    minDeposit: string;
    minWithdrawal: string;
    withdrawalFee: string;
    isDepositEnabled: boolean;
    isWithdrawalEnabled: boolean;
    isEnabled: boolean;
  }>>({});

  // Expanded network cards
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const fetchNetworks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/rpc/networks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.networks)) {
        setNetworks(data.networks);
        setCurrentEnv(data.currentEnv);

        // Initialize edit forms
        const forms: Record<string, any> = {};
        const openMap: Record<string, boolean> = {};
        data.networks.forEach((n: NetworkRpcDetail, idx: number) => {
          forms[n.networkKey] = {
            primaryRpc: n.customRpcUrls[0] || n.currentActiveRpc || '',
            fallbacks: n.customRpcUrls.slice(1).join('\n'),
            usdtContract: n.usdtContractAddress || '',
            requiredConfirmations: n.requiredConfirmations,
            minDeposit: n.minDepositUsdt,
            minWithdrawal: n.minWithdrawalUsdt,
            withdrawalFee: n.withdrawalFeeUsdt,
            isDepositEnabled: n.isDepositEnabled,
            isWithdrawalEnabled: n.isWithdrawalEnabled,
            isEnabled: n.isEnabled,
          };
          if (idx === 0) openMap[n.networkKey] = true;
        });
        setEditingForms(forms);
        setExpandedCards((prev) => (Object.keys(prev).length === 0 ? openMap : prev));
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  // Master Platform Mode and Currency State
  const [platformSettings, setPlatformSettings] = useState<{
    cryptoWalletEnabled: boolean;
    paymentMode: 'CRYPTO' | 'MANUAL';
    platformCurrency: string;
    currencySymbol: string;
    currencyName: string;
    exchangeRateToUsdt: number;
  }>({
    cryptoWalletEnabled: true,
    paymentMode: 'CRYPTO',
    platformCurrency: 'INR',
    currencySymbol: '₹',
    currencyName: 'Indian Rupee',
    exchangeRateToUsdt: 89.5,
  });
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);
  const [modeNotice, setModeNotice] = useState<string | null>(null);

  const fetchPlatformSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.settings) {
        setPlatformSettings({
          cryptoWalletEnabled: data.settings.cryptoWalletEnabled ?? true,
          paymentMode: data.settings.paymentMode || (data.settings.cryptoWalletEnabled ? 'CRYPTO' : 'MANUAL'),
          platformCurrency: data.settings.platformCurrency || 'INR',
          currencySymbol: data.settings.currencySymbol || '₹',
          currencyName: data.settings.currencyName || 'Indian Rupee',
          exchangeRateToUsdt: data.settings.exchangeRateToUsdt || 89.5,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleToggleCryptoWallet = async (enabled: boolean) => {
    setIsUpdatingMode(true);
    setModeNotice(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cryptoWalletEnabled: enabled,
        }),
      });
      const data = await res.json();
      if (data.success && data.settings) {
        saveLocalPlatformMode({
          cryptoWalletEnabled: enabled,
          paymentMode: enabled ? 'CRYPTO' : 'MANUAL',
        });
        setPlatformSettings((prev) => ({
          ...prev,
          cryptoWalletEnabled: enabled,
          paymentMode: enabled ? 'CRYPTO' : 'MANUAL',
        }));
        setModeNotice(
          enabled
            ? 'Crypto Wallet System & Smart Contracts ENABLED! Users will interact with Web3 multi-chain wallet.'
            : 'Crypto Wallet DISABLED! Platform switched to Manual Fiat Payment Mode (UPI / Bank / UTR).'
        );
        setTimeout(() => setModeNotice(null), 5000);
      }
    } catch {
      setModeNotice('Failed to update platform mode');
    } finally {
      setIsUpdatingMode(false);
    }
  };

  const handleUpdateCurrency = async (curr: string, symbol: string, name: string, rate: number) => {
    setIsUpdatingMode(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          platformCurrency: curr,
          currencySymbol: symbol,
          currencyName: name,
          exchangeRateToUsdt: rate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        saveLocalPlatformMode({
          platformCurrency: curr,
          currencySymbol: symbol,
          currencyName: name,
          exchangeRateToUsdt: rate,
        });
        setPlatformSettings((prev) => ({
          ...prev,
          platformCurrency: curr,
          currencySymbol: symbol,
          currencyName: name,
          exchangeRateToUsdt: rate,
        }));
        setModeNotice(`Platform currency set to ${curr} (${symbol})!`);
        setTimeout(() => setModeNotice(null), 4000);
      }
    } catch {
      setModeNotice('Failed to update currency');
    } finally {
      setIsUpdatingMode(false);
    }
  };

  useEffect(() => {
    fetchNetworks();
    fetchPlatformSettings();
  }, [token]);

  const testEndpoint = async (networkKey: string, customUrl?: string) => {
    const net = networks.find((n) => n.networkKey === networkKey);
    if (!net) return;

    const urlToTest = customUrl || editingForms[networkKey]?.primaryRpc || net.currentActiveRpc;
    if (!urlToTest) return;

    setTestingKey(networkKey);
    try {
      const res = await fetch('/api/admin/rpc/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rpcUrl: urlToTest,
          expectedChainId: net.chainId,
        }),
      });
      const data = await res.json();

      setNetworks((prev) =>
        prev.map((n) => {
          if (n.networkKey === networkKey) {
            return {
              ...n,
              status: data.success ? (data.latencyMs < 500 ? 'healthy' : 'degraded') : 'error',
              latencyMs: data.latencyMs,
              blockNumber: data.blockNumber,
              lastTestedAt: new Date().toLocaleTimeString(),
              errorMessage: data.error,
            };
          }
          return n;
        })
      );
    } catch (err: any) {
      setNetworks((prev) =>
        prev.map((n) => {
          if (n.networkKey === networkKey) {
            return {
              ...n,
              status: 'error',
              errorMessage: err?.message || 'Failed to ping RPC endpoint',
            };
          }
          return n;
        })
      );
    } finally {
      setTestingKey(null);
    }
  };

  const testAllNetworks = async () => {
    for (const net of networks) {
      await testEndpoint(net.networkKey);
    }
  };

  const saveNetworkRpc = async (networkKey: string) => {
    const form = editingForms[networkKey];
    if (!form) return;

    setSavingKey(networkKey);
    try {
      const fallbackList = form.fallbacks
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.startsWith('http'));

      const res = await fetch('/api/admin/rpc/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          networkKey,
          primaryRpcUrl: form.primaryRpc,
          fallbackUrls: fallbackList,
          overrides: {
            usdtContractAddress: form.usdtContract,
            requiredConfirmations: Number(form.requiredConfirmations),
            minDepositUsdt: form.minDeposit,
            minWithdrawalUsdt: form.minWithdrawal,
            withdrawalFeeUsdt: form.withdrawalFee,
            isDepositEnabled: form.isDepositEnabled,
            isWithdrawalEnabled: form.isWithdrawalEnabled,
            isEnabled: form.isEnabled,
          },
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.networks)) {
        setNetworks(data.networks);
        // Automatically test the newly saved primary RPC
        await testEndpoint(networkKey, form.primaryRpc);
      }
    } catch {
      // error
    } finally {
      setSavingKey(null);
    }
  };

  const resetNetworkRpc = async (networkKey: string) => {
    if (!confirm(`Are you sure you want to reset ${networkKey} RPC configuration back to default system endpoints?`)) {
      return;
    }

    setSavingKey(networkKey);
    try {
      const res = await fetch('/api/admin/rpc/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ networkKey }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.networks)) {
        setNetworks(data.networks);
        // Reload form values
        const updatedNet = data.networks.find((n: NetworkRpcDetail) => n.networkKey === networkKey);
        if (updatedNet) {
          setEditingForms((prev) => ({
            ...prev,
            [networkKey]: {
              ...prev[networkKey],
              primaryRpc: updatedNet.currentActiveRpc,
              fallbacks: '',
              usdtContract: updatedNet.usdtContractAddress,
            },
          }));
          await testEndpoint(networkKey, updatedNet.currentActiveRpc);
        }
      }
    } catch {
      // error
    } finally {
      setSavingKey(null);
    }
  };

  const toggleCard = (networkKey: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [networkKey]: !prev[networkKey],
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 0. MASTER TOGGLE: CRYPTO WALLET VS MANUAL FIAT PAYMENT MODE */}
      <div className="bg-[#0b101d] border-2 border-amber-500/50 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-amber-500 text-slate-950">
                MASTER SYSTEM SWITCH
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Ludo Platform Crypto Wallet & Smart Contract Mode
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enable or disable the entire 7-chain crypto wallet system in 1-click. When <strong>DISABLED</strong>, all Web3 crypto wallet views and smart contracts are hidden from players, and the platform automatically converts to <strong>Manual Payment Mode (UPI / Bank / UTR)</strong> with your chosen national currency.
            </p>
          </div>

          {/* Master 1-Click Toggle Switch */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#12192c] border border-slate-700/80 p-3.5 rounded-2xl shrink-0">
            <div className="text-right sm:text-left">
              <div className="text-xs font-bold text-slate-200">
                Crypto Wallet: {platformSettings.cryptoWalletEnabled ? (
                  <span className="text-emerald-400">ENABLED (Active)</span>
                ) : (
                  <span className="text-amber-400">DISABLED (Manual Mode)</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Active Mode: {platformSettings.paymentMode}
              </div>
            </div>

            <button
              type="button"
              disabled={isUpdatingMode}
              onClick={() => handleToggleCryptoWallet(!platformSettings.cryptoWalletEnabled)}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors cursor-pointer focus:outline-none disabled:opacity-50 ${
                platformSettings.cryptoWalletEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                  platformSettings.cryptoWalletEnabled ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Currency Switcher Section (Auto-active when crypto is disabled OR configurable for manual pricing) */}
        <div className="pt-5 border-t border-slate-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Platform Currency & Localization Changer</span>
                {!platformSettings.cryptoWalletEnabled && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 uppercase font-mono">
                    AUTO ACTIVE
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-400 leading-normal">
                Choose your country fiat currency for match entry fees, player balances, and manual UPI/Bank deposits.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">Active Currency:</span>
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400 font-mono font-bold text-xs">
                {platformSettings.currencySymbol} {platformSettings.platformCurrency} ({platformSettings.currencyName})
              </span>
            </div>
          </div>

          {/* Quick Currency Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {[
              { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 89.5 },
              { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0 },
              { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rate: 3.67 },
              { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
              { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
              { code: 'PKR', symbol: 'PKR', name: 'Pakistani Rupee', rate: 278.0 },
              { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rate: 120.0 },
              { code: 'NPR', symbol: 'Rs.', name: 'Nepalese Rupee', rate: 135.0 },
              { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rate: 15600.0 },
              { code: 'PHP', symbol: '₱', name: 'Philippine Peso', rate: 58.0 },
              { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1600.0 },
              { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rate: 5.6 },
            ].map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleUpdateCurrency(c.code, c.symbol, c.name, c.rate)}
                disabled={isUpdatingMode}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  platformSettings.platformCurrency === c.code
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-[#121829] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs">{c.symbol} {c.code}</span>
                  {platformSettings.platformCurrency === c.code && (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="text-[10px] opacity-80 truncate mt-0.5">{c.name}</div>
              </button>
            ))}
          </div>
        </div>

        {modeNotice && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="leading-snug">{modeNotice}</span>
          </div>
        )}
      </div>

      {/* 1. Header & Quick Status Banner */}
      <div className="bg-gradient-to-r from-[#0d1322] via-[#10172c] to-[#0d1322] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Server className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Multi-Chain RPC Management Engine
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider ${
                currentEnv === 'mainnet'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {currentEnv} Mode
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Configure and test live dedicated RPC endpoints for all <strong>7 supported Blockchain Networks</strong> (Ethereum, Polygon, Arbitrum, BSC, Base, Optimism, Avalanche). Custom RPCs are stored dynamically in the application database without touching raw server environment variables.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={testAllNetworks}
              disabled={isLoading || testingKey !== null}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141b2d] hover:bg-[#1a233a] border border-slate-700 text-slate-200 text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Activity className={`w-4 h-4 text-cyan-400 ${testingKey ? 'animate-spin' : ''}`} />
              <span>Test All 7 RPCs</span>
            </button>

            <button
              onClick={fetchNetworks}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Config</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-[#090d16]/60 border border-slate-800/60 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Configured Networks</div>
            <div className="text-lg font-black text-white font-mono mt-0.5">7 / 7 EVM</div>
          </div>
          <div className="bg-[#090d16]/60 border border-slate-800/60 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Env</div>
            <div className="text-lg font-black text-amber-400 font-mono mt-0.5 uppercase">{currentEnv}</div>
          </div>
          <div className="bg-[#090d16]/60 border border-slate-800/60 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Settlement Asset</div>
            <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">Tether (USDT)</div>
          </div>
          <div className="bg-[#090d16]/60 border border-slate-800/60 rounded-xl p-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Multi-RPC Failover</div>
            <div className="text-lg font-black text-cyan-400 font-mono mt-0.5">Enabled (Auto)</div>
          </div>
        </div>
      </div>

      {/* 2. Step-by-Step Admin Instructions & Where to get RPCs */}
      <div className="bg-[#0a0e1a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div 
          onClick={() => setShowInstructions(!showInstructions)}
          className="p-5 bg-gradient-to-r from-[#0e1424] to-[#0a0e1a] border-b border-slate-800 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Admin Guide: How & Where to Get Fast Production RPCs (Free & Dedicated)
              </h3>
              <p className="text-xs text-slate-400">
                Click to {showInstructions ? 'collapse' : 'expand'} step-by-step instructions and recommended provider links.
              </p>
            </div>
          </div>
          <div className="text-slate-400">
            {showInstructions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>

        {showInstructions && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* 3 Step Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0f1527] border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h4 className="text-sm font-bold text-white">Create a Free Node Account</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sign up for any of the recommended providers below (e.g. <strong>Alchemy</strong>, <strong>QuickNode</strong>, or <strong>Infura</strong>). Free tiers provide millions of monthly requests, zero card required.
                </p>
              </div>

              <div className="bg-[#0f1527] border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h4 className="text-sm font-bold text-white">Generate HTTPS RPC URL</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In your provider dashboard, create an app for each network (Ethereum, Polygon, Arbitrum, BSC, Base, Optimism, Avalanche) and copy the provided <strong>HTTPS RPC URL</strong>.
                </p>
              </div>

              <div className="bg-[#0f1527] border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h4 className="text-sm font-bold text-white">Paste, Test & Save</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Paste the URL into the Primary RPC field below, click <strong>"Test RPC Connection"</strong> to verify block height and low latency, then click <strong>"Save & Apply"</strong>. No server restart needed!
                </p>
              </div>
            </div>

            {/* Provider Directory Cards */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Recommended Verified RPC Providers for All 7 Networks</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {RECOMMENDED_RPC_PROVIDERS.map((provider) => (
                  <div
                    key={provider.name}
                    className="bg-[#0d1322] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                          {provider.name}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bg-gradient-to-r ${provider.color}`}>
                          {provider.tier}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {provider.description}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {provider.chains.map((c) => (
                          <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <a
                        href={provider.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <span>Open Provider Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. 7-Network RPC Interactive Configuration Deck */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>All 7 Blockchain Network Configurations</span>
            </h3>
            <p className="text-xs text-slate-400">
              Manage dedicated RPC endpoints, fallback failover pools, gas confirmation thresholds, and USDT contract addresses.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {networks.length} Networks Live
          </span>
        </div>

        {networks.map((net) => {
          const form = editingForms[net.networkKey] || {
            primaryRpc: net.currentActiveRpc,
            fallbacks: '',
            usdtContract: net.usdtContractAddress,
            requiredConfirmations: net.requiredConfirmations,
            minDeposit: net.minDepositUsdt,
            minWithdrawal: net.minWithdrawalUsdt,
            withdrawalFee: net.withdrawalFeeUsdt,
            isDepositEnabled: net.isDepositEnabled,
            isWithdrawalEnabled: net.isWithdrawalEnabled,
            isEnabled: net.isEnabled,
          };

          const isExpanded = expandedCards[net.networkKey] ?? false;
          const isTesting = testingKey === net.networkKey;
          const isSaving = savingKey === net.networkKey;

          return (
            <div
              key={net.networkKey}
              className={`bg-[#0a0e1a] border rounded-2xl transition-all duration-200 shadow-xl overflow-hidden ${
                isExpanded ? 'border-amber-500/40 ring-1 ring-amber-500/20' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header Bar */}
              <div
                onClick={() => toggleCard(net.networkKey)}
                className="p-5 sm:p-6 bg-gradient-to-r from-[#0d1322] via-[#0f1629] to-[#0d1322] flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
                    <Globe className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-bold text-white">{net.name}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-mono font-semibold">
                        Chain ID: {net.chainId}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-semibold">
                        {net.nativeGasSymbol}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                      <span className="truncate max-w-xs sm:max-w-md text-slate-300">
                        Active: {net.currentActiveRpc}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                  {/* Status Indicator */}
                  {net.status === 'healthy' && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{net.latencyMs}ms (Healthy)</span>
                    </div>
                  )}
                  {net.status === 'degraded' && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{net.latencyMs}ms (Slow)</span>
                    </div>
                  )}
                  {net.status === 'error' && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Error / Timeout</span>
                    </div>
                  )}
                  {net.status === 'untested' && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
                      <Activity className="w-3.5 h-3.5" />
                      <span>Untested</span>
                    </div>
                  )}

                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-amber-400" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Error Callout if RPC test failed */}
              {net.errorMessage && (
                <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-rose-200">RPC Connection Failed:</strong> {net.errorMessage}
                  </div>
                </div>
              )}

              {/* Expandable Body */}
              {isExpanded && (
                <div className="p-6 sm:p-8 space-y-6 border-t border-slate-800/80 bg-[#080c16]">
                  {/* Primary RPC Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Primary Custom RPC Endpoint (HTTPS URL)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(form.primaryRpc, `rpc_${net.networkKey}`)}
                        className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      >
                        {copiedUrl === `rpc_${net.networkKey}` ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Copied
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Copy className="w-3 h-3" /> Copy URL
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={form.primaryRpc}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingForms((prev) => ({
                            ...prev,
                            [net.networkKey]: { ...prev[net.networkKey], primaryRpc: val },
                          }));
                        }}
                        placeholder="https://..."
                        className="flex-1 bg-[#101728] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                      />
                      <button
                        type="button"
                        onClick={() => testEndpoint(net.networkKey, form.primaryRpc)}
                        disabled={isTesting}
                        className="px-4 py-3 bg-[#151e36] hover:bg-[#1c2847] border border-slate-600 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        <Activity className={`w-4 h-4 text-cyan-400 ${isTesting ? 'animate-spin' : ''}`} />
                        <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Paste the dedicated RPC HTTPS link obtained from your node provider (e.g., Alchemy, QuickNode, Infura).
                    </p>
                  </div>

                  {/* Fallback RPC Endpoints */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Secondary Fallback RPC Endpoints (One per line)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={form.fallbacks}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingForms((prev) => ({
                          ...prev,
                          [net.networkKey]: { ...prev[net.networkKey], fallbacks: val },
                        }));
                      }}
                      placeholder="https://fallback-rpc-1.com&#10;https://fallback-rpc-2.com"
                      className="w-full bg-[#101728] border border-slate-700 rounded-xl p-3 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[11px] text-slate-400">
                      If the primary RPC experiences an outage or rate limit, the system automatically routes calls to these fallbacks.
                    </p>
                  </div>

                  {/* Additional Network Parameters */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-4">
                    <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Contract & Settlement Parameters</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* USDT Contract Address */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-300">
                          Official USDT Contract Address ({net.usdtDecimals} decimals)
                        </label>
                        <input
                          type="text"
                          value={form.usdtContract}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingForms((prev) => ({
                              ...prev,
                              [net.networkKey]: { ...prev[net.networkKey], usdtContract: val },
                            }));
                          }}
                          className="w-full bg-[#101728] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* Required Confirmations */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300">
                          Required Block Confirmations
                        </label>
                        <input
                          type="number"
                          value={form.requiredConfirmations}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setEditingForms((prev) => ({
                              ...prev,
                              [net.networkKey]: { ...prev[net.networkKey], requiredConfirmations: val },
                            }));
                          }}
                          className="w-full bg-[#101728] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* Min Deposit */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300">
                          Min Deposit (USDT)
                        </label>
                        <input
                          type="text"
                          value={form.minDeposit}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingForms((prev) => ({
                              ...prev,
                              [net.networkKey]: { ...prev[net.networkKey], minDeposit: val },
                            }));
                          }}
                          className="w-full bg-[#101728] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* Min Withdrawal */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300">
                          Min Withdrawal (USDT)
                        </label>
                        <input
                          type="text"
                          value={form.minWithdrawal}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingForms((prev) => ({
                              ...prev,
                              [net.networkKey]: { ...prev[net.networkKey], minWithdrawal: val },
                            }));
                          }}
                          className="w-full bg-[#101728] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* Network Withdrawal Fee */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300">
                          Network Gas Fee (USDT)
                        </label>
                        <input
                          type="text"
                          value={form.withdrawalFee}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingForms((prev) => ({
                              ...prev,
                              [net.networkKey]: { ...prev[net.networkKey], withdrawalFee: val },
                            }));
                          }}
                          className="w-full bg-[#101728] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    {/* Enable / Disable Toggles */}
                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200 select-none">
                        <input
                          type="checkbox"
                          checked={form.isDepositEnabled}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEditingForms((prev) => ({
                              ...prev,
                              [net.networkKey]: { ...prev[net.networkKey], isDepositEnabled: checked },
                            }));
                          }}
                          className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 bg-slate-800 border-slate-700"
                        />
                        <span>Enable Deposits</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200 select-none">
                        <input
                          type="checkbox"
                          checked={form.isWithdrawalEnabled}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEditingForms((prev) => ({
                              ...prev,
                              [net.networkKey]: { ...prev[net.networkKey], isWithdrawalEnabled: checked },
                            }));
                          }}
                          className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 bg-slate-800 border-slate-700"
                        />
                        <span>Enable Withdrawals</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200 select-none">
                        <input
                          type="checkbox"
                          checked={form.isEnabled}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEditingForms((prev) => ({
                              ...prev,
                              [net.networkKey]: { ...prev[net.networkKey], isEnabled: checked },
                            }));
                          }}
                          className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 bg-slate-800 border-slate-700"
                        />
                        <span>Enable Network in Lobby</span>
                      </label>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => resetNetworkRpc(net.networkKey)}
                      disabled={isSaving}
                      className="flex items-center gap-2 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to System Defaults</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => saveNetworkRpc(net.networkKey)}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                        <span>{isSaving ? 'Saving...' : 'Save & Apply RPC'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
