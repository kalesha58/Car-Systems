export interface IAddress {
  _id?: string;
  name: string;
  phone: string;
  fullAddress: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  addressType: 'home' | 'office' | 'other';
  iconType: 'home' | 'building' | 'location';
  createdAt?: string;
  updatedAt?: string;
}

export interface IAddressFormData {
  name: string;
  phone: string;
  fullAddress: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  addressType: 'home' | 'office' | 'other';
  iconType: 'home' | 'building' | 'location';
}

export interface ILocationData {
  latitude: number;
  longitude: number;
  address: string;
  formattedAddress: string;
}

