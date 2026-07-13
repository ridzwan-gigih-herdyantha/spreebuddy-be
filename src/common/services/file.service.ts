import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ApiError } from '../errors/ApiError.js';
import { env } from '../../config/env.js';

const STORE_PREFIX = '/files';
const DEFAULT_TEMP_URL_TTL = 3600; // 1 hour

export interface UploadConfig {
  category: string; // key prefix in the bucket, e.g. 'avatars'
  field: string; // multipart field name
  allowedMime: string[];
  maxSizeMB: number;
}

// Validates storage config and narrows the types (throws if missing).
function s3Config() {
  const { bucket, accessKeyId, secretAccessKey, region, endpoint } = env.s3;
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw ApiError.internal('File storage (S3/R2) is not configured');
  }
  return { bucket, accessKeyId, secretAccessKey, region, endpoint };
}

let client: S3Client | null = null;
function getClient(cfg: ReturnType<typeof s3Config>): S3Client {
  if (!client) {
    client = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      forcePathStyle: Boolean(cfg.endpoint), // needed for R2 / S3-compatible endpoints
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    });
  }
  return client;
}

// Stored path (kept in DB / returned to clients) <-> bucket object key.
function keyToPath(key: string): string {
  return `${STORE_PREFIX}/${key}`;
}
function pathToKey(storedPath: string): string | null {
  return storedPath.startsWith(`${STORE_PREFIX}/`) ? storedPath.slice(STORE_PREFIX.length + 1) : null;
}

// Multer instance that keeps files in memory (no disk on serverless).
function multerInstance(cfg: UploadConfig) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: cfg.maxSizeMB * 1024 * 1024 },
    fileFilter: (_req, file, cb) =>
      cfg.allowedMime.includes(file.mimetype)
        ? cb(null, true)
        : cb(ApiError.badRequest(`Invalid file type for "${cfg.field}"`)),
  });
}

// Single-file upload middleware.
function single(cfg: UploadConfig) {
  return multerInstance(cfg).single(cfg.field);
}

// Multi-file upload middleware (up to maxCount files under one field).
function many(cfg: UploadConfig, maxCount: number) {
  return multerInstance(cfg).array(cfg.field, maxCount);
}

// Uploads an in-memory file to the private bucket; returns its stored path.
async function upload(file: Express.Multer.File, category: string): Promise<string> {
  const cfg = s3Config();
  const key = `${category}/${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
  await getClient(cfg).send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );
  return keyToPath(key);
}

// Fetches an object for the proxy route to stream.
async function getObject(key: string) {
  const cfg = s3Config();
  const res = await getClient(cfg).send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key }));
  return {
    body: res.Body as Readable,
    contentType: res.ContentType,
    contentLength: res.ContentLength,
  };
}

// Presigned, time-limited URL for direct client access to a private object.
// Accepts a stored path (e.g. "/files/avatars/x.png"); returns null for values
// outside our namespace or when storage isn't configured.
async function getTemporaryUrl(
  storedPath: string | null | undefined,
  expiresIn: number = DEFAULT_TEMP_URL_TTL,
): Promise<string | null> {
  if (!storedPath) return null;
  const key = pathToKey(storedPath);
  if (!key) return null;

  try {
    const cfg = s3Config();
    return await getSignedUrl(
      getClient(cfg),
      new GetObjectCommand({ Bucket: cfg.bucket, Key: key }),
      { expiresIn },
    );
  } catch {
    return null;
  }
}

// Best-effort delete by object key.
async function remove(key: string): Promise<void> {
  const cfg = s3Config();
  try {
    await getClient(cfg).send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
  } catch {
    // ignore
  }
}

// Delete by the stored path (no-op for values outside our /files namespace).
async function removeByStoredPath(storedPath: string): Promise<void> {
  const key = pathToKey(storedPath);
  if (key) await remove(key);
}

export const fileService = { single, many, upload, getObject, getTemporaryUrl, remove, removeByStoredPath, pathToKey };
