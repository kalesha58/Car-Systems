import { Response } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import {
  appendStoryItemFromPost,
  deleteStory,
  getActiveStoryForUser,
  getStoryFeed,
  getStoryViewers,
  recordStoryView,
} from '../../services/user/storyService';

export const getStoryFeedController = async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, Response: { ReturnMessage: 'Unauthorized' } });
      return;
    }
    const result = await getStoryFeed(userId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getStoryByUserController = async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const viewerUserId = req.user?.userId;
    const targetUserId = req.params.userId;
    if (!viewerUserId) {
      res.status(401).json({ success: false, Response: { ReturnMessage: 'Unauthorized' } });
      return;
    }
    const result = await getActiveStoryForUser(viewerUserId, targetUserId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const appendStoryFromPostController = async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const postId = req.params.postId;
    if (!userId) {
      res.status(401).json({ success: false, Response: { ReturnMessage: 'Unauthorized' } });
      return;
    }
    const caption = typeof req.body?.caption === 'string' ? req.body.caption : undefined;
    const tags = req.body?.tags;
    const result = await appendStoryItemFromPost(userId, postId, { caption, tags });
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const recordStoryViewController = async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const viewerUserId = req.user?.userId;
    const storyId = req.params.storyId;
    if (!viewerUserId) {
      res.status(401).json({ success: false, Response: { ReturnMessage: 'Unauthorized' } });
      return;
    }
    const raw = req.body?.itemIndex;
    const itemIndex = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    if (Number.isNaN(itemIndex) || itemIndex < 0) {
      res.status(400).json({ success: false, Response: { ReturnMessage: 'itemIndex is required' } });
      return;
    }
    await recordStoryView(viewerUserId, storyId, itemIndex);
    res.status(200).json({ success: true });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getStoryViewersController = async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const ownerUserId = req.user?.userId;
    const storyId = req.params.storyId;
    if (!ownerUserId) {
      res.status(401).json({ success: false, Response: { ReturnMessage: 'Unauthorized' } });
      return;
    }
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const result = await getStoryViewers(ownerUserId, storyId, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteStoryController = async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const ownerUserId = req.user?.userId;
    const storyId = req.params.storyId;
    if (!ownerUserId) {
      res.status(401).json({ success: false, Response: { ReturnMessage: 'Unauthorized' } });
      return;
    }
    await deleteStory(ownerUserId, storyId);
    res.status(200).json({ success: true, Response: { deleted: true } });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
