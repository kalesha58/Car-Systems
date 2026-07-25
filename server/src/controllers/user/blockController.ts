import { Response } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import {
  blockUser,
  isBlockedEitherDirection,
  listBlockedUsersDetailed,
  unblockUser,
} from '../../services/user/blockService';

export const blockUserController = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const blockerId = req.user?.userId;
    const blockedId = req.params.targetUserId;

    if (!blockerId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    await blockUser(blockerId, blockedId);
    res.status(200).json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const unblockUserController = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const blockerId = req.user?.userId;
    const blockedId = req.params.targetUserId;

    if (!blockerId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    await unblockUser(blockerId, blockedId);
    res.status(200).json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const checkBlockController = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const targetUserId = req.params.targetUserId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!targetUserId) {
      res.status(400).json({ success: false, message: 'Target user ID is required' });
      return;
    }

    const blocked = await isBlockedEitherDirection(userId, targetUserId);

    if (blocked) {
      res.status(403).json({
        success: false,
        blocked: true,
        message: 'You cannot message this user',
      });
      return;
    }

    res.status(200).json({ success: true, blocked: false });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const listBlockedUsersController = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const blockerId = req.user?.userId;
    if (!blockerId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const blockedUsers = await listBlockedUsersDetailed(blockerId);
    res.status(200).json({ success: true, Response: blockedUsers });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
