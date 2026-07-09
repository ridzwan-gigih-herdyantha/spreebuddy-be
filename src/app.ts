import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import fileRoutes from './modules/files/file.routes.js';
import { connectDB } from './config/db.js';
import { sendSuccess } from './common/http/response.js';
import { notFoundHandler } from './common/middlewares/notFound.middleware.js';
import { errorHandler } from './common/middlewares/error.middleware.js';
import mongoose from 'mongoose';

const app: Application = express();

async function ensureDbConnected(_req: Request, _res: Response, next: NextFunction) {
  if (mongoose.connection.readyState === 1) return next();
  try { await connectDB(); } catch {}
  next();
}

// Core middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Stream uploaded files from private R2 storage
app.use('/files', fileRoutes);

// Root ping
app.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, { name: 'Spreebuddy API', docs: '/api/v1' }, 'Spreebuddy API');
});

// API routes (versioned under /api)
app.use('/api', ensureDbConnected, routes);

// 404 + centralized error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
