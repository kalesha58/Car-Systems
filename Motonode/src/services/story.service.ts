import type {
  StoryDetailResponse,
  StoryFeedResponse,
} from '../types/story';

import { api } from './api';

export async function getStoryFeed(): Promise<StoryFeedResponse> {
  const response = await api.get<StoryFeedResponse>('/stories/feed');
  return response.data;
}

export async function getStoryByUserId(userId: string): Promise<StoryDetailResponse> {
  const response = await api.get<StoryDetailResponse>(`/stories/user/${userId}`);
  return response.data;
}

export async function appendStoryFromPost(
  postId: string,
  body?: { caption?: string; tags?: string[] },
): Promise<StoryDetailResponse> {
  const payload =
    body && (body.caption !== undefined || (body.tags && body.tags.length > 0)) ? body : {};
  const response = await api.post<StoryDetailResponse>(
    `/stories/items/from-post/${postId}`,
    payload,
  );
  return response.data;
}

export async function recordStoryView(storyId: string, itemIndex: number): Promise<void> {
  await api.post(`/stories/${storyId}/view`, { itemIndex });
}

export async function deleteStory(storyId: string): Promise<void> {
  await api.delete(`/stories/${storyId}`);
}
