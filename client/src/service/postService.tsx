import {appAxios} from './apiInterceptors';
import {Platform} from 'react-native';
import {IPostsResponse, IPostResponse, ICreatePostRequest} from '../types/post/IPost';

export const getPosts = async (userId?: string): Promise<IPostsResponse> => {
  try {
    const params = userId ? {userId} : {};
    const response = await appAxios.get<IPostsResponse>('/posts', {params});
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
    }

    // Handle URI for different platforms
    const isContentUri = fileUri.startsWith('content://');
    const isFileUri = fileUri.startsWith('file://');
    
    if (Platform.OS === 'ios') {
      // iOS: Remove file:// prefix for FormData
      processedUri = fileUri.replace('file://', '');
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

    // Add file to FormData
    formData.append('image', {
      uri: processedUri,
      type: detectedMimeType,
      name: finalFileName,
    } as any);

    const response = await appAxios.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout
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
      uri: fileUri.substring(0, 100),
    });
    
    if (!error?.response) {
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        throw new Error('Upload timeout. Please check your internet connection and try again.');
      }
      if (error?.code === 'NETWORK_ERROR' || error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      throw new Error('Network error. Please check your internet connection and try again.');
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
    let processedUri = imageUri;

    // Check if it's a content:// URI (Android content provider)
    const isContentUri = imageUri.startsWith('content://');
    const isFileUri = imageUri.startsWith('file://');
    
    // Handle URI for different platforms
    if (Platform.OS === 'ios') {
      // iOS: Remove file:// prefix for FormData
      processedUri = imageUri.replace('file://', '');
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
        // Fallback: assume it's a file path without file:// prefix
        processedUri = imageUri;
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

    const response = await appAxios.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout
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
    });
    
    // Handle network errors (no response from server)
    if (!error?.response) {
      // Check for specific network error codes
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        throw new Error('Upload timeout. Please check your internet connection and try again.');
      }
      
      if (error?.code === 'NETWORK_ERROR' || error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Please check your internet connection and try again.');
      }
      
      // Generic network error
      throw new Error('Network error. Please check your internet connection and try again.');
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
): Promise<IPostResponse> => {
  try {
    const response = await appAxios.post<IPostResponse>(`/posts/${postId}/comment`, {
      text,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

