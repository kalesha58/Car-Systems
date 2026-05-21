/**
 * Seed dealer services + products + Store home category tiles.
 *
 * Required env:
 *   SEED_DEALER_USER_ID — Mongo ObjectId string of an existing dealer user (same as Product.userId / Service.dealerId).
 *
 * Run from server/:   SEED_DEALER_USER_ID='<your24hexid>' npm run seed:all-inventory
 *
 * Loads .env via ../config/env (set SEED_DEALER_USER_ID in .env or export in shell).
 */
import '../config/env';

import { connectDatabase } from '../config/database';
import { Product } from '../models/Product';
import { Service } from '../models/Service';
import { Category } from '../models/Category';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

const DEALER_ID = process.env.SEED_DEALER_USER_ID?.trim();

if (!DEALER_ID) {
  logger.error(
    'Missing SEED_DEALER_USER_ID. Set it to your dealer user ObjectId (see script header), then re-run.',
  );
  process.exit(1);
}

if (!mongoose.Types.ObjectId.isValid(DEALER_ID)) {
  logger.error('SEED_DEALER_USER_ID must be a valid 24-character Mongo ObjectId hex string.');
  process.exit(1);
}

/** Store home tiles: must match client filters by tileGroup */
const STORE_TILE_CATEGORIES: Array<{
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  tileGroup: 'products' | 'vehicles' | 'services';
}> = [
  {
    name: 'Engine Oil & Lubricants',
    description: 'Engine oils and lubricants',
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=400&auto=format&fit=crop',
    sortOrder: 1,
    tileGroup: 'products',
  },
  {
    name: 'Car Care & Maintenance',
    description: 'Car care products',
    imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=400&auto=format&fit=crop',
    sortOrder: 2,
    tileGroup: 'products',
  },
  {
    name: 'Tires & Wheels',
    description: 'Tyres and wheels',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
    sortOrder: 3,
    tileGroup: 'products',
  },
  {
    name: 'Brakes & Suspension',
    description: 'Braking and suspension parts',
    imageUrl: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?q=80&w=400&auto=format&fit=crop',
    sortOrder: 4,
    tileGroup: 'products',
  },
  {
    name: 'Interior Accessories',
    description: 'Interior accessories',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=400&auto=format&fit=crop',
    sortOrder: 11,
    tileGroup: 'vehicles',
  },
  {
    name: 'Lighting & Electrical',
    description: 'Lights and electrics',
    imageUrl: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=400&auto=format&fit=crop',
    sortOrder: 12,
    tileGroup: 'vehicles',
  },
  {
    name: 'Filters & Belts',
    description: 'Filters and belts',
    imageUrl: 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?q=80&w=400&auto=format&fit=crop',
    sortOrder: 13,
    tileGroup: 'vehicles',
  },
  {
    name: 'Batteries & Chargers',
    description: 'Batteries and chargers',
    imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=400&auto=format&fit=crop',
    sortOrder: 14,
    tileGroup: 'vehicles',
  },
  {
    name: 'Performance Parts',
    description: 'Performance upgrades',
    imageUrl: 'https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7?q=80&w=400&auto=format&fit=crop',
    sortOrder: 15,
    tileGroup: 'vehicles',
  },
  {
    name: 'Workshop Tools',
    description: 'Tools and equipment',
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=400&auto=format&fit=crop',
    sortOrder: 21,
    tileGroup: 'services',
  },
  {
    name: 'Detailing & PPF',
    description: 'Detailing and paint protection',
    imageUrl: 'https://images.unsplash.com/photo-1630968319508-626a299664b9?q=80&w=400&auto=format&fit=crop',
    sortOrder: 22,
    tileGroup: 'services',
  },
  {
    name: 'Wash & Valeting',
    description: 'Car wash packages',
    imageUrl: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=400&auto=format&fit=crop',
    sortOrder: 23,
    tileGroup: 'services',
  },
  {
    name: 'Roadside & Tyre Care',
    description: 'Tyre and roadside services',
    imageUrl: 'https://images.unsplash.com/photo-1544133782-b6210f639347?q=80&w=400&auto=format&fit=crop',
    sortOrder: 24,
    tileGroup: 'services',
  },
];

const SERVICES_DATA = [
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
  {
    name: 'Battery Replacement (Amaron)',
    price: 5500,
    durationMinutes: 30,
    homeService: true,
    description: 'New battery installation with warranty and old battery buyback.',
    serviceType: 'battery_service',
    serviceSubCategory: 'new_battery',
    images: ['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1974&auto=format&fit=crop'],
  },
];

/** Store tile category name (must match STORE_TILE_CATEGORIES[].name) for Product.categoryId */
type ProductSeed = {
  storeCategoryName: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  vehicleType: string;
  description: string;
  isSparePart: boolean;
  images: string[];
};

const PRODUCTS_DATA: ProductSeed[] = [
  {
    storeCategoryName: 'Brakes & Suspension',
    name: 'Maruti Suzuki Swift Front Brake Pad',
    brand: 'Maruti Suzuki',
    price: 1850,
    stock: 45,
    vehicleType: 'Car',
    description: 'Genuine brake pad set for Swift and Dzire 2018+ models.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7?q=80&w=2070&auto=format&fit=crop'],
  },
  {
    storeCategoryName: 'Filters & Belts',
    name: 'Hyundai Creta Oil Filter',
    brand: 'Hyundai',
    price: 650,
    stock: 100,
    vehicleType: 'Car',
    description: 'OEM oil filter for Creta and Venue Diesel engines.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1635322966219-b75ed372eb01?q=80&w=2070&auto=format&fit=crop'],
  },
  {
    storeCategoryName: 'Performance Parts',
    name: 'Tata Nexon Clutch Plate Kit',
    brand: 'Tata',
    price: 7200,
    stock: 12,
    vehicleType: 'Car',
    description: 'Genuine clutch and pressure plate assembly for Nexon Revotorq.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop'],
  },
  {
    storeCategoryName: 'Car Care & Maintenance',
    name: 'Honda City Cabin Air Filter',
    brand: 'Honda',
    price: 1100,
    stock: 60,
    vehicleType: 'Car',
    description: 'Activated carbon AC filter for Honda City and Amaze.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop'],
  },
  {
    storeCategoryName: 'Lighting & Electrical',
    name: 'Toyota Innova Crysta Headlamp Bulb',
    brand: 'Toyota',
    price: 2400,
    stock: 25,
    vehicleType: 'Car',
    description: 'High-intensity halogen bulb for Innova main beam.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=2070&auto=format&fit=crop'],
  },
  {
    storeCategoryName: 'Interior Accessories',
    name: 'Hero Splendor Chain Sprocket Kit',
    brand: 'Hero MotoCorp',
    price: 1450,
    stock: 80,
    vehicleType: 'Bike',
    description: 'Complete heavy-duty chain and sprocket set for Hero Splendor.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1558981403-c5f91cbba527?q=80&w=2070&auto=format&fit=crop'],
  },
  {
    storeCategoryName: 'Lighting & Electrical',
    name: 'Bajaj Pulsar 220 Spark Plug (Set of 2)',
    brand: 'Bajaj',
    price: 480,
    stock: 150,
    vehicleType: 'Bike',
    description: 'Twin spark technology plugs for Pulsar series.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1710130168142-d2ec07ed8434?q=80&w=2070&auto=format&fit=crop'],
  },
  {
    storeCategoryName: 'Brakes & Suspension',
    name: 'TVS Apache RTR 160 Front Disc Plate',
    brand: 'TVS',
    price: 2200,
    stock: 35,
    vehicleType: 'Bike',
    description: 'Petal disc rotor for improved heat dissipation and braking.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1611633235555-45e252fe48c8?q=80&w=2070&auto=format&fit=crop'],
  },
  {
    storeCategoryName: 'Performance Parts',
    name: 'Royal Enfield Classic 350 Exhaust Pipe',
    brand: 'Royal Enfield',
    price: 5800,
    stock: 10,
    vehicleType: 'Bike',
    description: 'Chrome finish long bottle silencer for Classic 350.',
    isSparePart: true,
    images: ['https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2070&auto=format&fit=crop'],
  },
];

const seedAllInventory = async () => {
  try {
    logger.info('Starting all-inventory seeding for dealerId=%s', DEALER_ID);

    await connectDatabase();
    logger.info('Database connected');

    for (const row of STORE_TILE_CATEGORIES) {
      await Category.findOneAndUpdate(
        { name: row.name },
        {
          $set: {
            name: row.name,
            description: row.description,
            status: 'active',
            imageUrl: row.imageUrl,
            sortOrder: row.sortOrder,
            tileGroup: row.tileGroup,
          },
        },
        { upsert: true, new: true },
      );
    }
    logger.info('Upserted %s store tile categories', STORE_TILE_CATEGORIES.length);

    let sparePartsCat = await Category.findOne({ name: 'Spare Parts' });
    if (!sparePartsCat) {
      sparePartsCat = new Category({
        name: 'Spare Parts',
        description: 'Automotive replacement components and consumables',
        status: 'active',
        sortOrder: 100,
      });
      await sparePartsCat.save();
      logger.info('Created "Spare Parts" category for product FK');
    } else if (!sparePartsCat.description) {
      sparePartsCat.description = 'Automotive replacement components and consumables';
      sparePartsCat.sortOrder = 100;
      await sparePartsCat.save();
    }
    const sparePartsId = (sparePartsCat._id as mongoose.Types.ObjectId).toString();

    const categoryIdByTileName = new Map<string, string>();
    for (const row of STORE_TILE_CATEGORIES) {
      const doc = await Category.findOne({ name: row.name });
      if (doc) {
        categoryIdByTileName.set(row.name, (doc._id as mongoose.Types.ObjectId).toString());
      }
    }

    const resolveProductCategoryId = (storeCategoryName: string): string => {
      return categoryIdByTileName.get(storeCategoryName) ?? sparePartsId;
    };

    logger.info('Cleaning up old demo services/products for this dealer...');
    await Service.deleteMany({ dealerId: DEALER_ID });
    await Product.deleteMany({ userId: DEALER_ID });
    logger.info('Cleanup complete');

    logger.info('Seeding services...');
    const servicesToInsert = SERVICES_DATA.map((s) => ({
      ...s,
      dealerId: DEALER_ID,
      isActive: true,
    }));
    await Service.insertMany(servicesToInsert);
    logger.info('Seeded %s services', servicesToInsert.length);

    logger.info('Seeding products (categoryId mapped to store tile categories)...');
    const productsToInsert = PRODUCTS_DATA.map((p) => {
      const { storeCategoryName, ...productFields } = p;
      return {
        ...productFields,
        userId: DEALER_ID,
        categoryId: resolveProductCategoryId(storeCategoryName),
        status: 'active' as const,
      };
    });
    await Product.insertMany(productsToInsert);
    logger.info('Seeded %s products', productsToInsert.length);

    logger.info('Seeding process finished successfully');
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(process.exitCode ?? 0);
  }
};

void seedAllInventory();
