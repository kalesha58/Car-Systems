import type { ICategory } from '@services/categoryService';
import type { IServiceSection } from '@services/serviceCategoryService';
import type { IStoreBannerLink } from '@services/settingsService';

export interface IBannerDestinationOption {
  value: string;
  label: string;
  hint: string;
  link: IStoreBannerLink;
}

export const buildDestinationKey = (link: IStoreBannerLink): string => {
  if (link.type !== 'category' || !link.categoryId) {
    return '';
  }

  return [
    link.categoryType ?? 'services',
    link.categoryId,
    link.serviceType ?? '',
    link.vehicleType ?? '',
  ].join('|');
};

const GENERAL_DESTINATIONS: IBannerDestinationOption[] = [
  {
    value: 'services|all-services||',
    label: 'All Services',
    hint: 'Opens the full services catalog on the store home',
    link: { type: 'category', categoryId: 'all-services', categoryType: 'services' },
  },
  {
    value: 'products|all-products||',
    label: 'All Products',
    hint: 'Opens the full products catalog',
    link: { type: 'category', categoryId: 'all-products', categoryType: 'products' },
  },
  {
    value: 'vehicles|all-vehicles||',
    label: 'All Vehicles',
    hint: 'Opens the vehicles catalog',
    link: { type: 'category', categoryId: 'all-vehicles', categoryType: 'vehicles' },
  },
];

export const buildBannerDestinationOptions = (
  serviceSections: IServiceSection[],
  productCategories: ICategory[],
): IBannerDestinationOption[] => {
  const serviceOptions: IBannerDestinationOption[] = serviceSections.map((section) => {
    const link: IStoreBannerLink = {
      type: 'category',
      categoryId: section.id,
      categoryType: 'services',
      serviceType: section.serviceType,
      vehicleType:
        section.vehicleType && section.vehicleType !== 'Both' ? section.vehicleType : undefined,
    };

    const vehicleHint =
      section.vehicleType === 'Both'
        ? 'Car & Bike'
        : section.vehicleType
          ? section.vehicleType
          : 'Any vehicle';

    return {
      value: buildDestinationKey(link),
      label: section.label,
      hint: `Services · ${section.serviceType.replace(/_/g, ' ')} · ${vehicleHint}`,
      link,
    };
  });

  const productOptions: IBannerDestinationOption[] = productCategories
    .filter((category) => category.status === 'active')
    .map((category) => {
      const link: IStoreBannerLink = {
        type: 'category',
        categoryId: category.id,
        categoryType: 'products',
      };

      return {
        value: buildDestinationKey(link),
        label: category.name,
        hint: category.description
          ? `Products · ${category.description}`
          : 'Products · Opens this product category',
        link,
      };
    });

  return [...GENERAL_DESTINATIONS, ...serviceOptions, ...productOptions];
};

export const findDestinationOption = (
  options: IBannerDestinationOption[],
  link: IStoreBannerLink,
): IBannerDestinationOption | undefined => {
  const key = buildDestinationKey(link);
  if (!key) {
    return undefined;
  }

  return options.find((option) => option.value === key);
};

export const resolveDestinationDisplay = (
  options: IBannerDestinationOption[],
  link: IStoreBannerLink,
): IBannerDestinationOption => {
  const found = findDestinationOption(options, link);
  if (found) {
    return found;
  }

  if (link.type === 'category' && link.categoryId) {
    const label = link.categoryId
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    const hintParts = [
      link.categoryType ?? 'category',
      link.serviceType?.replace(/_/g, ' '),
      link.vehicleType,
    ].filter(Boolean);

    return {
      value: buildDestinationKey(link),
      label,
      hint: hintParts.join(' · '),
      link,
    };
  }

  return {
    value: '',
    label: 'No destination',
    hint: 'Select where tapping this banner should navigate',
    link: { type: 'none' },
  };
};

export const getDestinationSelectOptions = (
  options: IBannerDestinationOption[],
  link?: IStoreBannerLink,
): Array<{ value: string; label: string }> => {
  const selectOptions = options.map((option) => ({
    value: option.value,
    label: `${option.label} — ${option.hint}`,
  }));

  if (!link || link.type !== 'category' || !link.categoryId) {
    return selectOptions;
  }

  const currentKey = buildDestinationKey(link);
  if (!currentKey || selectOptions.some((option) => option.value === currentKey)) {
    return selectOptions;
  }

  const current = resolveDestinationDisplay(options, link);
  return [
    {
      value: current.value,
      label: `${current.label} — ${current.hint} (current)`,
    },
    ...selectOptions,
  ];
};

export const getDefaultDestination = (
  options: IBannerDestinationOption[],
): IBannerDestinationOption | undefined =>
  options.find((option) => option.link.categoryId === 'all-services') ?? options[0];
