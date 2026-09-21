import { TavilyResultItem } from "../types/webSearch.types.js";

export async function executeTavilySearch(query: string): Promise<TavilyResultItem[]> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  if (!tavilyApiKey) {
    throw new Error("Missing TAVILY_API_KEY environment variable.");
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tavilyApiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      max_results: 3,
      include_raw_content: false,
    }),
  });

  if (!response.ok) {
    console.error(`Tavily search failed for query "${query}":`, response.statusText);
    return [];
  }

  const data = await response.json();
  return (data.results || []) as TavilyResultItem[];
}