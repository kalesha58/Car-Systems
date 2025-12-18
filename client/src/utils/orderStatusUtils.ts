export interface IOrderStatusDisplay {
  message: string;
  timeEstimate: string;
}

/**
 * Maps order status to display message and time estimate
 * Handles both status systems:
 * - Simple: "available", "confirmed", "arriving", "delivered"
 * - Complex: "ORDER_PLACED", "ORDER_CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"
 */
export const getOrderStatusDisplay = (status: string): IOrderStatusDisplay => {
  const normalizedStatus = status?.toLowerCase() || '';

  // Handle simple status system
  if (normalizedStatus === 'available' || normalizedStatus === 'order_placed') {
    return {
      message: 'Packing your order',
      timeEstimate: 'Arriving in 10 minutes',
    };
  }

  if (normalizedStatus === 'confirmed' || normalizedStatus === 'order_confirmed') {
    return {
      message: 'Arriving Soon',
      timeEstimate: 'Arriving in 8 minutes',
    };
  }

  if (normalizedStatus === 'packed') {
    return {
      message: 'Order Packed',
      timeEstimate: 'Preparing dispatch',
    };
  }

  if (normalizedStatus === 'shipped') {
    return {
      message: 'Order Shipped',
      timeEstimate: 'On the way',
    };
  }

  if (normalizedStatus === 'arriving' || normalizedStatus === 'out_for_delivery') {
    return {
      message: 'Order Picked Up',
      timeEstimate: 'Arriving in 6 minutes',
    };
  }

  if (normalizedStatus === 'delivered') {
    return {
      message: 'Order Delivered',
      timeEstimate: 'Fastest Delivery ⚡️',
    };
  }

  // Default fallback
  return {
    message: 'Processing your order',
    timeEstimate: 'Please wait',
  };
};

/**
 * Checks if order has been accepted by dealer
 */
export const isOrderAccepted = (status: string): boolean => {
  const normalizedStatus = status?.toLowerCase() || '';
  return (
    normalizedStatus === 'confirmed' ||
    normalizedStatus === 'order_confirmed' ||
    normalizedStatus === 'packed' ||
    normalizedStatus === 'shipped' ||
    normalizedStatus === 'arriving' ||
    normalizedStatus === 'out_for_delivery' ||
    normalizedStatus === 'delivered'
  );
};

/**
 * Checks if order has been picked up
 */
export const isOrderPickedUp = (status: string): boolean => {
  const normalizedStatus = status?.toLowerCase() || '';
  return (
    normalizedStatus === 'packed' ||
    normalizedStatus === 'shipped' ||
    normalizedStatus === 'arriving' ||
    normalizedStatus === 'out_for_delivery' ||
    normalizedStatus === 'delivered'
  );
};

