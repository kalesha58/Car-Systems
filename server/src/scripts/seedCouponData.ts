// CRITICAL: Load environment variables FIRST
import '../config/env';

import {connectDatabase} from '../config/database';
import {Coupon} from '../models/Coupon';
import {logger} from '../utils/logger';
import mongoose from 'mongoose';

interface ISeedCoupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  usageLimit?: number;
}

/**
 * Sample coupon data to seed
 */
const seedCoupons: ISeedCoupon[] = [
  // Low minimum order coupons (for testing with small cart totals)
  {
    code: 'QUICK25',
    discountType: 'fixed',
    discountValue: 25,
    minOrderAmount: 0, // No minimum
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    isActive: true,
    usageLimit: 5000,
  },
  {
    code: 'FLAT10',
    discountType: 'fixed',
    discountValue: 10,
    minOrderAmount: 0, // No minimum
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    isActive: true,
    usageLimit: 10000,
  },
  {
    code: 'SAVE5',
    discountType: 'fixed',
    discountValue: 5,
    minOrderAmount: 0, // No minimum
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
    isActive: true,
    usageLimit: 20000,
  },
  // Percentage-based coupons
  {
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 500,
    maxDiscountAmount: 200,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    isActive: true,
    usageLimit: 1000,
  },
  {
    code: 'SAVE20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 1000,
    maxDiscountAmount: 500,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    isActive: true,
    usageLimit: 500,
  },
  {
    code: 'FLAT50',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 300,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: true,
    usageLimit: 2000,
  },
  {
    code: 'BIGSAVE25',
    discountType: 'percentage',
    discountValue: 25,
    minOrderAmount: 2000,
    maxDiscountAmount: 1000,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    isActive: true,
    usageLimit: 300,
  },
  {
    code: 'FIRST100',
    discountType: 'fixed',
    discountValue: 100,
    minOrderAmount: 500,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    isActive: true,
    usageLimit: 100,
  },
  {
    code: 'WEEKEND15',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 800,
    maxDiscountAmount: 300,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    isActive: true,
    usageLimit: 1000,
  },
  {
    code: 'FLAT200',
    discountType: 'fixed',
    discountValue: 200,
    minOrderAmount: 1500,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
    isActive: true,
    usageLimit: 500,
  },
  {
    code: 'MEGA30',
    discountType: 'percentage',
    discountValue: 30,
    minOrderAmount: 3000,
    maxDiscountAmount: 1500,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: true,
    usageLimit: 200,
  },
  {
    code: 'VIP40',
    discountType: 'percentage',
    discountValue: 40,
    minOrderAmount: 5000,
    maxDiscountAmount: 2000,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    isActive: true,
    usageLimit: 100,
  },
  // Expired coupon (for testing)
  {
    code: 'EXPIRED10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 500,
    validFrom: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    validUntil: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    isActive: false,
    usageLimit: 1000,
  },
  // Inactive coupon
  {
    code: 'INACTIVE15',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 1000,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: false,
    usageLimit: 500,
  },
];

/**
 * Seed coupons into the database
 */
const seedCouponData = async (): Promise<void> => {
  try {
    logger.info('Starting coupon data seeding...');

    // Connect to database
    await connectDatabase();
    logger.info('Database connected');

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const couponData of seedCoupons) {
      try {
        // Check if coupon already exists
        const existingCoupon = await Coupon.findOne({code: couponData.code.toUpperCase()});

        if (existingCoupon) {
          logger.info(`Coupon ${couponData.code} already exists, skipping...`);
          skippedCount++;
          continue;
        }

        // Create new coupon
        const coupon = new Coupon({
          ...couponData,
          code: couponData.code.toUpperCase(),
          usedCount: 0,
        });

        await coupon.save();
        logger.info(`✓ Created coupon: ${couponData.code} (${couponData.discountType === 'percentage' ? `${couponData.discountValue}%` : `₹${couponData.discountValue}`})`);
        createdCount++;
      } catch (error: any) {
        logger.error(`✗ Error creating coupon ${couponData.code}:`, error.message);
        errorCount++;
      }
    }

    logger.info('========================================');
    logger.info('Coupon seeding completed!');
    logger.info(`✓ Created: ${createdCount} coupons`);
    logger.info(`⊘ Skipped: ${skippedCount} coupons (already exist)`);
    if (errorCount > 0) {
      logger.warn(`✗ Errors: ${errorCount} coupons`);
    }
    logger.info('========================================');
  } catch (error) {
    logger.error('Error seeding coupon data:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  }
};

// Run the seed script
seedCouponData().catch((error) => {
  logger.error('Fatal error in seed script:', error);
  process.exit(1);
});

