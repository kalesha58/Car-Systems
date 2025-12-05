import { SignUp, ISignUpDocument } from '../../models/SignUp';
import { NotFoundError, ConflictError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { deleteFromCloudinary } from '../../config/cloudinary';
import { IUser } from '../../types/auth';

/**
 * Convert user document to IUser interface
 */
const userToIUser = (userDoc: ISignUpDocument): IUser => {
  return {
    id: (userDoc._id as any).toString(),
    name: userDoc.name,
    email: userDoc.email,
    phone: userDoc.phone,
    role: userDoc.role,
    profileImage: userDoc.profileImage,
  };
};

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string): Promise<IUser> => {
  try {
    const user = await SignUp.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return userToIUser(user);
  } catch (error) {
    logger.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export interface IUpdateProfileRequest {
  name?: string;
  phone?: string;
  profileImage?: string;
}

export const updateUserProfile = async (
  userId: string,
  data: IUpdateProfileRequest,
): Promise<IUser> => {
  try {
    const user = await SignUp.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update name if provided
    if (data.name !== undefined && data.name.trim() !== '') {
      user.name = data.name.trim();
    }

    // Update phone if provided
    if (data.phone !== undefined) {
      // Validate phone format
      const cleanPhone = data.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length !== 10) {
        throw new ConflictError('Phone number must be exactly 10 digits');
      }

      // Check if phone is already taken by another user
      const existingUser = await SignUp.findOne({
        phone: cleanPhone,
        _id: { $ne: userId },
      });

      if (existingUser) {
        throw new ConflictError('Phone number already in use');
      }

      user.phone = cleanPhone;
    }

    // Update profile image if provided
    if (data.profileImage !== undefined) {
      // If there's an existing profile image, delete it from Cloudinary
      if (user.profileImage) {
        try {
          // Extract public ID from Cloudinary URL
          // Cloudinary URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.jpg
          const urlParts = user.profileImage.split('/');
          const publicIdWithExtension = urlParts.slice(-2).join('/'); // Get folder/public_id.ext
          const publicId = publicIdWithExtension.split('.')[0]; // Remove extension

          await deleteFromCloudinary(publicId);
          logger.info(`Deleted old profile image from Cloudinary: ${publicId}`);
        } catch (deleteError) {
          // Log error but don't fail the update if deletion fails
          logger.error('Error deleting old profile image:', deleteError);
        }
      }

      user.profileImage = data.profileImage;
    }

    await user.save();

    logger.info(`User profile updated: ${user.email}`);

    return userToIUser(user);
  } catch (error) {
    logger.error('Error updating user profile:', error);
    throw error;
  }
};

