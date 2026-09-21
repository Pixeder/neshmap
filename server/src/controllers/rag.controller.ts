
import { Request, Response } from 'express';

import { uploadBufferToCloudinary } from '../services/uploadCloudinary.service.js';
import { extractTextFromPDFBuffer } from '../utils/pdfParse.utils.js';
import { chunkExtractedText } from '../services/chunking.service.js';
import { embedAndStoreChunks } from '../services/embedding.service.js';

import {
  DocumentModel,
  DocumentStatus,
} from '../models/document.model.js';

import {
  asyncHandler,
  AppError,
  AppResponse,
} from '../utils/index.js';

/**
 * Unified Ingestion Pipeline Controller
 *
 * Coordinates:
 * Memory Buffer
 * -> MongoDB Init
 * -> Cloudinary Upload
 * -> PDF Parsing
 * -> Chunking
 * -> Embedding
 * -> Qdrant Storage
 * -> MongoDB Status
 */
export const processDocumentPipeline = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {

    let documentRecord: any = null;

    try {

      // 1. Validate uploaded PDF

      if (
        !req.file ||
        !req.file.buffer ||
        req.file.buffer.length === 0
      ) {
        throw new AppError(
          'No PDF document buffer provided in request.',
          400
        );
      }

      // 2. Initialize MongoDB Document

      documentRecord = await DocumentModel.create({
        originalName: req.file.originalname,
        cloudinaryUrl: 'pending',
        cloudinaryPublicId: 'pending',
        status: DocumentStatus.PENDING,
      });

      // 3. Upload PDF to Cloudinary

      const cloudinaryResult =
        await uploadBufferToCloudinary(
          req.file.buffer
        );

      documentRecord.cloudinaryUrl = cloudinaryResult.url;

      documentRecord.cloudinaryPublicId = cloudinaryResult.publicId;

      documentRecord.status = DocumentStatus.UPLOADED;

      await documentRecord.save();

      // 4. Extract text from PDF

      documentRecord.status = DocumentStatus.PARSING;

      await documentRecord.save();

      const {
        text,
        pageCount,
        info,
      } = await extractTextFromPDFBuffer(
        documentRecord.cloudinaryUrl
      );

      documentRecord.pageCount = pageCount;

      await documentRecord.save();

      // 5. Chunk extracted text

      documentRecord.status = DocumentStatus.CHUNKING;

      await documentRecord.save();

      const chunks = await chunkExtractedText(
        text,
        {
          chunkSize: 1000,
          chunkOverlap: 200,
        }
      );

      documentRecord.chunkCount = chunks.length;

      await documentRecord.save();

      // 6. Generate Embeddings & Store in Qdrant

      documentRecord.status = DocumentStatus.EMBEDDING;

      await documentRecord.save();

      await embedAndStoreChunks({
        chunks,
        documentUrl: cloudinaryResult.url,
        publicId: cloudinaryResult.publicId,
        metadata: info,
      });

      // 7. Mark Pipeline as COMPLETED

      documentRecord.status = DocumentStatus.COMPLETED;

      await documentRecord.save();

      // 8. Send Success Response

      res
        .status(200)
        .json(
          AppResponse.success(
            'PDF successfully ingested into RAG vector storage.',
            documentRecord
          )
        );

    } catch (error: unknown) {

      // 9. Audit Failure in MongoDB

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Pipeline execution failed.';

      if (documentRecord?._id) {

        try {

          await DocumentModel.findByIdAndUpdate(
            documentRecord._id,
            {
              status: DocumentStatus.FAILED,
              errorMessage,
            }
          );

        } catch (auditError) {

          console.error(
            'Failed to update document failure status:',
            auditError
          );

        }
      }

      // 10. Preserve AppError

      if (error instanceof AppError) {
        throw error;
      }

      // 11. Convert Unknown Error to AppError

      throw new AppError(
        `Document ingestion failed: ${errorMessage}`,
        500
      );
    }
  }
);