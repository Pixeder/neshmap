import { Router } from 'express';
import {queryRagTeacher } from '../controllers/query.controller.js';

const router = Router();

// Query Pipeline: Expects JSON body { "question": string, "limit"?: number }
router.post('/ask', queryRagTeacher);

export default router;