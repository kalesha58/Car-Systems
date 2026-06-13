import '../config/env';
import { connectDatabase } from '../config/database';
import { ProductBrand } from '../models/ProductBrand';
import { logger } from '../utils/logger';

const DEFAULT_PRODUCT_BRANDS = [
  { name: 'Castrol', sortOrder: 1 },
  { name: 'Motul', sortOrder: 2 },
  { name: 'Shell', sortOrder: 3 },
  { name: 'Mobil', sortOrder: 4 },
  { name: 'Valvoline', sortOrder: 5 },
  { name: 'Total', sortOrder: 6 },
  { name: 'Gulf', sortOrder: 7 },
  { name: 'Exide', sortOrder: 8 },
  { name: 'Amaron', sortOrder: 9 },
  { name: 'Bosch', sortOrder: 10 },
  { name: 'Mann Filter', sortOrder: 11 },
  { name: 'K&N', sortOrder: 12 },
  { name: 'TVS', sortOrder: 13 },
  { name: 'Generic/OEM', sortOrder: 14 },
  { name: 'MRF', sortOrder: 15 },
  { name: 'CEAT', sortOrder: 16 },
  { name: 'Apollo', sortOrder: 17 },
  { name: 'Bridgestone', sortOrder: 18 },
  { name: 'Michelin', sortOrder: 19 },
  { name: 'Yokohama', sortOrder: 20 },
  { name: 'JK Tyre', sortOrder: 21 },
  { name: "Meguiar's", sortOrder: 22 },
  { name: '3M', sortOrder: 23 },
  { name: 'Vega', sortOrder: 24 },
  { name: 'Febreze', sortOrder: 25 },
  { name: 'AutoStyle', sortOrder: 26 },
  { name: 'Coverking', sortOrder: 27 },
  { name: 'iOttie', sortOrder: 28 },
  { name: 'Anker', sortOrder: 29 },
  { name: 'Rynox', sortOrder: 30 },
  { name: 'Philips', sortOrder: 31 },
  { name: 'Osram', sortOrder: 32 },
  { name: '3D MAXpider', sortOrder: 33 },
  { name: 'Other', sortOrder: 99 },
];

const seedProductBrands = async (): Promise<void> => {
  for (const item of DEFAULT_PRODUCT_BRANDS) {
    const existing = await ProductBrand.findOne({ name: item.name });
    if (!existing) {
      await ProductBrand.create({
        name: item.name,
        status: 'active',
        sortOrder: item.sortOrder,
      });
      logger.info(`Seeded product brand: ${item.name}`);
    }
  }
};

const run = async (): Promise<void> => {
  await connectDatabase();
  await seedProductBrands();
  logger.info('Product brands seed complete');
  process.exit(0);
};

run().catch((error) => {
  logger.error('Product brands seed failed:', error);
  process.exit(1);
});
