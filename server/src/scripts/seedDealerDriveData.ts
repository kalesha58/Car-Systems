// CRITICAL: Load environment variables FIRST
import '../config/env';

import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { SignUp } from '../models/SignUp';
import { DealerVehicle } from '../models/DealerVehicle';
import { TestDrive } from '../models/TestDrive';
import { PreBooking } from '../models/PreBooking';

const DEALER_ID = '69dbc51da6581f3d79d823d3';

type DemoCustomer = {
  name: string;
  email: string;
  phone: string;
};

const DEMO_CUSTOMERS: DemoCustomer[] = [
  { name: 'Arjun Reddy', email: 'arjun.reddy.demo1@gmail.com', phone: '9000001001' },
  { name: 'Nisha Verma', email: 'nisha.verma.demo2@gmail.com', phone: '9000001002' },
  { name: 'Rahul Sharma', email: 'rahul.sharma.demo3@gmail.com', phone: '9000001003' },
  { name: 'Meera Nair', email: 'meera.nair.demo4@gmail.com', phone: '9000001004' },
  { name: 'Vikram Singh', email: 'vikram.singh.demo5@gmail.com', phone: '9000001005' },
];

const addDays = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const ensureDealerExists = async (): Promise<void> => {
  const dealer = await SignUp.findById(DEALER_ID).select('_id role name email');
  if (!dealer) {
    throw new Error(`Dealer not found for id: ${DEALER_ID}`);
  }
  if (!Array.isArray(dealer.role) || !dealer.role.includes('dealer')) {
    logger.warn(
      `User ${DEALER_ID} does not have dealer role. Continuing anyway so you can inspect UI data.`,
    );
  }
  logger.info(`Using dealer: ${dealer.name} (${dealer.email})`);
};

const ensureDemoCustomers = async (): Promise<string[]> => {
  const ids: string[] = [];

  for (const customer of DEMO_CUSTOMERS) {
    let user = await SignUp.findOne({ email: customer.email }).select('_id');

    if (!user) {
      user = await SignUp.create({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        password: 'DemoPass@123',
        role: ['user'],
        status: 'active',
      });
      logger.info(`Created demo customer: ${customer.email}`);
    }

    ids.push((user._id as any).toString());
  }

  return ids;
};

const ensureDealerVehicles = async (): Promise<string[]> => {
  const existing = await DealerVehicle.find({ dealerId: DEALER_ID }).limit(3);

  if (existing.length >= 2) {
    // Make sure at least a couple support test drive.
    await DealerVehicle.updateMany(
      { _id: { $in: existing.slice(0, 2).map((v) => v._id) } },
      { $set: { allowTestDrive: true } },
    );
    return existing.map((v) => (v._id as any).toString());
  }

  const demoVehicles = [
    {
      dealerId: DEALER_ID,
      vehicleType: 'Car' as const,
      brand: 'Hyundai',
      vehicleModel: 'Creta SX',
      year: 2024,
      price: 1850000,
      availability: 'available' as const,
      allowTestDrive: true,
      color: 'White',
      fuelType: 'Petrol' as const,
      transmission: 'Automatic' as const,
      images: ['https://images.unsplash.com/photo-1549399542-7e82138f6f5d?q=80&w=1600&auto=format&fit=crop'],
      description: 'Demo seed vehicle for test drive UI.',
    },
    {
      dealerId: DEALER_ID,
      vehicleType: 'Car' as const,
      brand: 'Kia',
      vehicleModel: 'Seltos GTX',
      year: 2023,
      price: 2090000,
      availability: 'available' as const,
      allowTestDrive: true,
      color: 'Black',
      fuelType: 'Diesel' as const,
      transmission: 'Manual' as const,
      images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop'],
      description: 'Demo seed vehicle for pre-booking UI.',
    },
  ];

  const created = await DealerVehicle.insertMany(demoVehicles);
  logger.info(`Created ${created.length} demo vehicles for dealer`);
  return created.map((v) => (v._id as any).toString());
};

const seedDriveData = async (): Promise<void> => {
  await ensureDealerExists();

  const [customerIds, vehicleIds] = await Promise.all([
    ensureDemoCustomers(),
    ensureDealerVehicles(),
  ]);

  if (vehicleIds.length === 0 || customerIds.length === 0) {
    throw new Error('Cannot seed drive data: missing vehicles or customers');
  }

  // Reset existing seed-like records for this dealer for deterministic results.
  await Promise.all([
    TestDrive.deleteMany({ dealerId: DEALER_ID }),
    PreBooking.deleteMany({ dealerId: DEALER_ID }),
  ]);

  const testDrives = [
    {
      userId: customerIds[0],
      vehicleId: vehicleIds[0],
      dealerId: DEALER_ID,
      preferredDate: addDays(1),
      preferredTime: '11:00',
      status: 'pending' as const,
      notes: 'Interested in city mileage and comfort.',
    },
    {
      userId: customerIds[1],
      vehicleId: vehicleIds[0],
      dealerId: DEALER_ID,
      preferredDate: addDays(2),
      preferredTime: '15:30',
      status: 'approved' as const,
      notes: 'Will visit with family.',
      dealerNotes: 'Confirmed with customer on call.',
    },
    {
      userId: customerIds[2],
      vehicleId: vehicleIds[1] || vehicleIds[0],
      dealerId: DEALER_ID,
      preferredDate: addDays(-1),
      preferredTime: '10:15',
      status: 'completed' as const,
      notes: 'Completed a short highway test.',
      dealerNotes: 'Customer requested finance details.',
    },
  ];

  const preBookings = [
    {
      userId: customerIds[3] || customerIds[0],
      vehicleId: vehicleIds[1] || vehicleIds[0],
      dealerId: DEALER_ID,
      bookingDate: addDays(3),
      status: 'pending' as const,
      notes: 'Wants festive offer details before confirmation.',
    },
    {
      userId: customerIds[4] || customerIds[1],
      vehicleId: vehicleIds[0],
      dealerId: DEALER_ID,
      bookingDate: addDays(5),
      status: 'confirmed' as const,
      notes: 'Advance paid. Awaiting delivery timeline.',
      dealerNotes: 'Reserved stock from showroom inventory.',
    },
    {
      userId: customerIds[2],
      vehicleId: vehicleIds[1] || vehicleIds[0],
      dealerId: DEALER_ID,
      bookingDate: addDays(-2),
      status: 'cancelled' as const,
      notes: 'Customer postponed purchase decision.',
      dealerNotes: 'Will follow up next month.',
    },
  ];

  await Promise.all([TestDrive.insertMany(testDrives), PreBooking.insertMany(preBookings)]);

  // Ensure confirmed pre-bookings reflect reserved inventory status.
  await DealerVehicle.updateOne(
    { _id: preBookings[1].vehicleId, dealerId: DEALER_ID },
    { $set: { availability: 'reserved' } },
  );

  logger.info('========================================');
  logger.info('Dealer drive data seeded successfully');
  logger.info(`Dealer ID: ${DEALER_ID}`);
  logger.info(`Test drives created: ${testDrives.length}`);
  logger.info(`Pre-bookings created: ${preBookings.length}`);
  logger.info('========================================');
};

const run = async (): Promise<void> => {
  try {
    logger.info('Starting dealer drive data seed...');
    await connectDatabase();
    await seedDriveData();
  } catch (error) {
    logger.error('Error seeding dealer drive data:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
};

run();
