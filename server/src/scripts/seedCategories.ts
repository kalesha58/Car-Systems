/**
 * Seed Store Home Category Tiles
 *
 * Upserts all categories that power the three tile rows on the customer Store home:
 *   - Product Categories   (tileGroup: 'products')
 *   - Vehicle Categories   (tileGroup: 'vehicles')
 *   - Service Categories   (tileGroup: 'services')
 *
 * Category names MUST match the keys in STATIC_CATEGORY_IMAGES (Content.tsx)
 * so the client's static image fallback fires correctly.
 *
 * Run from server/:
 *   npm run seed:categories
 *   — or —
 *   /usr/local/bin/node node_modules/.bin/ts-node src/scripts/seedCategories.ts
 */
import '../config/env';
import { connectDatabase } from '../config/database';
import { Category } from '../models/Category';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

// ─── Category Definitions ─────────────────────────────────────────────────────
// imageUrl is intentionally left empty so the client-side static fallback image
// (bundled PNG in @assets/categories/) is used automatically.
// You can later fill imageUrl with a CDN link to override the bundled image.

const CATEGORIES: Array<{
  name: string;
  description: string;
  tileGroup: 'products' | 'vehicles' | 'services';
  sortOrder: number;
  imageUrl?: string;
}> = [
  // ── Product Categories ──────────────────────────────────────────────────────
  {
    name: 'Engine Oil & Lubricants',
    description: 'Motor oils, engine lubricants, gear oils and transmission fluids for cars and bikes.',
    tileGroup: 'products',
    sortOrder: 1,
  },
  {
    name: 'Car Care & Maintenance',
    description: 'Cleaning sprays, microfiber cloths, wax, car shampoo and maintenance kits.',
    tileGroup: 'products',
    sortOrder: 2,
  },
  {
    name: 'Tires & Wheels',
    description: 'Car and bike tyres, alloy wheels, rim accessories and tyre care products.',
    tileGroup: 'products',
    sortOrder: 3,
  },
  {
    name: 'Brakes & Suspension',
    description: 'Brake pads, disc rotors, calipers, shock absorbers and suspension components.',
    tileGroup: 'products',
    sortOrder: 4,
  },

  // ── Vehicle Categories ──────────────────────────────────────────────────────
  {
    name: 'Interior Accessories',
    description: 'Seat covers, steering wheel covers, dashboard mats and car organizers.',
    tileGroup: 'vehicles',
    sortOrder: 11,
  },
  {
    name: 'Lighting & Electrical',
    description: 'LED headlights, tail lamps, bulbs, car audio and electrical components.',
    tileGroup: 'vehicles',
    sortOrder: 12,
  },
  {
    name: 'Filters & Belts',
    description: 'Air filters, oil filters, fuel filters, timing belts and serpentine belts.',
    tileGroup: 'vehicles',
    sortOrder: 13,
  },
  {
    name: 'Batteries & Chargers',
    description: 'Car and bike batteries, jump starters, battery chargers and maintainers.',
    tileGroup: 'vehicles',
    sortOrder: 14,
  },
  {
    name: 'Performance Parts',
    description: 'Exhaust systems, air intakes, tuning chips and performance upgrades.',
    tileGroup: 'vehicles',
    sortOrder: 15,
  },

  // ── Service Categories ──────────────────────────────────────────────────────
  {
    name: 'Workshop Tools',
    description: 'Spanners, ratchets, socket sets, jacks and professional garage tools.',
    tileGroup: 'services',
    sortOrder: 21,
  },
  {
    name: 'Detailing & PPF',
    description: 'Paint protection film, ceramic coating, scratch repair and car detailing.',
    tileGroup: 'services',
    sortOrder: 22,
  },
  {
    name: 'Wash & Valeting',
    description: 'Car wash packages, foam wash, steam cleaning and interior valeting.',
    tileGroup: 'services',
    sortOrder: 23,
  },
  {
    name: 'Roadside & Tyre Care',
    description: 'Puncture repair, tyre inflation, roadside assistance and emergency kits.',
    tileGroup: 'services',
    sortOrder: 24,
  },
];

/**
 * Spare Parts is a utility category used as the default FK for products.
 * It is NOT shown in Store home tiles (isSparePartsLabel filters it out).
 */
const SPARE_PARTS_CATEGORY = {
  name: 'Spare Parts',
  description: 'Genuine and aftermarket automotive replacement components and consumables.',
  sortOrder: 100,
};

// ─── Seed Function ────────────────────────────────────────────────────────────
const seedCategories = async () => {
  try {
    logger.info('Starting category seeding...');
    await connectDatabase();
    logger.info('Database connected');

    let upserted = 0;

    // Upsert all Store home tile categories
    for (const cat of CATEGORIES) {
      const result = await Category.findOneAndUpdate(
        { name: cat.name },
        {
          $set: {
            name: cat.name,
            description: cat.description,
            status: 'active',
            tileGroup: cat.tileGroup,
            sortOrder: cat.sortOrder,
            ...(cat.imageUrl ? { imageUrl: cat.imageUrl } : {}),
          },
        },
        { upsert: true, new: true },
      );
      logger.info(
        'Upserted [%s] → id=%s tileGroup=%s sortOrder=%d',
        cat.name,
        result._id,
        cat.tileGroup,
        cat.sortOrder,
      );
      upserted++;
    }

    // Upsert the utility "Spare Parts" category (no tileGroup)
    const spareParts = await Category.findOneAndUpdate(
      { name: SPARE_PARTS_CATEGORY.name },
      {
        $set: {
          name: SPARE_PARTS_CATEGORY.name,
          description: SPARE_PARTS_CATEGORY.description,
          status: 'active',
          sortOrder: SPARE_PARTS_CATEGORY.sortOrder,
        },
      },
      { upsert: true, new: true },
    );
    logger.info('Upserted [Spare Parts] → id=%s (utility, no tileGroup)', spareParts._id);
    upserted++;

    logger.info('✅ Category seeding complete. Total upserted: %d', upserted);

    // Print summary table
    const all = await Category.find().sort({ tileGroup: 1, sortOrder: 1 });
    console.log('\n=== CATEGORY SUMMARY ===');
    console.log('%-35s %-10s %s', 'Name', 'TileGroup', 'SortOrder');
    console.log('-'.repeat(60));
    for (const c of all) {
      console.log(
        '%-35s %-10s %d',
        c.name,
        c.tileGroup ?? '(none)',
        c.sortOrder ?? 0,
      );
    }
    console.log('='.repeat(60));
    console.log(`Total: ${all.length} categories\n`);

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
