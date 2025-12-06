export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface IToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
}

export interface IToast extends IToastConfig {
  id: string;
  type: ToastType;
  duration: number;
}

