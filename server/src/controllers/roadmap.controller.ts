// src/controllers/roadmap.controller.ts

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppResponse } from '../utils/appResponse.js';
import { AppError } from '../utils/appError.js';
import { RoadmapAgentService } from '../services/roadmapAgent.service.js';

const roadmapAgent = new RoadmapAgentService();

export const generateRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const { documentId } = req.params;

  if (!documentId) {
    throw new AppError('Document ID is required parameter.', 400);
  }

  const roadmap = await roadmapAgent.generateRoadmapForDocument(documentId);

  res.status(200).json(
    AppResponse.success('Roadmap generated successfully.', roadmap)
  );
});