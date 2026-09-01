import { z } from "zod";

// Schema for individual subtopics within a study module
export const SubtopicSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  estimatedMinutes: z.number().int().positive(),
  pageReferences: z.array(z.number().int().positive()),
  keyConcepts: z.array(z.string()),
});

// Schema for top-level roadmap modules (e.g., "Unit 1: Naive Bayes")
export const ModuleSchema = z.object({
  id: z.string().uuid(),
  moduleNumber: z.number().int().positive(),
  title: z.string(),
  summary: z.string(),
  targetPageRange: z.object({
    start: z.number().int().positive(),
    end: z.number().int().positive(),
  }),
  subtopics: z.array(SubtopicSchema),
});

// Full Curriculum Structure
export const SyllabusSchema = z.object({
  documentId: z.string(),
  subjectName: z.string(),
  totalEstimatedHours: z.number(),
  modules: z.array(ModuleSchema),
});

// Infer TypeScript Interfaces
export type Subtopic = z.infer<typeof SubtopicSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Syllabus = z.infer<typeof SyllabusSchema>;