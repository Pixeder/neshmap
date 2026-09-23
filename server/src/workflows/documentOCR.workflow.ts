import { renderPDFPages } from '../services/pdfRenderer.service.js';

import {
  extractStructuredPageContent,
} from '../services/visionPage.service.js';

import type {
  VisionPageOutput,
} from '../types/visionPage.type.js';

import {
  runWithConcurrency,
} from '../utils/concurrency.utils.js';

import { AppError } from '../utils/index.js';

export interface DocumentOCRWorkflowInput {
  pdfBuffer: Buffer;

  concurrency?: number;

  delayBetweenBatchesMs?: number;

  scale?: number;

  startPage?: number;

  endPage?: number;
}

export const runDocumentOCRWorkflow = async ({
  pdfBuffer,
  concurrency = 3,

  // Default delay: 60 seconds.
  delayBetweenBatchesMs = 60000,

  scale = 2,
  startPage = 1,
  endPage,
}: DocumentOCRWorkflowInput): Promise<VisionPageOutput[]> => {
  try {
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new AppError(
        'PDF buffer is empty or undefined.',
        400
      );
    }

    console.log(
      '[Workflow] Starting PDF rendering...'
    );

    // Step 1: Render the PDF pages.
    const renderedPages = await renderPDFPages(
      pdfBuffer,
      {
        scale,
        startPage,
        endPage,
      }
    );

    console.log(
      `[Workflow] Rendered ${renderedPages.length} page(s).`
    );

    // Step 2: Process pages in batches.
    console.log(
      `[Workflow] Vision concurrency: ${concurrency}`
    );

    console.log(
      `[Workflow] Delay between batches: ${
        delayBetweenBatchesMs / 1000
      } seconds`
    );

    const visionResults = await runWithConcurrency(
      renderedPages,

      async (page) => {
        console.log(
          `[Vision] Processing page ${page.pageNumber}`
        );

        const result =
          await extractStructuredPageContent(page);

        console.log(
          `[Vision] Finished page ${page.pageNumber}`
        );

        return result;
      },

      {
        concurrency,
        delayBetweenBatchesMs,
      }
    );

    // Step 3: Sort by original page number.
    visionResults.sort(
      (firstPage, secondPage) =>
        firstPage.pageNumber - secondPage.pageNumber
    );

    console.log(
      `[Workflow] Completed extraction for ${
        visionResults.length
      } page(s).`
    );

    return visionResults;
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown document OCR workflow error.';

    throw new AppError(
      `Document OCR workflow failed: ${errorMessage}`,
      500
    );
  }
};