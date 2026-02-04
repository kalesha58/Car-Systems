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
  locationDescription?: string;
  nearbyLocation?: string;
  alternateNumber?: string;
  flatNumber?: string;
  buildingName?: string;
  townOrCity?: string;
  pincode?: string;
  state?: string;
  isDefault?: boolean;
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
  locationDescription?: string;
  nearbyLocation?: string;
  alternateNumber?: string;
  flatNumber?: string;
  buildingName?: string;
  townOrCity?: string;
  pincode?: string;
  state?: string;
  isDefault?: boolean;
}

export interface ILocationData {
  latitude: number;
  longitude: number;
  address: string;
  formattedAddress: string;
}

