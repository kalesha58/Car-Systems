import { CustomerEnquiry, ICustomerEnquiryDocument } from '../../models/CustomerEnquiry';
import {
  ICustomerEnquiry,
  IGetDealerEnquiriesRequest,
  IUpdateEnquiryStatusRequest,
  IDealerEnquiriesResponse,
} from '../../types/dealer/customerEnquiry';
import { NotFoundError, AppError, ForbiddenError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { SignUp } from '../../models/SignUp';
import { DealerVehicle } from '../../models/DealerVehicle';

/**
 * Convert enquiry document to interface
 */
const enquiryToInterface = async (doc: ICustomerEnquiryDocument): Promise<ICustomerEnquiry> => {
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
    logger.warn(`Failed to fetch customer info for enquiry ${doc._id}:`, error);
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
      logger.warn(`Failed to fetch vehicle info for enquiry ${doc._id}:`, error);
    }
  }

  return {
    id: (doc._id as any).toString(),
    userId: doc.userId,
    dealerId: doc.dealerId,
    vehicleId: doc.vehicleId,
    message: doc.message,
    status: doc.status,
    createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
    customerName,
    customerPhone,
    vehicleName,
  };
};

/**
 * Get dealer's customer enquiries
 */
export const getDealerEnquiries = async (
  dealerId: string,
  query: IGetDealerEnquiriesRequest,
): Promise<IDealerEnquiriesResponse> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { dealerId };

    if (query.status) {
      filter.status = query.status;
    }

    const total = await CustomerEnquiry.countDocuments(filter);
    const enquiries = await CustomerEnquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const enquiriesWithDetails = await Promise.all(
      enquiries.map((enquiry) => enquiryToInterface(enquiry)),
    );

    return {
      enquiries: enquiriesWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting dealer enquiries:', error);
    throw error;
  }
};

/**
 * Update enquiry status
 */
export const updateEnquiryStatus = async (
  enquiryId: string,
  dealerId: string,
  data: IUpdateEnquiryStatusRequest,
): Promise<ICustomerEnquiry> => {
  try {
    const enquiry = await CustomerEnquiry.findById(enquiryId);

    if (!enquiry) {
      throw new NotFoundError('Customer enquiry not found');
    }

    // Verify dealer owns this enquiry
    if (enquiry.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized to update this enquiry');
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      new: ['responded', 'resolved'],
      responded: ['resolved'],
      resolved: [],
    };

    const allowedStatuses = validTransitions[enquiry.status] || [];
    if (!allowedStatuses.includes(data.status)) {
      throw new AppError(
        `Cannot change status from ${enquiry.status} to ${data.status}`,
        400,
      );
    }

    enquiry.status = data.status;
    await enquiry.save();

    logger.info(`Enquiry status updated: ${enquiryId} to ${data.status} by dealer: ${dealerId}`);

    return await enquiryToInterface(enquiry);
  } catch (error) {
    logger.error('Error updating enquiry status:', error);
    throw error;
  }
};
