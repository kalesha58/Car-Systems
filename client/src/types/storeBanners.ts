export interface IStoreBannerLink {
  type: 'category' | 'none';
  categoryId?: string;
  categoryType?: 'products' | 'services' | 'vehicles';
  serviceType?: string;
  vehicleType?: string;
}

export interface IStoreBannerItem {
  id: string;
  enabled: boolean;
  sortOrder: number;
  emoji: string;
  title: string;
  subtitle: string;
  cta: string;
  backgroundColor: string;
  link: IStoreBannerLink;
}

export interface IStoreBannersConfig {
  enabled: boolean;
  autoScrollMs: number;
  items: IStoreBannerItem[];
}

export const DEFAULT_STORE_BANNERS: IStoreBannersConfig = {
  enabled: true,
  autoScrollMs: 3500,
  items: [
    {
      id: 'doorstep',
      enabled: true,
      sortOrder: 0,
      emoji: '🔧',
      title: 'Doorstep Car Service',
      subtitle: 'Expert mechanics at your door —\nno garage visit needed',
      cta: 'Book Now',
      backgroundColor: '#1565C0',
      link: {
        type: 'category',
        categoryId: 'car-service',
        categoryType: 'services',
        serviceType: 'car_automobile',
        vehicleType: 'Car',
      },
    },
    {
      id: 'ppf',
      enabled: true,
      sortOrder: 1,
      emoji: '✨',
      title: 'Premium PPF & Detailing',
      subtitle: 'Ceramic coating & paint protection\nstarting from ₹999',
      cta: 'Explore',
      backgroundColor: '#6A1B9A',
      link: {
        type: 'category',
        categoryId: 'ppf-detailing',
        categoryType: 'services',
        serviceType: 'car_detailing',
      },
    },
    {
      id: 'tyre',
      enabled: true,
      sortOrder: 2,
      emoji: '🛞',
      title: "Tyre Puncture? We're Near",
      subtitle: 'Roadside tyre fix in 15 mins —\nanytime, anywhere',
      cta: 'Get Help',
      backgroundColor: '#BF360C',
      link: {
        type: 'category',
        categoryId: 'all-services',
        categoryType: 'services',
        serviceType: 'tire_service',
      },
    },
  ],
};
