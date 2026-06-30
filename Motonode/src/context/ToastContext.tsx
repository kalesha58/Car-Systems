import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Pressable } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useColors } from '@hooks/useColors';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<any>(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [slideAnim, opacityAnim]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setToast({ message, type });

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, 3000);
    },
    [slideAnim, opacityAnim, hideToast]
  );

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: '#DEF7EC',
          border: '#31C48D',
          text: '#03543F',
          icon: 'check-circle' as const,
        };
      case 'error':
        return {
          bg: '#FDE8E8',
          border: '#F98080',
          text: '#9B1C1C',
          icon: 'alert-circle' as const,
        };
      case 'warning':
        return {
          bg: '#FDF6B2',
          border: '#F3C022',
          text: '#723B10',
          icon: 'alert-triangle' as const,
        };
      case 'info':
      default:
        return {
          bg: '#E1EFFE',
          border: '#76A9FA',
          text: '#1E429F',
          icon: 'info' as const,
        };
    }
  };

  const currentStyle = toast ? getToastStyle(toast.type) : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && currentStyle && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
              backgroundColor: currentStyle.bg,
              borderColor: currentStyle.border,
            },
          ]}
        >
          <Pressable style={styles.pressable} onPress={hideToast}>
            <Feather name={currentStyle.icon} size={20} color={currentStyle.border} />
            <Text style={[styles.message, { color: currentStyle.text }]}>{toast.message}</Text>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
});
