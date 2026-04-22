export interface IProduct {
  id: string;
  name: string;
  brand?: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  image: string;
  images?: string[];
  vehicleType?: string;
  specifications?: Record<string, string>;
  returnPolicy?: string;
  dealerID?: string;
  tags?: string[];
  createdDate: string;
}

export interface IProductFormData {
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  vehicleType: string;
  returnPolicy: string;
  dealerID: string;
  image?: string;
  images?: string[];
  specifications?: Record<string, string>;
  tags?: string[];
}

