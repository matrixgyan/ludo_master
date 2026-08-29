import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../config/env';

export interface AppNotification {
  id: string;
  userId: string; // 'all' or specific userId
  type: 'DEPOSIT_SUBMITTED' | 'DEPOSIT_APPROVED' | 'DEPOSIT_REJECTED' | 'WITHDRAWAL_REQUESTED' | 'WITHDRAWAL_PROCESSED' | 'MATCH_WON' | 'ANNOUNCEMENT' | 'REFERRAL_REWARD';
  title: string;
  message: string;
  amount?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

// In-memory persistent store with rich default announcements and operational history
class NotificationStore {
  private notifications: AppNotification[] = [
    {
      id: 'notif_init_1',
      userId: 'all',
      type: 'ANNOUNCEMENT',
      title: '⚡ 24x7 Instant UPI Deposit & Payouts Live',
      message: 'Experience zero-fee deposits and instant bank withdrawals directly to any Indian UPI App or Bank account.',
      isRead: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif_init_2',
      userId: 'all',
      type: 'MATCH_WON',
      title: '🏆 Mega League Season #59 Open',
      message: 'Leaderboard prize pool of ₹1,00,000 is live! Play Ludo Supreme & Snake Ludo to claim your share.',
      isRead: false,
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif_init_3',
      userId: 'all',
      type: 'REFERRAL_REWARD',
      title: '🎁 Refer a Friend & Get ₹20 Cash',
      message: 'Share your referral code. Earn ₹20 cash as soon as your friend completes their first deposit and plays a match!',
      isRead: false,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
  ];

  public getNotificationsForUser(userId: string): AppNotification[] {
    return this.notifications
      .filter((n) => n.userId === 'all' || n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getUnreadCount(userId: string): number {
    return this.notifications.filter(
      (n) => (n.userId === 'all' || n.userId === userId) && !n.isRead
    ).length;
  }

  public addNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): AppNotification {
    const newNotif: AppNotification = {
      id: `notif_${uuidv4().substring(0, 12)}`,
      ...notification,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(newNotif);
    // Keep max 200 notifications
    if (this.notifications.length > 200) {
      this.notifications = this.notifications.slice(0, 200);
    }
    Logger.info(`Notification generated: [${newNotif.type}] ${newNotif.title} for ${newNotif.userId}`);
    return newNotif;
  }

  public markAsRead(id: string, userId: string): boolean {
    const notif = this.notifications.find((n) => n.id === id && (n.userId === 'all' || n.userId === userId));
    if (notif) {
      notif.isRead = true;
      return true;
    }
    return false;
  }

  public markAllAsRead(userId: string): number {
    let count = 0;
    for (const notif of this.notifications) {
      if ((notif.userId === 'all' || notif.userId === userId) && !notif.isRead) {
        notif.isRead = true;
        count++;
      }
    }
    return count;
  }

  public clearNotifications(userId: string): void {
    this.notifications = this.notifications.filter(
      (n) => n.userId !== userId && !(n.userId === 'all' && n.isRead)
    );
  }
}

export const notificationService = new NotificationStore();
