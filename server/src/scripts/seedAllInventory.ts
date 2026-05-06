// CRITICAL: Load environment variables FIRST
import '../config/env';

import { connectDatabase } from '../config/database';
import { Product } from '../models/Product';
import { Service } from '../models/Service';
import { Category } from '../models/Category';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

const ADMIN_ID = '691cbd8a12e389e1bbf08b7f';

const SERVICES_DATA = [
  // --- Car Service (serviceType: car_automobile, vehicleType: Car) ---
  {
    name: 'Comprehensive Car Checkup',
    price: 1500,
    durationMinutes: 90,
    homeService: false,
    description: 'Full vehicle diagnostics including engine, brakes, suspension, and fluids.',
    serviceType: 'car_automobile',
    vehicleType: 'Car',
    serviceSubCategory: 'general_checkup',
    images: ['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=2070&auto=format&fit=crop'],
  },
  {
    name: 'Fully Synthetic Oil Change',
    price: 4500,
    durationMinutes: 45,
    homeService: true,
    description: 'Oil and filter change with 5W-40 fully synthetic oil. Mobile service available.',
    serviceType: 'car_automobile',
    vehicleType: 'Car',
    serviceSubCategory: 'oil_change',
    images: ['https://images.unsplash.com/photo-1599256621730-535171e28e50?q=80&w=2071&auto=format&fit=crop'],
  },
  {
    name: 'Car Electrical System Repair',
    price: 1200,
    durationMinutes: 60,
    homeService: false,
    description: 'Troubleshooting and repair of wiring, lights, and sensors.',
    serviceType: 'car_automobile',
    vehicleType: 'Car',
    serviceSubCategory: 'electrical_work',
    images: ['https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2101&auto=format&fit=crop'],
  },
  {
    name: 'Car Body & Paint Repair',
    price: 8000,
    durationMinutes: 1440,
    homeService: false,
    description: 'Professional denting and painting for exterior body panels.',
    serviceType: 'car_automobile',
    vehicleType: 'Car',
    serviceSubCategory: 'exterior_work',
    images: ['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1974&auto=format&fit=crop'],
  },

  // --- Bike Service (serviceType: bike_automobile, vehicleType: Bike) ---
  {
    name: 'Full Bike General Service',
    price: 650,
    durationMinutes: 120,
    homeService: false,
    description: 'Complete servicing including chain lubrication, brake adjustment, and tuning.',
    serviceType: 'bike_automobile',
    vehicleType: 'Bike',
    serviceSubCategory: 'general_checkup',
    images: ['https://images.unsplash.com/photo-1558981403-c5f91cbba527?q=80&w=2070&auto=format&fit=crop'],
  },
  {
    name: 'Bike Oil & Filter Change',
    price: 1800,
    durationMinutes: 30,
    homeService: true,
    description: 'Castrol Power1 engine oil change with OEM filter.',
    serviceType: 'bike_automobile',
    vehicleType: 'Bike',
    serviceSubCategory: 'oil_change',
    images: ['https://images.unsplash.com/photo-1601633333333-333333333333?q=80&w=2070&auto=format&fit=crop'],
  },

  // --- Vehicle Wash (serviceType: car_wash) ---
  {
    name: 'Basic Exterior Car Wash',
    price: 400,
    durationMinutes: 30,
    homeService: false,
    description: 'Foam wash, pressure drying, and tyre polishing.',
    serviceType: 'car_wash',
    serviceSubCategory: 'exterior_wash',
    servicePackage: 'basic',
    images: ['https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=2061&auto=format&fit=crop'],
  },
  {
    name: 'Premium Full Vehicle Wash',
    price: 1200,
    durationMinutes: 90,
    homeService: true,
    description: 'Deep foam wash, interior vacuuming, dashboard polish, and steam cleaning.',
    serviceType: 'car_wash',
    serviceSubCategory: 'interior_wash',
    servicePackage: 'premium',
    images: ['https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=2071&auto=format&fit=crop'],
  },

  // --- Tyre Service (serviceType: tire_service) ---
  {
    name: 'Tubeless Puncture Fix',
    price: 250,
    durationMinutes: 15,
    homeService: true,
    description: 'Quick roadside repair for tyre punctures.',
    serviceType: 'tire_service',
    serviceSubCategory: 'puncture',
    images: ['https://images.unsplash.com/photo-1544133782-b6210f639347?q=80&w=1974&auto=format&fit=crop'],
  },
  {
    name: 'Set of 4 New Tyres - Fitting',
    price: 18000,
    durationMinutes: 60,
    homeService: false,
    description: 'Replacement of all 4 tyres with wheel balancing and alignment.',
    serviceType: 'tire_service',
    serviceSubCategory: 'new_tyre',
    images: ['https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=2000&auto=format&fit=crop'],
  },

  // --- PPF & Detailing (serviceType: car_detailing) ---
  {
    name: 'Ceramic Coating - Gold',
    price: 25000,
    durationMinutes: 1440,
    homeService: false,
    description: '9H Ceramic coating with 3-year durability and high gloss.',
    serviceType: 'car_detailing',
    serviceSubCategory: 'ceramic_coating',
    images: ['https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2101&auto=format&fit=crop'],
  },
  {
    name: 'Professional Waxing & Polish',
    price: 3500,
    durationMinutes: 180,
    homeService: true,
    description: 'High-quality Carnauba wax polish for deep wet-look shine.',
    serviceType: 'car_detailing',
    serviceSubCategory: 'waxing',
    images: ['https://images.unsplash.com/photo-1630968319508-626a299664b9?q=80&w=2000&auto=format&fit=crop'],
  },

  // --- Battery Service (serviceType: battery_service) ---
  {
    name: 'Battery Replacement (Amaron)',
    price: 5500,
    durationMinutes: 30,
    homeService: true,
    description: 'New battery installation with warranty and old battery buyback.',
    serviceType: 'battery_service',
    serviceSubCategory: 'new_battery',
    images: ['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1974&auto=format&fit=crop'],
  }
];

const PRODUCTS_DATA = [
  // --- Maruti ---
  {
    name: 'Maruti Suzuki Swift Front Brake Pad',
    brand: 'Maruti Suzuki',
    price: 1850,
    stock: 45,
    vehicleType: 'Car',
    description: 'Genuine brake pad set for Swift and Dzire 2018+ models.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7?q=80&w=2070&auto=format&fit=crop'],
  },
  // --- Hyundai ---
  {
    name: 'Hyundai Creta Oil Filter',
    brand: 'Hyundai',
    price: 650,
    stock: 100,
    vehicleType: 'Car',
    description: 'OEM oil filter for Creta and Venue Diesel engines.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1635322966219-b75ed372eb01?q=80&w=2070&auto=format&fit=crop'],
  },
  // --- Tata ---
  {
    name: 'Tata Nexon Clutch Plate Kit',
    brand: 'Tata',
    price: 7200,
    stock: 12,
    vehicleType: 'Car',
    description: 'Genuine clutch and pressure plate assembly for Nexon Revotorq.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop'],
  },
  // --- Honda (Car) ---
  {
    name: 'Honda City Cabin Air Filter',
    brand: 'Honda',
    price: 1100,
    stock: 60,
    vehicleType: 'Car',
    description: 'Activated carbon AC filter for Honda City and Amaze.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop'],
  },
  // --- Toyota ---
  {
    name: 'Toyota Innova Crysta Headlamp Bulb',
    brand: 'Toyota',
    price: 2400,
    stock: 25,
    vehicleType: 'Car',
    description: 'High-intensity halogen bulb for Innova main beam.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=2070&auto=format&fit=crop'],
  },

  // --- Hero (Bike) ---
  {
    name: 'Hero Splendor Chain Sprocket Kit',
    brand: 'Hero MotoCorp',
    price: 1450,
    stock: 80,
    vehicleType: 'Bike',
    description: 'Complete heavy-duty chain and sprocket set for Hero Splendor.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1558981403-c5f91cbba527?q=80&w=2070&auto=format&fit=crop'],
  },
  // --- Bajaj ---
  {
    name: 'Bajaj Pulsar 220 Spark Plug (Set of 2)',
    brand: 'Bajaj',
    price: 480,
    stock: 150,
    vehicleType: 'Bike',
    description: 'Twin spark technology plugs for Pulsar series.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1710130168142-d2ec07ed8434?q=80&w=2070&auto=format&fit=crop'],
  },
  // --- TVS ---
  {
    name: 'TVS Apache RTR 160 Front Disc Plate',
    brand: 'TVS',
    price: 2200,
    stock: 35,
    vehicleType: 'Bike',
    description: 'Petal disc rotor for improved heat dissipation and braking.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1611633235555-45e252fe48c8?q=80&w=2070&auto=format&fit=crop'],
  },
  // --- Royal Enfield ---
  {
    name: 'Royal Enfield Classic 350 Exhaust Pipe',
    brand: 'Royal Enfield',
    price: 5800,
    stock: 10,
    vehicleType: 'Bike',
    description: 'Chrome finish long bottle silencer for Classic 350.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2070&auto=format&fit=crop'],
  }
];


const seedAllInventory = async () => {
  try {
    logger.info('🚀 Starting all-inventory seeding...');

    await connectDatabase();
    logger.info('📦 Database connected');

    // 1. Get or create Spare Parts category
    let sparePartsCat = await Category.findOne({ name: 'Spare Parts' });
    if (!sparePartsCat) {
      sparePartsCat = new Category({
        name: 'Spare Parts',
        description: 'Automotive replacement components and consumables',
        status: 'active',
      });
      await sparePartsCat.save();
      logger.info('✅ Created "Spare Parts" category');
    }
    const sparePartsId = (sparePartsCat._id as any).toString();

    // 2. Clean up existing demo data for this admin
    logger.info('🧹 Cleaning up old demo data...');
    await Service.deleteMany({ dealerId: ADMIN_ID });
    await Product.deleteMany({ userId: ADMIN_ID });
    logger.info('✅ Cleanup complete');

    // 3. Seed Services
    logger.info('⚙️ Seeding Services...');
    const servicesToInsert = SERVICES_DATA.map(s => ({
      ...s,
      dealerId: ADMIN_ID,
      isActive: true,
    }));
    await Service.insertMany(servicesToInsert);
    logger.info(`✅ Seeded ${servicesToInsert.length} services`);

    // 4. Seed Products
    logger.info('🛠️ Seeding Products...');
    const productsToInsert = PRODUCTS_DATA.map(p => ({
      ...p,
      userId: ADMIN_ID,
      categoryId: sparePartsId,
      status: 'active',
    }));
    await Product.insertMany(productsToInsert);
    logger.info(`✅ Seeded ${productsToInsert.length} products`);

    logger.info('✨ Seeding process finished successfully!');
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('🔌 Database connection closed');
    process.exit(0);
  }
};

seedAllInventory();
