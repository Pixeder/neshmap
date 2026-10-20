// src/services/qdrantIngestion.service.ts

import { QdrantClient } from '@qdrant/js-client-rest';
import { MergedChunk } from '../interfaces/pdfPipeline.interface.js';
import { MultiPageChunkResponse } from './groqVision.service.js';
import { AppError } from '../utils/appError.js';
import crypto from 'crypto';

export class QdrantIngestionService {
  private client: QdrantClient;
  private collectionName: string;
  private vectorSize: number;

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL,
    });
    this.collectionName = process.env.QDRANT_COLLECTION || 'study_materials';
    this.vectorSize = Number(process.env.QDRANT_VECTOR_SIZE) || 1536; // Adjust based on your embedding model
  }

  /**
   * Ensures the vector collection exists in Qdrant before upserting data
   */
  private async ensureCollectionExists(): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (col) => col.name === this.collectionName
      );

      if (!exists) {
        console.log(`[Qdrant] Collection '${this.collectionName}' not found. Creating collection...`);
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: 'Cosine'
          }
        });
        console.log(`[Qdrant] Collection '${this.collectionName}' created successfully.`);
      }
    } catch (error: any) {
      throw new AppError(`Failed to initialize Qdrant collection: ${error.message}`, 500);
    }
  }

  public async upsertChunkPayload(
    documentId: string,
    chunk: MergedChunk,
    llmResponse: MultiPageChunkResponse
  ): Promise<void> {
    try {
      // 1. Ensure collection exists prior to upserting
      await this.ensureCollectionExists();

      // 2. Prepare vector points array from parsed pages
      const points = llmResponse.pages.map((pageData) => {
        const contentMarkdown = pageData.elements
          .map(
            (el) =>
              `[${el.type.toUpperCase()}]\n${el.content}${
                el.description ? `\nContext: ${el.description}` : ''
              }`
          )
          .join('\n\n');

        // Note: Replace dummyVector with actual embedding generator call when ready
        const dummyVector = new Array(this.vectorSize).fill(0).map(() => Math.random());

        return {
          id: crypto.randomUUID(),
          vector: dummyVector,
          payload: {
            documentId,
            chunkIndex: chunk.chunkIndex,
            pageNumber: pageData.pageNumber,
            topicsCovered: pageData.topicsCovered,
            prerequisites: pageData.prerequisites,
            summary: pageData.summary,
            contentMarkdown
          }
        };
      });

      // 3. Upsert into Qdrant
      await this.client.upsert(this.collectionName, {
        wait: true,
        points
      });

      console.log(`[Qdrant] Successfully upserted ${points.length} page vector points for doc ${documentId}`);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Qdrant Ingestion Error: ${error.message}`, 500);
    }
  }
}