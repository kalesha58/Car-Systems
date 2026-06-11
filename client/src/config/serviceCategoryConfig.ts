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

/**
 * Spare parts brand list — static curated list for Indian market.
 */
export const SPARE_PARTS_BRANDS: Record<'Car' | 'Bike', string[]> = {
  Car: [
    'Maruti Suzuki',
    'Hyundai',
    'Tata',
    'Mahindra',
    'Toyota',
    'Honda',
    'Kia',
    'Renault',
    'Volkswagen',
    'Skoda',
    'Ford',
    'MG',
    'Jeep',
    'Nissan',
    'Others',
  ],
  Bike: [
    'Hero MotoCorp',
    'Honda',
    'Bajaj',
    'TVS',
    'Royal Enfield',
    'Yamaha',
    'Suzuki',
    'KTM',
    'Kawasaki',
    'Jawa',
    'Others',
  ],
};

/** Get section config by category id (matches ICategoryItem._id) */
export const getSectionById = (id: string): IServiceSection | undefined =>
  SERVICE_SECTIONS.find(s => s.id === id);
