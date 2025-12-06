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
 * Upload image for post
 * @param imageUri - Local URI of the selected image
 * @returns Promise with uploaded image URL
 */
export const uploadImage = async (imageUri: string): Promise<string> => {
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
  const fileName = `post_${Date.now()}.${fileExtension}`;

  // Add image to FormData
  formData.append('image', {
    uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
    type: mimeType,
    name: fileName,
  } as any);

  const response = await appAxios.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (response.data && response.data.success && response.data.Response?.url) {
    return response.data.Response.url;
  }
  throw new Error(
    response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      'Failed to upload image',
  );
};

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

