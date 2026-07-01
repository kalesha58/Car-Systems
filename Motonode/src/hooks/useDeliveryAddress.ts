import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getSavedAddresses } from '@services/address.service';
import type { IAddress } from '@app-types/address';
import {
  formatDeliveryAddressLabel,
  getSelectedDeliveryAddressId,
  pickDeliveryAddress,
} from '@utils/deliveryAddress';

interface UseDeliveryAddressResult {
  address: IAddress | null;
  displayLabel: string;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useDeliveryAddress(fallbackLabel = 'Set delivery location'): UseDeliveryAddressResult {
  const [address, setAddress] = useState<IAddress | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [addresses, selectedId] = await Promise.all([
        getSavedAddresses(),
        getSelectedDeliveryAddressId(),
      ]);
      const picked = pickDeliveryAddress(addresses, selectedId);
      setAddress(picked);
    } catch {
      setAddress(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const displayLabel = address ? formatDeliveryAddressLabel(address) : fallbackLabel;

  return { address, displayLabel, loading, refresh };
}
