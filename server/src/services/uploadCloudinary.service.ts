import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

// Ensure your environment variables are set in your .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
}

/**
 * Uploads a memory buffer directly to Cloudinary.
 * @param buffer - req.file.buffer from Multer
 * @param folder - Cloudinary folder path
 */
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string = 'rag_documents'
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    // Basic validation
    if (!buffer || buffer.length === 0) {
      return reject(new Error('Buffer is empty or invalid.'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'raw', // PDFs are best treated as raw files in Cloudinary
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          return reject(new Error(`Cloudinary Upload Error: ${error.message}`));
        }

        if (!result) {
          return reject(new Error('Cloudinary upload completed, but no result payload was returned.'));
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format || 'pdf',
        });
      }
    );

    // Convert Buffer to Readable Stream and pipe into Cloudinary
    const stream = Readable.from(buffer);

    stream.on('error', (streamError) => {
      reject(new Error(`Stream error during upload: ${streamError.message}`));
    });

    stream.pipe(uploadStream);
  });
};