import { Response, NextFunction } from 'express';
import { IAuthRequest, IMulterFile } from '../../middleware/authMiddleware';
import {
  getUserProfile,
  updateUserProfile,
  getUserStats,
  updatePrivacySettings,
  getPrivacySettings,
  deleteUserAccount,
} from '../../services/user/profileService';
import { uploadToCloudinary } from '../../config/cloudinary';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import fs from 'fs';

/**
 * Get current user profile
 */
export const getProfileController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const profile = await getUserProfile(req.user.userId);

    res.status(200).json({
      success: true,
      Response: profile,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Update user profile (with optional image upload)
 */
export const updateProfileController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const updateData: { name?: string; phone?: string; profileImage?: string } = {};

    // Handle text fields from form data
    if (req.body.name) {
      updateData.name = req.body.name;
    }

    if (req.body.phone) {
      updateData.phone = req.body.phone;
    }

    if (req.body.profileImage) {
      updateData.profileImage = req.body.profileImage;
    }

    // Handle image upload if provided
    if (req.file) {
      try {
        logger.info('Uploading profile image to Cloudinary...');

        // Determine if using memory storage (buffer) or disk storage (path)
        const fileSource = (req.file as any).buffer || req.file.path;

        // Upload to Cloudinary in profile folder
        const result = await uploadToCloudinary(fileSource, 'car-connect/profiles');

        logger.info(`Profile image uploaded to Cloudinary: ${result.url}`);

        updateData.profileImage = result.url;

        // Delete local file after upload (only if using disk storage)
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          logger.info('Local profile image file deleted after upload');
        }
      } catch (uploadError) {
        logger.error('Error uploading profile image:', uploadError);

        // Clean up local file on error (only if using disk storage)
        if (req.file.path && fs.existsSync(req.file.path)) {
          try {
            fs.unlinkSync(req.file.path);
            logger.info('Local file cleaned up after upload error');
          } catch (unlinkError) {
            logger.error('Error deleting local file:', unlinkError);
          }
        }

        res.status(500).json({
          success: false,
          Response: {
            ReturnMessage: 'Failed to upload profile image',
          },
        });
        return;
      }
    }

    // Update profile
    const updatedProfile = await updateUserProfile(req.user.userId, updateData);

    res.status(200).json({
      success: true,
      Response: updatedProfile,
    });
  } catch (error) {
    // Clean up local file on error (only if using disk storage)
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        logger.info('Local file cleaned up after error');
      } catch (unlinkError) {
        logger.error('Error deleting local file:', unlinkError);
      }
    }

    errorHandler(error as IAppError, res);
  }
};

/**
 * Get user statistics
 */
export const getUserStatsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }    const stats = await getUserStats(req.user.userId);    res.status(200).json({
      success: true,
      Response: stats,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get user privacy settings
 */
export const getPrivacySettingsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const settings = await getPrivacySettings(req.user.userId);

    res.status(200).json({
      success: true,
      Response: settings,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Update user privacy settings
 */
export const updatePrivacySettingsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const settings = await updatePrivacySettings(req.user.userId, req.body);

    res.status(200).json({
      success: true,
      Response: settings,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Delete current user account
 */
export const deleteAccountController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    await deleteUserAccount(req.user.userId);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Account deleted successfully',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};