import {appAxios} from './apiInterceptors';
import {Platform} from 'react-native';

export interface IPrivacySettings {
  isPrivate: boolean;
  hidePhone: boolean;
  hideEmail: boolean;
  hideVehicleNumber: boolean;
}

interface IUserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string[];
  profileImage?: string;
  privacySettings?: IPrivacySettings;
}

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<IUserProfile> => {
  const response = await appAxios.get('/profile');
  if (response.data && response.data.success && response.data.Response) {
    return response.data.Response;
  }
  throw new Error(
    response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      'Failed to fetch profile',
  );
};

/**
 * Update profile image
 * @param imageUri - Local URI of the selected image
 */
export const updateProfileImage = async (
  imageUri: string,
): Promise<IUserProfile> => {
  const formData = new FormData();

  // Extract file extension from URI
  const fileExtension = imageUri.split('.').pop() || 'jpg';
  const mimeType =
    fileExtension === 'png'
      ? 'image/png'
      : fileExtension === 'jpeg' || fileExtension === 'jpg'
        ? 'image/jpeg'
        : 'image/jpeg';

  // Format file name
  const fileName = `profile_${Date.now()}.${fileExtension}`;

  // Add image to FormData
  formData.append('image', {
    uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
    type: mimeType,
    name: fileName,
  } as any);

  const response = await appAxios.put('/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (response.data && response.data.success && response.data.Response) {
    return response.data.Response;
  }
  throw new Error(
    response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      'Failed to update profile image',
  );
};

/**
 * Update profile information (name, etc.)
 * @param data - Profile data to update
 */
export const updateProfile = async (data: {name?: string}): Promise<IUserProfile> => {
  const response = await appAxios.put('/profile', data);

  if (response.data && response.data.success && response.data.Response) {
    return response.data.Response;
  }
  throw new Error(
    response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      'Failed to update profile',
  );
};

/**
 * Get user statistics (posts count, vehicles count, orders count)
 */
export interface IUserStats {
  postsCount: number;
  vehiclesCount: number;
  ordersCount: number;
}export const getUserStats = async (): Promise<IUserStats> => {
  const response = await appAxios.get('/profile/stats');
  if (response.data && response.data.success && response.data.Response) {
    return response.data.Response;
  }
  throw new Error(
    response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      'Failed to fetch user stats',
  );
};

/**
 * Get user privacy settings
 */
export const getPrivacySettings = async (): Promise<IPrivacySettings> => {
  const response = await appAxios.get('/profile/privacy-settings');
  if (response.data && response.data.success && response.data.Response) {
    return response.data.Response;
  }
  throw new Error(
    response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      'Failed to fetch privacy settings',
  );
};

/**
 * Update user privacy settings
 */
export const updatePrivacySettings = async (
  settings: Partial<IPrivacySettings>,
): Promise<IPrivacySettings> => {
  const response = await appAxios.put('/profile/privacy-settings', settings);
  if (response.data && response.data.success && response.data.Response) {
    return response.data.Response;
  }
  throw new Error(
    response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      'Failed to update privacy settings',
  );
};