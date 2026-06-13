import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Card } from '@components/Card/Card';
import { Input } from '@components/Input/Input';
import { Pagination } from '@components/Pagination/Pagination';
import { Select } from '@components/Select';
import { SkeletonTable } from '@components/Skeleton';
import { Table } from '@components/Table/Table';
import { getAdminTyreServiceRequests } from '@services/tyreServiceRequestService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IAdminTyreServiceRequest, TyreServiceRequestStatus } from '../../types/tyreServiceRequest';

const STATUS_COLORS: Record<string, string> = {
  new: '#f59e0b',
  scheduled: '#10b981',
  cancelled: '#ef4444',
  completed: '#6b7280',
  in_progress: '#3b82f6',
  awaiting: '#8b5cf6',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Pending',
  scheduled: 'Approved',
  cancelled: 'Declined',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'Pending' },
  { value: 'scheduled', label: 'Approved' },
  { value: 'cancelled', label: 'Declined' },
  { value: 'completed', label: 'Completed' },
];

const formatDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const TyreServicesListPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [requests, setRequests] = useState<IAdminTyreServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAdminTyreServiceRequests({
        page,
        limit: itemsPerPage,
        search: search || undefined,
        status: (status as TyreServiceRequestStatus) || undefined,
      });
      setRequests(result.requests ?? []);
      setTotalPages(result.pagination?.totalPages ?? 1);
      setTotalItems(result.pagination?.total ?? 0);
    } catch {
      setRequests([]);
      showToast('Failed to load tyre service requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (row: IAdminTyreServiceRequest) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.customerName || '—'}</div>
          <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>
            {row.customerPhone || row.customerEmail || ''}
          </div>
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Service',
      render: (row: IAdminTyreServiceRequest) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.serviceName || row.serviceRequest}</div>
          {row.serviceSubCategory && (
            <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>
              {row.serviceSubCategory}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'dealer',
      header: 'Dealer',
      render: (row: IAdminTyreServiceRequest) => row.dealerName || '—',
    },
    {
      key: 'schedule',
      header: 'Requested',
      render: (row: IAdminTyreServiceRequest) => (
        <div>
          {formatDate(row.bookingDate)}
          {row.bookingTime ? ` · ${row.bookingTime}` : ''}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: IAdminTyreServiceRequest) => {
        const color = STATUS_COLORS[row.status] || '#6b7280';
        const label = STATUS_LABELS[row.status] || row.status;
        return (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 12,
              fontSize: '0.75rem',
              fontWeight: 600,
              background: `${color}20`,
              color,
            }}
          >
            {label}
          </span>
        );
      },
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="users-page">
      <Breadcrumbs />
      <div className="users-page__hero">
        <h1>Tyre Service</h1>
        <p>Review and approve customer tyre service requests</p>
      </div>

      <Card style={{ marginBottom: theme.spacing.md, padding: theme.spacing.md, overflow: 'visible', position: 'relative', zIndex: 10 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 1fr) minmax(180px, 220px)',
            gap: theme.spacing.md,
            alignItems: 'end',
          }}
        >
          <Input
            label="Search"
            value={search}
            onChange={v => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Customer, service, dealer..."
          />
          <Select
            label="Status"
            value={status}
            onChange={v => {
              setStatus(v);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            style={{ marginBottom: 0 }}
          />
        </div>
      </Card>

      <Card style={{ padding: 0 }}>
        {loading ? (
          <SkeletonTable rows={5} columns={columns.length} />
        ) : requests.length === 0 ? (
          <div style={{ padding: theme.spacing.xl, textAlign: 'center', color: theme.colors.textSecondary }}>
            <p style={{ fontWeight: 600, color: theme.colors.text }}>No tyre service requests found</p>
          </div>
        ) : (
          <Table
            columns={columns}
            data={requests}
            onRowClick={row => navigate(`/tyre-services/${row.id}`)}
          />
        )}
      </Card>

      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
          onItemsPerPageChange={() => {}}
        />
      )}
    </motion.div>
  );
};
