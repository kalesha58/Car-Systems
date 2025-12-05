import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

/**
 * Upload image to Cloudinary
 * @param filePathOrBuffer - Path to the file (from multer disk storage) or Buffer (from memory storage)
 * @param folder - Optional folder name in Cloudinary
 * @returns Promise with upload result
 */
export const uploadToCloudinary = async (
  filePathOrBuffer: string | Buffer,
  folder: string = 'car-connect/posts',
): Promise<{ url: string; publicId: string }> => {
  try {
    // If it's a Buffer (memory storage), upload using upload_stream
    // If it's a string (disk storage), upload using file path
    let result;
    
    if (Buffer.isBuffer(filePathOrBuffer)) {
      // Memory storage - upload from buffer
      result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            transformation: [
              {
                quality: 'auto',
                fetch_format: 'auto',
              },
            ],
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
        resource_type: 'image',
        transformation: [
          {
            quality: 'auto',
            fetch_format: 'auto',
          },
        ],
      });
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
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

