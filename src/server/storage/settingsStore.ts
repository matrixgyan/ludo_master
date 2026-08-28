import fs from 'fs';
import path from 'path';
import { Logger } from '../config/env';
import { getDbPool, isPostgresConfigured } from '../db/client';

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
  cryptoWalletEnabled: false,
  paymentMode: 'MANUAL',
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
let isDbInitialized = false;

// Initial fast bootstrap from disk fallback
try {
  ensureDataDir();
  if (fs.existsSync(settingsFilePath)) {
    const raw = fs.readFileSync(settingsFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    currentSettings = { ...DEFAULT_SETTINGS, ...parsed };
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
  Logger.warn(`[SettingsStore] Could not load persisted settings from disk: ${String(err)}`);
}

export class SettingsStore {
  /**
   * Loads the authoritative system settings from PostgreSQL Database
   */
  public static async initializeFromDb(): Promise<void> {
    if (!isPostgresConfigured()) {
      Logger.info('[SettingsStore] PostgreSQL not configured, running in local-disk persistent mode');
      return;
    }

    const pool = getDbPool();
    if (!pool) return;

    try {
      const client = await pool.connect();
      try {
        // Ensure table exists
        await client.query(`
          CREATE TABLE IF NOT EXISTS platform_system_settings (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);

        // Load Platform Settings
        const settingsRes = await client.query(
          'SELECT value FROM platform_system_settings WHERE key = $1',
          ['platform_settings']
        );

        if (settingsRes.rows.length > 0 && settingsRes.rows[0].value) {
          const dbSettings = settingsRes.rows[0].value;
          currentSettings = { ...DEFAULT_SETTINGS, ...dbSettings };
          Logger.info(`🛡️ [SettingsStore] Loaded authoritative platform settings from Database: PaymentMode=[${currentSettings.paymentMode}], CryptoWalletEnabled=[${currentSettings.cryptoWalletEnabled}]`);
          
          // Sync to local disk backup
          try {
            ensureDataDir();
            fs.writeFileSync(settingsFilePath, JSON.stringify(currentSettings, null, 2), 'utf-8');
          } catch {
            // ignore
          }
        } else {
          // Seed initial row in database with default settings
          await client.query(
            `INSERT INTO platform_system_settings (key, value, updated_at) 
             VALUES ($1, $2, NOW()) 
             ON CONFLICT (key) DO NOTHING`,
            ['platform_settings', JSON.stringify(currentSettings)]
          );
          Logger.info('🛡️ [SettingsStore] Initialized platform_system_settings record in PostgreSQL');
        }

        // Load Theme Config
        const themeRes = await client.query(
          'SELECT value FROM platform_system_settings WHERE key = $1',
          ['theme_config']
        );

        if (themeRes.rows.length > 0 && themeRes.rows[0].value) {
          currentThemeConfig = { ...DEFAULT_THEME_CONFIG, ...themeRes.rows[0].value };
        } else {
          await client.query(
            `INSERT INTO platform_system_settings (key, value, updated_at) 
             VALUES ($1, $2, NOW()) 
             ON CONFLICT (key) DO NOTHING`,
            ['theme_config', JSON.stringify(currentThemeConfig)]
          );
        }

        isDbInitialized = true;
      } finally {
        client.release();
      }
    } catch (err) {
      Logger.warn('[SettingsStore] Failed to initialize settings from database:', { error: String(err) });
    }
  }

  public static getSettings(): PlatformSettings {
    return { ...currentSettings };
  }

  public static updateSettings(partial: Partial<PlatformSettings>): PlatformSettings {
    currentSettings = {
      ...currentSettings,
      ...partial,
    };

    // Ensure paymentMode and cryptoWalletEnabled are strictly bidirectional
    if (partial.cryptoWalletEnabled !== undefined) {
      currentSettings.paymentMode = partial.cryptoWalletEnabled ? 'CRYPTO' : 'MANUAL';
    } else if (partial.paymentMode !== undefined) {
      currentSettings.cryptoWalletEnabled = partial.paymentMode === 'CRYPTO';
    }

    // 1. Sync to local disk file backup
    try {
      ensureDataDir();
      fs.writeFileSync(settingsFilePath, JSON.stringify(currentSettings, null, 2), 'utf-8');
      Logger.info(`[SettingsStore] Persisted platform settings to disk: Mode=${currentSettings.paymentMode}, Crypto=${currentSettings.cryptoWalletEnabled}`);
    } catch (err) {
      Logger.warn(`[SettingsStore] Failed to write settings to disk: ${String(err)}`);
    }

    // 2. Persist directly and authoritatively to PostgreSQL Database
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        pool.query(
          `INSERT INTO platform_system_settings (key, value, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          ['platform_settings', JSON.stringify(currentSettings)]
        ).then(() => {
          Logger.info(`🛡️ [SettingsStore] Successfully saved platform settings to PostgreSQL Database! Mode=[${currentSettings.paymentMode}], Crypto=[${currentSettings.cryptoWalletEnabled}]`);
        }).catch((err) => {
          Logger.error('[SettingsStore] Error saving platform settings to PostgreSQL Database', err);
        });
      }
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

    // Persist to PostgreSQL Database
    if (isPostgresConfigured()) {
      const pool = getDbPool();
      if (pool) {
        pool.query(
          `INSERT INTO platform_system_settings (key, value, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          ['theme_config', JSON.stringify(currentThemeConfig)]
        ).catch((err) => {
          Logger.error('[SettingsStore] Error saving theme config to PostgreSQL', err);
        });
      }
    }

    return { ...currentThemeConfig };
  }
}
