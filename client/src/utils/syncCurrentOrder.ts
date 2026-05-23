import { getOrderById } from '@service/orderService';
import { useAuthStore } from '@state/authStore';
import { IOrderData } from '../types/order/IOrder';
import {
  getCurrentOrderId,
  isFinishedOrderStatus,
} from './activeOrderUtils';

export type ISyncCurrentOrderResult = {
  canPlaceNewOrder: boolean;
  activeOrder: IOrderData | null;
};

const isNotFoundOrForbidden = (error: unknown): boolean => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 404 || status === 403;
};

/**
 * Fetches latest order status from the server and updates persisted currentOrder.
 */
export async function syncCurrentOrderBeforeCheckout(): Promise<ISyncCurrentOrderResult> {
  const { currentOrder, setCurrentOrder } = useAuthStore.getState();
  const orderId = getCurrentOrderId(currentOrder);

  if (!orderId) {
    if (currentOrder) {
      setCurrentOrder(null);
    }
    return { canPlaceNewOrder: true, activeOrder: null };
  }

  try {
    const data = await getOrderById(orderId);

    if (!data) {
      setCurrentOrder(null);
      return { canPlaceNewOrder: true, activeOrder: null };
    }

    if (isFinishedOrderStatus(data.status)) {
      setCurrentOrder(null);
      return { canPlaceNewOrder: true, activeOrder: null };
    }

    setCurrentOrder(data);
    return { canPlaceNewOrder: false, activeOrder: data };
  } catch (error) {
    if (isNotFoundOrForbidden(error)) {
      setCurrentOrder(null);
      return { canPlaceNewOrder: true, activeOrder: null };
    }

    const localStatus =
      typeof currentOrder?.status === 'string' ? currentOrder.status : '';
    if (isFinishedOrderStatus(localStatus)) {
      setCurrentOrder(null);
      return { canPlaceNewOrder: true, activeOrder: null };
    }

    return { canPlaceNewOrder: false, activeOrder: currentOrder as IOrderData };
  }
}

/** Silent refresh for cart focus / live banner (no return value needed). */
export async function refreshCurrentOrderFromServer(): Promise<void> {
  await syncCurrentOrderBeforeCheckout();
}
