import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  runDocumentOCRWorkflow,
} from '../workflows/documentOCR.workflow.js';

const testDocumentOCR = async (): Promise<void> => {
  try {
    // 1. Read the PDF file.
    const pdfPath = join(
      process.cwd(),
      'testFiles',
      'ipcv.pdf'
    );

    const pdfBuffer = await readFile(pdfPath);

    console.log(
      `[Test] PDF size: ${pdfBuffer.length} bytes`
    );

    // 2. Run the complete OCR workflow.
    const results = await runDocumentOCRWorkflow({
      pdfBuffer,

      // Maximum 3 vision requests at the same time.
      concurrency: 3,

      // Rendering resolution.
      scale: 2,
    });

    // 3. Print the structured output.
    console.log(
      '\n========== COMPLETE OCR RESPONSE ==========\n'
    );

    console.dir(results, {
      depth: null,
      colors: true,
    });

    console.log(
      '\n============================================\n'
    );

    console.log(
      `[Test] Successfully processed ${results.length} page(s).`
    );
  } catch (error: unknown) {
    console.error(
      '[Test] Document OCR failed:',
      error
    );

    process.exitCode = 1;
  }
};

testDocumentOCR();