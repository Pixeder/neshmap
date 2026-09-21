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

  hasDiagram: z
    .boolean()
    .default(false),

  diagramDescription: z
    .string()
    .nullable()
    .default(null),

  hasTable: z
    .boolean()
    .default(false),

  tableMarkdown: z
    .string()
    .nullable()
    .default(null),

  hasFlowchart: z
    .boolean()
    .default(false),

  flowchartMermaidCode: z
    .string()
    .nullable()
    .default(null),

  hasMathOrCode: z
    .boolean()
    .default(false),

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
>;