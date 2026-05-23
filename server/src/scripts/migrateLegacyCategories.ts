/**
 * Migrate legacy Category names to canonical store taxonomy.
 * Repoints Product.categoryId and sets legacy categories to inactive.
 *
 * Run from server/: npm run seed:migrate-categories
 */
import '../config/env';
import { connectDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { migrateLegacyCategoryNames, printCategorySummary } from '../data/storeCategories';
import mongoose from 'mongoose';

const run = async () => {
  try {
    logger.info('Starting legacy category migration...');
    await connectDatabase();
    await migrateLegacyCategoryNames();
    logger.info('✅ Legacy category migration complete');
    await printCategorySummary();
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    process.exit(process.exitCode ?? 0);
  }
};

void run();
