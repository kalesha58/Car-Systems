import { Response, NextFunction } from 'express';
import {
  createGroup,
  getUserGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  joinGroup,
  acceptJoinRequest,
  rejectJoinRequest,
  getGroupMembers,
  getJoinRequests,
  removeMember,
  markAttendance,
  driverConsent,
} from '../../services/user/groupService';
import {
  ICreateGroupRequest,
  IUpdateGroupRequest,
  IJoinGroupRequest,
  IAttendanceRequest,
  IDriverConsentRequest,
} from '../../types/group';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { IAuthRequest } from '../../middleware/authMiddleware';
import { logger } from '../../utils/logger';

/**
 * Create group controller
 */
export const createGroupController = async (
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

    const groupData: ICreateGroupRequest = req.body;
    const result = await createGroup(userId, groupData);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get user's groups controller
 */
export const getUserGroupsController = async (
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

    const result = await getUserGroups(userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get group by ID controller
 */
export const getGroupByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const groupId = req.params.id;
    const userId = req.user?.userId;

    const result = await getGroupById(groupId, userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Update group controller
 */
export const updateGroupController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const groupId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const groupData: IUpdateGroupRequest = req.body;
    const result = await updateGroup(groupId, userId, groupData);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Delete group controller
 */
export const deleteGroupController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const groupId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    await deleteGroup(groupId, userId);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Group deleted successfully',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Join group controller
 */
export const joinGroupController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const groupId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const joinData: IJoinGroupRequest = req.body;
    const result = await joinGroup(groupId, userId, joinData.joinCode);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Accept join request controller
 */
export const acceptJoinRequestController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const adminUserId = req.user?.userId;
    const groupId = req.params.id;
    const requestUserId = req.params.userId;

    if (!adminUserId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    await acceptJoinRequest(groupId, requestUserId, adminUserId);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Join request accepted',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Reject join request controller
 */
export const rejectJoinRequestController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const adminUserId = req.user?.userId;
    const groupId = req.params.id;
    const requestUserId = req.params.userId;

    if (!adminUserId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    await rejectJoinRequest(groupId, requestUserId, adminUserId);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Join request rejected',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get group members controller
 */
export const getGroupMembersController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const groupId = req.params.id;
    const result = await getGroupMembers(groupId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get join requests controller
 */
export const getJoinRequestsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const adminUserId = req.user?.userId;
    const groupId = req.params.id;

    if (!adminUserId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const result = await getJoinRequests(groupId, adminUserId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Remove member controller
 */
export const removeMemberController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const adminUserId = req.user?.userId;
    const groupId = req.params.id;
    const memberUserId = req.params.userId;

    if (!adminUserId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    await removeMember(groupId, memberUserId, adminUserId);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Member removed successfully',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Mark attendance controller
 */
export const markAttendanceController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const groupId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const attendanceData: IAttendanceRequest = req.body;
    await markAttendance(groupId, userId, attendanceData.isComing);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Attendance marked successfully',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Driver consent controller
 */
export const driverConsentController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const groupId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        Response: {
          ReturnMessage: 'Unauthorized',
        },
      });
      return;
    }

    const consentData: IDriverConsentRequest = req.body;
    await driverConsent(groupId, userId, consentData.consent);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Driver consent updated successfully',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};


