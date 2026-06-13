/**
 * Client-side mirror of the server's serviceCategoryConfig.
 *
 * Used by:
 *   - ProductCategories screen (subcategory tabs + package chips)
 *   - Any future dealer-facing screens
 *
 * Keep in sync with: server/src/data/serviceCategoryConfig.ts
 */

export type ServiceTypeValue =
  | 'car_automobile'
  | 'bike_automobile'
  | 'car_wash'
  | 'tire_service'
  | 'car_detailing'
  | 'battery_service'
  | 'general';

export type ServicePackageValue = 'premium' | 'basic';

export interface IServiceSubCategory {
  id: string;
  label: string;
}

export interface IServiceSection {
  id: string;
  label: string;
  serviceType: ServiceTypeValue;
  vehicleType?: 'Car' | 'Bike' | 'Both';
  hasDeliveryModes: boolean;
  deliveryModes?: Array<{ value: string; label: string }>;
  hasPackages: boolean;
  packages?: Array<{ value: ServicePackageValue; label: string }>;
  subcategories: IServiceSubCategory[];
}

export const SERVICE_SECTIONS: IServiceSection[] = [
  // ─── Car Service ──────────────────────────────────────────────────────────
  {
    id: 'car-service',
    label: 'Car Service',
    serviceType: 'car_automobile',
    vehicleType: 'Car',
    hasDeliveryModes: false,
    hasPackages: false,
    subcategories: [
      { id: 'general_checkup', label: 'General Checkup' },
      { id: 'oil_change', label: 'Oil Change' },
      { id: 'electrical_work', label: 'Electrical Work' },
      { id: 'exterior_work', label: 'Exterior Work' },
    ],
  },

  // ─── Bike Service ─────────────────────────────────────────────────────────
  {
    id: 'bike-service',
    label: 'Bike Service',
    serviceType: 'bike_automobile',
    vehicleType: 'Bike',
    hasDeliveryModes: false,
    hasPackages: false,
    subcategories: [
      { id: 'general_checkup', label: 'General Checkup' },
      { id: 'oil_change', label: 'Oil Change' },
      { id: 'electrical_work', label: 'Electrical Work' },
      { id: 'exterior_work', label: 'Exterior Work' },
    ],
  },

  // ─── Vehicle Wash ─────────────────────────────────────────────────────────
  {
    id: 'vehicle-wash',
    label: 'Vehicle Wash',
    serviceType: 'car_wash',
    vehicleType: 'Both',
    hasDeliveryModes: true,
    deliveryModes: [
      { value: 'home', label: 'Home Service' },
      { value: 'dealer_center', label: 'Dealer Center' },
    ],
    hasPackages: true,
    packages: [
      { value: 'premium', label: 'Premium' },
      { value: 'basic', label: 'Basic' },
    ],
    subcategories: [
      { id: 'interior_wash', label: 'Interior Wash' },
      { id: 'exterior_wash', label: 'Exterior Wash' },
      { id: 'steam_cleaning', label: 'Steam Cleaning' },
      { id: 'polish_wax', label: 'Polish & Wax' },
    ],
  },

  // ─── Tyre Service ─────────────────────────────────────────────────────────
  {
    id: 'tire-service',
    label: 'Tyre Service',
    serviceType: 'tire_service',
    vehicleType: 'Both',
    hasDeliveryModes: true,
    deliveryModes: [
      { value: 'home', label: 'Home Service' },
      { value: 'store', label: 'Store' },
    ],
    hasPackages: false,
    subcategories: [
      { id: 'puncture', label: 'Puncture Repair' },
      { id: 'air_check', label: 'Air Check & Fill' },
      { id: 'new_tyre', label: 'New Tyre Selling' },
    ],
  },

  // ─── PPF & Detailing ──────────────────────────────────────────────────────
  {
    id: 'ppf-detailing',
    label: 'PPF & Detailing',
    serviceType: 'car_detailing',
    vehicleType: 'Both',
    hasDeliveryModes: false,
    hasPackages: false,
    subcategories: [
      { id: 'ceramic_coating', label: 'Ceramic Coating' },
      { id: 'ppf_coating', label: 'PPF Coating' },
      { id: 'painting_denting', label: 'Painting & Denting' },
      { id: 'scratch_remover', label: 'Scratch Remover' },
      { id: 'waxing', label: 'Waxing' },
    ],
  },

  // ─── Battery Service ──────────────────────────────────────────────────────
  {
    id: 'battery-service',
    label: 'Battery Service',
    serviceType: 'battery_service',
    vehicleType: 'Both',
    hasDeliveryModes: true,
    deliveryModes: [
      { value: 'home', label: 'Home Service' },
      { value: 'store', label: 'Store' },
    ],
    hasPackages: false,
    subcategories: [
      { id: 'battery_starting', label: 'Battery Starting' },
      { id: 'battery_charging', label: 'Battery Charging' },
      { id: 'battery_replacement', label: 'Battery Replacement' },
    ],
  },
];

/** Legacy IDs kept for backward compatibility with old banners/links */
export const CATEGORY_ID_ALIASES: Record<string, string> = {
  'car-wash': 'vehicle-wash',
};

/** Resolve a category id to its canonical service section id */
export const resolveCategoryId = (id: string): string => CATEGORY_ID_ALIASES[id] ?? id;

/** Get section config by category id (matches ICategoryItem._id) */
export const getSectionById = (id: string): IServiceSection | undefined =>
  SERVICE_SECTIONS.find(s => s.id === resolveCategoryId(id));

export interface ServiceQueryParams {
  serviceType?: ServiceTypeValue;
  vehicleType?: 'Car' | 'Bike';
}

/** Map a service category id to API query params for GET /services */
export const buildServiceQueryParams = (
  categoryId: string,
  routeOverrides?: { serviceType?: ServiceTypeValue; vehicleType?: 'Car' | 'Bike' },
): ServiceQueryParams => {
  const resolvedId = resolveCategoryId(categoryId);

  if (resolvedId === 'bike-wash') {
    return { serviceType: 'car_wash', vehicleType: 'Bike' };
  }

  const section = SERVICE_SECTIONS.find(s => s.id === resolvedId);
  if (section) {
    const params: ServiceQueryParams = { serviceType: section.serviceType };
    if (section.vehicleType === 'Car' || section.vehicleType === 'Bike') {
      params.vehicleType = section.vehicleType;
    }
    return params;
  }

  if (routeOverrides?.serviceType) {
    return {
      serviceType: routeOverrides.serviceType,
      vehicleType: routeOverrides.vehicleType,
    };
  }

  return {};
};

/** Build navigation params for a service section shortcut button */
export const buildServiceNavigationParams = (
  sectionId: string,
): {
  initialCategoryId: string;
  initialCategoryType: 'services';
  serviceType?: ServiceTypeValue;
  vehicleType?: 'Car' | 'Bike';
} => {
  const resolvedId = resolveCategoryId(sectionId);
  const query = buildServiceQueryParams(resolvedId);
  return {
    initialCategoryId: resolvedId,
    initialCategoryType: 'services',
    ...(query.serviceType ? { serviceType: query.serviceType } : {}),
    ...(query.vehicleType ? { vehicleType: query.vehicleType } : {}),
  };
};
