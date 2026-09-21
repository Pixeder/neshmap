import { v4 as uuidv4 } from 'uuid';
import { qdrant } from '../config/qdrant.config.js';
import {COLLECTION_NAME , VECTOR_SIZE } from '../constant/qdrant.constants.js';
import { generateEmbedding } from '../utils/generateEmbed.utils.js';

/**
 * Ensures the Qdrant collection exists with vector size 384 and Cosine distance
 */
const ensureCollectionExists = async (): Promise<void> => {
  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

    if (!exists) {
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      });
      console.log(`Created new Qdrant collection '${COLLECTION_NAME}' with vector size ${VECTOR_SIZE}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to initialize Qdrant collection: ${error.message}`);
  }
};

export interface StoreChunksParams {
  chunks: string[];
  documentUrl: string;
  publicId: string;
  metadata?: any;
}

/**
 * Generates local Sentence Transformer embeddings and stores them in Qdrant
 */
export const embedAndStoreChunks = async ({
  chunks,
  documentUrl,
  publicId,
  metadata,
}: StoreChunksParams): Promise<void> => {
  try {
    await ensureCollectionExists();

    const points = [];

    // Generate embeddings locally for each chunk
    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];
      const vector = await generateEmbedding(chunk);

      points.push({
        id: uuidv4(),
        vector,
        payload: {
          text: chunk,
          documentUrl,
          publicId,
          chunkIndex: index,
          sourceMetadata: metadata,
        },
      });
    }

    // Upsert into Qdrant in batches
    const batchSize = 50;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      await qdrant.upsert(COLLECTION_NAME, {
        wait: true,
        points: batch,
      });
    }
  } catch (error: any) {
    throw new Error(`Failed to embed and store chunks with Sentence Transformers: ${error.message}`);
  }
};