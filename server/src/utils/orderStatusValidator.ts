import { OrderStatus, TimelineActor } from '../models/Order';
import { AppError } from './errorHandler';

/**
 * Valid status transitions for each role
 */
const validTransitions: Record<
  OrderStatus,
  { user: OrderStatus[]; dealer: OrderStatus[]; admin: OrderStatus[]; system: OrderStatus[] }
> = {
  ORDER_PLACED: {
    user: ['CANCELLED_BY_USER'],
    dealer: ['ORDER_CONFIRMED', 'CANCELLED_BY_DEALER'],
    admin: [
      'PAYMENT_CONFIRMED',
      'ORDER_CONFIRMED',
      'CANCELLED_BY_USER',
      'CANCELLED_BY_DEALER',
    ],
    system: ['PAYMENT_CONFIRMED', 'PENDING_COD', 'PENDING_PAYMENT'],
  },
  PENDING_COD: {
    user: ['CANCELLED_BY_USER'],
    dealer: ['ORDER_CONFIRMED', 'CANCELLED_BY_DEALER'],
    admin: [
      'PAYMENT_CONFIRMED',
      'ORDER_CONFIRMED',
      'CANCELLED_BY_USER',
      'CANCELLED_BY_DEALER',
      'COD_NOT_COLLECTED',
    ],
    system: ['PAYMENT_CONFIRMED', 'COD_NOT_COLLECTED'],
  },
  PENDING_PAYMENT: {
    user: ['CANCELLED_BY_USER'],
    dealer: ['CANCELLED_BY_DEALER'],
    admin: ['CANCELLED_BY_USER', 'CANCELLED_BY_DEALER', 'PAYMENT_FAILED'],
    system: ['PAYMENT_CONFIRMED', 'PAYMENT_FAILED'],
  },
  PAYMENT_FAILED: {
    user: ['CANCELLED_BY_USER'],
    dealer: ['CANCELLED_BY_DEALER'],
    admin: ['CANCELLED_BY_USER', 'CANCELLED_BY_DEALER'],
    system: ['CANCELLED_BY_USER'],
  },
  COD_NOT_COLLECTED: {
    user: ['CANCELLED_BY_USER'],
    dealer: ['CANCELLED_BY_DEALER'],
    admin: ['CANCELLED_BY_USER', 'CANCELLED_BY_DEALER'],
    system: ['CANCELLED_BY_USER'],
  },
  PAYMENT_CONFIRMED: {
    user: ['CANCELLED_BY_USER'],
    dealer: ['ORDER_CONFIRMED', 'CANCELLED_BY_DEALER'],
    admin: ['ORDER_CONFIRMED', 'CANCELLED_BY_USER', 'CANCELLED_BY_DEALER'],
    system: [],
  },
  ORDER_CONFIRMED: {
    user: ['CANCELLED_BY_USER'],
    dealer: ['PACKED', 'CANCELLED_BY_DEALER'],
    admin: ['PACKED', 'CANCELLED_BY_USER', 'CANCELLED_BY_DEALER'],
    system: [],
  },
  PACKED: {
    user: ['CANCELLED_BY_USER'],
    dealer: ['SHIPPED'],
    admin: ['SHIPPED', 'CANCELLED_BY_USER', 'CANCELLED_BY_DEALER'],
    system: [],
  },
  SHIPPED: {
    user: [],
    dealer: ['OUT_FOR_DELIVERY'],
    admin: ['OUT_FOR_DELIVERY', 'DELIVERED'],
    system: ['OUT_FOR_DELIVERY'],
  },
  OUT_FOR_DELIVERY: {
    user: [],
    dealer: ['DELIVERED'],
    admin: ['DELIVERED'],
    system: ['DELIVERED'],
  },
  DELIVERED: {
    user: ['RETURN_REQUESTED'],
    dealer: [],
    admin: ['RETURN_REQUESTED'],
    system: [],
  },
  CANCELLED_BY_USER: {
    user: [],
    dealer: [],
    admin: [],
    system: [],
  },
  CANCELLED_BY_DEALER: {
    user: [],
    dealer: [],
    admin: [],
    system: [],
  },
  RETURN_REQUESTED: {
    user: [],
    dealer: [],
    admin: ['RETURN_PICKED', 'REFUND_INITIATED'],
    system: [],
  },
  RETURN_PICKED: {
    user: [],
    dealer: [],
    admin: ['REFUND_INITIATED'],
    system: [],
  },
  REFUND_INITIATED: {
    user: [],
    dealer: [],
    admin: ['REFUND_COMPLETED'],
    system: ['REFUND_COMPLETED'],
  },
  REFUND_COMPLETED: {
    user: [],
    dealer: [],
    admin: [],
    system: [],
  },
};

/**
 * Validate if a status transition is allowed for a given role
 */
export const validateStatusTransition = (
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  actor: TimelineActor,
): boolean => {
  const allowedStatuses = validTransitions[currentStatus]?.[actor] || [];
  return allowedStatuses.includes(newStatus);
};

/**
 * Get allowed status transitions for a given role and current status
 */
export const getAllowedStatusTransitions = (
  currentStatus: OrderStatus,
  actor: TimelineActor,
): OrderStatus[] => {
  return validTransitions[currentStatus]?.[actor] || [];
};

/**
 * Validate and throw error if transition is invalid
 */
export const validateStatusTransitionOrThrow = (
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  actor: TimelineActor,
): void => {
  if (!validateStatusTransition(currentStatus, newStatus, actor)) {
    throw new AppError(
      `Invalid status transition from ${currentStatus} to ${newStatus} for role ${actor}`,
      400,
    );
  }
};

/**
 * Check if a status allows cancellation by user
 */
export const canUserCancel = (status: OrderStatus): boolean => {
  return [
    'ORDER_PLACED',
    'PENDING_COD',
    'PENDING_PAYMENT',
    'PAYMENT_FAILED',
    'PAYMENT_CONFIRMED',
    'ORDER_CONFIRMED',
    'PACKED',
  ].includes(status);
};

/**
 * Check if a status allows cancellation by dealer
 */
export const canDealerCancel = (status: OrderStatus): boolean => {
  return [
    'ORDER_PLACED',
    'PENDING_COD',
    'PENDING_PAYMENT',
    'PAYMENT_FAILED',
    'PAYMENT_CONFIRMED',
    'ORDER_CONFIRMED',
    'COD_NOT_COLLECTED',
  ].includes(status);
};

/**
 * Check if a status allows return request
 */
export const canRequestReturn = (status: OrderStatus): boolean => {
  return status === 'DELIVERED';
};

/**
 * Check if order is in a terminal state (cannot be changed)
 */
export const isTerminalStatus = (status: OrderStatus): boolean => {
  return [
    'CANCELLED_BY_USER',
    'CANCELLED_BY_DEALER',
    'REFUND_COMPLETED',
    'PAYMENT_FAILED',
    'COD_NOT_COLLECTED',
  ].includes(status);
};

