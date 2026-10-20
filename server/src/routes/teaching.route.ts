// src/routes/teaching.route.ts

import { Router } from 'express';
import {
  handleTeachingSession,
  handleStreamTeachingSession,
  getQuiz,
  submitQuiz
} from '../controllers/teaching.controller.js';

const router = Router();

/**
 * @openapi
 * /api/teaching/session:
 *   post:
 *     summary: Socratic Pedagogical Agent Session (Synchronous)
 *     tags: [Pedagogical Agent]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TeachingSessionRequest'
 *     responses:
 *       200:
 *         description: Teaching response generated.
 */
router.post('/session', handleTeachingSession);

/**
 * @openapi
 * /api/teaching/stream:
 *   get:
 *     summary: Real-Time SSE Token Streaming Session
 *     tags: [Pedagogical Agent]
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
 *       - in: query
 *         name: query
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SSE Stream established (`text/event-stream`).
 */
router.get('/stream', handleStreamTeachingSession);

/**
 * @openapi
 * /api/teaching/quiz:
 *   get:
 *     summary: Fetch active topic diagnostic assessment
 *     tags: [Assessment Agent]
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
 *         description: Diagnostic quiz generated.
 */
router.get('/quiz', getQuiz);

/**
 * @openapi
 * /api/teaching/quiz/submit:
 *   post:
 *     summary: Submit quiz answers and advance student state on passing
 *     tags: [Assessment Agent]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuizSubmissionRequest'
 *     responses:
 *       200:
 *         description: Assessment evaluated.
 */
router.post('/quiz/submit', submitQuiz);

export default router;