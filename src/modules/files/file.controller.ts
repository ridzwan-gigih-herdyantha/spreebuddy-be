import { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { ApiError } from '../../common/errors/ApiError.js';
import { fileService } from '../../common/services/file.service.js';

// GET /files/:category/:filename — stream a stored upload.
export function serveFile(req: Request, res: Response) {
  const category = String(req.params.category);
  const filename = String(req.params.filename);

  // Block path traversal (no slashes / '..').
  if (category !== path.basename(category) || filename !== path.basename(filename)) {
    throw ApiError.badRequest('Invalid file path');
  }

  const disk = fileService.diskPath(category, filename);
  if (!fs.existsSync(disk)) throw ApiError.notFound('File not found');

  res.sendFile(path.resolve(disk));
}
