import { navigate } from '@utils/NavigationUtils';
import { IStoreBannerLink } from '@types/storeBanners';

export const navigateFromBannerLink = (link: IStoreBannerLink): void => {
  if (link.type !== 'category' || !link.categoryId) {
    return;
  }

  const params: Record<string, string> = {
    initialCategoryId: link.categoryId,
    initialCategoryType: link.categoryType ?? 'services',
  };

  if (link.serviceType) {
    params.serviceType = link.serviceType;
  }
  if (link.vehicleType) {
    params.vehicleType = link.vehicleType;
  }

  navigate('Category', {
    screen: 'ProductCategories',
    params,
  });
};
