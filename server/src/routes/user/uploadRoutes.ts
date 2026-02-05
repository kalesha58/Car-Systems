import { Router } from 'express';
import { uploadSingle, uploadMultiple, uploadFile } from '../../middleware/uploadMiddleware';
import { uploadToCloudinary } from '../../config/cloudinary';
import { authMiddleware, IAuthRequest, IMulterFile } from '../../middleware/authMiddleware';
import { Response, NextFunction } from 'express';
import fs from 'fs';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Upload single image
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/image', authMiddleware, uploadSingle, async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    logger.info('File upload request received');
    
    if (!req.file) {
      logger.warn('No file provided in upload request');
      return res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'No file provided',
        },
      });
    }

    // Determine if using memory storage (buffer) or disk storage (path)
    const fileSource = (req.file as any).buffer || req.file.path;
    const isPDF = req.file.mimetype === 'application/pdf';
    const isImage = req.file.mimetype.startsWith('image/');
    
    logger.info(`Uploading file, size: ${req.file.size} bytes, type: ${req.file.mimetype}, isPDF: ${isPDF}, isImage: ${isImage}`);

    // Use different folder for documents (PDFs) vs images
    const cloudinaryFolder = isPDF ? 'car-connect/documents' : 'car-connect/posts';
    
    // Upload to Cloudinary (handles both buffer and file path, and both images and PDFs)
    // Use 'auto' resource type for PDFs to allow Cloudinary to handle them properly
    const result = await uploadToCloudinary(
      fileSource,
      cloudinaryFolder,
      isPDF ? { resourceType: 'auto' } : undefined
    );
    logger.info(`File uploaded to Cloudinary: ${result.url}, type: ${req.file.mimetype}`);

    // Delete local file after upload (only if using disk storage)
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      logger.info('Local file deleted after upload');
    }

    res.status(200).json({
      success: true,
      Response: {
        url: result.url,
        publicId: result.publicId,
      },
    });
  } catch (error) {
    logger.error('Error in image upload:', error);
    
    // Clean up local file on error (only if using disk storage)
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        logger.info('Local file cleaned up after error');
      } catch (unlinkError) {
        logger.error('Error deleting local file:', unlinkError);
      }
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/upload/images:
 *   post:
 *     summary: Upload multiple images
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       401:
 *         description: Unauthorized
 */
/**
 * @swagger
 * /api/upload/file:
 *   post:
 *     summary: Upload single file (image or PDF)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/file', authMiddleware, uploadFile, async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    logger.info('File upload request received (file endpoint)');
    
    if (!req.file) {
      logger.warn('No file provided in upload request');
      return res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'No file provided',
        },
      });
    }

    // Determine if using memory storage (buffer) or disk storage (path)
    const fileSource = (req.file as any).buffer || req.file.path;
    const isPDF = req.file.mimetype === 'application/pdf';
    const isImage = req.file.mimetype.startsWith('image/');
    
    logger.info(`Uploading file, size: ${req.file.size} bytes, type: ${req.file.mimetype}, isPDF: ${isPDF}, isImage: ${isImage}`);

    // Use different folder for documents (PDFs) vs images
    const cloudinaryFolder = isPDF ? 'car-connect/documents' : 'car-connect/posts';
    
    // Upload to Cloudinary (handles both buffer and file path, and both images and PDFs)
    // Use 'auto' resource type for PDFs to allow Cloudinary to handle them properly
    const result = await uploadToCloudinary(
      fileSource,
      cloudinaryFolder,
      isPDF ? { resourceType: 'auto' } : undefined
    );
    logger.info(`File uploaded to Cloudinary: ${result.url}, type: ${req.file.mimetype}`);

    // Delete local file after upload (only if using disk storage)
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      logger.info('Local file deleted after upload');
    }

    res.status(200).json({
      success: true,
      Response: {
        url: result.url,
        publicId: result.publicId,
      },
    });
  } catch (error) {
    logger.error('Error in file upload:', error);
    
    // Clean up local file on error (only if using disk storage)
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        logger.info('Local file cleaned up after error');
      } catch (unlinkError) {
        logger.error('Error deleting local file:', unlinkError);
      }
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/upload/images:
 *   post:
 *     summary: Upload multiple images
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/images', authMiddleware, uploadMultiple, async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'No image files provided',
        },
      });
    }

    // Handle both array and object formats from multer
    let files: IMulterFile[] = [];
    if (Array.isArray(req.files)) {
      files = req.files as IMulterFile[];
    } else if (req.files && typeof req.files === 'object') {
      // If it's an object, extract all files from all fields
      const fileValues = Object.values(req.files);
      files = fileValues.flat() as IMulterFile[];
    }

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'No image files provided',
        },
      });
    }

    const uploadPromises = files.map((file) => {
      if (!file) {
        throw new Error('Invalid file object');
      }
      // Use buffer if available (memory storage), otherwise use path (disk storage)
      const fileSource = (file as any).buffer || file.path;
      return uploadToCloudinary(fileSource, 'car-connect/posts');
    });

    const results = await Promise.all(uploadPromises);

    // Delete local files after upload (only if using disk storage)
    files.forEach((file) => {
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    res.status(200).json({
      success: true,
      Response: results.map((result: { url: string; publicId: string }) => ({
        url: result.url,
        publicId: result.publicId,
      })),
    });
  } catch (error) {
    logger.error('Error in multiple image upload:', error);
    
    // Clean up local files on error
    if (req.files) {
      let files: IMulterFile[] = [];
      if (Array.isArray(req.files)) {
        files = req.files as IMulterFile[];
      } else if (typeof req.files === 'object') {
        const fileValues = Object.values(req.files);
        files = fileValues.flat() as IMulterFile[];
      }
      
      files.forEach((file) => {
        if (file && file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkError) {
            logger.error('Error deleting local file:', unlinkError);
          }
        }
      });
    }
    next(error);
  }
});

export default router;

