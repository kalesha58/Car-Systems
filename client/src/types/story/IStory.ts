export type StoryMediaType = 'image' | 'video';

export interface IStoryItem {
  order: number;
  type: StoryMediaType;
  mediaUrl: string;
  caption?: string;
  sourcePostId?: string;
  createdAt: string;
}

export interface IStory {
  id: string;
  userId: string;
  items: IStoryItem[];
  expiresAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IStoryFeedEntry {
  userId: string;
  userName?: string;
  userAvatar?: string;
  storyId?: string;
  previewMediaUrl?: string;
  itemCount: number;
  expiresAt?: string;
  hasUnseen: boolean;
  isOwn: boolean;
}

export interface IStoryFeedResponse {
  success?: boolean;
  Response: IStoryFeedEntry[];
}

export interface IStoryDetailResponse {
  success?: boolean;
  Response: IStory;
}

export interface IStoryViewerEntry {
  viewerUserId: string;
  userName?: string;
  userAvatar?: string;
  lastViewedAt: string;
}

export interface IStoryViewersResponse {
  success?: boolean;
  Response: {
    viewers: IStoryViewerEntry[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}
