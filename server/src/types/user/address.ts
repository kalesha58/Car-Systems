import { IAddressDocument } from '../../models/user/Address';

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
  isDefault?: boolean;
}

export interface IAddressResponse {
  _id: string;
  userId: string;
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
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IGetAddressesQuery {
  page?: number;
  limit?: number;
  search?: string;
  addressType?: 'home' | 'office' | 'other';
}

export interface IAddressesListResponse {
  addresses: IAddressResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const mapAddressToResponse = (address: IAddressDocument): IAddressResponse => {
  return {
    _id: (address._id as any).toString(),
    userId: address.userId,
    name: address.name,
    phone: address.phone,
    fullAddress: address.fullAddress,
    coordinates: {
      latitude: address.coordinates.latitude,
      longitude: address.coordinates.longitude,
    },
    addressType: address.addressType,
    iconType: address.iconType,
    locationDescription: address.locationDescription,
    nearbyLocation: address.nearbyLocation,
    alternateNumber: address.alternateNumber,
    flatNumber: address.flatNumber,
    buildingName: address.buildingName,
    townOrCity: address.townOrCity,
    isDefault: address.isDefault,
    createdAt: address.createdAt.toISOString(),
    updatedAt: address.updatedAt.toISOString(),
  };
};

