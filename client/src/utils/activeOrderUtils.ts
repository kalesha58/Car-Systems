/**
 * Order statuses where the customer may place a new order (no active fulfillment).
 * Aligns with server terminal states plus DELIVERED.
 */
export const FINISHED_ORDER_STATUSES = [
  'DELIVERED',
  'CANCELLED_BY_USER',
  'CANCELLED_BY_DEALER',
  'PAYMENT_FAILED',
  'COD_NOT_COLLECTED',
  'REFUND_COMPLETED',
] as const;

/** In-progress fulfillment; block placing another order. */
export const ACTIVE_ORDER_STATUSES = [
  'ORDER_PLACED',
  'PENDING_COD',
  'PENDING_PAYMENT',
  'PAYMENT_CONFIRMED',
  'ORDER_CONFIRMED',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'RETURN_REQUESTED',
  'RETURN_PICKED',
  'REFUND_INITIATED',
] as const;

const normalizeStatus = (status: string): string =>
  (status || '').trim().toUpperCase();

export const isFinishedOrderStatus = (status: string): boolean => {
  const normalized = normalizeStatus(status);
  if (!normalized) {
    return false;
  }
  if (normalized.includes('CANCEL')) {
    return true;
  }
  return (FINISHED_ORDER_STATUSES as readonly string[]).includes(normalized);
};

export const isActiveOrderStatus = (status: string): boolean => {
  const normalized = normalizeStatus(status);
  if (!normalized) {
    return false;
  }
  if (isFinishedOrderStatus(normalized)) {
    return false;
  }
  return (ACTIVE_ORDER_STATUSES as readonly string[]).includes(normalized);
};

export const getCurrentOrderId = (order: Record<string, unknown> | null): string | null => {
  if (!order) {
    return null;
  }
  const id = order.id ?? order._id;
  return typeof id === 'string' && id.length > 0 ? id : null;
};
