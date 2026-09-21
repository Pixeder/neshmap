import { Request, Response } from 'express';

import { retrieveContextFromQdrant } from '../services/query.service.js';
import { generateAnswerFromContext } from '../services/llm.service.js';

import {
  asyncHandler,
  AppError,
  AppResponse,
} from '../utils/index.js';

/**
 * Unified Query & LLM Controller
 *
 * Coordinates:
 * User Query
 * -> Query Embedding
 * -> Qdrant Vector Search
 * -> LLM Completion
 */
export const queryRagTeacher = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {

    const { question, limit } = req.body;

    // 1. Validate user question

    if (
      !question ||
      typeof question !== 'string' ||
      question.trim().length === 0
    ) {
      throw new AppError(
        'A valid question string is required.',
        400
      );
    }

    // 2. Validate and normalize limit

    const parsedLimit =
      limit === undefined
        ? 5
        : Number(limit);

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 50
    ) {
      throw new AppError(
        'Limit must be an integer between 1 and 50.',
        400
      );
    }

    // 3. Retrieve context from Qdrant

    const contextChunks =
      await retrieveContextFromQdrant({
        queryText: question.trim(),
        limit: parsedLimit,
      });

    // 4. Handle missing context

    if (contextChunks.length === 0) {

      res
        .status(404)
        .json(
          AppResponse.success(
            'No relevant information found in the knowledge base.',
            {
              answer:
                'No relevant documents or information were found to answer your query.',
              sources: [],
            }
          )
        );

      return;
    }

    // 5. Generate answer using LLM

    const answer =
      await generateAnswerFromContext(
        question.trim(),
        contextChunks
      );

    // 6. Collect unique source document URLs

    const uniqueSources = Array.from(
      new Set(
        contextChunks
          .map((chunk) => chunk.documentUrl)
          .filter(
            (url): url is string =>
              typeof url === 'string' &&
              url.trim().length > 0
          )
      )
    );

    // 7. Send successful response

    res
      .status(200)
      .json(
        AppResponse.success(
          'Response generated successfully.',
          {
            answer,
            sources: uniqueSources,
            rawContext: contextChunks,
          }
        )
      );
  }
);