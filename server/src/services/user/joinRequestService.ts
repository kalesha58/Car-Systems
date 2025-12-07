import { GroupJoinRequest, IGroupJoinRequestDocument } from '../../models/GroupJoinRequest';
import { Group } from '../../models/Group';
import { GroupMember } from '../../models/GroupMember';
import { Chat } from '../../models/Chat';
import { SignUp } from '../../models/SignUp';
import { AppError, NotFoundError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { sendGroupJoinRequestEmail } from '../../utils/emailService';

export interface IGroupJoinRequest {
  id: string;
  groupId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

export interface IJoinRequestResponse {
  Response: IGroupJoinRequest;
}

export interface IJoinRequestsResponse {
  Response: IGroupJoinRequest[];
}

/**
 * Request to join a public group
 */
export const requestToJoinGroup = async (
  groupId: string,
  userId: string,
): Promise<IJoinRequestResponse> => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError('Group not found');
  }

  if (group.privacy !== 'public') {
    throw new AppError('This group is private. Join requests are only for public groups.', 400);
  }

  // Check if user is already a member
  const existingMember = await GroupMember.findOne({ groupId: group.id, userId, status: 'active' });
  if (existingMember) {
    throw new AppError('You are already a member of this group', 400);
  }

  // Check if there's already a pending request
  const existingRequest = await GroupJoinRequest.findOne({
    groupId: group.id,
    userId,
    status: 'pending',
  });

  if (existingRequest) {
    throw new AppError('You already have a pending join request for this group', 400);
  }

  // Create join request
  const joinRequest = new GroupJoinRequest({
    groupId: group.id,
    userId,
    status: 'pending',
  });

  await joinRequest.save();

  // Get requesting user info
  const requestingUser = await SignUp.findById(userId).select('name email profileImage');
  if (!requestingUser) {
    throw new NotFoundError('User not found');
  }

  // Get group owner info for email
  const groupOwner = await SignUp.findById(group.ownerId).select('name email');
  if (!groupOwner) {
    throw new NotFoundError('Group owner not found');
  }

  // Send email to group owner
  try {
    await sendGroupJoinRequestEmail(
      groupOwner.email,
      requestingUser.name,
      requestingUser.email,
      group.name,
    );
  } catch (error) {
    logger.error('Failed to send join request email:', error);
    // Don't fail the request if email fails
  }

  logger.info(`Join request created: ${joinRequest.id} for group: ${groupId} by user: ${userId}`);

  return {
    Response: {
      id: joinRequest.id,
      groupId: joinRequest.groupId,
      userId: joinRequest.userId,
      userName: requestingUser.name,
      userEmail: requestingUser.email,
      userAvatar: requestingUser.profileImage,
      status: joinRequest.status,
      requestedAt: joinRequest.requestedAt.toISOString(),
    },
  };
};

/**
 * Get join requests for a group (group owner only)
 */
export const getJoinRequestsForGroup = async (
  groupId: string,
  userId: string,
): Promise<IJoinRequestsResponse> => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError('Group not found');
  }

  // Verify user is the group owner
  if (group.ownerId !== userId) {
    throw new AppError('Only group owner can view join requests', 403);
  }

  const requests = await GroupJoinRequest.find({
    groupId: group.id,
    status: 'pending',
  }).sort({ requestedAt: -1 });

  // Get user info for each request
  const userIds = requests.map((r) => r.userId);
  const users = await SignUp.find({ _id: { $in: userIds } }).select('_id name email profileImage');

  const userMap = new Map<string, { name: string; email: string; profileImage?: string }>();
  users.forEach((user) => {
    userMap.set((user._id as any).toString(), {
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
    });
  });

  const requestsWithUser: IGroupJoinRequest[] = requests.map((req) => {
    const user = userMap.get(req.userId);
    return {
      id: req.id,
      groupId: req.groupId,
      userId: req.userId,
      userName: user?.name,
      userEmail: user?.email,
      userAvatar: user?.profileImage,
      status: req.status,
      requestedAt: req.requestedAt.toISOString(),
      respondedAt: req.respondedAt?.toISOString(),
      respondedBy: req.respondedBy,
    };
  });

  return {
    Response: requestsWithUser,
  };
};

/**
 * Approve join request
 */
export const approveJoinRequest = async (
  requestId: string,
  userId: string,
): Promise<IJoinRequestResponse> => {
  const joinRequest = await GroupJoinRequest.findById(requestId);

  if (!joinRequest) {
    throw new NotFoundError('Join request not found');
  }

  const group = await Group.findById(joinRequest.groupId);

  if (!group) {
    throw new NotFoundError('Group not found');
  }

  // Verify user is the group owner
  if (group.ownerId !== userId) {
    throw new AppError('Only group owner can approve join requests', 403);
  }

  if (joinRequest.status !== 'pending') {
    throw new AppError('This join request has already been processed', 400);
  }

  // Update request status
  joinRequest.status = 'approved';
  joinRequest.respondedAt = new Date();
  joinRequest.respondedBy = userId;
  await joinRequest.save();

  // Add user to group as member
  await GroupMember.findOneAndUpdate(
    { groupId: group.id, userId: joinRequest.userId },
    {
      groupId: group.id,
      userId: joinRequest.userId,
      role: 'member',
      status: 'active',
    },
    { upsert: true, new: true },
  );

  // Update chat participants if chat exists
  const chat = await Chat.findOne({ type: 'group', groupId: group.id });
  if (chat && !chat.participants.includes(joinRequest.userId)) {
    chat.participants.push(joinRequest.userId);
    await chat.save();
  }

  // Get user info
  const requestingUser = await SignUp.findById(joinRequest.userId).select('name email profileImage');

  logger.info(`Join request approved: ${requestId} by user: ${userId}`);

  return {
    Response: {
      id: joinRequest.id,
      groupId: joinRequest.groupId,
      userId: joinRequest.userId,
      userName: requestingUser?.name,
      userEmail: requestingUser?.email,
      userAvatar: requestingUser?.profileImage,
      status: joinRequest.status,
      requestedAt: joinRequest.requestedAt.toISOString(),
      respondedAt: joinRequest.respondedAt.toISOString(),
      respondedBy: joinRequest.respondedBy,
    },
  };
};

/**
 * Reject join request
 */
export const rejectJoinRequest = async (
  requestId: string,
  userId: string,
): Promise<IJoinRequestResponse> => {
  const joinRequest = await GroupJoinRequest.findById(requestId);

  if (!joinRequest) {
    throw new NotFoundError('Join request not found');
  }

  const group = await Group.findById(joinRequest.groupId);

  if (!group) {
    throw new NotFoundError('Group not found');
  }

  // Verify user is the group owner
  if (group.ownerId !== userId) {
    throw new AppError('Only group owner can reject join requests', 403);
  }

  if (joinRequest.status !== 'pending') {
    throw new AppError('This join request has already been processed', 400);
  }

  // Update request status
  joinRequest.status = 'rejected';
  joinRequest.respondedAt = new Date();
  joinRequest.respondedBy = userId;
  await joinRequest.save();

  // Get user info
  const requestingUser = await SignUp.findById(joinRequest.userId).select('name email profileImage');

  logger.info(`Join request rejected: ${requestId} by user: ${userId}`);

  return {
    Response: {
      id: joinRequest.id,
      groupId: joinRequest.groupId,
      userId: joinRequest.userId,
      userName: requestingUser?.name,
      userEmail: requestingUser?.email,
      userAvatar: requestingUser?.profileImage,
      status: joinRequest.status,
      requestedAt: joinRequest.requestedAt.toISOString(),
      respondedAt: joinRequest.respondedAt.toISOString(),
      respondedBy: joinRequest.respondedBy,
    },
  };
};

/**
 * Get user's own join requests
 */
export const getUserJoinRequests = async (userId: string): Promise<IJoinRequestsResponse> => {
  const requests = await GroupJoinRequest.find({ userId }).sort({ requestedAt: -1 });

  const requestsWithUser: IGroupJoinRequest[] = await Promise.all(
    requests.map(async (req) => {
      const user = await SignUp.findById(req.userId).select('name email profileImage');
      return {
        id: req.id,
        groupId: req.groupId,
        userId: req.userId,
        userName: user?.name,
        userEmail: user?.email,
        userAvatar: user?.profileImage,
        status: req.status,
        requestedAt: req.requestedAt.toISOString(),
        respondedAt: req.respondedAt?.toISOString(),
        respondedBy: req.respondedBy,
      };
    }),
  );

  return {
    Response: requestsWithUser,
  };
};

/**
 * Get pending request count for a group (group owner only)
 */
export const getPendingRequestCount = async (
  groupId: string,
  userId: string,
): Promise<{ Response: { count: number } }> => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError('Group not found');
  }

  // Verify user is the group owner
  if (group.ownerId !== userId) {
    throw new AppError('Only group owner can view pending request count', 403);
  }

  const count = await GroupJoinRequest.countDocuments({
    groupId: group.id,
    status: 'pending',
  });

  return {
    Response: { count },
  };
};

