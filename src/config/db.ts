import mongoose from 'mongoose';
import { env } from './env.js';

// Fail fast (and let queries reject fast) instead of the 30s / 10s defaults.
mongoose.set('bufferTimeoutMS', 5000);

// Cached across (warm) serverless invocations so we reuse one connection/pool.
let connectionPromise: Promise<typeof mongoose> | null = null;

export function connectDB(): Promise<typeof mongoose> {
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(env.mongoUri, {
      dbName: env.dbName,
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      maxPoolSize: 5,
    })
    .then((m) => {
      console.log(`[db] Connected to MongoDB → database "${env.dbName}"`);
      return m;
    })
    .catch((err) => {
      connectionPromise = null; // allow a later request to retry
      throw err;
    });

  return connectionPromise;
}

export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/** Lightweight liveness check used by the health endpoint. */
export async function pingDB(): Promise<boolean> {
  try {
    if (mongoose.connection.readyState !== 1) return false;
    await mongoose.connection.db!.admin().ping();
    return true;
  } catch {
    return false;
  }
}

export async function disconnectDB(): Promise<void> {
  connectionPromise = null;
  await mongoose.disconnect();
  console.log('[db] MongoDB connection closed');
}
