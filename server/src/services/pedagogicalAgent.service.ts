// src/services/pedagogicalAgent.service.ts

import { Response } from 'express';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StudentStateModel } from '../models/studentState.model.js';
import { RoadmapModel } from '../models/roadmap.model.js';
import { AppError } from '../utils/appError.js';

export class PedagogicalAgentService {
  private qdrantClient: QdrantClient;
  private collectionName: string;
  private llm: ChatGroq;

  constructor() {
    this.qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL,
    });
    this.collectionName = process.env.QDRANT_COLLECTION || 'study_materials';

    this.llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'openai/gpt-oss-120b',
      temperature: 0.3
    });
  }

  /**
   * Helper: Resolves Student State, Active Topic, and RAG Context from Qdrant
   */
  private async prepareTeachingContext(
    studentId: string,
    documentId: string
  ) {
    let studentState = await StudentStateModel.findOne({ studentId, documentId });
    const roadmap = await RoadmapModel.findOne({ documentId });

    if (!roadmap) {
      throw new AppError(`Roadmap not found for document ${documentId}`, 404);
    }

    const firstTopicId = roadmap.modules[0]?.topics[0]?.topicId;
    if (!studentState) {
      studentState = await StudentStateModel.create({
        studentId,
        documentId,
        currentTopicId: firstTopicId,
        overallMasteryScore: 0,
        topicProgress: {
          [firstTopicId]: {
            topicId: firstTopicId,
            status: 'IN_PROGRESS',
            masteryScore: 0,
            weakPoints: [],
            assessmentAttempts: []
          }
        }
      });
    }

    let activeTopic: any = null;
    for (const mod of roadmap.modules) {
      const found = mod.topics.find((t) => t.topicId === studentState!.currentTopicId);
      if (found) {
        activeTopic = found;
        break;
      }
    }

    if (!activeTopic) {
      throw new AppError(`Active topic ${studentState.currentTopicId} not found in roadmap`, 404);
    }

    const vectorSearchResults = await this.qdrantClient.scroll(this.collectionName, {
      filter: {
        must: [
          { key: 'documentId', match: { value: documentId } },
          { key: 'pageNumber', match: { any: activeTopic.sourcePageNumbers } }
        ]
      },
      limit: 10,
      with_payload: true
    });

    const retrievedContext = vectorSearchResults.points
      .map((pt) => (pt.payload as any).contentMarkdown)
      .join('\n\n---\n\n');

    const topicProgressInfo = studentState.topicProgress.get(activeTopic.topicId);
    const masteryScore = topicProgressInfo?.masteryScore || 0;
    const weakPoints = topicProgressInfo?.weakPoints?.join(', ') || 'None identified yet';

    const systemPrompt = `
You are an adaptive, world-class Socratic Pedagogical Tutor teaching "${activeTopic.title}".
Your goal is to help the student master this topic step-by-step using the provided textbook context.

STUDENT STATE:
- Current Topic: ${activeTopic.title}
- Description: ${activeTopic.description}
- Current Mastery Level: ${(masteryScore * 100).toFixed(0)}%
- Known Weaknesses: ${weakPoints}

RAG TEXTBOOK CONTEXT:
${retrievedContext}

INSTRUCTIONS:
1. Explain concepts step-by-step using clear markdown, LaTeX formulas (if mathematical), and clear visual descriptions.
2. If the student has identified weaknesses, explicitly address them.
3. Keep explanations grounded strictly in the provided RAG context.
4. End your explanation with a quick diagnostic question to verify their understanding before suggesting an assessment.
`;

    return {
      studentState,
      activeTopic,
      systemPrompt,
      masteryScore
    };
  }

  /**
   * Conducts a synchronous interactive teaching session
   */
  public async teachTopic(
    studentId: string,
    documentId: string,
    userQuery?: string
  ): Promise<{ response: string; currentTopicTitle: string; masteryScore: number }> {
    try {
      const { studentState, activeTopic, systemPrompt, masteryScore } =
        await this.prepareTeachingContext(studentId, documentId);

      const promptMessage = userQuery || `Hello tutor! Please start teaching me the topic: ${activeTopic.title}`;

      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(promptMessage)
      ]);

      const tutorResponse = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      studentState.recentMemory.push(
        { role: 'user', content: promptMessage, timestamp: new Date() },
        { role: 'assistant', content: tutorResponse, timestamp: new Date() }
      );

      if (studentState.recentMemory.length > 10) {
        studentState.recentMemory = studentState.recentMemory.slice(-10);
      }

      await studentState.save();

      return {
        response: tutorResponse,
        currentTopicTitle: activeTopic.title,
        masteryScore
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Pedagogical Teaching Session Failed: ${error.message}`, 500);
    }
  }

  /**
   * Streams token-by-token tutor responses to client over SSE
   */
  public async streamTeachTopic(
    studentId: string,
    documentId: string,
    res: Response,
    userQuery?: string
  ): Promise<void> {
    try {
      const { studentState, activeTopic, systemPrompt, masteryScore } =
        await this.prepareTeachingContext(studentId, documentId);

      const promptMessage = userQuery || `Hello tutor! Please start teaching me the topic: ${activeTopic.title}`;

      // Notify frontend client of initial topic metadata
      res.write(
        `data: ${JSON.stringify({
          type: 'metadata',
          currentTopicTitle: activeTopic.title,
          masteryScore
        })}\n\n`
      );

      // Initiate LLM streaming call
      const stream = await this.llm.stream([
        new SystemMessage(systemPrompt),
        new HumanMessage(promptMessage)
      ]);

      let fullResponseText = '';

      for await (const chunk of stream) {
        const token = typeof chunk.content === 'string' ? chunk.content : '';
        if (token) {
          fullResponseText += token;
          res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
        }
      }

      // Save complete generated message to student state history
      studentState.recentMemory.push(
        { role: 'user', content: promptMessage, timestamp: new Date() },
        { role: 'assistant', content: fullResponseText, timestamp: new Date() }
      );

      if (studentState.recentMemory.length > 10) {
        studentState.recentMemory = studentState.recentMemory.slice(-10);
      }

      await studentState.save();

      // Emit completion frame and end stream
      res.write(`data: ${JSON.stringify({ type: 'done', fullResponse: fullResponseText })}\n\n`);
      res.end();
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  }
}