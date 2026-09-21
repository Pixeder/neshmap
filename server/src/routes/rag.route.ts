import { Router } from 'express';
import { uploadMiddleware } from '../middleware/multer.middleware.js';
import { processDocumentPipeline } from '../controllers/rag.controller.js';

const router = Router();

// Ingestion Pipeline: Expects a PDF file under the 'document' field in multipart/form-data
router.post('/upload', uploadMiddleware, processDocumentPipeline);

export default router;