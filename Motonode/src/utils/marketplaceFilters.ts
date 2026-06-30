import type {
  ProductFilters,
  ServiceFilters,
  VehicleFilters,
} from '@components/marketplace/MarketplaceFilterSheet';
import type { IProduct } from '../types/product';
import type { IService } from '../types/service';
import type { IDealerVehicle } from '../types/vehicle';

function matchesProductPrice(price: number, range: ProductFilters['priceRange']) {
  if (range === 'all') return true;
  if (range === 'under1k') return price < 1000;
  if (range === '1k-5k') return price >= 1000 && price <= 5000;
  return price > 5000;
}

function matchesVehiclePrice(price: number, range: VehicleFilters['priceRange']) {
  if (range === 'all') return true;
  if (range === 'under5l') return price < 500000;
  if (range === '5l-15l') return price >= 500000 && price <= 1500000;
  return price > 1500000;
}

function matchesServicePrice(price: number, range: ServiceFilters['priceRange']) {
  if (range === 'all') return true;
  if (range === 'under1k') return price < 1000;
  if (range === '1k-3k') return price >= 1000 && price <= 3000;
  return price > 3000;
}

function isProductInStock(product: IProduct): boolean {
  return product.stock > 0 && product.status === 'active';
}

export function filterProducts(products: IProduct[], filters: ProductFilters) {
  return products.filter((product) => {
    if (filters.categories.length && product.category && !filters.categories.includes(product.category)) {
      return false;
    }
    if (filters.brands.length && !filters.brands.includes(product.brand)) {
      return false;
    }
    if (!matchesProductPrice(product.price, filters.priceRange)) {
      return false;
    }
    if (filters.inStockOnly && !isProductInStock(product)) {
      return false;
    }
    return true;
  });
}

export function filterVehicles(vehicles: IDealerVehicle[], filters: VehicleFilters) {
  return vehicles.filter((vehicle) => {
    const typeKey = vehicle.vehicleType?.toLowerCase() as 'car' | 'bike' | undefined;
    if (filters.types.length && typeKey && !filters.types.includes(typeKey)) {
      return false;
    }
    if (filters.fuels.length && vehicle.fuelType && !filters.fuels.includes(vehicle.fuelType)) {
      return false;
    }
    if (
      filters.transmissions.length &&
      vehicle.transmission &&
      !filters.transmissions.includes(vehicle.transmission)
    ) {
      return false;
    }
    if (filters.brands.length && !filters.brands.includes(vehicle.brand)) {
      return false;
    }
    if (!matchesVehiclePrice(vehicle.price, filters.priceRange)) {
      return false;
    }
    return true;
  });
}

export function filterServices(services: IService[], filters: ServiceFilters) {
  return services.filter((service) => {
    if (filters.categories.length && service.category && !filters.categories.includes(service.category)) {
      return false;
    }
    if (filters.openNow && service.isActive === false) {
      return false;
    }
    if (!matchesServicePrice(service.price, filters.priceRange)) {
      return false;
    }
    return true;
  });
}
