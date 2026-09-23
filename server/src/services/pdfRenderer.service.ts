import {
  createIsomorphicCanvasFactory,
  definePDFJSModule,
  getDocumentProxy,
  renderPageAsImage,
} from 'unpdf';

import type { RenderedPage } from '../types/renderedPages.type.js';
import { AppError } from '../utils/index.js';

export interface PDFRenderOptions {
  scale?: number;
  startPage?: number;
  endPage?: number;
}

const DEFAULT_SCALE = 2;

let pdfJsInitialized = false;

const canvasImport = () => import('@napi-rs/canvas');

/**
 * Initialize the legacy PDF.js build for Node.js.
 */
const initializePDFJS = async (): Promise<void> => {
  if (pdfJsInitialized) {
    return;
  }

  await definePDFJSModule(
    () => import('pdfjs-dist/legacy/build/pdf.mjs')
  );

  pdfJsInitialized = true;
};

/**
 * Convert PDF pages into PNG image buffers.
 */
export const renderPDFPages = async (
  pdfBuffer: Buffer,
  options: PDFRenderOptions = {}
): Promise<RenderedPage[]> => {
  try {
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new AppError(
        'Provided PDF buffer is empty or undefined.',
        400
      );
    }

    const {
      scale = DEFAULT_SCALE,
      startPage = 1,
      endPage,
    } = options;

    if (scale <= 0) {
      throw new AppError(
        'PDF rendering scale must be greater than zero.',
        400
      );
    }

    if (startPage < 1) {
      throw new AppError(
        'Starting page must be greater than or equal to 1.',
        400
      );
    }

    await initializePDFJS();

    const pdfData = new Uint8Array(pdfBuffer);

    /*
     * Create the canvas factory before creating the PDF proxy.
     * This ensures PDF.js has access to the Node.js canvas
     * implementation when rendering intermediate canvases.
     */
    const CanvasFactory =
      await createIsomorphicCanvasFactory(canvasImport);

    const pdfDocument = await getDocumentProxy(pdfData, {
      CanvasFactory,
    });

    const totalPages = pdfDocument.numPages;

    if (totalPages === 0) {
      throw new AppError(
        'The PDF document does not contain any pages.',
        422
      );
    }

    const lastPage = endPage ?? totalPages;

    if (lastPage > totalPages) {
      throw new AppError(
        `Requested end page ${lastPage} exceeds the PDF page count of ${totalPages}.`,
        400
      );
    }

    if (startPage > lastPage) {
      throw new AppError(
        'Starting page cannot be greater than ending page.',
        400
      );
    }

    const renderedPages: RenderedPage[] = [];

    for (
      let pageNumber = startPage;
      pageNumber <= lastPage;
      pageNumber++
    ) {
      const imageArrayBuffer = await renderPageAsImage(
        pdfDocument,
        pageNumber,
        {
          canvasImport,
          scale,
        }
      );

      const imageBuffer = Buffer.from(imageArrayBuffer);

      if (imageBuffer.length === 0) {
        throw new AppError(
          `Rendering produced an empty image for page ${pageNumber}.`,
          422
        );
      }

      renderedPages.push({
        pageNumber,
        imageBuffer,
        mimeType: 'image/png',
      });
    }

    return renderedPages;
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown PDF rendering error.';

    throw new AppError(
      `Failed to render PDF pages: ${errorMessage}`,
      422
    );
  }
};