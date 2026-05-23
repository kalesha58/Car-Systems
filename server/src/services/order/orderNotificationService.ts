import { OrderStatus } from '../../models/Order';
import { sendPushNotification, createNotification } from '../notificationService';
import { logger } from '../../utils/logger';

export type OrderNotificationActor = 'user' | 'dealer' | 'admin' | 'system';

export interface INotifyOrderStatusChangeParams {
  userId: string;
  orderId: string;
  orderNumber: string;
  newStatus: OrderStatus | string;
  previousStatus?: OrderStatus | string;
  notes?: string;
  actor?: OrderNotificationActor;
}

export interface INotifyOrderStatusChangeResult {
  pushSent: boolean;
  inAppCreated: boolean;
}

interface IStatusMessage {
  title: string;
  body: string;
}

const STATUS_MESSAGES: Record<string, IStatusMessage> = {
  ORDER_PLACED: {
    title: 'Order Placed',
    body: 'Your order {orderNumber} has been placed. We will keep you updated.',
  },
  PENDING_COD: {
    title: 'COD Order Placed',
    body: 'Your cash on delivery order {orderNumber} is confirmed. Pay when you receive it.',
  },
  PENDING_PAYMENT: {
    title: 'Complete Your Payment',
    body: 'Please complete payment for order {orderNumber} to confirm your order.',
  },
  PAYMENT_CONFIRMED: {
    title: 'Payment Received',
    body: 'Payment for order {orderNumber} was successful. Your order is being processed.',
  },
  PAYMENT_FAILED: {
    title: 'Payment Failed',
    body: 'Payment for order {orderNumber} could not be completed. You can retry or choose another method.',
  },
  ORDER_CONFIRMED: {
    title: 'Order Confirmed',
    body: 'Your order {orderNumber} has been confirmed and is being prepared.',
  },
  PACKED: {
    title: 'Order Packed',
    body: 'Your order {orderNumber} has been packed and is ready to ship.',
  },
  SHIPPED: {
    title: 'Order Shipped',
    body: 'Your order {orderNumber} has been shipped.',
  },
  OUT_FOR_DELIVERY: {
    title: 'Out for Delivery',
    body: 'Your order {orderNumber} is on its way to you.',
  },
  DELIVERED: {
    title: 'Order Delivered',
    body: 'Your order {orderNumber} has been delivered. Thank you for shopping with us.',
  },
  CANCELLED_BY_USER: {
    title: 'Order Cancelled',
    body: 'Your order {orderNumber} has been cancelled.',
  },
  CANCELLED_BY_DEALER: {
    title: 'Order Cancelled',
    body: 'Your order {orderNumber} was cancelled by the seller.',
  },
  COD_NOT_COLLECTED: {
    title: 'COD Not Collected',
    body: 'Cash on delivery for order {orderNumber} was not collected.',
  },
  RETURN_REQUESTED: {
    title: 'Return Requested',
    body: 'A return has been requested for order {orderNumber}.',
  },
  RETURN_PICKED: {
    title: 'Return Picked Up',
    body: 'Your return for order {orderNumber} has been picked up.',
  },
  REFUND_INITIATED: {
    title: 'Refund Initiated',
    body: 'A refund has been initiated for order {orderNumber}.',
  },
  REFUND_COMPLETED: {
    title: 'Refund Completed',
    body: 'Your refund for order {orderNumber} has been completed.',
  },
};

const formatBody = (template: string, orderNumber: string): string =>
  template.replace(/\{orderNumber\}/g, orderNumber);

export const getOrderStatusMessage = (
  status: string,
  orderNumber: string,
): IStatusMessage => {
  const normalized = (status || '').toUpperCase();
  const template = STATUS_MESSAGES[normalized] || {
    title: 'Order Update',
    body: `Your order ${orderNumber} status is now ${normalized.replace(/_/g, ' ').toLowerCase()}.`,
  };

  return {
    title: template.title,
    body: formatBody(template.body, orderNumber),
  };
};

/**
 * Notify the customer via FCM push and in-app notification for an order status change.
 */
export const notifyOrderStatusChange = async (
  params: INotifyOrderStatusChangeParams,
): Promise<INotifyOrderStatusChangeResult> => {
  const {
    userId,
    orderId,
    orderNumber,
    newStatus,
    previousStatus,
    notes,
    actor,
  } = params;

  if (
    previousStatus &&
    String(previousStatus).toUpperCase() === String(newStatus).toUpperCase()
  ) {
    return { pushSent: false, inAppCreated: false };
  }

  const { title, body } = getOrderStatusMessage(String(newStatus), orderNumber);
  const statusKey = String(newStatus).toUpperCase();

  const notificationData: Record<string, string> = {
    type: statusKey === 'PAYMENT_CONFIRMED' || statusKey === 'PAYMENT_FAILED'
      ? 'payment'
      : 'order_update',
    orderId,
    orderNumber,
    status: statusKey,
  };
  if (actor) {
    notificationData.actor = actor;
  }
  if (notes) {
    notificationData.notes = notes;
  }

  let pushSent = false;
  let inAppCreated = false;

  try {
    pushSent = await sendPushNotification(userId, {
      title,
      body,
      data: notificationData,
    });
  } catch (error) {
    logger.error('Error sending order push notification:', {
      userId,
      orderId,
      newStatus,
      error,
    });
  }

  try {
    await createNotification({
      userId,
      type: 'order_update',
      title,
      body,
      data: {
        orderId,
        orderNumber,
        status: statusKey,
        actor,
        notes,
      },
      relatedId: orderId,
    });
    inAppCreated = true;
  } catch (error) {
    logger.error('Error creating in-app order notification:', {
      userId,
      orderId,
      newStatus,
      error,
    });
  }

  return { pushSent, inAppCreated };
};

/**
 * Convenience helper when an order document is available.
 */
export const notifyOrderFromDocument = async (
  order: {
    userId: string;
    orderNumber: string;
    status: OrderStatus | string;
  },
  orderId: string,
  options?: {
    previousStatus?: OrderStatus | string;
    notes?: string;
    actor?: OrderNotificationActor;
  },
): Promise<INotifyOrderStatusChangeResult> => {
  return notifyOrderStatusChange({
    userId: order.userId,
    orderId,
    orderNumber: order.orderNumber,
    newStatus: order.status,
    previousStatus: options?.previousStatus,
    notes: options?.notes,
    actor: options?.actor,
  });
};
