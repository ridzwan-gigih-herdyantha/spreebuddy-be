import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

const DB_RETRY_MS = 10000;

// Keep trying to connect in the background so the server survives a DB outage
// and recovers automatically once MongoDB is reachable again.
async function connectWithRetry() {
  try {
    await connectDB();
  } catch (err) {
    console.error(
      `[db] Connection failed: ${(err as Error).message}. Retrying in ${DB_RETRY_MS / 1000}s...`,
    );
    setTimeout(connectWithRetry, DB_RETRY_MS);
  }
}

function bootstrap() {
  const server = app.listen(env.port, () => {
    console.log(`[server] Running at http://localhost:${env.port} (${env.nodeEnv})`);
    console.log(`[server] API base → http://localhost:${env.port}/api/v1`);
  });

  // Non-blocking: the HTTP server stays up even if the DB is down.
  void connectWithRetry();

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`\n[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap();
