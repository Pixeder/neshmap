import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/structures/appError.js';

export const globalErrorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // If it's our AppError, use its status code. Otherwise, default to 500.
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  // Production vs Development response toggle
  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      status: 'fail',
      message,
      stack: err.stack,
    });
  } else {
    // Production: Don't leak internal programming bug details to users
    res.status(statusCode).json({
      status: 'fail',
      message: err instanceof AppError ? message : 'Something went wrong!',
    });
  }
};
