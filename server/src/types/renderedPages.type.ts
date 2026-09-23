export interface RenderedPage {
  pageNumber: number;
  imageBuffer: Buffer;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
}