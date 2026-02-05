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
import { emitToPostRoom } from '../socket/socketService';

/**
 * Convert post document to IPost interface with user info
 */
const postToIPostWithUser = async (
  postDoc: IPostDocument,
  userMap?: Map<string, { name: string; profileImage?: string }>,
  currentUserId?: string,
  commentUserMap?: Map<string, { name: string; profileImage?: string }>,
): Promise<IPost> => {
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

  // Check if current user has liked this post
  const isLiked = currentUserId ? (postDoc.likedBy || []).includes(currentUserId) : false;

  // Process comments with user info
  const comments = await Promise.all(
    (postDoc.comments || []).map(async (comment) => {
      let commentUserName: string | undefined;
      let commentUserAvatar: string | undefined;

      if (commentUserMap) {
        const commentUser = commentUserMap.get(comment.userId);
        commentUserName = commentUser?.name;
        commentUserAvatar = commentUser?.profileImage;
      } else {
        // Fallback: fetch user individually if map not provided
        const commentUser = await SignUp.findById(comment.userId);
        commentUserName = commentUser?.name;
        commentUserAvatar = commentUser?.profileImage;
      }

      // Check if current user has liked this comment
      const isCommentLiked = currentUserId ? (comment.likedBy || []).includes(currentUserId) : false;

      return {
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        text: comment.text,
        parentCommentId: comment.parentCommentId,
        likes: comment.likes || 0,
        isLiked: isCommentLiked,
        createdAt: comment.createdAt.toISOString(),
        userName: commentUserName,
        userAvatar: commentUserAvatar,
      };
    })
  );

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
    isLiked,
    comments,
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

  // Validate images are required
  if (!images || !Array.isArray(images) || images.length === 0) {
    throw new AppError('At least one image is required to create a post', 400);
  }

  const post = new Post({
    userId,
    text: text.trim(),
    images: images,
    location: location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
        }
      : undefined,
    likes: 0,
    likedBy: [],
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
export const getPosts = async (userId?: string, currentUserId?: string): Promise<IPostsResponse> => {
  const query = userId ? { userId } : {};
  const posts = await Post.find(query).sort({ createdAt: -1 });

  // Get all unique userIds from posts
  const userIds = [...new Set(posts.map((p) => p.userId))];

  // Get all unique userIds from comments
  const commentUserIds = new Set<string>();
  posts.forEach((post) => {
    (post.comments || []).forEach((comment) => {
      commentUserIds.add(comment.userId);
    });
  });

  // Fetch all users (post authors and comment authors) in one query for batch processing
  const allUserIds = [...new Set([...userIds, ...Array.from(commentUserIds)])];
  const users = await SignUp.find({ _id: { $in: allUserIds } }).select('_id name profileImage');

  // Create a map of userId to user info for quick lookup (post authors)
  const userMap = new Map<string, { name: string; profileImage?: string }>();
  // Create a map for comment authors
  const commentUserMap = new Map<string, { name: string; profileImage?: string }>();
  
  users.forEach((user) => {
    const userIdStr = (user._id as any).toString();
    const userInfo = {
      name: user.name,
      profileImage: user.profileImage,
    };
    
    // Add to both maps (users can be both post authors and comment authors)
    if (userIds.includes(userIdStr)) {
      userMap.set(userIdStr, userInfo);
    }
    if (commentUserIds.has(userIdStr)) {
      commentUserMap.set(userIdStr, userInfo);
    }
  });

  // Convert posts with user info
  const postsWithUser = await Promise.all(
    posts.map((post) => postToIPostWithUser(post, userMap, currentUserId, commentUserMap))
  );

  return {
    Response: postsWithUser,
  };
};

/**
 * Get post by ID
 */
export const getPostById = async (postId: string, currentUserId?: string): Promise<IPostResponse> => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Get all unique userIds from comments
  const commentUserIds = new Set<string>();
  (post.comments || []).forEach((comment) => {
    commentUserIds.add(comment.userId);
  });

  // Fetch comment authors in batch
  const commentUsers = await SignUp.find({ _id: { $in: Array.from(commentUserIds) } }).select('_id name profileImage');
  const commentUserMap = new Map<string, { name: string; profileImage?: string }>();
  commentUsers.forEach((user) => {
    commentUserMap.set((user._id as any).toString(), {
      name: user.name,
      profileImage: user.profileImage,
    });
  });

  return {
    Response: await postToIPostWithUser(post, undefined, currentUserId, commentUserMap),
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

/**
 * Like a post
 */
export const likePost = async (postId: string, userId: string): Promise<IPostResponse> => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check if user already liked the post
  const likedBy = post.likedBy || [];
  if (likedBy.includes(userId)) {
    // Already liked, return current state
    return {
      Response: await postToIPostWithUser(post, undefined, userId),
    };
  }

  // Add user to likedBy array and increment likes
  post.likedBy = [...likedBy, userId];
  post.likes = (post.likes || 0) + 1;

  await post.save();

  logger.info(`Post ${postId} liked by user ${userId}`);

  const updatedPost = await postToIPostWithUser(post, undefined, userId);

  // Emit real-time update to all clients viewing this post
  emitToPostRoom(postId, 'postLiked', {
    postId,
    likes: updatedPost.likes,
    isLiked: updatedPost.isLiked,
  });

  return {
    Response: updatedPost,
  };
};

/**
 * Unlike a post
 */
export const unlikePost = async (postId: string, userId: string): Promise<IPostResponse> => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check if user has liked the post
  const likedBy = post.likedBy || [];
  if (!likedBy.includes(userId)) {
    // Not liked, return current state
    return {
      Response: await postToIPostWithUser(post, undefined, userId),
    };
  }

  // Remove user from likedBy array and decrement likes
  post.likedBy = likedBy.filter((id) => id !== userId);
  post.likes = Math.max(0, (post.likes || 0) - 1);

  await post.save();

  logger.info(`Post ${postId} unliked by user ${userId}`);

  const updatedPost = await postToIPostWithUser(post, undefined, userId);

  // Emit real-time update to all clients viewing this post
  emitToPostRoom(postId, 'postUnliked', {
    postId,
    likes: updatedPost.likes,
    isLiked: updatedPost.isLiked,
  });

  return {
    Response: updatedPost,
  };
};

/**
 * Add a comment to a post
 */
export const addComment = async (
  postId: string,
  userId: string,
  text: string,
  parentCommentId?: string,
): Promise<IPostResponse> => {
  if (!text || !text.trim()) {
    throw new AppError('Comment text is required', 400);
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // If replying to a comment, verify parent comment exists
  if (parentCommentId) {
    const parentComment = (post.comments || []).find(c => c.id === parentCommentId);
    if (!parentComment) {
      throw new NotFoundError('Parent comment not found');
    }
  }

  // Create new comment
  const comment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    postId,
    userId,
    text: text.trim(),
    parentCommentId: parentCommentId || undefined,
    likes: 0,
    likedBy: [],
    createdAt: new Date(),
  };

  // Add comment to post
  const comments = post.comments || [];
  post.comments = [...comments, comment];

  await post.save();

  logger.info(`Comment added to post ${postId} by user ${userId}${parentCommentId ? ` (reply to ${parentCommentId})` : ''}`);

  // Get all unique userIds from comments for batch fetching
  const commentUserIds = new Set<string>();
  (post.comments || []).forEach((comment) => {
    commentUserIds.add(comment.userId);
  });

  // Fetch comment authors in batch
  const commentUsers = await SignUp.find({ _id: { $in: Array.from(commentUserIds) } }).select('_id name profileImage');
  const commentUserMap = new Map<string, { name: string; profileImage?: string }>();
  commentUsers.forEach((user) => {
    commentUserMap.set((user._id as any).toString(), {
      name: user.name,
      profileImage: user.profileImage,
    });
  });

  const updatedPost = await postToIPostWithUser(post, undefined, userId, commentUserMap);

  // Emit real-time update to all clients viewing this post
  emitToPostRoom(postId, 'commentAdded', {
    postId,
    comment: updatedPost.comments?.[updatedPost.comments.length - 1],
    commentCount: updatedPost.comments?.length || 0,
  });

  return {
    Response: updatedPost,
  };
};

/**
 * Like a comment
 */
export const likeComment = async (
  postId: string,
  commentId: string,
  userId: string,
): Promise<IPostResponse> => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const comments = post.comments || [];
  const comment = comments.find(c => c.id === commentId);

  if (!comment) {
    throw new NotFoundError('Comment not found');
  }

  // Check if user already liked the comment
  const likedBy = comment.likedBy || [];
  if (likedBy.includes(userId)) {
    // Already liked, return current state
    const commentUserMap = await getCommentUserMap(comments);
    const updatedPost = await postToIPostWithUser(post, undefined, userId, commentUserMap);
    return {
      Response: updatedPost,
    };
  }

  // Add user to likedBy array and increment likes
  comment.likedBy = [...likedBy, userId];
  comment.likes = (comment.likes || 0) + 1;

  await post.save();

  logger.info(`Comment ${commentId} liked by user ${userId}`);

  const commentUserMap = await getCommentUserMap(comments);
  const updatedPost = await postToIPostWithUser(post, undefined, userId, commentUserMap);

  // Emit real-time update
  emitToPostRoom(postId, 'commentLiked', {
    postId,
    commentId,
    likes: comment.likes,
    isLiked: true,
  });

  return {
    Response: updatedPost,
  };
};

/**
 * Unlike a comment
 */
export const unlikeComment = async (
  postId: string,
  commentId: string,
  userId: string,
): Promise<IPostResponse> => {
  const post = await Post.findById(postId);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const comments = post.comments || [];
  const comment = comments.find(c => c.id === commentId);

  if (!comment) {
    throw new NotFoundError('Comment not found');
  }

  // Check if user has liked the comment
  const likedBy = comment.likedBy || [];
  if (!likedBy.includes(userId)) {
    // Not liked, return current state
    const commentUserMap = await getCommentUserMap(comments);
    const updatedPost = await postToIPostWithUser(post, undefined, userId, commentUserMap);
    return {
      Response: updatedPost,
    };
  }

  // Remove user from likedBy array and decrement likes
  comment.likedBy = likedBy.filter(id => id !== userId);
  comment.likes = Math.max((comment.likes || 0) - 1, 0);

  await post.save();

  logger.info(`Comment ${commentId} unliked by user ${userId}`);

  const commentUserMap = await getCommentUserMap(comments);
  const updatedPost = await postToIPostWithUser(post, undefined, userId, commentUserMap);

  // Emit real-time update
  emitToPostRoom(postId, 'commentUnliked', {
    postId,
    commentId,
    likes: comment.likes,
    isLiked: false,
  });

  return {
    Response: updatedPost,
  };
};

/**
 * Helper function to get comment user map
 */
const getCommentUserMap = async (comments: any[]): Promise<Map<string, { name: string; profileImage?: string }>> => {
  const commentUserIds = new Set<string>();
  comments.forEach((comment) => {
    commentUserIds.add(comment.userId);
  });

  const commentUsers = await SignUp.find({ _id: { $in: Array.from(commentUserIds) } }).select('_id name profileImage');
  const commentUserMap = new Map<string, { name: string; profileImage?: string }>();
  commentUsers.forEach((user) => {
    commentUserMap.set((user._id as any).toString(), {
      name: user.name,
      profileImage: user.profileImage,
    });
  });

  return commentUserMap;
};
