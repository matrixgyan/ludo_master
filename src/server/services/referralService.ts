import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getDbPool, isPostgresConfigured } from '../db/client';
import { Logger } from '../config/env';
import { notificationService } from './notificationService';
import { wsServerInstance } from '../websocket/wsServer';

export interface UserReferralProfile {
  userId: string;
  code: string;
  totalEarned: number;
  totalInvited: number;
  totalQualified: number;
  pendingCount: number;
  referralsList: ReferralItem[];
  referredBy?: {
    code: string;
    referrerId: string;
    status: 'PENDING' | 'COMPLETED';
    depositCompleted: boolean;
    firstMatchPlayed: boolean;
  };
}

export interface ReferralItem {
  id: string;
  referrerId: string;
  refereeId: string;
  referralCode: string;
  refereeName?: string;
  refereeAvatar?: string;
  status: 'PENDING' | 'QUALIFIED' | 'COMPLETED' | 'FLAGGED';
  depositCompleted: boolean;
  depositAmount: string;
  depositCompletedAt?: string;
  firstMatchPlayed: boolean;
  matchGameId?: string;
  firstMatchPlayedAt?: string;
  rewardAmount: string; // 20.00
  rewardCredited: boolean;
  rewardCreditedAt?: string;
  rewardTxId?: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralCodeItem {
  userId: string;
  code: string;
  totalEarned: string;
  totalInvited: number;
  totalQualified: number;
  createdAt: string;
  updatedAt: string;
}

const dataDir = path.join(process.cwd(), 'data');
const referralsFilePath = path.join(dataDir, 'referrals.json');
const referralCodesFilePath = path.join(dataDir, 'referral_codes.json');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch {
      // ignore
    }
  }
}

// In-memory persistent cache with disk backup
let inMemoryReferralCodes: ReferralCodeItem[] = [];
let inMemoryReferrals: ReferralItem[] = [];

try {
  ensureDataDir();
  if (fs.existsSync(referralCodesFilePath)) {
    const raw = fs.readFileSync(referralCodesFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      inMemoryReferralCodes = parsed;
    }
  }
  if (fs.existsSync(referralsFilePath)) {
    const raw = fs.readFileSync(referralsFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      inMemoryReferrals = parsed;
    }
  }
} catch {
  // ignore
}

function syncToDisk() {
  try {
    ensureDataDir();
    fs.writeFileSync(referralCodesFilePath, JSON.stringify(inMemoryReferralCodes, null, 2), 'utf-8');
    fs.writeFileSync(referralsFilePath, JSON.stringify(inMemoryReferrals, null, 2), 'utf-8');
  } catch (err) {
    Logger.warn(`[ReferralService] Could not sync to disk: ${String(err)}`);
  }
}

export class ReferralService {
  /**
   * Helper to ensure player's actual user ID is used as the referral code
   */
  private static getReferralCodeForUser(userId: string): string {
    return (userId || 'user_guest_default').trim();
  }

  /**
   * Get or create a permanent referral code for a user (Code IS player actual user ID)
   */
  public static async getOrCreateUserCode(userId: string): Promise<ReferralCodeItem> {
    const cleanUserId = (userId || 'user_guest_default').trim();
    let existing = inMemoryReferralCodes.find((rc) => rc.userId === cleanUserId);

    if (existing && existing.code !== cleanUserId) {
      existing.code = cleanUserId;
      syncToDisk();
    }

    if (!existing && isPostgresConfigured()) {
      try {
        const pool = getDbPool();
        if (pool) {
          const client = await pool.connect();
          try {
            const res = await client.query(
              `SELECT user_id, code, total_earned, total_invited, total_qualified, created_at, updated_at
               FROM referral_codes WHERE user_id = $1 LIMIT 1`,
              [cleanUserId]
            );
            if (res.rows.length > 0) {
              const row = res.rows[0];
              existing = {
                userId: row.user_id,
                code: cleanUserId, // Player actual user ID as refer code
                totalEarned: String(row.total_earned || '0.00000000'),
                totalInvited: Number(row.total_invited || 0),
                totalQualified: Number(row.total_qualified || 0),
                createdAt: new Date(row.created_at).toISOString(),
                updatedAt: new Date(row.updated_at).toISOString(),
              };
              // Keep DB synchronized with player actual user ID
              await client.query(`UPDATE referral_codes SET code = $1 WHERE user_id = $1`, [cleanUserId]);
              inMemoryReferralCodes.push(existing);
              syncToDisk();
            }
          } finally {
            client.release();
          }
        }
      } catch (err) {
        Logger.warn(`Postgres getOrCreateUserCode lookup error: ${String(err)}`);
      }
    }

    if (!existing) {
      existing = {
        userId: cleanUserId,
        code: cleanUserId, // Player actual user ID as refer code
        totalEarned: '0.00000000',
        totalInvited: 0,
        totalQualified: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      inMemoryReferralCodes.push(existing);
      syncToDisk();

      if (isPostgresConfigured()) {
        try {
          const pool = getDbPool();
          if (pool) {
            const client = await pool.connect();
            try {
              // Ensure user exists first with explicit conflict target
              await client.query(
                `INSERT INTO users (id, username, display_name) VALUES ($1, $1, $1) ON CONFLICT (id) DO NOTHING`,
                [cleanUserId]
              );

              await client.query(
                `INSERT INTO referral_codes (user_id, code, total_earned, total_invited, total_qualified)
                 VALUES ($1, $1, '0.00000000', 0, 0)
                 ON CONFLICT (user_id) DO UPDATE SET code = $1`,
                [cleanUserId]
              );
            } finally {
              client.release();
            }
          }
        } catch (err) {
          Logger.warn(`Postgres insert referral code error: ${String(err)}`);
        }
      }
    }

    return existing;
  }

  /**
   * Get full user referral profile with stats and real invite progress
   */
  public static async getUserProfile(userId: string): Promise<UserReferralProfile> {
    const cleanUserId = (userId || 'user_guest_default').trim();
    const codeObj = await this.getOrCreateUserCode(cleanUserId);

    // Get referrals where this user is the referrer
    const userReferrals = inMemoryReferrals
      .filter((r) => r.referrerId === cleanUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Check if this user was referred by someone else
    const incomingReferral = inMemoryReferrals.find((r) => r.refereeId === cleanUserId);

    const totalEarned = parseFloat(codeObj.totalEarned) || 0;
    const totalInvited = userReferrals.length;
    const totalQualified = userReferrals.filter((r) => r.status === 'COMPLETED' || r.rewardCredited).length;
    const pendingCount = userReferrals.filter((r) => r.status === 'PENDING' && !r.rewardCredited).length;

    return {
      userId: cleanUserId,
      code: codeObj.code,
      totalEarned,
      totalInvited,
      totalQualified,
      pendingCount,
      referralsList: userReferrals,
      referredBy: incomingReferral
        ? {
            code: incomingReferral.referralCode,
            referrerId: incomingReferral.referrerId,
            status: incomingReferral.status as any,
            depositCompleted: incomingReferral.depositCompleted,
            firstMatchPlayed: incomingReferral.firstMatchPlayed,
          }
        : undefined,
    };
  }

  /**
   * Apply a referral code (Referee binds to Referrer)
   * Enforces strict Anti-Fraud validations:
   * 1. Cannot use own code
   * 2. Cannot apply multiple codes (1 referral per user lifetime)
   * 3. Cannot do circular referral
   * 4. Code must exist
   */
  public static async applyReferralCode(
    refereeId: string,
    code: string,
    ipAddress?: string
  ): Promise<{ success: boolean; message: string; referral?: ReferralItem }> {
    const cleanRefereeId = (refereeId || '').trim();
    const cleanCode = (code || '').trim().toUpperCase();

    if (!cleanRefereeId) {
      throw new Error('User ID is required.');
    }
    if (!cleanCode) {
      throw new Error('Please enter a referral code.');
    }

    // 1. Find referrer by code or user ID (case-insensitive)
    let referrerCodeObj = inMemoryReferralCodes.find(
      (rc) => rc.code.toLowerCase() === cleanCode.toLowerCase() || rc.userId.toLowerCase() === cleanCode.toLowerCase()
    );

    if (!referrerCodeObj && isPostgresConfigured()) {
      try {
        const pool = getDbPool();
        if (pool) {
          const client = await pool.connect();
          try {
            // First check referral_codes table
            const res = await client.query(
              `SELECT user_id, code, total_earned, total_invited, total_qualified, created_at, updated_at
               FROM referral_codes 
               WHERE LOWER(code) = LOWER($1) OR LOWER(user_id) = LOWER($1)
               LIMIT 1`,
              [cleanCode]
            );
            if (res.rows.length > 0) {
              const row = res.rows[0];
              referrerCodeObj = {
                userId: row.user_id,
                code: row.user_id, // Player actual user ID as refer code
                totalEarned: String(row.total_earned || '0.00000000'),
                totalInvited: Number(row.total_invited || 0),
                totalQualified: Number(row.total_qualified || 0),
                createdAt: new Date(row.created_at).toISOString(),
                updatedAt: new Date(row.updated_at).toISOString(),
              };
              inMemoryReferralCodes.push(referrerCodeObj);
            } else {
              // If not yet in referral_codes, check if user exists in users table
              const userRes = await client.query(
                `SELECT id, username FROM users WHERE LOWER(id) = LOWER($1) OR LOWER(username) = LOWER($1) LIMIT 1`,
                [cleanCode]
              );
              if (userRes.rows.length > 0) {
                const targetUserId = userRes.rows[0].id;
                referrerCodeObj = await ReferralService.getOrCreateUserCode(targetUserId);
              }
            }
          } finally {
            client.release();
          }
        }
      } catch (err) {
        Logger.warn(`Postgres lookup referralCode error: ${String(err)}`);
      }
    }

    if (!referrerCodeObj) {
      throw new Error('Invalid referral code. Please check and try again.');
    }

    // Anti-Fraud Check 1: Cannot refer oneself
    if (referrerCodeObj.userId === cleanRefereeId) {
      throw new Error('You cannot use your own referral code.');
    }

    // Anti-Fraud Check 2: Referee has already applied a referral code
    const alreadyReferred = inMemoryReferrals.find((r) => r.refereeId === cleanRefereeId);
    if (alreadyReferred) {
      throw new Error(`You have already applied a referral code (${alreadyReferred.referralCode}).`);
    }

    // Anti-Fraud Check 3: Circular referral prevention
    const circularCheck = inMemoryReferrals.find(
      (r) => r.refereeId === referrerCodeObj!.userId && r.referrerId === cleanRefereeId
    );
    if (circularCheck) {
      throw new Error('Circular referral detected. Cross-referrals are not permitted.');
    }

    const referralItem: ReferralItem = {
      id: `ref_${uuidv4().slice(0, 12)}`,
      referrerId: referrerCodeObj.userId,
      refereeId: cleanRefereeId,
      referralCode: cleanCode,
      refereeName: `User ${cleanRefereeId.slice(0, 6)}`,
      refereeAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      status: 'PENDING',
      depositCompleted: false,
      depositAmount: '0.00',
      firstMatchPlayed: false,
      rewardAmount: '20.00',
      rewardCredited: false,
      ipAddress: ipAddress || '127.0.0.1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryReferrals.unshift(referralItem);
    referrerCodeObj.totalInvited += 1;
    referrerCodeObj.updatedAt = new Date().toISOString();
    syncToDisk();

    // Persist to Postgres
    if (isPostgresConfigured()) {
      try {
        const pool = getDbPool();
        if (pool) {
          const client = await pool.connect();
          try {
            // Ensure users exist
            await client.query(
              `INSERT INTO users (id, username, display_name) VALUES ($1, $1, $1) ON CONFLICT (id) DO NOTHING`,
              [cleanRefereeId]
            );
            await client.query(
              `INSERT INTO users (id, username, display_name) VALUES ($1, $1, $1) ON CONFLICT (id) DO NOTHING`,
              [referrerCodeObj.userId]
            );

            await client.query(
              `INSERT INTO referrals (id, referrer_id, referee_id, referral_code, status, deposit_completed, deposit_amount, first_match_played, reward_amount, reward_credited, ip_address)
               VALUES ($1, $2, $3, $4, 'PENDING', false, '0.00000000', false, '20.00000000', false, $5)
               ON CONFLICT (id) DO NOTHING`,
              [
                referralItem.id,
                referralItem.referrerId,
                referralItem.refereeId,
                referralItem.referralCode,
                referralItem.ipAddress || '127.0.0.1',
              ]
            );

            await client.query(
              `UPDATE referral_codes SET total_invited = $1, updated_at = NOW() WHERE user_id = $2`,
              [referrerCodeObj.totalInvited, referrerCodeObj.userId]
            );
          } finally {
            client.release();
          }
        }
      } catch (err) {
        Logger.warn(`Postgres insert referral error: ${String(err)}`);
      }
    }

    // Send notifications to both users
    notificationService.addNotification({
      userId: referrerCodeObj.userId,
      type: 'REFERRAL_REWARD',
      title: '👥 New Friend Joined via Your Code!',
      message: `A new player joined using your code ${cleanCode}. Your ₹20 reward will be credited once they complete a deposit and play 1 match.`,
      referenceId: referralItem.id,
    });

    notificationService.addNotification({
      userId: cleanRefereeId,
      type: 'REFERRAL_REWARD',
      title: '✅ Referral Code Linked!',
      message: `Referral code ${cleanCode} has been successfully applied to your account.`,
      referenceId: referralItem.id,
    });

    // Realtime notification
    try {
      wsServerInstance.broadcastAll({
        type: 'REFERRAL_LINKED',
        referrerId: referrerCodeObj.userId,
        refereeId: cleanRefereeId,
        referralCode: cleanCode,
      });
    } catch {
      // ignore
    }

    return {
      success: true,
      message: `Referral code ${cleanCode} linked! Reward unlocks when you complete a deposit & play 1 match.`,
      referral: referralItem,
    };
  }

  /**
   * Event Handler 1: Triggered when a user completes a deposit
   */
  public static async recordDepositEvent(userId: string, depositAmount: number): Promise<void> {
    const cleanUserId = (userId || '').trim();
    if (!cleanUserId || isNaN(depositAmount) || depositAmount <= 0) return;

    // Check if this user was referred by someone and hasn't had deposit verified yet
    const pendingReferral = inMemoryReferrals.find(
      (r) => r.refereeId === cleanUserId && !r.depositCompleted && !r.rewardCredited
    );

    if (!pendingReferral) return;

    pendingReferral.depositCompleted = true;
    pendingReferral.depositAmount = depositAmount.toFixed(2);
    pendingReferral.depositCompletedAt = new Date().toISOString();
    pendingReferral.updatedAt = new Date().toISOString();
    syncToDisk();

    Logger.info(`🛡️ [Referral] User ${cleanUserId} verified deposit ₹${depositAmount}. Condition 1 met!`);

    // Check if Condition 2 (First Match Played) is also satisfied!
    if (pendingReferral.firstMatchPlayed) {
      await this.unlockAndCreditReward(pendingReferral);
    } else {
      // Inform referrer of 50% progress
      notificationService.addNotification({
        userId: pendingReferral.referrerId,
        type: 'REFERRAL_REWARD',
        title: '⚡ Referral Step 1/2 Completed!',
        message: `Your friend deposited ₹${depositAmount}. Your ₹20 reward will unlock as soon as they play their 1st match!`,
        referenceId: pendingReferral.id,
      });
    }
  }

  /**
   * Event Handler 2: Triggered when a user plays a match
   */
  public static async recordMatchPlayedEvent(userId: string, gameId?: string): Promise<void> {
    const cleanUserId = (userId || '').trim();
    if (!cleanUserId) return;

    // Check if this user was referred by someone and hasn't had first match verified yet
    const pendingReferral = inMemoryReferrals.find(
      (r) => r.refereeId === cleanUserId && !r.firstMatchPlayed && !r.rewardCredited
    );

    if (!pendingReferral) return;

    pendingReferral.firstMatchPlayed = true;
    pendingReferral.matchGameId = gameId || `match_${Date.now()}`;
    pendingReferral.firstMatchPlayedAt = new Date().toISOString();
    pendingReferral.updatedAt = new Date().toISOString();
    syncToDisk();

    Logger.info(`🛡️ [Referral] User ${cleanUserId} played their 1st match. Condition 2 met!`);

    // Check if Condition 1 (Deposit Completed) is also satisfied!
    if (pendingReferral.depositCompleted) {
      await this.unlockAndCreditReward(pendingReferral);
    } else {
      // Inform referrer of 50% progress
      notificationService.addNotification({
        userId: pendingReferral.referrerId,
        type: 'REFERRAL_REWARD',
        title: '⚡ Referral Step 1/2 Completed!',
        message: `Your friend played their 1st match. Your ₹20 reward will unlock as soon as they make a deposit!`,
        referenceId: pendingReferral.id,
      });
    }
  }

  /**
   * Production-grade Final Reward Unlock & Wallet Balance Credit
   * Credits ₹20 straight into the referrer's wallet!
   */
  private static async unlockAndCreditReward(referral: ReferralItem): Promise<void> {
    if (referral.rewardCredited || referral.status === 'COMPLETED') {
      return;
    }

    referral.status = 'COMPLETED';
    referral.rewardCredited = true;
    referral.rewardCreditedAt = new Date().toISOString();
    referral.rewardTxId = `ref_reward_${referral.id}`;
    referral.updatedAt = new Date().toISOString();

    const rewardNum = parseFloat(referral.rewardAmount) || 20.0;

    // Update referrer's code stats
    const referrerCodeObj = inMemoryReferralCodes.find((rc) => rc.userId === referral.referrerId);
    if (referrerCodeObj) {
      const currentEarned = parseFloat(referrerCodeObj.totalEarned) || 0;
      referrerCodeObj.totalEarned = (currentEarned + rewardNum).toFixed(8);
      referrerCodeObj.totalQualified += 1;
      referrerCodeObj.updatedAt = new Date().toISOString();
    }

    syncToDisk();

    // 1. Credit Referrer Wallet via Double-Entry Ledger & Fiat Balance
    try {
      const { LedgerService } = await import('../wallet/ledgerService');
      await LedgerService.creditDeposit(
        referral.referrerId,
        rewardNum.toFixed(8),
        referral.rewardTxId,
        {
          type: 'REFERRAL_BONUS_20_INR',
          refereeId: referral.refereeId,
          referralId: referral.id,
        }
      );
      Logger.info(`💰 [Referral Reward] Successfully credited ₹${rewardNum} to referrer ${referral.referrerId}`);
    } catch (err) {
      Logger.warn(`LedgerService referral credit error: ${String(err)}`);
    }

    // 2. Persist to Postgres
    if (isPostgresConfigured()) {
      try {
        const pool = getDbPool();
        if (pool) {
          const client = await pool.connect();
          try {
            await client.query(
              `UPDATE referrals
               SET status = 'COMPLETED', deposit_completed = true, first_match_played = true,
                   reward_credited = true, reward_credited_at = NOW(), reward_tx_id = $1, updated_at = NOW()
               WHERE id = $2`,
              [referral.rewardTxId, referral.id]
            );

            if (referrerCodeObj) {
              await client.query(
                `UPDATE referral_codes
                 SET total_earned = $1, total_qualified = $2, updated_at = NOW()
                 WHERE user_id = $3`,
                [referrerCodeObj.totalEarned, referrerCodeObj.totalQualified, referral.referrerId]
              );
            }
          } finally {
            client.release();
          }
        }
      } catch (err) {
        Logger.warn(`Postgres update referral complete error: ${String(err)}`);
      }
    }

    // 3. Send celebratory rich notification to Referrer
    notificationService.addNotification({
      userId: referral.referrerId,
      type: 'REFERRAL_REWARD',
      title: '🎉 ₹20 Referral Reward Credited!',
      message: `Your friend made their 1st deposit and played a match. ₹20 Cash Reward has been credited directly to your wallet!`,
      amount: '20.00',
      referenceId: referral.id,
    });

    // 4. Realtime broadcast for zero-latency wallet balance & referral sync
    try {
      wsServerInstance.broadcastAll({
        type: 'REFERRAL_REWARD_CREDITED',
        referrerId: referral.referrerId,
        refereeId: referral.refereeId,
        amount: rewardNum,
        currency: 'INR',
        timestamp: new Date().toISOString(),
      });
      wsServerInstance.broadcastAll({
        type: 'WALLET_BALANCE_UPDATED',
        userId: referral.referrerId,
        delta: rewardNum,
      });
    } catch {
      // ignore
    }
  }

  /**
   * Admin: Get all referrals and stats
   */
  public static async getAllReferrals(): Promise<ReferralItem[]> {
    return inMemoryReferrals;
  }

  /**
   * Get top referrers from real database (100% genuine database data, no mocks)
   */
  public static async getTopReferrers(): Promise<Array<{
    rank: number;
    userId: string;
    username: string;
    avatar: string;
    totalEarned: number;
    totalInvited: number;
    totalQualified: number;
  }>> {
    const pool = getDbPool();
    if (!pool || !isPostgresConfigured()) {
      return inMemoryReferralCodes
        .sort((a, b) => (parseFloat(b.totalEarned) || 0) - (parseFloat(a.totalEarned) || 0))
        .slice(0, 15)
        .map((rc, idx) => ({
          rank: idx + 1,
          userId: rc.userId,
          username: rc.userId,
          avatar: '',
          totalEarned: parseFloat(rc.totalEarned) || 0,
          totalInvited: rc.totalInvited || 0,
          totalQualified: rc.totalQualified || 0,
        }));
    }

    try {
      const res = await pool.query(`
        SELECT 
          rc.user_id,
          rc.code,
          rc.total_earned,
          rc.total_invited,
          rc.total_qualified,
          COALESCE(NULLIF(u.username, ''), NULLIF(u.display_name, ''), rc.user_id) AS username,
          COALESCE(u.avatar_url, '') AS avatar_url
        FROM referral_codes rc
        LEFT JOIN users u ON u.id = rc.user_id
        ORDER BY rc.total_earned DESC, rc.total_invited DESC, rc.created_at ASC
        LIMIT 25;
      `);

      return res.rows.map((row, idx) => ({
        rank: idx + 1,
        userId: row.user_id,
        username: row.username,
        avatar: row.avatar_url,
        totalEarned: parseFloat(row.total_earned) || 0,
        totalInvited: parseInt(row.total_invited, 10) || 0,
        totalQualified: parseInt(row.total_qualified, 10) || 0,
      }));
    } catch (err) {
      Logger.warn(`Error getting top referrers: ${String(err)}`);
      return [];
    }
  }
}
