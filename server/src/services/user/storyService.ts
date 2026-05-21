import { Story, IStoryDocument } from '../../models/user/Story';
import { StoryView } from '../../models/user/StoryView';
import { Post } from '../../models/user/Post';
import { SignUp } from '../../models/SignUp';
import { AppError, NotFoundError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { getBlockedUserIdsForUser, isBlockedEitherDirection } from './blockService';
import {
  IStory,
  IStoryDetailResponse,
  IStoryFeedEntry,
  IStoryFeedResponse,
  IStoryItem,
  IStoryViewersResponse,
  IStoryViewerEntry,
} from '../../types/story';

const STORY_DURATION_MS = 24 * 60 * 60 * 1000;
const MAX_CAPTION = 500;

/** Remove expired stories and their view rows from the database (24h window is enforced by expiresAt). */
export const pruneExpiredStories = async (): Promise<void> => {
  const now = new Date();
  const expired = await Story.find({ expiresAt: { $lte: now } }).select('_id').lean();
  if (!expired.length) {
    return;
  }
  const idStrings = expired.map((d) => String((d as { _id: unknown })._id));
  await StoryView.deleteMany({ storyId: { $in: idStrings } });
  await Story.deleteMany({ _id: { $in: expired.map((d) => (d as { _id: unknown })._id) } });
  logger.info(`Pruned ${idStrings.length} expired stor(ies) from database`);
};
const MAX_TAGS = 8;
const MAX_TAG_LEN = 24;
const DEFAULT_VIEWERS_PAGE = 1;
const DEFAULT_VIEWERS_LIMIT = 50;

const normalizeStoryTags = (raw: unknown): string[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x !== 'string') continue;
    const t = x.trim().replace(/^#+/, '').slice(0, MAX_TAG_LEN);
    if (t.length > 0) out.push(t);
  }
  const uniq = [...new Set(out)].slice(0, MAX_TAGS);
  return uniq.length > 0 ? uniq : undefined;
};

const storyDocToIStory = (doc: IStoryDocument | Record<string, unknown>): IStory => {
  const d = doc as IStoryDocument & { _id: { toString: () => string } };
  const id = typeof (d as any).id === 'string' ? (d as any).id : (d as any)._id?.toString?.() ?? '';
  const items: IStoryItem[] = (d.items || []).map((it) => ({
    order: it.order,
    type: it.type,
    mediaUrl: it.mediaUrl,
    caption: it.caption,
    tags: Array.isArray(it.tags) && it.tags.length > 0 ? [...it.tags] : undefined,
    sourcePostId: it.sourcePostId,
    createdAt: (it.createdAt instanceof Date ? it.createdAt : new Date(it.createdAt as any)).toISOString(),
  }));
  return {
    id,
    userId: d.userId,
    items,
    expiresAt: (d.expiresAt instanceof Date ? d.expiresAt : new Date(d.expiresAt as any)).toISOString(),
    createdAt: (d.createdAt instanceof Date ? d.createdAt : new Date((d as any).createdAt)).toISOString(),
    updatedAt: d.updatedAt
      ? (d.updatedAt instanceof Date ? d.updatedAt : new Date((d as any).updatedAt)).toISOString()
      : undefined,
  };
};

export const getStoryFeed = async (currentUserId: string): Promise<IStoryFeedResponse> => {
  await pruneExpiredStories();
  const blocked = await getBlockedUserIdsForUser(currentUserId);
  const blockedList = Array.from(blocked);
  const now = new Date();

  const stories = await Story.find({
    expiresAt: { $gt: now },
    userId: { $nin: blockedList },
  })
    .sort({ updatedAt: -1 })
    .lean();

  const storyUserIds = [...new Set(stories.map((s) => s.userId))];
  if (!storyUserIds.includes(currentUserId)) {
    storyUserIds.push(currentUserId);
  }

  const users = await SignUp.find({ _id: { $in: storyUserIds } })
    .select('_id name profileImage')
    .lean();

  const userMap = new Map<string, { name: string; profileImage?: string }>();
  users.forEach((u) => {
    userMap.set(String(u._id), {
      name: u.name,
      profileImage: u.profileImage,
    });
  });

  const me = userMap.get(currentUserId);
  const ownStory = stories.find((s) => s.userId === currentUserId);
  const otherStories = stories.filter((s) => s.userId !== currentUserId);

  const storyIds = otherStories.map((s) => String(s._id));
  const views =
    storyIds.length > 0
      ? await StoryView.find({
          storyId: { $in: storyIds },
          viewerUserId: currentUserId,
        })
          .select('storyId itemIndex')
          .lean()
      : [];

  const feed: IStoryFeedEntry[] = [];

  const ownItems = ownStory?.items ?? [];
  const ownPreview =
    ownItems.length > 0 ? ownItems[ownItems.length - 1].mediaUrl : undefined;

  feed.push({
    isOwn: true,
    userId: currentUserId,
    userName: me?.name,
    userAvatar: me?.profileImage,
    storyId: ownStory ? String(ownStory._id) : undefined,
    previewMediaUrl: ownPreview,
    itemCount: ownItems.length,
    expiresAt: ownStory?.expiresAt
      ? new Date(ownStory.expiresAt as Date).toISOString()
      : undefined,
    hasUnseen: false,
  });

  for (const s of otherStories) {
    const uid = s.userId;
    const u = userMap.get(uid);
    const items = s.items ?? [];
    const lastIndex = Math.max(0, items.length - 1);
    const sid = String(s._id);
    const hasSeenLast =
      items.length === 0
        ? true
        : views.some((v) => v.storyId === sid && v.itemIndex === lastIndex);
    const preview = items.length > 0 ? items[items.length - 1].mediaUrl : undefined;

    feed.push({
      isOwn: false,
      userId: uid,
      userName: u?.name,
      userAvatar: u?.profileImage,
      storyId: sid,
      previewMediaUrl: preview,
      itemCount: items.length,
      expiresAt: s.expiresAt ? new Date(s.expiresAt as Date).toISOString() : undefined,
      hasUnseen: items.length > 0 && !hasSeenLast,
    });
  }

  return { Response: feed };
};

export const getActiveStoryForUser = async (
  viewerUserId: string,
  targetUserId: string,
): Promise<IStoryDetailResponse> => {
  await pruneExpiredStories();
  if (await isBlockedEitherDirection(viewerUserId, targetUserId)) {
    throw new NotFoundError('Story not found');
  }

  const now = new Date();
  const story = await Story.findOne({
    userId: targetUserId,
    expiresAt: { $gt: now },
  });

  if (!story) {
    throw new NotFoundError('Story not found');
  }

  return { Response: storyDocToIStory(story) };
};

export const appendStoryItemFromPost = async (
  currentUserId: string,
  postId: string,
  opts?: { caption?: string; tags?: unknown },
): Promise<IStoryDetailResponse> => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  if (await isBlockedEitherDirection(currentUserId, post.userId)) {
    throw new NotFoundError('Post not found');
  }

  let mediaUrl: string;
  let type: 'image' | 'video';
  const images = post.images || [];
  if (images.length > 0) {
    mediaUrl = images[0];
    type = 'image';
  } else if (post.video) {
    mediaUrl = post.video;
    type = 'video';
  } else {
    throw new AppError('Post has no image or video for status', 400);
  }

  const captionTrimmed = opts?.caption?.trim()
    ? opts.caption.trim().slice(0, MAX_CAPTION)
    : undefined;
  const tagsNormalized = normalizeStoryTags(opts?.tags);

  const now = new Date();
  let story = await Story.findOne({
    userId: currentUserId,
    expiresAt: { $gt: now },
  });

  if (!story) {
    story = new Story({
      userId: currentUserId,
      items: [],
      expiresAt: new Date(Date.now() + STORY_DURATION_MS),
    });
  }

  const order = story.items.length;
  story.items.push({
    order,
    type,
    mediaUrl,
    caption: captionTrimmed,
    tags: tagsNormalized ?? [],
    sourcePostId: postId,
    createdAt: new Date(),
  });

  await story.save();
  logger.info(`Story item appended from post ${postId} for user ${currentUserId}`);

  return { Response: storyDocToIStory(story) };
};

export const recordStoryView = async (
  viewerUserId: string,
  storyId: string,
  itemIndex: number,
): Promise<void> => {
  const story = await Story.findById(storyId);
  if (!story || story.expiresAt.getTime() <= Date.now()) {
    throw new NotFoundError('Story not found');
  }

  if (await isBlockedEitherDirection(viewerUserId, story.userId)) {
    throw new NotFoundError('Story not found');
  }

  if (itemIndex < 0 || itemIndex >= story.items.length) {
    throw new AppError('Invalid item index', 400);
  }

  if (viewerUserId === story.userId) {
    return;
  }

  await StoryView.findOneAndUpdate(
    { storyId, viewerUserId: viewerUserId, itemIndex },
    { $set: { viewedAt: new Date() } },
    { upsert: true, new: true },
  );
};

export const getStoryViewers = async (
  ownerUserId: string,
  storyId: string,
  page: number = DEFAULT_VIEWERS_PAGE,
  limit: number = DEFAULT_VIEWERS_LIMIT,
): Promise<IStoryViewersResponse> => {
  const story = await Story.findById(storyId);
  if (!story) {
    throw new NotFoundError('Story not found');
  }
  if (story.userId !== ownerUserId) {
    throw new AppError('Forbidden', 403);
  }

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  type ViewerGroupRow = { _id: string; lastViewedAt: Date };
  type ViewersFacetOutput = {
    data: ViewerGroupRow[];
    totalCount: { count: number }[];
  };

  const grouped = await StoryView.aggregate<ViewersFacetOutput>([
    { $match: { storyId } },
    { $sort: { viewedAt: -1 } },
    {
      $group: {
        _id: '$viewerUserId',
        lastViewedAt: { $first: '$viewedAt' },
      },
    },
    { $sort: { lastViewedAt: -1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: safeLimit }],
        totalCount: [{ $count: 'count' }],
      },
    },
  ]);

  const facet: ViewersFacetOutput = grouped[0] ?? { data: [], totalCount: [] };
  const rows = facet.data;
  const total = facet.totalCount[0]?.count ?? 0;

  const viewerIds = rows.map((r: ViewerGroupRow) => r._id);
  const users = await SignUp.find({ _id: { $in: viewerIds } })
    .select('_id name profileImage')
    .lean();

  const userById = new Map<string, { name: string; profileImage?: string }>();
  users.forEach((u) => {
    userById.set(String(u._id), { name: u.name, profileImage: u.profileImage });
  });

  const viewers: IStoryViewerEntry[] = rows.map((r: ViewerGroupRow) => {
    const info = userById.get(r._id);
    return {
      viewerUserId: r._id,
      userName: info?.name,
      userAvatar: info?.profileImage,
      lastViewedAt: r.lastViewedAt.toISOString(),
    };
  });

  return {
    Response: {
      viewers,
      total,
      page: safePage,
      limit: safeLimit,
      hasMore: skip + viewers.length < total,
    },
  };
};

export const deleteStory = async (ownerUserId: string, storyId: string): Promise<void> => {
  const story = await Story.findById(storyId);
  if (!story) {
    throw new NotFoundError('Story not found');
  }
  if (story.userId !== ownerUserId) {
    throw new AppError('Forbidden', 403);
  }
  await StoryView.deleteMany({ storyId });
  await Story.findByIdAndDelete(storyId);
  logger.info(`Story ${storyId} deleted by ${ownerUserId}`);
};
