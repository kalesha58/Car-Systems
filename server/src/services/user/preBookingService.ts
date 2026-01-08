import { PreBooking, IPreBookingDocument } from '../../models/PreBooking';
import { DealerVehicle } from '../../models/DealerVehicle';
import {
  IPreBooking,
  ICreatePreBookingRequest,
  IGetPreBookingsRequest,
} from '../../types/preBooking/IPreBooking';
import { NotFoundError, AppError, ConflictError } from '../../utils/errorHandler';
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
 * Create a new pre-booking request
 */
export const createPreBooking = async (
  userId: string,
  data: ICreatePreBookingRequest,
): Promise<IPreBooking> => {
  try {
    // Validate vehicle exists and is available
    const vehicle = await DealerVehicle.findById(data.vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    // Check if vehicle is available
    if (vehicle.availability !== 'available') {
      throw new AppError('Vehicle is not available for pre-booking', 400);
    }

    // Validate date is in future
    const bookingDate = new Date(data.bookingDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const selectedDate = new Date(bookingDate);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate <= now) {
      throw new AppError('Booking date must be in the future', 400);
    }

    // Check for overlapping pre-bookings (same vehicle, same date)
    // Only check for pending or confirmed bookings
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingPreBooking = await PreBooking.findOne({
      vehicleId: data.vehicleId,
      bookingDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $in: ['pending', 'confirmed'] },
    });

    if (existingPreBooking) {
      throw new ConflictError('A pre-booking already exists for this vehicle on this date');
    }

    // Create pre-booking
    const preBooking = new PreBooking({
      userId,
      vehicleId: data.vehicleId,
      dealerId: vehicle.dealerId,
      bookingDate: selectedDate,
      status: 'pending',
      notes: data.notes,
    });

    await preBooking.save();

    logger.info(`Pre-booking created: ${preBooking._id} for vehicle: ${data.vehicleId}`);

    return preBookingToInterface(preBooking);
  } catch (error) {
    logger.error('Error creating pre-booking:', error);
    throw error;
  }
};

/**
 * Get user's pre-bookings
 */
export const getUserPreBookings = async (
  userId: string,
  query: IGetPreBookingsRequest,
): Promise<{ preBookings: IPreBooking[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { userId };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.vehicleId) {
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
    logger.error('Error getting user pre-bookings:', error);
    throw error;
  }
};

/**
 * Get pre-booking by ID
 */
export const getUserPreBookingById = async (
  userId: string,
  preBookingId: string,
): Promise<IPreBooking> => {
  try {
    const preBooking = await PreBooking.findById(preBookingId);

    if (!preBooking) {
      throw new NotFoundError('Pre-booking not found');
    }

    // Ensure user can only access their own pre-bookings
    if (preBooking.userId !== userId) {
      throw new AppError('Unauthorized access to pre-booking', 403);
    }

    return preBookingToInterface(preBooking);
  } catch (error) {
    logger.error('Error getting pre-booking by ID:', error);
    throw error;
  }
};

/**
 * Cancel pre-booking (user)
 */
export const cancelUserPreBooking = async (
  userId: string,
  preBookingId: string,
): Promise<IPreBooking> => {
  try {
    const preBooking = await PreBooking.findById(preBookingId);

    if (!preBooking) {
      throw new NotFoundError('Pre-booking not found');
    }

    // Ensure user can only cancel their own pre-bookings
    if (preBooking.userId !== userId) {
      throw new AppError('Unauthorized access to pre-booking', 403);
    }

    // Can only cancel if status is pending
    if (preBooking.status !== 'pending') {
      throw new AppError(`Cannot cancel pre-booking with status: ${preBooking.status}`, 400);
    }

    preBooking.status = 'cancelled';
    await preBooking.save();

    logger.info(`Pre-booking cancelled: ${preBookingId} by user: ${userId}`);

    return preBookingToInterface(preBooking);
  } catch (error) {
    logger.error('Error cancelling pre-booking:', error);
    throw error;
  }
};

