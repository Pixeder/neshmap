import { Router } from 'express';
// Adjust the import paths based on your actual folder structure
import { uploadMiddleware } from '../middleware/multer.middleware.js';
import { processPDFUpload } from '../controllers/document.controller.js';

const router = Router();

/**
 * POST /api/documents/upload
 * 1. uploadMiddleware: intercepts the multipart/form-data, extracts the PDF to memory, handles errors.
 * 2. processPDFUpload: runs the document through Cloudinary, parsing, chunking, and Qdrant embedding.
 */
router.post('/upload', uploadMiddleware, processPDFUpload);

export default router;