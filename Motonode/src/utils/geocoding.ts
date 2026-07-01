import axios from 'axios';

import { GOOGLE_MAPS_API_KEY } from '@config/env';
import type { ILocationData, ParsedAddressFields } from '../types/address';

interface GeocodeAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GeocodeResult {
  formatted_address: string;
  address_components: GeocodeAddressComponent[];
}

function findComponent(
  components: GeocodeAddressComponent[],
  type: string,
): GeocodeAddressComponent | undefined {
  return components.find(c => c.types.includes(type));
}

export function parseAddressComponents(
  formattedAddress: string,
  components: GeocodeAddressComponent[],
): ParsedAddressFields {
  const city =
    findComponent(components, 'locality')?.long_name ||
    findComponent(components, 'administrative_area_level_2')?.long_name ||
    '';
  const state = findComponent(components, 'administrative_area_level_1')?.long_name || '';
  const pincode = findComponent(components, 'postal_code')?.long_name || '';
  const country = findComponent(components, 'country')?.long_name || 'India';

  return {
    fullAddress: formattedAddress,
    city,
    state,
    pincode,
    country,
  };
}

export async function reverseGeocodeForAddress(
  latitude: number,
  longitude: number,
): Promise<ILocationData | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(url);

    if (response.data.status !== 'OK' || !response.data.results?.length) {
      return null;
    }

    const result = response.data.results[0] as GeocodeResult;
    const parsed = parseAddressComponents(result.formatted_address, result.address_components);

    return {
      latitude,
      longitude,
      address: result.formatted_address,
      formattedAddress: result.formatted_address,
      city: parsed.city,
      state: parsed.state,
      pincode: parsed.pincode,
      country: parsed.country,
    };
  } catch {
    return null;
  }
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export async function getPlaceSuggestions(input: string): Promise<PlaceSuggestion[]> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`;
    const response = await axios.get(url);
    if (response.data.status !== 'OK' || !response.data.predictions) {
      return [];
    }
    return response.data.predictions.map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || '',
      secondaryText: p.structured_formatting?.secondary_text || '',
    }));
  } catch {
    return [];
  }
}

export async function getPlaceDetails(placeId: string): Promise<ILocationData | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,address_components&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(url);
    if (response.data.status !== 'OK' || !response.data.result) {
      return null;
    }
    const result = response.data.result;
    const geometry = result.geometry;
    if (!geometry || !geometry.location) {
      return null;
    }
    const { lat, lng } = geometry.location;
    const parsed = parseAddressComponents(result.formatted_address, result.address_components || []);
    return {
      latitude: lat,
      longitude: lng,
      address: result.formatted_address,
      formattedAddress: result.formatted_address,
      city: parsed.city,
      state: parsed.state,
      pincode: parsed.pincode,
      country: parsed.country,
    };
  } catch {
    return null;
  }
}
