import { DealerVehicle, IDealerVehicleDocument } from '../../models/DealerVehicle';
import {
  IDealerVehicle,
  ICreateDealerVehicleRequest,
  IUpdateDealerVehicleRequest,
  IUpdateVehicleAvailabilityRequest,
  IUpdateVehicleImagesRequest,
  IGetDealerVehiclesRequest,
} from '../../types/dealer/vehicle';
import { NotFoundError, AppError, ForbiddenError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { IPaginationResponse } from '../../types/admin';

/**
 * Convert vehicle document to interface
 */
const vehicleToInterface = (doc: IDealerVehicleDocument): IDealerVehicle => {
  return {
    id: (doc._id as any).toString(),
    dealerId: doc.dealerId,
    vehicleType: doc.vehicleType,
    brand: doc.brand,
    vehicleModel: doc.vehicleModel,
    year: doc.year,
    price: doc.price,
    availability: doc.availability,
    images: doc.images,
    numberPlate: doc.numberPlate,
    mileage: doc.mileage,
    color: doc.color,
    fuelType: doc.fuelType,
    transmission: doc.transmission,
    description: doc.description,
    features: doc.features,
    condition: doc.condition,
    createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Get all vehicles for a dealer
 */
export const getDealerVehicles = async (
  dealerId: string,
  query: IGetDealerVehiclesRequest,
): Promise<{ vehicles: IDealerVehicle[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { dealerId };

    if (query.vehicleType) {
      filter.vehicleType = query.vehicleType;
    }

    if (query.brand) {
      filter.brand = { $regex: query.brand, $options: 'i' };
    }

    if (query.availability) {
      filter.availability = query.availability;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
    }

    if (query.minYear !== undefined || query.maxYear !== undefined) {
      filter.year = {};
      if (query.minYear !== undefined) filter.year.$gte = query.minYear;
      if (query.maxYear !== undefined) filter.year.$lte = query.maxYear;
    }

    if (query.search) {
      filter.$or = [
        { brand: { $regex: query.search, $options: 'i' } },
        { vehicleModel: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [vehicles, total] = await Promise.all([
      DealerVehicle.find(filter).sort(sort).skip(skip).limit(limit),
      DealerVehicle.countDocuments(filter),
    ]);

    return {
      vehicles: vehicles.map(vehicleToInterface),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting dealer vehicles:', error);
    throw error;
  }
};

/**
 * Get all dealer vehicles (for admin - across all dealers)
 */
export const getAllDealerVehicles = async (
  query: IGetDealerVehiclesRequest,
): Promise<{ vehicles: IDealerVehicle[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.vehicleType) {
      filter.vehicleType = query.vehicleType;
    }

    if (query.brand) {
      filter.brand = { $regex: query.brand, $options: 'i' };
    }

    if (query.availability) {
      filter.availability = query.availability;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
    }

    if (query.minYear !== undefined || query.maxYear !== undefined) {
      filter.year = {};
      if (query.minYear !== undefined) filter.year.$gte = query.minYear;
      if (query.maxYear !== undefined) filter.year.$lte = query.maxYear;
    }

    if (query.search) {
      filter.$or = [
        { brand: { $regex: query.search, $options: 'i' } },
        { vehicleModel: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    // Optional: Filter by dealerId if provided
    if (query.dealerId) {
      filter.dealerId = query.dealerId;
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [vehicles, total] = await Promise.all([
      DealerVehicle.find(filter).sort(sort).skip(skip).limit(limit),
      DealerVehicle.countDocuments(filter),
    ]);

    return {
      vehicles: vehicles.map(vehicleToInterface),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting all dealer vehicles:', error);
    throw error;
  }
};

/**
 * Get vehicle by ID
 */
export const getDealerVehicleById = async (
  vehicleId: string,
  dealerId: string,
): Promise<IDealerVehicle> => {
  try {
    const vehicle = await DealerVehicle.findById(vehicleId);

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    // Verify dealer owns this vehicle
    if (vehicle.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized to access this vehicle');
    }

    return vehicleToInterface(vehicle);
  } catch (error) {
    logger.error('Error getting dealer vehicle by ID:', error);
    throw error;
  }
};

/**
 * Create vehicle
 */
export const createDealerVehicle = async (
  dealerId: string,
  data: ICreateDealerVehicleRequest,
): Promise<IDealerVehicle> => {
  try {
    // Validate required fields
    if (!data.vehicleType) {
      throw new AppError('Vehicle type is required', 400);
    }

    if (!data.brand?.trim()) {
      throw new AppError('Brand is required', 400);
    }

    if (!data.vehicleModel?.trim()) {
      throw new AppError('Vehicle model is required', 400);
    }

    if (!data.year) {
      throw new AppError('Year is required', 400);
    }

    const currentYear = new Date().getFullYear();
    if (data.year < 1900 || data.year > currentYear + 1) {
      throw new AppError('Invalid year', 400);
    }

    if (!data.price || data.price <= 0) {
      throw new AppError('Price must be greater than 0', 400);
    }

    if (!data.availability) {
      throw new AppError('Availability is required', 400);
    }

    if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
      throw new AppError('At least one image is required', 400);
    }

    const vehicle = new DealerVehicle({
      dealerId,
      vehicleType: data.vehicleType,
      brand: data.brand.trim(),
      vehicleModel: data.vehicleModel.trim(),
      year: data.year,
      price: data.price,
      availability: data.availability,
      images: data.images,
      numberPlate: data.numberPlate?.trim().toUpperCase(),
      mileage: data.mileage,
      color: data.color?.trim(),
      fuelType: data.fuelType,
      transmission: data.transmission,
      description: data.description?.trim(),
      features: data.features || [],
      condition: data.condition,
    });

    await vehicle.save();

    logger.info(`Vehicle created for dealer: ${dealerId}`);

    return vehicleToInterface(vehicle);
  } catch (error) {
    logger.error('Error creating dealer vehicle:', error);
    throw error;
  }
};

/**
 * Update vehicle
 */
export const updateDealerVehicle = async (
  vehicleId: string,
  dealerId: string,
  data: IUpdateDealerVehicleRequest,
): Promise<IDealerVehicle> => {
  try {
    const vehicle = await DealerVehicle.findById(vehicleId);

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    // Verify dealer owns this vehicle
    if (vehicle.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized to update this vehicle');
    }

    if (data.vehicleType !== undefined) {
      vehicle.vehicleType = data.vehicleType;
    }

    if (data.brand !== undefined) {
      if (!data.brand.trim()) {
        throw new AppError('Brand cannot be empty', 400);
      }
      vehicle.brand = data.brand.trim();
    }

    if (data.vehicleModel !== undefined) {
      if (!data.vehicleModel.trim()) {
        throw new AppError('Vehicle model cannot be empty', 400);
      }
      vehicle.vehicleModel = data.vehicleModel.trim();
    }

    if (data.year !== undefined) {
      const currentYear = new Date().getFullYear();
      if (data.year < 1900 || data.year > currentYear + 1) {
        throw new AppError('Invalid year', 400);
      }
      vehicle.year = data.year;
    }

    if (data.price !== undefined) {
      if (data.price <= 0) {
        throw new AppError('Price must be greater than 0', 400);
      }
      vehicle.price = data.price;
    }

    if (data.availability !== undefined) {
      vehicle.availability = data.availability;
    }

    if (data.images !== undefined) {
      if (!Array.isArray(data.images) || data.images.length === 0) {
        throw new AppError('At least one image is required', 400);
      }
      vehicle.images = data.images;
    }

    if (data.numberPlate !== undefined) {
      vehicle.numberPlate = data.numberPlate?.trim().toUpperCase();
    }

    if (data.mileage !== undefined) {
      vehicle.mileage = data.mileage;
    }

    if (data.color !== undefined) {
      vehicle.color = data.color?.trim();
    }

    if (data.fuelType !== undefined) {
      vehicle.fuelType = data.fuelType;
    }

    if (data.transmission !== undefined) {
      vehicle.transmission = data.transmission;
    }

    if (data.description !== undefined) {
      vehicle.description = data.description?.trim();
    }

    if (data.features !== undefined) {
      vehicle.features = data.features;
    }

    if (data.condition !== undefined) {
      vehicle.condition = data.condition;
    }

    await vehicle.save();

    logger.info(`Vehicle updated: ${vehicleId}`);

    return vehicleToInterface(vehicle);
  } catch (error) {
    logger.error('Error updating dealer vehicle:', error);
    throw error;
  }
};

/**
 * Update vehicle availability
 */
export const updateVehicleAvailability = async (
  vehicleId: string,
  dealerId: string,
  data: IUpdateVehicleAvailabilityRequest,
): Promise<IDealerVehicle> => {
  try {
    const vehicle = await DealerVehicle.findById(vehicleId);

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    // Verify dealer owns this vehicle
    if (vehicle.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized to update this vehicle');
    }

    vehicle.availability = data.availability;

    await vehicle.save();

    logger.info(`Vehicle availability updated: ${vehicleId} - ${data.availability}`);

    return vehicleToInterface(vehicle);
  } catch (error) {
    logger.error('Error updating vehicle availability:', error);
    throw error;
  }
};

/**
 * Update vehicle images
 */
export const updateVehicleImages = async (
  vehicleId: string,
  dealerId: string,
  data: IUpdateVehicleImagesRequest,
): Promise<IDealerVehicle> => {
  try {
    const vehicle = await DealerVehicle.findById(vehicleId);

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    // Verify dealer owns this vehicle
    if (vehicle.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized to update this vehicle');
    }

    if (!Array.isArray(data.images) || data.images.length === 0) {
      throw new AppError('At least one image is required', 400);
    }

    vehicle.images = data.images;

    await vehicle.save();

    logger.info(`Vehicle images updated: ${vehicleId}`);

    return vehicleToInterface(vehicle);
  } catch (error) {
    logger.error('Error updating vehicle images:', error);
    throw error;
  }
};

/**
 * Delete vehicle
 */
export const deleteDealerVehicle = async (vehicleId: string, dealerId: string): Promise<void> => {
  try {
    const vehicle = await DealerVehicle.findById(vehicleId);

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    // Verify dealer owns this vehicle
    if (vehicle.dealerId !== dealerId) {
      throw new ForbiddenError('Unauthorized to delete this vehicle');
    }

    await DealerVehicle.findByIdAndDelete(vehicleId);

    logger.info(`Vehicle deleted: ${vehicleId}`);
  } catch (error) {
    logger.error('Error deleting dealer vehicle:', error);
    throw error;
  }
};

/**
 * Get available vehicles for dealer
 */
export const getAvailableDealerVehicles = async (
  dealerId: string,
  query: IGetDealerVehiclesRequest,
): Promise<{ vehicles: IDealerVehicle[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { dealerId, availability: 'available' };

    if (query.vehicleType) {
      filter.vehicleType = query.vehicleType;
    }

    if (query.brand) {
      filter.brand = { $regex: query.brand, $options: 'i' };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
    }

    if (query.search) {
      filter.$or = [
        { brand: { $regex: query.search, $options: 'i' } },
        { vehicleModel: { $regex: query.search, $options: 'i' } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [vehicles, total] = await Promise.all([
      DealerVehicle.find(filter).sort(sort).skip(skip).limit(limit),
      DealerVehicle.countDocuments(filter),
    ]);

    return {
      vehicles: vehicles.map(vehicleToInterface),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting available dealer vehicles:', error);
    throw error;
  }
};


