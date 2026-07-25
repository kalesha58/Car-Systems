import mongoose from 'mongoose';
import { UserBlock } from '../../models/UserBlock';
import { SignUp } from '../../models/SignUp';
import { BusinessRegistration } from '../../models/BusinessRegistration';
import { AppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export const blockUser = async (blockerId: string, blockedId: string): Promise<void> => {
  if (blockerId === blockedId) {
    throw new AppError('You cannot block yourself', 400);
  }

  await UserBlock.findOneAndUpdate(
    { blockerId, blockedId },
    { blockerId, blockedId },
    { upsert: true, new: true },
  );
};

export const unblockUser = async (blockerId: string, blockedId: string): Promise<void> => {
  await UserBlock.findOneAndDelete({ blockerId, blockedId });
};

export const listBlockedUsers = async (blockerId: string): Promise<string[]> => {
  const records = await UserBlock.find({ blockerId }).select('blockedId').lean();
  return records.map((record) => record.blockedId);
};

export interface IBlockedUserSummary {
  id: string;
  name: string;
  avatar?: string;
  isDealer: boolean;
  blockedAt: string;
}

/**
 * Blocked users with display details so the client can render a list without
 * a second round of lookups. Falls back to a placeholder name if the account
 * can no longer be resolved.
 */
export const listBlockedUsersDetailed = async (
  blockerId: string,
): Promise<IBlockedUserSummary[]> => {
  const records = await UserBlock.find({ blockerId })
    .select('blockedId createdAt')
    .sort({ createdAt: -1 })
    .lean();

  if (records.length === 0) {
    return [];
  }

  const blockedIds = records.map((record) => record.blockedId);
  const validObjectIds = blockedIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

  const [users, businesses] = await Promise.all([
    validObjectIds.length > 0
      ? SignUp.find({ _id: { $in: validObjectIds } })
          .select('name profileImage role')
          .lean()
      : Promise.resolve([]),
    validObjectIds.length > 0
      ? BusinessRegistration.find({ userId: { $in: blockedIds } })
          .select('userId businessName')
          .lean()
          .catch((error) => {
            logger.warn('Unable to resolve business names for blocked users:', error);
            return [] as any[];
          })
      : Promise.resolve([] as any[]),
  ]);

  const userById = new Map(users.map((user: any) => [String(user._id), user]));
  const businessByUserId = new Map(
    (businesses as any[]).map((business) => [String(business.userId), business]),
  );

  return records.map((record) => {
    const user = userById.get(record.blockedId);
    const business = businessByUserId.get(record.blockedId);

    return {
      id: record.blockedId,
      name: business?.businessName || user?.name || 'Unknown user',
      avatar: user?.profileImage,
      isDealer: Boolean(business) || Boolean(user?.role?.includes('dealer')),
      blockedAt: record.createdAt
        ? new Date(record.createdAt).toISOString()
        : new Date().toISOString(),
    };
  });
};

export const getBlockedUserIdsForUser = async (userId: string): Promise<Set<string>> => {
  const records = await UserBlock.find({
    $or: [{ blockerId: userId }, { blockedId: userId }],
  })
    .select('blockerId blockedId')
    .lean();

  const blockedIds = new Set<string>();
  records.forEach((record) => {
    if (record.blockerId === userId) {
      blockedIds.add(record.blockedId);
    } else if (record.blockedId === userId) {
      blockedIds.add(record.blockerId);
    }
  });

  return blockedIds;
};

export const isBlockedEitherDirection = async (userA: string, userB: string): Promise<boolean> => {
  const record = await UserBlock.findOne({
    $or: [
      { blockerId: userA, blockedId: userB },
      { blockerId: userB, blockedId: userA },
    ],
  }).select('_id');
  return Boolean(record);
};
