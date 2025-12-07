/**
 * Format number as currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Calculate percentage growth between two values
 */
export const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
};

/**
 * Calculate average order value
 */
export const calculateAverageOrderValue = (
  orders: any[],
  totalRevenue: number,
): number => {
  if (!orders || orders.length === 0) {
    return 0;
  }
  return totalRevenue / orders.length;
};

/**
 * Calculate conversion rate
 */
export const calculateConversionRate = (
  ordersCount: number,
  bookingsCount: number,
): number => {
  if (bookingsCount === 0) {
    return 0;
  }
  return (ordersCount / bookingsCount) * 100;
};

/**
 * Calculate cancellation rate
 */
export const calculateCancellationRate = (
  cancelledCount: number,
  totalCount: number,
): number => {
  if (totalCount === 0) {
    return 0;
  }
  return (cancelledCount / totalCount) * 100;
};

