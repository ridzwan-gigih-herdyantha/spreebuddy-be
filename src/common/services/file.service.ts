import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { ApiError } from '../errors/ApiError.js';

const UPLOAD_ROOT = 'uploads';

export interface UploadConfig {
  category: string; // subfolder under uploads/, e.g. 'avatars'
  field: string; // multipart field name
  allowedMime: string[];
  maxSizeMB: number;
}

// Multer middleware that stores one file under uploads/<category>/.
function single(cfg: UploadConfig) {
  const dir = path.join(UPLOAD_ROOT, cfg.category);
  fs.mkdirSync(dir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) =>
      cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  });

  return multer({
    storage,
    limits: { fileSize: cfg.maxSizeMB * 1024 * 1024 },
    fileFilter: (_req, file, cb) =>
      cfg.allowedMime.includes(file.mimetype)
        ? cb(null, true)
        : cb(ApiError.badRequest(`Invalid file type for "${cfg.field}"`)),
  }).single(cfg.field);
}

// Public URL served by the file route.
function publicPath(category: string, filename: string) {
  return `/files/${category}/${filename}`;
}

// On-disk location for reading/deleting.
function diskPath(category: string, filename: string) {
  return path.join(UPLOAD_ROOT, category, filename);
}

// Best-effort delete; ignores missing files.
async function remove(diskFilePath: string) {
  await fs.promises.unlink(diskFilePath).catch(() => {});
}

export const fileService = { single, publicPath, diskPath, remove };
