import { motion } from 'framer-motion';
import React, { ReactNode } from 'react';

interface IButtonProps {
  children?: ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string; size?: number | string }>;
  style?: React.CSSProperties;
}

export const Button: React.FC<IButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  fullWidth = false,
  loading = false,
  icon: Icon,
  style,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#1e40af] dark:bg-[#1e40af] text-white border-none shadow-md hover:bg-[#1e3a8a] dark:hover:bg-[#1e3a8a] hover:shadow-lg transition-all';
      case 'secondary':
        return 'bg-[#3b82f6] dark:bg-[#3b82f6] text-white border-none shadow-md hover:bg-[#2563eb] dark:hover:bg-[#2563eb] hover:shadow-lg transition-all';
      case 'danger':
        return 'bg-[#dc2626] dark:bg-[#dc2626] text-white border-none shadow-md hover:bg-[#b91c1c] dark:hover:bg-[#b91c1c] hover:shadow-lg transition-all';
      case 'outline':
        return 'bg-transparent text-[#1e40af] dark:text-[#60a5fa] border-2 border-[#1e40af]/30 dark:border-[#60a5fa]/30 hover:bg-[#1e40af]/5 dark:hover:bg-[#60a5fa]/10 hover:border-[#1e40af] dark:hover:border-[#60a5fa] transition-all';
      default:
        return 'bg-[#1e40af] dark:bg-[#1e40af] text-white border-none shadow-md hover:bg-[#1e3a8a] dark:hover:bg-[#1e3a8a] hover:shadow-lg transition-all';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs';
      case 'lg':
        return 'px-6 py-2.5 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getSpinnerSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'lg':
        return 'h-5 w-5';
      default:
        return 'h-4 w-4';
    }
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      style={style}
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        rounded-xl
        font-semibold
        transition-all duration-200
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        flex items-center justify-center gap-2
        relative overflow-hidden
      `}
    >
      {loading && (
        <motion.svg
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className={`${getSpinnerSize()} text-current`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </motion.svg>
      )}
      {Icon && !loading && (
        <Icon size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} className="text-current" />
      )}
      {children}
    </motion.button>
  );
};
