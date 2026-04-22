export interface IVehicle {
  id: string;
  vehicleType: string;
  brand: string;
  vehicleModel: string;
  year: number;
  price: number;
  availability: 'available' | 'sold' | 'reserved';
  images?: string[];
  numberPlate: string;
  mileage: number;
  color: string;
  fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  transmission: 'Manual' | 'Automatic';
  description: string;
  features?: string[];
  condition: 'New' | 'Used' | 'Refurbished';
  dealerID?: string;
  dealer?: {
    id: string;
    name: string;
    businessName?: string;
    location: string;
    place?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  createdAt?: string;
  createdDate?: string;
}

export interface IVehicleFormData {
  vehicleType: string;
  brand: string;
  vehicleModel: string;
  year: number;
  price: number;
  availability: 'available' | 'sold' | 'reserved';
  numberPlate: string;
  mileage: number;
  color: string;
  fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  transmission: 'Manual' | 'Automatic';
  description: string;
  features: string[];
  condition: 'New' | 'Used' | 'Refurbished';
  dealerID: string;
  images?: string[];
}

