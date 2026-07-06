import { MongoClient, Db } from 'mongodb';
import { env } from './env.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  const candidate = new MongoClient(env.mongoUri, {
    // Fail fast when no MongoDB server is reachable instead of the 30s default.
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000,
  });

  try {
    await candidate.connect();
    // Verify the connection is actually alive.
    await candidate.db(env.dbName).command({ ping: 1 });
  } catch (err) {
    // Clean up the failed client so retries don't leak sockets.
    await candidate.close().catch(() => {});
    throw err;
  }

  client = candidate;
  db = candidate.db(env.dbName);
  console.log(`[db] Connected to MongoDB → database "${env.dbName}"`);

  return db;
}

export function getDB(): Db {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
}

export function isDBConnected(): boolean {
  return db !== null;
}

export async function disconnectDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[db] MongoDB connection closed');
  }
}
