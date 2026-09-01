import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getDb, isPostgresConfigured } from '../db/client';
import { users, walletAccounts, ledgerAccounts } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { Logger } from '../config/env';
import fs from 'fs';
import path from 'path';

export interface AuthUser {
  id: string; // Permanent Unique 10-Digit User ID (e.g. 7849102834)
  email: string;
  username: string;
  displayName: string;
  gender: 'male' | 'female';
  avatarUrl: string;
  walletAddress?: string;
  coins: number;
  diamonds: number;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
}

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.ADMIN_JWT_SECRET || 'ludo-secure-jwt-auth-secret-key-2026';

// Persistent local fallback file when PostgreSQL is initializing or in dev mode
const dataDir = path.join(process.cwd(), 'data');
const authStorePath = path.join(dataDir, 'users_auth_store.json');

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch {
    // ignore
  }
}

export interface StoredUserRecord extends AuthUser {
  passwordHash: string;
}

export const MALE_DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80';
export const FEMALE_DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80';

let inMemoryUsers: StoredUserRecord[] = [];

function loadUsersFromDisk(): void {
  try {
    ensureDataDir();
    if (fs.existsSync(authStorePath)) {
      const raw = fs.readFileSync(authStorePath, 'utf8');
      inMemoryUsers = JSON.parse(raw);
    }
  } catch (err) {
    Logger.warn('Notice loading local users store:', err);
  }
}

function syncUsersToDisk(): void {
  try {
    ensureDataDir();
    fs.writeFileSync(authStorePath, JSON.stringify(inMemoryUsers, null, 2), 'utf8');
  } catch (err) {
    Logger.warn('Notice saving local users store:', err);
  }
}

loadUsersFromDisk();

export class AuthService {
  /**
   * Generates a unique, cryptographically secure 10-digit user ID (e.g. 7492018471)
   */
  public static async generateSecure10DigitUserId(): Promise<string> {
    for (let attempts = 0; attempts < 100; attempts++) {
      // 10-digit range: 1000000000 to 9999999999
      const candidate = crypto.randomInt(1000000000, 10000000000).toString();

      // Check in-memory cache
      const existsInCache = inMemoryUsers.some((u) => u.id === candidate);
      if (existsInCache) continue;

      // Check PostgreSQL
      if (isPostgresConfigured()) {
        try {
          const db = getDb();
          if (db) {
            const existing = await db
              .select({ id: users.id })
              .from(users)
              .where(eq(users.id, candidate))
              .limit(1);
            if (existing.length > 0) continue;
          }
        } catch {
          // If query fails, candidate is usable
        }
      }

      return candidate;
    }

    // Fallback if loop finishes
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }

  /**
   * Hashes a password with crypto PBKDF2 with salt
   */
  public static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verifies password against stored salt:hash
   */
  public static verifyPassword(password: string, storedHash: string): boolean {
    try {
      const [salt, originalHash] = storedHash.split(':');
      if (!salt || !originalHash) return false;
      const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
    } catch {
      return false;
    }
  }

  /**
   * Generates a tamper-proof stateless token
   */
  public static generateToken(userId: string, email: string): string {
    const payload = JSON.stringify({
      userId,
      email,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      nonce: uuidv4().slice(0, 8),
    });
    const encodedPayload = Buffer.from(payload).toString('base64url');
    const signature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(encodedPayload)
      .digest('base64url');
    return `${encodedPayload}.${signature}`;
  }

  /**
   * Validates and decodes token
   */
  public static verifyToken(token: string): { userId: string; email: string } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return null;
      const [encodedPayload, signature] = parts;
      const expectedSig = crypto
        .createHmac('sha256', AUTH_SECRET)
        .update(encodedPayload)
        .digest('base64url');
      if (signature !== expectedSig) return null;

      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
      if (payload.exp && payload.exp < Date.now()) return null;
      return { userId: payload.userId, email: payload.email };
    } catch {
      return null;
    }
  }

  /**
   * Registers a new user with automatic unique 10-digit ID and default avatar based on gender
   */
  public static async register(data: {
    email: string;
    password: string;
    gender?: 'male' | 'female';
  }): Promise<AuthResponse> {
    const email = data.email.trim().toLowerCase();
    if (!email || !email.includes('@') || !email.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!data.password || data.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const gender: 'male' | 'female' = data.gender === 'female' ? 'female' : 'male';
    const avatarUrl = gender === 'female' ? FEMALE_DEFAULT_AVATAR : MALE_DEFAULT_AVATAR;

    // 1. Check if email is already registered in Postgres or cache
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (existing.length > 0) {
            return { success: false, error: 'An account with this email address already exists. Please Sign In.' };
          }
        }
      } catch (err) {
        Logger.warn(`Postgres email check failed in register: ${String(err)}`);
      }
    }

    const existingCache = inMemoryUsers.find((u) => u.email.toLowerCase() === email);
    if (existingCache) {
      return { success: false, error: 'An account with this email address already exists. Please Sign In.' };
    }

    // 2. Generate permanent unique 10-digit user ID
    const permanentUserId = await this.generateSecure10DigitUserId();
    const username = `Player_${permanentUserId}`;
    const displayName = `Player #${permanentUserId}`;
    const passwordHash = this.hashPassword(data.password);
    const now = new Date();

    const userRecord: AuthUser = {
      id: permanentUserId,
      email,
      username,
      displayName,
      gender,
      avatarUrl,
      coins: 1000,
      diamonds: 10,
      createdAt: now.toISOString(),
    };

    // 3. Persist in memory & disk cache
    inMemoryUsers.unshift({
      ...userRecord,
      passwordHash,
    });
    syncUsersToDisk();

    // 4. Persist in PostgreSQL (users table + wallet_accounts + ledger_accounts)
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          // Insert User
          await db.insert(users).values({
            id: permanentUserId,
            username,
            displayName,
            email,
            passwordHash,
            gender,
            avatarUrl,
            coins: 1000,
            diamonds: 10,
            createdAt: now,
            updatedAt: now,
          });

          // Insert Unified Wallet Account
          await db.insert(walletAccounts).values({
            id: `wacc_${permanentUserId}`,
            userId: permanentUserId,
            asset: 'USDT',
            availableBalance: '0.00000000',
            lockedBalance: '0.00000000',
            totalBalance: '0.00000000',
            status: 'ACTIVE',
            version: 1,
            createdAt: now,
            updatedAt: now,
          }).onConflictDoNothing();

          // Insert Ledger Available Account
          await db.insert(ledgerAccounts).values({
            id: `leg_avail_${permanentUserId}`,
            accountType: 'USER_AVAILABLE',
            ownerId: permanentUserId,
            asset: 'USDT',
            balance: '0.00000000',
            createdAt: now,
            updatedAt: now,
          }).onConflictDoNothing();

          // Insert Ledger Locked Account
          await db.insert(ledgerAccounts).values({
            id: `leg_lock_${permanentUserId}`,
            accountType: 'USER_LOCKED',
            ownerId: permanentUserId,
            asset: 'USDT',
            balance: '0.00000000',
            createdAt: now,
            updatedAt: now,
          }).onConflictDoNothing();

          Logger.info(`✅ [AUTH] Registered new user with 10-digit ID: ${permanentUserId} (${email}, gender: ${gender}) in PostgreSQL.`);
        }
      } catch (err) {
        Logger.error(`Postgres user registration error: ${String(err)}`);
      }
    }

    const token = this.generateToken(permanentUserId, email);
    return {
      success: true,
      token,
      user: userRecord,
    };
  }

  /**
   * Logs in an existing user with email and password
   */
  public static async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const email = data.email.trim().toLowerCase();
    if (!email || !data.password) {
      return { success: false, error: 'Please provide both email and password.' };
    }

    let foundUser: (AuthUser & { passwordHash?: string | null }) | null = null;

    // 1. Check PostgreSQL first
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          const rows = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (rows.length > 0) {
            const r = rows[0];
            const gender: 'male' | 'female' = (r.gender as 'male' | 'female') || 'male';
            foundUser = {
              id: r.id,
              email: r.email || email,
              username: r.username,
              displayName: r.displayName || r.username,
              gender,
              avatarUrl: r.avatarUrl || (gender === 'female' ? FEMALE_DEFAULT_AVATAR : MALE_DEFAULT_AVATAR),
              walletAddress: r.walletAddress || undefined,
              coins: r.coins,
              diamonds: r.diamonds,
              createdAt: r.createdAt.toISOString(),
              passwordHash: r.passwordHash,
            };
          }
        }
      } catch (err) {
        Logger.warn(`Postgres lookup in login failed: ${String(err)}`);
      }
    }

    // 2. Fallback to cache if not found in PG or PG unavailable
    if (!foundUser) {
      const cached = inMemoryUsers.find((u) => u.email.toLowerCase() === email);
      if (cached) {
        foundUser = cached;
      }
    }

    if (!foundUser || !foundUser.passwordHash) {
      return { success: false, error: 'No account found with this email address. Please Register first.' };
    }

    const isMatch = this.verifyPassword(data.password, foundUser.passwordHash);
    if (!isMatch) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    const token = this.generateToken(foundUser.id, foundUser.email);
    const sanitizedUser: AuthUser = {
      id: foundUser.id,
      email: foundUser.email,
      username: foundUser.username,
      displayName: foundUser.displayName,
      gender: foundUser.gender || 'male',
      avatarUrl: foundUser.avatarUrl,
      walletAddress: foundUser.walletAddress,
      coins: foundUser.coins,
      diamonds: foundUser.diamonds,
      createdAt: foundUser.createdAt,
    };

    return {
      success: true,
      token,
      user: sanitizedUser,
    };
  }

  /**
   * Updates user avatar URL in PostgreSQL and memory store
   */
  public static async updateAvatar(userId: string, avatarUrl: string): Promise<AuthUser | null> {
    const now = new Date();

    // 1. Update in Postgres
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          await db
            .update(users)
            .set({
              avatarUrl,
              updatedAt: now,
            })
            .where(eq(users.id, userId));
        }
      } catch (err) {
        Logger.warn(`Failed to update avatar in PostgreSQL: ${String(err)}`);
      }
    }

    // 2. Update in-memory & disk cache
    const cachedIdx = inMemoryUsers.findIndex((u) => u.id === userId);
    if (cachedIdx >= 0) {
      inMemoryUsers[cachedIdx].avatarUrl = avatarUrl;
      syncUsersToDisk();
    }

    return this.getUserById(userId);
  }

  /**
   * Retrieves a user by their permanent ID
   */
  public static async getUserById(userId: string): Promise<AuthUser | null> {
    if (isPostgresConfigured()) {
      try {
        const db = getDb();
        if (db) {
          const rows = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (rows.length > 0) {
            const r = rows[0];
            const gender: 'male' | 'female' = (r.gender as 'male' | 'female') || 'male';
            return {
              id: r.id,
              email: r.email || '',
              username: r.username,
              displayName: r.displayName || r.username,
              gender,
              avatarUrl: r.avatarUrl || (gender === 'female' ? FEMALE_DEFAULT_AVATAR : MALE_DEFAULT_AVATAR),
              walletAddress: r.walletAddress || undefined,
              coins: r.coins,
              diamonds: r.diamonds,
              createdAt: r.createdAt.toISOString(),
            };
          }
        }
      } catch (err) {
        Logger.warn(`Postgres getUserById error: ${String(err)}`);
      }
    }

    const cached = inMemoryUsers.find((u) => u.id === userId);
    if (cached) {
      return {
        id: cached.id,
        email: cached.email,
        username: cached.username,
        displayName: cached.displayName,
        gender: cached.gender || 'male',
        avatarUrl: cached.avatarUrl,
        walletAddress: cached.walletAddress,
        coins: cached.coins,
        diamonds: cached.diamonds,
        createdAt: cached.createdAt,
      };
    }

    return null;
  }
}
