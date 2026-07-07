import mongoose from 'mongoose';
import { env } from './env.js';

// Fail fast (and let queries reject fast) instead of the 30s / 10s defaults.
mongoose.set('bufferTimeoutMS', 5000);

export async function connectDB(): Promise<void> {
  await mongoose.connect(env.mongoUri, {
    dbName: env.dbName,
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000,
  });
  console.log(`[db] Connected to MongoDB → database "${env.dbName}"`);
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
  await mongoose.disconnect();
  console.log('[db] MongoDB connection closed');
}
