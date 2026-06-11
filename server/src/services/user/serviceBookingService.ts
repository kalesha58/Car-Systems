import { ServiceBooking } from '../../models/ServiceBooking';
import { Service } from '../../models/Service';
import { IServiceSlotDocument } from '../../models/ServiceSlot';
import { NotFoundError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export interface ICreateServiceBookingFromSlotParams {
  userId: string;
  slot: IServiceSlotDocument;
  serviceRequest?: string;
}

/**
 * Create a ServiceBooking record from a booked slot.
 */
export const createServiceBookingFromSlot = async (
  params: ICreateServiceBookingFromSlotParams,
): Promise<string> => {
  const { userId, slot, serviceRequest } = params;

  const service = await Service.findById(slot.serviceId);
  if (!service) {
    throw new NotFoundError('Service not found');
  }

  const slotDate = new Date(slot.date);
  slotDate.setHours(0, 0, 0, 0);

  const booking = new ServiceBooking({
    userId,
    dealerId: service.dealerId,
    serviceId: slot.serviceId,
    slotId: (slot._id as any).toString(),
    bookingDate: slotDate,
    bookingTime: slot.startTime,
    serviceRequest: serviceRequest?.trim() || service.name,
    status: 'scheduled',
  });

  await booking.save();

  logger.info(`Service booking created from slot: ${booking._id} slot: ${slot._id}`);

  return (booking._id as any).toString();
};
