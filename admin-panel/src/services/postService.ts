import apiClient from './apiClient';
import type {
  IAdminPostDetail,
  IAdminPostStats,
  IAdminPostsResponse,
  IGetAdminPostsParams,
} from '../types/post';

export const getAdminPosts = async (params: IGetAdminPostsParams = {}): Promise<IAdminPostsResponse> => {
  const response = await apiClient.get('/admin/posts', { params });
  return {
    posts: response.data.posts || [],
    pagination: response.data.pagination,
  };
};

export const getAdminPostStats = async (): Promise<IAdminPostStats> => {
  const response = await apiClient.get('/admin/posts/stats');
  return response.data.stats;
};

export const getAdminPostById = async (id: string): Promise<IAdminPostDetail> => {
  const response = await apiClient.get(`/admin/posts/${id}`);
  return response.data.post;
};

export const deleteAdminPost = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/posts/${id}`);
};

export const bulkDeleteAdminPosts = async (
  ids: string[],
): Promise<{ deleted: number; failed: number }> => {
  const response = await apiClient.post('/admin/posts/bulk-delete', { ids });
  return {
    deleted: response.data.deleted ?? 0,
    failed: response.data.failed ?? 0,
  };
};
