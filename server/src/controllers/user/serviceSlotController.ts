import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  getAvailableSlots,
  bookSlot,
  IGetAvailableSlotsRequest,
} from '../../services/serviceSlotService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

/**
 * Get available slots for a service
 */
export const getServiceSlotsController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { serviceId } = req.params;
    const { date, serviceType } = req.query;

    if (!serviceId) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Service ID is required',
        },
      });
      return;
    }

    if (!date) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Date is required',
        },
      });
      return;
    }

    const query: IGetAvailableSlotsRequest = {
      serviceId,
      date: date as string,
      serviceType: serviceType as 'center' | 'home' | undefined,
    };

    const slots = await getAvailableSlots(query);

    res.status(200).json({
      success: true,
      Response: {
        slots,
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

/**
 * Book a service slot
 */
export const bookServiceSlotController = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { serviceId, slotId } = req.params;
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

    if (!serviceId || !slotId) {
      res.status(400).json({
        success: false,
        Response: {
          ReturnMessage: 'Service ID and Slot ID are required',
        },
      });
      return;
    }

    const slot = await bookSlot(slotId);

    res.status(200).json({
      success: true,
      Response: {
        slot,
        ReturnMessage: 'Slot booked successfully',
      },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
