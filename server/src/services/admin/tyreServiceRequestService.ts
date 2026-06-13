import { ServiceBooking, ServiceBookingStatus } from '../../models/ServiceBooking';
import { Service } from '../../models/Service';
import { SignUp } from '../../models/SignUp';
import { BusinessRegistration } from '../../models/BusinessRegistration';
import { NotFoundError, AppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { getSectionByServiceType } from '../../data/serviceCategoryConfig';
import { notifyTyreServiceStatusChange } from '../tyreService/tyreServiceNotificationService';

export interface IAdminTyreServiceRequest {
  id: string;
  userId: string;
  dealerId: string;
  serviceId: string;
  bookingDate: string;
  bookingTime?: string;
  serviceRequest: string;
  status: ServiceBookingStatus;
  notes?: string;
  dealerNotes?: string;
  rejectionReason?: string;
  serviceSubCategory?: string;
  vehicleInfo?: {
    brand?: string;
    model?: string;
    registrationNumber?: string;
  };
  requestLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  dealerName?: string;
  dealerPhone?: string;
  dealerAddress?: string;
  serviceName?: string;
  serviceType?: string;
  serviceImages?: string[];
  homeService?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IGetAdminTyreServiceRequestsQuery {
  page?: number;
  limit?: number;
  status?: ServiceBookingStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface IUpdateAdminTyreServiceStatusRequest {
  status: 'scheduled' | 'cancelled';
  dealerNotes?: string;
  rejectionReason?: string;
}

const VALID_TRANSITIONS: Record<string, ServiceBookingStatus[]> = {
  new: ['scheduled', 'cancelled'],
};

const getTyreServiceIds = async (): Promise<string[]> => {
  const services = await Service.find({ serviceType: 'tire_service' }).select('_id').lean();
  return services.map(s => (s._id as any).toString());
};

const enrichBooking = async (booking: any): Promise<IAdminTyreServiceRequest> => {
  const [customer, service, dealerReg] = await Promise.all([
    SignUp.findById(booking.userId).select('name phone email').lean(),
    Service.findById(booking.serviceId).lean(),
    BusinessRegistration.findById(booking.dealerId).lean(),
  ]);

  const section = getSectionByServiceType('tire_service');
  const subLabel = section?.subcategories.find(s => s.id === booking.serviceSubCategory)?.label;

  return {
    id: booking._id.toString(),
    userId: booking.userId,
    dealerId: booking.dealerId,
    serviceId: booking.serviceId,
    bookingDate: booking.bookingDate?.toISOString?.() || String(booking.bookingDate),
    bookingTime: booking.bookingTime,
    serviceRequest: booking.serviceRequest,
    status: booking.status,
    notes: booking.notes,
    dealerNotes: booking.dealerNotes,
    rejectionReason: booking.rejectionReason,
    serviceSubCategory: subLabel || booking.serviceSubCategory,
    vehicleInfo: booking.vehicleInfo,
    requestLocation: booking.requestLocation,
    customerName: customer?.name,
    customerPhone: customer?.phone,
    customerEmail: customer?.email,
    dealerName: dealerReg?.businessName,
    dealerPhone: dealerReg?.phone,
    dealerAddress: dealerReg?.address,
    serviceName: service?.name,
    serviceType: service?.serviceType,
    serviceImages: service?.images,
    homeService: service?.homeService,
    createdAt: booking.createdAt?.toISOString?.() || String(booking.createdAt),
    updatedAt: booking.updatedAt?.toISOString?.() || String(booking.updatedAt),
  };
};

export const getAdminTyreServiceRequests = async (
  query: IGetAdminTyreServiceRequestsQuery,
): Promise<{
  requests: IAdminTyreServiceRequest[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const tyreServiceIds = await getTyreServiceIds();
  if (tyreServiceIds.length === 0) {
    return {
      requests: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    };
  }

  const filter: any = { serviceId: { $in: tyreServiceIds } };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.startDate || query.endDate) {
    filter.bookingDate = {};
    if (query.startDate) filter.bookingDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.bookingDate.$lte = new Date(query.endDate);
  }

  const [bookings, total] = await Promise.all([
    ServiceBooking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ServiceBooking.countDocuments(filter),
  ]);

  let enriched = await Promise.all(bookings.map(enrichBooking));

  if (query.search) {
    const term = query.search.toLowerCase();
    enriched = enriched.filter(
      r =>
        r.customerName?.toLowerCase().includes(term) ||
        r.serviceName?.toLowerCase().includes(term) ||
        r.dealerName?.toLowerCase().includes(term) ||
        r.serviceRequest?.toLowerCase().includes(term) ||
        r.status?.toLowerCase().includes(term),
    );
  }

  return {
    requests: enriched,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAdminTyreServiceRequestById = async (
  id: string,
): Promise<IAdminTyreServiceRequest> => {
  const booking = await ServiceBooking.findById(id).lean();
  if (!booking) {
    throw new NotFoundError('Tyre service request not found');
  }

  const service = await Service.findById(booking.serviceId).select('serviceType').lean();
  if (service?.serviceType !== 'tire_service') {
    throw new NotFoundError('Tyre service request not found');
  }

  return enrichBooking(booking);
};

export const updateAdminTyreServiceRequestStatus = async (
  id: string,
  data: IUpdateAdminTyreServiceStatusRequest,
): Promise<IAdminTyreServiceRequest> => {
  const booking = await ServiceBooking.findById(id);
  if (!booking) {
    throw new NotFoundError('Tyre service request not found');
  }

  const service = await Service.findById(booking.serviceId).select('name serviceType images').lean();
  if (service?.serviceType !== 'tire_service') {
    throw new NotFoundError('Tyre service request not found');
  }

  const allowed = VALID_TRANSITIONS[booking.status] || [];
  if (!allowed.includes(data.status)) {
    throw new AppError(`Cannot change status from ${booking.status} to ${data.status}`, 400);
  }

  const previousStatus = booking.status;
  booking.status = data.status;

  if (data.dealerNotes !== undefined) {
    booking.dealerNotes = data.dealerNotes;
  }
  if (data.status === 'cancelled') {
    booking.rejectionReason = data.rejectionReason?.trim() || data.dealerNotes?.trim();
  }

  await booking.save();

  logger.info(`Admin updated tyre service request ${id} to ${data.status}`);

  await notifyTyreServiceStatusChange({
    userId: booking.userId,
    bookingId: id,
    serviceId: booking.serviceId,
    newStatus: data.status,
    previousStatus,
    actor: 'admin',
    bookingDate: booking.bookingDate.toISOString(),
    bookingTime: booking.bookingTime,
    dealerNotes: data.dealerNotes,
    rejectionReason: booking.rejectionReason,
    serviceName: service?.name,
    serviceImageUrl: service?.images?.[0],
  });

  return enrichBooking(booking.toObject());
};
