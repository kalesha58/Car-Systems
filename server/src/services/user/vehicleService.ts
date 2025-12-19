import { Vehicle, IVehicleDocument } from '../../models/user/Vehicle';
import {
  ICreateVehicleRequest,
  IUpdateVehicleRequest,
  IVehicle,
  IVehicleResponse,
  IVehiclesResponse,
} from '../../types/vehicle';
import { AppError, NotFoundError, ConflictError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { DealerVehicle, IDealerVehicleDocument } from '../../models/DealerVehicle';
import { BusinessRegistration } from '../../models/BusinessRegistration';
import {
  IDealerVehicleWithDealer,
  IGetUserDealerVehiclesRequest,
  IDealerInfo,
} from '../../types/user/vehicle';
import { IPaginationResponse } from '../../types/admin';
import mongoose from 'mongoose';

/**
 * Convert vehicle document to IVehicle interface
 */
const vehicleToIVehicle = (vehicleDoc: IVehicleDocument): IVehicle => {
  return {
    id: vehicleDoc.id,
    ownerId: vehicleDoc.ownerId,
    brand: vehicleDoc.brand,
    model: vehicleDoc.model,
    numberPlate: vehicleDoc.numberPlate,
    documents: vehicleDoc.documents || {},
    primaryDriverId: vehicleDoc.primaryDriverId,
    year: vehicleDoc.year,
    color: vehicleDoc.color,
    images: vehicleDoc.images || [],
    createdAt: vehicleDoc.createdAt?.toISOString(),
    updatedAt: vehicleDoc.updatedAt?.toISOString(),
  };
};

/**
 * Create a new vehicle
 */
export const createVehicle = async (
  ownerId: string,
  data: ICreateVehicleRequest,
): Promise<IVehicleResponse> => {
  const { brand, model, numberPlate, documents, primaryDriverId, year, color, images } = data;

  // Check if vehicle with same number plate already exists
  const existingVehicle = await Vehicle.findOne({ numberPlate: numberPlate.toUpperCase() });

  if (existingVehicle) {
    throw new ConflictError('Vehicle with this number plate already exists');
  }

  // Create new vehicle
  const vehicle = new Vehicle({
    ownerId,
    brand,
    model,
    numberPlate: numberPlate.toUpperCase(),
    documents: documents || {},
    primaryDriverId,
    year,
    color,
    images: images || [],
  });

  await vehicle.save();

  logger.info(`New vehicle created: ${vehicle.numberPlate} for owner: ${ownerId}`);

  return {
    Response: vehicleToIVehicle(vehicle),
  };
};

/**
 * Get all vehicles by owner ID
 */
export const getVehiclesByOwner = async (ownerId: string): Promise<IVehiclesResponse> => {
  const vehicles = await Vehicle.find({ ownerId }).sort({ createdAt: -1 });

  return {
    Response: vehicles.map(vehicleToIVehicle),
  };
};

/**
 * Get vehicle by ID
 */
export const getVehicleById = async (vehicleId: string, ownerId: string): Promise<IVehicleResponse> => {
  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  // Verify ownership
  if (vehicle.ownerId !== ownerId) {
    throw new AppError('Unauthorized access to vehicle', 403);
  }

  return {
    Response: vehicleToIVehicle(vehicle),
  };
};

/**
 * Update vehicle
 */
export const updateVehicle = async (
  vehicleId: string,
  ownerId: string,
  data: IUpdateVehicleRequest,
): Promise<IVehicleResponse> => {
  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  // Verify ownership
  if (vehicle.ownerId !== ownerId) {
    throw new AppError('Unauthorized access to vehicle', 403);
  }

  // Check if number plate is being updated and if it conflicts
  if (data.numberPlate && data.numberPlate.toUpperCase() !== vehicle.numberPlate) {
    const existingVehicle = await Vehicle.findOne({
      numberPlate: data.numberPlate.toUpperCase(),
      _id: { $ne: vehicleId },
    });

    if (existingVehicle) {
      throw new ConflictError('Vehicle with this number plate already exists');
    }
  }

  // Update fields using set() to avoid TypeScript conflicts with reserved names
  if (data.brand !== undefined) {
    vehicle.set('brand', data.brand);
  }
  if (data.model !== undefined) {
    vehicle.set('model', data.model);
  }
  if (data.numberPlate !== undefined) {
    vehicle.set('numberPlate', data.numberPlate.toUpperCase());
  }
  if (data.documents !== undefined) {
    vehicle.set('documents', { ...vehicle.documents, ...data.documents });
  }
  if (data.primaryDriverId !== undefined) {
    vehicle.set('primaryDriverId', data.primaryDriverId);
  }
  if (data.year !== undefined) {
    vehicle.set('year', data.year);
  }
  if (data.color !== undefined) {
    vehicle.set('color', data.color);
  }
  if (data.images !== undefined) {
    vehicle.set('images', data.images);
  }

  await vehicle.save();

  logger.info(`Vehicle updated: ${vehicle.numberPlate}`);

  return {
    Response: vehicleToIVehicle(vehicle),
  };
};

/**
 * Delete vehicle
 */
export const deleteVehicle = async (vehicleId: string, ownerId: string): Promise<void> => {
  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  // Verify ownership
  if (vehicle.ownerId !== ownerId) {
    throw new AppError('Unauthorized access to vehicle', 403);
  }

  await Vehicle.findByIdAndDelete(vehicleId);

  logger.info(`Vehicle deleted: ${vehicle.numberPlate}`);
};

/**
 * Convert dealer vehicle document to interface with dealer information
 */
const vehicleToInterfaceWithDealer = (doc: IDealerVehicleDocument, dealerInfo: IDealerInfo): IDealerVehicleWithDealer => {
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
    allowTestDrive: doc.allowTestDrive || false,
    createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
    dealer: dealerInfo,
  };
};

/**
 * Get all dealer vehicles for users with dealer information
 * Returns all dealer vehicles without any restrictions
 */
export const getAllDealerVehiclesForUsers = async (
  query: IGetUserDealerVehiclesRequest,
): Promise<{ vehicles: IDealerVehicleWithDealer[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Build filter for vehicles - fetch ALL vehicles without restrictions
    const filter: any = {};

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

    logger.info(`[getAllDealerVehiclesForUsers] Filter:`, JSON.stringify(filter, null, 2));
    logger.info(`[getAllDealerVehiclesForUsers] Query params: page=${page}, limit=${limit}, skip=${skip}`);

    const [vehicles, total] = await Promise.all([
      DealerVehicle.find(filter).sort(sort).skip(skip).limit(limit),
      DealerVehicle.countDocuments(filter),
    ]);

    logger.info(`[getAllDealerVehiclesForUsers] Found ${vehicles.length} vehicles, total: ${total}`);

    // Get unique dealerIds from vehicles
    const dealerIds = [...new Set(vehicles.map((v: any) => v.dealerId))];
    
    // Convert dealerIds to ObjectIds for proper MongoDB query
    const dealerObjectIds = dealerIds
      .filter(id => id)
      .map(id => {
        try {
          return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
        } catch {
          return id;
        }
      });

    // Get all business registrations for these dealers
    const businessRegistrations = await BusinessRegistration.find({
      $or: [
        { _id: { $in: dealerObjectIds } },
        { _id: { $in: dealerIds } },
      ],
    });

    // Create a map of dealerId (BusinessRegistration _id) to dealer info for quick lookup
    // Use both string and ObjectId versions as keys to handle both formats
    const dealerInfoMap = new Map<string, IDealerInfo>();
    businessRegistrations.forEach((reg) => {
      const dealerId = (reg._id as any).toString();
      const dealerInfo: IDealerInfo = {
        id: dealerId,
        businessName: reg.businessName,
        type: reg.type,
        phone: reg.phone,
        address: reg.address,
        gst: reg.gst,
      };
      // Store with both string and ObjectId string formats as keys
      dealerInfoMap.set(dealerId, dealerInfo);
      // Also store with the raw _id if it's different
      if (reg._id && (reg._id as any).toString() !== dealerId) {
        dealerInfoMap.set((reg._id as any).toString(), dealerInfo);
      }
    });

    // Convert vehicles and attach dealer info
    const vehiclesWithDealer = vehicles.map((vehicleDoc) => {
      // Try to find dealer info - check both the raw dealerId and its string version
      const vehicleDealerId = vehicleDoc.dealerId?.toString() || vehicleDoc.dealerId;
      let dealerInfo = dealerInfoMap.get(vehicleDealerId);
      
      // If not found, try with ObjectId conversion
      if (!dealerInfo && vehicleDealerId) {
        try {
          const objectIdStr = new mongoose.Types.ObjectId(vehicleDealerId).toString();
          dealerInfo = dealerInfoMap.get(objectIdStr);
        } catch {
          // Ignore conversion errors
        }
      }

      if (!dealerInfo) {
        // Log missing dealer info for debugging
        logger.warn(`[getAllDealerVehiclesForUsers] Dealer not found for vehicle ${vehicleDoc._id}, dealerId: ${vehicleDealerId}`);
        // Return a default dealer info if not found
        const defaultDealerInfo: IDealerInfo = {
          id: vehicleDealerId || 'unknown',
          businessName: 'Unknown Dealer',
          type: '',
          phone: '',
          address: '',
        };
        return vehicleToInterfaceWithDealer(vehicleDoc, defaultDealerInfo);
      }
      return vehicleToInterfaceWithDealer(vehicleDoc, dealerInfo);
    });

    return {
      vehicles: vehiclesWithDealer,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting all dealer vehicles for users:', error);
    throw error;
  }
};

