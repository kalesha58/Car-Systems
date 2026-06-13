import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { Input } from '@components/Input/Input';
import { Pagination } from '@components/Pagination/Pagination';
import { Select } from '@components/Select';
import { SkeletonTable } from '@components/Skeleton';
import { Table } from '@components/Table/Table';
import { getOrders } from '@services/orderService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { debounce } from '@utils/debounce';
import { extractErrorMessage } from '@utils/errorHandler';
import { motion } from 'framer-motion';
import { 
  Download,
  Lightbulb,
  Search
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { IOrderListItem } from '../../types/order';

export const OrdersListPage = () => {
  const navigate = useNavigate();
  useTheme();
  const { showToast } = useToastStore();
  const [orders, setOrders] = useState<IOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dealerFilter, setDealerFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusSummary, setStatusSummary] = useState({ 
    total: 0, 
    pending: 0, 
    processing: 0, 
    completed: 0,
    cancelled: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    // Prevent duplicate calls
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      setLoading(true);
      const response = await getOrders({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        dealerId: dealerFilter !== 'all' ? dealerFilter : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      
      // Map API response to IOrderListItem format
      // The API response may have a different structure, so we need to map it
      const mappedOrders: IOrderListItem[] = (response.orders as unknown as Array<{
        id: string;
        user?: { id: string; name: string };
        dealer?: { id: string; name?: string; businessName?: string };
        totalAmount?: number;
        amount?: number;
        status: string;
        createdAt?: string;
        date?: string;
        items?: Array<{
          productId: string;
          productName: string;
          quantity: number;
          price: number;
        }>;
        paymentMethod?: string;
        paymentStatus?: string;
      }>).map((order) => ({
        id: order.id,
        userId: order.user?.id || '',
        userName: order.user?.name || '',
        dealerId: order.dealer?.id || '',
        dealerName: order.dealer?.name || order.dealer?.businessName || '',
        amount: order.totalAmount || order.amount || 0,
        status: (order.status as 'pending' | 'processing' | 'completed' | 'cancelled') || 'pending',
        date: order.createdAt || order.date || new Date().toISOString(),
        items: order.items || [],
        paymentMethod: order.paymentMethod || '',
        paymentStatus: order.paymentStatus || '',
      }));
      
      setOrders(mappedOrders);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.totalPages);

      // Calculate status summary
      const pendingCount = mappedOrders.filter(o => o.status === 'pending' || o.status?.toLowerCase().includes('pending')).length;
      const processingCount = mappedOrders.filter(o => o.status === 'processing' || o.status?.toLowerCase().includes('processing') || o.status?.toLowerCase().includes('confirmed') || o.status?.toLowerCase().includes('shipped')).length;
      const completedCount = mappedOrders.filter(o => o.status === 'completed' || o.status?.toLowerCase().includes('completed') || o.status?.toLowerCase().includes('delivered')).length;
      const cancelledCount = mappedOrders.filter(o => o.status === 'cancelled' || o.status?.toLowerCase().includes('cancelled')).length;
      setStatusSummary({
        total: mappedOrders.length,
        pending: pendingCount,
        processing: processingCount,
        completed: completedCount,
        cancelled: cancelledCount,
      });
    } catch (error: unknown) {
      if ((error as { name?: string })?.name !== 'AbortError') {
        console.error('Error fetching orders:', error);
        const errorMessage = extractErrorMessage(error, 'Failed to load orders');
        showToast(errorMessage, 'error');
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, dealerFilter, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
      }, 300),
    []
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInputValue(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dealerFilter]);

  // Sync search input value with search term when search term changes externally
  useEffect(() => {
    setSearchInputValue(searchTerm);
  }, [searchTerm]);

  // Get unique dealers from current orders for filter dropdown
  const uniqueDealers = useMemo(() => {
    const dealerMap = new Map<string, string>();
    orders.forEach((order) => {
      if (order.dealerId && order.dealerName && !dealerMap.has(order.dealerId)) {
        dealerMap.set(order.dealerId, order.dealerName);
      }
    });
    return Array.from(dealerMap.entries()).map(([id, name]) => ({ id, name }));
  }, [orders]);

  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string }> = [];
    if (searchInputValue.trim()) {
      filters.push({ key: 'search', label: `Search: ${searchInputValue.trim()}` });
    }
    if (statusFilter !== 'all') {
      filters.push({
        key: 'status',
        label: `Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`,
      });
    }
    if (dealerFilter !== 'all') {
      const dealer = uniqueDealers.find(d => d.id === dealerFilter);
      filters.push({
        key: 'dealer',
        label: `Dealer: ${dealer?.name || dealerFilter}`,
      });
    }
    return filters;
  }, [searchInputValue, statusFilter, dealerFilter, uniqueDealers]);

  const handleClearFilter = useCallback((key: string) => {
    if (key === 'search') {
      setSearchInputValue('');
      setSearchTerm('');
      setCurrentPage(1);
    }
    if (key === 'status') {
      setStatusFilter('all');
      setCurrentPage(1);
    }
    if (key === 'dealer') {
      setDealerFilter('all');
      setCurrentPage(1);
    }
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearchInputValue('');
    setSearchTerm('');
    setStatusFilter('all');
    setDealerFilter('all');
    setCurrentPage(1);
  }, []);

  const handleExportCsv = useCallback(() => {
    if (!orders.length) {
      showToast('No orders to export in the current view', 'info');
      return;
    }

    try {
      const headers = ['Order ID', 'User', 'Dealer', 'Amount', 'Status', 'Date'];
      const rows = orders.map((order) => {
        const date = order.date ? new Date(order.date).toLocaleString() : '';
        return [
          order.id || '',
          order.userName || '',
          order.dealerName || '',
          order.amount ? `₹${order.amount.toFixed(2)}` : '',
          formatStatus(order.status || ''),
          date,
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Orders exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showToast('Failed to export orders', 'error');
    }
  }, [orders, showToast]);

  const isEmptyState = !loading && orders.length === 0;

  const getStatusClass = (status: string): string => {
    if (!status) return 'users-status-badge';
    const normalizedStatus = status.toUpperCase();
    
    // Success states (green)
    if (
      normalizedStatus.includes('DELIVERED') ||
      normalizedStatus.includes('REFUND_COMPLETED') ||
      normalizedStatus === 'COMPLETED'
    ) {
      return 'users-status-badge users-status-badge--active';
    }
    
    // Info states (blue) - processing
    if (
      normalizedStatus.includes('PAYMENT_CONFIRMED') ||
      normalizedStatus.includes('ORDER_CONFIRMED') ||
      normalizedStatus.includes('PACKED') ||
      normalizedStatus.includes('SHIPPED') ||
      normalizedStatus.includes('OUT_FOR_DELIVERY') ||
      normalizedStatus === 'PROCESSING'
    ) {
      return 'users-status-badge users-status-badge--processing';
    }
    
    // Warning states (yellow/orange) - pending
    if (
      normalizedStatus.includes('ORDER_PLACED') ||
      normalizedStatus.includes('RETURN_REQUESTED') ||
      normalizedStatus.includes('RETURN_PICKED') ||
      normalizedStatus.includes('REFUND_INITIATED') ||
      normalizedStatus === 'PENDING'
    ) {
      return 'users-status-badge users-status-badge--warning';
    }
    
    // Error states (red) - cancelled
    if (
      normalizedStatus.includes('CANCELLED') ||
      normalizedStatus === 'CANCELLED'
    ) {
      return 'users-status-badge users-status-badge--inactive';
    }
    
    return 'users-status-badge';
  };

  const formatStatus = (status: string) => {
    if (!status) return 'N/A';
    return status
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const columns = [
    {
      key: 'id',
      header: 'Order ID',
      sortable: true,
      render: (order: IOrderListItem) => order.id || 'N/A',
    },
    {
      key: 'userName',
      header: 'User',
      sortable: true,
      render: (order: IOrderListItem) => order.userName || 'N/A',
    },
    {
      key: 'dealerName',
      header: 'Dealer',
      sortable: true,
      render: (order: IOrderListItem) => order.dealerName || 'N/A',
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      sortValue: (order: IOrderListItem) => order.amount,
      render: (order: IOrderListItem) => order.amount ? `₹${order.amount.toFixed(2)}` : 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (order: IOrderListItem) => order.status,
      render: (order: IOrderListItem) => {
        const statusClass = getStatusClass(order.status || '');
        return (
          <span className={statusClass}>
            {formatStatus(order.status || 'N/A')}
          </span>
        );
      },
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      sortValue: (order: IOrderListItem) => new Date(order.date),
      render: (order: IOrderListItem) => order.date ? new Date(order.date).toLocaleDateString() : 'N/A',
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_order: IOrderListItem) => (
        <div className="users-action-buttons">

        </div>
      ),
    },
  ];

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
          <h1 className="users-page__title">Orders</h1>
          <p className="users-page__subtitle">
            View and manage all orders, transactions, and fulfillment status from a centralized dashboard.
          </p>
        </div>
        <div className="users-page__stats">
          <motion.div
            className="users-page__stat-card"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Total Orders</span>
            <strong>{statusSummary.total}</strong>
            <small>Orders This View</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--warning"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Pending</span>
            <strong>{statusSummary.pending}</strong>
            <small>Awaiting action</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--processing"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Processing</span>
            <strong>{statusSummary.processing}</strong>
            <small>In progress</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--active"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Completed</span>
            <strong>{statusSummary.completed}</strong>
            <small>Delivered</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--inactive"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Cancelled</span>
            <strong>{statusSummary.cancelled}</strong>
            <small>Need attention</small>
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
            <div className="users-toolbar__field users-toolbar__field--search">
              <div className="users-toolbar__input-wrapper">
                <Input
                  placeholder="Search by order ID, user, or dealer"
                  value={searchInputValue}
                  onChange={handleSearchChange}
                  icon={Search}
                />
              </div>
            </div>
            <div className="users-toolbar__field users-toolbar__field--filter">
              <div className="users-toolbar__select">
                <Select
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                  placeholder="All Status"
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'processing', label: 'Processing' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                />
              </div>
            </div>
            <div className="users-toolbar__field users-toolbar__field--filter">
              <div className="users-toolbar__select">
                <Select
                  value={dealerFilter}
                  onChange={(value) => {
                    setDealerFilter(value);
                    setCurrentPage(1);
                  }}
                  placeholder="All Dealers"
                  searchable={uniqueDealers.length > 5}
                  options={[
                    { value: 'all', label: 'All Dealers' },
                    ...uniqueDealers.map((dealer) => ({
                      value: dealer.id,
                      label: dealer.name,
                    })),
                  ]}
                />
              </div>
            </div>
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
          <div className="users-toolbar__row users-toolbar__row--chips">
            <div className="users-toolbar__chips">
              {activeFilters.length ? (
                activeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    className="users-filter-chip"
                    type="button"
                    onClick={() => handleClearFilter(filter.key)}
                  >
                    <span>{filter.label}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                ))
              ) : (
                <span className="users-toolbar__chips-placeholder">
                  <Lightbulb size={14} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />
                  Tip: Combine search + filters for precise segments.
                </span>
              )}
            </div>
            {activeFilters.length > 0 && (
              <div className="users-toolbar__chips-actions">
                <button type="button" onClick={handleClearAllFilters}>
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="users-table-wrapper">
          {loading ? (
            <SkeletonTable rows={5} columns={columns.length} />
          ) : isEmptyState ? (
            <div className="users-empty-state">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="users-empty-state__illustration"
              >
                <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="20" width="140" height="80" rx="16" fill="#F2F4F7" />
                  <rect x="25" y="40" width="110" height="10" rx="5" fill="#E0E7FF" />
                  <rect x="25" y="60" width="78" height="10" rx="5" fill="#DBEAFE" />
                  <circle cx="120" cy="85" r="12" fill="#DBEAFE" />
                  <path d="M115 85l3 4 7-8" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
              <h3>No orders found</h3>
              <p>It looks a little quiet here. Adjust filters or wait for new orders to come in.</p>
              <div className="users-empty-state__tip">
                <Lightbulb size={16} />
                <span>Tip: Combine search + filters for precise segments.</span>
              </div>
              <div className="users-empty-state__actions">
                <div className="users-empty-state__cta users-empty-state__cta--ghost">
                  <Button
                    variant="outline"
                    onClick={handleClearAllFilters}
                  >
                    Reset filters
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="users-table">
                <Table
                  columns={columns}
                  data={orders}
                  onRowClick={(order) => navigate(`/orders/${order.id}`)}
                />
              </div>
              {totalItems > 0 && (
                <div className="users-pagination">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={() => {}}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

