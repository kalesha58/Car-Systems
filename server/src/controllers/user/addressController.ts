import { Response, NextFunction } from 'express';
import {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
} from '../../services/user/addressService';
import { IAddressFormData, IGetAddressesQuery } from '../../types/user/address';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { IAuthRequest } from '../../middleware/authMiddleware';

/**
 * Create address controller
 */
export const createAddressController = async (
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

    const addressData: IAddressFormData = req.body;
    const address = await createAddress(userId, addressData);

    res.status(201).json({
      success: true,
      address,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Get all addresses for user controller
 */
export const getUserAddressesController = async (
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

    const query: IGetAddressesQuery = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      addressType: req.query.addressType as 'home' | 'office' | 'other' | undefined,
    };

    const result = await getUserAddresses(userId, query);

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
 * Get address by ID controller
 */
export const getAddressByIdController = async (
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

    const addressId = req.params.id;
    const address = await getAddressById(addressId, userId);

    res.status(200).json({
      success: true,
      address,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Update address controller
 */
export const updateAddressController = async (
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

    const addressId = req.params.id;
    const addressData: Partial<IAddressFormData> = req.body;
    const address = await updateAddress(addressId, userId, addressData);

    res.status(200).json({
      success: true,
      address,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Delete address controller
 */
export const deleteAddressController = async (
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

    const addressId = req.params.id;
    await deleteAddress(addressId, userId);

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

