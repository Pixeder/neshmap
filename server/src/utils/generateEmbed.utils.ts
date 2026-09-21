import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';
import { EMBEDDING_MODEL_NAME } from '../constant/qdrant.constants.js';

let extractorPipeline: FeatureExtractionPipeline | null = null;
/**
 * Singleton loader for the Sentence Transformer model
 */
export const getExtractor = async (): Promise<FeatureExtractionPipeline> => {
  if (!extractorPipeline) {
    // Dynamically imports and downloads model on first run, then caches locally
    extractorPipeline = (await pipeline('feature-extraction', EMBEDDING_MODEL_NAME)) as FeatureExtractionPipeline;
  }
  return extractorPipeline;
};
/**
 * Generates embeddings for a single text string using Sentence Transformers
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  // Convert Float32Array to standard number array
  return Array.from(output.data);
};