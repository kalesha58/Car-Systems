import {appAxios} from './apiInterceptors';
import {IAddress, IAddressFormData} from '../types/address/IAddress';

export const getSavedAddresses = async (): Promise<IAddress[]> => {
  const response = await appAxios.get('/addresses');
  if (response.data && response.data.success && response.data.addresses) {
    return response.data.addresses;
  }
  throw new Error(
    response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      'Failed to fetch addresses',
  );
};

export const saveAddress = async (
  addressData: IAddressFormData,
): Promise<IAddress> => {
  const response = await appAxios.post('/addresses', addressData);
  if (response.data && response.data.success && response.data.address) {
    return response.data.address;
  }
  throw new Error(
    response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      'Failed to save address',
  );
};

export const deleteAddress = async (addressId: string): Promise<void> => {
  const response = await appAxios.delete(`/addresses/${addressId}`);
  if (response.data && !response.data.success) {
    throw new Error(
      response.data.Response?.ReturnMessage ||
        response.data?.message ||
        'Failed to delete address',
    );
  }
};

export const updateAddress = async (
  addressId: string,
  addressData: Partial<IAddressFormData>,
): Promise<IAddress> => {
  const response = await appAxios.patch(`/addresses/${addressId}`, addressData);
  if (response.data && response.data.success && response.data.address) {
    return response.data.address;
  }
  throw new Error(
    response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      'Failed to update address',
  );
};

export const getAddressById = async (addressId: string): Promise<IAddress> => {
  const response = await appAxios.get(`/addresses/${addressId}`);
  if (response.data && response.data.success && response.data.address) {
    return response.data.address;
  }
  throw new Error(
    response.data?.Response?.ReturnMessage ||
      response.data?.message ||
      'Failed to fetch address',
  );
};

