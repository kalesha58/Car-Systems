import { Response, NextFunction } from 'express';
import { getNearbyCarWashDealers } from '../../services/dealer/nearbyDealersService';
import { errorHandler, IAppError } from '../../utils/errorHandler';
import { IAuthRequest } from '../../middleware/authMiddleware';

/**
 * Get nearby car wash dealers controller
 */
export const getNearbyCarWashDealersController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);
    const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 50;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    if (isNaN(latitude) || isNaN(longitude)) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Latitude and longitude are required',
        },
      });
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Invalid latitude or longitude values',
        },
      });
      return;
    }

    const dealers = await getNearbyCarWashDealers(latitude, longitude, radiusKm, limit);

    res.status(200).json({
      success: true,
      Response: {
        dealers,
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
