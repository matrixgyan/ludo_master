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

let s3Client: S3Client | null = null;

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

  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: config.R2_ENDPOINT,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID!,
        secretAccessKey: config.R2_SECRET_ACCESS_KEY!,
      },
      // Cloudflare R2 requires path-style or virtual-hosted; endpoint provided handles this
      forcePathStyle: true,
    });
  }

  return s3Client;
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
 * Upload buffer or stream directly to Cloudflare R2 bucket and record in PostgreSQL
 */
export async function uploadToR2(params: {
  key?: string;
  buffer: Buffer;
  contentType: string;
  userId?: string;
  category?: 'avatars' | 'images' | 'assets' | 'logs';
}): Promise<UploadResult> {
  const client = getR2Client();
  if (!client || !config.R2_BUCKET_NAME) {
    throw new Error('Cloudflare R2 is not configured. Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.');
  }

  const category = params.category || 'assets';
  const extension = params.contentType.split('/')[1] || 'bin';
  const objectKey = params.key || `${category}/${Date.now()}-${uuidv4()}.${extension}`;

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

  const publicUrl = `/api/storage/file/${encodeURIComponent(objectKey)}`;

  // Record in PostgreSQL if available
  if (isPostgresConfigured()) {
    try {
      const db = getDb();
      if (db) {
        await db.insert(storageObjects).values({
          id: `obj_${uuidv4()}`,
          key: objectKey,
          bucket: config.R2_BUCKET_NAME,
          userId: params.userId || null,
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

  Logger.info(`Successfully uploaded object to Cloudflare R2: ${objectKey} (${params.buffer.length} bytes)`);

  return {
    key: objectKey,
    url: publicUrl,
    bucket: config.R2_BUCKET_NAME,
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
 * Fetch object stream from Cloudflare R2 for proxy serving
 */
export async function getObjectFromR2(key: string): Promise<{
  stream: Readable;
  contentType: string;
  contentLength?: number;
} | null> {
  const client = getR2Client();
  if (!client || !config.R2_BUCKET_NAME) {
    return null;
  }

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: config.R2_BUCKET_NAME,
        Key: key,
      })
    );

    if (!response.Body) return null;

    return {
      stream: response.Body as Readable,
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength,
    };
  } catch (err) {
    Logger.warn(`Object not found in Cloudflare R2: ${key}`);
    return null;
  }
}

/**
 * Delete object from Cloudflare R2
 */
export async function deleteObjectFromR2(key: string): Promise<boolean> {
  const client = getR2Client();
  if (!client || !config.R2_BUCKET_NAME) return false;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (err) {
    Logger.warn(`Failed to delete object from R2: ${key}`);
    return false;
  }
}
