// src/controllers/teaching.controller.ts

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppResponse } from '../utils/appResponse.js';
import { AppError } from '../utils/appError.js';
import { PedagogicalAgentService } from '../services/pedagogicalAgent.service.js';
import { AssessmentAgentService } from '../services/assessementAgent.service.js';

const pedagogicalAgent = new PedagogicalAgentService();
const assessmentAgent = new AssessmentAgentService();

/**
 * Synchronous Teaching Session Handler
 */
export const handleTeachingSession = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, documentId, query } = req.body;

  if (!studentId || !documentId) {
    throw new AppError('studentId and documentId are required fields.', 400);
  }

  const result = await pedagogicalAgent.teachTopic(studentId, documentId, query);

  res.status(200).json(
    AppResponse.success('Teaching response generated successfully.', result)
  );
});

/**
 * Real-Time Token Streaming Handler via Server-Sent Events (SSE)
 */
export const handleStreamTeachingSession = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, documentId, query } = req.query as {
    studentId: string;
    documentId: string;
    query?: string;
  };

  if (!studentId || !documentId) {
    throw new AppError('studentId and documentId are required query parameters.', 400);
  }

  // Set HTTP headers required for SSE connection
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Prevents NGINX buffering

  // Stream teaching session tokens
  await pedagogicalAgent.streamTeachTopic(studentId, documentId, res, query);
});

export const getQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, documentId } = req.query;

  const quiz = await assessmentAgent.generateQuizForTopic(
    studentId as string,
    documentId as string
  );
  res.status(200).json(AppResponse.success('Quiz generated.', quiz));
});

export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, documentId, submission } = req.body;

  const evaluation = await assessmentAgent.evaluateQuizSubmission(
    studentId,
    documentId,
    submission
  );
  res.status(200).json(AppResponse.success('Quiz evaluated.', evaluation));
});