import { Service } from '../../models/Service';
import { ServiceSlot } from '../../models/ServiceSlot';
import { NotFoundError, AppError, ForbiddenError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import {
  createSlot,
  ICreateServiceSlotRequest,
  IServiceSlot,
  slotToInterface,
} from '../serviceSlotService';

export const assertDealerOwnsTyreService = async (
  serviceId: string,
  dealerId: string,
): Promise<void> => {
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new NotFoundError('Service not found');
  }
  if (service.dealerId !== dealerId) {
    throw new ForbiddenError('You do not own this service');
  }
  if (service.serviceType !== 'tire_service') {
    throw new AppError('Slot management is only available for tyre services', 400);
  }
};

export const dealerCreateServiceSlot = async (
  dealerId: string,
  serviceId: string,
  data: Omit<ICreateServiceSlotRequest, 'serviceId'>,
): Promise<IServiceSlot> => {
  await assertDealerOwnsTyreService(serviceId, dealerId);

  const slot = await createSlot({
    ...data,
    serviceId,
    maxBookings: data.maxBookings ?? 3,
  });

  await Service.findByIdAndUpdate(serviceId, {
    slotBookingEnabled: true,
  });

  return slot;
};

export interface IDealerListSlotsQuery {
  from?: string;
  to?: string;
}

export const dealerListServiceSlots = async (
  dealerId: string,
  serviceId: string,
  query: IDealerListSlotsQuery,
): Promise<IServiceSlot[]> => {
  await assertDealerOwnsTyreService(serviceId, dealerId);

  const filter: Record<string, unknown> = { serviceId };

  if (query.from || query.to) {
    const fromDate = query.from ? new Date(query.from) : new Date();
    fromDate.setHours(0, 0, 0, 0);
    const toDate = query.to ? new Date(query.to) : new Date(fromDate);
    toDate.setHours(23, 59, 59, 999);
    if (!query.to) {
      toDate.setDate(toDate.getDate() + 30);
    }
    filter.date = { $gte: fromDate, $lte: toDate };
  }

  const slots = await ServiceSlot.find(filter).sort({ date: 1, startTime: 1 });
  return slots.map(doc => slotToInterface(doc));
};

export const dealerUpdateServiceSlot = async (
  dealerId: string,
  serviceId: string,
  slotId: string,
  maxBookings: number,
): Promise<IServiceSlot> => {
  await assertDealerOwnsTyreService(serviceId, dealerId);

  if (!maxBookings || maxBookings < 1) {
    throw new AppError('maxBookings must be at least 1', 400);
  }

  const slot = await ServiceSlot.findOne({ _id: slotId, serviceId });
  if (!slot) {
    throw new NotFoundError('Slot not found');
  }

  if (maxBookings < slot.currentBookings) {
    throw new AppError(
      `Cannot set capacity below current bookings (${slot.currentBookings})`,
      400,
    );
  }

  slot.maxBookings = maxBookings;
  slot.isAvailable = slot.currentBookings < maxBookings;
  await slot.save();

  logger.info(`Dealer updated slot ${slotId} maxBookings to ${maxBookings}`);
  return slotToInterface(slot);
};

export const dealerDeleteServiceSlot = async (
  dealerId: string,
  serviceId: string,
  slotId: string,
): Promise<void> => {
  await assertDealerOwnsTyreService(serviceId, dealerId);

  const slot = await ServiceSlot.findOne({ _id: slotId, serviceId });
  if (!slot) {
    throw new NotFoundError('Slot not found');
  }

  if (slot.currentBookings > 0) {
    throw new AppError('Cannot delete a slot with active bookings', 400);
  }

  await ServiceSlot.deleteOne({ _id: slotId });
  logger.info(`Dealer deleted slot ${slotId}`);
};
