export interface IUserListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'blocked';
  role?: string[];
  createdDate: string;
  createdAt?: string;
  ordersCount?: number;
  totalSpent?: number;
  isBusinessRegistration?: boolean;
  isVehicleRegistration?: boolean;
}

export interface IUserVehicle {
  id: string;
  brand: string;
  model: string;
  year?: number;
  numberPlate: string;
  color?: string;
  images?: string[];
  documents?: {
    rc?: string;
    insurance?: string;
    pollution?: string;
    dl?: string;
  };
  createdAt?: string;
}

export interface IUserDetails extends IUserListItem {
  orders: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
  }>;
  vehicles?: IUserVehicle[];
  addresses?: Array<{
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    type: string;
  }>;
}

