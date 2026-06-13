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

export interface IUserDetails extends IUserListItem {
  orders: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
  }>;
  vehicles?: Array<{
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  }>;
  addresses?: Array<{
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    type: string;
  }>;
}

