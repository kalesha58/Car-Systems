import {appAxios} from './apiInterceptors';
import {Platform} from 'react-native';

interface IUserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string[];
  profileImage?: string;
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

