import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { AuthService } from '../services/authService';
import { uploadToR2 } from '../storage/r2Client';
import { Logger } from '../config/env';

export const authRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, GIF) are allowed for profile pictures.'));
    }
  },
});

const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  gender: z.enum(['male', 'female']).optional().default('male'),
});

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/register
 * Creates a new permanent user record in PostgreSQL with unique 10-digit User ID, gender default avatar, and provisions wallet
 */
authRouter.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const parsed = RegisterSchema.parse(req.body);
    const result = await AuthService.register({
      email: parsed.email,
      password: parsed.password,
      gender: parsed.gender,
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (err: any) {
    Logger.warn('Registration validation failed', err);
    res.status(400).json({ success: false, error: err.message || 'Invalid registration data' });
  }
});

/**
 * POST /api/auth/avatar
 * Uploads user profile picture from device to Cloudflare R2 storage inside their user ID
 */
authRouter.post('/api/auth/avatar', upload.single('avatar'), async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let userId = (req.body.userId as string) || (req.headers['x-user-id'] as string);

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const verified = AuthService.verifyToken(token);
      if (verified) {
        userId = verified.userId;
      }
    }

    if (!userId) {
      res.status(401).json({ success: false, error: 'User ID or valid authorization token required' });
      return;
    }

    let finalAvatarUrl: string;

    if (req.file) {
      // 1. Upload device image file to Cloudflare R2 under avatars/{userId}/
      const ext = path.extname(req.file.originalname) || '.jpg';
      const objectKey = `avatars/${userId}/avatar_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;

      const uploadResult = await uploadToR2({
        key: objectKey,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        userId,
        category: 'avatars',
      });

      finalAvatarUrl = uploadResult.url;
    } else if (req.body.avatarUrl) {
      finalAvatarUrl = req.body.avatarUrl;
    } else {
      res.status(400).json({ success: false, error: 'No image file or avatarUrl provided' });
      return;
    }

    // 2. Persist updated avatar in PostgreSQL and memory cache
    const updatedUser = await AuthService.updateAvatar(userId, finalAvatarUrl);
    if (!updatedUser) {
      res.status(404).json({ success: false, error: 'User account not found' });
      return;
    }

    Logger.info(`[AUTH] Updated avatar for user ${userId} to ${finalAvatarUrl}`);
    res.json({
      success: true,
      user: updatedUser,
      avatarUrl: finalAvatarUrl,
      message: 'Profile picture successfully updated in Cloudflare R2 storage.',
    });
  } catch (err: any) {
    Logger.error('Avatar upload failed', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to update profile picture' });
  }
});

/**
 * POST /api/auth/login
 * Validates user credentials against PostgreSQL and returns session token + user profile
 */
authRouter.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const parsed = LoginSchema.parse(req.body);
    const result = await AuthService.login({
      email: parsed.email,
      password: parsed.password,
    });

    if (!result.success) {
      res.status(401).json(result);
      return;
    }

    res.json(result);
  } catch (err: any) {
    Logger.warn('Login validation failed', err);
    res.status(400).json({ success: false, error: err.message || 'Invalid login data' });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
authRouter.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const headerUserId = req.headers['x-user-id'] as string;
    const queryUserId = req.query.userId as string;

    let targetUserId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const verified = AuthService.verifyToken(token);
      if (verified) {
        targetUserId = verified.userId;
      }
    }

    if (!targetUserId) {
      targetUserId = headerUserId || queryUserId || null;
    }

    if (!targetUserId) {
      res.status(401).json({ success: false, error: 'Unauthorized. No active user session.' });
      return;
    }

    const user = await AuthService.getUserById(targetUserId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User profile not found.' });
      return;
    }

    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
});

/**
 * GET /api/auth/user/:userId
 * Public endpoint to fetch player username and avatar by ID
 */
authRouter.get('/api/auth/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await AuthService.getUserById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Publicly safe profile without sensitive attributes
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        coins: user.coins,
        diamonds: user.diamonds,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
