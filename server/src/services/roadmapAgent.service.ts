// src/services/roadmapAgent.service.ts

import { QdrantClient } from '@qdrant/js-client-rest';
import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { GeneratedRoadmap } from '../interfaces/roadmap.interface.js';
import { RoadmapModel } from '../models/roadmap.model.js';
import { AppError } from '../utils/appError.js';

const TopicNodeZodSchema = z.object({
  topicId: z.string(),
  title: z.string(),
  description: z.string(),
  estimatedMinutes: z.number().default(15),
  prerequisiteTopicIds: z.array(z.string()),
  sourcePageNumbers: z.array(z.number()),
  orderIndex: z.number()
});

const ModuleZodSchema = z.object({
  moduleId: z.string(),
  moduleTitle: z.string(),
  description: z.string(),
  orderIndex: z.number(),
  topics: z.array(TopicNodeZodSchema)
});

export const RoadmapZodSchema = z.object({
  title: z.string(),
  overview: z.string(),
  totalEstimatedMinutes: z.number(),
  modules: z.array(ModuleZodSchema)
});

export class RoadmapAgentService {
  private qdrantClient: QdrantClient;
  private collectionName: string;
  private llm: ChatGroq;

  constructor() {
    this.qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY
    });
    this.collectionName = process.env.QDRANT_COLLECTION || 'study_materials';

    // Use a high-capacity text model on Groq
    this.llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'qwen/qwen3.8-27b', // High reasoning model for structuring curricula
      temperature: 0.1,
      maxTokens: 4096
    });
  }

  public async generateRoadmapForDocument(documentId: string): Promise<GeneratedRoadmap> {
    try {
      // 1. Check if roadmap exists in MongoDB
      const existingRoadmap = await RoadmapModel.findOne({ documentId });
      if (existingRoadmap) {
        return existingRoadmap.toObject() as GeneratedRoadmap;
      }

      // 2. Fetch all document metadata points from Qdrant
      const searchResult = await this.qdrantClient.scroll(this.collectionName, {
        filter: {
          must: [
            {
              key: 'documentId',
              match: { value: documentId }
            }
          ]
        },
        limit: 100,
        with_payload: true
      });

      if (!searchResult.points || searchResult.points.length === 0) {
        throw new AppError(`No indexed vector content found for document: ${documentId}`, 404);
      }

      // 3. Collect page metadata summaries
      const metadataList = searchResult.points.map((pt) => {
        const p = pt.payload as any;
        return {
          pageNumber: p.pageNumber,
          topics: p.topicsCovered || [],
          prerequisites: p.prerequisites || [],
          summary: p.summary || ''
        };
      });

      metadataList.sort((a, b) => a.pageNumber - b.pageNumber);

      const systemPrompt = `
You are an expert Pedagogical Curriculum Architect.
You are given summaries and metadata extracted from an educational document.
Your goal is to organize these topics into a sequential, structured learning roadmap.

CRITICAL INSTRUCTIONS:
- Group learning points into 2 to 5 Modules.
- Each module must contain sequential Topic Nodes.
- Set accurate prerequisite relationships using topic IDs.
- Return RAW VALID JSON ONLY. Do not include markdown blocks (\`\`\`json).

EXPECTED JSON SCHEMA:
{
  "title": "Course Title",
  "overview": "Overview of the curriculum",
  "totalEstimatedMinutes": 120,
  "modules": [
    {
      "moduleId": "mod_1",
      "moduleTitle": "Module 1 Title",
      "description": "Module description",
      "orderIndex": 1,
      "topics": [
        {
          "topicId": "topic_1_1",
          "title": "Topic Title",
          "description": "Topic explanation",
          "estimatedMinutes": 20,
          "prerequisiteTopicIds": [],
          "sourcePageNumbers": [1],
          "orderIndex": 1
        }
      ]
    }
  ]
}
`;

      const userPrompt = `Document ID: ${documentId}\nPage Summaries:\n${JSON.stringify(metadataList, null, 2)}`;

      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ], {
        response_format: { type: 'json_object' }
      });

      const rawText = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      // Sanitize response string
      const cleanedJson = rawText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsedData = JSON.parse(cleanedJson);
      const validatedRoadmap = RoadmapZodSchema.parse(parsedData);

      const fullRoadmap: GeneratedRoadmap = {
        documentId,
        ...validatedRoadmap
      };

      // 4. Save generated roadmap to MongoDB
      await RoadmapModel.create(fullRoadmap);
      console.log(`[RoadmapAgent] Generated and persisted roadmap for ${documentId}`);

      return fullRoadmap;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Roadmap Generation Failed: ${error.message}`, 500);
    }
  }
}