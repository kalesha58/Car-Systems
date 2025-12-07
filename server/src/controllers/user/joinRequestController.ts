import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  requestToJoinGroup,
  getJoinRequestsForGroup,
  approveJoinRequest,
  rejectJoinRequest,
  getUserJoinRequests,
  getPendingRequestCount,
} from '../../services/user/joinRequestService';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

/**
 * Request to join a public group
 */
export const requestToJoinGroupController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { groupId } = req.params;

    logger.info(`[Join Request] Received request - userId: ${userId}, groupId: ${groupId}`);

    if (!userId) {
      logger.warn('[Join Request] Unauthorized - no userId');
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    if (!groupId) {
      logger.warn('[Join Request] Bad request - no groupId');
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Group ID is required',
        },
      });
      return;
    }

    const result = await requestToJoinGroup(groupId, userId);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get join requests for a group (group owner only)
 */
export const getJoinRequestsForGroupController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { groupId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    if (!groupId) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Group ID is required',
        },
      });
      return;
    }

    const result = await getJoinRequestsForGroup(groupId, userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Approve join request
 */
export const approveJoinRequestController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { requestId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    if (!requestId) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Request ID is required',
        },
      });
      return;
    }

    const result = await approveJoinRequest(requestId, userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Reject join request
 */
export const rejectJoinRequestController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { requestId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    if (!requestId) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Request ID is required',
        },
      });
      return;
    }

    const result = await rejectJoinRequest(requestId, userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get user's own join requests
 */
export const getUserJoinRequestsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const result = await getUserJoinRequests(userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get pending request count for a group (group owner only)
 */
export const getPendingRequestCountController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { groupId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    if (!groupId) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Group ID is required',
        },
      });
      return;
    }

    const result = await getPendingRequestCount(groupId, userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

