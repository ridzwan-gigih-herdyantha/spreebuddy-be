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
  jwtSecret: required('JWT_SECRET', 'dev-insecure-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  // Cloudflare R2 (S3-compatible) object storage. Optional locally; required for uploads.
  s3: {
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT, // https://<account_id>.r2.cloudflarestorage.com
    region: process.env.CLOUDFLARE_R2_REGION ?? 'auto',
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    bucket: process.env.CLOUDFLARE_R2_BUCKET,
    // publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL, // public bucket URL / custom domain
  },
  // Google Gemini (AI chat assistant). Optional locally; required for the chat feature.
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    // Evergreen alias — Google keeps it pointing at the current flash, so it
    // won't get retired like pinned versions (e.g. gemini-2.0-flash → 404).
    model: process.env.GEMINI_MODEL ?? 'gemini-flash-latest',
  },
} as const;

export const isProduction = env.nodeEnv === 'production';
