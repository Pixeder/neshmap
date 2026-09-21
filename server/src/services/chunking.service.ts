import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

/**
 * Splits extracted text into smaller, semantically meaningful chunks for vector embedding.
 * Uses RecursiveCharacterTextSplitter to try to keep paragraphs and sentences together.
 * 
 * @param text - The raw text extracted from the PDF.
 * @param options - Configuration for chunk size and overlap (defaults to 1000/200).
 * @returns Array of text chunks.
 */
export const chunkExtractedText = async (
  text: string,
  options: ChunkingOptions = {}
): Promise<string[]> => {
  try {
    if (!text || text.trim() === '') {
      throw new Error("Input text is empty or invalid.");
    }

    const { chunkSize = 1000, chunkOverlap = 200 } = options;

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      // The splitter will try to split on these characters in order,
      // preserving the most semantic blocks (like double newlines) first.
      separators: ["\n\n", "\n", " ", ""],
    });

    const chunks = await splitter.splitText(text);

    if (!chunks || chunks.length === 0) {
      throw new Error("Text splitting resulted in zero chunks.");
    }

    return chunks;
  } catch (error: any) {
    throw new Error(`Failed to chunk text: ${error.message || 'Unknown chunking error'}`);
  }
};