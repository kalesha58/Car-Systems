export type CategoryType = 'products' | 'vehicles' | 'services';

/** Store home category tile (from dropdown API, passed to CompactCategoryContainer). */
export type StoreCategoryTileImage = number | { uri: string } | null;

export interface StoreCategoryTile {
  id: string;
  name: string;
  image: StoreCategoryTileImage;
}

export interface ICategoryItem {
  _id: string;
  name: string;
  image?: number | string | null;
  type?: CategoryType;
  isSectionHeader?: boolean;
  description?: string;
  status?: string;
}

