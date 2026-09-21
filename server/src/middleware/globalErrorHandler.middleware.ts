import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { AppResponse } from '../utils/appResponse.js';

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(error);

  if (error instanceof AppError) {
    return res
      .status(error.statusCode)
      .json(
        AppResponse.error(
          error.statusCode,
          error.message
        )
      );
  }

  return res
    .status(500)
    .json(
      AppResponse.error(
        500,
        'Internal server error.'
      )
    );
};