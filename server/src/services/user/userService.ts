import { SignUp } from '../../models/SignUp';
import { Vehicle } from '../../models/user/Vehicle';
import { logger } from '../../utils/logger';

export interface IUserListItem {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  matchedPlate?: string;
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

const normalizePlate = (plate: string): string =>
  plate.trim().toUpperCase().replace(/\s+/g, '');

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

    const plateOwnerMap = new Map<string, string>();

    // Add search filter if provided
    if (search) {
      const searchOr: any[] = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];

      const normalizedPlate = normalizePlate(search);
      if (normalizedPlate.length >= 3) {
        const vehicles = await Vehicle.find({
          numberPlate: { $regex: escapeRegex(normalizedPlate), $options: 'i' },
        })
          .select('ownerId numberPlate')
          .lean();

        const ownerIds: string[] = [];
        for (const vehicle of vehicles) {
          const ownerId = vehicle.ownerId;
          if (!plateOwnerMap.has(ownerId)) {
            plateOwnerMap.set(ownerId, vehicle.numberPlate);
            ownerIds.push(ownerId);
          }
        }

        if (ownerIds.length > 0) {
          searchOr.push({ _id: { $in: ownerIds } });
        }
      }

      andConditions.push({ $or: searchOr });
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

    const usersList: IUserListItem[] = users.map((user) => {
      const id = (user._id as any).toString();
      const matchedPlate = plateOwnerMap.get(id);
      return {
        id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        ...(matchedPlate ? { matchedPlate } : {}),
      };
    });

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

