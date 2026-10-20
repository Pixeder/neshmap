// src/controllers/document.controller.ts

import { Request, Response } from 'express';
import { asyncHandler, AppError, AppResponse} from '../utils/index.js';
import { PDFSplitterService } from '../services/pdfSplitter.service.js';
import { ImageMergerService } from '../services/imageMerger.service.js';
import { PDFProcessingQueue } from '../queue/pdfProcessing.queue.js';

const pdfSplitter = new PDFSplitterService();
const imageMerger = new ImageMergerService(1); // Merge 2 pages per chunk
const processingQueue = new PDFProcessingQueue();

export const uploadAndProcessPDF = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No PDF file uploaded', 400);
  }

  const documentId = `doc_${Date.now()}`;
  const pdfBuffer = req.file.buffer; // Buffer from Multer memoryStorage

  // Step 1: Render PDF pages to image buffers
  const pageImages = await pdfSplitter.convertPdfToImages(pdfBuffer);

  // Step 2: Merge images into stitched chunks
  const stitchedChunks = await imageMerger.createStitchedChunks(pageImages);

  // Step 3: Enqueue chunks into rate-limited processing queue (non-blocking)
  for (const chunk of stitchedChunks) {
    processingQueue.enqueueChunk(documentId, chunk);
  }

  // Return immediately to the client without waiting for full queue consumption
  res.status(202).json(
    AppResponse.success('PDF uploaded and ingestion pipeline started.', {
      documentId,
      cloudinaryUrl: (req.file as any).path || null, // Populated if using Cloudinary Multer Storage
      totalPageCount: pageImages.length,
      totalChunksQueued: stitchedChunks.length
    })
  );
});