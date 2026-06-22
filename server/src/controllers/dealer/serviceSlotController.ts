import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../middleware/authMiddleware';
import {
  dealerCreateServiceSlot,
  dealerListServiceSlots,
  dealerUpdateServiceSlot,
  dealerDeleteServiceSlot,
} from '../../services/dealer/dealerServiceSlotService';
import { errorHandler, IAppError } from '../../utils/errorHandler';

export const createDealerServiceSlotController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as { dealerId?: string }).dealerId;
    const { serviceId } = req.params;
    const { date, startTime, endTime, serviceType, maxBookings } = req.body;

    const slot = await dealerCreateServiceSlot(dealerId!, serviceId, {
      date,
      startTime,
      endTime,
      serviceType: serviceType || 'center',
      maxBookings,
    });

    res.status(201).json({
      success: true,
      Response: slot,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const listDealerServiceSlotsController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as { dealerId?: string }).dealerId;
    const { serviceId } = req.params;
    const { from, to } = req.query;

    const slots = await dealerListServiceSlots(dealerId!, serviceId, {
      from: from as string | undefined,
      to: to as string | undefined,
    });

    res.status(200).json({
      success: true,
      Response: { slots },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const updateDealerServiceSlotController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as { dealerId?: string }).dealerId;
    const { serviceId, slotId } = req.params;
    const { maxBookings } = req.body;

    const slot = await dealerUpdateServiceSlot(
      dealerId!,
      serviceId,
      slotId,
      maxBookings,
    );

    res.status(200).json({
      success: true,
      Response: slot,
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};

export const deleteDealerServiceSlotController = async (
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const dealerId = (req as { dealerId?: string }).dealerId;
    const { serviceId, slotId } = req.params;

    await dealerDeleteServiceSlot(dealerId!, serviceId, slotId);

    res.status(200).json({
      success: true,
      Response: { ReturnMessage: 'Slot deleted successfully' },
    });
  } catch (error) {
    errorHandler(error as IAppError, res);
  }
};
