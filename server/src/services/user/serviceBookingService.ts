import { ServiceBooking, IServiceBookingDocument } from '../../models/ServiceBooking';
import { Service } from '../../models/Service';
import { IServiceSlotDocument } from '../../models/ServiceSlot';
import { SignUp } from '../../models/SignUp';
import { BusinessRegistration } from '../../models/BusinessRegistration';
import {
  ICreateUserServiceBookingRequest,
  IGetUserServiceBookingsRequest,
  IUserServiceBooking,
} from '../../types/user/serviceBooking';
import { NotFoundError, AppError, ConflictError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { IPaginationResponse } from '../../types/admin';
import { getSectionByServiceType } from '../../data/serviceCategoryConfig';
import {
  notifyTyreServiceRequestCreated,
} from '../tyreService/tyreServiceNotificationService';
import { cancelBooking as releaseSlotBooking } from '../serviceSlotService';
import { createSlotOffersOnCancellation } from '../slotOffer/slotOfferService';

export interface ICreateServiceBookingFromSlotParams {
  userId: string;
  slot: IServiceSlotDocument;
  serviceRequest?: string;
  vehicleId?: string;
  vehicleInfo?: {
    brand?: string;
    model?: string;
    registrationNumber?: string;
  };
  notes?: string;
  requestLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
}

/**
 * Create a ServiceBooking record from a booked slot.
 */
export const createServiceBookingFromSlot = async (
  params: ICreateServiceBookingFromSlotParams,
): Promise<string> => {
  const { userId, slot, serviceRequest, vehicleId, vehicleInfo, notes, requestLocation } = params;

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
    vehicleId,
    vehicleInfo,
    bookingDate: slotDate,
    bookingTime: slot.startTime,
    serviceRequest: serviceRequest?.trim() || service.name,
    status: 'scheduled',
    notes: notes?.trim(),
    requestLocation,
    serviceSubCategory: service.serviceSubCategory,
  });

  await booking.save();

  logger.info(`Service booking created from slot: ${booking._id} slot: ${slot._id}`);

  return (booking._id as any).toString();
};

const bookingToInterface = async (
  doc: IServiceBookingDocument,
  extras?: { serviceName?: string; serviceType?: string; dealerName?: string },
): Promise<IUserServiceBooking> => {
  let serviceName = extras?.serviceName;
  let serviceType = extras?.serviceType;
  let dealerName = extras?.dealerName;

  if (!serviceName || !serviceType) {
    const service = await Service.findById(doc.serviceId).select('name serviceType images').lean();
    serviceName = serviceName || service?.name;
    serviceType = serviceType || service?.serviceType;
  }

  if (!dealerName) {
    const reg = await BusinessRegistration.findById(doc.dealerId).select('businessName').lean();
    dealerName = reg?.businessName;
  }

  return {
    id: (doc._id as any).toString(),
    userId: doc.userId,
    dealerId: doc.dealerId,
    serviceId: doc.serviceId,
    bookingDate: doc.bookingDate.toISOString(),
    bookingTime: doc.bookingTime,
    serviceRequest: doc.serviceRequest,
    status: doc.status,
    notes: doc.notes,
    dealerNotes: doc.dealerNotes,
    rejectionReason: doc.rejectionReason,
    serviceSubCategory: doc.serviceSubCategory,
    vehicleInfo: doc.vehicleInfo,
    requestLocation: doc.requestLocation,
    serviceName,
    serviceType,
    dealerName,
    createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
  };
};

export const createUserServiceBooking = async (
  userId: string,
  data: ICreateUserServiceBookingRequest,
): Promise<IUserServiceBooking> => {
  const service = await Service.findById(data.serviceId);
  if (!service) {
    throw new NotFoundError('Service not found');
  }

  if (service.serviceType !== 'tire_service') {
    throw new AppError('Only tyre services can be requested through this flow', 400);
  }

  if (service.isActive === false) {
    throw new AppError('This service is not available', 400);
  }

  const preferredDate = new Date(data.preferredDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const preferredDay = new Date(preferredDate);
  preferredDay.setHours(0, 0, 0, 0);

  if (preferredDay <= now) {
    throw new AppError('Preferred date must be in the future', 400);
  }

  if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(data.preferredTime)) {
    throw new AppError('Time must be in HH:mm format', 400);
  }

  const startOfDay = new Date(preferredDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(preferredDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await ServiceBooking.findOne({
    userId,
    serviceId: data.serviceId,
    bookingDate: { $gte: startOfDay, $lte: endOfDay },
    bookingTime: data.preferredTime,
    status: { $in: ['new', 'scheduled', 'in_progress', 'awaiting'] },
  });

  if (existing) {
    throw new ConflictError('You already have a pending request for this date and time');
  }

  const section = getSectionByServiceType('tire_service');
  const subLabel = section?.subcategories.find(s => s.id === service.serviceSubCategory)?.label;
  const serviceRequest = subLabel
    ? `${service.name} — ${subLabel}`
    : service.name;

  const booking = new ServiceBooking({
    userId,
    dealerId: service.dealerId,
    serviceId: data.serviceId,
    bookingDate: preferredDate,
    bookingTime: data.preferredTime,
    serviceRequest,
    status: 'new',
    notes: data.notes?.trim(),
    vehicleInfo: data.vehicleInfo,
    requestLocation: data.requestLocation,
    serviceSubCategory: service.serviceSubCategory,
  });

  await booking.save();

  logger.info(`Tyre service booking created: ${booking._id} for service: ${data.serviceId}`);

  try {
    const [customer, dealerReg] = await Promise.all([
      SignUp.findById(userId).select('name').lean(),
      BusinessRegistration.findById(service.dealerId).select('userId').lean(),
    ]);

    if (dealerReg?.userId) {
      await notifyTyreServiceRequestCreated({
        dealerUserId: String(dealerReg.userId),
        bookingId: (booking._id as any).toString(),
        serviceId: data.serviceId,
        customerName: customer?.name,
        serviceName: service.name,
        bookingDate: booking.bookingDate.toISOString(),
        bookingTime: booking.bookingTime,
      });
    }
  } catch (notifyErr) {
    logger.warn('Failed to notify dealer of new tyre service request:', notifyErr);
  }

  return bookingToInterface(booking, {
    serviceName: service.name,
    serviceType: service.serviceType,
  });
};

export const getUserServiceBookings = async (
  userId: string,
  query: IGetUserServiceBookingsRequest,
): Promise<{ bookings: IUserServiceBooking[]; pagination: IPaginationResponse }> => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const filter: any = { userId };

  if (query.status) {
    filter.status = query.status;
  }

  let serviceIds: string[] | undefined;
  if (query.serviceType) {
    const services = await Service.find({ serviceType: query.serviceType }).select('_id').lean();
    serviceIds = services.map(s => (s._id as any).toString());
    filter.serviceId = { $in: serviceIds };
  }

  const [bookings, total] = await Promise.all([
    ServiceBooking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ServiceBooking.countDocuments(filter),
  ]);

  const mapped = await Promise.all(bookings.map(b => bookingToInterface(b)));

  return {
    bookings: mapped,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserServiceBookingById = async (
  userId: string,
  bookingId: string,
): Promise<IUserServiceBooking> => {
  const booking = await ServiceBooking.findById(bookingId);
  if (!booking) {
    throw new NotFoundError('Service booking not found');
  }
  if (booking.userId !== userId) {
    throw new AppError('Unauthorized', 403);
  }
  return bookingToInterface(booking);
};

export const cancelUserServiceBooking = async (
  userId: string,
  bookingId: string,
): Promise<IUserServiceBooking> => {
  const booking = await ServiceBooking.findById(bookingId);
  if (!booking) {
    throw new NotFoundError('Service booking not found');
  }
  if (booking.userId !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  const cancellableStatuses = ['new', 'scheduled'];
  if (!cancellableStatuses.includes(booking.status)) {
    throw new AppError('This booking cannot be cancelled', 400);
  }

  const hadSlot = !!booking.slotId;

  booking.status = 'cancelled';
  await booking.save();

  if (hadSlot && booking.slotId) {
    try {
      await releaseSlotBooking(booking.slotId);
      await createSlotOffersOnCancellation(bookingId);
    } catch (slotErr) {
      logger.warn('Failed to release slot on user cancel:', slotErr);
    }
  }

  return bookingToInterface(booking);
};
