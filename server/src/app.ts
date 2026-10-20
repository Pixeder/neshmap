import express from 'express';
import type  { Express, Request, Response, NextFunction } from 'express'
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/globalErrorHandler.middleware.js';
import multer from 'multer'
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config.js';

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

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Server is running smoothly!' });
});


app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/docs/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

import analyticsRoutes from './routes/analytics.route.js';
app.use('/api/analytics', analyticsRoutes);

import studentRoutes from './routes/student.route.js';
app.use('/api/student', studentRoutes);

import documentRoutes from './routes/document.route.js'
app.use('/api/document', documentRoutes);

import roadmapRoutes from './routes/roadmap.route.js';
app.use('/api/roadmap', roadmapRoutes);

import teachingRoutes from './routes/teaching.route.js';
app.use('/api/teaching', teachingRoutes);

import orchestratorRoutes from './routes/orchestrator.route.js';
app.use('/api',orchestratorRoutes);


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
app.use(errorHandler)

export default app;