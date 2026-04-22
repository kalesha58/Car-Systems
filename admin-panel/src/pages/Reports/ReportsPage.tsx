import { motion } from 'framer-motion';
import { 
  BarChart3,
  Calendar,
  Download,
  DollarSign,
  Lightbulb
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { Input } from '@components/Input/Input';
import { Select } from '@components/Select';
import { SkeletonCard } from '@components/Skeleton';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { extractErrorMessage } from '@utils/errorHandler';

interface ICategoryRevenue {
  category: string;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
}

export const ReportsPage = () => {
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [categoryRevenues, setCategoryRevenues] = useState<ICategoryRevenue[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');

  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);

  // Set default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  const fetchReports = useCallback(async () => {
    // Prevent duplicate calls
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      
      // TODO: Replace with actual API call when backend is ready
      // const response = await getRevenueByCategory({
      //   startDate: dateRangeFilter !== 'all' ? startDate : undefined,
      //   endDate: dateRangeFilter !== 'all' ? endDate : undefined,
      // });
      
      // Mock data for now - replace with actual API response
      const mockData: ICategoryRevenue[] = [
        {
          category: 'car_wash',
          totalRevenue: 125000,
          orderCount: 450,
          averageOrderValue: 277.78,
        },
        {
          category: 'automobile',
          totalRevenue: 850000,
          orderCount: 120,
          averageOrderValue: 7083.33,
        },
        {
          category: 'detailing',
          totalRevenue: 95000,
          orderCount: 280,
          averageOrderValue: 339.29,
        },
        {
          category: 'showroom',
          totalRevenue: 1200000,
          orderCount: 85,
          averageOrderValue: 14117.65,
        },
      ];
      
      setCategoryRevenues(mockData);
    } catch (error: unknown) {
        if ((error as { name?: string })?.name !== 'AbortError') {
        console.error('Error fetching reports:', error);
        const errorMessage = extractErrorMessage(error, 'Failed to load reports');
        showToast(errorMessage, 'error');
        }
      } finally {
        isFetchingRef.current = false;
      setLoading(false);
    }
  }, [startDate, endDate, dateRangeFilter, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const totalRevenue = useMemo(() => {
    return categoryRevenues.reduce((sum, cat) => sum + cat.totalRevenue, 0);
  }, [categoryRevenues]);

  const totalOrders = useMemo(() => {
    return categoryRevenues.reduce((sum, cat) => sum + cat.orderCount, 0);
  }, [categoryRevenues]);

  const formatCategoryName = (category: string): string => {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleExportCsv = useCallback(() => {
    if (!categoryRevenues.length) {
      showToast('No data to export', 'info');
      return;
    }

    try {
      const headers = ['Category', 'Total Revenue (₹)', 'Order Count', 'Average Order Value (₹)'];
      const rows = categoryRevenues.map((cat) => {
        return [
          formatCategoryName(cat.category),
          cat.totalRevenue.toFixed(2),
          cat.orderCount.toString(),
          cat.averageOrderValue.toFixed(2),
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `revenue_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Report exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showToast('Failed to export report', 'error');
    }
  }, [categoryRevenues, showToast]);

  const handleDateRangeChange = (value: string) => {
    setDateRangeFilter(value);
    if (value === 'custom') {
      // Keep current dates
    } else if (value === 'last7days') {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      setEndDate(end.toISOString().split('T')[0]);
      setStartDate(start.toISOString().split('T')[0]);
    } else if (value === 'last30days') {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      setEndDate(end.toISOString().split('T')[0]);
      setStartDate(start.toISOString().split('T')[0]);
    } else if (value === 'last90days') {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 90);
      setEndDate(end.toISOString().split('T')[0]);
      setStartDate(start.toISOString().split('T')[0]);
    }
  };
        
        return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="users-page"
    >
      {/* Hero Section with Title and Stats */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="users-page__hero"
      >
    <div>
          <h1 className="users-page__title">Reports</h1>
          <p className="users-page__subtitle">
            View revenue analytics, category performance, and financial insights from a centralized dashboard.
          </p>
        </div>
        <div className="users-page__stats">
          <motion.div
            className="users-page__stat-card users-page__stat-card--active"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Total Revenue</span>
            <strong>₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
            <small>All Categories</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Total Orders</span>
            <strong>{totalOrders}</strong>
            <small>Across all categories</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--warning"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Categories</span>
            <strong>{categoryRevenues.length}</strong>
            <small>Active categories</small>
          </motion.div>
        </div>
      </motion.div>

      <div className="users-page__breadcrumbs">
        <Breadcrumbs />
      </div>

      <Card className="users-card">
        {/* Action Bar */}
        <div className="users-toolbar">
          <div className="users-toolbar__row users-toolbar__row--main">
            <div className="users-toolbar__field users-toolbar__field--filter">
              <div className="users-toolbar__select">
                <Select
                  value={dateRangeFilter}
                  onChange={handleDateRangeChange}
                  placeholder="Date Range"
                  options={[
                    { value: 'all', label: 'All Time' },
                    { value: 'last7days', label: 'Last 7 Days' },
                    { value: 'last30days', label: 'Last 30 Days' },
                    { value: 'last90days', label: 'Last 90 Days' },
                    { value: 'custom', label: 'Custom Range' },
                  ]}
                />
              </div>
            </div>
            {dateRangeFilter === 'custom' && (
              <>
                <div className="users-toolbar__field users-toolbar__field--filter">
                  <div className="users-toolbar__input-wrapper">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(value) => setStartDate(value)}
                      icon={Calendar}
                    />
                  </div>
                </div>
                <div className="users-toolbar__field users-toolbar__field--filter">
                  <div className="users-toolbar__input-wrapper">
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(value) => setEndDate(value)}
                      icon={Calendar}
                    />
                  </div>
                </div>
              </>
            )}
            <div className="users-toolbar__spacer" />
            <div className="users-toolbar__actions">
              <div className="users-toolbar__ghost-btn">
          <Button 
            variant="outline" 
                  onClick={handleExportCsv}
                  icon={Download}
                >
                  Export CSV
          </Button>
              </div>
            </div>
        </div>
      </div>

        {/* Main Content Area */}
        <div className="users-table-wrapper">
          {loading ? (
            <div style={{ padding: theme.spacing.xl }}>
              <SkeletonCard />
            </div>
          ) : categoryRevenues.length === 0 ? (
            <div className="users-empty-state">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="users-empty-state__illustration"
              >
                <BarChart3 size={64} style={{ color: theme.colors.textSecondary, opacity: 0.5 }} />
              </motion.div>
              <h3>No revenue data found</h3>
              <p>No revenue data available for the selected date range. Try adjusting your filters.</p>
              <div className="users-empty-state__tip">
                <Lightbulb size={16} />
                <span>Tip: Select a different date range to view revenue data.</span>
              </div>
            </div>
          ) : (
            <div style={{ padding: theme.spacing.md }}>
              {/* Revenue by Category Cards */}
              <div style={{ 
          display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: theme.spacing.sm,
                marginBottom: theme.spacing.lg 
              }}>
                {categoryRevenues.map((category, index) => {
                  const percentage = totalRevenue > 0 ? (category.totalRevenue / totalRevenue) * 100 : 0;
                  return (
                    <motion.div
                      key={category.category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
          style={{
                        padding: theme.spacing.md,
                        backgroundColor: theme.colors.surface,
                        borderRadius: theme.borderRadius.lg,
                        border: `1px solid ${theme.colors.border}`,
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: theme.spacing.md 
                      }}>
                        <h3 style={{ 
                      margin: 0,
                          fontSize: '1rem', 
                      fontWeight: 600,
                          color: theme.colors.text 
                        }}>
                          {formatCategoryName(category.category)}
                  </h3>
                        <DollarSign size={20} style={{ color: theme.colors.primary }} />
                </div>
                      
                      <div style={{ marginBottom: theme.spacing.sm }}>
                        <div style={{ 
                  display: 'flex',
                          alignItems: 'baseline', 
                gap: theme.spacing.xs,
                          marginBottom: theme.spacing.xs 
                        }}>
                          <span style={{ 
                            fontSize: '1.5rem', 
                            fontWeight: 700, 
                            color: theme.colors.primary 
                          }}>
                            ₹{category.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: theme.colors.textSecondary 
                        }}>
                          {percentage.toFixed(1)}% of total revenue
            </div>
          </div>

                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: theme.spacing.sm,
                        marginTop: theme.spacing.md,
                        paddingTop: theme.spacing.md,
                        borderTop: `1px solid ${theme.colors.border}`
                      }}>
                        <div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                      color: theme.colors.textSecondary,
                            marginBottom: '2px'
                          }}>
                            Orders
                          </div>
                          <div style={{ 
                            fontSize: '0.875rem', 
                      fontWeight: 600,
                            color: theme.colors.text 
                          }}>
                            {category.orderCount}
              </div>
            </div>
                        <div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: theme.colors.textSecondary,
                            marginBottom: '2px'
                          }}>
                            Avg. Order
                          </div>
                          <div style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: 600, 
                            color: theme.colors.text 
                          }}>
                            ₹{category.averageOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ 
                        marginTop: theme.spacing.md,
                        height: '4px',
                        backgroundColor: `${theme.colors.border}`,
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
          style={{
                            height: '100%',
                            background: `linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
                            borderRadius: '2px',
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Summary Table */}
              <div style={{
                marginTop: theme.spacing.xl,
                padding: theme.spacing.lg,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
                border: `1px solid ${theme.colors.border}`,
              }}>
                <h3 style={{ 
                      margin: 0,
                  marginBottom: theme.spacing.md, 
                  fontSize: '1.125rem', 
                      fontWeight: 600,
                  color: theme.colors.text 
                }}>
                  Revenue Summary by Category
                  </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${theme.colors.border}` }}>
                        <th style={{ 
                          padding: theme.spacing.md, 
                          textAlign: 'left', 
                          fontSize: '0.875rem', 
                          fontWeight: 600, 
                          color: theme.colors.textSecondary 
                        }}>
                          Category
                        </th>
                        <th style={{ 
                          padding: theme.spacing.md, 
                          textAlign: 'right', 
                          fontSize: '0.875rem', 
                          fontWeight: 600, 
                          color: theme.colors.textSecondary 
                        }}>
                          Total Revenue
                        </th>
                        <th style={{ 
                          padding: theme.spacing.md, 
                          textAlign: 'right', 
                          fontSize: '0.875rem', 
                          fontWeight: 600, 
                          color: theme.colors.textSecondary 
                        }}>
                          Orders
                        </th>
                        <th style={{ 
                          padding: theme.spacing.md, 
                          textAlign: 'right', 
                          fontSize: '0.875rem', 
                          fontWeight: 600, 
                          color: theme.colors.textSecondary 
                        }}>
                          Avg. Order Value
                        </th>
                        <th style={{ 
                          padding: theme.spacing.md, 
                          textAlign: 'right', 
                          fontSize: '0.875rem', 
                          fontWeight: 600, 
                          color: theme.colors.textSecondary 
                        }}>
                          % of Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryRevenues.map((category) => {
                        const percentage = totalRevenue > 0 ? (category.totalRevenue / totalRevenue) * 100 : 0;
                        return (
                          <tr key={category.category} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                            <td style={{ 
                              padding: theme.spacing.md, 
                              fontSize: '0.875rem', 
                              fontWeight: 500, 
                              color: theme.colors.text 
                            }}>
                              {formatCategoryName(category.category)}
                            </td>
                            <td style={{ 
                              padding: theme.spacing.md, 
                              textAlign: 'right', 
                              fontSize: '0.875rem', 
                              fontWeight: 600, 
                              color: theme.colors.text 
                            }}>
                              ₹{category.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ 
                              padding: theme.spacing.md, 
                              textAlign: 'right', 
                              fontSize: '0.875rem', 
                              color: theme.colors.text 
                            }}>
                              {category.orderCount}
                            </td>
                            <td style={{ 
                              padding: theme.spacing.md, 
                              textAlign: 'right', 
                              fontSize: '0.875rem', 
                              color: theme.colors.text 
                            }}>
                              ₹{category.averageOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ 
                              padding: theme.spacing.md, 
                              textAlign: 'right', 
                              fontSize: '0.875rem', 
                              fontWeight: 600, 
                              color: theme.colors.primary 
                            }}>
                              {percentage.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{ 
                        borderTop: `2px solid ${theme.colors.border}`,
                        backgroundColor: `${theme.colors.primary}05`
                      }}>
                        <td style={{ 
                          padding: theme.spacing.md, 
                          fontSize: '0.875rem', 
                          fontWeight: 700, 
                          color: theme.colors.text 
                        }}>
                          Total
                        </td>
                        <td style={{ 
                          padding: theme.spacing.md, 
                          textAlign: 'right', 
                          fontSize: '0.875rem', 
                          fontWeight: 700, 
                          color: theme.colors.primary 
                        }}>
                          ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ 
                          padding: theme.spacing.md, 
                          textAlign: 'right', 
                          fontSize: '0.875rem', 
                          fontWeight: 700, 
                          color: theme.colors.text 
                        }}>
                          {totalOrders}
                        </td>
                        <td style={{ 
                          padding: theme.spacing.md, 
                          textAlign: 'right', 
                          fontSize: '0.875rem', 
                          fontWeight: 700, 
                          color: theme.colors.text 
                        }}>
                          ₹{totalRevenue > 0 ? (totalRevenue / totalOrders).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0.00'}
                        </td>
                        <td style={{ 
                          padding: theme.spacing.md, 
                          textAlign: 'right', 
                          fontSize: '0.875rem', 
                    fontWeight: 700,
                          color: theme.colors.primary 
                        }}>
                          100%
                        </td>
                      </tr>
                    </tbody>
                  </table>
              </div>
              </div>
            </div>
          )}
          </div>
        </Card>
    </motion.div>
  );
};

