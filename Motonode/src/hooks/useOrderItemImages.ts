import { useEffect, useMemo, useState } from 'react';

import type { IOrderData } from '@app-types/order';
import { getProductById } from '@services/product.service';

export function useOrderItemImages(orders: IOrderData[]): Record<string, string> {
  const [images, setImages] = useState<Record<string, string>>({});

  const productIdsKey = useMemo(() => {
    const ids = new Set<string>();
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        if (item.productId) ids.add(item.productId);
      });
    });
    return [...ids].sort().join(',');
  }, [orders]);

  useEffect(() => {
    const productIds = productIdsKey ? productIdsKey.split(',') : [];
    if (!productIds.length) {
      setImages({});
      return;
    }

    let cancelled = false;

    void (async () => {
      const map: Record<string, string> = {};
      await Promise.all(
        productIds.map(async (productId) => {
          try {
            const res = await getProductById(productId);
            const image = res.success && res.Response?.products?.[0]?.images?.[0];
            if (image) map[productId] = image;
          } catch {
            // Product image is optional for order display.
          }
        }),
      );
      if (!cancelled) setImages(map);
    })();

    return () => {
      cancelled = true;
    };
  }, [productIdsKey]);

  return images;
}

export function getOrderItemImageUri(
  images: Record<string, string>,
  order: IOrderData,
  itemIndex = 0,
): string | undefined {
  const productId = order.items?.[itemIndex]?.productId;
  return productId ? images[productId] : undefined;
}
