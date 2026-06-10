import { ServiceBooking, IServiceBookingDocument } from '../../models/ServiceBooking';
import {
  IServiceBooking,
  IGetDealerServiceBookingsRequest,
  IUpdateServiceBookingStatusRequest,
  IDealerServiceBookingsResponse,
} from '../../types/dealer/serviceBooking';
import { NotFoundError, AppError, ForbiddenError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { SignUp } from '../../models/SignUp';
import { Service } from '../../models/Service';
import { DealerVehicle } from '../../models/DealerVehicle';
import { sendPushNotification, createNotification } from '../notificationService';

/**
 * Convert service booking document to interface
 */
const serviceBookingToInterface = async (doc: IServiceBookingDocument): Promise<IServiceBooking> => {
  // Fetch customer info
  let customerName: string | undefined;
  let customerPhone: string | undefined;
  try {
    const customer = await SignUp.findById(doc.userId).select('name phone').lean();
    if (customer) {
      customerName = customer.name;
      customerPhone = customer.phone;
    }
  } catch (error) {
    logger.warn(`Failed to fetch customer info for service booking ${doc._id}:`, error);
  }

  // Fetch service info
  let serviceName: string | undefined;
  try {
    const service = await Service.findById(doc.serviceId).select('name').lean();
    if (service) {
      serviceName = service.name;
    }
  } catch (error) {
    logger.warn(`Failed to fetch service info for service booking ${doc._id}:`, error);
  }

  // Fetch vehicle info if vehicleId exists
  let vehicleName: string | undefined;
  if (doc.vehicleId) {
    try {
      const vehicle = await DealerVehicle.findById(doc.vehicleId).select('brand vehicleModel').lean();
      if (vehicle) {
        vehicleName = `${vehicle.brand} ${vehicle.vehicleModel}`.trim();
      }
    } catch (error) {
      logger.warn(`Failed to fetch vehicle info for service booking ${doc._id}:`, error);
    }
  } else if (doc.vehicleInfo) {
    // Use vehicleInfo if available
    const parts = [];
    if (doc.vehicleInfo.brand) parts.push(doc.vehicleInfo.brand);
    if (doc.vehicleInfo.model) parts.push(doc.vehicleInfo.model);
    if (doc.vehicleInfo.registrationNumber) parts.push(`(${doc.vehicleInfo.registrationNumber})`);
    vehicleName = parts.length > 0 ? parts.join(' ') : undefined;
  }

  return {
    id: (doc._id as any).toString(),
    userId: doc.userId,
    dealerId: doc.dealerId,
    serviceId: doc.serviceId,
    vehicleId: doc.vehicleId,
    vehicleInfo: doc.vehicleInfo,
    bookingDate: doc.bookingDate.toISOString(),
    bookingTime: doc.bookingTime,
    serviceRequest: doc.serviceRequest,
    status: doc.status,
    assignedMechanic: doc.assignedMechanic,
    priority: doc.priority,
    notes: doc.notes,
    dealerNotes: doc.dealerNotes,
    rejectionReason: doc.rejectionReason,
    createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
    customerName,
    customerPhone,
    serviceName,
    vehicleName,
  };
};

/**
 * Get dealer's service bookings
 */
export const getDealerServiceBookings = async (
  dealerId: string,
  query: IGetDealerServiceBookingsRequest,
): Promise<IDealerServiceBookingsResponse> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { dealerId };

    if (query.status) {
      filter.status = query.status;
    }

    // Filter by date if provided
    if (query.date) {
      const date = new Date(query.date);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      filter.bookingDate = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    const total = await ServiceBooking.countDocuments(filter);
    const bookings = await ServiceBooking.find(filter)
      .sort({ bookingDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const bookingsWithDetails = await Promise.all(
      bookings.map((booking) => serviceBookingToInterface(booking)),
    );

    return {
      bookings: bookingsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting dealer service bookings:', error);
    throw error;
  }
};

/**
 * Update service booking status
 */
export const updateServiceBookingStatus = async (
  bookingId: string,
  dealerId: string,
  data: IUpdateServiceBookingStatusRequest,
): Promise<IServiceBooking> => {
  try {
    const booking = await ServiceBooking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Service booking not found');
    }

    // Verify dealer owns this booking
    if (booking.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized to update this booking');
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      new: ['scheduled', 'cancelled'],
      scheduled: ['in_progress', 'cancelled'],
      in_progress: ['awaiting', 'completed', 'cancelled'],
      awaiting: ['in_progress', 'completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    const allowedStatuses = validTransitions[booking.status] || [];
    if (data.status && !allowedStatuses.includes(data.status)) {
      throw new AppError(
        `Cannot change status from ${booking.status} to ${data.status}`,
        400,
      );
    }

    const prevStatus = booking.status;

    if (data.status) {
      booking.status = data.status;
    }
    if (data.dealerNotes !== undefined) {
      booking.dealerNotes = data.dealerNotes;
    }
    if (data.assignedMechanic !== undefined) {
      booking.assignedMechanic = data.assignedMechanic;
    }
    if (data.priority !== undefined) {
      booking.priority = data.priority;
    }
    if (data.status === 'cancelled' && data.rejectionReason !== undefined) {
      booking.rejectionReason = data.rejectionReason;
    }

    await booking.save();

    logger.info(`Service booking status updated: ${bookingId} to ${data.status || booking.status} by dealer: ${dealerId}`);

    // Trigger push and in-app notifications on status transition from 'new' to 'scheduled' or 'cancelled'
    if (prevStatus === 'new') {
      if (data.status === 'scheduled') {
        // Accept
        try {
          const service = await Service.findById(booking.serviceId).select('name').lean();
          const title = 'Service Booking Accepted';
          const body = `Your service booking for "${service?.name || 'Service'}" has been accepted and scheduled.`;

          // Send push notification
          await sendPushNotification(booking.userId, {
            title,
            body,
            data: {
              type: 'general',
              serviceId: booking.serviceId,
              status: 'scheduled',
            },
          });

          // Create in-app notification
          await createNotification({
            userId: booking.userId,
            type: 'service_update',
            title,
            body,
            data: {
              serviceId: booking.serviceId,
              status: 'scheduled',
            },
            relatedId: (booking._id as any).toString(),
          });
        } catch (notifErr) {
          logger.error('Error sending acceptance notification:', notifErr);
        }
      } else if (data.status === 'cancelled') {
        // Reject
        try {
          const service = await Service.findById(booking.serviceId).select('name').lean();
          const reasonStr = data.rejectionReason ? ` Reason: ${data.rejectionReason}` : '';
          const title = 'Service Booking Rejected';
          const body = `Your service booking for "${service?.name || 'Service'}" has been rejected.${reasonStr}`;

          // Send push notification
          await sendPushNotification(booking.userId, {
            title,
            body,
            data: {
              type: 'general',
              serviceId: booking.serviceId,
              status: 'cancelled',
            },
          });

          // Create in-app notification
          await createNotification({
            userId: booking.userId,
            type: 'service_update',
            title,
            body,
            data: {
              serviceId: booking.serviceId,
              status: 'cancelled',
              rejectionReason: data.rejectionReason,
            },
            relatedId: (booking._id as any).toString(),
          });
        } catch (notifErr) {
          logger.error('Error sending rejection notification:', notifErr);
        }
      }
    }

    return await serviceBookingToInterface(booking);
  } catch (error) {
    logger.error('Error updating service booking status:', error);
    throw error;
  }
};
