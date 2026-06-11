import { Category } from '../models/Category';
import { BatteryType } from '../models/BatteryType';
import { AppError } from './errorHandler';

export const BATTERY_CATEGORY_NAME = 'Batteries & Chargers';

const MIN_VOLTAGE_V = 1;
const MAX_VOLTAGE_V = 120;

export const isBatteryCategory = async (categoryId: string): Promise<boolean> => {
  if (!categoryId?.trim()) {
    return false;
  }

  const category = await Category.findById(categoryId).select('name').lean();
  if (category) {
    return category.name === BATTERY_CATEGORY_NAME;
  }

  return categoryId.trim() === BATTERY_CATEGORY_NAME;
};

export interface IBatteryProductFieldInput {
  categoryId: string;
  batteryTypeId?: string | null;
  voltageV?: number | null;
}

export const validateBatteryProductFields = async (
  input: IBatteryProductFieldInput,
): Promise<void> => {
  const isBattery = await isBatteryCategory(input.categoryId);

  if (isBattery) {
    if (!input.batteryTypeId?.trim()) {
      throw new AppError('Battery type is required for battery products', 400);
    }

    const batteryType = await BatteryType.findById(input.batteryTypeId);
    if (!batteryType || batteryType.status !== 'active') {
      throw new AppError('Invalid or inactive battery type', 400);
    }

    if (input.voltageV === undefined || input.voltageV === null) {
      throw new AppError('Voltage (V) is required for battery products', 400);
    }

    if (!Number.isFinite(input.voltageV) || input.voltageV < MIN_VOLTAGE_V || input.voltageV > MAX_VOLTAGE_V) {
      throw new AppError(`Voltage must be between ${MIN_VOLTAGE_V} and ${MAX_VOLTAGE_V}`, 400);
    }

    return;
  }

  const hasBatteryFields =
    !!input.batteryTypeId || (input.voltageV !== undefined && input.voltageV !== null);

  if (hasBatteryFields) {
    throw new AppError('Battery type and voltage are only allowed for battery category products', 400);
  }
};

export const resolveBatteryTypeName = async (batteryTypeId?: string): Promise<string | undefined> => {
  if (!batteryTypeId) {
    return undefined;
  }

  const batteryType = await BatteryType.findById(batteryTypeId).select('name').lean();
  return batteryType?.name;
};
