import { useState, useEffect, useCallback } from 'react';
import {
  PlatformGameSettings,
  DEFAULT_PLATFORM_SETTINGS,
  MatchPoolTier,
} from '../types/settings';

const SETTINGS_STORAGE_KEY = 'ludo_platform_game_settings_v1';

export function getLocalGameSettings(): PlatformGameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PLATFORM_SETTINGS,
        ...parsed,
      };
    }
  } catch {
    // Ignore error
  }
  return DEFAULT_PLATFORM_SETTINGS;
}

export function saveLocalGameSettings(settings: Partial<PlatformGameSettings>): void {
  try {
    const current = getLocalGameSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('ludo_game_settings_changed', { detail: merged }));
  } catch {
    // Ignore error
  }
}

export interface UseGameSettingsReturn {
  settings: PlatformGameSettings;
  ludoPawnSpeedMs: number;
  snakeLudoPawnSpeedMs: number;
  supremePawnSpeedMs: number;
  turnTimeoutSeconds: number;
  maxConsecutiveSixes: number;
  prizePoolPercentage: number;
  platformFeePercentage: number;
  getPoolsForCount: (count: 2 | 3 | 4, gameType?: 'classic' | 'supreme' | 'snake') => MatchPoolTier[];
  calculateNetPrize: (count: number, fee: number) => number;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
}

export function useGameSettings(): UseGameSettingsReturn {
  const [settings, setSettings] = useState<PlatformGameSettings>(() => getLocalGameSettings());
  const [isLoading, setIsLoading] = useState(false);

  const refreshFromLocal = useCallback(() => {
    const fresh = getLocalGameSettings();
    setSettings(fresh);
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/game-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          saveLocalGameSettings(data.settings);
          setSettings(data.settings);
        }
      }
    } catch {
      refreshFromLocal();
    } finally {
      setIsLoading(false);
    }
  }, [refreshFromLocal]);

  useEffect(() => {
    refreshSettings();

    const handleSettingsChanged = (e: Event) => {
      const customEvent = e as CustomEvent<PlatformGameSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      } else {
        refreshFromLocal();
      }
    };

    window.addEventListener('ludo_game_settings_changed', handleSettingsChanged);
    window.addEventListener('storage', handleSettingsChanged);

    return () => {
      window.removeEventListener('ludo_game_settings_changed', handleSettingsChanged);
      window.removeEventListener('storage', handleSettingsChanged);
    };
  }, [refreshSettings, refreshFromLocal]);

  const getPoolsForCount = useCallback(
    (count: 2 | 3 | 4, gameType?: 'classic' | 'supreme' | 'snake'): MatchPoolTier[] => {
      if (gameType === 'snake' && settings.matchPoolsSnake && settings.matchPoolsSnake.length > 0) {
        return settings.matchPoolsSnake;
      }
      if (count === 3 && settings.matchPools3P && settings.matchPools3P.length > 0) {
        return settings.matchPools3P;
      }
      if (count === 4 && settings.matchPools4P && settings.matchPools4P.length > 0) {
        return settings.matchPools4P;
      }
      return settings.matchPools2P || DEFAULT_PLATFORM_SETTINGS.matchPools2P;
    },
    [settings]
  );

  const calculateNetPrize = useCallback(
    (count: number, fee: number): number => {
      if (fee === 0) return 0;
      const gross = count * fee;
      const payoutMultiplier = (settings.prizePoolPercentage || 90) / 100;
      return Number((gross * payoutMultiplier).toFixed(2));
    },
    [settings.prizePoolPercentage]
  );

  return {
    settings,
    ludoPawnSpeedMs: settings.ludoPawnSpeedMs || 320,
    snakeLudoPawnSpeedMs: settings.snakeLudoPawnSpeedMs || 160,
    supremePawnSpeedMs: settings.supremePawnSpeedMs || 240,
    turnTimeoutSeconds: settings.turnTimeoutSeconds || 30,
    maxConsecutiveSixes: settings.maxConsecutiveSixes || 3,
    prizePoolPercentage: settings.prizePoolPercentage || 90,
    platformFeePercentage: settings.platformFeePercentage || 10,
    getPoolsForCount,
    calculateNetPrize,
    refreshSettings,
    isLoading,
  };
}
