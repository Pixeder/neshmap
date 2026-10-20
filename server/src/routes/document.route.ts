// src/routes/document.route.ts

import { Router } from 'express';
import { uploadAndProcessPDF } from '../controllers/document.controller.js';
import { uploadMiddleware } from '../middleware/multer.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/document/upload:
 *   post:
 *     summary: Upload PDF document for Vision OCR and Qdrant vector indexing
 *     tags: [Document Ingestion]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [document]
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: PDF textbook file to process
 *     responses:
 *       202:
 *         description: Upload accepted and queued for background processing.
 */
router.post('/upload', uploadMiddleware, uploadAndProcessPDF);

export default router;