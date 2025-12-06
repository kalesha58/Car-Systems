import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getAllAddresses,
  getAddressById,
  createAddressForUser,
  updateAddress,
  deleteAddress,
} from '../../services/admin/addressService';
import { IAddressFormData, IGetAddressesQuery } from '../../types/user/address';
import { errorHandler, IAppError } from '../../utils/errorHandler';

/**
 * Get all addresses (admin only)
 */
export const getAllAddressesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query: IGetAddressesQuery & { userId?: string } = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      addressType: req.query.addressType as 'home' | 'office' | 'other' | undefined,
      userId: req.query.userId as string,
    };

    const result = await getAllAddresses(query);

    res.status(200).json({
      success: true,
      addresses: result.addresses,
      pagination: result.pagination,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get address by ID (admin only)
 */
export const getAddressByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const addressId = req.params.id;
    const address = await getAddressById(addressId);

    res.status(200).json({
      success: true,
      address,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Create address for a user (admin only)
 */
export const createAddressForUserController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.body.userId;

    if (!userId) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'User ID is required',
        },
      });
      return;
    }

    const addressData: IAddressFormData = req.body;
    const address = await createAddressForUser(userId, addressData);

    res.status(201).json({
      success: true,
      address,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Update address (admin only)
 */
export const updateAddressController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const addressId = req.params.id;
    const addressData: Partial<IAddressFormData> = req.body;
    const address = await updateAddress(addressId, addressData);

    res.status(200).json({
      success: true,
      address,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Delete address (admin only)
 */
export const deleteAddressController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const addressId = req.params.id;
    await deleteAddress(addressId);

    res.status(200).json({
      success: true,
      Response: {
        ReturnMessage: 'Address deleted successfully',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

