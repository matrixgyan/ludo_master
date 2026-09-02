import { Router, Request, Response } from 'express';
import multer from 'multer';
import { uploadToR2, getObjectFromR2, generatePresignedUploadUrl } from '../storage/r2Client';
import { Logger } from '../config/env';
import path from 'path';

export const storageRouter = Router();

// Configure memory storage for standard multipart uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
  },
  fileFilter: (_req, file, cb) => {
    // Allow standard image receipts and documents
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
 */
storageRouter.post('/api/storage/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded in form data' });
      return;
    }

    const category = (req.body.category as string) || 'payment_receipts';
    const userId = (req.body.userId as string) || 'anonymous';
    const ext = path.extname(req.file.originalname) || '.jpg';
    const uniqueKey = `${category}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;

    const uploadResult = await uploadToR2({
      key: uniqueKey,
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      userId,
    });

    res.json({
      success: true,
      url: uploadResult.url,
      key: uploadResult.key,
      sizeBytes: uploadResult.sizeBytes,
      contentType: uploadResult.contentType,
    });
  } catch (err: any) {
    Logger.error('Storage upload route error', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to upload file to storage' });
  }
});

/**
 * GET /api/storage/file and /api/storage/file/*
 * Stream or return object directly from Cloudflare R2 or local disk storage
 */
storageRouter.get(
  ['/api/storage/file', '/api/storage/file/*', '/api/storage/file/:key(*)'],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Extract key from params, query, or originalUrl
      let key =
        (req.params as any)?.key ||
        (req.params as any)?.[0] ||
        (req.query.key as string) ||
        '';

      if (!key) {
        const urlPart = req.originalUrl || req.url || '';
        const match = urlPart.match(/\/api\/storage\/file\/(.+)$/);
        if (match && match[1]) {
          key = match[1];
        }
      }

      if (!key) {
        res.status(400).json({ error: 'Missing object key' });
        return;
      }

      const objectData = await getObjectFromR2(key);
      if (!objectData) {
        res.status(404).json({ error: 'File not found in storage' });
        return;
      }

      // Allow cross-origin image embedding
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Content-Type', objectData.contentType);
      if (objectData.contentLength) {
        res.setHeader('Content-Length', objectData.contentLength);
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

      if (objectData.buffer) {
        res.status(200).send(objectData.buffer);
      } else {
        objectData.stream.pipe(res);
      }
    } catch (err: any) {
      Logger.error('Storage file retrieve route error', err);
      res.status(500).json({ error: err?.message || 'Failed to retrieve storage object' });
    }
  }
);

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
