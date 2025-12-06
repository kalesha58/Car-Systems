import {useToastContext} from '@context/ToastContext';
import {IToastConfig} from '@types/toast/IToast';

export const useToast = () => {
  const {showToast} = useToastContext();

  const showSuccess = (message: string, duration?: number) => {
    showToast({message, type: 'success', duration});
  };

  const showError = (message: string, duration?: number) => {
    showToast({message, type: 'error', duration});
  };

  const showWarning = (message: string, duration?: number) => {
    showToast({message, type: 'warning', duration});
  };

  const showInfo = (message: string, duration?: number) => {
    showToast({message, type: 'info', duration});
  };

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

