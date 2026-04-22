import { useToastStore } from '@store/toastStore';
import { AnimatePresence,motion } from 'framer-motion';

export const Toast = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  const getToastClasses = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-amber-500 text-black';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-primary-500 text-white';
    }
  };

  return (
    <div className="fixed top-5 right-5 z-[10000] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            onClick={() => removeToast(toast.id)}
            className={`
              ${getToastClasses(toast.type)}
              px-6 py-3 rounded-lg shadow-lg cursor-pointer min-w-[300px]
              transition-all hover:opacity-90
            `}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
