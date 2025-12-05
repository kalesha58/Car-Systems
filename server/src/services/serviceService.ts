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

    return {
      services: services.map(serviceToIService),
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

    return serviceToIService(service);
  } catch (error) {
    logger.error('Error getting service by ID:', error);
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

    return {
      services: services.map(serviceToIService),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting services by dealer ID:', error);
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

