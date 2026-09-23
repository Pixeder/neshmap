import { VisionPageOutput } from '../types/visionPage.type.js';

export const visionOutputToText = (
  page: VisionPageOutput
): string => {
  const sections: string[] = [];

  sections.push(`Page Number: ${page.pageNumber}`);

  if (page.heading.length > 0) {
    sections.push(
      `Headings:\n${page.heading.join('\n')}`
    );
  }

  if (page.subheading.length > 0) {
    sections.push(
      `Subheadings:\n${page.subheading.join('\n')}`
    );
  }

  if (page.extractedText.trim()) {
    sections.push(
      `Extracted Text:\n${page.extractedText.trim()}`
    );
  }

  if (page.keyConcepts.length > 0) {
    sections.push(
      `Key Concepts:\n${page.keyConcepts.join('\n')}`
    );
  }

  if (page.diagramDescription) {
    sections.push(
      `Diagram Description:\n${page.diagramDescription}`
    );
  }

  if (page.tableMarkdown) {
    sections.push(
      `Table:\n${page.tableMarkdown}`
    );
  }

  if (page.flowchartMermaidCode) {
    sections.push(
      `Flowchart:\n${page.flowchartMermaidCode}`
    );
  }

  if (page.mathLatex) {
    sections.push(
      `Mathematics:\n${page.mathLatex}`
    );
  }

  if (page.codeContent) {
    sections.push(
      `Code${page.codeLanguage ? ` (${page.codeLanguage})` : ''}:\n${page.codeContent}`
    );
  }

  if (page.other) {
    sections.push(`Other Information:\n${page.other}`);
  }

  return sections.join('\n\n');
};