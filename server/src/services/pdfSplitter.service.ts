// src/services/pdfSplitter.service.ts

import { pdf } from 'pdf-to-img';
import { AppError } from '../utils/appError.js';

export class PDFSplitterService {
  /**
   * Converts an in-memory PDF Buffer into an array of PNG image buffers (one per page)
   */
  public async convertPdfToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
    try {
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new AppError('Provided PDF buffer is empty.', 400);
      }

      // Pass the buffer directly to pdf-to-img with scale factor 2 or 3 for optimal OCR quality
      const document = await pdf(pdfBuffer, { scale: 2 });
      const pageImages: Buffer[] = [];
      let pageNumber = 1;

      // Async iteration over extracted page buffers
      for await (const imageBuffer of document) {
        if (Buffer.isBuffer(imageBuffer) && imageBuffer.length > 0) {
          pageImages.push(imageBuffer);
          console.log(`[PDFSplitter] Converted page ${pageNumber}`);
          pageNumber++;
        } else {
          throw new AppError(`Failed to extract buffer for page ${pageNumber}`, 500);
        }
      }

      if (pageImages.length === 0) {
        throw new AppError('Failed to extract any readable pages from the PDF document.', 400);
      }

      console.log(`[PDFSplitter] Successfully converted ${pageImages.length} total pages.`);
      return pageImages;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`PDF Extraction Failed: ${error.message}`, 500);
    }
  }
}