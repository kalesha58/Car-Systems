import { PreBooking, IPreBookingDocument } from '../../models/PreBooking';
import { DealerVehicle } from '../../models/DealerVehicle';
import {
  IPreBooking,
  IUpdatePreBookingStatusRequest,
  IGetPreBookingsRequest,
} from '../../types/preBooking/IPreBooking';
import { NotFoundError, AppError, ForbiddenError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { IPaginationResponse } from '../../types/admin';

/**
 * Convert pre-booking document to interface
 */
const preBookingToInterface = (doc: IPreBookingDocument): IPreBooking => {
  return {
    id: (doc._id as any).toString(),
    userId: doc.userId,
    vehicleId: doc.vehicleId,
    dealerId: doc.dealerId,
    bookingDate: doc.bookingDate.toISOString(),
    status: doc.status,
    notes: doc.notes,
    dealerNotes: doc.dealerNotes,
    createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Get dealer's pre-bookings
 */
export const getDealerPreBookings = async (
  dealerId: string,
  query: IGetPreBookingsRequest,
): Promise<{ preBookings: IPreBooking[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { dealerId };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.vehicleId) {
      // Verify vehicle belongs to dealer
      const vehicle = await DealerVehicle.findById(query.vehicleId);
      if (!vehicle || vehicle.dealerId !== dealerId) {
        throw new ForbiddenError('Vehicle does not belong to this dealer');
      }
      filter.vehicleId = query.vehicleId;
    }

    if (query.startDate || query.endDate) {
      filter.bookingDate = {};
      if (query.startDate) {
        filter.bookingDate.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.bookingDate.$lte = new Date(query.endDate);
      }
    }

    const [preBookings, total] = await Promise.all([
      PreBooking.find(filter).sort({ bookingDate: -1 }).skip(skip).limit(limit),
      PreBooking.countDocuments(filter),
    ]);

    return {
      preBookings: preBookings.map(preBookingToInterface),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting dealer pre-bookings:', error);
    throw error;
  }
};

/**
 * Get pre-booking by ID (dealer)
 */
export const getDealerPreBookingById = async (
  dealerId: string,
  preBookingId: string,
): Promise<IPreBooking> => {
  try {
    const preBooking = await PreBooking.findById(preBookingId);

    if (!preBooking) {
      throw new NotFoundError('Pre-booking not found');
    }

    // Ensure dealer can only access pre-bookings for their vehicles
    if (preBooking.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized access to pre-booking');
    }

    return preBookingToInterface(preBooking);
  } catch (error) {
    logger.error('Error getting pre-booking by ID:', error);
    throw error;
  }
};

/**
 * Update pre-booking status (dealer)
 */
export const updatePreBookingStatus = async (
  dealerId: string,
  preBookingId: string,
  data: IUpdatePreBookingStatusRequest,
): Promise<IPreBooking> => {
  try {
    const preBooking = await PreBooking.findById(preBookingId);

    if (!preBooking) {
      throw new NotFoundError('Pre-booking not found');
    }

    // Ensure dealer can only manage pre-bookings for their vehicles
    if (preBooking.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized access to pre-booking');
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['cancelled'],
      cancelled: [],
    };

    const allowedStatuses = validTransitions[preBooking.status] || [];
    if (!allowedStatuses.includes(data.status)) {
      throw new AppError(
        `Cannot change status from ${preBooking.status} to ${data.status}`,
        400,
      );
    }

    // If confirming pre-booking, mark vehicle as reserved
    if (data.status === 'confirmed' && preBooking.status === 'pending') {
      const vehicle = await DealerVehicle.findById(preBooking.vehicleId);
      if (vehicle) {
        vehicle.availability = 'reserved';
        await vehicle.save();
      }
    }

    // If cancelling a confirmed pre-booking, mark vehicle as available
    if (data.status === 'cancelled' && preBooking.status === 'confirmed') {
      const vehicle = await DealerVehicle.findById(preBooking.vehicleId);
      if (vehicle) {
        vehicle.availability = 'available';
        await vehicle.save();
      }
    }

    preBooking.status = data.status;
    if (data.dealerNotes) {
      preBooking.dealerNotes = data.dealerNotes;
    }
    await preBooking.save();

    logger.info(`Pre-booking status updated: ${preBookingId} to ${data.status} by dealer: ${dealerId}`);

    return preBookingToInterface(preBooking);
  } catch (error) {
    logger.error('Error updating pre-booking status:', error);
    throw error;
  }
};












