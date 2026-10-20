// src/routes/analytics.route.ts

import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analytics.controller.js';

const router = Router();

/**
 * @openapi
 * /api/analytics/dashboard:
 *   get:
 *     summary: Retrieve student progress, heatmap metrics, and weakness radar analytics
 *     tags: [Analytics & Progress Dashboard]
 *     parameters:
 *       - in: query
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full analytics payload returned for front-end charts and heatmaps.
 */
router.get('/dashboard', getDashboardAnalytics);

export default router;