// src/utils/webSearch.util.ts

import { tavily } from '@tavily/core';

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
}

/**
 * Performs real-time web search using Tavily API
 */
export async function performWebSearch(query: string, maxResults = 4): Promise<WebSearchResult[]> {
  try {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      console.warn('[Web Search Warning]: TAVILY_API_KEY is missing. Returning empty web context.');
      return [];
    }

    const tvly = tavily({ apiKey });
    const response = await tvly.search(query, {
      maxResults,
      searchDepth: 'basic',
      includeAnswer: false
    });

    return response.results.map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content
    }));
  } catch (error: any) {
    console.error('[Web Search Error]:', error.message);
    return [];
  }
}