export type DealerServiceType =
  | 'car_wash'
  | 'car_detailing'
  | 'car_automobile'
  | 'bike_automobile'
  | 'tire_service'
  | 'battery_service'
  | 'general';

export const getAllowedDealerServiceTypes = (
  businessType: string | undefined,
): DealerServiceType[] => {
  if (!businessType) {
    return [
      'car_wash',
      'car_detailing',
      'car_automobile',
      'bike_automobile',
      'tire_service',
      'battery_service',
      'general',
    ];
  }

  switch (businessType) {
    case 'Vehicle Wash Station':
      return ['car_wash'];
    case 'Detailing Center':
      return ['car_detailing'];
    case 'Bike Dealer':
      return ['bike_automobile', 'tire_service', 'battery_service'];
    case 'Automobile Showroom':
      return ['car_automobile', 'tire_service', 'battery_service'];
    case 'Mechanic Workshop':
    case 'Riding Gear Store':
      return [
        'car_wash',
        'car_detailing',
        'car_automobile',
        'bike_automobile',
        'tire_service',
        'battery_service',
        'general',
      ];
    default:
      return [
        'car_wash',
        'car_detailing',
        'car_automobile',
        'bike_automobile',
        'tire_service',
        'battery_service',
        'general',
      ];
  }
};

export const isServiceVisibleForBusiness = (
  serviceType: string | undefined,
  businessType: string | undefined,
): boolean => {
  if (!serviceType) {
    return true;
  }
  const allowed = getAllowedDealerServiceTypes(businessType);
  return allowed.includes(serviceType as DealerServiceType);
};
