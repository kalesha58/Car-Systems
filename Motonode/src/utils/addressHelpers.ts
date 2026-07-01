import type { IAddressFormData } from '../types/address';

export function deriveAddressType(
  label: string,
): 'home' | 'office' | 'other' {
  const normalized = label.trim().toLowerCase();
  if (normalized.includes('home')) return 'home';
  if (normalized.includes('office') || normalized.includes('work')) return 'office';
  return 'other';
}

export function deriveIconType(
  addressType: 'home' | 'office' | 'other',
): 'home' | 'building' | 'location' {
  if (addressType === 'home') return 'home';
  if (addressType === 'office') return 'building';
  return 'location';
}

export function buildAddressFormData(params: {
  label: string;
  phone: string;
  fullAddress: string;
  city: string;
  pincode: string;
  state: string;
  coordinates: { latitude: number; longitude: number };
  isDefault?: boolean;
}): IAddressFormData {
  const name = params.label.trim() || 'Address';
  const addressType = deriveAddressType(name);
  return {
    name,
    phone: params.phone.replace(/\D/g, '').slice(0, 10),
    fullAddress: params.fullAddress.trim(),
    coordinates: params.coordinates,
    addressType,
    iconType: deriveIconType(addressType),
    townOrCity: params.city.trim() || undefined,
    pincode: params.pincode.trim() || undefined,
    state: params.state.trim() || undefined,
    isDefault: params.isDefault ?? false,
  };
}

export function isValidIndianPhone(phone: string): boolean {
  return /^[0-9]{10}$/.test(phone.replace(/\D/g, ''));
}
