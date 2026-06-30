import { useCallback, useEffect, useState } from 'react';

import { getProducts } from '@services/product.service';
import { getServices } from '@services/service.service';
import { getDealerVehicles } from '@services/vehicle.service';
import type { IProduct } from '@app-types/product';
import type { IService } from '@app-types/service';
import type { IDealerVehicle } from '@app-types/vehicle';
import { getApiErrorMessage } from '@utils/apiHelpers';

export function useProducts(limit = 50) {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProducts({ limit });
      if (response.success && response.Response?.products) {
        setProducts(response.Response.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { products, loading, error, reload: load };
}

export function useDealerVehiclesCatalog(limit = 50) {
  const [vehicles, setVehicles] = useState<IDealerVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDealerVehicles({ limit });
      if (response.success && response.Response?.vehicles) {
        setVehicles(response.Response.vehicles);
      } else {
        setVehicles([]);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { vehicles, loading, error, reload: load };
}

export function useServicesCatalog(limit = 50) {
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getServices({ limit });
      if (response.success && response.Response?.services) {
        setServices(response.Response.services);
      } else {
        setServices([]);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { services, loading, error, reload: load };
}
