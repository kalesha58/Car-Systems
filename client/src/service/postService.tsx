import { appAxios } from './apiInterceptors';
import { Platform } from 'react-native';
import { IPostsResponse, IPostResponse, ICreatePostRequest } from '../types/post/IPost';
import { IUploadImageInput, IUploadImagesResponse } from '../types/upload/IUpload';

export const getPosts = async (userId?: string): Promise<IPostsResponse> => {
  try {
    const params = userId ? { userId } : {};
    const response = await appAxios.get<IPostsResponse>('/posts', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPostById = async (postId: string): Promise<IPostResponse> => {
  try {
    const response = await appAxios.get<IPostResponse>(`/posts/${postId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Upload document (image or PDF) for business registration
 * @param fileUri - Local URI of the selected file
 * @param mimeType - MIME type of the file (e.g., 'image/jpeg', 'application/pdf')
 * @param fileName - Optional file name
 * @returns Promise with uploaded file URL
 */
export const uploadDocument = async (
  fileUri: string,
  mimeType?: string,
  fileName?: string,
): Promise<string> => {
  try {
    const formData = new FormData();

    let detectedMimeType = mimeType || 'image/jpeg';
    let fileExtension = 'jpg';
    let processedUri = fileUri;
    let finalFileName = fileName || `document_${Date.now()}`;

    // Detect file type from URI or mimeType
    if (mimeType) {
      detectedMimeType = mimeType;
      if (mimeType === 'application/pdf') {
        fileExtension = 'pdf';
      } else if (mimeType.startsWith('image/')) {
        // Extract extension from mimeType
        if (mimeType.includes('png')) fileExtension = 'png';
        else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) fileExtension = 'jpg';
        else if (mimeType.includes('gif')) fileExtension = 'gif';
        else if (mimeType.includes('webp')) fileExtension = 'webp';
      }
    } else {
      // Try to detect from URI
      const uriParts = fileUri.split('.');
      if (uriParts.length > 1) {
        const ext = uriParts.pop()?.split('?')[0]?.toLowerCase();
        if (ext === 'pdf') {
          detectedMimeType = 'application/pdf';
          fileExtension = 'pdf';
        } else if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
          fileExtension = ext;
          detectedMimeType = ext === 'png' ? 'image/png' :
            ext === 'gif' ? 'image/gif' :
              ext === 'webp' ? 'image/webp' :
                'image/jpeg';
        }
      }

      // If still default/unknown, try to detect from fileName
      if (fileName && (detectedMimeType === 'image/jpeg' || detectedMimeType === 'application/octet-stream')) {
        const nameParts = fileName.split('.');
        if (nameParts.length > 1) {
          const ext = nameParts.pop()?.toLowerCase();
          if (ext === 'pdf') {
            detectedMimeType = 'application/pdf';
            fileExtension = 'pdf';
          } else if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            fileExtension = ext;
            detectedMimeType = ext === 'png' ? 'image/png' :
              ext === 'gif' ? 'image/gif' :
                ext === 'webp' ? 'image/webp' :
                  'image/jpeg';
          }
        }
      }
    }

    // Handle URI for different platforms
    const isContentUri = fileUri.startsWith('content://');
    const isFileUri = fileUri.startsWith('file://');

    if (Platform.OS === 'ios') {
      // iOS: Keep file:// prefix or use full path
      // React Native FormData on iOS can handle both formats
      if (fileUri.startsWith('file://')) {
        processedUri = fileUri;
      } else if (fileUri.startsWith('/')) {
        // Absolute path - add file:// prefix
        processedUri = `file://${fileUri}`;
      } else {
        // Relative path or other format - use as is
        processedUri = fileUri;
      }
    } else if (Platform.OS === 'android') {
      if (isContentUri) {
        // Android content:// URI - keep as is
        processedUri = fileUri;
      } else if (isFileUri) {
        // Android file:// URI - keep file:// prefix
        processedUri = fileUri;
      }
    }

    // Ensure fileName has extension
    if (!finalFileName.includes('.')) {
      finalFileName = `${finalFileName}.${fileExtension}`;
    }

    // Add file to FormData - use 'file' field name for the /upload/file endpoint
    formData.append('file', {
      uri: processedUri,
      type: detectedMimeType,
      name: finalFileName,
    } as any);

    // Log upload attempt for debugging
    console.log('Attempting to upload document:', {
      platform: Platform.OS,
      uri: fileUri.substring(0, 100),
      processedUri: processedUri.substring(0, 100),
      mimeType: detectedMimeType,
      fileName: finalFileName,
    });

    const response = await appAxios.post('/upload/file', formData, {
      headers: {
        // 'Content-Type': 'multipart/form-data', // Let Axios set the correct boundary
        'Accept': 'application/json',
      },
      timeout: 60000, // Increased to 60 seconds for large files
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (response.data && response.data.success && response.data.Response?.url) {
      return response.data.Response.url;
    }

    const errorMessage = response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      response.data?.error ||
      'Failed to upload document';
    throw new Error(errorMessage);
  } catch (error: any) {
    console.error('Upload document error:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      code: error?.code,
      errno: error?.errno,
      uri: fileUri.substring(0, 100),
      platform: Platform.OS,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });

    // Handle network errors (no response from server)
    if (!error?.response) {
      // Check for specific network error codes
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        throw new Error('Upload timeout. Please check your internet connection and try again.');
      }

      // Check for Android-specific errors
      if (Platform.OS === 'android') {
        // Android might have file access issues
        if (error?.message?.includes('ENOENT') || error?.message?.includes('No such file')) {
          throw new Error('File not found. Please select the file again.');
        }
        if (error?.message?.includes('EACCES') || error?.message?.includes('permission')) {
          throw new Error('File access denied. Please check app permissions.');
        }
        // Android emulator network issues
        if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
          throw new Error('Cannot connect to server. If using Android emulator, ensure your backend server is accessible. Check your BASE_URL in config.tsx');
        }
      }

      if (error?.code === 'NETWORK_ERROR' || error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
        // Provide more helpful error message for Android emulator
        const errorMsg = Platform.OS === 'android'
          ? 'Network error. If using Android emulator, ensure your backend server is accessible. Check your BASE_URL in config.tsx. For emulator, use 10.0.2.2 instead of localhost.'
          : 'Network error. Please check your internet connection and try again.';
        throw new Error(errorMsg);
      }

      // Generic network error with more context
      const genericError = Platform.OS === 'android'
        ? `Network error (${error?.code || 'unknown'}). Please check your internet connection and ensure the backend server is running and accessible. For Android emulator, use 10.0.2.2 instead of localhost.`
        : 'Network error. Please check your internet connection and try again.';
      throw new Error(genericError);
    }

    if (error?.response?.status === 400) {
      const errorMessage = error?.response?.data?.Response?.ReturnMessage ||
        error?.response?.data?.message ||
        'Invalid file. Please select a valid image or PDF and try again.';
      throw new Error(errorMessage);
    }

    if (error?.response?.status === 401) {
      throw new Error('Unauthorized. Please log in and try again.');
    }

    if (error?.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }

    const errorMessage = error?.response?.data?.Response?.ReturnMessage ||
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Failed to upload document. Please try again.';

    throw new Error(errorMessage);
  }
};

/**
 * Upload image for post
 * @param imageUri - Local URI of the selected image or base64 data URI
 * @returns Promise with uploaded image URL
 */
export const uploadImage = async (imageUri: string): Promise<string> => {
  let processedUri = imageUri;

  try {
    // Check if it's a base64 data URI
    const isBase64 = imageUri.startsWith('data:image/');

    if (isBase64) {
      // React Native FormData doesn't support base64 data URIs on Android
      // We need to throw a helpful error message
      throw new Error(
        'Base64 image format is not supported. Please ensure the image picker is configured correctly. ' +
        'Try selecting the image again or check your image picker settings.'
      );
    }

    const formData = new FormData();

    let mimeType = 'image/jpeg';
    let fileExtension = 'jpg';
    let fileName = `post_${Date.now()}.${fileExtension}`;

    // Check if it's a content:// URI (Android content provider)
    const isContentUri = imageUri.startsWith('content://');
    const isFileUri = imageUri.startsWith('file://');

    // Handle URI for different platforms
    if (Platform.OS === 'ios') {
      // iOS: Keep file:// prefix or use full path
      // React Native FormData on iOS can handle both formats
      if (imageUri.startsWith('file://')) {
        processedUri = imageUri;
      } else if (imageUri.startsWith('/')) {
        // Absolute path - add file:// prefix
        processedUri = `file://${imageUri}`;
      } else {
        // Relative path or other format - use as is
        processedUri = imageUri;
      }
      // Extract file extension from URI
      const uriParts = imageUri.split('.');
      if (uriParts.length > 1) {
        fileExtension = uriParts.pop()?.split('?')[0] || 'jpg';
      }
    } else if (Platform.OS === 'android') {
      if (isContentUri) {
        // Android content:// URI - keep as is, FormData can handle it
        processedUri = imageUri;
        // For content:// URIs, we can't easily extract extension, default to jpeg
        fileExtension = 'jpg';
      } else if (isFileUri) {
        // Android file:// URI - keep file:// prefix for FormData (React Native needs it)
        processedUri = imageUri;
        // Try to extract file extension from URI
        const uriParts = imageUri.split('.');
        if (uriParts.length > 1) {
          const ext = uriParts.pop()?.split('?')[0];
          // Only use extension if it looks like a valid image extension
          if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext.toLowerCase())) {
            fileExtension = ext.toLowerCase();
          }
        }
        // If no valid extension found, default to jpeg (common for Android cache files)
      } else {
        // Fallback: assume it's a file path
        // React Native Android FormData REQUIRE 'file://' prefix for absolute paths
        if (imageUri.startsWith('/')) {
          processedUri = `file://${imageUri}`;
        } else {
          processedUri = imageUri;
        }
        fileExtension = 'jpg';
      }
    }

    // Determine MIME type from extension
    mimeType =
      fileExtension === 'png'
        ? 'image/png'
        : fileExtension === 'jpeg' || fileExtension === 'jpg'
          ? 'image/jpeg'
          : fileExtension === 'gif'
            ? 'image/gif'
            : fileExtension === 'webp'
              ? 'image/webp'
              : 'image/jpeg'; // Default to jpeg

    // Format file name with extension
    fileName = `post_${Date.now()}.${fileExtension}`;

    // Add image to FormData
    formData.append('image', {
      uri: processedUri,
      type: mimeType,
      name: fileName,
    } as any);

    // Log upload attempt for debugging
    console.log('Attempting to upload image:', {
      platform: Platform.OS,
      uri: imageUri.substring(0, 100),
      processedUri: processedUri.substring(0, 100),
      mimeType,
      fileName,
    });

    const response = await appAxios.post('/upload/image', formData, {
      headers: {
        // 'Content-Type': 'multipart/form-data', // Let Axios set the correct boundary
        'Accept': 'application/json',
      },
      timeout: 60000, // Increased to 60 seconds for large files
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (response.data && response.data.success && response.data.Response?.url) {
      return response.data.Response.url;
    }

    // If response doesn't have the expected structure, throw error with details
    const errorMessage = response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      response.data?.error ||
      'Failed to upload image';
    throw new Error(errorMessage);
  } catch (error: any) {
    console.error('Upload image error:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      code: error?.code,
      errno: error?.errno,
      uri: imageUri.substring(0, 100), // Log only first 100 chars to avoid huge logs
      platform: Platform.OS,
      processedUri: processedUri?.substring(0, 100),
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });

    // Handle network errors (no response from server)
    if (!error?.response) {
      // Check for specific network error codes
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        throw new Error('Upload timeout. Please check your internet connection and try again.');
      }

      // Check for iOS-specific errors
      if (Platform.OS === 'ios') {
        // iOS might have file access issues
        if (error?.message?.includes('ENOENT') || error?.message?.includes('No such file')) {
          throw new Error('File not found. Please select the file again.');
        }
        if (error?.message?.includes('EACCES') || error?.message?.includes('permission')) {
          throw new Error('File access denied. Please check app permissions.');
        }
      }

      if (error?.code === 'NETWORK_ERROR' || error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
        // Provide more helpful error message for iOS simulator
        const errorMsg = Platform.OS === 'ios'
          ? 'Network error. If using iOS simulator, ensure your backend server is accessible. Check your BASE_URL in config.tsx'
          : 'Network error. Please check your internet connection and try again.';
        throw new Error(errorMsg);
      }

      if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Please check your internet connection and server URL.');
      }

      // Generic network error with more context
      const genericError = Platform.OS === 'ios'
        ? `Network error (${error?.code || 'unknown'}). Please check your internet connection and ensure the backend server is running and accessible.`
        : 'Network error. Please check your internet connection and try again.';
      throw new Error(genericError);
    }

    // Handle server response errors
    if (error?.response?.status === 400) {
      const errorMessage = error?.response?.data?.Response?.ReturnMessage ||
        error?.response?.data?.message ||
        'Invalid image file. Please select a valid image and try again.';
      throw new Error(errorMessage);
    }

    if (error?.response?.status === 401) {
      throw new Error('Unauthorized. Please log in and try again.');
    }

    if (error?.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }

    // Extract more specific error message from server response
    const errorMessage = error?.response?.data?.Response?.ReturnMessage ||
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Failed to upload image. Please try again.';

    throw new Error(errorMessage);
  }
};

const UPLOAD_BATCH_TIMEOUT_MS = 30000;

/**
 * Upload multiple images in a single request (batch). Use for vehicle images to avoid
 * sequential timeouts on Render. Already-remote URLs are returned as-is.
 * @param images - Array of image descriptors (uri and optional fileName, type)
 * @returns Promise with array of URLs in the same order as input
 */
export const uploadImagesBatch = async (images: IUploadImageInput[]): Promise<string[]> => {
  if (images.length === 0) {
    return [];
  }

  const remoteUrls: string[] = [];
  const localImages: IUploadImageInput[] = [];
  for (const img of images) {
    if (img.uri.startsWith('http://') || img.uri.startsWith('https://')) {
      remoteUrls.push(img.uri);
    } else {
      localImages.push(img);
    }
  }

  if (localImages.length === 0) {
    return remoteUrls;
  }

  const formData = new FormData();
  localImages.forEach((img, index) => {
    const name = img.fileName ?? `vehicle_${Date.now()}_${index}.jpg`;
    const type = img.type ?? 'image/jpeg';
    formData.append('images', {
      uri: img.uri,
      name,
      type,
    } as unknown as Blob);
  });

  let uploadedUrls: string[];
  try {
    const response = await appAxios.post<IUploadImagesResponse>('/upload/images', formData, {
      timeout: UPLOAD_BATCH_TIMEOUT_MS,
      headers: {
        Accept: 'application/json',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (!response.data?.success || !Array.isArray(response.data.Response)) {
      const msg = response.data?.Response && typeof response.data.Response === 'object' && 'ReturnMessage' in response.data.Response
        ? (response.data.Response as { ReturnMessage?: string }).ReturnMessage
        : 'Failed to upload images';
      throw new Error(msg ?? 'Failed to upload images');
    }

    uploadedUrls = (response.data.Response as IUploadImagesResponse['Response']).map((r) => r.url);
  } catch (batchError: unknown) {
    const status = batchError && typeof batchError === 'object' && 'response' in batchError
      ? (batchError as { response?: { status?: number } }).response?.status
      : undefined;
    if (status === 404) {
      uploadedUrls = [];
      for (const img of localImages) {
        const url = await uploadImage(img.uri);
        uploadedUrls.push(url);
      }
    } else {
      throw batchError;
    }
  }

  if (remoteUrls.length === 0) {
    return uploadedUrls;
  }

  const result: string[] = [];
  let remoteIdx = 0;
  let uploadedIdx = 0;
  for (const img of images) {
    if (img.uri.startsWith('http://') || img.uri.startsWith('https://')) {
      result.push(remoteUrls[remoteIdx++]);
    } else {
      result.push(uploadedUrls[uploadedIdx++]);
    }
  }
  return result;
};

export interface IUploadFileResult {
  url: string;
  publicId?: string;
}

/**
 * Create a new post
 * @param postData - Post data including text, images, and optional location
 * @returns Promise with created post response
 */
export const createPost = async (
  postData: ICreatePostRequest,
): Promise<IPostResponse> => {
  try {
    const response = await appAxios.post<IPostResponse>('/posts', postData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Like a post
 */
export const likePost = async (postId: string): Promise<IPostResponse> => {
  try {
    const response = await appAxios.post<IPostResponse>(`/posts/${postId}/like`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Unlike a post
 */
export const unlikePost = async (postId: string): Promise<IPostResponse> => {
  try {
    const response = await appAxios.post<IPostResponse>(`/posts/${postId}/unlike`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Add a comment to a post
 */
export const addComment = async (
  postId: string,
  text: string,
  parentCommentId?: string,
): Promise<IPostResponse> => {
  try {
    const response = await appAxios.post<IPostResponse>(`/posts/${postId}/comment`, {
      text,
      parentCommentId,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Like a comment
 */
export const likeComment = async (
  postId: string,
  commentId: string,
): Promise<IPostResponse> => {
  try {
    const response = await appAxios.post<IPostResponse>(`/posts/${postId}/comments/${commentId}/like`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Unlike a comment
 */
export const unlikeComment = async (
  postId: string,
  commentId: string,
): Promise<IPostResponse> => {
  try {
    const response = await appAxios.post<IPostResponse>(`/posts/${postId}/comments/${commentId}/unlike`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
