export interface IDealerListItem {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  email: string;
  status: 'approved' | 'pending' | 'suspended' | 'rejected';
  location: string;
  address?: string;
  rating?: number;
  totalOrders?: number;
  createdDate?: string;
  createdAt?: string;
  isBusinessRegistration?: boolean;
  isVehicleRegistration?: boolean;
  dealerType?: 'showroom' | 'car_wash' | 'detailing' | 'automobile' | string;
  suspensionReason?: string;
  registrationDate?: string;
  approvalDate?: string;
  documents?: {
    other?: unknown[];
    [key: string]: unknown;
  };
}

export interface IDealerDetails extends Omit<IDealerListItem, 'documents'> {
  address: string;
  totalRevenue: number;
  documents: Array<{
    id: string;
    type: string;
    url: string;
    status: string;
    uploadDate: string;
  }>;
  orders: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
  }>;
  reviews: Array<{
    id: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

