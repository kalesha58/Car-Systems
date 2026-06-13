import { AnimatePresence, motion } from 'framer-motion';
import React, { ReactNode } from 'react';

interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<IModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`
              bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl
              rounded-2xl p-4 sm:p-6 md:p-8 w-[95%] sm:w-[90%] ${sizeClasses[size]}
              max-h-[90vh] overflow-auto
              shadow-2xl border border-white/20 dark:border-gray-700/50
            `}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white m-0">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="
                  bg-transparent border-none text-2xl cursor-pointer
                  text-gray-400 dark:text-gray-500 p-1 w-8 h-8
                  flex items-center justify-center rounded-lg
                  transition-all hover:bg-gray-100 dark:hover:bg-slate-700
                  hover:text-gray-900 dark:hover:text-white
                "
              >
                ×
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
