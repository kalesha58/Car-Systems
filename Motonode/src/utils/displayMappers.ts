import type { IDealerVehicle } from '../types/vehicle';
import type { IProduct } from '../types/product';
import type { IService } from '../types/service';
import type { IOrderData } from '../types/order';
import { resolveEntityId } from './apiHelpers';

export function getVehicleDisplayName(vehicle: IDealerVehicle): string {
  return `${vehicle.brand} ${vehicle.vehicleModel}`.trim();
}

export function getServiceDurationLabel(service: IService): string {
  const mins = service.durationMinutes;
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

export function getProductId(product: IProduct): string {
  return resolveEntityId(product);
}

export function getVehicleId(vehicle: IDealerVehicle): string {
  return resolveEntityId(vehicle);
}

export function getServiceId(service: IService): string {
  return resolveEntityId(service);
}

export function getOrderId(order: IOrderData): string {
  return resolveEntityId(order);
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export type ProductStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export function getProductStockStatus(stock: number): ProductStockStatus {
  if (stock === 0) return 'out_of_stock';
  if (stock <= 10) return 'low_stock';
  return 'in_stock';
}

export function getProductImage(product: IProduct): string {
  return product.images?.[0] || 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&auto=format&fit=crop&q=80';
}

export function getVehicleImage(vehicle: IDealerVehicle): string {
  if (vehicle.images?.[0]) return vehicle.images[0];
  return vehicle.vehicleType === 'Bike'
    ? 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=200&auto=format&fit=crop&q=80';
}

export function getServiceImage(service: IService): string {
  return service.images?.[0] || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=80';
}

export function parseDurationMinutes(duration: string): number {
  const normalized = duration.trim().toLowerCase();
  if (normalized.includes('day')) {
    const days = parseFloat(normalized) || 1;
    return Math.round(days * 24 * 60);
  }
  if (normalized.includes('hr')) {
    const hours = parseFloat(normalized) || 1;
    return Math.round(hours * 60);
  }
  const mins = parseInt(normalized, 10);
  return Number.isNaN(mins) ? 60 : mins;
}

export function formatOrderDateParts(isoDate: string): { date: string; time: string } {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return { date: isoDate, time: '' };
  }
  return {
    date: parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: parsed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function getOrderPrimaryItemName(order: IOrderData): string {
  if (!order.items?.length) return 'Order items';
  const first = order.items[0];
  const extra = order.items.length > 1 ? ` +${order.items.length - 1} more` : '';
  return `${first.name}${extra}`;
}

export function getOrderItemQty(order: IOrderData): number {
  return order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
}

export function getOrderShippingAddress(order: IOrderData): string {
  const addr = order.shippingAddress;
  if (!addr) return order.customer?.address || '—';
  return [addr.street, addr.city, addr.state].filter(Boolean).join(', ');
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  order_placed: 'Pending',
  payment_confirmed: 'Pending',
  pending_cod: 'Pending',
  pending_payment: 'Pending',
  order_confirmed: 'Accepted',
  packed: 'Packed',
  shipped: 'Ready',
  out_for_delivery: 'Ready',
  delivered: 'Delivered',
  cancelled_by_user: 'Cancelled',
  cancelled_by_dealer: 'Cancelled',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  order_placed: '#F59E0B',
  payment_confirmed: '#F59E0B',
  pending_cod: '#F59E0B',
  pending_payment: '#F59E0B',
  order_confirmed: '#FF1A1A',
  packed: '#8B5CF6',
  shipped: '#10B981',
  out_for_delivery: '#10B981',
  delivered: '#10B981',
  cancelled_by_user: '#EF4444',
  cancelled_by_dealer: '#EF4444',
};

export function normalizeOrderStatus(status: string): string {
  return (status || '').toLowerCase();
}

export function getOrderStatusLabel(status: string): string {
  const key = normalizeOrderStatus(status);
  return ORDER_STATUS_LABELS[key] || status.replace(/_/g, ' ');
}

export function getOrderStatusColor(status: string): string {
  const key = normalizeOrderStatus(status);
  return ORDER_STATUS_COLORS[key] || '#E60012';
}

export function getNextDealerOrderStatus(status: string): string | null {
  const key = normalizeOrderStatus(status);
  switch (key) {
    case 'order_placed':
    case 'payment_confirmed':
    case 'pending_cod':
      return 'ORDER_CONFIRMED';
    case 'order_confirmed':
      return 'PACKED';
    case 'packed':
      return 'SHIPPED';
    case 'shipped':
      return 'OUT_FOR_DELIVERY';
    case 'out_for_delivery':
      return 'DELIVERED';
    default:
      return null;
  }
}

export function getNextDealerOrderLabel(status: string): string | null {
  const key = normalizeOrderStatus(status);
  switch (key) {
    case 'order_placed':
    case 'payment_confirmed':
    case 'pending_cod':
      return 'Accept';
    case 'order_confirmed':
      return 'Mark Packed';
    case 'packed':
      return 'Mark Shipped';
    case 'shipped':
      return 'Out for Delivery';
    case 'out_for_delivery':
      return 'Mark Delivered';
    default:
      return null;
  }
}

export function matchesOrderFilter(status: string, filter: string): boolean {
  const key = normalizeOrderStatus(status);
  switch (filter.toLowerCase()) {
    case 'all':
      return true;
    case 'pending':
      return ['order_placed', 'payment_confirmed', 'pending_cod', 'pending_payment'].includes(key);
    case 'accepted':
      return key === 'order_confirmed';
    case 'packed':
      return key === 'packed';
    case 'ready':
      return ['shipped', 'out_for_delivery'].includes(key);
    case 'delivered':
      return key === 'delivered';
    case 'cancelled':
      return ['cancelled_by_user', 'cancelled_by_dealer'].includes(key);
    default:
      return key === filter.toLowerCase();
  }
}

export function canCancelDealerOrder(status: string): boolean {
  const key = normalizeOrderStatus(status);
  return !['delivered', 'cancelled_by_user', 'cancelled_by_dealer'].includes(key);
}

export const DEALER_ORDER_LIFECYCLE_STEPS = [
  {
    key: 'placed',
    label: 'Order Placed',
    description: 'Customer placed the order',
    icon: 'shopping-bag' as const,
  },
  {
    key: 'accepted',
    label: 'Accepted',
    description: 'You confirmed the order',
    icon: 'check-circle' as const,
  },
  {
    key: 'packed',
    label: 'Packed',
    description: 'Items packed and ready',
    icon: 'package' as const,
  },
  {
    key: 'shipped',
    label: 'Shipped',
    description: 'Handed to delivery partner',
    icon: 'truck' as const,
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    description: 'On the way to customer',
    icon: 'navigation' as const,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Order completed',
    icon: 'flag' as const,
  },
] as const;

export function getDealerOrderStepIndex(status: string): number {
  const key = normalizeOrderStatus(status);
  switch (key) {
    case 'order_placed':
    case 'payment_confirmed':
    case 'pending_cod':
    case 'pending_payment':
      return 0;
    case 'order_confirmed':
      return 1;
    case 'packed':
      return 2;
    case 'shipped':
      return 3;
    case 'out_for_delivery':
      return 4;
    case 'delivered':
      return 5;
    default:
      return -1;
  }
}

export function isDealerOrderCancelled(status: string): boolean {
  const key = normalizeOrderStatus(status);
  return ['cancelled_by_user', 'cancelled_by_dealer'].includes(key);
}

export type OrderDisplayStatus =
  | 'Processing'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export function normalizeOrderDisplayStatus(status: string): OrderDisplayStatus {
  const normalized = status.toLowerCase().replace(/_/g, ' ');
  if (normalized.includes('cancel')) return 'Cancelled';
  if (normalized.includes('deliver') && !normalized.includes('out')) return 'Delivered';
  if (normalized.includes('out') && normalized.includes('deliver')) return 'Out for Delivery';
  if (normalized.includes('ship')) return 'Shipped';
  return 'Processing';
}

export function formatOrderDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
