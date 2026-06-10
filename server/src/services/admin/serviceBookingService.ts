import { ServiceBooking } from '../../models/ServiceBooking';
import { SignUp } from '../../models/SignUp';
import { Service } from '../../models/Service';
import { logger } from '../../utils/logger';

export interface IAdminServiceBooking {
  id: string;
  userId: string;
  dealerId: string;
  serviceId: string;
  bookingDate: string;
  bookingTime?: string;
  serviceRequest: string;
  status: string;
  priority: string;
  notes?: string;
  dealerNotes?: string;
  rejectionReason?: string;
  assignedMechanic?: string;
  customerName?: string;
  customerPhone?: string;
  dealerName?: string;
  serviceName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IGetAdminServiceBookingsRequest {
  page?: number;
  limit?: number;
  status?: string;
  dealerId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export const getAdminServiceBookings = async (
  query: IGetAdminServiceBookingsRequest,
): Promise<{
  bookings: IAdminServiceBooking[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  try {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }
    if (query.dealerId) {
      filter.dealerId = query.dealerId;
    }
    if (query.fromDate || query.toDate) {
      filter.bookingDate = {};
      if (query.fromDate) filter.bookingDate.$gte = new Date(query.fromDate);
      if (query.toDate) filter.bookingDate.$lte = new Date(query.toDate);
    }

    const total = await ServiceBooking.countDocuments(filter);
    const bookings = await ServiceBooking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Batch-fetch related data
    const userIds = [...new Set(bookings.map((b) => b.userId))];
    const dealerIds = [...new Set(bookings.map((b) => b.dealerId))];
    const serviceIds = [...new Set(bookings.map((b) => b.serviceId))];

    const [users, dealers, services] = await Promise.all([
      SignUp.find({ _id: { $in: userIds } }).select('_id name phone').lean(),
      SignUp.find({ _id: { $in: dealerIds } }).select('_id name').lean(),
      Service.find({ _id: { $in: serviceIds } }).select('_id name').lean(),
    ]);

    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));
    const dealerMap = new Map(dealers.map((d: any) => [d._id.toString(), d]));
    const serviceMap = new Map(services.map((s: any) => [s._id.toString(), s]));

    const mappedBookings: IAdminServiceBooking[] = bookings
      .map((b: any) => {
        const user = userMap.get(b.userId);
        const dealer = dealerMap.get(b.dealerId);
        const service = serviceMap.get(b.serviceId);

        // Apply search filter on resolved names
        if (query.search) {
          const term = query.search.toLowerCase();
          const match =
            (user as any)?.name?.toLowerCase().includes(term) ||
            (service as any)?.name?.toLowerCase().includes(term) ||
            b.status?.toLowerCase().includes(term) ||
            b.serviceRequest?.toLowerCase().includes(term);
          if (!match) return null;
        }

        return {
          id: b._id.toString(),
          userId: b.userId,
          dealerId: b.dealerId,
          serviceId: b.serviceId,
          bookingDate: b.bookingDate?.toISOString?.() || String(b.bookingDate),
          bookingTime: b.bookingTime,
          serviceRequest: b.serviceRequest,
          status: b.status,
          priority: b.priority || 'medium',
          notes: b.notes,
          dealerNotes: b.dealerNotes,
          rejectionReason: b.rejectionReason,
          assignedMechanic: b.assignedMechanic,
          customerName: (user as any)?.name,
          customerPhone: (user as any)?.phone,
          dealerName: (dealer as any)?.name,
          serviceName: (service as any)?.name,
          createdAt: b.createdAt?.toISOString?.() || String(b.createdAt),
          updatedAt: b.updatedAt?.toISOString?.() || String(b.updatedAt),
        } as IAdminServiceBooking;
      })
      .filter(Boolean) as IAdminServiceBooking[];

    return {
      bookings: mappedBookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting admin service bookings:', error);
    throw error;
  }
};
