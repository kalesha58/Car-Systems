import { Post, IPostDocument } from '../../models/user/Post';
import { SignUp } from '../../models/SignUp';
import {
  ICreatePostRequest,
  IUpdatePostRequest,
  IPost,
  IPostResponse,
  IPostsResponse,
} from '../../types/post';
import { AppError, NotFoundError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

/**
 * Convert post document to IPost interface with user info
 */
const postToIPostWithUser = async (postDoc: IPostDocument, userMap?: Map<string, { name: string; profileImage?: string }>): Promise<IPost> => {
  let userName: string | undefined;
  let userAvatar: string | undefined;

  if (userMap) {
    const user = userMap.get(postDoc.userId);
    userName = user?.name;
    userAvatar = user?.profileImage;
  } else {
    // Fallback: fetch user individually if map not provided
    const user = await SignUp.findById(postDoc.userId);
    userName = user?.name;
    userAvatar = user?.profileImage;
  }

  return {
    id: postDoc.id,
    userId: postDoc.userId,
    text: postDoc.text,
    images: postDoc.images || [],
    video: postDoc.video,
    location: postDoc.location
      ? {
          latitude: postDoc.location.latitude,
          longitude: postDoc.location.longitude,
          address: postDoc.location.address,
        }
      : undefined,
    likes: postDoc.likes || 0,
    comments: postDoc.comments?.map((comment) => ({
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
    })),
    createdAt: postDoc.createdAt.toISOString(),
    updatedAt: postDoc.updatedAt?.toISOString(),
    userName,
    userAvatar,
  };
};

/**
 * Create a new post
 */
export const createPost = async (
  userId: string,
  data: ICreatePostRequest,
): Promise<IPostResponse> => {
  const { text, images, location } = data;

  if (!text || !text.trim()) {
    throw new AppError('Post text is required', 400);
  }

  const post = new Post({
    userId,
    text: text.trim(),
    images: images || [],
    location: location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
        }
      : undefined,
    likes: 0,
    comments: [],
  });

  await post.save();

  logger.info(`New post created: ${post.id} by user: ${userId}`);

  return {
    Response: await postToIPostWithUser(post),
  };
};

/**
 * Get all posts
 */
export const getPosts = async (userId?: string): Promise<IPostsResponse> => {
  const query = userId ? { userId } : {};
  const posts = await Post.find(query).sort({ createdAt: -1 });

  // Get all unique userIds from posts
  const userIds = [...new Set(posts.map((p) => p.userId))];

  // Fetch all users in one query for batch processing
  const users = await SignUp.find({ _id: { $in: userIds } }).select('_id name profileImage');

  // Create a map of userId to user info for quick lookup
  const userMap = new Map<string, { name: string; profileImage?: string }>();
  users.forEach((user) => {
    userMap.set((user._id as any).toString(), {
      name: user.name,
      profileImage: user.profileImage,
    });
  });

  // Convert posts with user info
  const postsWithUser = await Promise.all(
    posts.map((post) => postToIPostWithUser(post, userMap))
  );

  return {
    Response: postsWithUser,
  };
};

/**
 * Get post by ID
 */
export const getPostById = async (postId: string): Promise<IPostResponse> => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  return {
    Response: await postToIPostWithUser(post),
  };
};

/**
 * Update post
 */
export const updatePost = async (
  postId: string,
  userId: string,
  data: IUpdatePostRequest,
): Promise<IPostResponse> => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  if (post.userId !== userId) {
    throw new AppError('Unauthorized to update this post', 403);
  }

  if (data.text !== undefined) post.text = data.text.trim();
  if (data.images !== undefined) post.images = data.images;
  if (data.location !== undefined) {
    post.location = data.location
      ? {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          address: data.location.address,
        }
      : undefined;
  }
  if (data.likes !== undefined) post.likes = data.likes;

  await post.save();

  logger.info(`Post updated: ${post.id}`);

  return {
    Response: await postToIPostWithUser(post),
  };
};

/**
 * Delete post
 */
export const deletePost = async (postId: string, userId: string): Promise<void> => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  if (post.userId !== userId) {
    throw new AppError('Unauthorized to delete this post', 403);
  }

  await Post.findByIdAndDelete(postId);

  logger.info(`Post deleted: ${post.id}`);
};
