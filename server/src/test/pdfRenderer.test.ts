import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

import { renderPDFPages } from "../services/pdfRenderer.service.js";

const testPDFRenderer = async (): Promise<void> => {
  // console.log(process.cwd());
  const pdfPath = join(process.cwd(), "testFiles", "sample.pdf");

  const pdfBuffer = await readFile(pdfPath);

  const pages = await renderPDFPages(pdfBuffer, {
    scale: 2,
  });

  const outputDirectory = join(process.cwd(), "test-output", "rendered-pages");

  await mkdir(outputDirectory, {
    recursive: true,
  });

  for (const page of pages) {
    const outputPath = join(outputDirectory, `page-${page.pageNumber}.png`);

    await writeFile(outputPath, page.imageBuffer);

    console.log(`Saved page ${page.pageNumber}: ${outputPath}`);
  }

  console.log(`Total rendered pages: ${pages.length}`);
};

testPDFRenderer().catch((error: unknown) => {
  console.error("PDF rendering test failed:", error);
  process.exitCode = 1;
});
