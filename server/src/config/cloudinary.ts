import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

/**
 * Upload file to Cloudinary
 * @param filePathOrBuffer - Path to the file (from multer disk storage) or Buffer (from memory storage)
 * @param folder - Optional folder name in Cloudinary
 * @param options - Upload options (e.g. resourceType)
 * @returns Promise with upload result
 */
export const uploadToCloudinary = async (
  filePathOrBuffer: string | Buffer,
  folder: string = 'car-connect/posts',
  options?: {
    /**
     * Cloudinary resource_type:
     * - 'image' for images (enables image transformations)
     * - 'auto' for mixed uploads (e.g. PDFs)
     */
    resourceType?: 'image' | 'auto';
  },
): Promise<{ url: string; publicId: string }> => {
  try {
    // If it's a Buffer (memory storage), upload using upload_stream
    // If it's a string (disk storage), upload using file path
    let result;
    const resourceType = options?.resourceType ?? 'image';
    const transformation =
      resourceType === 'image'
        ? [
            {
              quality: 'auto',
              fetch_format: 'auto',
            },
          ]
        : undefined;
    
    if (Buffer.isBuffer(filePathOrBuffer)) {
      // Memory storage - upload from buffer
      result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType,
            transformation,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(filePathOrBuffer);
      });
    } else {
      // Disk storage - upload from file path
      result = await cloudinary.uploader.upload(filePathOrBuffer, {
        folder,
        resource_type: resourceType,
        transformation,
      });
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

/**
 * Delete image from Cloudinary
 * @param publicId - Public ID of the image
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

export default cloudinary;

