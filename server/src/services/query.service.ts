import { getExtractor } from "../utils/generateEmbed.utils.js";
import { qdrant } from "../config/qdrant.config.js";
import { COLLECTION_NAME } from "../constant/qdrant.constants.js";

export interface RetrieveContextParams {
  queryText: string;
  limit?: number;
}

export interface RetrievedChunk {
  score: number;
  text: string;
  documentUrl: string;
  publicId: string;
  sourceMetadata?: any;
}

/**
 * Embeds the user query and searches Qdrant for the most relevant document chunks.
 */
export const retrieveContextFromQdrant = async ({
  queryText,
  limit = 5,
}: RetrieveContextParams): Promise<RetrievedChunk[]> => {
  try {
    if (!queryText || queryText.trim() === '') {
      throw new Error('Query text cannot be empty.');
    }

    // 1. Embed the user's question
    const extractor = await getExtractor();
    const output = await extractor(queryText, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(output.data);

    // 2. Search Qdrant using Cosine similarity
    const searchResults = await qdrant.query(COLLECTION_NAME, {
      query: queryVector,
      limit: limit,
      with_payload: true, // Crucial: ensures we get the text and metadata back, not just IDs
    });

    // 3. Format the results
    return searchResults.points.map((result) => {
      const payload = result.payload || {};
      return {
        score: result.score,
        text: payload.text as string,
        documentUrl: payload.documentUrl as string,
        publicId: payload.publicId as string,
        sourceMetadata: payload.sourceMetadata,
      };
    });
  } catch (error: any) {
    throw new Error(`Failed to retrieve context from Qdrant: ${error.message}`);
  }
};