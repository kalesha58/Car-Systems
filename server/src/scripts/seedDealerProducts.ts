// CRITICAL: Load environment variables FIRST
import '../config/env';

import { connectDatabase } from '../config/database';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

const DEALER_ID = '699aacb226a1ea5cb18dac0b';

/**
 * Data for seeding categories and products with high-quality, verified working images
 */
const categoriesAndProducts = [
  {
    category: {
      name: 'Car Care',
      description: 'Premium cleaning and maintenance products for your vehicle',
    },
    products: [
      {
        name: 'Aurora Gold Carnauba Wax',
        brand: 'Aurora',
        price: 2450,
        stock: 85,
        images: ['https://images.unsplash.com/photo-1630968319508-626a299664b9?q=80&w=2000&auto=format&fit=crop'],
        description: 'Luxury automotive wax featuring Grade-1 Carnauba for a deep, wet-look shine and long-lasting protection.',
        vehicleType: 'Car',
        tags: ['car-care', 'wax', 'premium', 'shine'],
        specifications: {
          'Material': 'Grade-1 Carnauba',
          'Volume': '200g',
          'Durability': 'Up to 6 months',
        },
      },
      {
        name: 'Aether Pro Ceramic Coating Kit',
        brand: 'Aurora Coatings',
        price: 8500,
        stock: 30,
        images: ['https://images.unsplash.com/photo-1711513503808-53380d724182?q=80&w=2000&auto=format&fit=crop'],
        description: 'Professional-grade 9H ceramic coating providing extreme hydrophobicity and chemical resistance.',
        vehicleType: 'Car',
        tags: ['detailing', 'ceramic-coating', 'protection'],
        specifications: {
          'Hardness': '9H',
          'Volume': '50ml',
          'Longevity': '2 Years',
        },
      },
    ],
  },
  {
    category: {
      name: 'Interior Accessories',
      description: 'Enhance your driving comfort and interior aesthetics',
    },
    products: [
      {
        name: 'Heritage Tan Diamond Floor Mats',
        brand: 'LuxuryLiner',
        price: 4800,
        stock: 45,
        images: ['https://images.unsplash.com/photo-1761846786526-706cf7015afb?q=80&w=2000&auto=format&fit=crop'],
        description: 'Custom-fit 5D diamond-stitched floor mats in premium synthetic tan leather for a sophisticated look.',
        vehicleType: 'Car',
        tags: ['interior', 'mats', 'luxury'],
        specifications: {
          'Material': 'PU Leather',
          'Fit': 'Custom-fit',
          'Waterproof': 'Yes',
        },
      },
      {
        name: 'Titan-12 Android Infotainment System',
        brand: 'TitanTech',
        price: 18500,
        stock: 20,
        images: ['https://images.unsplash.com/photo-1773065558261-792b9d779fb1?q=80&w=2000&auto=format&fit=crop'],
        description: 'Large 12-inch high-definition Android screen with Wireless CarPlay and Android Auto integration.',
        vehicleType: 'Car',
        tags: ['electronics', 'dashboard', 'android', 'gps'],
        specifications: {
          'Screen Size': '12-inch',
          'OS': 'Android 12',
          'RAM': '4GB',
          'Storage': '64GB',
        },
      },
    ],
  },
  {
    category: {
      name: 'Exterior Accessories',
      description: 'Style and aerodynamic upgrades for your vehicle',
    },
    products: [
      {
        name: 'Gloss Carbon Fiber Front Grille',
        brand: 'SportMod',
        price: 7200,
        stock: 15,
        images: ['https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=2000&auto=format&fit=crop'],
        description: 'Authentic 3K twill weave carbon fiber front grille with UV-resistant high gloss clear coat.',
        vehicleType: 'Car',
        tags: ['exterior', 'carbon-fiber', 'sport', 'aerodynamic'],
        specifications: {
          'Material': 'Carbon Fiber',
          'Finish': 'Glossy',
          'Weave': '3K Twill',
        },
      },
    ],
  },
  {
    category: {
      name: 'Spare Parts',
      description: 'Essential replacement parts for vehicle reliability',
    },
    products: [
      {
        name: 'Iridium Performance Spark Plugs',
        brand: 'NGK Pro',
        price: 3200,
        stock: 120,
        images: ['https://images.unsplash.com/photo-1710130168142-d2ec07ed8434?q=80&w=2000&auto=format&fit=crop'],
        description: 'High-performance iridium spark plugs designed for better ignition and fuel efficiency.',
        vehicleType: 'Car',
        tags: ['engine', 'sparks', 'maintenance'],
        specifications: {
          'Material': 'Iridium',
          'Pack Size': '4 Plugs',
          'Durability': '100,000 miles',
        },
      },
    ],
  },
  {
    category: {
      name: 'Lighting',
      description: 'Advanced automotive lighting solutions',
    },
    products: [
      {
        name: 'UltraBeam LED Headlight Assembly',
        brand: 'UltraBeam',
        price: 22000,
        stock: 10,
        images: ['https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=2000&auto=format&fit=crop'],
        description: 'Full LED headlight replacement with integrated DRL and sequential indicators.',
        vehicleType: 'Car',
        tags: ['lighting', 'led', 'safety'],
        specifications: {
          'Technology': 'LED',
          'Color Temp': '6000K',
          'Brightness': '12,000 Lumens',
        },
      },
    ],
  },
  {
    category: {
      name: 'Tyres & Wheels',
      description: 'Performance tyres and stylish alloy wheels',
    },
    products: [
      {
        name: 'Stealth-9 Matte Black Alloy Rim',
        brand: 'ForgedFlow',
        price: 45000,
        stock: 12,
        images: ['https://images.unsplash.com/photo-1611633235555-45e252fe48c8?q=80&w=2000&auto=format&fit=crop'],
        description: 'Lightweight 19-inch forged alloy wheels with a stealth matte black finish and multi-spoke design.',
        vehicleType: 'Car',
        tags: ['wheels', 'alloy', 'custom', 'rims'],
        specifications: {
          'Diameter': '19-inch',
          'Finish': 'Matte Black',
          'Material': 'Forged Aluminum',
          'Set Size': '4 Wheels',
        },
      },
    ],
  },
];

/**
 * Seed data into the database
 */
const seedDealerProducts = async (): Promise<void> => {
  try {
    logger.info('Starting REVISED dealer product seeding with verified images...');

    // Connect to database
    await connectDatabase();
    logger.info('Database connected');

    // 1. DELETE existing products for this dealer to ensure a clean state
    logger.info(`Cleaning up existing products for dealer: ${DEALER_ID}...`);
    const deleteResult = await Product.deleteMany({ userId: DEALER_ID });
    logger.info(`✓ Successfully deleted ${deleteResult.deletedCount} existing products.`);

    let createdProductsCount = 0;

    for (const item of categoriesAndProducts) {
      // 1. Find or create category
      let category = await Category.findOne({ name: item.category.name });
      
      if (!category) {
        category = new Category({
          name: item.category.name,
          description: item.category.description,
          status: 'active',
        });
        await category.save();
        logger.info(`✓ Created category: ${item.category.name}`);
      } else {
        logger.info(`- Category exists: ${item.category.name}`);
      }

      const categoryId = (category._id as any).toString();

      // 2. Create products for this category
      for (const productData of item.products) {
        const product = new Product({
          ...productData,
          categoryId: categoryId,
          userId: DEALER_ID,
          status: 'active',
        });

        await product.save();
        logger.info(`  ✓ Created product: ${productData.name}`);
        createdProductsCount++;
      }
    }

    logger.info('========================================');
    logger.info('Revised Seeding completed successfully!');
    logger.info(`✓ Total Created: ${createdProductsCount} premium products for dealer ${DEALER_ID}`);
    logger.info('========================================');

  } catch (error) {
    logger.error('Error in revised seeding:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  }
};

// Run the script
seedDealerProducts().catch((error) => {
  logger.error('Fatal error in revised seed script:', error);
  process.exit(1);
});
