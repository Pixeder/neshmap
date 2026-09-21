import { QdrantClient } from '@qdrant/js-client-rest';

// 1. Initialize Qdrant Client (Pointing to local Docker container)
export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
});