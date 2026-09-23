import {
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';

import { visionModelSystemPrompt } from '../prompts/visionModel.prompt.js';
import { VisionPageOutput, visionPageSchema } from '../types/visionPage.type.js';
import { RenderedPage } from '../types/renderedPages.type.js';
import { AppError } from '../utils/index.js';
import { visionModelWithStructuredOutput } from '../agent/vision.agent.js';

export const extractStructuredPageContent = async (
  page: RenderedPage
): Promise<VisionPageOutput> => {
  try {
    if (!page.imageBuffer || page.imageBuffer.length === 0) {
      throw new AppError(
        `Image buffer is empty for page ${page.pageNumber}.`,
        400
      );
    }

    const imageBase64 = page.imageBuffer.toString('base64');

    const response = await visionModelWithStructuredOutput.invoke([
      new SystemMessage(visionModelSystemPrompt),

      new HumanMessage({
        content: [
          {
            type: 'text',
            text: `
Extract page ${page.pageNumber}.

Return every visible, page-supported detail
using the provided structured schema.
Do not infer missing information.
`.trim(),
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${page.mimeType};base64,${imageBase64}`,
            },
          },
        ],
      }),
    ]);
    console.dir(response.raw, {
  depth: null,
  colors: true,
});

// console.log( '[Vision] Usage metadata:', response.raw.usage_metadata );

    // Validate and normalize the model response
    const validatedResponse = visionPageSchema.parse({
      ...response.parsed,
      pageNumber: page.pageNumber,
    });

    return validatedResponse;
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error;
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown vision model error.';

    throw new AppError(
      `Failed to extract content from page ${page.pageNumber}: ${errorMessage}`,
      502
    );
  }
};