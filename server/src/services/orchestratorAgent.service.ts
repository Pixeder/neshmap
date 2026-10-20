// src/services/orchestratorAgent.service.ts

import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { QdrantClient } from '@qdrant/js-client-rest';
import {
  pedagogicalTutorTool,
  directQaTool,
  assessmentQuizTool,
  roadmapOverviewTool,
  webSearchTool
} from '../tools/learningAgent.tools.js';
import { AppError } from '../utils/appError.js';

export class OrchestratorAgentService {
  private llmWithTools;
  private toolsMap: Record<string, any>;
  private qdrantClient: QdrantClient;
  private collectionName: string;

  constructor() {
    const tools = [
      pedagogicalTutorTool,
      directQaTool,
      assessmentQuizTool,
      roadmapOverviewTool,
      webSearchTool
    ];

    this.toolsMap = {
      pedagogical_tutor_tool: pedagogicalTutorTool,
      direct_qa_tool: directQaTool,
      assessment_quiz_tool: assessmentQuizTool,
      roadmap_overview_tool: roadmapOverviewTool,
      web_search_tool: webSearchTool
    };

    this.qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY
    });
    this.collectionName = process.env.QDRANT_COLLECTION || 'study_materials';

    const llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'qwen/qwen3.8-27b',
      temperature: 0.1
    });

    this.llmWithTools = llm.bindTools(tools);
  }

  /**
   * Helper: Quickly fetches vector search snippets to give the Orchestrator context awareness
   */
  private async getContextPreview(documentId: string, query: string): Promise<string> {
    try {
      // Fetch top 3 vector matches for relevance check
      const searchResults = await this.qdrantClient.scroll(this.collectionName, {
        filter: {
          must: [{ key: 'documentId', match: { value: documentId } }]
        },
        limit: 3,
        with_payload: true
      });

      if (!searchResults.points || searchResults.points.length === 0) {
        return 'NO_CONTEXT_FOUND';
      }

      return searchResults.points
        .map((pt) => (pt.payload as any).contentMarkdown)
        .join('\n---\n');
    } catch {
      return 'NO_CONTEXT_FOUND';
    }
  }

  public async handleUserMessage(studentId: string, documentId: string, userQuery: string) {
    try {
      // Step 1: Pre-fetch vector context preview from Qdrant
      const contextPreview = await this.getContextPreview(documentId, userQuery);

      // Step 2: Inject retrieved context into Orchestrator prompt
      const systemPrompt = `
You are the Orchestrator Engine for an AI-powered Adaptive Learning Platform.
Analyze the student query alongside the retrieved document context preview below to select the single best tool:

RETRIEVED DOCUMENT CONTEXT PREVIEW:
"""
${contextPreview}
"""

ROUTING RULES:
1. 'pedagogical_tutor_tool': Student wants step-by-step Socratic teaching or conceptual guidance related to the document.
2. 'direct_qa_tool': Student asks a short, direct question that IS ANSWERABLE using the retrieved document context.
3. 'assessment_quiz_tool': Student explicitly requests a quiz, practice test, or questions.
4. 'roadmap_overview_tool': Student asks about syllabus, modules, or course structure.
5. 'web_search_tool': The query is OUT OF CONTEXT (the retrieved document snippet above does NOT contain information about the query, or the user is asking about general world facts/external topics).

Environment Variables:
- studentId: "${studentId}"
- documentId: "${documentId}"
`;

      const response = await this.llmWithTools.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userQuery)
      ]);

      if (response.tool_calls && response.tool_calls.length > 0) {
        const toolCall = response.tool_calls[0];
        const selectedTool = this.toolsMap[toolCall.name];

        if (!selectedTool) {
          throw new AppError(`Selected tool ${toolCall.name} not found.`, 500);
        }

        const toolArgs = {
          studentId,
          documentId,
          ...toolCall.args
        };

        const toolExecutionResult = await selectedTool.invoke(toolArgs);

        return {
          executedTool: toolCall.name,
          result: JSON.parse(toolExecutionResult)
        };
      }

      return {
        executedTool: 'none',
        result: {
          response: typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
        }
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Orchestrator Processing Failed: ${error.message}`, 500);
    }
  }
}