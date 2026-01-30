import {useState, useEffect} from 'react';
import {useAuthStore} from '@state/authStore';
import {getBusinessRegistrationByUserId, IBusinessRegistration} from '@service/dealerService';

interface UseBusinessRegistrationReturn {
  businessRegistration: IBusinessRegistration | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useBusinessRegistration = (): UseBusinessRegistrationReturn => {
  const {user} = useAuthStore();
  const [businessRegistration, setBusinessRegistration] = useState<IBusinessRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBusinessRegistration = async () => {
    const userId = user?.id || user?._id;
    if (!userId) {
      setBusinessRegistration(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const registration = await getBusinessRegistrationByUserId(userId);
      setBusinessRegistration(registration);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch business registration'));
      setBusinessRegistration(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessRegistration();
  }, [user?.id, user?._id]);

  return {
    businessRegistration,
    loading,
    error,
    refetch: fetchBusinessRegistration,
  };
};
