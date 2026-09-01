// Payload structure stored inside Qdrant per handwritten page chunk
export interface NoteChunkPayload {
  documentId: string;
  pageNumber: number;
  rawMarkdown: string;       // Math extracted in LaTeX
  diagramDescriptions: string[];
  extractedTopics: string[];
  hasEquations: boolean;
  other: string[];
}

// Interface for the Web Research Agent output
export interface WebResearchResult {
  topicId: string;
  sourceUrl: string;
  title: string;
  supplementalText: string;
  codeSnippets?: string[];
}

// Final context bundle fed to the Pedagogical Synthesizer
export interface LectureSynthesisContext {
  topicTitle: string;
  localNotesContext: NoteChunkPayload[];
  externalWebContext: WebResearchResult[];
  userLearningGoal: "quick_exam_prep" | "in_depth_understanding";
}