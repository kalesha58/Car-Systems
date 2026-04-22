import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getDealers,
  getDealerById,
  createDealer,
  updateDealer,
  deleteDealer,
  approveDealer,
  rejectDealer,
  suspendDealer,
  getDealerOrders,
  createProductForDealer,
  createVehicleForDealer,
  createBusinessRegistrationForDealer,
  updateProductForDealer,
  updateVehicleForDealer,
  getDealerVehicleByIdForAdmin,
  updateBusinessRegistrationForDealer
} from '../../services/admin/dealerService';
import { getDealerVehicles, getAllDealerVehicles } from '../../services/dealer/vehicleService';
import { getBusinessRegistrationByUserId } from '../../services/dealer/businessRegistrationService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getDealersController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await getDealers(req.query as any);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.status(200).json(result);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getDealerByIdController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dealer = await getDealerById(req.params.id);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.status(200).json(dealer);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createDealerController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dealer = await createDealer(req.body);
    res.status(201).json(dealer);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateDealerController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dealer = await updateDealer(req.params.id, req.body);
    res.status(200).json(dealer);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteDealerController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await deleteDealer(req.params.id);
    res.status(200).json({ success: true, message: 'Dealer deleted successfully' });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const approveDealerController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dealer = await approveDealer(req.params.id);
    res.status(200).json(dealer);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const rejectDealerController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dealer = await rejectDealer(req.params.id, req.body.reason);
    res.status(200).json(dealer);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const suspendDealerController = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dealer = await suspendDealer(req.params.id, req.body.reason);
    res.status(200).json(dealer);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getDealerOrdersController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await getDealerOrders(req.params.id, page, limit);
    res.status(200).json(result);
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createDealerProductController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const product = await createProductForDealer(userId, req.body);

    res.status(201).json({
      success: true,
      Response: product,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getAllDealerVehiclesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await getAllDealerVehicles(req.query as any, true);
    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getDealerVehiclesController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = req.params.userId;
    const result = await getDealerVehicles(dealerId, req.query as any);
    res.status(200).json({
      success: true,
      Response: result,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createDealerVehicleController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const vehicle = await createVehicleForDealer(userId, req.body);

    res.status(201).json({
      success: true,
      Response: vehicle,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createDealerBusinessRegistrationController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const registration = await createBusinessRegistrationForDealer(userId, req.body);

    res.status(201).json({
      success: true,
      Response: registration,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateDealerProductController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const productId = req.params.productId;
    const product = await updateProductForDealer(userId, productId, req.body);

    res.status(200).json({
      success: true,
      Response: product,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateDealerVehicleController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const vehicleId = req.params.vehicleId;
    const vehicle = await updateVehicleForDealer(userId, vehicleId, req.body);

    res.status(200).json({
      success: true,
      Response: vehicle,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getDealerVehicleByIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const vehicleId = req.params.vehicleId;
    const vehicle = await getDealerVehicleByIdForAdmin(vehicleId);

    res.status(200).json({
      success: true,
      Response: vehicle,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getBusinessRegistrationByUserIdController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const businessRegistration = await getBusinessRegistrationByUserId(userId);

    if (!businessRegistration) {
      res.status(404).json({
        success: false,
        Response: {
          ReturnMessage: 'Business registration not found for this user',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      Response: businessRegistration,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};


export const updateDealerBusinessRegistrationController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const registration = await updateBusinessRegistrationForDealer(userId, req.body);

    res.status(200).json({
      success: true,
      Response: registration,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

