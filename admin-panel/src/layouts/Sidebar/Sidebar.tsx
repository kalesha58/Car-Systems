import { ConfirmModal } from '@components/ConfirmModal/ConfirmModal';
import { Tooltip } from '@components/Tooltip/Tooltip';
import { useAuthStore } from '@store/authStore';
import { useSidebarStore } from '@store/sidebarStore';
import { colorSchemes } from '@theme/colorSchemes';
import { useTheme } from '@theme/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

import { dashboardNavItem, navGroups } from './sidebarNavConfig';
import { SidebarNavGroup } from './SidebarNavGroup';

export const Sidebar = () => {
  const { logout } = useAuthStore();
  const { isOpen } = useSidebarStore();
  const { colorScheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const schemeConfig = colorSchemes[colorScheme];
  const primaryColor = schemeConfig.primary;
  const secondaryColor = schemeConfig.secondary;

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigate = useCallback(() => {
    if (isMobile) {
      useSidebarStore.getState().close();
    }
  }, [isMobile]);

  const sidebarVariants = {
    open: {
      width: isMobile ? '280px' : '280px',
      x: 0,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
    closed: {
      width: isMobile ? '280px' : '80px',
      x: isMobile ? -280 : 0,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
  };

  const contentVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.1,
        duration: 0.2,
      },
    },
    closed: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const DashboardIcon = dashboardNavItem.icon;

  const dashboardLink = (
    <NavLink
      to={dashboardNavItem.path}
      onClick={handleNavigate}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline transition-all duration-200 ${
          isActive
            ? 'text-white shadow-lg'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-700/50'
        }`
      }
      style={({ isActive }) =>
        isActive
          ? {
              background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
              boxShadow: `0 10px 15px -3px ${primaryColor}30, 0 4px 6px -2px ${primaryColor}20`,
            }
          : undefined
      }
    >
      {({ isActive }) => (
        <>
          <motion.div className="flex-shrink-0" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <DashboardIcon
              size={20}
              className={isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400'}
            />
          </motion.div>
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium flex-1 truncate"
              >
                {dashboardNavItem.label}
              </motion.span>
            )}
          </AnimatePresence>
          {isActive && isOpen && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[998] lg:hidden"
            onClick={() => useSidebarStore.getState().close()}
          />
        )}
      </AnimatePresence>

      <motion.div
        data-tour="sidebar"
        variants={sidebarVariants}
        animate={isOpen ? 'open' : 'closed'}
        initial={isOpen ? 'open' : 'closed'}
        className="
          h-screen 
          bg-white/80 dark:bg-slate-800/80
          backdrop-blur-xl
          border-r border-white/20 dark:border-slate-700/50
          flex flex-col 
          fixed left-0 top-0 z-[999]
          shadow-xl
        "
        style={{
          boxShadow: '0 4px 24px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        <div className="p-4 md:p-5 border-b border-slate-200/50 dark:border-slate-700/50">
          <motion.div
            variants={contentVariants}
            animate={isOpen ? 'open' : 'closed'}
            className="flex items-center gap-3"
          >
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
            >
              MN
            </div>
            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 min-w-0"
                >
                  <h2
                    className="text-xl font-bold bg-clip-text text-transparent m-0 truncate"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    motonode
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5 truncate">
                    Admin Panel
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <nav className="flex-1 p-3 md:p-4 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="space-y-2">
            {isOpen ? (
              dashboardLink
            ) : (
              <Tooltip text={dashboardNavItem.label} position="right">
                {dashboardLink}
              </Tooltip>
            )}

            {navGroups.map((group) => (
              <SidebarNavGroup
                key={group.id}
                group={group}
                isSidebarOpen={isOpen}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                isMobile={isMobile}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        </nav>

        <div className="p-3 md:p-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <motion.button
            onClick={handleLogoutClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              w-full 
              px-3 py-2.5
              bg-gradient-to-r from-red-500 to-red-600
              text-white 
              border-none 
              rounded-xl 
              cursor-pointer 
              text-sm font-semibold
              shadow-lg shadow-red-500/30
              hover:shadow-xl hover:shadow-red-500/40
              transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            <LogOut size={18} />
            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access the admin panel."
        confirmText="Logout"
        cancelText="Cancel"
        type="warning"
      />
    </>
  );
};
