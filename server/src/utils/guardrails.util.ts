// src/utils/guardrails.util.ts

import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { AppError } from './appError.js';

/**
 * Layer 1: High-risk prompt injection and jailbreak patterns
 */
const INJECTION_PATTERNS = [
  /ignore\s+all\s+(previous|prior|above)\s+instructions/i,
  /disregard\s+(your|all)\s+guidelines/i,
  /forget\s+everything\s+above/i,
  /you\s+are\s+now\s+a/i,
  /act\s+as\s+a\s+(dan|jailbreak|developer\s+mode)/i,
  /show\s+me\s+your\s+system\s+prompt/i,
  /print\s+your\s+initial\s+instructions/i,
  /reveal\s+(the|your)\s+(api\s*key|secret|system\s*prompt)/i,
  /override\s+safety\s+filter/i,
  /bypass\s+restrictions/i
];

/**
 * Layer 1 Guardrail: Fast regex pattern scan
 */
export function checkPatternInjection(userInput: string): void {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(userInput)) {
      throw new AppError(
        'Security Violation: Prompt contains disallowed override or injection patterns.',
        400
      );
    }
  }
}

/**
 * Layer 2 Guardrail: Strict Domain Scope Verification (Prevents API Key Misuse)
 */
export async function verifyDomainScope(userInput: string): Promise<void> {
  const fastClassifier = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: 'openai/gpt-oss-20b',
    temperature: 0.0
  });

  const systemPrompt = `
You are a strict, binary Security Classifier for an Educational AI Platform.
Analyze the user query and classify whether it is strictly related to studying, education, or course material.

ALLOWED QUERIES:
- Academic concepts, science, math, computer vision, SIFT, Hough transform, coding, study questions, roadmaps, quizzes, or textbook help.

DISALLOWED QUERIES (MUST BLOCK):
- Creative writing, poems, songs, stories, novels, personal finance, marketing emails, cold calls, business pitches, roleplay, casual general assistant tasks.

OUTPUT REQUIREMENTS:
You MUST respond with raw JSON only. Do not include markdown code blocks, text explanations, or formatting outside JSON.

Format:
{"allowed": true, "reason": "Valid educational query"}
or
{"allowed": false, "reason": "Off-topic query or API key misuse attempt"}
`;

  try {
    const response = await fastClassifier.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userInput)
    ]);

    let rawText =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

    // Clean potential markdown blocks or formatting wrappers
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    const result = JSON.parse(rawText);

    // CRITICAL FIX: Explicitly throw AppError on disallowed queries
    if (result.allowed === false) {
      throw new AppError(
        `Scope Guardrail Triggered: Request blocked because it is off-topic or violates platform guidelines (${result.reason || 'Off-topic request'}).`,
        403
      );
    }
  } catch (error: any) {
    // Rethrow 403 AppError immediately so express middleware stops execution
    if (error instanceof AppError) {
      throw error;
    }

    // Fallback: If JSON parsing or classification fails, fail-safe block the suspicious input
    console.error('[Guardrail Classification Error]:', error.message);
    throw new AppError(
      'Security Exception: Unable to verify request domain scope.',
      403
    );
  }
}

/**
 * Layer 3 Guardrail: System Prompt Delimiter Wrapper
 */
export function wrapUserInputSafely(userInput: string): string {
  const sanitizedInput = userInput.replace(/<\/?user_input>/gi, '');
  return `<user_input>\n${sanitizedInput}\n</user_input>`;
}