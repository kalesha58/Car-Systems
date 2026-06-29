import { api } from './api';
import type {
  CreatePostRequest,
  PostResponse,
  PostsResponse,
  UpdatePostRequest,
} from '../types/post';

export async function getPosts(userId?: string): Promise<PostsResponse> {
  const response = await api.get<PostsResponse>('/posts', {
    params: userId ? { userId } : undefined,
  });
  return response.data;
}

export async function getPostById(postId: string): Promise<PostResponse> {
  const response = await api.get<PostResponse>(`/posts/${postId}`);
  return response.data;
}

export async function createPost(postData: CreatePostRequest): Promise<PostResponse> {
  const response = await api.post<PostResponse>('/posts', postData);
  return response.data;
}

export async function updatePost(
  postId: string,
  postData: UpdatePostRequest,
): Promise<PostResponse> {
  const response = await api.put<PostResponse>(`/posts/${postId}`, postData);
  return response.data;
}

export async function deletePost(postId: string): Promise<void> {
  await api.delete(`/posts/${postId}`);
}

export async function likePost(postId: string): Promise<PostResponse> {
  const response = await api.post<PostResponse>(`/posts/${postId}/like`);
  return response.data;
}

export async function unlikePost(postId: string): Promise<PostResponse> {
  const response = await api.post<PostResponse>(`/posts/${postId}/unlike`);
  return response.data;
}

export async function addComment(
  postId: string,
  text: string,
  parentCommentId?: string,
): Promise<PostResponse> {
  const response = await api.post<PostResponse>(`/posts/${postId}/comment`, {
    text,
    parentCommentId,
  });
  return response.data;
}
