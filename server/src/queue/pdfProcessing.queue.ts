import PQueue from 'p-queue';
import { MergedChunk } from '../interfaces/pdfPipeline.interface.js';
import { GroqVisionService } from '../services/groqVision.service.js';
import { QdrantIngestionService } from '../services/qdrantIngestion.service.js';

export class PDFProcessingQueue {
  private queue: PQueue;
  private groqService: GroqVisionService;
  private qdrantService: QdrantIngestionService;

  constructor() {
    // Process 1 batch request at a time with a 30-second inter-request delay
    // to strictly enforce the 8,000 TPM limit (2 requests/min max)
    this.queue = new PQueue({
      concurrency: 1,
      intervalCap: 1,
      interval: 60000
    });

    this.groqService = new GroqVisionService();
    this.qdrantService = new QdrantIngestionService();
  }

  /**
   * Enqueues a chunk for processing without blocking the initial request execution
   */
  public enqueueChunk(documentId: string, chunk: MergedChunk): void {
    this.queue.add(async () => {
      console.log(`[Queue] Processing Document: ${documentId} | Chunk: ${chunk.chunkIndex} | Pages: [${chunk.pageNumbers.join(', ')}]`);
      
      // Step 1: Pass the single 'chunk' object expected by GroqVisionService
      const extractedContent = await this.groqService.analyzeImageChunk(chunk);

      // Step 2: Store extracted payload into Qdrant Vector DB
      await this.qdrantService.upsertChunkPayload(documentId, chunk, extractedContent);

      console.log(`[Queue] Successfully indexed Document: ${documentId} | Chunk: ${chunk.chunkIndex}`);
    }).catch((err) => {
      console.error(`[Queue Error] Failed processing chunk ${chunk.chunkIndex} for doc ${documentId}:`, err);
    });
  }

  public getQueueStats() {
    return {
      pending: this.queue.pending,
      size: this.queue.size
    };
  }
}