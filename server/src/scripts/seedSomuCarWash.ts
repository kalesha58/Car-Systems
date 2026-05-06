// CRITICAL: Load environment variables FIRST
import '../config/env';

import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { SignUp } from '../models/SignUp';
import { Service } from '../models/Service';

const DEALER_ID = '698c263686f9f63c6cbcab9d';

const seedSomuCarWash = async (): Promise<void> => {
  // 1. Ensure Somu user is in DB
  logger.info('Upserting dealer Somu...');
  await SignUp.collection.updateOne(
    { email: 'somu@gmail.com' },
    {
      $set: {
        _id: new mongoose.Types.ObjectId(DEALER_ID),
        name: 'Somu',
        email: 'somu@gmail.com',
        phone: '9988770099',
        password: '$2a$04$180iVaXQGEcE3wap4nCh5.qGdV8MLqw4ouXJew3h0bT4nn4WchpDW',
        role: ['dealer'],
        status: 'active',
        fcmToken: null,
        privacySettings: {
          isPrivate: false,
          hidePhone: false,
          hideEmail: false,
          hideVehicleNumber: false,
        },
        createdAt: new Date('2026-02-11T06:48:22.262Z'),
        updatedAt: new Date('2026-02-11T06:48:22.262Z'),
      },
    },
    { upsert: true }
  );
  logger.info('Dealer Somu seeded successfully.');

  // 2. Clear existing services for this dealer
  await Service.deleteMany({ dealerId: DEALER_ID });

  // 3. Insert new car wash services
  const services = [
    {
      dealerId: DEALER_ID,
      name: 'Basic Exterior Car Wash',
      price: 300,
      durationMinutes: 30,
      homeService: false,
      category: 'Car Wash',
      images: ['https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=1600&auto=format&fit=crop'],
      isActive: true,
      serviceType: 'car_wash',
      vehicleType: 'Car',
      description: 'A thorough exterior wash using premium shampoo, high-pressure water, and tire polishing.'
    },
    {
      dealerId: DEALER_ID,
      name: 'Premium Interior & Exterior Detailing',
      price: 1500,
      durationMinutes: 120,
      homeService: true,
      category: 'Car Detailing',
      images: ['https://images.unsplash.com/photo-1601362840469-51e4d8d58785?q=80&w=1600&auto=format&fit=crop'],
      isActive: true,
      serviceType: 'car_detailing',
      vehicleType: 'Car',
      description: 'Complete interior vacuuming, dashboard polish, stain removal, exterior wash, and waxing.'
    },
    {
      dealerId: DEALER_ID,
      name: 'Bike Premium Wash',
      price: 150,
      durationMinutes: 20,
      homeService: false,
      category: 'Bike Wash',
      images: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1600&auto=format&fit=crop'],
      isActive: true,
      serviceType: 'car_wash',
      vehicleType: 'Bike',
      description: 'Detailed bike wash including chain cleaning, degreasing, and lubrication.'
    },
    {
      dealerId: DEALER_ID,
      name: 'Engine Bay Cleaning',
      price: 500,
      durationMinutes: 45,
      homeService: false,
      category: 'Specialized Service',
      images: ['https://plus.unsplash.com/premium_photo-1661331718043-4a15a8edfb83?q=80&w=1600&auto=format&fit=crop'],
      isActive: true,
      serviceType: 'car_wash',
      vehicleType: 'Car',
      description: 'Safe and thorough cleaning of the engine bay to remove grease, dirt, and dust.'
    }
  ];

  await Service.insertMany(services);
  logger.info(`Seeded ${services.length} car wash services for dealer Somu.`);
};

const run = async (): Promise<void> => {
  try {
    logger.info('Starting Somu car wash seed...');
    await connectDatabase();
    await seedSomuCarWash();
  } catch (error) {
    logger.error('Error seeding Somu car wash data:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
};

run();
