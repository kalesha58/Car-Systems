// CRITICAL: Load environment variables FIRST
import '../config/env';

import { connectDatabase } from '../config/database';
import { DropdownOption } from '../models/DropdownOption';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

interface IVehicleType {
  label: string;
  value: string;
  order: number;
}

const vehicleTypes: IVehicleType[] = [
  {
    label: 'Car',
    value: 'Car',
    order: 1,
  },
  {
    label: 'Bike',
    value: 'Bike',
    order: 2,
  },
  {
    label: 'Bus',
    value: 'Bus',
    order: 3,
  },
  {
    label: 'Trucks',
    value: 'Trucks',
    order: 4,
  },
  {
    label: 'Auto',
    value: 'Auto',
    order: 5,
  },
];

/**
 * Seed vehicle types
 */
const seedVehicleTypes = async (): Promise<void> => {
  logger.info('Seeding vehicle types...');

  for (const vehicleType of vehicleTypes) {
    try {
      // Check if vehicle type already exists
      const existing = await DropdownOption.findOne({
        type: 'vehicleType',
        value: vehicleType.value,
      });

      if (!existing) {
        const newVehicleType = new DropdownOption({
          type: 'vehicleType',
          label: vehicleType.label,
          value: vehicleType.value,
          order: vehicleType.order,
          status: 'active',
        });
        await newVehicleType.save();
        logger.info(`Created vehicle type: ${vehicleType.label} (${vehicleType.value})`);
      } else {
        // Update existing if order or label changed
        if (existing.order !== vehicleType.order || existing.label !== vehicleType.label) {
          existing.order = vehicleType.order;
          existing.label = vehicleType.label;
          existing.status = 'active'; // Ensure it's active
          await existing.save();
          logger.info(`Updated vehicle type: ${vehicleType.label} (${vehicleType.value})`);
        } else {
          logger.info(`Vehicle type already exists: ${vehicleType.label} (${vehicleType.value})`);
        }
      }
    } catch (error: any) {
      // Handle duplicate key error (unique index)
      if (error.code === 11000) {
        logger.warn(`Vehicle type ${vehicleType.value} already exists, skipping...`);
      } else {
        logger.error(`Error seeding vehicle type ${vehicleType.value}:`, error);
        throw error;
      }
    }
  }

  logger.info(`Seeded ${vehicleTypes.length} vehicle types`);
};

/**
 * Main seed function
 */
const seedData = async (): Promise<void> => {
  try {
    logger.info('Starting vehicle types seeding...');

    // Connect to database
    await connectDatabase();
    logger.info('Database connected');

    // Seed vehicle types
    await seedVehicleTypes();

    logger.info('Vehicle types seeding completed successfully!');
  } catch (error) {
    logger.error('Error seeding vehicle types:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  }
};

// Run the seed script
seedData().catch((error) => {
  logger.error('Fatal error in seed script:', error);
  process.exit(1);
});
