import { VehicleBrand } from '../models/VehicleBrand';
import { VehicleModel } from '../models/VehicleModel';
import { DropdownOption } from '../models/DropdownOption';
import { Category } from '../models/Category';
import { logger } from '../utils/logger';

export interface IDropdownOption {
  label: string;
  value: string;
}

export interface IDropdownResponse {
  vehicleTypes: IDropdownOption[];
  brands: IDropdownOption[];
  models: IDropdownOption[];
  availability: IDropdownOption[];
  fuelTypes: IDropdownOption[];
  transmission: IDropdownOption[];
  condition: IDropdownOption[];
  businessTypes: IDropdownOption[];
  categories: IDropdownOption[];
}

export const getDropdownOptions = async (
  vehicleType?: string,
  brandId?: string,
): Promise<IDropdownResponse> => {
  try {
    // Fetch vehicle types from DropdownOption
    const vehicleTypeOptions = await DropdownOption.find({
      type: 'vehicleType',
      status: 'active',
    })
      .sort({ order: 1 })
      .lean();

    // Fetch brands - filter by vehicleType if provided
    const brandFilter: any = { status: 'active' };
    if (vehicleType) {
      brandFilter.type = vehicleType;
    }
    const brands = await VehicleBrand.find(brandFilter).sort({ name: 1 }).lean();

    // Fetch models - filter by brandId if provided
    const modelFilter: any = { status: 'active' };
    if (brandId) {
      modelFilter.brandId = brandId;
    }
    const models = await VehicleModel.find(modelFilter).sort({ name: 1 }).lean();

    // Fetch availability options
    const availabilityOptions = await DropdownOption.find({
      type: 'availability',
      status: 'active',
    })
      .sort({ order: 1 })
      .lean();

    // Fetch fuel types
    const fuelTypeOptions = await DropdownOption.find({
      type: 'fuelType',
      status: 'active',
    })
      .sort({ order: 1 })
      .lean();

    // Fetch transmission options
    const transmissionOptions = await DropdownOption.find({
      type: 'transmission',
      status: 'active',
    })
      .sort({ order: 1 })
      .lean();

    // Fetch condition options
    const conditionOptions = await DropdownOption.find({
      type: 'condition',
      status: 'active',
    })
      .sort({ order: 1 })
      .lean();

    // Fetch business types
    const businessTypeOptions = await DropdownOption.find({
      type: 'businessType',
      status: 'active',
    })
      .sort({ order: 1 })
      .lean();

    // Fetch categories
    const categories = await Category.find({ status: 'active' }).sort({ name: 1 }).lean();

    // Map to IDropdownOption format
    return {
      vehicleTypes: vehicleTypeOptions.map((opt) => ({
        label: opt.label,
        value: opt.value,
      })),
      brands: brands.map((brand) => ({
        label: brand.name,
        value: (brand._id as any).toString(),
      })),
      models: models.map((model) => ({
        label: model.name,
        value: (model._id as any).toString(),
      })),
      availability: availabilityOptions.map((opt) => ({
        label: opt.label,
        value: opt.value,
      })),
      fuelTypes: fuelTypeOptions.map((opt) => ({
        label: opt.label,
        value: opt.value,
      })),
      transmission: transmissionOptions.map((opt) => ({
        label: opt.label,
        value: opt.value,
      })),
      condition: conditionOptions.map((opt) => ({
        label: opt.label,
        value: opt.value,
      })),
      businessTypes: businessTypeOptions.map((opt) => ({
        label: opt.label,
        value: opt.value,
      })),
      categories: categories.map((category) => ({
        label: category.name,
        value: (category._id as any).toString(),
      })),
    };
  } catch (error) {
    logger.error('Error fetching dropdown options:', error);
    throw error;
  }
};

