import { Router, Request, Response } from 'express';
import { requireAdminAuth } from './adminApi';
import { Logger } from '../config/env';

export const themeConfigRouter = Router();

// In-memory persistent theme configuration state on the server
let serverThemeConfig = {
  activeLobbyId: 'dubai_prestige_gold',
  activeBoardId: 'dubai_royal_sunset',
  activeDiceId: 'golden_high_roller',
  activePawnId: 'royal_crowned',
  updatedAt: new Date().toISOString(),
  deployedBy: 'System Default',
};

// Public endpoint: Fetch current active platform game assets configuration
themeConfigRouter.get('/api/theme-config', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    success: true,
    themeConfig: serverThemeConfig,
  });
});

// Admin endpoint: Deploy theme configuration across live game matches
themeConfigRouter.post('/api/admin/theme-assets', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { activeLobbyId, activeBoardId, activeDiceId, activePawnId, deployedBy } = req.body;

    if (activeLobbyId) serverThemeConfig.activeLobbyId = activeLobbyId;
    if (activeBoardId) serverThemeConfig.activeBoardId = activeBoardId;
    if (activeDiceId) serverThemeConfig.activeDiceId = activeDiceId;
    if (activePawnId) serverThemeConfig.activePawnId = activePawnId;
    serverThemeConfig.updatedAt = new Date().toISOString();
    serverThemeConfig.deployedBy = deployedBy || 'Executive Admin';

    Logger.info('Applied live game assets theme configuration updated by Admin', serverThemeConfig);

    res.json({
      success: true,
      message: 'Visual assets successfully updated and applied across live matches!',
      themeConfig: serverThemeConfig,
    });
  } catch (err: any) {
    Logger.error('Failed to update live theme assets', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});
