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
  rewardAmount: string; // "20.00"
  rewardCredited: boolean;
  rewardCreditedAt?: string;
  createdAt: string;
}

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

export class ReferralClientService {
  /**
   * Fetch live user referral statistics and invited list
   */
  public static async getUserReferralProfile(userId: string = 'user_guest_default'): Promise<UserReferralProfile | null> {
    try {
      const res = await fetch(`/api/referrals/user/${encodeURIComponent(userId)}?_t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success && data.profile) {
        return data.profile;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Apply friend's referral code with anti-fraud backend validation
   */
  public static async applyReferralCode(
    code: string,
    userId: string = 'user_guest_default'
  ): Promise<{ success: boolean; message: string; referral?: ReferralItem }> {
    try {
      const res = await fetch('/api/referrals/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message, referral: data.referral };
      }
      return { success: false, message: data.error || 'Failed to apply referral code.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error applying referral code.' };
    }
  }

  /**
   * Record match event for anti-fraud condition 2 qualification
   */
  public static async recordMatchEvent(
    userId: string = 'user_guest_default',
    gameId?: string
  ): Promise<void> {
    try {
      await fetch('/api/referrals/event/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, gameId }),
      });
    } catch {
      // silent fallback
    }
  }

  /**
   * Record deposit event for anti-fraud condition 1 qualification
   */
  public static async recordDepositEvent(
    amount: number,
    userId: string = 'user_guest_default'
  ): Promise<void> {
    try {
      await fetch('/api/referrals/event/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount }),
      });
    } catch {
      // silent fallback
    }
  }
}
