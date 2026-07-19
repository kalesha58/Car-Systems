import '../config/env';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { SignUp } from '../models/SignUp';
import { DealerVehicle } from '../models/DealerVehicle';
import { BusinessRegistration } from '../models/BusinessRegistration';

const DEALER_ID = '6a4401b1329162a7e50a017a';

const run = async (): Promise<void> => {
  try {
    logger.info('Starting custom dealer seed...');
    await connectDatabase();

    // 1. Ensure the dealer (Shashank) exists in SignUp collection
    let dealer = await SignUp.findById(DEALER_ID);
    if (!dealer) {
      // Check if duplicate email or phone exists
      const duplicateEmailOrPhone = await SignUp.findOne({
        $or: [{ email: 'sh@gmail.com' }, { phone: '7799054585' }],
      });
      if (duplicateEmailOrPhone) {
        logger.info(`Found existing user with conflicting email/phone, deleting to ensure clean state`);
        await SignUp.deleteOne({ _id: duplicateEmailOrPhone._id });
      }

      dealer = await SignUp.create({
        _id: new mongoose.Types.ObjectId(DEALER_ID),
        name: 'Shashank',
        email: 'sh@gmail.com',
        phone: '7799054585',
        password: 'Password@123', // required
        role: ['dealer'],
        status: 'active',
      });
      logger.info(`Created dealer user: ${dealer.name} (${dealer.email})`);
    } else {
      dealer.name = 'Shashank';
      dealer.email = 'sh@gmail.com';
      dealer.phone = '7799054585';
      dealer.status = 'active';
      if (!dealer.role.includes('dealer')) {
        dealer.role.push('dealer');
      }
      await dealer.save();
      logger.info(`Updated existing dealer user: ${dealer.name} (${dealer.email})`);
    }

    // 2. Ensure BusinessRegistration exists for this dealer
    let business = await BusinessRegistration.findOne({ userId: DEALER_ID });
    if (!business) {
      business = await BusinessRegistration.create({
        userId: DEALER_ID,
        businessName: 'Shashank Motors',
        type: 'Automobile Showroom',
        address: '100 Outer Ring Rd, Marathahalli, Bengaluru, Karnataka 560037',
        phone: '7799054585',
        status: 'approved',
        storeOpen: true,
      });
      logger.info(`Created business registration for Shashank`);
    } else {
      business.businessName = 'Shashank Motors';
      business.type = 'Automobile Showroom';
      business.status = 'approved';
      business.storeOpen = true;
      await business.save();
      logger.info(`Updated existing business registration for Shashank`);
    }

    // 3. Delete existing vehicles of this dealer to seed fresh test drive ones
    await DealerVehicle.deleteMany({ dealerId: DEALER_ID });

    // 4. Seed new vehicles available for test drives
    const vehiclesData = [
      {
        dealerId: DEALER_ID,
        vehicleType: 'Car' as const,
        brand: 'Tesla',
        vehicleModel: 'Model S Plaid',
        year: 2024,
        price: 8900000,
        availability: 'available' as const,
        allowTestDrive: true,
        color: 'Solid Black',
        fuelType: 'Electric' as const,
        transmission: 'Automatic' as const,
        images: [
          'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=1600&auto=format&fit=crop'
        ],
        description: 'Experience 1020 horsepower and 0-60 mph in 1.99 seconds with this ultimate electric sedan. Test drive slots are open to all customers.',
      },
      {
        dealerId: DEALER_ID,
        vehicleType: 'Car' as const,
        brand: 'Porsche',
        vehicleModel: '911 Carrera S',
        year: 2024,
        price: 18400000,
        availability: 'available' as const,
        allowTestDrive: true,
        color: 'Guards Red',
        fuelType: 'Petrol' as const,
        transmission: 'Automatic' as const,
        images: [
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=1600&auto=format&fit=crop'
        ],
        description: 'The benchmark of sports cars. Impeccable handling and high performance engines. Book your test drive now!',
      },
      {
        dealerId: DEALER_ID,
        vehicleType: 'Car' as const,
        brand: 'BMW',
        vehicleModel: 'M4 Competition',
        year: 2023,
        price: 15300000,
        availability: 'available' as const,
        allowTestDrive: true,
        color: 'Portimao Blue',
        fuelType: 'Petrol' as const,
        transmission: 'Automatic' as const,
        images: [
          'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?q=80&w=1600&auto=format&fit=crop'
        ],
        description: 'Bold design meets athletic precision. The twin-turbo straight-six delivers pure excitement. Open for test drive bookings.',
      }
    ];

    const inserted = await DealerVehicle.insertMany(vehiclesData);
    logger.info(`Successfully seeded ${inserted.length} vehicles for Dealer Shashank with allowTestDrive = true`);
    logger.info('========================================');
    logger.info('Seed completed successfully!');
    logger.info('========================================');
  } catch (error) {
    logger.error('Error during custom seeding:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
};

run();
