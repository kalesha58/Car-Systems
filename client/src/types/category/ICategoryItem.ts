export type CategoryType = 'products' | 'vehicles' | 'services';

export interface ICategoryItem {
  _id: string;
  name: string;
  image?: number | string | null;
  type?: CategoryType;
  isSectionHeader?: boolean;
  description?: string;
  status?: string;
}

