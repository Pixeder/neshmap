import express from 'express';
import type  { Express, Request, Response } from 'express'
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { globalErrorHandler } from './middleware/globalErrorHandler.middleware.js';

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

app.use(globalErrorHandler)

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Server is running smoothly!' });
});

export default app;