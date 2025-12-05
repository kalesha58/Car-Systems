export interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface IComment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface IPost {
  id: string;
  userId: string;
  text: string;
  images?: string[];
  video?: string;
  location?: ILocation;
  likes: number;
  comments?: IComment[];
  createdAt: string;
  updatedAt?: string;
  userName?: string;
  userAvatar?: string;
}

export interface ICreatePostRequest {
  text: string;
  images?: string[];
  location?: ILocation;
}

export interface IUpdatePostRequest {
  text?: string;
  images?: string[];
  location?: ILocation;
  likes?: number;
}

export interface IPostResponse {
  Response: IPost;
}

export interface IPostsResponse {
  Response: IPost[];
}

