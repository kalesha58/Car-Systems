import { ConfirmModal } from '@components/ConfirmModal/ConfirmModal';
import { useAuthStore } from '@store/authStore';
import { useSidebarStore } from '@store/sidebarStore';
import { colorSchemes } from '@theme/colorSchemes';
import { useTheme } from '@theme/ThemeContext';
import { AnimatePresence,motion } from 'framer-motion';
import {
  BarChart3,
  Building2,
  CarFront,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { useEffect,useState } from 'react';
import { NavLink } from 'react-router-dom';

interface INavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
}

const navItems: INavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/dealers', label: 'Dealers', icon: Building2 },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/vehicles', label: 'Vehicles', icon: CarFront },
  { path: '/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Categories', icon: Settings },
];

export const Sidebar = () => {
  const { logout } = useAuthStore();
  const { isOpen } = useSidebarStore();
  const { colorScheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Get the current color scheme's primary and secondary colors
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

  return (
    <>
      {/* Overlay for mobile */}
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

      {/* Sidebar */}
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
        {/* Header */}
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

        {/* Navigation */}
        <nav className="flex-1 p-3 md:p-4 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="space-y-1.5">
            {navItems.map((item, index) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  // Close sidebar on mobile when navigating
                  if (isMobile) {
                    useSidebarStore.getState().close();
                  }
                }}
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
                {({ isActive }) => {
                  const IconComponent = item.icon;
                  return (
                    <>
                      <motion.div
                        className="flex-shrink-0"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <IconComponent
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
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                          className="text-sm font-medium flex-1 truncate"
                        >
                          {item.label}
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
                  );
                }}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Logout Button */}
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

      {/* Logout Confirmation Modal */}
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
