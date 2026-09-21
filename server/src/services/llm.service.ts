import { RetrievedChunk } from './query.service.js';
import { llm } from '../config/llm.config.js';
import {
  BaseMessage,
  HumanMessage,
} from '@langchain/core/messages';
import { llmSystemMessage } from '../prompts/llm.prompts.js';
import { AppError } from '../utils/index.js';

/**
 * Takes the user's question and the context retrieved from Qdrant,
 * and generates a natural language answer using an LLM.
 */
export const generateAnswerFromContext = async (
  question: string,
  contextChunks: RetrievedChunk[]
): Promise<string> => {

  // Combine retrieved chunks into a single context block
  const contextText = contextChunks
    .map(
      (chunk, index) =>
        `--- Chunk ${index + 1} ---\n${chunk.text}\n`
    )
    .join('\n');

  // Create the user's prompt
  const userPrompt = ` Context Information: ${contextText} User Question: ${question}`;

  // Create HumanMessage
  const userMessage = new HumanMessage(userPrompt);

  // Messages sent to the LLM
  const messages: BaseMessage[] = [
    llmSystemMessage,
    userMessage,
  ];

  try {
    // Call the LLM
    const response = await llm.invoke(messages);

    const answer = response.text;

    // Check if LLM returned an empty response
    if (!answer) {
      throw new AppError(
        'LLM returned an empty response.',
        502
      );
    }

    return answer;

  } catch (error: any) {

    // Preserve AppError
    if (error instanceof AppError) {
      throw error;
    }

    // Convert unknown LLM errors into AppError
    throw new AppError(
      `Failed to generate answer from LLM: ${error.message}`,
      502
    );
  }
};