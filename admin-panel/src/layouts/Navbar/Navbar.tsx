import { ProfileDropdown } from '@components/ProfileDropdown';
import { useAuthStore } from '@store/authStore';
import { useSidebarStore } from '@store/sidebarStore';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { INotification } from '../../types/notification';

export const Navbar = () => {
  const { user } = useAuthStore();
  const { isOpen, toggle } = useSidebarStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [] = useState<INotification[]>([
    {
      id: '1',
      type: 'success',
      title: 'New Order Received',
      message: 'Order #ORD-12345 has been placed by John Doe',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      isRead: false,
      actionUrl: '/orders/12345',
      actionLabel: 'View Order',
      category: 'orders',
    },
    {
      id: '2',
      type: 'info',
      title: 'New Dealer Registration',
      message: 'ABC Motors has completed business registration',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      isRead: false,
      actionUrl: '/dealers/abc123',
      actionLabel: 'View Dealer',
      category: 'dealers',
    },
    {
      id: '3',
      type: 'warning',
      title: 'Low Stock Alert',
      message: 'Product "Premium Car Wax" is running low (5 items remaining)',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      isRead: false,
      actionUrl: '/products/wax123',
      actionLabel: 'View Product',
      category: 'products',
    },
    {
      id: '4',
      type: 'error',
      title: 'Payment Failed',
      message: 'Payment for Order #ORD-12340 failed. Please review.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      actionUrl: '/orders/12340',
      actionLabel: 'View Order',
      category: 'payment_failed',
    },
    {
      id: '5',
      type: 'info',
      title: 'New User Registered',
      message: 'A new user "Jane Smith" has registered',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      actionUrl: '/users/jane123',
      actionLabel: 'View User',
      category: 'users',
    },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [] = useState<string>('all');

  // Filter notifications by category

  // Format notification timestamp

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <motion.div
      data-tour="navbar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="
        h-[70px] 
        bg-white/90 dark:bg-slate-900/90
        backdrop-blur-xl
        border-b border-slate-200/50 dark:border-slate-700/50
        flex items-center justify-between 
        px-4 md:px-6 lg:px-8
        fixed top-0 left-0 right-0 z-[997]
        shadow-lg shadow-slate-200/20 dark:shadow-slate-900/50
      "
      style={{
        marginLeft: isMobile 
          ? '0' 
          : isOpen ? '280px' : '80px',
        transition: 'margin-left 0.3s ease-in-out',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle Button */}
        <motion.button
          onClick={toggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="
            p-2.5
            rounded-xl
            bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700
            text-slate-700 dark:text-slate-300
            border border-slate-200/50 dark:border-slate-700/50
            cursor-pointer
            hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-700 dark:hover:to-slate-600
            transition-all duration-200
            flex items-center justify-center
            shadow-sm
          "
          aria-label="Toggle sidebar"
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.div>
        </motion.button>

        <div className="flex items-center gap-3">
          <h3 className="m-0 text-slate-900 dark:text-white text-base md:text-lg font-semibold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Welcome, {user?.name || 'Admin'}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications - Hidden for now */}
        {/* 
        <div className="relative" ref={notificationsRef}>
          <motion.button
            onClick={() => setShowNotifications(!showNotifications)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="
              p-2.5
              rounded-xl
              bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700
              text-slate-700 dark:text-slate-300
              border border-slate-200/50 dark:border-slate-700/50
              cursor-pointer
              hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-700 dark:hover:to-slate-600
              transition-all duration-200
              flex items-center justify-center
              shadow-sm
              relative
            "
            aria-label="Notifications"
          >
            <Bell size={18} />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            )}
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                {notifications.filter(n => !n.isRead).length > 9 ? '9+' : notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 max-h-[500px] overflow-hidden z-[999] flex flex-col"
              >
                <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bell size={18} className="text-slate-600 dark:text-slate-400" />
                      <h3 className="m-0 text-sm font-semibold text-slate-900 dark:text-white">
                        Notifications
                      </h3>
                      {filteredNotifications.filter(n => !n.isRead).length > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                          {filteredNotifications.filter(n => !n.isRead).length} new
                        </span>
                      )}
                    </div>
                    {filteredNotifications.filter(n => !n.isRead).length > 0 && (
                      <button
                        onClick={() => {
                          setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                        }}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="w-full">
                    <Select
                      value={notificationFilter}
                      onChange={(value) => setNotificationFilter(value)}
                      placeholder="All Notifications"
                      options={[
                        { value: 'all', label: 'All Notifications' },
                        { value: 'orders', label: 'Orders' },
                        { value: 'dealers', label: 'Dealers' },
                        { value: 'payment_failed', label: 'Payment Failed' },
                        { value: 'products', label: 'Products' },
                        { value: 'users', label: 'Users' },
                      ]}
                    />
                  </div>
                </div>

                <div className="overflow-y-auto flex-1">
                  {filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell size={32} className="mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {notificationFilter === 'all' ? 'No notifications' : `No ${notificationFilter.replace('_', ' ')} notifications`}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                      {filteredNotifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`
                            p-4 cursor-pointer transition-colors
                            ${notification.isRead 
                              ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50' 
                              : 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 border-l-2 border-l-blue-500'
                            }
                          `}
                          onClick={() => {
                            if (!notification.isRead) {
                              setNotifications(notifications.map(n => 
                                n.id === notification.id ? { ...n, isRead: true } : n
                              ));
                            }
                            if (notification.actionUrl) {
                              navigate(notification.actionUrl);
                              setShowNotifications(false);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`
                              p-2 rounded-lg flex-shrink-0
                              ${notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                notification.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                                notification.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                                'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              }
                            `}>
                              {notification.type === 'success' ? (
                                <Check size={16} />
                              ) : notification.type === 'error' ? (
                                <X size={16} />
                              ) : notification.type === 'warning' ? (
                                <Bell size={16} />
                              ) : (
                                <Bell size={16} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4 className="m-0 text-sm font-semibold text-slate-900 dark:text-white mb-1">
                                    {notification.title}
                                  </h4>
                                  <p className="m-0 text-xs text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-500 dark:text-slate-500">
                                      {formatNotificationTime(notification.timestamp)}
                                    </span>
                                    {notification.actionUrl && (
                                      <span className="text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1">
                                        {notification.actionLabel || 'View Details'}
                                        <ExternalLink size={12} />
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {!notification.isRead && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNotifications(notifications.map(n => 
                                        n.id === notification.id ? { ...n, isRead: true } : n
                                      ));
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                                    title="Mark as read"
                                  >
                                    <CheckCheck size={14} className="text-slate-400 dark:text-slate-500" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-3 border-t border-slate-200/50 dark:border-slate-700/50">
                    <button
                      onClick={() => {
                        setNotifications([]);
                        setShowNotifications(false);
                      }}
                      className="w-full text-xs text-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
                    >
                      Clear all notifications
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        */ }
        {/* Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </motion.div>
  );
};
