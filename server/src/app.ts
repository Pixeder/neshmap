import express from 'express';
import type  { Express, Request, Response, NextFunction } from 'express'
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/globalErrorHandler.middleware.js';
import multer from 'multer'

const app: Express = express();
const env = process.env.NODE_ENV || "development";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env !== "development") {
  app.use(limiter);
}

import queryRoutes from './routes/query.route.js'
app.use('/api/query',queryRoutes)

import ragRoutes from './routes/rag.route.js'
app.use('/api/rag', ragRoutes);


app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File is too large. Maximum limit is 5MB.' })
      return
    }
  }
  
  // Handle other unexpected errors
  res.status(500).json({ error: err.message || 'An unknown error occurred at app.ts.' })
})

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Server is running smoothly!' });
});

app.use(errorHandler)

export default app;