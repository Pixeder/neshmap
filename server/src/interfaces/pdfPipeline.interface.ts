// src/interfaces/pdfPipeline.interface.ts

export interface ExtractedElement {
  type: 'text' | 'table' | 'diagram' | 'formula' | 'key_takeaway';
  content: string;
  description?: string;
}

export interface ChunkLLMResponse {
  topicsCovered: string[];
  prerequisites: string[];
  summary: string;
  elements: ExtractedElement[];
}

export interface MergedChunk {
  chunkIndex: number;
  pageNumbers: number[];
  imageBuffer: Buffer;
  mimeType: string;
}

export interface VectorPointPayload {
  documentId: string;
  chunkIndex: number;
  pageNumbers: number[];
  topicsCovered: string[];
  prerequisites: string[];
  summary: string;
  contentMarkdown: string;
}