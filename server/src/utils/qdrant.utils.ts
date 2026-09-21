import { qdrant } from "../config/qdrant.config.js";
import { COLLECTION_NAME, VECTOR_SIZE} from "../constant/qdrant.constants.js";
/**
 * Ensures the Qdrant collection exists with vector size 384 and Cosine distance
 */
export const ensureCollectionExists = async (): Promise<void> => {
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