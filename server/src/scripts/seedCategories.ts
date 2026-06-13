/**
 * Seed Store Home Category Tiles
 *
 * Upserts canonical store categories from src/data/storeCategories.ts.
 * Category names MUST match server/src/data/storeCategories.ts.
 * Image URLs are written to Mongo (setTileImageUrls: true).
 *
 * Run from server/: npm run seed:categories
 */
import '../config/env';
import { connectDatabase } from '../config/database';
import { logger } from '../utils/logger';
import {
  printCategorySummary,
  upsertStoreCategories,
} from '../data/storeCategories';
import mongoose from 'mongoose';

const seedCategories = async () => {
  try {
    logger.info('Starting category seeding...');
    await connectDatabase();
    logger.info('Database connected');

    const { tileCount } = await upsertStoreCategories({ setTileImageUrls: true });
    logger.info('✅ Category seeding complete. Tiles upserted: %d (+ Spare Parts)', tileCount);

    await printCategorySummary();
  } catch (error) {
    logger.error('Category seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(process.exitCode ?? 0);
  }
};

void seedCategories();
