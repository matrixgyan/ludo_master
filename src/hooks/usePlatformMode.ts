import { useState, useEffect, useCallback } from 'react';

export interface PlatformModeConfig {
  cryptoWalletEnabled: boolean;
  paymentMode: 'CRYPTO' | 'MANUAL';
  platformCurrency: string;
  currencySymbol: string;
  currencyName: string;
  exchangeRateToUsdt?: number;
}

const STORAGE_KEY = 'ludo_platform_mode';

const DEFAULT_PLATFORM_MODE: PlatformModeConfig = {
  cryptoWalletEnabled: true,
  paymentMode: 'CRYPTO',
  platformCurrency: 'INR',
  currencySymbol: '₹',
  currencyName: 'Indian Rupee',
  exchangeRateToUsdt: 89.5,
};

export function getLocalPlatformMode(): PlatformModeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        cryptoWalletEnabled: parsed.cryptoWalletEnabled ?? true,
        paymentMode: parsed.paymentMode || (parsed.cryptoWalletEnabled ? 'CRYPTO' : 'MANUAL'),
        platformCurrency: parsed.platformCurrency || 'INR',
        currencySymbol: parsed.currencySymbol || '₹',
        currencyName: parsed.currencyName || 'Indian Rupee',
        exchangeRateToUsdt: parsed.exchangeRateToUsdt || 89.5,
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_PLATFORM_MODE;
}

export function saveLocalPlatformMode(config: Partial<PlatformModeConfig>): PlatformModeConfig {
  const current = getLocalPlatformMode();
  const updated: PlatformModeConfig = {
    ...current,
    ...config,
  };
  if (config.cryptoWalletEnabled !== undefined) {
    updated.paymentMode = config.cryptoWalletEnabled ? 'CRYPTO' : 'MANUAL';
  } else if (config.paymentMode !== undefined) {
    updated.cryptoWalletEnabled = config.paymentMode === 'CRYPTO';
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ludo_platform_mode_changed', { detail: updated }));
  } catch {
    // ignore
  }
  return updated;
}

export function usePlatformMode() {
  const [platformMode, setPlatformMode] = useState<PlatformModeConfig>(() => getLocalPlatformMode());
  const [isLoading, setIsLoading] = useState(false);

  const refreshPlatformMode = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/platform/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          const updated = saveLocalPlatformMode({
            cryptoWalletEnabled: data.settings.cryptoWalletEnabled ?? true,
            paymentMode: data.settings.paymentMode || (data.settings.cryptoWalletEnabled ? 'CRYPTO' : 'MANUAL'),
            platformCurrency: data.settings.platformCurrency || 'INR',
            currencySymbol: data.settings.currencySymbol || '₹',
            currencyName: data.settings.currencyName || 'Indian Rupee',
            exchangeRateToUsdt: data.settings.exchangeRateToUsdt || 89.5,
          });
          setPlatformMode(updated);
        }
      }
    } catch {
      // keep current cached state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch fresh settings on mount
    refreshPlatformMode();

    // Listen for changes from other tabs or components
    const handleModeChanged = (e: any) => {
      if (e.detail) {
        setPlatformMode(e.detail);
      } else {
        setPlatformMode(getLocalPlatformMode());
      }
    };

    window.addEventListener('ludo_platform_mode_changed', handleModeChanged);
    window.addEventListener('storage', handleModeChanged);

    return () => {
      window.removeEventListener('ludo_platform_mode_changed', handleModeChanged);
      window.removeEventListener('storage', handleModeChanged);
    };
  }, [refreshPlatformMode]);

  return {
    platformMode,
    isCryptoMode: platformMode.cryptoWalletEnabled,
    isManualMode: !platformMode.cryptoWalletEnabled,
    refreshPlatformMode,
    isLoading,
  };
}
