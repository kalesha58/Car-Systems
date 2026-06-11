import { VehicleBrand } from '../models/VehicleBrand';
import { VehicleModel } from '../models/VehicleModel';
import { AppError } from './errorHandler';

export interface IVehicleProductMappingInput {
  vehicleType?: string | null;
  isSparePart?: boolean;
  vehicleBrandId?: string | null;
  vehicleModelId?: string | null;
}

export interface IVehicleBrandModelNames {
  vehicleBrandName?: string;
  vehicleModelName?: string;
}

const isVehicleType = (value?: string | null): value is 'Car' | 'Bike' =>
  value === 'Car' || value === 'Bike';

export const validateVehicleProductMapping = async (
  input: IVehicleProductMappingInput,
): Promise<void> => {
  const requiresMapping = !!input.isSparePart && isVehicleType(input.vehicleType);

  if (requiresMapping) {
    if (!input.vehicleBrandId?.trim()) {
      throw new AppError('Compatible vehicle brand is required for spare parts', 400);
    }

    const brand = await VehicleBrand.findById(input.vehicleBrandId);
    if (!brand || brand.status !== 'active') {
      throw new AppError('Invalid or inactive vehicle brand', 400);
    }

    if (brand.type !== input.vehicleType) {
      throw new AppError('Vehicle brand type does not match product vehicle type', 400);
    }

    if (input.vehicleModelId?.trim()) {
      const model = await VehicleModel.findById(input.vehicleModelId);
      if (!model || model.status !== 'active') {
        throw new AppError('Invalid or inactive vehicle model', 400);
      }
      if (model.brandId !== input.vehicleBrandId) {
        throw new AppError('Vehicle model does not belong to the selected brand', 400);
      }
    }

    return;
  }

  const hasMappingFields =
    !!input.vehicleBrandId?.trim() || !!input.vehicleModelId?.trim();

  if (hasMappingFields) {
    throw new AppError(
      'Vehicle brand and model mapping is only allowed for spare parts with a vehicle type',
      400,
    );
  }
};

export const resolveVehicleBrandModelNames = async (
  vehicleBrandId?: string,
  vehicleModelId?: string,
): Promise<IVehicleBrandModelNames> => {
  const result: IVehicleBrandModelNames = {};

  if (vehicleBrandId) {
    const brand = await VehicleBrand.findById(vehicleBrandId).select('name').lean();
    result.vehicleBrandName = brand?.name;
  }

  if (vehicleModelId) {
    const model = await VehicleModel.findById(vehicleModelId).select('name').lean();
    result.vehicleModelName = model?.name;
  }

  return result;
};

export const resolveVehicleBrandModelStrings = async (
  vehicleBrandId?: string,
  vehicleModelId?: string,
): Promise<{ brand?: string; vehicleModel?: string }> => {
  const names = await resolveVehicleBrandModelNames(vehicleBrandId, vehicleModelId);
  return {
    brand: names.vehicleBrandName,
    vehicleModel: names.vehicleModelName,
  };
};
