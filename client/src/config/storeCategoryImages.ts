/**
 * Store category tile images (bundled fallback when API imageUrl is empty).
 * Canonical names MUST match server/src/data/storeCategories.ts.
 */

/** 13 store tiles + Spare Parts — keep in sync with server storeCategories.ts */
export const CANONICAL_STORE_CATEGORY_NAMES = [
  'Engine Oil & Lubricants',
  'Car Care & Maintenance',
  'Tires & Wheels',
  'Brakes & Suspension',
  'Interior Accessories',
  'Lighting & Electrical',
  'Filters & Belts',
  'Batteries & Chargers',
  'Performance Parts',
  'Workshop Tools',
  'Detailing & PPF',
  'Wash & Valeting',
  'Roadside & Tyre Care',
  'Spare Parts',
] as const;

const CANONICAL_STORE_CATEGORY_IMAGES: Record<string, number> = {
  'Engine Oil & Lubricants': require('@assets/categories/products_engine_oil.png'),
  'Car Care & Maintenance': require('@assets/categories/products_car_care.png'),
  'Tires & Wheels': require('@assets/categories/products_tires_wheels.png'),
  'Brakes & Suspension': require('@assets/categories/products_brakes_suspension.png'),
  'Interior Accessories': require('@assets/categories/vehicles_interior.png'),
  'Lighting & Electrical': require('@assets/categories/vehicles_lighting.png'),
  'Filters & Belts': require('@assets/categories/vehicles_filters_belts.png'),
  'Batteries & Chargers': require('@assets/categories/vehicles_batteries.png'),
  'Performance Parts': require('@assets/categories/vehicles_performance.png'),
  'Workshop Tools': require('@assets/categories/services_workshop_tools.png'),
  'Detailing & PPF': require('@assets/categories/services_detailing_ppf.png'),
  'Wash & Valeting': require('@assets/categories/services_wash_valeting.png'),
  'Roadside & Tyre Care': require('@assets/categories/services_roadside_tyre.png'),
  'Spare Parts': require('@assets/categories/products_brakes_suspension.png'),
};

/** Legacy DB category names and service UI labels — image fallback only, not taxonomy */
export const LEGACY_CATEGORY_IMAGE_ALIASES: Record<string, number> = {
  'Auto Mobiles': require('@assets/categories/products_auto_mobiles.png'),
  'Car Accessories': require('@assets/categories/products_car_accessories.png'),
  'Car Care': require('@assets/categories/products_car_care.png'),
  'Exterior Accessories': require('@assets/categories/products_exterior_accessories.png'),
  Lighting: require('@assets/categories/vehicles_lighting.png'),
  'Oils & Lubricants': require('@assets/categories/products_engine_oil.png'),
  'Tyres & Wheels': require('@assets/categories/products_tires_wheels.png'),
  'Car Service': require('@assets/categories/products_car_care.png'),
  'Bike Service': require('@assets/categories/products_auto_mobiles.png'),
  'Vehicle Wash': require('@assets/categories/services_wash_valeting.png'),
  'Tire Service': require('@assets/categories/products_tires_wheels.png'),
  'Battery Service': require('@assets/categories/vehicles_batteries.png'),
  'PPF & Detailing': require('@assets/categories/services_detailing_ppf.png'),
};

export const STATIC_CATEGORY_IMAGES: Record<string, number> = {
  ...CANONICAL_STORE_CATEGORY_IMAGES,
  ...LEGACY_CATEGORY_IMAGE_ALIASES,
};
