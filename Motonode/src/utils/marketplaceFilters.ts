import type { Product, Service, Vehicle } from '@data/mockData';
import type {
  ProductFilters,
  ServiceFilters,
  VehicleFilters,
} from '@components/marketplace/MarketplaceFilterSheet';

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

export function filterProducts(products: Product[], filters: ProductFilters) {
  return products.filter((product) => {
    if (filters.categories.length && !filters.categories.includes(product.category)) {
      return false;
    }
    if (filters.brands.length && !filters.brands.includes(product.brand)) {
      return false;
    }
    if (!matchesProductPrice(product.price, filters.priceRange)) {
      return false;
    }
    if (filters.inStockOnly && !product.inStock) {
      return false;
    }
    return true;
  });
}

export function filterVehicles(vehicles: Vehicle[], filters: VehicleFilters) {
  return vehicles.filter((vehicle) => {
    if (filters.types.length && !filters.types.includes(vehicle.type)) {
      return false;
    }
    if (filters.fuels.length && !filters.fuels.includes(vehicle.fuel)) {
      return false;
    }
    if (filters.transmissions.length && !filters.transmissions.includes(vehicle.transmission)) {
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

export function filterServices(services: Service[], filters: ServiceFilters) {
  return services.filter((service) => {
    if (filters.categories.length && !filters.categories.includes(service.category)) {
      return false;
    }
    if (filters.openNow && !service.isOpen) {
      return false;
    }
    if (!matchesServicePrice(service.price, filters.priceRange)) {
      return false;
    }
    return true;
  });
}
