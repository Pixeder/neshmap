// src/routes/roadmap.route.ts

import { Router } from 'express';
import { generateRoadmap } from '../controllers/roadmap.controller.js';

const router = Router();

/**
 * @openapi
 * /api/roadmap/{documentId}:
 *   get:
 *     summary: Generate or fetch structured curriculum roadmap for document
 *     tags: [Roadmap Generation]
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Structured course modules and topic graph returned.
 */
router.get('/:documentId', generateRoadmap);

export default router;