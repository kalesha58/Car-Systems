export type StoryMediaType = 'image' | 'video';

export interface StoryItem {
  order: number;
  type: StoryMediaType;
  mediaUrl: string;
  caption?: string;
  tags?: string[];
  sourcePostId?: string;
  createdAt: string;
}

export interface Story {
  id: string;
  userId: string;
  items: StoryItem[];
  expiresAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StoryFeedEntry {
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

export interface StoryFeedResponse {
  success?: boolean;
  Response: StoryFeedEntry[];
}

export interface StoryDetailResponse {
  success?: boolean;
  Response: Story;
}
