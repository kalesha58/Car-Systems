import { appAxios } from './apiInterceptors';
import {
  IStoryDetailResponse,
  IStoryFeedResponse,
  IStoryViewersResponse,
} from '../types/story/IStory';

export const getStoryFeed = async (): Promise<IStoryFeedResponse> => {
  const response = await appAxios.get<IStoryFeedResponse>('/stories/feed');
  return response.data;
};

export const getStoryByUserId = async (userId: string): Promise<IStoryDetailResponse> => {
  const response = await appAxios.get<IStoryDetailResponse>(`/stories/user/${userId}`);
  return response.data;
};

export const appendStoryFromPost = async (
  postId: string,
  body?: { caption?: string; tags?: string[] },
): Promise<IStoryDetailResponse> => {
  const payload =
    body && (body.caption !== undefined || (body.tags && body.tags.length > 0)) ? body : {};
  const response = await appAxios.post<IStoryDetailResponse>(
    `/stories/items/from-post/${postId}`,
    payload,
  );
  return response.data;
};

export const recordStoryView = async (
  storyId: string,
  itemIndex: number,
): Promise<void> => {
  await appAxios.post(`/stories/${storyId}/view`, { itemIndex });
};

export const getStoryViewers = async (
  storyId: string,
  page = 1,
  limit = 50,
): Promise<IStoryViewersResponse> => {
  const response = await appAxios.get<IStoryViewersResponse>(
    `/stories/${storyId}/viewers`,
    { params: { page, limit } },
  );
  return response.data;
};

export const deleteStory = async (storyId: string): Promise<void> => {
  await appAxios.delete(`/stories/${storyId}`);
};
