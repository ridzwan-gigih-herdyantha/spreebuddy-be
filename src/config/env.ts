import dotenv from 'dotenv';

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017'),
  dbName: required('DB_NAME', 'spreebuddy'),
} as const;

export const isProduction = env.nodeEnv === 'production';
