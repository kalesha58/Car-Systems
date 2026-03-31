import { SignUp, ISignUpDocument } from '../../models/SignUp';
import { NotFoundError, ConflictError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { deleteFromCloudinary } from '../../config/cloudinary';
import { IUser } from '../../types/auth';
import { Post } from '../../models/user/Post';
import { Vehicle } from '../../models/user/Vehicle';
import { Order } from '../../models/Order';

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
    privacySettings: userDoc.privacySettings || {
      isPrivate: false,
      hidePhone: false,
      hideEmail: false,
      hideVehicleNumber: false,
    },
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

/**
 * Get user statistics (posts count, vehicles count, orders count)
 */
export interface IUserStats {
  postsCount: number;
  vehiclesCount: number;
  ordersCount: number;
}export const getUserStats = async (userId: string): Promise<IUserStats> => {
  try {
    const user = await SignUp.findById(userId);    if (!user) {
      throw new NotFoundError('User not found');
    }    // Get counts in parallel for better performance
    const [postsCount, vehiclesCount, ordersCount] = await Promise.all([
      Post.countDocuments({ userId: userId.toString() }),
      Vehicle.countDocuments({ ownerId: userId.toString() }),
      Order.countDocuments({ userId: userId.toString() }),
    ]);    return {
      postsCount,
      vehiclesCount,
      ordersCount,
    };
  } catch (error) {
    logger.error('Error getting user stats:', error);
    throw error;
  }
};

/**
 * Update user privacy settings
 */
export interface IUpdatePrivacySettingsRequest {
  isPrivate?: boolean;
  hidePhone?: boolean;
  hideEmail?: boolean;
  hideVehicleNumber?: boolean;
}

export const updatePrivacySettings = async (
  userId: string,
  data: IUpdatePrivacySettingsRequest,
): Promise<ISignUpDocument['privacySettings']> => {
  try {
    const user = await SignUp.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Initialize privacySettings if it doesn't exist
    if (!user.privacySettings) {
      user.privacySettings = {
        isPrivate: false,
        hidePhone: false,
        hideEmail: false,
        hideVehicleNumber: false,
      };
    }

    // Update privacy settings
    if (data.isPrivate !== undefined) {
      user.privacySettings.isPrivate = data.isPrivate;
      // Auto-hide vehicle number when profile is private
      if (data.isPrivate) {
        user.privacySettings.hideVehicleNumber = true;
      }
    }

    if (data.hidePhone !== undefined) {
      user.privacySettings.hidePhone = data.hidePhone;
    }

    if (data.hideEmail !== undefined) {
      user.privacySettings.hideEmail = data.hideEmail;
    }

    if (data.hideVehicleNumber !== undefined) {
      user.privacySettings.hideVehicleNumber = data.hideVehicleNumber;
    }

    await user.save();

    logger.info(`Privacy settings updated for user: ${user.email}`);

    return user.privacySettings;
  } catch (error) {
    logger.error('Error updating privacy settings:', error);
    throw error;
  }
};

/**
 * Get user privacy settings
 */
export const getPrivacySettings = async (
  userId: string,
): Promise<ISignUpDocument['privacySettings']> => {
  try {
    const user = await SignUp.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Return default settings if not set
    return user.privacySettings || {
      isPrivate: false,
      hidePhone: false,
      hideEmail: false,
      hideVehicleNumber: false,
    };
  } catch (error) {
    logger.error('Error getting privacy settings:', error);
    throw error;
  }
};

/**
 * Deactivate and anonymize user account data.
 * This preserves historical relational data while removing PII and login access.
 */
export const deleteUserAccount = async (userId: string): Promise<void> => {
  try {
    const user = await SignUp.findById(userId).select('+password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const timestamp = Date.now();
    const anonymizedEmail = `deleted_${user.id}_${timestamp}@deleted.motonode.local`;
    const anonymizedPhone = `9${String(timestamp).slice(-9)}`;

    if (user.profileImage) {
      try {
        const urlParts = user.profileImage.split('/');
        const publicIdWithExtension = urlParts.slice(-2).join('/');
        const publicId = publicIdWithExtension.split('.')[0];
        await deleteFromCloudinary(publicId);
      } catch (deleteError) {
        logger.warn('Unable to delete profile image during account deletion:', deleteError);
      }
    }

    user.name = 'Deleted User';
    user.email = anonymizedEmail;
    user.phone = anonymizedPhone;
    user.password = `deleted_${timestamp}_${Math.random().toString(36).slice(2)}`;
    user.status = 'inactive';
    user.profileImage = undefined;
    user.googleId = undefined;
    user.fcmToken = undefined;
    user.resetPasswordCode = undefined;
    user.resetPasswordCodeExpires = undefined;
    user.privacySettings = {
      isPrivate: true,
      hidePhone: true,
      hideEmail: true,
      hideVehicleNumber: true,
    };

    await user.save();

    logger.info(`Account deleted for userId: ${userId}`);
  } catch (error) {
    logger.error('Error deleting user account:', error);
    throw error;
  }
};