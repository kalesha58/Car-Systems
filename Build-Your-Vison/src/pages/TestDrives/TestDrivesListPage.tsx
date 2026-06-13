import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Card } from '@components/Card/Card';
import { Input } from '@components/Input/Input';
import { Pagination } from '@components/Pagination/Pagination';
import { Select } from '@components/Select';
import { SkeletonTable } from '@components/Skeleton';
import { Table } from '@components/Table/Table';
import { getAdminTestDrives } from '@services/testDriveService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IAdminTestDrive, TestDriveStatus } from '../../types/testDrive';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  completed: '#6b7280',
  cancelled: '#9ca3af',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const formatDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const TestDrivesListPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [testDrives, setTestDrives] = useState<IAdminTestDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const itemsPerPage = 20;

  const fetchTestDrives = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const result = await getAdminTestDrives({
        page,
        limit: itemsPerPage,
        search: search || undefined,
        status: (status as TestDriveStatus) || undefined,
      });
      setTestDrives(result.testDrives ?? []);
      setTotalPages(result.pagination?.totalPages ?? 1);
      setTotalItems(result.pagination?.total ?? 0);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load test drives';
      setFetchError(message);
      setTestDrives([]);
      showToast('Failed to load test drives', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, showToast]);

  useEffect(() => {
    fetchTestDrives();
  }, [fetchTestDrives]);

  const getStatusClass = (value: string) => {
    switch (value) {
      case 'approved':
      case 'completed':
        return 'users-status-badge users-status-badge--active';
      case 'pending':
        return 'users-status-badge users-status-badge--warning';
      case 'rejected':
      case 'cancelled':
        return 'users-status-badge users-status-badge--inactive';
      default:
        return 'users-status-badge';
    }
  };

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      sortValue: (td: IAdminTestDrive) => td.customerName || '',
      render: (td: IAdminTestDrive) => (
        <div>
          <div style={{ fontWeight: 600 }}>{td.customerName || '—'}</div>
          <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>
            {td.customerPhone || td.customerEmail || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      sortable: true,
      sortValue: (td: IAdminTestDrive) => td.vehicleLabel || '',
      render: (td: IAdminTestDrive) => td.vehicleLabel || td.vehicleId,
    },
    {
      key: 'dealer',
      header: 'Dealer',
      sortable: true,
      sortValue: (td: IAdminTestDrive) => td.dealerName || '',
      render: (td: IAdminTestDrive) => td.dealerName || td.dealerId,
    },
    {
      key: 'schedule',
      header: 'Date / Time',
      sortable: true,
      sortValue: (td: IAdminTestDrive) => new Date(td.preferredDate),
      render: (td: IAdminTestDrive) => (
        <div>
          <div>{formatDate(td.preferredDate)}</div>
          <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>{td.preferredTime}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (td: IAdminTestDrive) => td.status,
      render: (td: IAdminTestDrive) => {
        const color = STATUS_COLORS[td.status] || '#6b7280';
        return (
          <span
            className={getStatusClass(td.status)}
            style={{ background: `${color}20`, color }}
          >
            {td.status}
          </span>
        );
      },
    },
  ];

  const emptyStateMessage = (() => {
    if (status === 'approved') {
      return 'No approved test drives yet. New bookings start as Pending — try the Pending or All Statuses filter.';
    }
    if (status === 'pending') {
      return 'No pending test drive requests. Enable "Allow test drive" on a vehicle, then have a customer book from the app.';
    }
    if (status) {
      return `No ${status} test drives found. Try All Statuses to see every request.`;
    }
    return 'No test drive requests yet. Enable "Allow test drive" on a vehicle (Inventory → Vehicles), then customers can book from the app.';
  })();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="users-page">
      <Breadcrumbs />

      <div className="users-page__hero">
        <div>
          <h1 className="users-page__title">Test Drives</h1>
          <p className="users-page__subtitle">
            Manage test drive requests across all dealers. Click a row to view full details.
          </p>
        </div>
      </div>

      <Card style={{ marginBottom: theme.spacing.md, padding: theme.spacing.md }}>
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
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Customer, dealer, vehicle..."
          />
          <Select
            label="Status"
            value={status}
            onChange={(value) => {
              setStatus(value);
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
        ) : fetchError ? (
          <div style={{ padding: theme.spacing.xl, textAlign: 'center' }}>
            <p style={{ fontWeight: 600, color: theme.colors.error }}>Could not load test drives</p>
            <p style={{ color: theme.colors.textSecondary }}>{fetchError}</p>
          </div>
        ) : testDrives.length === 0 ? (
          <div style={{ padding: theme.spacing.xl, textAlign: 'center', color: theme.colors.textSecondary }}>
            <p style={{ fontWeight: 600, color: theme.colors.text }}>No test drives found</p>
            <p style={{ maxWidth: 520, margin: '8px auto 0', lineHeight: 1.5 }}>{emptyStateMessage}</p>
          </div>
        ) : (
          <Table
            columns={columns}
            data={testDrives}
            onRowClick={(td) => navigate(`/test-drives/${td.id}`)}
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
