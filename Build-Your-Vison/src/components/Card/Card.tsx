import { motion } from 'framer-motion';
import React, { ReactNode } from 'react';

interface ICardProps {
  children: ReactNode;
  title?: string | ReactNode;
  className?: string;
  icon?: React.ComponentType<{ className?: string; size?: number | string }>;
  style?: React.CSSProperties;
}

export const Card: React.FC<ICardProps> = ({ children, title, className = '', icon: Icon, style }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={style}
      className={`
        bg-white/80 dark:bg-slate-800/80 
        backdrop-blur-xl
        rounded-xl sm:rounded-2xl 
        p-4 sm:p-5 md:p-6 
        shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50
        border border-slate-200/50 dark:border-slate-700/50
        hover:shadow-xl hover:shadow-slate-300/50 dark:hover:shadow-slate-900/70
        transition-all duration-300
        ${className}
      `}
    >
      {title && (
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6 pb-3 sm:pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
          {Icon && (
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-500/10 to-secondary-500/10 dark:from-primary-500/20 dark:to-secondary-500/20">
              <Icon size={18} className="sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
            </div>
          )}
          <div className="flex-1 m-0 text-slate-900 dark:text-white text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            {title}
          </div>
        </div>
      )}
      {children}
    </motion.div>
  );
};

