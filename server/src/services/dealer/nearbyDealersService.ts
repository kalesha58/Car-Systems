import { BusinessRegistration, IBusinessRegistrationDocument } from '../../models/BusinessRegistration';
import { Service } from '../../models/Service';
import { SignUp } from '../../models/SignUp';
import { AppError } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export interface INearbyDealer {
  id: string;
  businessName: string;
  type: string;
  address: string;
  phone: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  distance?: number; // Distance in kilometers
  totalServices: number;
  services: Array<{
    id: string;
    name: string;
    price: number;
    serviceType: string;
  }>;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get nearby dealers with car wash services
 */
export const getNearbyCarWashDealers = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 50, // Default 50km radius
  limit: number = 20,
): Promise<INearbyDealer[]> => {
  try {
    // Find all approved business registrations of type "Vehicle Wash Station"
    const washStations = await BusinessRegistration.find({
      type: 'Vehicle Wash Station',
      status: 'approved',
      storeOpen: true,
    }).limit(100); // Get more to filter by distance

    if (washStations.length === 0) {
      return [];
    }

    // Filter by distance and calculate distances
    const dealersWithDistance = washStations
      .map((station) => {
        if (!station.location?.latitude || !station.location?.longitude) {
          return null;
        }

        const distance = calculateDistance(
          latitude,
          longitude,
          station.location.latitude,
          station.location.longitude,
        );

        if (distance > radiusKm) {
          return null;
        }

        return {
          station,
          distance,
        };
      })
      .filter((item): item is { station: IBusinessRegistrationDocument; distance: number } => item !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    // Get services for each dealer
    const dealerIds = dealersWithDistance.map((item) => item.station._id.toString());
    const services = await Service.find({
      dealerId: { $in: dealerIds },
      serviceType: 'car_wash',
      isActive: true,
    });

    // Group services by dealerId
    const servicesByDealer = new Map<string, typeof services>();
    services.forEach((service) => {
      const dealerId = service.dealerId.toString();
      if (!servicesByDealer.has(dealerId)) {
        servicesByDealer.set(dealerId, []);
      }
      servicesByDealer.get(dealerId)!.push(service);
    });

    // Build result
    const result: INearbyDealer[] = dealersWithDistance.map(({ station, distance }) => {
      const dealerId = station._id.toString();
      const dealerServices = servicesByDealer.get(dealerId) || [];

      return {
        id: dealerId,
        businessName: station.businessName,
        type: station.type,
        address: station.address,
        phone: station.phone,
        location: station.location
          ? {
              latitude: station.location.latitude,
              longitude: station.location.longitude,
            }
          : undefined,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
        totalServices: dealerServices.length,
        services: dealerServices.map((service) => ({
          id: service._id.toString(),
          name: service.name,
          price: service.price,
          serviceType: service.serviceType || 'car_wash',
        })),
      };
    });

    return result;
  } catch (error) {
    logger.error('Error getting nearby car wash dealers:', error);
    throw new AppError('Failed to get nearby dealers', 500);
  }
};
