import streamifier from 'streamifier'
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary'
import { v2 as cloudinary } from 'cloudinary';

// A pure utility function that returns a Promise with the Cloudinary data
export const uploadFromBuffer = (fileBuffer: Buffer): Promise<{ url?: string; public_id?: string }> => {
  return new Promise((resolve, reject) => {

    cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

    const cldUploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'my_uploads', 
        resource_type: 'auto'  
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) return reject(error); // Rejects the promise on failure
        
        resolve({
          url: result?.secure_url,
          public_id: result?.public_id
        });
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(cldUploadStream);
  });
};


