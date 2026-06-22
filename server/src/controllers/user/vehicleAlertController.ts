import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  lookupVehicleByPlate,
  getVehicleAlertReasons,
  createVehicleAlert,
  listVehicleAlerts,
  resolveVehicleAlert,
  getVehicleAlertById,
} from '../../services/vehicleAlert/vehicleAlertService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const getVehicleAlertReasonsController = async (
  _req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  res.status(200).json({
    success: true,
    Response: { reasons: getVehicleAlertReasons() },
  });
};

export const lookupVehicleAlertController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const { numberPlate } = req.body;
    const result = await lookupVehicleByPlate(numberPlate);
    res.status(200).json({ success: true, Response: result });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const createVehicleAlertController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, Response: { ReturnMessage: 'Unauthorized' } });
      return;
    }

    const alert = await createVehicleAlert(userId, req.body);
    res.status(201).json({
      success: true,
      Response: { alert, ReturnMessage: 'Alert sent successfully' },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const listVehicleAlertsController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, Response: { ReturnMessage: 'Unauthorized' } });
      return;
    }

    const alerts = await listVehicleAlerts(userId);
    res.status(200).json({ success: true, Response: { alerts } });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const resolveVehicleAlertController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, Response: { ReturnMessage: 'Unauthorized' } });
      return;
    }

    const alert = await resolveVehicleAlert(userId, req.params.id);
    res.status(200).json({
      success: true,
      Response: { alert, ReturnMessage: 'Alert resolved' },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const getVehicleAlertByIdController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, Response: { ReturnMessage: 'Unauthorized' } });
      return;
    }

    const alert = await getVehicleAlertById(userId, req.params.id);
    res.status(200).json({ success: true, Response: { alert } });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
