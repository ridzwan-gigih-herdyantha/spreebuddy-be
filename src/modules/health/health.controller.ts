import { Request, Response } from 'express';
import { pingDB } from '../../config/db.js';

export async function healthCheck(_req: Request, res: Response) {
  const dbUp = await pingDB();
  const dbStatus = dbUp ? 'up' : 'down';

  const healthy = dbUp;

  // 200 when every dependency is up, 503 when a critical one (DB) is down —
  // so load balancers / k8s readiness probes react correctly.
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
