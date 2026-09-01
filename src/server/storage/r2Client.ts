import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config, Logger } from '../config/env';
import { getDb, isPostgresConfigured } from '../db/client';
import { storageObjects } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

// Serverless-friendly global singleton caching across Vercel Lambda invocations
declare global {
  // eslint-disable-next-line no-var
  var __ludo_s3_client: S3Client | undefined;
}

const uploadsLocalDir = path.join(process.cwd(), 'data', 'uploads');

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsLocalDir)) {
    try {
      fs.mkdirSync(uploadsLocalDir, { recursive: true });
    } catch {
      // ignore
    }
  }
}

export function isR2Configured(): boolean {
  return Boolean(
    config.R2_ENDPOINT &&
    config.R2_ACCESS_KEY_ID &&
    config.R2_SECRET_ACCESS_KEY &&
    config.R2_BUCKET_NAME &&
    config.R2_ENDPOINT.trim().length > 0 &&
    config.R2_ACCESS_KEY_ID.trim().length > 0 &&
    config.R2_SECRET_ACCESS_KEY.trim().length > 0 &&
    config.R2_BUCKET_NAME.trim().length > 0
  );
}

export function getR2Client(): S3Client | null {
  if (!isR2Configured()) {
    return null;
  }

  if (!globalThis.__ludo_s3_client) {
    let endpoint = config.R2_ENDPOINT?.trim() || '';
    // Ensure endpoint has protocol
    if (endpoint && !endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      endpoint = `https://${endpoint}`;
    }

    globalThis.__ludo_s3_client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID!.trim(),
        secretAccessKey: config.R2_SECRET_ACCESS_KEY!.trim(),
      },
      forcePathStyle: true,
    });
  }

  return globalThis.__ludo_s3_client;
}

/**
 * Health check probe for Cloudflare R2 Object Storage
 */
export async function checkR2Health(): Promise<{
  status: 'healthy' | 'unhealthy' | 'unconfigured';
  latencyMs: number;
  bucket?: string;
  error?: string;
}> {
  if (!isR2Configured()) {
    return { status: 'unconfigured', latencyMs: 0 };
  }

  const client = getR2Client();
  if (!client) {
    return { status: 'unconfigured', latencyMs: 0 };
  }

  const start = Date.now();
  try {
    // Probe bucket accessibility
    await client.send(
      new ListObjectsV2Command({
        Bucket: config.R2_BUCKET_NAME,
        MaxKeys: 1,
      })
    );
    const latencyMs = Date.now() - start;
    return {
      status: 'healthy',
      latencyMs,
      bucket: config.R2_BUCKET_NAME,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);
    Logger.warn('Cloudflare R2 health probe failed', { error: errorMsg });
    return {
      status: 'unhealthy',
      latencyMs,
      bucket: config.R2_BUCKET_NAME,
      error: errorMsg,
    };
  }
}

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  sizeBytes: number;
  contentType: string;
}

/**
 * Upload buffer or stream directly to Cloudflare R2 bucket and record in PostgreSQL (with robust local disk fallback)
 * Uses the user's unique 10-digit ID as the file path prefix for organization, partitioning, and security.
 */
export async function uploadToR2(params: {
  key?: string;
  buffer: Buffer;
  contentType: string;
  userId?: string;
  category?: 'avatars' | 'images' | 'assets' | 'logs' | 'payment_receipts' | 'payments' | string;
}): Promise<UploadResult> {
  const category = params.category || 'payment_receipts';
  const extension = params.contentType.split('/')[1]?.split(';')[0]?.replace('jpeg', 'jpg') || 'jpg';
  
  // Format clean 10-digit ID prefix (e.g. 7849102834) for folder organization & security
  let userPrefix = 'anonymous';
  if (params.userId && params.userId.trim().length > 0) {
    userPrefix = params.userId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  }

  let objectKey = params.key;
  if (!objectKey) {
    const timestamp = Date.now();
    const uniqueSuffix = uuidv4().slice(0, 10);
    if (category === 'avatars') {
      objectKey = `${userPrefix}/avatars/avatar_${timestamp}_${uniqueSuffix}.${extension}`;
    } else if (category === 'payment_receipts' || category === 'payments' || category === 'screenshots') {
      objectKey = `${userPrefix}/payments/receipt_${timestamp}_${uniqueSuffix}.${extension}`;
    } else {
      objectKey = `${userPrefix}/${category}/${timestamp}_${uniqueSuffix}.${extension}`;
    }
  } else if (!objectKey.startsWith(`${userPrefix}/`)) {
    // Ensure 10-digit user prefix is formatted as root prefix
    objectKey = `${userPrefix}/${objectKey.replace(/^\/+/, '')}`;
  }

  const publicUrl = `/api/storage/file/${encodeURIComponent(objectKey)}`;

  // Always write local backup copy
  try {
    ensureUploadsDir();
    const safeLocalPath = path.join(uploadsLocalDir, objectKey.replace(/\//g, '_'));
    fs.writeFileSync(safeLocalPath, params.buffer);
  } catch (err) {
    Logger.warn(`Local upload file cache write error: ${String(err)}`);
  }

  if (isR2Configured()) {
    try {
      const client = getR2Client();
      if (client && config.R2_BUCKET_NAME) {
        await client.send(
          new PutObjectCommand({
            Bucket: config.R2_BUCKET_NAME,
            Key: objectKey,
            Body: params.buffer,
            ContentType: params.contentType,
            Metadata: {
              userId: userPrefix,
              category,
              uploadedAt: new Date().toISOString(),
            },
          })
        );
        Logger.info(`Successfully uploaded object to Cloudflare R2 bucket: ${objectKey} (${params.buffer.length} bytes, User: ${userPrefix})`);
      }
    } catch (err: unknown) {
      Logger.warn(`Cloudflare R2 putObject error, falling back to cached disk stream: ${String(err)}`);
    }
  }

  // Record in PostgreSQL if available
  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        await db.insert(storageObjects).values({
          id: `obj_${uuidv4()}`,
          key: objectKey,
          bucket: config.R2_BUCKET_NAME || 'local_storage',
          userId: userPrefix !== 'anonymous' ? userPrefix : null,
          contentType: params.contentType,
          sizeBytes: params.buffer.length,
          url: publicUrl,
          createdAt: new Date(),
        });
      }
    } catch (err) {
      Logger.warn(`Failed to persist storage metadata to PostgreSQL: ${String(err)}`);
    }
  }

  return {
    key: objectKey,
    url: publicUrl,
    bucket: config.R2_BUCKET_NAME || 'r2_storage',
    sizeBytes: params.buffer.length,
    contentType: params.contentType,
  };
}

/**
 * Generate Presigned Upload URL for browser direct uploads to Cloudflare R2
 */
export async function generatePresignedUploadUrl(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<{ uploadUrl: string; key: string; finalUrl: string }> {
  const client = getR2Client();
  if (!client || !config.R2_BUCKET_NAME) {
    throw new Error('Cloudflare R2 is not configured');
  }

  const command = new PutObjectCommand({
    Bucket: config.R2_BUCKET_NAME,
    Key: params.key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds || 300, // 5 minutes default
  });

  return {
    uploadUrl,
    key: params.key,
    finalUrl: `/api/storage/file/${encodeURIComponent(params.key)}`,
  };
}

/**
 * Fetch object stream from Cloudflare R2 or local cache for proxy serving
 */
export async function getObjectFromR2(rawKey: string): Promise<{
  stream: Readable;
  contentType: string;
  contentLength?: number;
} | null> {
  // Normalize key by stripping leading slash or decoding
  let key = rawKey.trim();
  try {
    key = decodeURIComponent(key);
  } catch {
    // keep raw if decode fails
  }
  if (key.startsWith('/')) key = key.slice(1);
  if (key.startsWith('api/storage/file/')) key = key.replace(/^api\/storage\/file\//, '');

  // 1. Try Cloudflare R2
  if (isR2Configured()) {
    const client = getR2Client();
    if (client && config.R2_BUCKET_NAME) {
      try {
        const response = await client.send(
          new GetObjectCommand({
            Bucket: config.R2_BUCKET_NAME,
            Key: key,
          })
        );

        if (response.Body) {
          let stream: Readable;
          // AWS SDK v3 Body can be IncomingMessage, ReadableStream, or stream-like
          if (typeof (response.Body as any).pipe === 'function') {
            stream = response.Body as Readable;
          } else if (typeof (response.Body as any).transformToByteArray === 'function') {
            const byteArray = await (response.Body as any).transformToByteArray();
            stream = Readable.from(Buffer.from(byteArray));
          } else {
            stream = response.Body as any;
          }

          return {
            stream,
            contentType: response.ContentType || 'image/jpeg',
            contentLength: response.ContentLength,
          };
        }
      } catch (err) {
        Logger.warn(`Object not found in Cloudflare R2: ${key}, checking local fallback...`);
      }
    }
  }

  // 2. Check Local File Storage fallback (try exact key, sanitized key, and filename only)
  try {
    ensureUploadsDir();
    const candidatePaths = [
      path.join(uploadsLocalDir, key.replace(/\//g, '_')),
      path.join(uploadsLocalDir, path.basename(key)),
      path.join(uploadsLocalDir, key),
    ];

    for (const safeLocalPath of candidatePaths) {
      if (fs.existsSync(safeLocalPath) && fs.statSync(safeLocalPath).isFile()) {
        const stats = fs.statSync(safeLocalPath);
        const stream = fs.createReadStream(safeLocalPath);
        const ext = path.extname(safeLocalPath).toLowerCase();
        let contentType = 'image/jpeg';
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.svg') contentType = 'image/svg+xml';
        else if (ext === '.pdf') contentType = 'application/pdf';

        return {
          stream,
          contentType,
          contentLength: stats.size,
        };
      }
    }
  } catch (err) {
    Logger.warn(`Local file read fallback error for ${key}: ${String(err)}`);
  }

  return null;
}

/**
 * Delete object from Cloudflare R2
 */
export async function deleteObjectFromR2(key: string): Promise<boolean> {
  if (isR2Configured()) {
    const client = getR2Client();
    if (client && config.R2_BUCKET_NAME) {
      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: config.R2_BUCKET_NAME,
            Key: key,
          })
        );
      } catch (err) {
        Logger.warn(`Failed to delete object from R2: ${key}`);
      }
    }
  }

  try {
    ensureUploadsDir();
    const safeLocalPath = path.join(uploadsLocalDir, key.replace(/\//g, '_'));
    if (fs.existsSync(safeLocalPath)) {
      fs.unlinkSync(safeLocalPath);
    }
  } catch {
    // ignore
  }

  return true;
}
