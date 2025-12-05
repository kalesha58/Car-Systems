import { Service, IServiceDocument } from '../../models/Service';
import {
  IDealerService,
  ICreateDealerServiceRequest,
  IUpdateDealerServiceRequest,
  IUpdateServiceStatusRequest,
  IGetDealerServicesRequest,
} from '../../types/dealer/service';
import { NotFoundError, AppError, ForbiddenError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { IPaginationResponse } from '../../types/admin';

/**
 * Convert service document to dealer service interface
 */
const serviceToDealerService = (doc: IServiceDocument): IDealerService => {
  return {
    id: (doc._id as any).toString(),
    dealerId: doc.dealerId,
    name: doc.name,
    price: doc.price,
    durationMinutes: doc.durationMinutes,
    homeService: doc.homeService,
    description: doc.description,
    category: doc.category,
    images: doc.images,
    location: doc.location,
    createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Get all services for a dealer
 */
export const getDealerServices = async (
  dealerId: string,
  query: IGetDealerServicesRequest,
): Promise<{ services: IDealerService[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { dealerId };

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
      services: services.map(serviceToDealerService),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting dealer services:', error);
    throw error;
  }
};

/**
 * Get service by ID
 */
export const getDealerServiceById = async (
  serviceId: string,
  dealerId: string,
): Promise<IDealerService> => {
  try {
    const service = await Service.findById(serviceId);

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Verify dealer owns this service
    if (service.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized to access this service');
    }

    return serviceToDealerService(service);
  } catch (error) {
    logger.error('Error getting dealer service by ID:', error);
    throw error;
  }
};

/**
 * Create service
 */
export const createDealerService = async (
  dealerId: string,
  data: ICreateDealerServiceRequest,
): Promise<IDealerService> => {
  try {
    // Validate required fields
    if (!data.name?.trim()) {
      throw new AppError('Service name is required', 400);
    }

    if (data.price === undefined || data.price < 0) {
      throw new AppError('Price must be a non-negative number', 400);
    }

    if (!data.durationMinutes || data.durationMinutes < 1) {
      throw new AppError('Duration must be at least 1 minute', 400);
    }

    if (data.durationMinutes > 24 * 60) {
      throw new AppError('Duration cannot exceed 24 hours', 400);
    }

    if (data.homeService === undefined) {
      throw new AppError('Home service flag is required', 400);
    }

    // Validate location if provided
    if (data.location) {
      if (data.location.latitude === undefined || data.location.longitude === undefined) {
        throw new AppError('Both latitude and longitude are required if location is provided', 400);
      }

      if (data.location.latitude < -90 || data.location.latitude > 90) {
        throw new AppError('Latitude must be between -90 and 90', 400);
      }

      if (data.location.longitude < -180 || data.location.longitude > 180) {
        throw new AppError('Longitude must be between -180 and 180', 400);
      }
    }

    const service = new Service({
      dealerId,
      name: data.name.trim(),
      price: data.price,
      durationMinutes: data.durationMinutes,
      homeService: data.homeService,
      description: data.description?.trim(),
      category: data.category?.trim(),
      images: data.images || [],
      location: data.location,
    });

    await service.save();

    logger.info(`Service created for dealer: ${dealerId}`);

    return serviceToDealerService(service);
  } catch (error) {
    logger.error('Error creating dealer service:', error);
    throw error;
  }
};

/**
 * Update service
 */
export const updateDealerService = async (
  serviceId: string,
  dealerId: string,
  data: IUpdateDealerServiceRequest,
): Promise<IDealerService> => {
  try {
    const service = await Service.findById(serviceId);

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Verify dealer owns this service
    if (service.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized to update this service');
    }

    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new AppError('Service name cannot be empty', 400);
      }
      service.name = data.name.trim();
    }

    if (data.price !== undefined) {
      if (data.price < 0) {
        throw new AppError('Price must be a non-negative number', 400);
      }
      service.price = data.price;
    }

    if (data.durationMinutes !== undefined) {
      if (data.durationMinutes < 1) {
        throw new AppError('Duration must be at least 1 minute', 400);
      }

      if (data.durationMinutes > 24 * 60) {
        throw new AppError('Duration cannot exceed 24 hours', 400);
      }
      service.durationMinutes = data.durationMinutes;
    }

    if (data.homeService !== undefined) {
      service.homeService = data.homeService;
    }

    if (data.description !== undefined) {
      service.description = data.description?.trim();
    }

    if (data.category !== undefined) {
      service.category = data.category?.trim();
    }

    if (data.location !== undefined) {
      if (data.location) {
        if (
          data.location.latitude === undefined ||
          data.location.longitude === undefined
        ) {
          throw new AppError('Both latitude and longitude are required if location is provided', 400);
        }

        if (data.location.latitude < -90 || data.location.latitude > 90) {
          throw new AppError('Latitude must be between -90 and 90', 400);
        }

        if (data.location.longitude < -180 || data.location.longitude > 180) {
          throw new AppError('Longitude must be between -180 and 180', 400);
        }
      }
      service.location = data.location;
    }

    if (data.images !== undefined) {
      if (!Array.isArray(data.images)) {
        throw new AppError('Images must be an array', 400);
      }
      service.images = data.images;
    }

    await service.save();

    logger.info(`Service updated: ${serviceId}`);

    return serviceToDealerService(service);
  } catch (error) {
    logger.error('Error updating dealer service:', error);
    throw error;
  }
};

/**
 * Update service status (Note: Service model doesn't have isActive, this might need model update)
 */
export const updateServiceStatus = async (
  serviceId: string,
  dealerId: string,
  data: IUpdateServiceStatusRequest,
): Promise<IDealerService> => {
  try {
    const service = await Service.findById(serviceId);

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Verify dealer owns this service
    if (service.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized to update this service');
    }

    // Note: Service model doesn't have isActive field
    // This would require adding it to the model or using a different approach
    // For now, we'll skip this or mark it as a TODO
    // If needed, we can add a status field to the Service model

    logger.info(`Service status update requested: ${serviceId}`);

    return serviceToDealerService(service);
  } catch (error) {
    logger.error('Error updating service status:', error);
    throw error;
  }
};

/**
 * Delete service
 */
export const deleteDealerService = async (serviceId: string, dealerId: string): Promise<void> => {
  try {
    const service = await Service.findById(serviceId);

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Verify dealer owns this service
    if (service.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized to delete this service');
    }

    // TODO: Check for active/upcoming bookings before deletion
    // For now, we'll allow deletion but this should be implemented

    await Service.findByIdAndDelete(serviceId);

    logger.info(`Service deleted: ${serviceId}`);
  } catch (error) {
    logger.error('Error deleting dealer service:', error);
    throw error;
  }
};

/**
 * Get services by category
 */
export const getServicesByCategory = async (
  dealerId: string,
  category: string,
  query: IGetDealerServicesRequest,
): Promise<{ services: IDealerService[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { dealerId, category };

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [services, total] = await Promise.all([
      Service.find(filter).sort(sort).skip(skip).limit(limit),
      Service.countDocuments(filter),
    ]);

    return {
      services: services.map(serviceToDealerService),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting services by category:', error);
    throw error;
  }
};

/**
 * Get home services
 */
export const getHomeServices = async (
  dealerId: string,
  query: IGetDealerServicesRequest,
): Promise<{ services: IDealerService[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { dealerId, homeService: true };

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [services, total] = await Promise.all([
      Service.find(filter).sort(sort).skip(skip).limit(limit),
      Service.countDocuments(filter),
    ]);

    return {
      services: services.map(serviceToDealerService),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting home services:', error);
    throw error;
  }
};

/**
 * Get active services for dealer
 */
export const getActiveDealerServices = async (
  dealerId: string,
  query: IGetDealerServicesRequest,
): Promise<{ services: IDealerService[]; pagination: IPaginationResponse }> => {
  try {
    // Note: Service model doesn't have isActive field
    // For now, return all services. This can be enhanced when isActive is added
    return getDealerServices(dealerId, query);
  } catch (error) {
    logger.error('Error getting active dealer services:', error);
    throw error;
  }
};

/**
 * Search services
 */
export const searchDealerServices = async (
  dealerId: string,
  query: IGetDealerServicesRequest,
): Promise<{ services: IDealerService[]; pagination: IPaginationResponse }> => {
  try {
    // Use the main getDealerServices which already supports search
    return getDealerServices(dealerId, query);
  } catch (error) {
    logger.error('Error searching dealer services:', error);
    throw error;
  }
};

/**
 * Update service images
 */
export const updateServiceImages = async (
  serviceId: string,
  dealerId: string,
  data: { images: string[] },
): Promise<IDealerService> => {
  try {
    const service = await Service.findById(serviceId);

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Verify dealer owns this service
    if (service.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized to update this service');
    }

    if (!Array.isArray(data.images)) {
      throw new AppError('Images must be an array', 400);
    }

    service.images = data.images;

    await service.save();

    logger.info(`Service images updated: ${serviceId}`);

    return serviceToDealerService(service);
  } catch (error) {
    logger.error('Error updating service images:', error);
    throw error;
  }
};



