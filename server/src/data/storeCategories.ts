import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Category, CategoryTileGroup } from '../models/Category';
import { logger } from '../utils/logger';

export type StoreTileCategoryDef = {
  name: string;
  description: string;
  tileGroup: CategoryTileGroup;
  sortOrder: number;
  /** Used by seed:all-inventory; seed:categories leaves empty for client bundled fallback */
  imageUrl?: string;
};

export const STORE_TILE_CATEGORIES: StoreTileCategoryDef[] = [
  {
    name: 'Engine Oil & Lubricants',
    description: 'Motor oils, engine lubricants, gear oils and transmission fluids for cars and bikes.',
    tileGroup: 'products',
    sortOrder: 1,
    imageUrl:
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Car Care & Maintenance',
    description: 'Cleaning sprays, microfiber cloths, wax, car shampoo and maintenance kits.',
    tileGroup: 'products',
    sortOrder: 2,
    imageUrl:
      'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Tires & Wheels',
    description: 'Car and bike tyres, alloy wheels, rim accessories and tyre care products.',
    tileGroup: 'products',
    sortOrder: 3,
    imageUrl:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Brakes & Suspension',
    description: 'Brake pads, disc rotors, calipers, shock absorbers and suspension components.',
    tileGroup: 'products',
    sortOrder: 4,
    imageUrl:
      'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Interior Accessories',
    description: 'Seat covers, steering wheel covers, dashboard mats and car organizers.',
    tileGroup: 'vehicles',
    sortOrder: 11,
    imageUrl:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Lighting & Electrical',
    description: 'LED headlights, tail lamps, bulbs, car audio and electrical components.',
    tileGroup: 'vehicles',
    sortOrder: 12,
    imageUrl:
      'https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Filters & Belts',
    description: 'Air filters, oil filters, fuel filters, timing belts and serpentine belts.',
    tileGroup: 'vehicles',
    sortOrder: 13,
    imageUrl:
      'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Batteries & Chargers',
    description: 'Car and bike batteries, jump starters, battery chargers and maintainers.',
    tileGroup: 'vehicles',
    sortOrder: 14,
    imageUrl:
      'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Performance Parts',
    description: 'Exhaust systems, air intakes, tuning chips and performance upgrades.',
    tileGroup: 'vehicles',
    sortOrder: 15,
    imageUrl:
      'https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Workshop Tools',
    description: 'Spanners, ratchets, socket sets, jacks and professional garage tools.',
    tileGroup: 'services',
    sortOrder: 21,
    imageUrl:
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Detailing & PPF',
    description: 'Paint protection film, ceramic coating, scratch repair and car detailing.',
    tileGroup: 'services',
    sortOrder: 22,
    imageUrl:
      'https://images.unsplash.com/photo-1630968319508-626a299664b9?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Wash & Valeting',
    description: 'Car wash packages, foam wash, steam cleaning and interior valeting.',
    tileGroup: 'services',
    sortOrder: 23,
    imageUrl:
      'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Roadside & Tyre Care',
    description: 'Puncture repair, tyre inflation, roadside assistance and emergency kits.',
    tileGroup: 'services',
    sortOrder: 24,
    imageUrl:
      'https://images.unsplash.com/photo-1544133782-b6210f639347?q=80&w=400&auto=format&fit=crop',
  },
];

export const SPARE_PARTS_CATEGORY = {
  name: 'Spare Parts',
  description: 'Genuine and aftermarket automotive replacement components and consumables.',
  sortOrder: 100,
};

/**
 * Legacy Mongo Category.name → canonical store category name.
 * Used by migrateLegacyCategories and dealer seed rewrites.
 */
export const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  'Car Care': 'Car Care & Maintenance',
  'Car Accessories': 'Car Care & Maintenance',
  'Oils & Lubricants': 'Engine Oil & Lubricants',
  'Tyres & Wheels': 'Tires & Wheels',
  Lighting: 'Lighting & Electrical',
  'Exterior Accessories': 'Performance Parts',
};

/** Legacy names with no product reassignment — marked inactive only when present */
export const LEGACY_INACTIVE_ONLY = ['Auto Mobiles'] as const;

export type UpsertStoreCategoriesOptions = {
  /** When false, tile imageUrl is not written (bundled client fallback). Default true. */
  setTileImageUrls?: boolean;
};

export async function upsertStoreCategories(
  options: UpsertStoreCategoriesOptions = {},
): Promise<{ tileCount: number; sparePartsId: string }> {
  const setTileImageUrls = options.setTileImageUrls ?? true;

  for (const cat of STORE_TILE_CATEGORIES) {
    const $set: Record<string, unknown> = {
      name: cat.name,
      description: cat.description,
      status: 'active',
      tileGroup: cat.tileGroup,
      sortOrder: cat.sortOrder,
    };
    if (setTileImageUrls && cat.imageUrl) {
      $set.imageUrl = cat.imageUrl;
    }

    const result = await Category.findOneAndUpdate(
      { name: cat.name },
      { $set },
      { upsert: true, new: true },
    );
    logger.info(
      'Upserted [%s] → id=%s tileGroup=%s',
      cat.name,
      result._id,
      cat.tileGroup,
    );
  }

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

  return {
    tileCount: STORE_TILE_CATEGORIES.length,
    sparePartsId: (spareParts._id as mongoose.Types.ObjectId).toString(),
  };
}

export async function resolveCategoryIdByName(
  name: string,
  fallbackName: string = SPARE_PARTS_CATEGORY.name,
): Promise<string> {
  const doc = await Category.findOne({ name, status: 'active' });
  if (doc) {
    return (doc._id as mongoose.Types.ObjectId).toString();
  }
  const fallback = await Category.findOne({ name: fallbackName, status: 'active' });
  if (!fallback) {
    throw new Error(
      `Category not found: "${name}" (fallback "${fallbackName}" also missing). Run seed:categories first.`,
    );
  }
  return (fallback._id as mongoose.Types.ObjectId).toString();
}

/** Map canonical tile name → categoryId string */
export async function buildStoreCategoryIdMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const row of STORE_TILE_CATEGORIES) {
    const doc = await Category.findOne({ name: row.name });
    if (doc) {
      map.set(row.name, (doc._id as mongoose.Types.ObjectId).toString());
    }
  }
  const spare = await Category.findOne({ name: SPARE_PARTS_CATEGORY.name });
  if (spare) {
    map.set(SPARE_PARTS_CATEGORY.name, (spare._id as mongoose.Types.ObjectId).toString());
  }
  return map;
}

export function resolveProductCategoryId(
  storeCategoryName: string,
  categoryIdByName: Map<string, string>,
): string {
  return (
    categoryIdByName.get(storeCategoryName) ??
    categoryIdByName.get(SPARE_PARTS_CATEGORY.name) ??
    ''
  );
}

export async function migrateLegacyCategoryNames(): Promise<void> {
  await upsertStoreCategories({ setTileImageUrls: false });

  for (const legacyName of LEGACY_INACTIVE_ONLY) {
    const legacy = await Category.findOne({ name: legacyName });
    if (legacy && legacy.status !== 'inactive') {
      legacy.status = 'inactive';
      await legacy.save();
      logger.info('Set legacy category [%s] to inactive (no product migration)', legacyName);
    }
  }

  for (const [legacyName, canonicalName] of Object.entries(LEGACY_CATEGORY_ALIASES)) {
    const legacy = await Category.findOne({ name: legacyName });
    if (!legacy) {
      continue;
    }

    const canonical = await Category.findOne({ name: canonicalName });
    if (!canonical) {
      logger.warn('Canonical category missing for alias %s → %s', legacyName, canonicalName);
      continue;
    }

    const legacyId = (legacy._id as mongoose.Types.ObjectId).toString();
    const canonicalId = (canonical._id as mongoose.Types.ObjectId).toString();

    if (legacyId === canonicalId) {
      continue;
    }

    const updateResult = await Product.updateMany(
      { categoryId: legacyId },
      { $set: { categoryId: canonicalId } },
    );

    if (legacy.status !== 'inactive') {
      legacy.status = 'inactive';
      await legacy.save();
    }

    logger.info(
      'Migrated [%s] → [%s]: %d products repointed; legacy category inactive',
      legacyName,
      canonicalName,
      updateResult.modifiedCount,
    );
  }
}

export async function printCategorySummary(): Promise<void> {
  const all = await Category.find().sort({ tileGroup: 1, sortOrder: 1 }).lean();
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
}
