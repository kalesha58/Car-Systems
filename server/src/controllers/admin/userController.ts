import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getUsers,
  getUserById,
  getUserByBusinessRegistrationId,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  resetUserPassword,
  getUserOrders,
  getUserVehicles,
} from '../../services/admin/userService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

/**
 * Get all users
 */
export const getUsersController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await getUsers(req.query as any);
    res.status(200).json(result);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get user by ID
 */
export const getUserByIdController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserById(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get user data by business registration ID
 */
export const getUserByBusinessRegistrationIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await getUserByBusinessRegistrationId(req.params.businessRegistrationId);
    res.status(200).json(user);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Create user
 */
export const createUserController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Update user
 */
export const updateUserController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await updateUser(req.params.id, req.body);
    res.status(200).json(user);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Delete user
 */
export const deleteUserController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await deleteUser(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Update user status
 */
export const updateUserStatusController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await updateUserStatus(req.params.id, req.body.status);
    res.status(200).json(user);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Reset user password
 */
export const resetUserPasswordController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await resetUserPassword(req.params.id, req.body.newPassword);
    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get user orders
 */
export const getUserOrdersController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await getUserOrders(req.params.id, page, limit);
    res.status(200).json(result);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get user vehicles
 */
export const getUserVehiclesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const vehicles = await getUserVehicles(req.params.id);
    res.status(200).json({ vehicles });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

