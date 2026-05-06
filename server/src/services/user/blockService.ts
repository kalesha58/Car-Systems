import { UserBlock } from '../../models/UserBlock';
import { AppError } from '../../utils/errorHandler';

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
