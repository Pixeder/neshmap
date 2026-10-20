// src/middlewares/guardrail.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { checkPatternInjection, verifyDomainScope } from '../utils/guardrails.util.js';

export const guardrailMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userQuery = req.body?.query || req.query?.query;

    if (!userQuery || typeof userQuery !== 'string') {
      return next();
    }

    // Layer 1: Meta Llama Prompt Guard + Regex Scan
    await checkPatternInjection(userQuery);

    // Layer 2: Domain Scope & API Misuse Check
    await verifyDomainScope(userQuery);

    next();
  }
);