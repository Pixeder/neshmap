// src/tools/learningAgent.tools.ts

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { PedagogicalAgentService } from '../services/pedagogicalAgent.service.js';
import { AssessmentAgentService } from '../services/assessementAgent.service.js';
import { RoadmapModel } from '../models/roadmap.model.js';
import { performWebSearch } from '../utils/webSearch.util.js';

const pedagogicalService = new PedagogicalAgentService();
const assessmentService = new AssessmentAgentService();

const fastLlm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'openai/gpt-oss-20b',
  temperature: 0.2
});

/**
 * Tool 1: Socratic Pedagogical Tutor Tool
 */
export const pedagogicalTutorTool = new DynamicStructuredTool({
  name: 'pedagogical_tutor_tool',
  description:
    'Use this tool when the student wants step-by-step explanations, conceptual learning, Socratic guidance, or detailed breakdown of the current study topic.',
  schema: z.object({
    studentId: z.string().describe('The ID of the student'),
    documentId: z.string().describe('The document ID'),
    query: z.string().describe('The conceptual question or prompt from the student')
  }),
  func: async ({ studentId, documentId, query }) => {
    const result = await pedagogicalService.teachTopic(studentId, documentId, query);
    return JSON.stringify(result);
  }
});

/**
 * Tool 2: Direct Q&A Tool (RAG + Web Search Hybrid Fallback)
 */
export const directQaTool = new DynamicStructuredTool({
  name: 'direct_qa_tool',
  description:
    'Use this tool when the student asks a quick, direct factual question or definition that requires a concise answer.',
  schema: z.object({
    studentId: z.string().describe('The ID of the student'),
    documentId: z.string().describe('The document ID'),
    query: z.string().describe('The quick factual query')
  }),
  func: async ({ studentId, documentId, query }) => {
    // 1. First attempt local RAG retrieval via Pedagogical Service
    const ragResult = await pedagogicalService.teachTopic(studentId, documentId, query);

    // If RAG produced a solid response, return concise direct answer
    return JSON.stringify({
      mode: 'DIRECT_QA',
      answer: ragResult.response,
      source: 'TEXTBOOK_RAG'
    });
  }
});

/**
 * Tool 3: Diagnostic Assessment & Quiz Tool
 */
export const assessmentQuizTool = new DynamicStructuredTool({
  name: 'assessment_quiz_tool',
  description:
    'Use this tool when the student asks for a quiz, practice test, exercise, or assessment to evaluate their knowledge on the current topic.',
  schema: z.object({
    studentId: z.string().describe('The ID of the student'),
    documentId: z.string().describe('The document ID')
  }),
  func: async ({ studentId, documentId }) => {
    const quiz = await assessmentService.generateQuizForTopic(studentId, documentId);
    return JSON.stringify({
      mode: 'QUIZ',
      quiz
    });
  }
});

/**
 * Tool 4: Roadmap Overview Tool
 */
export const roadmapOverviewTool = new DynamicStructuredTool({
  name: 'roadmap_overview_tool',
  description:
    'Use this tool when the student asks about overall course progress, syllabus structure, module listing, or what topic comes next.',
  schema: z.object({
    documentId: z.string().describe('The document ID')
  }),
  func: async ({ documentId }) => {
    const roadmap = await RoadmapModel.findOne({ documentId });
    if (!roadmap) return JSON.stringify({ error: 'Roadmap not found.' });

    const modulesSummary = roadmap.modules.map((m) => ({
      moduleTitle: m.moduleTitle,
      topicsCount: m.topics.length,
      topics: m.topics.map((t) => t.title)
    }));

    return JSON.stringify({
      courseTitle: roadmap.title,
      modules: modulesSummary
    });
  }
});

/**
 * Tool 5: Out-of-Context Real-Time Web Search Agent Tool
 */
export const webSearchTool = new DynamicStructuredTool({
  name: 'web_search_tool',
  description:
    'Use this tool when the student query is out of context of the uploaded textbook or asks about general world knowledge, real-time events, or external resources.',
  schema: z.object({
    query: z.string().describe('The search query for external web context')
  }),
  func: async ({ query }) => {
    // 1. Execute live web search
    const searchResults = await performWebSearch(query);

    if (searchResults.length === 0) {
      return JSON.stringify({
        mode: 'WEB_SEARCH',
        response: `I searched for "${query}", but could not retrieve live web results at this moment. Please rephrase or try another topic.`
      });
    }

    // 2. Format web results context for LLM synthesis
    const webContext = searchResults
      .map((r, i) => `[Source ${i + 1}]: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`)
      .join('\n\n---\n\n');

    const synthesisPrompt = `
You are a General Web Q&A Educational Agent.
Synthesize a clear, accurate, and concise answer to the student's query using strictly the retrieved live web search results below.

RETRIEVED WEB CONTEXT:
${webContext}

STUDENT QUERY:
"${query}"

INSTRUCTIONS:
1. Provide a direct, well-structured answer using clean markdown.
2. Cite sources using numbers like [Source 1], [Source 2] matching the URLs provided.
3. Keep the tone helpful, objective, and educational.
`;

    const response = await fastLlm.invoke([
      new SystemMessage(synthesisPrompt),
      new HumanMessage(query)
    ]);

    const synthesizedAnswer =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

    return JSON.stringify({
      mode: 'WEB_SEARCH',
      answer: synthesizedAnswer,
      sources: searchResults.map((r) => ({ title: r.title, url: r.url }))
    });
  }
});