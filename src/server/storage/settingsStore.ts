import fs from 'fs';
import path from 'path';
import { Logger } from '../config/env';

export interface PlatformSettings {
  adminUrlAlias: string;
  maintenanceMode: boolean;
  cryptoWalletEnabled: boolean;
  paymentMode: 'CRYPTO' | 'MANUAL';
  platformCurrency: string;
  currencySymbol: string;
  currencyName: string;
  exchangeRateToUsdt: number;
  turnTimeoutSeconds: number;
  maxConsecutiveSixes: number;
  entryFee2Player: number;
  entryFee4Player: number;
  entryFeeSnakeLudo: number;
  prizePoolPercentage: number;
  allowedOrigins: string[];
}

export interface ActiveThemeConfig {
  activeLobbyId: string;
  activeBoardId: string;
  activeDiceId: string;
  activePawnId: string;
  enabledLobbies: string[];
  enabledBoards: string[];
  enabledDice: string[];
  enabledPawns: string[];
  customThemes?: any[];
  updatedAt: string;
  deployedBy?: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  adminUrlAlias: 'admin',
  maintenanceMode: false,
  cryptoWalletEnabled: true,
  paymentMode: 'CRYPTO',
  platformCurrency: 'INR',
  currencySymbol: '₹',
  currencyName: 'Indian Rupee',
  exchangeRateToUsdt: 89.5,
  turnTimeoutSeconds: 30,
  maxConsecutiveSixes: 3,
  entryFee2Player: 100,
  entryFee4Player: 250,
  entryFeeSnakeLudo: 50,
  prizePoolPercentage: 85,
  allowedOrigins: ['https://ludo.omyra.org', 'http://localhost:3000'],
};

const DEFAULT_THEME_CONFIG: ActiveThemeConfig = {
  activeLobbyId: 'dubai_prestige_gold',
  activeBoardId: 'dubai_royal_sunset',
  activeDiceId: 'golden_high_roller',
  activePawnId: 'royal_crowned',
  enabledLobbies: ['dubai_prestige_gold', 'cyberpunk_neon_tokyo', 'monaco_vip_casino', 'emerald_palace_tournament', 'sunset_oasis_carnival'],
  enabledBoards: ['dubai_royal_sunset', 'classic_emerald', 'cyber_neon', 'midnight_marble', 'candy_pastel', 'aztec_wood'],
  enabledDice: ['golden_high_roller', 'classic_pearl', 'cyber_glass', 'ruby_royale', 'emerald_jade', 'dark_matter'],
  enabledPawns: ['royal_crowned', 'classic_gloss', 'crystal_gem', 'cyber_mecha', 'golden_sovereign', 'dragon_shield'],
  customThemes: [],
  updatedAt: new Date().toISOString(),
  deployedBy: 'SuperAdmin',
};

const dataDir = path.join(process.cwd(), 'data');
const settingsFilePath = path.join(dataDir, 'platform_settings.json');
const themeFilePath = path.join(dataDir, 'theme_config.json');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch {
      // ignore
    }
  }
}

// In-memory active runtime copies
let currentSettings: PlatformSettings = { ...DEFAULT_SETTINGS };
let currentThemeConfig: ActiveThemeConfig = { ...DEFAULT_THEME_CONFIG };

// Load initially from disk
try {
  ensureDataDir();
  if (fs.existsSync(settingsFilePath)) {
    const raw = fs.readFileSync(settingsFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    currentSettings = { ...DEFAULT_SETTINGS, ...parsed };
    Logger.info(`[SettingsStore] Loaded persisted platform settings: Mode=${currentSettings.paymentMode}, CryptoEnabled=${currentSettings.cryptoWalletEnabled}`);
  } else {
    fs.writeFileSync(settingsFilePath, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
  }

  if (fs.existsSync(themeFilePath)) {
    const rawTheme = fs.readFileSync(themeFilePath, 'utf-8');
    currentThemeConfig = { ...DEFAULT_THEME_CONFIG, ...JSON.parse(rawTheme) };
  } else {
    fs.writeFileSync(themeFilePath, JSON.stringify(DEFAULT_THEME_CONFIG, null, 2), 'utf-8');
  }
} catch (err) {
  Logger.warn(`[SettingsStore] Could not load persisted settings from disk, using defaults: ${String(err)}`);
}

export class SettingsStore {
  public static getSettings(): PlatformSettings {
    return { ...currentSettings };
  }

  public static updateSettings(partial: Partial<PlatformSettings>): PlatformSettings {
    currentSettings = {
      ...currentSettings,
      ...partial,
    };

    // Ensure paymentMode and cryptoWalletEnabled are strictly consistent
    if (partial.cryptoWalletEnabled !== undefined) {
      currentSettings.paymentMode = partial.cryptoWalletEnabled ? 'CRYPTO' : 'MANUAL';
    } else if (partial.paymentMode !== undefined) {
      currentSettings.cryptoWalletEnabled = partial.paymentMode === 'CRYPTO';
    }

    try {
      ensureDataDir();
      fs.writeFileSync(settingsFilePath, JSON.stringify(currentSettings, null, 2), 'utf-8');
      Logger.info(`[SettingsStore] Persisted platform settings to disk: Mode=${currentSettings.paymentMode}, Crypto=${currentSettings.cryptoWalletEnabled}`);
    } catch (err) {
      Logger.warn(`[SettingsStore] Failed to write settings to disk: ${String(err)}`);
    }

    return { ...currentSettings };
  }

  public static getThemeConfig(): ActiveThemeConfig {
    return { ...currentThemeConfig };
  }

  public static updateThemeConfig(partial: Partial<ActiveThemeConfig>): ActiveThemeConfig {
    currentThemeConfig = {
      ...currentThemeConfig,
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    try {
      ensureDataDir();
      fs.writeFileSync(themeFilePath, JSON.stringify(currentThemeConfig, null, 2), 'utf-8');
    } catch (err) {
      Logger.warn(`[SettingsStore] Failed to write theme config to disk: ${String(err)}`);
    }

    return { ...currentThemeConfig };
  }
}
