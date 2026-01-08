import { SignUp, ISignUpDocument } from '../../models/SignUp';
import { Vehicle } from '../../models/user/Vehicle';
import { Order } from '../../models/Order';
import { BusinessRegistration } from '../../models/BusinessRegistration';
import {
  IGetUsersRequest,
  ICreateUserRequest,
  IUpdateUserRequest,
  IUser,
  IPaginationResponse,
  IUserWithBusinessRegistration,
} from '../../types/admin';
import { IBusinessRegistration } from '../../types/dealer/businessRegistration';
import { NotFoundError, ConflictError, AppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import bcrypt from 'bcryptjs';

/**
 * Convert user document to IUser interface
 */
const userToIUser = (userDoc: ISignUpDocument): IUser => {
  return {
    id: (userDoc._id as any).toString(),
    name: userDoc.name,
    email: userDoc.email,
    phone: userDoc.phone,
    status: userDoc.status || 'active',
    createdAt: userDoc.createdAt?.toISOString() || new Date().toISOString(),
    role: userDoc.role,
    profileImage: userDoc.profileImage,
  };
};

/**
 * Get all users with pagination and filters
 */
export const getUsers = async (
  query: IGetUsersRequest,
): Promise<{ users: IUser[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const conditions: any[] = [];

    // Filter users by role if provided (role is an array, so check if the role is in the array)
    if (query.role) {
      conditions.push({ role: { $in: [query.role] } });
    }

    // Search filter
    if (query.search) {
      conditions.push({
        $or: [
          { name: { $regex: query.search, $options: 'i' } },
          { email: { $regex: query.search, $options: 'i' } },
          { phone: { $regex: query.search, $options: 'i' } },
        ],
      });
    }

    // Status filter
    // If status is 'active', include documents where status is 'active' or doesn't exist (legacy users default to active)
    // For other statuses, match only explicit status values
    if (query.status) {
      if (query.status === 'active') {
        conditions.push({
          $or: [
            { status: 'active' },
            { status: { $exists: false } },
            { status: null },
          ],
        });
      } else {
        // For 'inactive' or 'suspended', only match explicit status
        conditions.push({ status: query.status });
      }
    }

    // Combine all conditions with $and
    const filter = conditions.length > 1 ? { $and: conditions } : conditions[0] || {};

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [users, total] = await Promise.all([
      SignUp.find(filter).sort(sort).skip(skip).limit(limit),
      SignUp.countDocuments(filter),
    ]);

    // Get all user IDs
    const userIds = users.map((user) => (user._id as any).toString());

    // Check for vehicles and business registrations in parallel
    const [vehicleCounts, businessRegistrationCounts] = await Promise.all([
      Vehicle.aggregate([
        { $match: { ownerId: { $in: userIds } } },
        { $group: { _id: '$ownerId', count: { $sum: 1 } } },
      ]),
      BusinessRegistration.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
    ]);

    // Create maps for quick lookup
    const vehicleMap = new Map<string, number>();
    vehicleCounts.forEach((item) => {
      vehicleMap.set(item._id, item.count);
    });

    const businessRegistrationMap = new Map<string, number>();
    businessRegistrationCounts.forEach((item) => {
      businessRegistrationMap.set(item._id, item.count);
    });

    // Map users with boolean flags
    const usersWithFlags = users.map((user) => {
      const userId = (user._id as any).toString();
      const userData = userToIUser(user);
      userData.isVehicleRegistration = (vehicleMap.get(userId) || 0) > 0;
      userData.isBusinessRegistration = (businessRegistrationMap.get(userId) || 0) > 0;
      return userData;
    });

    return {
      users: usersWithFlags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting users:', error);
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<IUser> => {
  try {
    const user = await SignUp.findById(userId);

    if (!user || !user.role.includes('user')) {
      throw new NotFoundError('User not found');
    }

    const userData = userToIUser(user);

    // Check for vehicle registration
    const vehicleCount = await Vehicle.countDocuments({ ownerId: userId.toString() });
    userData.isVehicleRegistration = vehicleCount > 0;

    // Check for business registration
    const businessRegistrationCount = await BusinessRegistration.countDocuments({ userId: userId.toString() });
    userData.isBusinessRegistration = businessRegistrationCount > 0;

    // Get user orders
    const orders = await Order.find({ userId: userId.toString() }).limit(10);
    userData.orders = orders;

    // Get user vehicles
    const vehicles = await Vehicle.find({ ownerId: userId.toString() });
    userData.vehicles = vehicles;

    return userData;
  } catch (error) {
    logger.error('Error getting user by ID:', error);
    throw error;
  }
};

/**
 * Get user data by business registration ID
 */
export const getUserByBusinessRegistrationId = async (
  businessRegistrationId: string,
): Promise<IUserWithBusinessRegistration> => {
  try {
    // Find business registration by ID
    const businessRegistration = await BusinessRegistration.findById(businessRegistrationId);

    if (!businessRegistration) {
      throw new NotFoundError('Business registration not found');
    }

    // Convert business registration document to interface format
    const businessRegistrationData: IBusinessRegistration = {
      id: (businessRegistration._id as any).toString(),
      businessName: businessRegistration.businessName,
      type: businessRegistration.type,
      address: businessRegistration.address,
      phone: businessRegistration.phone,
      gst: businessRegistration.gst,
      status: businessRegistration.status,
      storeOpen: businessRegistration.storeOpen !== undefined ? businessRegistration.storeOpen : true,
      userId: businessRegistration.userId,
      createdAt: businessRegistration.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: businessRegistration.updatedAt?.toISOString() || new Date().toISOString(),
    };

    // Extract userId from business registration
    const userId = businessRegistration.userId;

    if (!userId) {
      throw new NotFoundError('User ID not found in business registration');
    }

    // Find user by userId
    const user = await SignUp.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found for this business registration');
    }

    const userData = userToIUser(user);

    // Get user orders
    const orders = await Order.find({ userId: userId.toString() }).limit(10);
    userData.orders = orders;

    // Get user vehicles
    const vehicles = await Vehicle.find({ ownerId: userId.toString() });
    userData.vehicles = vehicles;

    logger.info(`User data retrieved by business registration ID: ${businessRegistrationId}`);

    return {
      businessRegistration: businessRegistrationData,
      user: userData,
    };
  } catch (error) {
    logger.error('Error getting user by business registration ID:', error);
    throw error;
  }
};

/**
 * Create user
 */
export const createUser = async (data: ICreateUserRequest): Promise<IUser> => {
  try {
    // Check if user already exists
    const existingUser = await SignUp.findOne({
      $or: [{ email: data.email }, { phone: data.phone }],
    });

    if (existingUser) {
      throw new ConflictError('User with this email or phone already exists');
    }

    const user = new SignUp({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: data.role,
    });

    await user.save();

    logger.info(`New user created by admin: ${user.email}`);

    return userToIUser(user);
  } catch (error) {
    logger.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Update user
 */
export const updateUser = async (userId: string, data: IUpdateUserRequest): Promise<IUser> => {
  try {
    const user = await SignUp.findById(userId);

    if (!user || !user.role.includes('user')) {
      throw new NotFoundError('User not found');
    }

    if (data.name !== undefined) user.name = data.name;
    if (data.phone !== undefined) {
      // Check if phone is already taken
      const existingUser = await SignUp.findOne({ phone: data.phone, _id: { $ne: userId } });
      if (existingUser) {
        throw new ConflictError('Phone number already in use');
      }
      user.phone = data.phone;
    }

    if(data.role !== undefined) user.role = data.role;

    await user.save();

    logger.info(`User updated by admin: ${user.email}`);

    return userToIUser(user);
  } catch (error) {
    logger.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Delete user
 */
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const user = await SignUp.findById(userId);

    if (!user || !user.role.includes('user')) {
      throw new NotFoundError('User not found');
    }

    await SignUp.findByIdAndDelete(userId);

    logger.info(`User deleted by admin: ${user.email}`);
  } catch (error) {
    logger.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Update user status (block/unblock)
 * Maps "blocked" to "inactive" for consistency
 */
export const updateUserStatus = async (userId: string, status: string): Promise<IUser> => {
  try {
    const user = await SignUp.findById(userId);

    if (!user || !user.role.includes('user')) {
      throw new NotFoundError('User not found');
    }

    // Map "blocked" to "inactive" if provided
    let normalizedStatus: 'active' | 'inactive' | 'suspended' = status as any;
    if (status === 'blocked') {
      normalizedStatus = 'inactive';
    }

    // Validate status
    const validStatuses: Array<'active' | 'inactive' | 'suspended'> = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(normalizedStatus)) {
      throw new AppError(`Invalid status. Allowed values: ${validStatuses.join(', ')}`, 400);
    }

    // Update user status
    user.status = normalizedStatus;
    await user.save();

    logger.info(`User status updated by admin: ${user.email} - ${normalizedStatus}`);

    return userToIUser(user);
  } catch (error) {
    logger.error('Error updating user status:', error);
    throw error;
  }
};

/**
 * Reset user password
 */
export const resetUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  try {
    const user = await SignUp.findById(userId);

    if (!user || !user.role.includes('user')) {
      throw new NotFoundError('User not found');
    }

    user.password = newPassword;
    await user.save();

    logger.info(`User password reset by admin: ${user.email}`);
  } catch (error) {
    logger.error('Error resetting user password:', error);
    throw error;
  }
};

/**
 * Get user orders
 */
export const getUserOrders = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
): Promise<{ orders: any[]; pagination: IPaginationResponse }> => {
  try {
    const user = await SignUp.findById(userId);

    if (!user || !user.role.includes('user')) {
      throw new NotFoundError('User not found');
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ userId: userId.toString() }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments({ userId: userId.toString() }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting user orders:', error);
    throw error;
  }
};

/**
 * Get user vehicles
 */
export const getUserVehicles = async (userId: string): Promise<any[]> => {
  try {
    const user = await SignUp.findById(userId);

    if (!user || !user.role.includes('user')) {
      throw new NotFoundError('User not found');
    }

    const vehicles = await Vehicle.find({ ownerId: userId.toString() });

    return vehicles;
  } catch (error) {
    logger.error('Error getting user vehicles:', error);
    throw error;
  }
};

