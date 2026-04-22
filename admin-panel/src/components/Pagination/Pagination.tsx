import { motion } from 'framer-motion';
import React from 'react';

interface IPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
}

export const Pagination: React.FC<IPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };


  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-end gap-2 mt-4">
      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* First Page Button */}
        <motion.button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
          whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
          className="
            p-2
            rounded-lg
            bg-white/60 dark:bg-slate-700/60
            backdrop-blur-sm
            border border-slate-200 dark:border-slate-600
            text-slate-700 dark:text-slate-300
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-slate-100/80 dark:hover:bg-slate-600/80
            transition-all duration-200
            flex items-center justify-center
          "
          aria-label="First page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="11 17 6 12 11 7"></polyline>
            <polyline points="18 17 13 12 18 7"></polyline>
          </svg>
        </motion.button>

        {/* Previous Button */}
        <motion.button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
          whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
          className="
            p-2
            rounded-lg
            bg-white/60 dark:bg-slate-700/60
            backdrop-blur-sm
            border border-slate-200 dark:border-slate-600
            text-slate-700 dark:text-slate-300
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-slate-100/80 dark:hover:bg-slate-600/80
            transition-all duration-200
            flex items-center justify-center
          "
          aria-label="Previous page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </motion.button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-slate-500 dark:text-slate-400"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <motion.button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  min-w-[36px] h-9
                  px-3
                  rounded-lg
                  text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-600/80'
                  }
                `}
                aria-label={`Page ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </motion.button>
            );
          })}
        </div>

        {/* Next Button */}
        <motion.button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
          whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
          className="
            p-2
            rounded-lg
            bg-white/60 dark:bg-slate-700/60
            backdrop-blur-sm
            border border-slate-200 dark:border-slate-600
            text-slate-700 dark:text-slate-300
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-slate-100/80 dark:hover:bg-slate-600/80
            transition-all duration-200
            flex items-center justify-center
          "
          aria-label="Next page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </motion.button>

        {/* Last Page Button */}
        <motion.button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
          whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
          className="
            p-2
            rounded-lg
            bg-white/60 dark:bg-slate-700/60
            backdrop-blur-sm
            border border-slate-200 dark:border-slate-600
            text-slate-700 dark:text-slate-300
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-slate-100/80 dark:hover:bg-slate-600/80
            transition-all duration-200
            flex items-center justify-center
          "
          aria-label="Last page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="13 17 18 12 13 7"></polyline>
            <polyline points="6 17 11 12 6 7"></polyline>
          </svg>
        </motion.button>
      </div>
    </div>
  );
};

