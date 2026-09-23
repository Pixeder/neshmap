import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { extractStructuredPageContent } from '../services/visionPage.service.js';

const testSinglePageExtraction = async (): Promise<void> => {
  try {
    // 1. Path to the rendered page image.
    const imagePath = join(
      process.cwd(),
      'test-output',
      'rendered-pages',
      'page-1.png'
    );

    // 2. Read the image as a Buffer.
    const imageBuffer = await readFile(imagePath);

    // 3. Create the RenderedPage object.
    const page = {
      pageNumber: 1,
      imageBuffer,
      mimeType: 'image/png' as const,
    };

    console.log('Starting vision extraction...');
    console.log(`Image path: ${imagePath}`);
    console.log(`Image size: ${imageBuffer.length} bytes`);

    // 4. Extract structured content from the image.
    const result = await extractStructuredPageContent(page);

    // 5. Print the structured response.
    console.log('\n========== VISION MODEL RESPONSE ==========\n');

    console.dir(result, {
      depth: null,
      colors: true,
    });

    console.log('\n===========================================\n');

    console.log('Vision extraction completed successfully.');
  } catch (error: unknown) {
    console.error(
      'Vision extraction test failed:',
      error
    );

    process.exitCode = 1;
  }
};

testSinglePageExtraction();