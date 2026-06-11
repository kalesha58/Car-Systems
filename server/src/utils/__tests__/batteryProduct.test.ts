jest.mock('../../models/Category', () => ({
  Category: {
    findById: jest.fn(),
  },
}));

jest.mock('../../models/BatteryType', () => ({
  BatteryType: {
    findById: jest.fn(),
  },
}));

import { Category } from '../../models/Category';
import { BatteryType } from '../../models/BatteryType';
import {
  BATTERY_CATEGORY_NAME,
  isBatteryCategory,
  validateBatteryProductFields,
} from '../batteryProduct';

describe('batteryProduct', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isBatteryCategory', () => {
    it('returns true when category name matches Batteries & Chargers', async () => {
      (Category.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ name: BATTERY_CATEGORY_NAME }),
        }),
      });

      await expect(isBatteryCategory('cat123')).resolves.toBe(true);
    });

    it('returns false for non-battery categories', async () => {
      (Category.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ name: 'Engine Oil' }),
        }),
      });

      await expect(isBatteryCategory('cat123')).resolves.toBe(false);
    });
  });

  describe('validateBatteryProductFields', () => {
    it('requires battery fields for battery category products', async () => {
      (Category.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ name: BATTERY_CATEGORY_NAME }),
        }),
      });

      await expect(
        validateBatteryProductFields({ categoryId: 'cat1', batteryTypeId: undefined, voltageV: undefined }),
      ).rejects.toThrow('Battery type is required');
    });

    it('rejects battery fields on non-battery products', async () => {
      (Category.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ name: 'Engine Oil' }),
        }),
      });

      await expect(
        validateBatteryProductFields({ categoryId: 'cat1', batteryTypeId: 'bt1', voltageV: 12 }),
      ).rejects.toThrow('only allowed for battery category');
    });

    it('accepts valid battery product fields', async () => {
      (Category.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ name: BATTERY_CATEGORY_NAME }),
        }),
      });
      (BatteryType.findById as jest.Mock).mockResolvedValue({ status: 'active' });

      await expect(
        validateBatteryProductFields({ categoryId: 'cat1', batteryTypeId: 'bt1', voltageV: 12 }),
      ).resolves.toBeUndefined();
    });
  });
});
