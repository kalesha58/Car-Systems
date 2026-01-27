import { Response, NextFunction } from 'express';
import {
  createGroup,
  getUserGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  joinGroup,
  getGroupMembers,
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
import { uploadToCloudinary } from '../../config/cloudinary';
import fs from 'fs';

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

/**
 * Update group image controller
 */
export const updateGroupImageController = async (
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

    if (!req.file) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'No image file provided',
        },
      });
      return;
    }

    // Verify user is group owner/admin
    const groupResult = await getGroupById(groupId, userId);
    const group = groupResult.Response;

    if (group.ownerId !== userId) {
      // Check if user is admin member
      const { GroupMember } = await import('../../models/GroupMember');
      const member = await GroupMember.findOne({
        groupId: group.id,
        userId,
        role: 'admin',
        status: 'active',
      });

      if (!member) {
        res.status(403).json({
          success: false,
          Response: {
            ReturnMessage: 'Only group owner or admin can update group image',
          },
        });
        return;
      }
    }

    try {
      logger.info('Uploading group image to Cloudinary...');

      // Determine if using memory storage (buffer) or disk storage (path)
      const fileSource = (req.file as any).buffer || req.file.path;

      // Upload to Cloudinary in groups folder
      const result = await uploadToCloudinary(fileSource, 'car-connect/groups');

      logger.info(`Group image uploaded to Cloudinary: ${result.url}`);

      // Update group with new image URL
      const updateResult = await updateGroup(groupId, userId, {
        groupImage: result.url,
      });

      // Delete local file after upload (only if using disk storage)
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        logger.info('Local group image file deleted after upload');
      }

      res.status(200).json({
        success: true,
        ...updateResult,
      });
    } catch (uploadError) {
      logger.error('Error uploading group image:', uploadError);

      // Clean up local file on error (only if using disk storage)
      if (req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
          logger.info('Local file cleaned up after upload error');
        } catch (unlinkError) {
          logger.error('Error deleting local file:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        Response: {
          ReturnMessage: 'Failed to upload group image',
        },
      });
    }
  } catch (error) {
    // Clean up local file on error (only if using disk storage)
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        logger.info('Local file cleaned up after error');
      } catch (unlinkError) {
        logger.error('Error deleting local file:', unlinkError);
      }
    }

    errorHandler(error as IAppError, res);
  }
};


