import { logger } from '../utils/logger';
import { BusinessRegistration } from '../models/BusinessRegistration';

export interface IDeliveryTimeRequest {
  addressCoordinates?: {
    latitude: number;
    longitude: number;
  };
  dealerId?: string;
  dealerCoordinates?: {
    latitude: number;
    longitude: number;
  };
  itemCount?: number;
  isSparePart?: boolean;
  pincode?: string;
}

export interface IDeliveryTimeResponse {
  minutes: number;
  timeSlot: string;
  estimatedDelivery: string;
  distance?: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

/**
 * Extract pincode from address string
 * Looks for 6-digit numbers that could be pincodes
 */
const extractPincode = (address: string): string | null => {
  if (!address) return null;
  // Indian pincodes are 6 digits
  const pincodeMatch = address.match(/\b\d{6}\b/);
  return pincodeMatch ? pincodeMatch[0] : null;
};

/**
 * Estimate delivery time based on pincode distance
 * This is a simplified calculation - in production, you'd use a pincode-to-coordinates mapping service
 */
const estimateTimeFromPincode = (pincode: string): number => {
  // Simplified: assume average distance based on pincode patterns
  // In production, use a pincode database or geocoding service
  // For now, return a base estimate that will be adjusted
  return 15; // Base 15 minutes
};

/**
 * Format time slot string
 */
const formatTimeSlot = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, '0');

  // Round to nearest 15 minutes for slot
  const roundedMinutes = Math.round(minutes / 15) * 15;
  const slotEnd = new Date(date);
  slotEnd.setMinutes(roundedMinutes + 15);

  const endHours = slotEnd.getHours();
  const endMinutes = slotEnd.getMinutes();
  const endPeriod = endHours >= 12 ? 'PM' : 'AM';
  const endDisplayHours = endHours > 12 ? endHours - 12 : endHours === 0 ? 12 : endHours;
  const endDisplayMinutes = endMinutes.toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes} ${period} - ${endDisplayHours}:${endDisplayMinutes} ${endPeriod}`;
};

/**
 * Calculate delivery time based on various factors
 */
export const calculateDeliveryTime = async (
  request: IDeliveryTimeRequest,
): Promise<IDeliveryTimeResponse> => {
  try {
    // Base delivery time
    let baseMinutes = request.isSparePart ? 15 : 12; // 15 min minimum for spare parts

    // Adjust based on item count
    if (request.itemCount && request.itemCount > 5) {
      baseMinutes += 5; // Extra time for large orders
    }

    // Adjust based on time of day
    const hour = new Date().getHours();
    if (hour >= 17 && hour <= 20) {
      baseMinutes += 8; // Rush hour
    } else if (hour >= 12 && hour <= 14) {
      baseMinutes += 5; // Lunch time
    }

    let distance: number | undefined;
    let distanceMinutes = 0;

    // Calculate distance-based time if coordinates are available
    if (
      request.addressCoordinates &&
      request.dealerCoordinates &&
      request.addressCoordinates.latitude &&
      request.addressCoordinates.longitude &&
      request.dealerCoordinates.latitude &&
      request.dealerCoordinates.longitude
    ) {
      distance = calculateDistance(
        request.addressCoordinates.latitude,
        request.addressCoordinates.longitude,
        request.dealerCoordinates.latitude,
        request.dealerCoordinates.longitude,
      );

      // Estimate: 1km = ~2 minutes, minimum 10 minutes
      distanceMinutes = Math.max(10, Math.round(distance * 2));
      baseMinutes = Math.max(baseMinutes, distanceMinutes);
    } else if (request.pincode) {
      // If we have pincode but no coordinates, estimate based on pincode
      const pincodeMinutes = estimateTimeFromPincode(request.pincode);
      baseMinutes = Math.max(baseMinutes, pincodeMinutes);
    } else if (request.dealerId) {
      // Try to get dealer location from BusinessRegistration
      try {
        const businessReg = await BusinessRegistration.findById(request.dealerId);
        if (businessReg?.address) {
          // Extract pincode from dealer address if available
          const dealerPincode = extractPincode(businessReg.address);
          if (dealerPincode && request.pincode) {
            // If both pincodes are same, faster delivery
            if (dealerPincode === request.pincode) {
              baseMinutes = Math.max(baseMinutes, 15); // Same pincode = 15 min minimum
            } else {
              baseMinutes = Math.max(baseMinutes, 25); // Different pincode = longer time
            }
          }
        }
      } catch (error) {
        logger.warn('Error fetching dealer location:', error);
      }
    }

    // Ensure minimum 15 minutes for spare parts
    if (request.isSparePart && baseMinutes < 15) {
      baseMinutes = 15;
    }

    // Round to nearest 5 minutes
    const roundedMinutes = Math.ceil(baseMinutes / 5) * 5;

    // Calculate time slot
    const now = new Date();
    const deliveryDate = new Date(now.getTime() + roundedMinutes * 60000);
    const timeSlot = formatTimeSlot(deliveryDate);

    return {
      minutes: roundedMinutes,
      timeSlot,
      estimatedDelivery: deliveryDate.toISOString(),
      distance,
    };
  } catch (error) {
    logger.error('Error calculating delivery time:', error);
    // Return default time on error
    const defaultMinutes = request.isSparePart ? 15 : 12;
    const now = new Date();
    const deliveryDate = new Date(now.getTime() + defaultMinutes * 60000);
    return {
      minutes: defaultMinutes,
      timeSlot: formatTimeSlot(deliveryDate),
      estimatedDelivery: deliveryDate.toISOString(),
    };
  }
};

/**
 * Calculate delivery time for spare parts specifically
 * Always ensures 15 minute minimum
 */
export const calculateSparePartsDeliveryTime = async (
  request: IDeliveryTimeRequest,
): Promise<IDeliveryTimeResponse> => {
  return calculateDeliveryTime({
    ...request,
    isSparePart: true,
  });
};
