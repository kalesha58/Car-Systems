import { Post, IPostDocument } from '../../models/user/Post';
import { SignUp } from '../../models/SignUp';
import { NotFoundError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

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

export interface IAdminPostDetail extends IAdminPostListItem {
  video?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  comments: Array<{
    id: string;
    userId: string;
    userName?: string;
    text: string;
    likes: number;
    createdAt: string;
  }>;
  updatedAt?: string;
}

export interface IAdminPostStats {
  totalPosts: number;
  postsToday: number;
  postsThisWeek: number;
  totalLikes: number;
  totalComments: number;
}

export interface IGetAdminPostsQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const getPostId = (post: IPostDocument): string =>
  (post._id as { toString(): string }).toString();

const startOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = (): Date => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const buildSearchUserIds = async (search: string): Promise<string[]> => {
  const users = await SignUp.find({
    $or: [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ],
  }).select('_id');
  return users.map((u) => (u._id as { toString(): string }).toString());
};

export const getAdminPostStats = async (): Promise<IAdminPostStats> => {
  const today = startOfToday();
  const weekStart = startOfWeek();

  const [totalPosts, postsToday, postsThisWeek, agg] = await Promise.all([
    Post.countDocuments({}),
    Post.countDocuments({ createdAt: { $gte: today } }),
    Post.countDocuments({ createdAt: { $gte: weekStart } }),
    Post.aggregate([
      {
        $group: {
          _id: null,
          totalLikes: { $sum: { $ifNull: ['$likes', 0] } },
          totalComments: { $sum: { $size: { $ifNull: ['$comments', []] } } },
        },
      },
    ]),
  ]);

  const totals = agg[0] || { totalLikes: 0, totalComments: 0 };

  return {
    totalPosts,
    postsToday,
    postsThisWeek,
    totalLikes: totals.totalLikes || 0,
    totalComments: totals.totalComments || 0,
  };
};

export const getAdminPosts = async (
  query: IGetAdminPostsQuery,
): Promise<{
  posts: IAdminPostListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sortBy = query.sortBy === 'likes' ? 'likes' : 'createdAt';

  const filter: Record<string, unknown> = {};

  if (query.search?.trim()) {
    const search = query.search.trim();
    const authorIds = await buildSearchUserIds(search);
    filter.$or = [
      { text: { $regex: search, $options: 'i' } },
      ...(authorIds.length > 0 ? [{ userId: { $in: authorIds } }] : []),
    ];
  }

  const [posts, total] = await Promise.all([
    Post.find(filter).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit),
    Post.countDocuments(filter),
  ]);

  const userIds = [...new Set(posts.map((p) => p.userId))];
  const users = await SignUp.find({ _id: { $in: userIds } }).select('_id name email');
  const userMap = new Map(
    users.map((u) => [
      (u._id as { toString(): string }).toString(),
      { name: u.name, email: u.email },
    ]),
  );

  const list: IAdminPostListItem[] = posts.map((post) => {
    const author = userMap.get(post.userId);
    return {
      id: getPostId(post),
      userId: post.userId,
      userName: author?.name,
      userEmail: author?.email,
      text: post.text,
      images: post.images || [],
      likes: post.likes || 0,
      commentCount: (post.comments || []).length,
      createdAt: post.createdAt.toISOString(),
    };
  });

  return {
    posts: list,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getAdminPostById = async (postId: string): Promise<IAdminPostDetail> => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  const author = await SignUp.findById(post.userId).select('name email');
  const commentUserIds = [...new Set((post.comments || []).map((c) => c.userId))];
  const commentUsers = await SignUp.find({ _id: { $in: commentUserIds } }).select('_id name');
  const commentUserMap = new Map(
    commentUsers.map((u) => [(u._id as { toString(): string }).toString(), u.name]),
  );

  return {
    id: getPostId(post),
    userId: post.userId,
    userName: author?.name,
    userEmail: author?.email,
    text: post.text,
    images: post.images || [],
    video: post.video,
    location: post.location
      ? {
          latitude: post.location.latitude,
          longitude: post.location.longitude,
          address: post.location.address,
        }
      : undefined,
    likes: post.likes || 0,
    commentCount: (post.comments || []).length,
    comments: (post.comments || []).map((comment) => ({
      id: comment.id,
      userId: comment.userId,
      userName: commentUserMap.get(comment.userId),
      text: comment.text,
      likes: comment.likes || 0,
      createdAt: comment.createdAt.toISOString(),
    })),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt?.toISOString(),
  };
};

export const deleteAdminPost = async (postId: string): Promise<void> => {
  const post = await Post.findByIdAndDelete(postId);
  if (!post) {
    throw new NotFoundError('Post not found');
  }
  logger.info(`Admin deleted post: ${postId}`);
};

export const bulkDeleteAdminPosts = async (
  ids: string[],
): Promise<{ deleted: number; failed: number }> => {
  let deleted = 0;
  let failed = 0;

  await Promise.all(
    ids.map(async (id) => {
      try {
        const result = await Post.findByIdAndDelete(id);
        if (result) {
          deleted += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }),
  );

  logger.info(`Admin bulk deleted posts: ${deleted} succeeded, ${failed} failed`);
  return { deleted, failed };
};
