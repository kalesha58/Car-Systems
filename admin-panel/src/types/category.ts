export interface ICategory {
  id: string;
  name: string;
  description: string;
  productCount: number;
  status: 'active' | 'inactive';
  createdDate: string;
}

export interface ICategoryFormData {
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

