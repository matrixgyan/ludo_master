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

export interface ObjectData {
  buffer?: Buffer;
  stream: Readable;
  contentType: string;
  contentLength?: number;
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
    // Remove trailing slashes
    endpoint = endpoint.replace(/\/+$/, '');

    globalThis.__ludo_s3_client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID!.trim(),
        secretAccessKey: config.R2_SECRET_ACCESS_KEY!.trim(),
      },
      forcePathStyle: true,
      maxAttempts: 3,
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
 */
export async function uploadToR2(params: {
  key?: string;
  buffer: Buffer;
  contentType: string;
  userId?: string;
  category?: 'avatars' | 'images' | 'assets' | 'logs' | 'payment_receipts';
}): Promise<UploadResult> {
  const category = params.category || 'payment_receipts';
  const rawExt = params.contentType.split('/')[1]?.split(';')[0] || 'jpg';
  const extension = rawExt === 'jpeg' ? 'jpg' : rawExt;
  const objectKey = params.key || `${category}/${Date.now()}-${uuidv4().slice(0, 12)}.${extension}`;
  const publicUrl = `/api/storage/file/${encodeURIComponent(objectKey)}`;

  // Always write local backup copy to multiple candidate locations for 100% retrieval reliability
  try {
    ensureUploadsDir();
    
    // 1. Write to nested folder if path has slashes
    const nestedPath = path.join(uploadsLocalDir, objectKey);
    const parentDir = path.dirname(nestedPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(nestedPath, params.buffer);

    // 2. Write to flat sanitized path with underscore
    const safeLocalPath = path.join(uploadsLocalDir, objectKey.replace(/\//g, '_'));
    fs.writeFileSync(safeLocalPath, params.buffer);

    // 3. Write to flat basename path
    const baseLocalPath = path.join(uploadsLocalDir, path.basename(objectKey));
    fs.writeFileSync(baseLocalPath, params.buffer);
  } catch (err) {
    Logger.warn(`Local upload file cache write error: ${String(err)}`);
  }

  // Upload to Cloudflare R2 if credentials exist
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
              userId: params.userId || 'system',
              uploadedAt: new Date().toISOString(),
            },
          })
        );
        Logger.info(`Successfully uploaded object to Cloudflare R2: ${objectKey} (${params.buffer.length} bytes)`);
      }
    } catch (err: unknown) {
      Logger.warn(`Cloudflare R2 putObject error, relying on local disk cache: ${String(err)}`);
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
          userId: params.userId || null,
          contentType: params.contentType,
          sizeBytes: params.buffer.length,
          url: publicUrl,
          createdAt: new Date(),
        }).onConflictDoUpdate({
          target: storageObjects.key,
          set: {
            url: publicUrl,
            sizeBytes: params.buffer.length,
            contentType: params.contentType,
          },
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
 * Helper to infer content type from file extension
 */
function inferContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.gif':
      return 'image/gif';
    case '.pdf':
      return 'application/pdf';
    case '.jpg':
    case '.jpeg':
    default:
      return 'image/jpeg';
  }
}

/**
 * Fetch object buffer and stream from Cloudflare R2 or local cache for proxy serving
 */
export async function getObjectFromR2(rawKey: string): Promise<ObjectData | null> {
  if (!rawKey || typeof rawKey !== 'string') return null;

  // Clean raw key
  let key = rawKey.trim();
  // Strip query string if present
  if (key.includes('?')) {
    key = key.split('?')[0];
  }
  // Strip leading slashes and route prefix
  while (key.startsWith('/')) {
    key = key.slice(1);
  }
  key = key.replace(/^api\/storage\/file\//, '');
  key = key.replace(/^storage\/file\//, '');

  let decodedKey = key;
  try {
    decodedKey = decodeURIComponent(key);
  } catch {
    // keep raw if decode fails
  }
  // Handle double encoded
  if (decodedKey.includes('%')) {
    try {
      decodedKey = decodeURIComponent(decodedKey);
    } catch {
      // ignore
    }
  }

  // 1. Try Cloudflare R2 (check both encoded and decoded key)
  if (isR2Configured()) {
    const client = getR2Client();
    if (client && config.R2_BUCKET_NAME) {
      const keysToTry = Array.from(new Set([decodedKey, key, key.replace(/^\/+/, '')]));
      for (const tryKey of keysToTry) {
        try {
          const response = await client.send(
            new GetObjectCommand({
              Bucket: config.R2_BUCKET_NAME,
              Key: tryKey,
            })
          );

          if (response.Body) {
            let buffer: Buffer;
            if (typeof (response.Body as any).transformToByteArray === 'function') {
              const byteArray = await (response.Body as any).transformToByteArray();
              buffer = Buffer.from(byteArray);
            } else if (typeof (response.Body as any).pipe === 'function') {
              const chunks: Buffer[] = [];
              const stream = response.Body as Readable;
              for await (const chunk of stream) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              }
              buffer = Buffer.concat(chunks);
            } else {
              buffer = Buffer.from(response.Body as any);
            }

            const contentType = response.ContentType || inferContentType(tryKey);

            return {
              buffer,
              stream: Readable.from(buffer),
              contentType,
              contentLength: buffer.length,
            };
          }
        } catch (err) {
          // Continue to next key candidate or local fallback
        }
      }
    }
  }

  // 2. Check Local File Storage fallback (try all candidate locations)
  try {
    ensureUploadsDir();
    const candidatePaths = [
      path.join(uploadsLocalDir, decodedKey),
      path.join(uploadsLocalDir, key),
      path.join(uploadsLocalDir, decodedKey.replace(/\//g, '_')),
      path.join(uploadsLocalDir, key.replace(/\//g, '_')),
      path.join(uploadsLocalDir, path.basename(decodedKey)),
      path.join(uploadsLocalDir, path.basename(key)),
      path.join(process.cwd(), 'data', decodedKey),
    ];

    for (const safeLocalPath of candidatePaths) {
      if (fs.existsSync(safeLocalPath)) {
        try {
          const stats = fs.statSync(safeLocalPath);
          if (stats.isFile() && stats.size > 0) {
            const buffer = fs.readFileSync(safeLocalPath);
            const contentType = inferContentType(safeLocalPath);

            return {
              buffer,
              stream: Readable.from(buffer),
              contentType,
              contentLength: buffer.length,
            };
          }
        } catch {
          // continue checking
        }
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
