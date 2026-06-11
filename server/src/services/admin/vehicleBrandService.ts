import { VehicleBrand, IVehicleBrandDocument, VehicleBrandType } from '../../models/VehicleBrand';
import { VehicleModel } from '../../models/VehicleModel';
import { Product } from '../../models/Product';
import { DealerVehicle } from '../../models/DealerVehicle';
import { Service } from '../../models/Service';
import { NotFoundError, ConflictError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export interface IVehicleBrand {
  id: string;
  name: string;
  type: VehicleBrandType;
  status: 'active' | 'inactive';
  modelCount: number;
  createdAt: string;
}

export interface IGetVehicleBrandsRequest {
  search?: string;
  status?: 'active' | 'inactive';
  type?: VehicleBrandType;
}

export interface ICreateVehicleBrandRequest {
  name: string;
  type: VehicleBrandType;
  status?: 'active' | 'inactive';
}

export interface IUpdateVehicleBrandRequest {
  name?: string;
  status?: 'active' | 'inactive';
}

const brandToInterface = async (doc: IVehicleBrandDocument): Promise<IVehicleBrand> => {
  const brandId = (doc._id as { toString(): string }).toString();
  const modelCount = await VehicleModel.countDocuments({ brandId });

  return {
    id: brandId,
    name: doc.name,
    type: doc.type,
    status: doc.status,
    modelCount,
    createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
  };
};

export const getVehicleBrands = async (query: IGetVehicleBrandsRequest): Promise<IVehicleBrand[]> => {
  const filter: Record<string, unknown> = {};

  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.type) {
    filter.type = query.type;
  }

  const brands = await VehicleBrand.find(filter).sort({ name: 1 });
  return Promise.all(brands.map(brandToInterface));
};

export const getVehicleBrandById = async (id: string): Promise<IVehicleBrand> => {
  const doc = await VehicleBrand.findById(id);
  if (!doc) {
    throw new NotFoundError('Vehicle brand not found');
  }
  return brandToInterface(doc);
};

export const createVehicleBrand = async (data: ICreateVehicleBrandRequest): Promise<IVehicleBrand> => {
  const existing = await VehicleBrand.findOne({
    name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
    type: data.type,
  });
  if (existing) {
    throw new ConflictError('Vehicle brand with this name already exists for this type');
  }

  const doc = new VehicleBrand({
    name: data.name.trim(),
    type: data.type,
    status: data.status || 'active',
  });

  await doc.save();
  logger.info(`Vehicle brand created: ${doc.name} (${doc.type})`);
  return brandToInterface(doc);
};

export const updateVehicleBrand = async (
  id: string,
  data: IUpdateVehicleBrandRequest,
): Promise<IVehicleBrand> => {
  const doc = await VehicleBrand.findById(id);
  if (!doc) {
    throw new NotFoundError('Vehicle brand not found');
  }

  if (data.name !== undefined) {
    const existing = await VehicleBrand.findOne({
      name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
      type: doc.type,
      _id: { $ne: id },
    });
    if (existing) {
      throw new ConflictError('Vehicle brand with this name already exists for this type');
    }
    doc.name = data.name.trim();
  }

  if (data.status !== undefined) {
    doc.status = data.status;
  }

  await doc.save();
  return brandToInterface(doc);
};

const countBrandReferences = async (brandId: string): Promise<number> => {
  const [products, vehicles, services] = await Promise.all([
    Product.countDocuments({ vehicleBrandId: brandId }),
    DealerVehicle.countDocuments({ vehicleBrandId: brandId }),
    Service.countDocuments({ vehicleBrandId: brandId }),
  ]);
  return products + vehicles + services;
};

export const deleteVehicleBrand = async (id: string): Promise<void> => {
  const doc = await VehicleBrand.findById(id);
  if (!doc) {
    throw new NotFoundError('Vehicle brand not found');
  }

  const inUse = await countBrandReferences(id);
  if (inUse > 0) {
    throw new ConflictError('Cannot delete vehicle brand that is in use. Deactivate it instead.');
  }

  const modelCount = await VehicleModel.countDocuments({ brandId: id });
  if (modelCount > 0) {
    throw new ConflictError('Cannot delete vehicle brand with models. Delete or deactivate models first.');
  }

  await VehicleBrand.findByIdAndDelete(id);
  logger.info(`Vehicle brand deleted: ${id}`);
};
