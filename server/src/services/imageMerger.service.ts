// src/services/imageMerger.service.ts

import sharp from 'sharp';
import { MergedChunk } from '../interfaces/pdfPipeline.interface.js';
import { AppError } from '../utils/appError.js';

export class ImageMergerService {
  private readonly pagesPerChunk: number;

  constructor(pagesPerChunk = 2) {
    this.pagesPerChunk = pagesPerChunk;
  }

  public async createStitchedChunks(pageBuffers: Buffer[]): Promise<MergedChunk[]> {
    try {
      if (!pageBuffers || pageBuffers.length === 0) {
        throw new AppError('No image buffers provided for stitching.', 400);
      }

      const chunks: MergedChunk[] = [];
      let chunkIndex = 0;

      for (let i = 0; i < pageBuffers.length; i += this.pagesPerChunk) {
        const batchBuffers = pageBuffers.slice(i, i + this.pagesPerChunk);

        // Sanity Check: Ensure every buffer in the batch is valid and non-empty
        batchBuffers.forEach((buf, idx) => {
          if (!Buffer.isBuffer(buf) || buf.length === 0) {
            throw new AppError(`Buffer at index ${i + idx} is empty or invalid.`, 500);
          }
        });

        const pageNumbers = batchBuffers.map((_, idx) => i + idx + 1);

        // Retrieve dimensions for canvas composition
        const metadataList = await Promise.all(
          batchBuffers.map((buf) => sharp(buf).metadata())
        );

        const maxWidth = Math.max(...metadataList.map((m) => m.width || 0));
        const totalHeight = metadataList.reduce((sum, m) => sum + (m.height || 0), 0);

        let currentOffsetY = 0;
        const compositeInstructions = batchBuffers.map((buf, idx) => {
          const instruction = { input: buf, top: currentOffsetY, left: 0 };
          currentOffsetY += metadataList[idx].height || 0;
          return instruction;
        });

        const mergedBuffer = await sharp({
          create: {
            width: maxWidth,
            height: totalHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        })
          .composite(compositeInstructions)
          .jpeg({ quality: 80 })
          .toBuffer();

        chunks.push({
          chunkIndex,
          pageNumbers,
          imageBuffer: mergedBuffer,
          mimeType: 'image/jpeg'
        });

        console.log(`[ImageMerger] Created chunk ${chunkIndex + 1} for pages: [${pageNumbers.join(', ')}]`);
        chunkIndex++;
      }

      return chunks;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Image Stitching Failed: ${error.message}`, 500);
    }
  }
}