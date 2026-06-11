import { VehicleModel, IVehicleModelDocument } from '../../models/VehicleModel';
import { VehicleBrand } from '../../models/VehicleBrand';
import { Product } from '../../models/Product';
import { DealerVehicle } from '../../models/DealerVehicle';
import { Service } from '../../models/Service';
import { NotFoundError, ConflictError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export interface IVehicleModel {
  id: string;
  brandId: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface IGetVehicleModelsRequest {
  search?: string;
  status?: 'active' | 'inactive';
}

export interface ICreateVehicleModelRequest {
  name: string;
  status?: 'active' | 'inactive';
}

export interface IUpdateVehicleModelRequest {
  name?: string;
  status?: 'active' | 'inactive';
}

const modelToInterface = (doc: IVehicleModelDocument): IVehicleModel => ({
  id: (doc._id as { toString(): string }).toString(),
  brandId: doc.brandId,
  name: doc.name,
  status: doc.status,
  createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
});

export const getVehicleModelsByBrandId = async (
  brandId: string,
  query: IGetVehicleModelsRequest,
): Promise<IVehicleModel[]> => {
  const brand = await VehicleBrand.findById(brandId);
  if (!brand) {
    throw new NotFoundError('Vehicle brand not found');
  }

  const filter: Record<string, unknown> = { brandId };

  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }

  if (query.status) {
    filter.status = query.status;
  }

  const models = await VehicleModel.find(filter).sort({ name: 1 });
  return models.map(modelToInterface);
};

export const getVehicleModelById = async (id: string): Promise<IVehicleModel> => {
  const doc = await VehicleModel.findById(id);
  if (!doc) {
    throw new NotFoundError('Vehicle model not found');
  }
  return modelToInterface(doc);
};

export const createVehicleModel = async (
  brandId: string,
  data: ICreateVehicleModelRequest,
): Promise<IVehicleModel> => {
  const brand = await VehicleBrand.findById(brandId);
  if (!brand) {
    throw new NotFoundError('Vehicle brand not found');
  }

  const existing = await VehicleModel.findOne({
    brandId,
    name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
  });
  if (existing) {
    throw new ConflictError('Vehicle model with this name already exists for this brand');
  }

  const doc = new VehicleModel({
    brandId,
    name: data.name.trim(),
    status: data.status || 'active',
  });

  await doc.save();
  logger.info(`Vehicle model created: ${doc.name} (brand ${brandId})`);
  return modelToInterface(doc);
};

export const updateVehicleModel = async (
  id: string,
  data: IUpdateVehicleModelRequest,
): Promise<IVehicleModel> => {
  const doc = await VehicleModel.findById(id);
  if (!doc) {
    throw new NotFoundError('Vehicle model not found');
  }

  if (data.name !== undefined) {
    const existing = await VehicleModel.findOne({
      brandId: doc.brandId,
      name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
      _id: { $ne: id },
    });
    if (existing) {
      throw new ConflictError('Vehicle model with this name already exists for this brand');
    }
    doc.name = data.name.trim();
  }

  if (data.status !== undefined) {
    doc.status = data.status;
  }

  await doc.save();
  return modelToInterface(doc);
};

export const deleteVehicleModel = async (id: string): Promise<void> => {
  const doc = await VehicleModel.findById(id);
  if (!doc) {
    throw new NotFoundError('Vehicle model not found');
  }

  const [products, vehicles, services] = await Promise.all([
    Product.countDocuments({ vehicleModelId: id }),
    DealerVehicle.countDocuments({ vehicleModelId: id }),
    Service.countDocuments({ vehicleModelId: id }),
  ]);

  if (products + vehicles + services > 0) {
    throw new ConflictError('Cannot delete vehicle model that is in use. Deactivate it instead.');
  }

  await VehicleModel.findByIdAndDelete(id);
  logger.info(`Vehicle model deleted: ${id}`);
};
