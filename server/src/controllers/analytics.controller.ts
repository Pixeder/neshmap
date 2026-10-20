// src/controllers/analytics.controller.ts

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppResponse } from '../utils/appResponse.js';
import { AppError } from '../utils/appError.js';
import { AnalyticsService } from '../services/analytics.service.js';

const analyticsService = new AnalyticsService();

/**
 * Fetch Comprehensive Learning Dashboard Analytics
 */
export const getDashboardAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, documentId } = req.query as { studentId: string; documentId: string };

  if (!studentId || !documentId) {
    throw new AppError('studentId and documentId are required query parameters.', 400);
  }

  const analyticsData = await analyticsService.getStudentDashboardAnalytics(studentId, documentId);

  res.status(200).json(
    AppResponse.success('Dashboard analytics retrieved successfully.', analyticsData)
  );
});