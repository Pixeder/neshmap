import { PDFParse } from 'pdf-parse';
import { AppError } from '../utils/index.js';

export interface ExtractedPDF {
  text: string;
  pageCount: number;
  info: any;
}

/**
 * Extracts text and metadata from a PDF memory buffer.
 *
 * @param buffer - The PDF file buffer (e.g., from req.file.buffer)
 * @returns An object containing the extracted text, page count, and metadata.
 */
export const extractTextFromPDFBuffer = async (
  buffer: string
): Promise<ExtractedPDF> => {

  try {

    // 1. Validate PDF buffer

    if (!buffer || buffer.length === 0) {
      throw new AppError(
        'Provided PDF buffer is empty or undefined.',
        400
      );
    }

    // 2. Initialize PDF parser
    // console.log("Hello form parser")

    const parser = new PDFParse({url: buffer});

    // 3. Extract text from PDF

    const pdfText = await parser.getText();
    // console.log("Hello from pdf Parse ",pdfText)

    // 4. Extract PDF metadata

    const pdfData = await parser.getInfo({
      parsePageInfo: true,
    });

    // 5. Validate extracted text

    if (
      !pdfText.text ||
      pdfText.text.trim() === ''
    ) {
      throw new AppError(
        'PDF parsed successfully, but no readable text was found. The file might contain scanned images.',
        422
      );
    }

    // 6. Clean extracted text

    const cleanedText = pdfText.text
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // 7. Return extracted PDF data

    return {
      text: cleanedText,
      pageCount: pdfData.total,
      info: pdfData.info,
    };

  } catch (error: unknown) {

    
    // 8. Preserve existing AppError
    

    if (error instanceof AppError) {
      throw error;
    }

    
    // 9. Handle unexpected PDF parsing errors
    

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown PDF parsing error.';

    throw new AppError(
      `Failed to parse PDF document: ${errorMessage}`,
      422
    );
  }
};