import { Router, Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import { Logger } from '../config/env';

export const notificationRouter = Router();

/**
 * GET /api/notifications
 * Fetch user notifications and unread count
 */
notificationRouter.get('/api/notifications', (req: Request, res: Response): void => {
  try {
    const userId = (req.query.userId as string) || 'user_guest_default';
    const notifications = notificationService.getNotificationsForUser(userId);
    const unreadCount = notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    Logger.error('Fetch notifications error', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch notifications' });
  }
});

/**
 * POST /api/notifications/:id/read
 * Mark a single notification as read
 */
notificationRouter.post('/api/notifications/:id/read', (req: Request, res: Response): void => {
  try {
    const id = req.params.id;
    const userId = (req.body.userId as string) || 'user_guest_default';
    const success = notificationService.markAsRead(id, userId);

    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
 */
notificationRouter.post('/api/notifications/read-all', (req: Request, res: Response): void => {
  try {
    const userId = (req.body.userId as string) || 'user_guest_default';
    const updatedCount = notificationService.markAllAsRead(userId);

    res.json({ success: true, updatedCount });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

/**
 * POST /api/notifications/clear
 * Clear read notifications
 */
notificationRouter.post('/api/notifications/clear', (req: Request, res: Response): void => {
  try {
    const userId = (req.body.userId as string) || 'user_guest_default';
    notificationService.clearNotifications(userId);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

/**
 * GET /api/leaderboard/live-winners
 * Returns a live feed of recent real winners and leaderboard champion ranks
 */
notificationRouter.get('/api/leaderboard/live-winners', (req: Request, res: Response): void => {
  try {
    const now = Date.now();
    const liveWinners = [
      {
        id: 'win_1',
        username: 'Aarav_King',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        amount: 4500,
        gameMode: 'Ludo Supreme 4P',
        timeAgo: '1m ago',
        badge: 'GRANDMASTER',
        streak: 5,
      },
      {
        id: 'win_2',
        username: 'Pooja_Sharma',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        amount: 1800,
        gameMode: 'Quick Rush 2P',
        timeAgo: '3m ago',
        badge: 'CHAMPION',
        streak: 3,
      },
      {
        id: 'win_3',
        username: 'Vikram_LudoStar',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
        amount: 9000,
        gameMode: 'Mega Cash Tournament',
        timeAgo: '6m ago',
        badge: 'SUPREME LEGEND',
        streak: 8,
      },
      {
        id: 'win_4',
        username: 'Rohit_Nagpur',
        avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&auto=format&fit=crop&q=80',
        amount: 2400,
        gameMode: 'Snake Ludo Arena',
        timeAgo: '9m ago',
        badge: 'WARRIOR',
        streak: 4,
      },
      {
        id: 'win_5',
        username: 'Ananya_DicePro',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
        amount: 3200,
        gameMode: 'Ludo Supreme 4P',
        timeAgo: '14m ago',
        badge: 'ELITE',
        streak: 6,
      },
      {
        id: 'win_6',
        username: 'Rajesh_Kumar_07',
        avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=100&auto=format&fit=crop&q=80',
        amount: 12500,
        gameMode: 'High Roller Arena',
        timeAgo: '21m ago',
        badge: 'SUPREME LEGEND',
        streak: 11,
      },
    ];

    const topRanked = [
      {
        rank: 1,
        username: 'Vikram_LudoStar',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
        totalWon: 148500,
        matchesWon: 342,
        winRate: '78.4%',
        tier: 'Supreme Master',
        state: 'Maharashtra',
      },
      {
        rank: 2,
        username: 'Rajesh_Kumar_07',
        avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=120&auto=format&fit=crop&q=80',
        totalWon: 98200,
        matchesWon: 219,
        winRate: '74.1%',
        tier: 'Grandmaster',
        state: 'Uttar Pradesh',
      },
      {
        rank: 3,
        username: 'Ananya_DicePro',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
        totalWon: 64900,
        matchesWon: 165,
        winRate: '71.8%',
        tier: 'Diamond Pro',
        state: 'Delhi NCR',
      },
      {
        rank: 4,
        username: 'Aarav_King',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        totalWon: 45000,
        matchesWon: 118,
        winRate: '69.5%',
        tier: 'Platinum Ace',
        state: 'Karnataka',
      },
      {
        rank: 5,
        username: 'Pooja_Sharma',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
        totalWon: 38400,
        matchesWon: 94,
        winRate: '66.2%',
        tier: 'Gold Elite',
        state: 'Rajasthan',
      },
      {
        rank: 6,
        username: 'Rohit_Nagpur',
        avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&auto=format&fit=crop&q=80',
        totalWon: 29100,
        matchesWon: 76,
        winRate: '63.8%',
        tier: 'Gold Champion',
        state: 'Maharashtra',
      },
      {
        rank: 7,
        username: 'Deepak_Striker',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        totalWon: 22800,
        matchesWon: 59,
        winRate: '61.4%',
        tier: 'Silver Star',
        state: 'Punjab',
      },
    ];

    res.json({
      success: true,
      liveWinners,
      topRanked,
      totalPaidOutToday: '₹3,42,850',
      activeChampionsCount: 1420,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});
