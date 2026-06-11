import '../config/env';
import { connectDatabase } from '../config/database';
import { BatteryType } from '../models/BatteryType';
import { logger } from '../utils/logger';

const DEFAULT_BATTERY_TYPES = [
  { name: 'Lead Acid', sortOrder: 1 },
  { name: 'Lithium-ion', sortOrder: 2 },
];

const seedBatteryTypes = async (): Promise<void> => {
  for (const item of DEFAULT_BATTERY_TYPES) {
    const existing = await BatteryType.findOne({ name: item.name });
    if (!existing) {
      await BatteryType.create({
        name: item.name,
        status: 'active',
        sortOrder: item.sortOrder,
      });
      logger.info(`Seeded battery type: ${item.name}`);
    }
  }
};

const run = async (): Promise<void> => {
  await connectDatabase();
  await seedBatteryTypes();
  logger.info('Battery types seed complete');
  process.exit(0);
};

run().catch((error) => {
  logger.error('Battery types seed failed:', error);
  process.exit(1);
});
