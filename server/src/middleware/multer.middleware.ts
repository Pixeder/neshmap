import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { AppResponse } from '../utils/appResponse.js';

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only PDF documents are allowed.', 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
}).single('document');

export const uploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  upload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res
          .status(400)
          .json(AppResponse.error(400, 'File size exceeds the 10MB limit.'));
      }
      return res
        .status(400)
        .json(AppResponse.error(400, `Multer upload error: ${err.message}`));
    } else if (err) {
      const statusCode = err.statusCode || 500;
      return res
        .status(statusCode)
        .json(AppResponse.error(statusCode, err.message || 'File upload error'));
    }

    if (!req.file) {
      return res
        .status(400)
        .json(
          AppResponse.error(
            400,
            "No document provided. Please upload a PDF under the form field key 'document'."
          )
        );
    }

    next();
  });
};