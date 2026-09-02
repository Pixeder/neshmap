export interface CurriculumPromptInput {
  documentId: string;
  subjectName: string;
  pagesMetadata: Array<{
    pageNumber: number;
    mainHeaders: string[];
    keyConcepts: string[];
    hasMathOrCode: boolean;
    briefSummary: string;
    other?: string[];
  }>;
}

export interface VisionPromptInput {
  documentId: string;
  pageNumber: number;
  imageBuffer: Buffer;
  mimeType?: "image/png" | "image/jpeg" | "image/webp";
}