import { pdf } from "pdf-to-img"; // Use the named export 'pdf'

export interface PdfConversionOptions {
  /** Target image resolution scale factor (Default: 2.0). */
  scale?: number;
  /** Page numbers to render (1-based index). If omitted, renders all pages. */
  pageNumbers?: number[];
}

export async function convertPdfToImageBuffers(
  pdfSource: string | Buffer,
  options: PdfConversionOptions = {}
): Promise<Buffer[]> {
  const { scale = 2.0, pageNumbers } = options;

  try {
    const documentPages = await pdf(pdfSource, { scale });

    const imageBuffers: Buffer[] = [];
    let currentPage = 1;

    for await (const pageImage of documentPages) {
      // Filter specific pages if pageNumbers array was provided
      if (!pageNumbers || pageNumbers.includes(currentPage)) {
        imageBuffers.push(pageImage);
      }
      currentPage++;
    }

    return imageBuffers;
  } catch (error) {
    console.error("Failed to split PDF into image buffers:", error);
    throw new Error(
      `PDF to Image Conversion Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}