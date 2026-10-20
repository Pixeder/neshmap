// src/services/groqVision.service.ts

import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { visionModelSystemPrompt } from '../prompts/visionModel.prompt.js';
import { MergedChunk } from '../interfaces/pdfPipeline.interface.js';
import { AppError } from '../utils/appError.js';
import { VISION_MODEL_NAME } from '../constant/llm.constant.js';

const ExtractedElementSchema = z.object({
  type: z.enum([
    'heading',
    'subheading',
    'paragraph',
    'handwritten',
    'table',
    'diagram',
    'flowchart',
    'formula',
    'code',
    'definition',
    'example',
    'concept'
  ]),
  content: z.string(),
  description: z.string().optional()
});

const PageExtractionSchema = z.object({
  pageNumber: z.number(),
  topicsCovered: z.array(z.string()),
  prerequisites: z.array(z.string()),
  summary: z.string(),
  elements: z.array(ExtractedElementSchema)
});

export const MultiPageChunkSchema = z.object({
  pages: z.array(PageExtractionSchema)
});

export type MultiPageChunkResponse = z.infer<typeof MultiPageChunkSchema>;

export class GroqVisionService {
  private model: ChatGroq;

  constructor() {
    this.model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: VISION_MODEL_NAME,
      temperature: 0.1,
      maxTokens: 950 // Hard-capped under 1,000 to satisfy Groq OTPM rate limits
    });
  }

  public async analyzeImageChunk(chunk: MergedChunk): Promise<MultiPageChunkResponse> {
    try {
      const base64Image = chunk.imageBuffer.toString('base64');
      const dataUrl = `data:${chunk.mimeType};base64,${base64Image}`;

      const formattedUserPrompt = `
Analyze the page image provided (Page Number: ${chunk.pageNumbers.join(', ')}).
Extract text concisely into structured JSON. Be direct and avoid unnecessary descriptions.

JSON Schema:
{
  "pages": [
    {
      "pageNumber": number,
      "topicsCovered": ["string"],
      "prerequisites": ["string"],
      "summary": "1-2 sentence summary",
      "elements": [
        {
          "type": "heading" | "subheading" | "paragraph" | "handwritten" | "table" | "diagram" | "flowchart" | "formula" | "code" | "definition" | "example" | "concept",
          "content": "string"
        }
      ]
    }
  ]
}
`;

      const response = await this.model.invoke(
        [
          new SystemMessage(visionModelSystemPrompt),
          new HumanMessage({
            content: [
              { type: 'text', text: formattedUserPrompt },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          })
        ],
        {
          response_format: { type: 'json_object' }
        }
      );

      const responseText = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      const cleanedJson = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsedData = JSON.parse(cleanedJson);
      return MultiPageChunkSchema.parse(parsedData);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`LangChain Groq Vision Extraction Failed: ${error.message}`, 500);
    }
  }
}