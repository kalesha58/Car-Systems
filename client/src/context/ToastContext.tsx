import React, {createContext, useContext, useState, useCallback, FC, ReactNode} from 'react';
import {View, StyleSheet} from 'react-native';
import Toast from '@components/ui/Toast';
import {IToast, IToastConfig, ToastType} from '@types/toast/IToast';

interface IToastContext {
  showToast: (config: IToastConfig) => void;
}

const ToastContext = createContext<IToastContext | undefined>(undefined);

export const useToastContext = (): IToastContext => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
};

interface IToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: FC<IToastProviderProps> = ({children}) => {
  const [toasts, setToasts] = useState<IToast[]>([]);

  const showToast = useCallback((config: IToastConfig) => {
    const newToast: IToast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      message: config.message,
      type: config.type || 'success',
      duration: config.duration || 2000,
    };

    setToasts(prevToasts => [...prevToasts, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const styles = StyleSheet.create({
    toastContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'box-none',
      zIndex: 10000,
      elevation: 10000,
    },
  });

  return (
    <ToastContext.Provider value={{showToast}}>
      {children}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

