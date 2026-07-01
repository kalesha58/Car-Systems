import type { IAddress } from '../types/address';

import { getString, setString, remove } from '@storage/index';
import { StorageKeys } from '@storage/keys';

export async function getSelectedDeliveryAddressId(): Promise<string | null> {
  return getString(StorageKeys.SELECTED_DELIVERY_ADDRESS_ID);
}

export async function setSelectedDeliveryAddressId(addressId: string): Promise<void> {
  await setString(StorageKeys.SELECTED_DELIVERY_ADDRESS_ID, addressId);
}

export async function clearSelectedDeliveryAddressId(): Promise<void> {
  await remove(StorageKeys.SELECTED_DELIVERY_ADDRESS_ID);
}

export function pickDeliveryAddress(
  addresses: IAddress[],
  selectedId?: string | null,
): IAddress | null {
  if (!addresses.length) return null;

  if (selectedId) {
    const selected = addresses.find(a => a._id === selectedId);
    if (selected) return selected;
  }

  const defaultAddress = addresses.find(a => a.isDefault);
  if (defaultAddress) return defaultAddress;

  return addresses[0];
}

export function formatDeliveryAddressLabel(address: IAddress): string {
  const area = [address.townOrCity, address.state].filter(Boolean).join(', ');
  if (address.name && address.name !== 'Address') {
    return area ? `${address.name} · ${area}` : address.name;
  }
  if (area) return area;

  const parts = address.fullAddress
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[1]}`;
  }
  return address.fullAddress;
}
