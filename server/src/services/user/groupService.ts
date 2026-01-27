import { Group, IGroupDocument } from '../../models/Group';
import { GroupMember, IGroupMemberDocument } from '../../models/GroupMember';
import { SignUp } from '../../models/SignUp';
import {
  ICreateGroupRequest,
  IUpdateGroupRequest,
  IGroup,
  IGroupResponse,
  IGroupsResponse,
  IGroupMember,
  IGroupMembersResponse,
} from '../../types/group';
import { AppError, NotFoundError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

/**
 * Generate unique join code for private groups
 */
const generateJoinCode = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

/**
 * Convert group document to IGroup interface
 */
const groupToIGroup = async (groupDoc: IGroupDocument): Promise<IGroup> => {
  const memberCount = await GroupMember.countDocuments({
    groupId: groupDoc.id,
    status: 'active',
  });

  return {
    id: groupDoc.id,
    name: groupDoc.name,
    description: groupDoc.description,
    theme: groupDoc.theme,
    type: groupDoc.type,
    ownerId: groupDoc.ownerId,
    privacy: groupDoc.privacy,
    joinCode: groupDoc.joinCode,
    tripPlan: groupDoc.tripPlan
      ? {
          plan: groupDoc.tripPlan.plan,
          startDate: groupDoc.tripPlan.startDate.toISOString(),
          endDate: groupDoc.tripPlan.endDate.toISOString(),
          startTime: groupDoc.tripPlan.startTime,
          endTime: groupDoc.tripPlan.endTime,
        }
      : undefined,
    vanDetails: groupDoc.vanDetails,
    groupImage: groupDoc.groupImage,
    chatEnabled: groupDoc.chatEnabled,
    liveLocationEnabled: groupDoc.liveLocationEnabled,
    memberCount,
    createdAt: groupDoc.createdAt.toISOString(),
    updatedAt: groupDoc.updatedAt.toISOString(),
  };
};

/**
 * Create a new group
 */
export const createGroup = async (
  userId: string,
  data: ICreateGroupRequest,
): Promise<IGroupResponse> => {
  const { name, type, privacy, tripPlan, vanDetails } = data;

  if (!name || !name.trim()) {
    throw new AppError('Group name is required', 400);
  }

  if (!type) {
    throw new AppError('Group type is required', 400);
  }

  if (type === 'bikeCarDrive' && !tripPlan) {
    throw new AppError('Trip plan is required for bike/car drive groups', 400);
  }

  if (type === 'vanTransportation' && !vanDetails) {
    throw new AppError('Van details are required for van transportation groups', 400);
  }

  let joinCode: string | undefined;
  if (privacy === 'private') {
    joinCode = generateJoinCode();
    // Ensure uniqueness
    let exists = await Group.findOne({ joinCode });
    while (exists) {
      joinCode = generateJoinCode();
      exists = await Group.findOne({ joinCode });
    }
  }

  const group = new Group({
    name: name.trim(),
    description: data.description?.trim(),
    theme: data.theme?.trim(),
    type,
    ownerId: userId,
    privacy: privacy || 'public',
    joinCode,
    tripPlan: tripPlan
      ? {
          plan: tripPlan.plan,
          startDate: new Date(tripPlan.startDate),
          endDate: new Date(tripPlan.endDate),
          startTime: tripPlan.startTime,
          endTime: tripPlan.endTime,
        }
      : undefined,
    vanDetails,
    groupImage: data.groupImage,
    chatEnabled: data.chatEnabled !== undefined ? data.chatEnabled : true,
    liveLocationEnabled: data.liveLocationEnabled !== undefined ? data.liveLocationEnabled : true,
  });

  await group.save();

  // Add owner as admin member
  const ownerMember = new GroupMember({
    groupId: group.id,
    userId,
    role: 'admin',
    status: 'active',
  });
  await ownerMember.save();

  logger.info(`New group created: ${group.id} by user: ${userId}`);

  return {
    Response: await groupToIGroup(group),
  };
};

/**
 * Get user's groups
 */
export const getUserGroups = async (userId: string): Promise<IGroupsResponse> => {
  const memberGroups = await GroupMember.find({ userId, status: 'active' });
  const groupIds = memberGroups.map((m) => m.groupId);

  const groups = await Group.find({ _id: { $in: groupIds } }).sort({ createdAt: -1 });

  const groupsWithData = await Promise.all(groups.map((g) => groupToIGroup(g)));

  return {
    Response: groupsWithData,
  };
};

/**
 * Get group by ID
 */
export const getGroupById = async (groupId: string, userId?: string): Promise<IGroupResponse> => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError('Group not found');
  }

  // Check if user is a member (if userId provided)
  if (userId) {
    const member = await GroupMember.findOne({ groupId: group.id, userId, status: 'active' });
    if (!member && group.privacy === 'private') {
      throw new AppError('You are not a member of this group', 403);
    }
  }

  return {
    Response: await groupToIGroup(group),
  };
};

/**
 * Update group (admin only)
 */
export const updateGroup = async (
  groupId: string,
  userId: string,
  data: IUpdateGroupRequest,
): Promise<IGroupResponse> => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError('Group not found');
  }

  // Check if user is admin
  const member = await GroupMember.findOne({ groupId: group.id, userId, role: 'admin' });
  if (!member) {
    throw new AppError('Only group admins can update the group', 403);
  }

  if (data.name !== undefined) group.name = data.name.trim();
  if (data.description !== undefined) group.description = data.description?.trim();
  if (data.theme !== undefined) group.theme = data.theme?.trim();
  if (data.privacy !== undefined) {
    group.privacy = data.privacy;
    // Generate join code if switching to private
    if (data.privacy === 'private' && !group.joinCode) {
      let joinCode = generateJoinCode();
      let exists = await Group.findOne({ joinCode });
      while (exists) {
        joinCode = generateJoinCode();
        exists = await Group.findOne({ joinCode });
      }
      group.joinCode = joinCode;
    } else if (data.privacy === 'public') {
      group.joinCode = undefined;
    }
  }
  if (data.tripPlan !== undefined) {
    group.tripPlan = {
      plan: data.tripPlan.plan,
      startDate: new Date(data.tripPlan.startDate),
      endDate: new Date(data.tripPlan.endDate),
      startTime: data.tripPlan.startTime,
      endTime: data.tripPlan.endTime,
    };
  }
  if (data.vanDetails !== undefined) group.vanDetails = data.vanDetails;
  if (data.groupImage !== undefined) group.groupImage = data.groupImage;
  if (data.chatEnabled !== undefined) group.chatEnabled = data.chatEnabled;
  if (data.liveLocationEnabled !== undefined) group.liveLocationEnabled = data.liveLocationEnabled;

  await group.save();

  logger.info(`Group updated: ${group.id}`);

  return {
    Response: await groupToIGroup(group),
  };
};

/**
 * Delete group (admin only)
 */
export const deleteGroup = async (groupId: string, userId: string): Promise<void> => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError('Group not found');
  }

  if (group.ownerId !== userId) {
    throw new AppError('Only group owner can delete the group', 403);
  }

  // Delete all members
  await GroupMember.deleteMany({ groupId: group.id });

  await Group.findByIdAndDelete(groupId);

  logger.info(`Group deleted: ${group.id}`);
};

/**
 * Join public group or request to join private group
 */
export const joinGroup = async (
  groupId: string,
  userId: string,
  joinCode?: string,
): Promise<IGroupResponse> => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError('Group not found');
  }

  // Check if already a member
  const existingMember = await GroupMember.findOne({ groupId: group.id, userId });
  if (existingMember && existingMember.status === 'active') {
    throw new AppError('You are already a member of this group', 400);
  }

  if (group.privacy === 'private') {
    if (!joinCode) {
      throw new AppError('Join code is required for private groups', 400);
    }

    if (group.joinCode !== joinCode) {
      throw new AppError('Invalid join code', 400);
    }
  }

  // Join group directly (both public and private with valid code)
  if (existingMember) {
    existingMember.status = 'active';
    await existingMember.save();
  } else {
    const member = new GroupMember({
      groupId: group.id,
      userId,
      role: 'member',
      status: 'active',
    });
    await member.save();
  }

  logger.info(`User joined group: ${group.id} by user: ${userId}`);

  return {
    Response: await groupToIGroup(group),
  };
};

/**
 * Get group members
 */
export const getGroupMembers = async (groupId: string): Promise<IGroupMembersResponse> => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError('Group not found');
  }

  const members = await GroupMember.find({ groupId: group.id, status: 'active' });
  const userIds = members.map((m) => m.userId);

  const users = await SignUp.find({ _id: { $in: userIds } }).select('_id name profileImage');

  const userMap = new Map<string, { name: string; profileImage?: string }>();
  users.forEach((user) => {
    userMap.set((user._id as any).toString(), {
      name: user.name,
      profileImage: user.profileImage,
    });
  });

  const membersWithUser: IGroupMember[] = members.map((member) => {
    const user = userMap.get(member.userId);
    return {
      id: member.id,
      groupId: member.groupId,
      userId: member.userId,
      userName: user?.name,
      userAvatar: user?.profileImage,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt.toISOString(),
      createdAt: member.createdAt.toISOString(),
    };
  });

  return {
    Response: membersWithUser,
  };
};

/**
 * Remove member from group (admin only)
 */
export const removeMember = async (
  groupId: string,
  memberUserId: string,
  adminUserId: string,
): Promise<void> => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError('Group not found');
  }

  // Check if user is admin
  const adminMember = await GroupMember.findOne({ groupId: group.id, userId: adminUserId, role: 'admin' });
  if (!adminMember) {
    throw new AppError('Only group admins can remove members', 403);
  }

  // Cannot remove owner
  if (memberUserId === group.ownerId) {
    throw new AppError('Cannot remove group owner', 400);
  }

  const member = await GroupMember.findOne({ groupId: group.id, userId: memberUserId });
  if (!member) {
    throw new NotFoundError('Member not found');
  }

  await GroupMember.deleteOne({ _id: member._id });

  logger.info(`Member removed from group: ${group.id} user: ${memberUserId}`);
};

/**
 * Mark attendance (van groups)
 */
export const markAttendance = async (
  groupId: string,
  userId: string,
  isComing: boolean,
): Promise<void> => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError('Group not found');
  }

  if (group.type !== 'vanTransportation') {
    throw new AppError('Attendance can only be marked for van transportation groups', 400);
  }

  // Check if user is a member
  const member = await GroupMember.findOne({ groupId: group.id, userId, status: 'active' });
  if (!member) {
    throw new AppError('You are not a member of this group', 403);
  }

  // Store attendance in a separate collection or as part of member
  // For now, we'll add an attendance field to GroupMember
  // This could be extended to a separate Attendance model if needed
  logger.info(`Attendance marked for group: ${group.id} user: ${userId} isComing: ${isComing}`);
};

/**
 * Driver consent (van groups)
 */
export const driverConsent = async (
  groupId: string,
  userId: string,
  consent: boolean,
): Promise<void> => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError('Group not found');
  }

  if (group.type !== 'vanTransportation') {
    throw new AppError('Driver consent is only for van transportation groups', 400);
  }

  // Check if user is the owner/admin (driver)
  const member = await GroupMember.findOne({ groupId: group.id, userId, role: 'admin' });
  if (!member) {
    throw new AppError('Only group admin can provide driver consent', 403);
  }

  logger.info(`Driver consent for group: ${group.id} user: ${userId} consent: ${consent}`);
};

