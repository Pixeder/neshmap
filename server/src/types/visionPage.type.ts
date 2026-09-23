import { z } from 'zod';

export const visionPageSchema = z.object({
  pageNumber: z
    .number()
    .int()
    .positive(),

  heading: z
    .array(z.string().trim())
    .default([]),

  subheading: z
    .array(z.string().trim())
    .default([]),

  diagramDescription: z
    .string()
    .nullable()
    .default(null),

  tableMarkdown: z
    .string()
    .nullable()
    .default(null),

  flowchartMermaidCode: z
    .string()
    .nullable()
    .default(null),

  mathLatex: z
    .string()
    .nullable()
    .default(null),

  codeContent: z
    .string()
    .nullable()
    .default(null),

  codeLanguage: z
    .string()
    .nullable()
    .default(null),

  keyConcepts: z
    .array(z.string().trim())
    .default([]),

  extractedText: z
    .string()
    .default(''),

  other: z
    .string()
    .nullable()
    .default(null),
});

export type VisionPageOutput = z.infer<
  typeof visionPageSchema
> & {pageNumber: number};