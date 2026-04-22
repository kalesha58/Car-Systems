import { Toast } from '@components/Toast/Toast';
import { useSidebarStore } from '@store/sidebarStore';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Navbar } from '../Navbar/Navbar';
import { Sidebar } from '../Sidebar/Sidebar';

export const MainLayout: React.FC = () => {
  const { isOpen } = useSidebarStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        useSidebarStore.getState().close();
      } else {
        useSidebarStore.getState().open();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-gray-900 dark:text-white">
      <Sidebar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="pt-[70px] transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isMobile 
            ? '0' 
            : isOpen ? '280px' : '80px',
        }}
      >
        <Navbar />
        <main className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-70px)] pb-20 sm:pb-8">
          <Outlet />
        </main>
        
        {/* Desktop View Message Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 px-4 py-3 z-[996] lg:hidden">
          <div className="flex items-center justify-center gap-2 text-sm text-blue-700 dark:text-blue-300">
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
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <span className="font-medium">
              This application is best viewed on desktop for optimal experience
            </span>
          </div>
        </div>
      </motion.div>
      <Toast />
    </div>
  );
};
