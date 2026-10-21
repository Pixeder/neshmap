// src/hooks/useAgentStream.ts

import { useState, useCallback } from 'react';

interface StreamState {
  isStreaming: boolean;
  content: string;
  error: string | null;
  metadata: any | null;
}

export function useAgentStream() {
  const [streamState, setStreamState] = useState<StreamState>({
    isStreaming: false,
    content: '',
    error: null,
    metadata: null,
  });

  const streamQuery = useCallback(
    async (studentId: string, documentId: string, query: string, onChunk?: (chunk: string) => void) => {
      setStreamState({ isStreaming: true, content: '', error: null, metadata: null });

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const encodedQuery = encodeURIComponent(query);
      const url = `${baseUrl}/api/teaching/stream?studentId=${studentId}&documentId=${documentId}&query=${encodedQuery}`;

      try {
        const eventSource = new EventSource(url);
        let fullText = '';

        eventSource.onmessage = (event) => {
          if (event.data === '[DONE]') {
            eventSource.close();
            setStreamState((prev) => ({ ...prev, isStreaming: false }));
            return;
          }

          try {
            const parsed = JSON.parse(event.data);
            if (parsed.chunk) {
              fullText += parsed.chunk;
              if (onChunk) onChunk(parsed.chunk);
              setStreamState((prev) => ({ ...prev, content: fullText }));
            }
            if (parsed.metadata) {
              setStreamState((prev) => ({ ...prev, metadata: parsed.metadata }));
            }
          } catch {
            fullText += event.data;
            setStreamState((prev) => ({ ...prev, content: fullText }));
          }
        };

        eventSource.onerror = (err) => {
          console.error('[SSE Error]:', err);
          eventSource.close();
          setStreamState((prev) => ({
            ...prev,
            isStreaming: false,
            error: 'Connection interrupted. Please try again.',
          }));
        };
      } catch (err: any) {
        setStreamState({
          isStreaming: false,
          content: '',
          error: err.message || 'Failed to establish event stream.',
          metadata: null,
        });
      }
    },
    []
  );

  return { ...streamState, streamQuery };
}