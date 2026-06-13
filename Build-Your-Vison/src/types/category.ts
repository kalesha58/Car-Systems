export type CategoryTileGroup = 'products' | 'vehicles' | 'services';

export interface ICategory {
  id: string;
  name: string;
  description: string;
  productCount: number;
  status: 'active' | 'inactive';
  createdDate: string;
  imageUrl?: string;
  sortOrder?: number;
  tileGroup?: CategoryTileGroup;
}

export interface ICategoryFormData {
  name: string;
  description: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
  sortOrder?: number;
  tileGroup?: CategoryTileGroup | '';
}
