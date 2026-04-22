import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { SkeletonCard } from '@components/Skeleton';
import { type ITourStep,TourGuide } from '@components/TourGuide';
import {
  getDashboardStats,
  getOrdersChartData,
  getOrderStatusDistribution,
  getUsersChartData,
  type IDashboardStats,
} from '@services/dashboardService';
import { useToastStore } from '@store/toastStore';
import { motion } from 'framer-motion';
import { useEffect, useRef,useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { IDashboardData } from '../../types/dashboard';

const COLORS = ['#4A6CF7', '#9966FF', '#28C76F', '#FF9F43', '#EA5455', '#20C997'];
const CHART_COLORS = {
  primary: '#4A6CF7',
  secondary: '#9966FF',
  success: '#28C76F',
  warning: '#FF9F43',
  info: '#20C997',
  neutral: '#F7F8FC',
};

const TOUR_STORAGE_KEY = 'motonode-admin-tour-completed';
const RECENT_MONTHS = 6;

const chartTooltipStyles = {
  backgroundColor: 'rgba(255, 255, 255, 0.98)',
  border: '1px solid rgba(148, 163, 184, 0.25)',
  borderRadius: '12px',
  padding: '0.5rem 0.75rem',
  boxShadow: '0 8px 30px rgba(15, 23, 42, 0.12)',
  fontFamily: 'Poppins, sans-serif',
};

const numberFormatter = new Intl.NumberFormat('en-US');
const formatNumber = (value: number) => numberFormatter.format(value || 0);

const formatOrderStatusLabel = (status?: string): string => {
  if (!status) return 'Unknown';
  return status
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const sliceRecent = <T,>(items: T[] = [], count: number = RECENT_MONTHS): T[] => {
  if (!Array.isArray(items) || items.length <= count) {
    return items || [];
  }
  return items.slice(-count);
};

const getTrendMeta = (value: number) => {
  if (value > 0) {
    return {
      label: `+${value.toFixed(1)}% vs last month`,
      tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
      icon: '▲',
    };
  }
  if (value < 0) {
    return {
      label: `${value.toFixed(1)}% vs last month`,
      tone: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10',
      icon: '▼',
    };
  }
  return {
    label: 'No change vs last month',
    tone: 'text-slate-600 bg-slate-100 dark:bg-slate-500/30',
    icon: '▬',
  };
};

type SparklinePoint = { label: string; value: number };
type MetricActivity = IDashboardStats['monthlyActivity']['users'];

const formatSparklineData = (
  chartData: Array<{ month?: string; users?: number; orders?: number }> = [],
  key: 'users' | 'orders'
): SparklinePoint[] => {
  return sliceRecent(chartData, RECENT_MONTHS).map((item) => ({
    label: item.month || 'NA',
    value: item[key] || 0,
  }));
};

const RADIAN = Math.PI / 180;
const renderStatusLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  if (percent * 100 < 12) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#0f172a" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight={600}>
      {`${Math.round(percent * 100)}%`}
    </text>
  );
};

const hasSparklineData = (points?: SparklinePoint[]) =>
  !!points && points.some((point) => typeof point.value === 'number' && point.value > 0);

const Sparkline = ({
  data = [],
  color,
  gradientId,
}: {
  data?: SparklinePoint[];
  color: string;
  gradientId: string;
}) => (
  <ResponsiveContainer width="100%" height={48}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.4} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="value"
        stroke={color}
        strokeWidth={2}
        fill={`url(#${gradientId})`}
        dot={false}
        activeDot={{ r: 4 }}
      />
    </AreaChart>
  </ResponsiveContainer>
);

const ActivitySummary = ({
  activity,
  label,
}: {
  activity?: MetricActivity;
  label: string;
}) => {
  if (!activity) {
    return (
      <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
        Monthly {label} activity will appear here once available.
      </div>
    );
  }

  const hasCurrent = (activity.current || 0) > 0;
  return (
    <div
      className="
        rounded-lg border border-slate-200/60 dark:border-slate-700/60
        bg-slate-50/70 dark:bg-slate-800/40 px-3 py-2
        text-[11px] leading-tight
      "
    >
      <p className="m-0 font-semibold text-slate-600 dark:text-slate-200">
        {hasCurrent
          ? `${formatNumber(activity.current)} new ${label} this month`
          : `No new ${label} this month`}
      </p>
      <p className="m-0 text-[10px] text-slate-400 dark:text-slate-500">
        Previous month: {formatNumber(activity.previous || 0)}
      </p>
    </div>
  );
};

export const DashboardPage = () => {
  const [data, setData] = useState<IDashboardData | null>(null);
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const { showToast } = useToastStore();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  // Check if user has completed the tour
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
    if (!hasCompletedTour) {
      // Wait for page to load before showing tour
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleTourComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setShowTour(false);
  };

  const tourSteps: ITourStep[] = [
    {
      target: '[data-tour="sidebar"]',
      title: 'Navigation Sidebar',
      content: 'Use the sidebar to navigate between different sections of the admin panel. You can toggle it open or closed using the menu button. Here you\'ll find Dashboard, Users, Dealers, Products, Vehicles, Orders, Reports, and Settings.',
      position: 'right',
    },
    {
      target: '[data-tour="navbar"]',
      title: 'Top Navigation Bar',
      content: 'The navigation bar provides quick access to search functionality, notifications, theme toggle, and displays your welcome message. Use the search bar to quickly find users, dealers, products, or orders.',
      position: 'bottom',
    },
    {
      target: '[data-tour="kpi-cards"]',
      title: 'Key Performance Indicators',
      content: 'These cards highlight your core metrics with total counts, month-over-month deltas, and miniature trend sparks so you can evaluate momentum instantly.',
      position: 'bottom',
    },
    {
      target: '[data-tour="charts"]',
      title: 'Analytics Charts',
      content: 'The charts section displays visual analytics including Users per Month (area chart), Orders per Month (bar chart), and Order Status Distribution (pie chart). These help you understand trends and patterns in your business.',
      position: 'top',
    },
  ];

  useEffect(() => {
    // Prevent double calls in React Strict Mode
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    isMountedRef.current = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Use Promise.allSettled to handle partial failures
        const results = await Promise.allSettled([
          getDashboardStats(),
          getUsersChartData(),
          getOrdersChartData(),
          getOrderStatusDistribution(),
        ]);

        // Check if all requests failed with connection errors
        const allFailed = results.every((r) => r.status === 'rejected');
        const hasConnectionError = results.some((r) => 
          r.status === 'rejected' && 
          (r.reason?.message?.toLowerCase().includes('client must be connected') ||
           r.reason?.message?.toLowerCase().includes('must be connected'))
        );

        // If all failed with connection error, reset guard to allow retry
        if (allFailed && hasConnectionError) {
          hasFetchedRef.current = false;
        }

        // Extract results with fallbacks
        const statsData = results[0].status === 'fulfilled' 
          ? results[0].value 
          : {
              totalUsers: 0,
              totalDealers: 0,
              totalOrders: 0,
              totalProducts: 0,
              revenue: 0,
              growth: {
                users: 0,
                dealers: 0,
                orders: 0,
                products: 0,
                revenue: 0,
              },
              monthlyActivity: {
                users: { current: 0, previous: 0 },
                dealers: { current: 0, previous: 0 },
                orders: { current: 0, previous: 0 },
                products: { current: 0, previous: 0 },
                revenue: { current: 0, previous: 0 },
              },
            };

        const usersChart = results[1].status === 'fulfilled' 
          ? results[1].value 
          : [];

        const ordersChart = results[2].status === 'fulfilled' 
          ? results[2].value 
          : [];

        const orderStatus = results[3].status === 'fulfilled' 
          ? results[3].value 
          : [];

        setStats(statsData);

        // Calculate total for order status percentage calculation
        const totalOrderStatus = orderStatus.reduce((sum: number, item: { count?: number }) => sum + (item.count || 0), 0);

        // Map order status distribution to match UI format
        const mappedOrderStatus = orderStatus
          .map((item: { status?: string; count?: number }) => ({
            name: formatOrderStatusLabel(item.status),
            value: item.count || 0,
            percentage: totalOrderStatus > 0 ? Math.round(((item.count || 0) / totalOrderStatus) * 100) : 0,
          }))
          .sort((a, b) => b.value - a.value);

        // Generate default chart data if empty
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const defaultUsersChart = usersChart.length > 0 
          ? usersChart 
          : monthNames.map((month) => ({ month, users: 0 }));
        
        const defaultOrdersChart = ordersChart.length > 0 
          ? ordersChart 
          : monthNames.map((month) => ({ month, orders: 0 }));

        setData({
          stats: {
            totalUsers: statsData.totalUsers || 0,
            totalDealers: statsData.totalDealers || 0,
            totalOrders: statsData.totalOrders || 0,
            totalProducts: statsData.totalProducts || 0,
          },
          usersPerMonth: defaultUsersChart.map((item: { month?: string; users?: number }) => ({
            month: item.month || 'Unknown',
            users: item.users || 0,
          })),
          ordersPerMonth: defaultOrdersChart.map((item: { month?: string; orders?: number }) => ({
            month: item.month || 'Unknown',
            orders: item.orders || 0,
          })),
          orderStatus: mappedOrderStatus,
        });

        // Show warning if some API calls failed
        const failedCount = results.filter((r) => r.status === 'rejected').length;
        if (failedCount > 0 && !hasConnectionError) {
          showToast(`Some dashboard data could not be loaded (${failedCount} failed)`, 'warning');
        }
      } catch (error) {
        // Check if it's a connection error
        const errorMessage = (error as Error)?.message || '';
        const isConnectionError = errorMessage.toLowerCase().includes('client must be connected') ||
                                  errorMessage.toLowerCase().includes('must be connected');
        
        // If connection error, reset guard to allow retry
        if (isConnectionError) {
          hasFetchedRef.current = false;
        }

        // Even if everything fails, set default data so page can render
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        setStats({
          totalUsers: 0,
          totalDealers: 0,
          totalOrders: 0,
          totalProducts: 0,
          revenue: 0,
          growth: {
            users: 0,
            dealers: 0,
            orders: 0,
            products: 0,
            revenue: 0,
          },
          monthlyActivity: {
            users: { current: 0, previous: 0 },
            dealers: { current: 0, previous: 0 },
            orders: { current: 0, previous: 0 },
            products: { current: 0, previous: 0 },
            revenue: { current: 0, previous: 0 },
          },
        });

        setData({
          stats: {
            totalUsers: 0,
            totalDealers: 0,
            totalOrders: 0,
            totalProducts: 0,
          },
          usersPerMonth: monthNames.map((month) => ({ month, users: 0 })),
          ordersPerMonth: monthNames.map((month) => ({ month, orders: 0 })),
          orderStatus: [],
        });

        if (!isConnectionError) {
          showToast('Failed to load dashboard data. Showing empty dashboard.', 'error');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      hasFetchedRef.current = false; // Reset for potential remount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [showToast]);

  // Check if chart data has any non-zero values
  const hasChartData = (chartData: Array<{ users?: number; orders?: number }>, key: 'users' | 'orders'): boolean => {
    if (!chartData || chartData.length === 0) {
      return false;
    }
    return chartData.some((item) => (item[key] || 0) > 0);
  };

  const kpiCards =
    data && stats
      ? [
          {
            id: 'users',
            title: 'Total Users',
            value: data.stats?.totalUsers || 0,
            icon: '👥',
            color: CHART_COLORS.primary,
            trend: stats.growth?.users ?? 0,
            sparkline: formatSparklineData(data.usersPerMonth, 'users'),
          activity: stats.monthlyActivity?.users,
          activityLabel: 'users',
          },
          {
            id: 'dealers',
            title: 'Total Dealers',
            value: data.stats?.totalDealers || 0,
            icon: '🏢',
            color: CHART_COLORS.secondary,
            trend: stats.growth?.dealers ?? 0,
          sparkline: undefined,
          activity: stats.monthlyActivity?.dealers,
          activityLabel: 'dealers',
          },
          {
            id: 'orders',
            title: 'Total Orders',
            value: data.stats?.totalOrders || 0,
            icon: '🛒',
            color: CHART_COLORS.success,
            trend: stats.growth?.orders ?? 0,
            sparkline: formatSparklineData(data.ordersPerMonth, 'orders'),
          activity: stats.monthlyActivity?.orders,
          activityLabel: 'orders',
          },
          {
            id: 'products',
            title: 'Total Products',
            value: data.stats?.totalProducts || 0,
            icon: '📦',
            color: CHART_COLORS.warning,
          trend: stats.growth?.products ?? 0,
          sparkline: undefined,
          activity: stats.monthlyActivity?.products,
          activityLabel: 'products',
          },
        ].map((card) => ({
          ...card,
          formattedValue: formatNumber(card.value),
          trendMeta: getTrendMeta(card.trend),
          gradientId: `spark-${card.id}`,
        }))
      : [];

  const recentUsersData = sliceRecent(data?.usersPerMonth || []);
  const recentOrdersData = sliceRecent(data?.ordersPerMonth || []);
  const usersChartHasData = hasChartData(recentUsersData, 'users');
  const ordersChartHasData = hasChartData(recentOrdersData, 'orders');
  const orderStatusData = data?.orderStatus || [];
  const hasOrderStatusData = orderStatusData.some((entry) => (entry.value || 0) > 0);
  const totalStatusCount = orderStatusData.reduce((sum, entry) => sum + (entry.value || 0), 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6"
    >
      <Breadcrumbs />
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-3 md:mb-4"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white m-0 mb-0.5 tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 m-0 font-medium">
          Business stats at a glance.
        </p>
      </motion.div>

      {/* Tour Guide */}
      <TourGuide
        steps={tourSteps}
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={handleTourComplete}
        showSkip={true}
      />

      <div className="mb-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            data-tour="kpi-cards"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4"
          >
            {kpiCards.map((card) => (
              <motion.div key={card.id} variants={itemVariants} className="h-full">
                <div
                  className="
                    relative flex h-full flex-col justify-between gap-4 rounded-[12px]
                    border border-white/60 bg-white/80 p-4
                    dark:border-white/5 dark:bg-slate-800/60
                    backdrop-blur
                    transition duration-300
                    hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl
                  "
                  style={{
                    background: 'linear-gradient(135deg, #ffffff, #f9fafc)',
                  }}
                >
                  <div className="absolute inset-0 rounded-[12px] bg-gradient-to-br from-white/10 via-transparent to-slate-100/10 dark:from-white/5 dark:to-slate-900/10 pointer-events-none" />
                  <div className="relative z-10 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{card.title}</p>
                        <div className="flex items-baseline gap-2">
                          <span
                            className="text-2xl font-bold text-slate-900 dark:text-white"
                            title={`${card.formattedValue} ${card.title.toLowerCase()}`}
                          >
                            {card.formattedValue}
                          </span>
                        </div>
                      </div>
                      <div className="text-2xl leading-none opacity-60">{card.icon}</div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${card.trendMeta.tone}`}
                    >
                      <span>{card.trendMeta.icon}</span>
                      {card.trendMeta.label}
                    </span>
                    {hasSparklineData(card.sparkline) ? (
                      <Sparkline data={card.sparkline as SparklinePoint[]} color={card.color} gradientId={card.gradientId} />
                    ) : (
                      <ActivitySummary activity={card.activity} label={card.activityLabel} />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Charts Section */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <motion.div
          data-tour="charts"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-5"
        >
          {/* Users per Month - Area Chart */}
          {usersChartHasData ? (
            <div
              className="
                backdrop-blur-xl bg-white/60 dark:bg-slate-800/60
                rounded-lg p-3 md:p-4
                border border-white/30 dark:border-white/10
                shadow-lg
                relative overflow-hidden
              "
              style={{
                boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-slate-100/10 dark:from-white/5 dark:to-slate-700/10 rounded-lg pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white mb-3">
                  Users per Month
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={recentUsersData}>
                    <defs>
                      <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                    <XAxis
                      dataKey="month"
                      stroke="transparent"
                      tickLine={false}
                      axisLine={false}
                      style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Poppins' }}
                    />
                    <YAxis
                      stroke="transparent"
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      domain={[0, 'auto']}
                      width={40}
                      style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Poppins' }}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyles}
                      formatter={(value: number) => [`${formatNumber(value)} users`, '']}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={3}
                      fill="url(#usersGradient)"
                      dot={{ fill: CHART_COLORS.primary, r: 4 }}
                      activeDot={{ r: 6, stroke: CHART_COLORS.primary, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div
              className="
                backdrop-blur-xl bg-white/60 dark:bg-slate-800/60
                rounded-lg p-3 md:p-4
                border border-white/30 dark:border-white/10
                shadow-lg
                relative overflow-hidden
              "
              style={{
                boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-slate-100/10 dark:from-white/5 dark:to-slate-700/10 rounded-lg pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white mb-3">
                  Users per Month
                </h3>
                <div className="flex flex-col items-center justify-center h-[220px] text-center">
                  <div className="text-4xl mb-3 opacity-50">📊</div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    No Records Found
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Not enough user data for the recent period
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Orders per Month - Bar Chart */}
          {ordersChartHasData ? (
            <div
              className="
                backdrop-blur-xl bg-white/60 dark:bg-slate-800/60
                rounded-lg p-3 md:p-4
                border border-white/30 dark:border-white/10
                shadow-lg
                relative overflow-hidden
              "
              style={{
                boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-slate-100/10 dark:from-white/5 dark:to-slate-700/10 rounded-lg pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white mb-3">
                  Orders per Month
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={recentOrdersData}>
                    <defs>
                      <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.9} />
                        <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                    <XAxis
                      dataKey="month"
                      stroke="transparent"
                      tickLine={false}
                      axisLine={false}
                      style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Poppins' }}
                    />
                    <YAxis
                      stroke="transparent"
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={40}
                      domain={[0, 'auto']}
                      style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Poppins' }}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyles}
                      formatter={(value: number) => [`${formatNumber(value)} orders`, '']}
                    />
                    <Bar
                      dataKey="orders"
                      fill="url(#ordersGradient)"
                      radius={[8, 8, 0, 0]}
                      stroke={CHART_COLORS.success}
                      strokeWidth={1}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div
              className="
                backdrop-blur-xl bg-white/60 dark:bg-slate-800/60
                rounded-lg p-3 md:p-4
                border border-white/30 dark:border-white/10
                shadow-lg
                relative overflow-hidden
              "
              style={{
                boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-slate-100/10 dark:from-white/5 dark:to-slate-700/10 rounded-lg pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white mb-3">
                  Orders per Month
                </h3>
                <div className="flex flex-col items-center justify-center h-[220px] text-center">
                  <div className="text-4xl mb-3 opacity-50">📊</div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    No Records Found
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    No order data available for the selected period
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Order Status Distribution - Pie Chart */}
      {!loading && hasOrderStatusData ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div
            className="
              backdrop-blur-xl bg-white/60 dark:bg-slate-800/60
              rounded-lg p-3 md:p-4
              border border-white/30 dark:border-white/10
              shadow-lg
              relative overflow-hidden
            "
            style={{
              boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-slate-100/10 dark:from-white/5 dark:to-slate-700/10 rounded-lg pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white mb-3">
                Order Status Distribution
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 items-center">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      startAngle={90}
                      endAngle={-270}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      labelLine={false}
                      label={renderStatusLabel}
                      dataKey="value"
                    >
                      {orderStatusData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="rgba(255, 255, 255, 0.8)"
                          strokeWidth={2}
                        />
                      ))}
                      <Label
                        position="center"
                        content={({ viewBox }) => {
                          if (!viewBox || !('cx' in viewBox)) return null;
                          const { cx, cy } = viewBox;
                          return (
                            <g>
                              <text
                                x={cx}
                                y={(cy || 0) - 5}
                                textAnchor="middle"
                                className="text-base font-bold fill-slate-900"
                              >
                                {formatNumber(totalStatusCount)}
                              </text>
                              <text
                                x={cx}
                                y={(cy || 0) + 12}
                                textAnchor="middle"
                                className="text-xs font-medium fill-slate-500"
                              >
                                Orders
                              </text>
                            </g>
                          );
                        }}
                      />
                    </Pie>
                    <Tooltip
                      contentStyle={chartTooltipStyles}
                      formatter={(value: number, _name, props) => {
                        const percentage = props?.payload?.percentage ?? 0;
                        return [`${formatNumber(value)} orders`, `${percentage}%`];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legend */}
                <div className="space-y-1.5 md:space-y-2">
                  {orderStatusData.map((entry, index) => (
                    <motion.div
                      key={entry.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                      className="flex items-center justify-between rounded-[12px] border border-white/50 bg-white/70 px-3 py-2.5 dark:border-white/10 dark:bg-slate-800/60 backdrop-blur"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">{entry.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{entry.percentage}% of orders</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatNumber(entry.value)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">orders</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div
              className="
                backdrop-blur-xl bg-white/60 dark:bg-slate-800/60
                rounded-lg p-3 md:p-4
                border border-white/30 dark:border-white/10
                shadow-lg
                relative overflow-hidden
              "
              style={{
                boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.1), 0 2px 8px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-slate-100/10 dark:from-white/5 dark:to-slate-700/10 rounded-lg pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white mb-3">
                  Order Status Distribution
                </h3>
                <div className="flex flex-col items-center justify-center h-[220px] text-center">
                  <div className="text-4xl mb-3 opacity-50">📊</div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    No Records Found
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    No order status data available
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )
      )}
    </motion.div>
  );
};
