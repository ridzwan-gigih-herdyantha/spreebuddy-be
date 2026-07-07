import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { notFoundHandler } from './common/middlewares/notFound.middleware.js';
import { errorHandler } from './common/middlewares/error.middleware.js';

const app: Application = express();

// Core middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root ping
app.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Spreebuddy API', docs: '/api/v1' });
});

// API routes (versioned under /api)
app.use('/api', routes);

// 404 + centralized error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
