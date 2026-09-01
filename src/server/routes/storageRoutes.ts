import { Router, Request, Response } from 'express';
import multer from 'multer';
import { uploadToR2, getObjectFromR2, generatePresignedUploadUrl } from '../storage/r2Client';
import { AuthService } from '../services/authService';
import { Logger } from '../config/env';
import path from 'path';

export const storageRouter = Router();

function resolveUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const verified = AuthService.verifyToken(authHeader.substring(7));
    if (verified?.userId) return verified.userId;
  }
  const headerUser = req.headers['x-user-id'] as string;
  const queryUser = req.query.userId as string;
  const bodyUser = req.body?.userId as string;
  return bodyUser || headerUser || queryUser || 'anonymous';
}

// Configure memory storage for standard multipart uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
  },
  fileFilter: (_req, file, cb) => {
    // Allow standard image receipts, avatars, and documents
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif', 'application/pdf'];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPEG, PNG, WEBP) and receipts are accepted.'));
    }
  },
});

/**
 * POST /api/storage/upload
 * Multi-part form upload directly to Cloudflare R2 with automatic fallback
 * Prefixes all uploads with user's unique 10-digit ID
 */
storageRouter.post('/api/storage/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded in form data' });
      return;
    }

    const userId = resolveUserId(req);
    const cleanUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '') || 'anonymous';
    const rawCategory = (req.body.category as string) || 'payment_receipts';
    const category = rawCategory === 'avatars' ? 'avatars' : 'payments';
    
    const ext = path.extname(req.file.originalname) || `.${req.file.mimetype.split('/')[1] || 'jpg'}`;
    const cleanExt = ext.startsWith('.') ? ext.replace('jpeg', 'jpg') : `.${ext.replace('jpeg', 'jpg')}`;
    
    const uniqueKey = category === 'avatars'
      ? `${cleanUserId}/avatars/avatar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${cleanExt}`
      : `${cleanUserId}/payments/receipt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${cleanExt}`;

    const uploadResult = await uploadToR2({
      key: uniqueKey,
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      userId: cleanUserId,
      category,
    });

    Logger.info(`[R2 STORAGE] Uploaded file for user ${cleanUserId} to Cloudflare R2: ${uniqueKey}`);

    res.json({
      success: true,
      url: uploadResult.url,
      key: uploadResult.key,
      sizeBytes: uploadResult.sizeBytes,
      contentType: uploadResult.contentType,
      userId: cleanUserId,
      storage: 'Cloudflare R2',
    });
  } catch (err: any) {
    Logger.error('Storage upload route error', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to upload file to storage' });
  }
});

/**
 * GET /api/storage/file/:key(*)
 * Stream object directly from Cloudflare R2 or local disk storage
 */
storageRouter.get('/api/storage/file/:key(*)', async (req: Request, res: Response): Promise<void> => {
  try {
    const key = req.params.key;
    if (!key) {
      res.status(400).json({ error: 'Missing object key' });
      return;
    }

    const objectData = await getObjectFromR2(key);
    if (!objectData) {
      res.status(404).json({ error: 'File not found in storage' });
      return;
    }

    res.setHeader('Content-Type', objectData.contentType);
    if (objectData.contentLength) {
      res.setHeader('Content-Length', objectData.contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    objectData.stream.pipe(res);
  } catch (err: any) {
    Logger.error('Storage file retrieve route error', err);
    res.status(500).json({ error: err?.message || 'Failed to retrieve storage object' });
  }
});

/**
 * POST /api/storage/presigned-url
 * Generate presigned URL for direct client-to-R2 uploads
 */
storageRouter.post('/api/storage/presigned-url', async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, contentType } = req.body;
    if (!key || !contentType) {
      res.status(400).json({ success: false, error: 'key and contentType are required' });
      return;
    }

    const presigned = await generatePresignedUploadUrl({
      key,
      contentType,
    });

    res.json({
      success: true,
      ...presigned,
    });
  } catch (err: any) {
    Logger.warn('Presigned upload URL generation fallback notice', { error: String(err) });
    // If R2 credentials not fully active, fallback to internal upload route
    res.json({
      success: true,
      uploadUrl: '/api/storage/upload',
      key: req.body.key,
      finalUrl: `/api/storage/file/${encodeURIComponent(req.body.key)}`,
    });
  }
});
