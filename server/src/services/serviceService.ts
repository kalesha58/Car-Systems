import { Service, IServiceDocument } from '../models/Service';
import {
  IGetServicesRequest,
  ICreateServiceRequest,
  IUpdateServiceRequest,
  IService,
} from '../types/service';
import { IPaginationResponse } from '../types/admin';
import { NotFoundError, ConflictError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { BusinessRegistration } from '../models/BusinessRegistration';
import { IDealerInfo } from '../types/user/vehicle';
import mongoose from 'mongoose';

/**
 * Convert service document to IService interface
 */
const serviceToIService = (serviceDoc: IServiceDocument): IService => {
  return {
    id: (serviceDoc._id as any).toString(),
    dealerId: serviceDoc.dealerId,
    name: serviceDoc.name,
    price: serviceDoc.price,
    durationMinutes: serviceDoc.durationMinutes,
    homeService: serviceDoc.homeService,
    description: serviceDoc.description,
    category: serviceDoc.category,
    images: serviceDoc.images,
    location: serviceDoc.location,
    isActive: serviceDoc.isActive !== undefined ? serviceDoc.isActive : true,
    serviceType: serviceDoc.serviceType,
    slotDurationMinutes: serviceDoc.slotDurationMinutes,
    slotBookingEnabled: serviceDoc.slotBookingEnabled !== undefined ? serviceDoc.slotBookingEnabled : false,
    createdAt: serviceDoc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: serviceDoc.updatedAt?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Get all services with pagination and filters
 */
export const getServices = async (
  query: IGetServicesRequest,
): Promise<{ services: IService[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.dealerId) {
      filter.dealerId = query.dealerId;
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.homeService !== undefined) {
      filter.homeService = query.homeService;
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [services, total] = await Promise.all([
      Service.find(filter).sort(sort).skip(skip).limit(limit),
      Service.countDocuments(filter),
    ]);

    // Get unique dealerIds from services (dealerId is BusinessRegistration._id)
    const dealerIds = [...new Set(services.map((s: any) => s.dealerId).filter(Boolean))];
    
    // Convert dealerIds to ObjectIds for MongoDB query
    const dealerObjectIds = dealerIds
      .filter(id => id && mongoose.Types.ObjectId.isValid(String(id)))
      .map(id => new mongoose.Types.ObjectId(String(id)));

    // Get all business registrations for these dealers
    const businessRegistrations = dealerObjectIds.length > 0
      ? await BusinessRegistration.find({ _id: { $in: dealerObjectIds } })
      : [];

    // Create a map of BusinessRegistration._id (as string) to dealer info
    const dealerInfoMap = new Map<string, IDealerInfo>();
    businessRegistrations.forEach((reg) => {
      const regIdString = (reg._id as any).toString();
      dealerInfoMap.set(regIdString, {
        id: regIdString,
        businessName: reg.businessName,
        type: reg.type,
        phone: reg.phone,
        address: reg.address,
        gst: reg.gst,
      });
    });

    // Convert services and attach dealer info
    const servicesWithDealer = services.map((serviceDoc) => {
      const serviceDealerId = String(serviceDoc.dealerId || '').trim();
      const dealerInfo = serviceDealerId ? dealerInfoMap.get(serviceDealerId) : undefined;
      const service: any = serviceToIService(serviceDoc);
      if (dealerInfo) {
        service.dealer = dealerInfo;
      }
      return service;
    });

    return {
      services: servicesWithDealer,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting services:', error);
    throw error;
  }
};

/**
 * Get service by ID
 */
export const getServiceById = async (serviceId: string): Promise<IService> => {
  try {
    const service = await Service.findById(serviceId);

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    const serviceData: any = serviceToIService(service);

    // Fetch dealer info for the service
    if (service.dealerId && mongoose.Types.ObjectId.isValid(String(service.dealerId))) {
      try {
        const businessReg = await BusinessRegistration.findById(service.dealerId);
        if (businessReg) {
          serviceData.dealer = {
            id: (businessReg._id as any).toString(),
            businessName: businessReg.businessName,
            type: businessReg.type,
            phone: businessReg.phone,
            address: businessReg.address,
            gst: businessReg.gst,
          };
        }
      } catch (err) {
        // Ignore errors
      }
    }

    return serviceData;
  } catch (error) {
    throw error;
  }
};

/**
 * Get services by dealer ID
 */
export const getServicesByDealerId = async (
  dealerId: string,
  query?: { page?: number; limit?: number },
): Promise<{ services: IService[]; pagination: IPaginationResponse }> => {
  try {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      Service.find({ dealerId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Service.countDocuments({ dealerId }),
    ]);

    // Fetch dealer info for this dealerId
    let dealerInfo: IDealerInfo | undefined;
    if (dealerId && mongoose.Types.ObjectId.isValid(String(dealerId))) {
      try {
        const businessReg = await BusinessRegistration.findById(dealerId);
        if (businessReg) {
          dealerInfo = {
            id: (businessReg._id as any).toString(),
            businessName: businessReg.businessName,
            type: businessReg.type,
            phone: businessReg.phone,
            address: businessReg.address,
            gst: businessReg.gst,
          };
        }
      } catch (err) {
        // Ignore errors
      }
    }

    // Attach dealer info to all services
    const servicesWithDealer = services.map((serviceDoc) => {
      const service: any = serviceToIService(serviceDoc);
      if (dealerInfo) {
        service.dealer = dealerInfo;
      }
      return service;
    });

    return {
      services: servicesWithDealer,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new service
 */
export const createService = async (serviceData: ICreateServiceRequest): Promise<IService> => {
  try {
    const service = new Service(serviceData);
    await service.save();

    logger.info(`Service created: ${service._id}`);
    return serviceToIService(service);
  } catch (error: any) {
    if (error.code === 11000) {
      throw new ConflictError('Service already exists');
    }
    logger.error('Error creating service:', error);
    throw error;
  }
};

/**
 * Update service
 */
export const updateService = async (
  serviceId: string,
  updateData: IUpdateServiceRequest,
): Promise<IService> => {
  try {
    const service = await Service.findByIdAndUpdate(serviceId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    logger.info(`Service updated: ${serviceId}`);
    return serviceToIService(service);
  } catch (error) {
    logger.error('Error updating service:', error);
    throw error;
  }
};

/**
 * Delete service
 */
export const deleteService = async (serviceId: string): Promise<void> => {
  try {
    const service = await Service.findByIdAndDelete(serviceId);

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    logger.info(`Service deleted: ${serviceId}`);
  } catch (error) {
    logger.error('Error deleting service:', error);
    throw error;
  }
};

