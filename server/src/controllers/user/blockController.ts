import { Response } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { blockUser, listBlockedUsers, unblockUser } from '../../services/user/blockService';

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

export const listBlockedUsersController = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const blockerId = req.user?.userId;
    if (!blockerId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const blockedUserIds = await listBlockedUsers(blockerId);
    res.status(200).json({ success: true, Response: blockedUserIds });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
