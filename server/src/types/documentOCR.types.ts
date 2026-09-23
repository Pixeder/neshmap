import { RenderedPage } from "./renderedPages.type.js";

export interface DocumentOCRWorkflowInput {
  pages: RenderedPage[];
  documentUrl: string;
  publicId: string;
  metadata?: Record<string, unknown>;
}