import { ServiceSlot, IServiceSlotDocument } from '../models/ServiceSlot';
import { Service } from '../models/Service';
import { NotFoundError, AppError, ConflictError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export interface IServiceSlot {
  id: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceType: 'center' | 'home';
  maxBookings: number;
  currentBookings: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateServiceSlotRequest {
  serviceId: string;
  date: string; // ISO date string
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  serviceType: 'center' | 'home';
  maxBookings?: number;
}

export interface IGetAvailableSlotsRequest {
  serviceId: string;
  date: string; // ISO date string
  serviceType?: 'center' | 'home';
}

/**
 * Convert service slot document to interface
 */
const slotToInterface = (doc: IServiceSlotDocument): IServiceSlot => {
  return {
    id: (doc._id as any).toString(),
    serviceId: doc.serviceId,
    date: doc.date.toISOString().split('T')[0], // YYYY-MM-DD
    startTime: doc.startTime,
    endTime: doc.endTime,
    serviceType: doc.serviceType,
    maxBookings: doc.maxBookings,
    currentBookings: doc.currentBookings,
    isAvailable: doc.isAvailable,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
};

/**
 * Create a new service slot
 */
export const createSlot = async (
  data: ICreateServiceSlotRequest,
): Promise<IServiceSlot> => {
  try {
    // Validate service exists
    const service = await Service.findById(data.serviceId);
    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Validate date is in the future
    const slotDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    slotDate.setHours(0, 0, 0, 0);

    if (slotDate < today) {
      throw new AppError('Cannot create slots for past dates', 400);
    }

    // Validate time range
    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const [endHour, endMin] = data.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      throw new AppError('End time must be after start time', 400);
    }

    // Check if slot already exists
    const existingSlot = await ServiceSlot.findOne({
      serviceId: data.serviceId,
      date: slotDate,
      startTime: data.startTime,
      serviceType: data.serviceType,
    });

    if (existingSlot) {
      throw new ConflictError('Slot already exists for this service, date, time, and type');
    }

    const slot = new ServiceSlot({
      serviceId: data.serviceId,
      date: slotDate,
      startTime: data.startTime,
      endTime: data.endTime,
      serviceType: data.serviceType,
      maxBookings: data.maxBookings || 1,
      currentBookings: 0,
      isAvailable: true,
    });

    await slot.save();

    logger.info(`Service slot created: ${slot._id} for service: ${data.serviceId}`);

    return slotToInterface(slot);
  } catch (error) {
    logger.error('Error creating service slot:', error);
    throw error;
  }
};

/**
 * Get available slots for a service and date
 */
export const getAvailableSlots = async (
  query: IGetAvailableSlotsRequest,
): Promise<IServiceSlot[]> => {
  try {
    // Validate service exists
    const service = await Service.findById(query.serviceId);
    if (!service) {
      throw new NotFoundError('Service not found');
    }

    const slotDate = new Date(query.date);
    slotDate.setHours(0, 0, 0, 0);

    const filter: any = {
      serviceId: query.serviceId,
      date: {
        $gte: slotDate,
        $lt: new Date(slotDate.getTime() + 24 * 60 * 60 * 1000), // Next day
      },
      isAvailable: true,
    };

    if (query.serviceType) {
      filter.serviceType = query.serviceType;
    }

    const slots = await ServiceSlot.find(filter).sort({ startTime: 1 });

    // Filter slots that have availability
    const availableSlots = slots.filter(
      slot => slot.currentBookings < slot.maxBookings,
    );

    return availableSlots.map(slotToInterface);
  } catch (error) {
    logger.error('Error getting available slots:', error);
    throw error;
  }
};

/**
 * Book a slot (increment currentBookings)
 */
export const bookSlot = async (slotId: string): Promise<IServiceSlot> => {
  try {
    const slot = await ServiceSlot.findById(slotId);

    if (!slot) {
      throw new NotFoundError('Slot not found');
    }

    // Check availability
    if (!slot.isAvailable || slot.currentBookings >= slot.maxBookings) {
      throw new AppError('Slot is not available for booking', 400);
    }

    slot.currentBookings += 1;

    // Update availability if fully booked
    if (slot.currentBookings >= slot.maxBookings) {
      slot.isAvailable = false;
    }

    await slot.save();

    logger.info(`Slot booked: ${slotId}, currentBookings: ${slot.currentBookings}`);

    return slotToInterface(slot);
  } catch (error) {
    logger.error('Error booking slot:', error);
    throw error;
  }
};

/**
 * Cancel booking (decrement currentBookings)
 */
export const cancelBooking = async (slotId: string): Promise<IServiceSlot> => {
  try {
    const slot = await ServiceSlot.findById(slotId);

    if (!slot) {
      throw new NotFoundError('Slot not found');
    }

    if (slot.currentBookings <= 0) {
      throw new AppError('No bookings to cancel', 400);
    }

    slot.currentBookings -= 1;

    // Update availability if now has space
    if (slot.currentBookings < slot.maxBookings) {
      slot.isAvailable = true;
    }

    await slot.save();

    logger.info(`Booking cancelled for slot: ${slotId}, currentBookings: ${slot.currentBookings}`);

    return slotToInterface(slot);
  } catch (error) {
    logger.error('Error cancelling booking:', error);
    throw error;
  }
};

/**
 * Check if slot is available
 */
export const checkAvailability = async (slotId: string): Promise<boolean> => {
  try {
    const slot = await ServiceSlot.findById(slotId);

    if (!slot) {
      return false;
    }

    return slot.isAvailable && slot.currentBookings < slot.maxBookings;
  } catch (error) {
    logger.error('Error checking slot availability:', error);
    return false;
  }
};

/**
 * Prevent double booking - check if user already has a booking for this slot
 * Note: This would require a Booking model to track user bookings
 * For now, we'll rely on the slot's currentBookings counter
 */
export const preventDoubleBooking = async (
  slotId: string,
  userId: string,
): Promise<boolean> => {
  try {
    // This would need a Booking model to check user-specific bookings
    // For now, we'll just check slot availability
    const isAvailable = await checkAvailability(slotId);
    return isAvailable;
  } catch (error) {
    logger.error('Error checking double booking:', error);
    return false;
  }
};
