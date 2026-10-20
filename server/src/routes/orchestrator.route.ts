// src/routes/orchestrator.route.ts

import { Router } from 'express';
import { handleAgentInteraction } from '../controllers/orchestrator.controller.js';
import { guardrailMiddleware } from '../middleware/guardrail.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/agent/interact:
 *   post:
 *     summary: Central Tool-Calling Agentic Gateway
 *     tags: [Agent Orchestrator]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, documentId, query]
 *             properties:
 *               studentId: { type: string }
 *               documentId: { type: string }
 *               query: { type: string }
 *     responses:
 *       200:
 *         description: Action executed by delegated agent tool.
 */
router.post('/interact', guardrailMiddleware, handleAgentInteraction);

export default router;