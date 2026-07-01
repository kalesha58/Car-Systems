import type { IAddress, IAddressFormData } from '../types/address';

import { api } from './api';

export async function getSavedAddresses(): Promise<IAddress[]> {
  const response = await api.get('/addresses');
  if (response.data?.success && response.data.addresses) {
    return response.data.addresses;
  }
  throw new Error(
    response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      'Failed to fetch addresses',
  );
}

export async function saveAddress(addressData: IAddressFormData): Promise<IAddress> {
  const response = await api.post('/addresses', addressData);
  if (response.data?.success && response.data.address) {
    return response.data.address;
  }
  throw new Error(
    response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      'Failed to save address',
  );
}

export async function updateAddress(
  addressId: string,
  addressData: Partial<IAddressFormData>,
): Promise<IAddress> {
  const response = await api.patch(`/addresses/${addressId}`, addressData);
  if (response.data?.success && response.data.address) {
    return response.data.address;
  }
  throw new Error(
    response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      'Failed to update address',
  );
}

export async function deleteAddress(addressId: string): Promise<void> {
  const response = await api.delete(`/addresses/${addressId}`);
  if (response.data && !response.data.success) {
    throw new Error(
      response.data.Response?.ReturnMessage ||
        response.data?.message ||
        'Failed to delete address',
    );
  }
}

export async function getAddressById(addressId: string): Promise<IAddress> {
  const response = await api.get(`/addresses/${addressId}`);
  if (response.data?.success && response.data.address) {
    return response.data.address;
  }
  throw new Error(
    response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      'Failed to fetch address',
  );
}
