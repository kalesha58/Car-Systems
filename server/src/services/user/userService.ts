import { SignUp } from '../../models/SignUp';
import { logger } from '../../utils/logger';

export interface IUserListItem {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

export interface IUsersListResponse {
  users: IUserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get list of users for chat selection
 */
export const getUsers = async (
  currentUserId: string,
  page: number = 1,
  limit: number = 50,
  search?: string,
): Promise<IUsersListResponse> => {
  try {
    const skip = (page - 1) * limit;

    // Build filter - exclude current user, only show active users, and exclude dealers
    const andConditions: any[] = [
      // Exclude users with dealer role (handle both string and array roles)
      {
        $or: [
          { role: { $exists: false } },
          { role: null },
          { role: { $ne: 'dealer' } },
          { role: { $not: { $in: ['dealer'] } } },
          // Handle role as array - exclude if array contains 'dealer'
          { role: { $not: { $elemMatch: { $eq: 'dealer' } } } },
        ],
      },
    ];

    // Add search filter if provided
    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const filter: any = {
      _id: { $ne: currentUserId },
      $or: [
        { status: 'active' },
        { status: { $exists: false } },
        { status: null },
      ],
      $and: andConditions,
    };

    const [users, total] = await Promise.all([
      SignUp.find(filter)
        .select('_id name email profileImage')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      SignUp.countDocuments(filter),
    ]);

    const usersList: IUserListItem[] = users.map((user) => ({
      id: (user._id as any).toString(),
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
    }));

    return {
      users: usersList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting users list:', error);
    throw error;
  }
};

