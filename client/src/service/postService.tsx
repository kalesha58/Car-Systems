import {appAxios} from './apiInterceptors';
import {IPostsResponse, IPostResponse} from '../types/post/IPost';

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

