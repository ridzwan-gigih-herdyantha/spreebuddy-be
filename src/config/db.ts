import { MongoClient, Db } from 'mongodb';
import { env } from './env.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(env.mongoUri);
  await client.connect();
  db = client.db(env.dbName);

  // Verify the connection is alive.
  await db.command({ ping: 1 });
  console.log(`[db] Connected to MongoDB → database "${env.dbName}"`);

  return db;
}

export function getDB(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return db;
}

export async function disconnectDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[db] MongoDB connection closed');
  }
}
