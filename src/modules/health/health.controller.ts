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

  const healthy = dbStatus === 'up';

  // 503 when a critical one (DB) is down
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'ok' : 'unavailable',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
    },
  });
}
