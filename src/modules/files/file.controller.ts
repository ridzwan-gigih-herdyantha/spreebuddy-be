import { Request, Response } from 'express';
import path from 'node:path';
import { ApiError } from '../../common/errors/ApiError.js';
import { fileService } from '../../common/services/file.service.js';

// GET /files/:category/:filename — stream a private R2 object through the app.
export async function serveFile(req: Request, res: Response) {
  const category = String(req.params.category);
  const filename = String(req.params.filename);

  // Block path traversal (no slashes / '..').
  if (category !== path.basename(category) || filename !== path.basename(filename)) {
    throw ApiError.badRequest('Invalid file path');
  }

  let object;
  try {
    object = await fileService.getObject(`${category}/${filename}`);
  } catch {
    throw ApiError.notFound('File not found');
  }

  if (object.contentType) res.setHeader('Content-Type', object.contentType);
  if (object.contentLength) res.setHeader('Content-Length', String(object.contentLength));
  res.setHeader('Cache-Control', 'public, max-age=86400');

  object.body.pipe(res);
}
