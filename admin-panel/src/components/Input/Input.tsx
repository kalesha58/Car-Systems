import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import React from 'react';

interface IInputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  icon?: React.ComponentType<{ className?: string; size?: number | string }>;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}

export const Input: React.FC<IInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  onKeyPress,
  icon: Icon,
  onFocus,
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mb-5"
    >
      {label && (
        <label className="block mb-2 text-[#1e293b] dark:text-slate-300 font-medium text-sm">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          onFocus={onFocus}
          onClick={onClick}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full 
            ${Icon ? 'pl-11 pr-4' : 'px-4'} 
            py-3 
            border 
            rounded-lg
            bg-white dark:bg-slate-800
            text-slate-900 dark:text-white 
            text-base 
            outline-none 
            transition-all duration-200
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-600 focus:border-[#1e40af] dark:focus:border-[#60a5fa] focus:ring-1 focus:ring-[#1e40af] dark:focus:ring-[#60a5fa]'
            } 
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:border-slate-400 dark:hover:border-slate-500
          `}
        />
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"
          >
            <AlertCircle size={18} />
          </motion.div>
        )}
      </div>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center gap-1.5 text-red-500 text-sm font-medium"
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </motion.div>
      )}
    </motion.div>
  );
};
