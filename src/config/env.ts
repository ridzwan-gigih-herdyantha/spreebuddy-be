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
  // Public URL of the storefront, used to build Stripe return URLs.
  appUrl: process.env.APP_URL ?? 'http://localhost:5173',
  // Stripe. Absent keys leave the payment routes disabled rather than crashing boot.
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: process.env.STRIPE_CURRENCY ?? 'usd',
    // Point the SDK at stripe-mock or a local stub instead of api.stripe.com.
    apiBase: process.env.STRIPE_API_BASE,
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
    model: process.env.OPENROUTER_MODEL ?? 'openrouter/free',
    appName: process.env.OPENROUTER_APP_NAME ?? 'SpreeBuddy', // shown as "App" in OpenRouter
    appUrl: process.env.OPENROUTER_APP_URL, // site URL for attribution/ranking (optional)
  },
} as const;

export const isProduction = env.nodeEnv === 'production';
