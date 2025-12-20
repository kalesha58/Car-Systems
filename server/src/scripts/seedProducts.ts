// CRITICAL: Load environment variables FIRST
import '../config/env';

import { connectDatabase } from '../config/database';
import { Product } from '../models/Product';
import { BusinessRegistration } from '../models/BusinessRegistration';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

interface ISeedProduct {
  name: string;
  brand: string;
  categoryId: string;
  price: number;
  originalPrice?: number;
  stock: number;
  images: string[];
  description?: string;
  vehicleType?: string;
  tags?: string[];
  specifications?: Record<string, any>;
}

/**
 * Sample product data to seed
 * Includes the 5 JSON examples provided plus additional comprehensive products
 */
const seedProducts: ISeedProduct[] = [
  // User-provided examples
  {
    name: 'Car shiner',
    brand: 'Jhonson creek',
    categoryId: '691cc68d3caa39cc5c473e58', // Car Accessories category ID
    price: 650,
    stock: 500,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1766221982/download_4_gwxx9n.jpg',
    ],
    description: 'High-quality car shiner for maintaining your vehicle\'s shine',
    vehicleType: 'Car',
    tags: ['car-care', 'shiner', 'polish'],
    specifications: {
      'Material': 'Premium wax',
      'Size': '500ml',
      'Application': 'All car surfaces',
    },
  },
  {
    name: 'Car shiner',
    brand: 'Jhonson creek',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 650,
    stock: 500,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1766221982/download_4_gwxx9n.jpg',
    ],
    description: 'Professional car shiner for long-lasting shine',
    vehicleType: 'Car',
    tags: ['car-care', 'shiner'],
    specifications: {
      'Material': 'Premium wax',
      'Size': '500ml',
    },
  },
  {
    name: 'Steering covers',
    brand: 'Param Industries',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 300,
    stock: 1000,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1766221966/download_3_uqti1k.jpg',
    ],
    description: 'Comfortable and durable steering wheel covers',
    vehicleType: 'Car',
    tags: ['steering', 'accessories', 'comfort'],
    specifications: {
      'Material': 'Leather',
      'Fit': 'Universal',
      'Colors': 'Multiple available',
    },
  },
  {
    name: 'Car wax product',
    brand: 'Parchetu',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 1,
    stock: 45,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1765994116/car-connect/posts/papdstvjk29rv9uxcvjg.jpg',
    ],
    description: 'Premium car wax for protection and shine',
    vehicleType: 'Bike',
    tags: ['fghjkl', 'wax', 'protection'],
    specifications: {
      'Type': 'Liquid wax',
      'Protection': 'UV resistant',
    },
  },
  {
    name: 'Car side glass',
    brand: 'Toyota',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 2500,
    stock: 19,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1766128234/car-connect/posts/vpde0uefvbpkt0exnrr6.jpg',
    ],
    description: 'Original Toyota side glass replacement',
    vehicleType: 'Car',
    tags: ['glass', 'replacement', 'toyota'],
    specifications: {
      'Compatibility': 'Toyota models',
      'Type': 'Tempered glass',
      'Warranty': '1 year',
    },
  },

  // Additional comprehensive products
  {
    name: 'Premium Car Polish',
    brand: 'Meguiar\'s',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 1200,
    originalPrice: 1500,
    stock: 250,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1766080472/car-connect/posts/xs5dx6dtpgbspnnmowve.png',
    ],
    description: 'Professional-grade car polish for showroom finish',
    vehicleType: 'Car',
    tags: ['polish', 'premium', 'car-care'],
    specifications: {
      'Volume': '500ml',
      'Finish': 'High gloss',
      'Protection': '6 months',
    },
  },
  {
    name: 'Bike Lubricants',
    brand: 'Motul',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 450,
    stock: 300,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1766081206/car-connect/posts/i3rhskuw2s4rycmyegem.jpg',
    ],
    description: 'High-performance chain lubricant for smooth bike operation',
    vehicleType: 'Bike',
    tags: ['lubricant', 'chain', 'maintenance'],
    specifications: {
      'Type': 'Synthetic',
      'Volume': '400ml',
      'Weather': 'All weather',
    },
  },
  {
    name: 'Car Floor Mats',
    brand: '3D MAXpider',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 3500,
    originalPrice: 4200,
    stock: 150,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1766220710/download_2_yvlixo.jpg',
    ],
    description: 'Premium all-weather floor mats with custom fit',
    vehicleType: 'Car',
    tags: ['floor-mats', 'interior', 'protection'],
    specifications: {
      'Material': 'Rubber',
      'Fit': 'Vehicle specific',
      'Warranty': '2 years',
    },
  },
  {
    name: 'Bike Helmet',
    brand: 'Vega',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 2500,
    originalPrice: 3200,
    stock: 80,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1766128104/car-connect/profiles/jtapno0ny9kbglwdeuea.png',
    ],
    description: 'ISI certified bike helmet with ventilation',
    vehicleType: 'Bike',
    tags: ['helmet', 'safety', 'protection'],
    specifications: {
      'Certification': 'ISI',
      'Size': 'Universal',
      'Weight': '1.2kg',
    },
  },
  {
    name: 'Car Air Freshener',
    brand: 'Febreze',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 150,
    stock: 500,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1765304014/car-connect/posts/rkqhzspovysie8c2rg94.png',
    ],
    description: 'Long-lasting car air freshener with pleasant fragrance',
    vehicleType: 'Car',
    tags: ['air-freshener', 'interior', 'fragrance'],
    specifications: {
      'Duration': '30 days',
      'Fragrance': 'Multiple scents',
      'Type': 'Gel-based',
    },
  },
  {
    name: 'Bike Engine Oil',
    brand: 'Castrol',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 550,
    stock: 400,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1765349319/car-connect/profiles/exfjazikfxsqwevbos9i.png',
    ],
    description: 'Premium synthetic engine oil for bikes',
    vehicleType: 'Bike',
    tags: ['engine-oil', 'synthetic', 'maintenance'],
    specifications: {
      'Grade': '10W-40',
      'Volume': '1L',
      'Type': 'Fully synthetic',
    },
  },
  {
    name: 'Car Dashboard Cover',
    brand: 'Coverking',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 1800,
    stock: 120,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1765692021/All-Vehicles_oiikhd.jpg',
    ],
    description: 'Custom-fit dashboard cover to protect from UV rays',
    vehicleType: 'Car',
    tags: ['dashboard', 'protection', 'uv-protection'],
    specifications: {
      'Material': 'Suede',
      'Fit': 'Custom',
      'Color': 'Multiple options',
    },
  },
  {
    name: 'Bike Tyre',
    brand: 'MRF',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 3500,
    originalPrice: 4200,
    stock: 60,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1765821879/4_hogjcz.png',
    ],
    description: 'Premium bike tyre with excellent grip and durability',
    vehicleType: 'Bike',
    tags: ['tyre', 'wheels', 'replacement'],
    specifications: {
      'Size': 'Multiple sizes',
      'Type': 'Tubeless',
      'Warranty': '1 year',
    },
  },
  {
    name: 'Car Seat Covers',
    brand: 'AutoStyle',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 4500,
    originalPrice: 5500,
    stock: 90,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1765821875/2_nbf5kc.png',
    ],
    description: 'Premium leather seat covers for car protection and style',
    vehicleType: 'Car',
    tags: ['seat-covers', 'interior', 'protection'],
    specifications: {
      'Material': 'Leather',
      'Fit': 'Universal',
      'Installation': 'Easy',
    },
  },
  {
    name: 'Bike Battery',
    brand: 'Exide',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 2800,
    stock: 75,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1766221965/images_1_qymmtr.jpg',
    ],
    description: 'Maintenance-free bike battery with long life',
    vehicleType: 'Bike',
    tags: ['battery', 'electrical', 'replacement'],
    specifications: {
      'Capacity': '12V 7Ah',
      'Type': 'Maintenance-free',
      'Warranty': '18 months',
    },
  },
  {
    name: 'Car Wiper Blades',
    brand: 'Bosch',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 800,
    originalPrice: 1000,
    stock: 200,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1766220430/download_1_gwvibr.jpg',
    ],
    description: 'Premium wiper blades for clear visibility in all weather',
    vehicleType: 'Car',
    tags: ['wiper', 'safety', 'replacement'],
    specifications: {
      'Type': 'AeroTwin',
      'Fit': 'Vehicle specific',
      'Warranty': '6 months',
    },
  },
  {
    name: 'Bike Mirrors',
    brand: 'Rynox',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 1200,
    stock: 180,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1766128104/car-connect/profiles/jtapno0ny9kbglwdeuea.png',
    ],
    description: 'Adjustable bike mirrors for better rear visibility',
    vehicleType: 'Bike',
    tags: ['mirrors', 'safety', 'accessories'],
    specifications: {
      'Type': 'Convex',
      'Mounting': 'Handlebar',
      'Adjustable': 'Yes',
    },
  },
  {
    name: 'Car Phone Mount',
    brand: 'iOttie',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 1200,
    originalPrice: 1500,
    stock: 250,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1766220429/images_n2ubtb.jpg',
    ],
    description: 'Strong magnetic phone mount for car dashboard',
    vehicleType: 'Car',
    tags: ['phone-mount', 'accessories', 'convenience'],
    specifications: {
      'Type': 'Magnetic',
      'Compatibility': 'All phones',
      'Installation': 'Dashboard mount',
    },
  },
  {
    name: 'Bike Gloves',
    brand: 'Rynox',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 1500,
    stock: 140,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1766080466/car-connect/posts/flwut9qmhps5lubnmdzr.png',
    ],
    description: 'Riding gloves with palm protection and ventilation',
    vehicleType: 'Bike',
    tags: ['gloves', 'safety', 'riding-gear'],
    specifications: {
      'Material': 'Leather and mesh',
      'Size': 'Multiple sizes',
      'Protection': 'Palm padding',
    },
  },
  {
    name: 'Car Charger',
    brand: 'Anker',
    categoryId: '691cc68d3caa39cc5c473e58',
    price: 800,
    stock: 300,
    images: [
      'https://res.cloudinary.com/dzguxkrky/image/upload/v1766220202/download_jyho59.jpg',
    ],
    description: 'Fast charging car charger with dual USB ports',
    vehicleType: 'Car',
    tags: ['charger', 'electronics', 'accessories'],
    specifications: {
      'Ports': '2 USB',
      'Output': '5V/2.4A',
      'Compatibility': 'All devices',
    },
  },
];

/**
 * Find an existing user/dealer ID from the database
 * Prefers approved dealers, falls back to any business registration
 */
const findUserId = async (): Promise<string | null> => {
  try {
    // First, try to find an approved dealer
    const approvedDealer = await BusinessRegistration.findOne({
      status: 'approved',
    });

    if (approvedDealer && approvedDealer.userId) {
      logger.info(`Found approved dealer with userId: ${approvedDealer.userId}`);
      return approvedDealer.userId;
    }

    // If no approved dealer, try to find any business registration
    const anyDealer = await BusinessRegistration.findOne();

    if (anyDealer && anyDealer.userId) {
      logger.info(`Found dealer (status: ${anyDealer.status}) with userId: ${anyDealer.userId}`);
      return anyDealer.userId;
    }

    logger.warn('No dealer found in database. Products cannot be seeded without a userId.');
    return null;
  } catch (error) {
    logger.error('Error finding userId:', error);
    return null;
  }
};

/**
 * Seed products into the database
 */
const seedProductData = async (): Promise<void> => {
  try {
    logger.info('Starting product data seeding...');

    // Connect to database
    await connectDatabase();
    logger.info('Database connected');

    // Find userId for products
    const userId = await findUserId();

    if (!userId) {
      logger.error('Cannot seed products without a userId. Please ensure there is at least one business registration in the database.');
      return;
    }

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const productData of seedProducts) {
      try {
        // Check if product already exists (by name and brand combination)
        const existingProduct = await Product.findOne({
          name: productData.name,
          brand: productData.brand,
        });

        if (existingProduct) {
          logger.info(`Product "${productData.name}" by "${productData.brand}" already exists, skipping...`);
          skippedCount++;
          continue;
        }

        // Determine status based on stock
        const status = productData.stock > 0 ? 'active' : 'out_of_stock';

        // Create new product
        const product = new Product({
          name: productData.name,
          brand: productData.brand,
          categoryId: productData.categoryId,
          price: productData.price,
          originalPrice: productData.originalPrice,
          stock: productData.stock,
          status: status,
          images: productData.images || [],
          description: productData.description,
          vehicleType: productData.vehicleType,
          tags: productData.tags || [],
          specifications: productData.specifications || {},
          userId: userId,
        });

        await product.save();
        logger.info(`✓ Created product: ${productData.name} by ${productData.brand} (₹${productData.price})`);
        createdCount++;
      } catch (error: any) {
        logger.error(`✗ Error creating product "${productData.name}" by "${productData.brand}":`, error.message);
        errorCount++;
      }
    }

    logger.info('========================================');
    logger.info('Product seeding completed!');
    logger.info(`✓ Created: ${createdCount} products`);
    logger.info(`⊘ Skipped: ${skippedCount} products (already exist)`);
    if (errorCount > 0) {
      logger.warn(`✗ Errors: ${errorCount} products`);
    }
    logger.info('========================================');
  } catch (error) {
    logger.error('Error seeding product data:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  }
};

// Run the seed script
seedProductData().catch((error) => {
  logger.error('Fatal error in seed script:', error);
  process.exit(1);
});
