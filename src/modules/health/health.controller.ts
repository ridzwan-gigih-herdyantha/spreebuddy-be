import { Request, Response } from 'express';
import { getDB } from '../../config/db.js';

export async function healthCheck(_req: Request, res: Response) {
  let dbStatus = 'down';
  try {
    await getDB().command({ ping: 1 });
    dbStatus = 'up';
  } catch {
    dbStatus = 'down';
  }

  res.status(200).json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
    },
  });
}
