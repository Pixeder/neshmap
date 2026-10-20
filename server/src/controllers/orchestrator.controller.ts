// src/controllers/orchestrator.controller.ts

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppResponse } from '../utils/appResponse.js';
import { AppError } from '../utils/appError.js';
import { OrchestratorAgentService } from '../services/orchestratorAgent.service.js';

const orchestrator = new OrchestratorAgentService();

export const handleAgentInteraction = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, documentId, query } = req.body;

  if (!studentId || !documentId || !query) {
    throw new AppError('studentId, documentId, and query are required fields.', 400);
  }

  const output = await orchestrator.handleUserMessage(studentId, documentId, query);

  res.status(200).json(
    AppResponse.success(`Handled successfully by [${output.executedTool}]`, output)
  );
});