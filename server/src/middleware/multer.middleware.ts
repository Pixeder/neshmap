import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';

// 1. Configure Memory Storage
const storage = multer.memoryStorage();

// 2. Configure File Filter (Only accept PDFs for this RAG teacher)
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_TYPE'));
  }
};

// 3. Initialize Multer with storage, filter, and size limits (e.g., 10MB)
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
}).single('document'); // Expecting the frontend field name to be 'document'

// 4. Create the Middleware Wrapper for Error Handling
export const uploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  upload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      // Handle Multer-specific errors (e.g., file too large)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds the 10MB limit.',
        });
      }
      return res.status(400).json({
        success: false,
        message: `Multer upload error: ${err.message}`,
      });
    } else if (err) {
      // Handle custom file filter errors or unknown errors
      if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only PDF documents are allowed.',
        });
      }
      return res.status(500).json({
        success: false,
        message: `Unknown upload error: ${err.message}`,
      });
    }

    // Ensure a file was actually uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document provided. Please upload a PDF file.',
      });
    }

    // File is safely in req.file.buffer, proceed to Cloudinary upload or controller
    next();
  });
};