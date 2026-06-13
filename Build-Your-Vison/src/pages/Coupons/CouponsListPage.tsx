import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { Input } from '@components/Input/Input';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoupons, deleteCoupon, type ICoupon } from '@services/couponService';
import { ConfirmModal } from '@components/ConfirmModal/ConfirmModal';

export const CouponsListPage = () => {
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getCoupons({ page, limit: 20, search: search || undefined });
      const list = result.coupons ?? (result as any).Response?.coupons ?? [];
      setCoupons(list);
      setTotalPages(result.pagination?.totalPages ?? 1);
    } catch {
      showToast('Failed to load coupons', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, showToast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteCoupon(id);
      showToast('Coupon deleted', 'success');
      fetchCoupons();
    } catch {
      showToast('Failed to delete coupon', 'error');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN');

  const isExpired = (until: string) => new Date(until) < new Date();

  const s = theme.spacing;

  return (
    <div style={{ padding: s.lg }}>
      <Breadcrumbs />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: s.lg,
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: theme.colors.text, fontSize: '1.5rem', fontWeight: 700 }}>
            Coupons
          </h1>
          <p style={{ margin: 0, color: theme.colors.textSecondary, marginTop: 4 }}>
            Manage discount coupons
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/coupons/new')}>
          + Create Coupon
        </Button>
      </div>

      <Card style={{ marginBottom: s.md, padding: s.md }}>
        <Input
          label=""
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by code..."
        />
      </Card>

      <Card style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: s.xl, textAlign: 'center', color: theme.colors.textSecondary }}>
            Loading...
          </div>
        ) : coupons.length === 0 ? (
          <div style={{ padding: s.xl, textAlign: 'center', color: theme.colors.textSecondary }}>
            No coupons found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    background: theme.colors.surface,
                    borderBottom: `1px solid ${theme.colors.border}`,
                  }}
                >
                  {['Code', 'Type', 'Value', 'Min Order', 'Valid From', 'Valid Until', 'Usage', 'Status', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          color: theme.colors.textSecondary,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => {
                  const expired = isExpired(coupon.validUntil);
                  const statusColor = !coupon.isActive ? '#6b7280' : expired ? '#ef4444' : '#10b981';
                  const statusLabel = !coupon.isActive ? 'Inactive' : expired ? 'Expired' : 'Active';
                  return (
                    <tr
                      key={coupon.id}
                      style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'monospace', color: theme.colors.text }}>
                        {coupon.code}
                      </td>
                      <td style={{ padding: '12px 16px', color: theme.colors.text, textTransform: 'capitalize' }}>
                        {coupon.discountType}
                      </td>
                      <td style={{ padding: '12px 16px', color: theme.colors.text }}>
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%`
                          : `₹${coupon.discountValue}`}
                      </td>
                      <td style={{ padding: '12px 16px', color: theme.colors.text }}>
                        {coupon.minOrderAmount ? `₹${coupon.minOrderAmount}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: theme.colors.text }}>
                        {formatDate(coupon.validFrom)}
                      </td>
                      <td style={{ padding: '12px 16px', color: theme.colors.text }}>
                        {formatDate(coupon.validUntil)}
                      </td>
                      <td style={{ padding: '12px 16px', color: theme.colors.text }}>
                        {coupon.usedCount}
                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            background: `${statusColor}20`,
                            color: statusColor,
                          }}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/coupons/${coupon.id}/edit`)}
                            style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => setConfirmDeleteId(coupon.id)}
                            disabled={deletingId === coupon.id}
                            style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                          >
                            {deletingId === coupon.id ? '...' : 'Delete'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              padding: s.md,
              borderTop: `1px solid ${theme.colors.border}`,
            }}
          >
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </Button>
            <span style={{ lineHeight: '36px', color: theme.colors.text }}>
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </Button>
          </div>
        )}
      </Card>

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};
