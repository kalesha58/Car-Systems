export interface IAdminPostListItem {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  text: string;
  images: string[];
  likes: number;
  commentCount: number;
  createdAt: string;
}

export interface IAdminPostComment {
  id: string;
  userId: string;
  userName?: string;
  text: string;
  likes: number;
  createdAt: string;
}

export interface IAdminPostDetail extends IAdminPostListItem {
  video?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  comments: IAdminPostComment[];
  updatedAt?: string;
}

export interface IAdminPostStats {
  totalPosts: number;
  postsToday: number;
  postsThisWeek: number;
  totalLikes: number;
  totalComments: number;
}

export interface IGetAdminPostsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IAdminPostsResponse {
  posts: IAdminPostListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
