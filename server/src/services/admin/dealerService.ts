import { Dealer, IDealerDocument } from '../../models/Dealer';
import { Order } from '../../models/Order';
import { BusinessRegistration } from '../../models/BusinessRegistration';
import {
  IGetDealersRequest,
  ICreateDealerRequest,
  IUpdateDealerRequest,
  IDealer,
  IPaginationResponse,
} from '../../types/admin';
import {
  ICreateDealerProductRequest,
  IUpdateDealerProductRequest,
  IDealerProduct,
} from '../../types/dealer/product';
import {
  ICreateDealerVehicleRequest,
  IUpdateDealerVehicleRequest,
  IDealerVehicle,
} from '../../types/dealer/vehicle';
import {
  ICreateBusinessRegistrationRequest,
  IBusinessRegistration,
} from '../../types/dealer/businessRegistration';
import { createDealerProduct, updateDealerProduct } from '../dealer/productService';
import { createDealerVehicle, updateDealerVehicle } from '../dealer/vehicleService';
import { DealerVehicle } from '../../models/DealerVehicle';
import { createBusinessRegistration } from '../dealer/businessRegistrationService';
import { NotFoundError, ConflictError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

/**
 * Convert dealer document to IDealer interface
 */
const dealerToIDealer = (dealerDoc: IDealerDocument): IDealer => {
  return {
    id: (dealerDoc._id as any).toString(),
    name: dealerDoc.name,
    businessName: dealerDoc.businessName,
    email: dealerDoc.email,
    phone: dealerDoc.phone,
    status: dealerDoc.status,
    location: dealerDoc.location,
    address: dealerDoc.address,
    documents: dealerDoc.documents,
    createdAt: dealerDoc.createdAt?.toISOString() || new Date().toISOString(),
  };
};

/**
 * Get all dealers with pagination and filters
 */
export const getDealers = async (
  query: IGetDealersRequest,
): Promise<{ dealers: IDealer[]; pagination: IPaginationResponse }> => {
  try {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { businessName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.location) {
      filter.location = { $regex: query.location, $options: 'i' };
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [dealers, total] = await Promise.all([
      Dealer.find(filter).sort(sort).skip(skip).limit(limit),
      Dealer.countDocuments(filter),
    ]);

    return {
      dealers: dealers.map(dealerToIDealer),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting dealers:', error);
    throw error;
  }
};

/**
 * Get dealer by ID
 */
export const getDealerById = async (dealerId: string): Promise<IDealer> => {
  try {
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
      throw new NotFoundError('Dealer not found');
    }

    const dealerData = dealerToIDealer(dealer);

    // Get dealer orders
    const orders = await Order.find({ dealerId: dealerId }).limit(10);
    dealerData.orders = orders;

    return dealerData;
  } catch (error) {
    logger.error('Error getting dealer by ID:', error);
    throw error;
  }
};

/**
 * Create dealer
 */
export const createDealer = async (data: ICreateDealerRequest): Promise<IDealer> => {
  try {
    const existingDealer = await Dealer.findOne({ email: data.email });

    if (existingDealer) {
      throw new ConflictError('Dealer with this email already exists');
    }

    const dealer = new Dealer({
      name: data.name,
      businessName: data.businessName,
      email: data.email,
      phone: data.phone,
      location: data.location,
      address: data.address,
      status: 'pending',
    });

    await dealer.save();

    logger.info(`New dealer created: ${dealer.email}`);

    return dealerToIDealer(dealer);
  } catch (error) {
    logger.error('Error creating dealer:', error);
    throw error;
  }
};

/**
 * Update dealer
 */
export const updateDealer = async (dealerId: string, data: IUpdateDealerRequest): Promise<IDealer> => {
  try {
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
      throw new NotFoundError('Dealer not found');
    }

    if (data.name !== undefined) dealer.name = data.name;
    if (data.businessName !== undefined) dealer.businessName = data.businessName;
    if (data.phone !== undefined) dealer.phone = data.phone;
    if (data.location !== undefined) dealer.location = data.location;

    await dealer.save();

    logger.info(`Dealer updated: ${dealer.email}`);

    return dealerToIDealer(dealer);
  } catch (error) {
    logger.error('Error updating dealer:', error);
    throw error;
  }
};

/**
 * Delete dealer
 */
export const deleteDealer = async (dealerId: string): Promise<void> => {
  try {
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
      throw new NotFoundError('Dealer not found');
    }

    await Dealer.findByIdAndDelete(dealerId);

    logger.info(`Dealer deleted: ${dealer.email}`);
  } catch (error) {
    logger.error('Error deleting dealer:', error);
    throw error;
  }
};

/**
 * Approve dealer
 */
export const approveDealer = async (dealerId: string): Promise<IDealer> => {
  try {
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
      throw new NotFoundError('Dealer not found');
    }

    dealer.status = 'approved';
    dealer.rejectionReason = undefined;
    await dealer.save();

    logger.info(`Dealer approved: ${dealer.email}`);

    return dealerToIDealer(dealer);
  } catch (error) {
    logger.error('Error approving dealer:', error);
    throw error;
  }
};

/**
 * Reject dealer
 */
export const rejectDealer = async (dealerId: string, reason: string): Promise<IDealer> => {
  try {
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
      throw new NotFoundError('Dealer not found');
    }

    dealer.status = 'rejected';
    dealer.rejectionReason = reason;
    await dealer.save();

    logger.info(`Dealer rejected: ${dealer.email}`);

    return dealerToIDealer(dealer);
  } catch (error) {
    logger.error('Error rejecting dealer:', error);
    throw error;
  }
};

/**
 * Suspend dealer
 */
export const suspendDealer = async (dealerId: string, reason: string): Promise<IDealer> => {
  try {
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
      throw new NotFoundError('Dealer not found');
    }

    dealer.status = 'suspended';
    dealer.suspensionReason = reason;
    await dealer.save();

    logger.info(`Dealer suspended: ${dealer.email}`);

    return dealerToIDealer(dealer);
  } catch (error) {
    logger.error('Error suspending dealer:', error);
    throw error;
  }
};

/**
 * Get dealer orders
 */
export const getDealerOrders = async (
  dealerId: string,
  page: number = 1,
  limit: number = 10,
): Promise<{ orders: any[]; pagination: IPaginationResponse }> => {
  try {
    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
      throw new NotFoundError('Dealer not found');
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ dealerId: dealerId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments({ dealerId: dealerId }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting dealer orders:', error);
    throw error;
  }
};

/**
 * Create product for dealer
 */
export const createProductForDealer = async (
  userId: string,
  data: ICreateDealerProductRequest,
): Promise<IDealerProduct> => {
  try {
    // Find BusinessRegistration to get the ID (same as dealerMiddleware does)
    const businessRegistration = await BusinessRegistration.findOne({ userId });

    if (!businessRegistration) {
      throw new NotFoundError('Business registration not found for this dealer');
    }

    // Use BusinessRegistration ID (same as dealer side uses)
    const dealerId = (businessRegistration._id as any).toString();
    const product = await createDealerProduct(dealerId, data);

    logger.info(`Product created for dealer (userId: ${userId}, dealerId: ${dealerId}) by admin`);

    return product;
  } catch (error) {
    logger.error('Error creating product for dealer:', error);
    throw error;
  }
};

/**
 * Get vehicle by ID for admin (no dealer ownership check)
 */
export const getDealerVehicleByIdForAdmin = async (
  vehicleId: string,
): Promise<IDealerVehicle> => {
  try {
    const vehicle = await DealerVehicle.findById(vehicleId);

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    // Convert vehicle document to interface
    const vehicleData: IDealerVehicle = {
      id: (vehicle._id as any).toString(),
      dealerId: vehicle.dealerId,
      vehicleType: vehicle.vehicleType,
      brand: vehicle.brand,
      vehicleModel: vehicle.vehicleModel,
      year: vehicle.year,
      price: vehicle.price,
      availability: vehicle.availability,
      images: vehicle.images,
      numberPlate: vehicle.numberPlate,
      mileage: vehicle.mileage,
      color: vehicle.color,
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
      description: vehicle.description,
      features: vehicle.features,
      condition: vehicle.condition,
      createdAt: vehicle.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: vehicle.updatedAt?.toISOString() || new Date().toISOString(),
    };

    return vehicleData;
  } catch (error) {
    logger.error('Error getting dealer vehicle by ID for admin:', error);
    throw error;
  }
};

/**
 * Create vehicle for dealer
 */
export const createVehicleForDealer = async (
  userId: string,
  data: ICreateDealerVehicleRequest,
): Promise<IDealerVehicle> => {
  try {
    // Check if business registration exists
    const businessRegistration = await BusinessRegistration.findOne({ userId });

    // Use business registration ID as dealerId if exists, otherwise use userId
    const dealerId = businessRegistration
      ? (businessRegistration._id as any).toString()
      : userId;

    const vehicle = await createDealerVehicle(dealerId, data);

    logger.info(
      `Vehicle created for dealer (userId: ${userId}, dealerId: ${dealerId}) by admin. Business registration: ${businessRegistration ? 'exists' : 'not found, using userId as dealerId'}`,
    );

    return vehicle;
  } catch (error) {
    logger.error('Error creating vehicle for dealer:', error);
    throw error;
  }
};

/**
 * Create business registration for dealer
 */
export const createBusinessRegistrationForDealer = async (
  userId: string,
  data: ICreateBusinessRegistrationRequest,
): Promise<IBusinessRegistration> => {
  try {
    // Check if user already has a registration
    const existing = await BusinessRegistration.findOne({ userId });

    if (existing) {
      throw new ConflictError('Business registration already exists for this user');
    }

    const registration = await createBusinessRegistration(userId, data);

    logger.info(`Business registration created for dealer (userId: ${userId}) by admin`);

    return registration;
  } catch (error) {
    logger.error('Error creating business registration for dealer:', error);
    throw error;
  }
};

/**
 * Update product for dealer
 */
export const updateProductForDealer = async (
  userId: string,
  productId: string,
  data: IUpdateDealerProductRequest,
): Promise<IDealerProduct> => {
  try {
    // Find BusinessRegistration to get the ID (same as dealerMiddleware does)
    const businessRegistration = await BusinessRegistration.findOne({ userId });

    if (!businessRegistration) {
      throw new NotFoundError('Business registration not found for this dealer');
    }

    // Use BusinessRegistration ID (same as dealer side uses)
    const dealerId = (businessRegistration._id as any).toString();
    const product = await updateDealerProduct(productId, dealerId, data);

    logger.info(`Product updated for dealer (userId: ${userId}, dealerId: ${dealerId}) by admin`);

    return product;
  } catch (error) {
    logger.error('Error updating product for dealer:', error);
    throw error;
  }
};

/**
 * Update vehicle for dealer
 */
export const updateVehicleForDealer = async (
  userId: string,
  vehicleId: string,
  data: IUpdateDealerVehicleRequest,
): Promise<IDealerVehicle> => {
  try {
    const businessRegistration = await BusinessRegistration.findOne({ userId });

    if (!businessRegistration) {
      throw new NotFoundError('Business registration not found for this dealer');
    }

    const dealerId = (businessRegistration._id as any).toString();
    const vehicle = await updateDealerVehicle(vehicleId, dealerId, data);

    logger.info(`Vehicle updated for dealer (userId: ${userId}, dealerId: ${dealerId}) by admin`);

    return vehicle;
  } catch (error) {
    logger.error('Error updating vehicle for dealer:', error);
    throw error;
  }
};

