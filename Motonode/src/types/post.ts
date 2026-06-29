export interface PostLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  parentCommentId?: string;
  likes: number;
  isLiked?: boolean;
  createdAt: string;
  userName?: string;
  userAvatar?: string;
}

export interface Post {
  id: string;
  userId: string;
  text: string;
  images?: string[];
  video?: string;
  location?: PostLocation;
  likes: number;
  isLiked?: boolean;
  comments?: PostComment[];
  createdAt: string;
  updatedAt?: string;
  userName?: string;
  userAvatar?: string;
}

export interface CreatePostRequest {
  text: string;
  images?: string[];
  location?: PostLocation;
}

export interface UpdatePostRequest {
  text?: string;
  images?: string[];
  location?: PostLocation;
  likes?: number;
}

export interface PostResponse {
  success?: boolean;
  Response: Post;
}

export interface PostsResponse {
  success?: boolean;
  Response: Post[];
}
