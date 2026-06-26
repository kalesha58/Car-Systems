import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Card } from '@components/Card/Card';
import { Input } from '@components/Input/Input';
import { useToastStore } from '@store/toastStore';
import { useAuthStore } from '@store/authStore';
import { API_BASE_URL } from '@constants/api';
import { useTheme } from '@theme/ThemeContext';
import { useCallback, useEffect, useState } from 'react';
import { getAdminServiceBookings, type IAdminServiceBooking } from '@services/couponService';
import { Button } from '@components/Button/Button';

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6',
  scheduled: '#10b981',
  in_progress: '#f59e0b',
  awaiting: '#8b5cf6',
  completed: '#6b7280',
  cancelled: '#ef4444',
};

export const ServiceBookingsListPage = () => {
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [bookings, setBookings] = useState<IAdminServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDownloadInvoice = (bookingId: string) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    const url = `${API_BASE_URL}api/invoices/service/${bookingId}?token=${token}`;
    window.open(url, '_blank');
  };

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAdminServiceBookings({
        page,
        limit: 20,
        search: search || undefined,
        status: status || undefined,
      });
      setBookings(result.bookings);
      setTotalPages(result.pagination?.totalPages ?? 1);
    } catch {
      showToast('Failed to load service bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, showToast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const s = theme.spacing;

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div style={{ padding: s.lg }}>
      <Breadcrumbs />

      <div style={{ marginBottom: s.lg }}>
        <h1 style={{ margin: 0, color: theme.colors.text, fontSize: '1.5rem', fontWeight: 700 }}>
          Service Bookings
        </h1>
        <p style={{ margin: 0, color: theme.colors.textSecondary, marginTop: 4 }}>
          All service bookings across dealers
        </p>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: s.md, padding: s.md }}>
        <div style={{ display: 'flex', gap: s.md, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input
              label="Search"
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Customer name, service..."
            />
          </div>
          <div style={{ minWidth: 160 }}>
            <label
              style={{
                display: 'block',
                marginBottom: s.xs,
                color: theme.colors.text,
                fontWeight: 500,
                fontSize: '0.875rem',
              }}
            >
              Status
            </label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${theme.colors.border}`,
                background: theme.colors.surface,
                color: theme.colors.text,
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting">Awaiting</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      <Card style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: s.xl, textAlign: 'center', color: theme.colors.textSecondary }}>
            Loading...
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ padding: s.xl, textAlign: 'center', color: theme.colors.textSecondary }}>
            No service bookings found.
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
                  {[
                    'Customer',
                    'Service',
                    'Dealer',
                    'Date',
                    'Status',
                    'Priority',
                    'Rejection Reason',
                    'Details',
                  ].map((h) => (
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
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const statusColor = STATUS_COLORS[booking.status] || '#6b7280';
                  const isExpanded = expandedId === booking.id;
                  return (
                    <>
                      <tr
                        key={booking.id}
                        style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                      >
                        <td style={{ padding: '12px 16px', color: theme.colors.text }}>
                          <div style={{ fontWeight: 600 }}>{booking.customerName || '—'}</div>
                          <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>
                            {booking.customerPhone}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: theme.colors.text }}>
                          <div>{booking.serviceName || '—'}</div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: theme.colors.textSecondary,
                              maxWidth: 160,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {booking.serviceRequest}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: theme.colors.text }}>
                          {booking.dealerName || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: theme.colors.text, whiteSpace: 'nowrap' }}>
                          {formatDate(booking.bookingDate)}
                          {booking.bookingTime && (
                            <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>
                              {booking.bookingTime}
                            </div>
                          )}
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
                              textTransform: 'capitalize',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {booking.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: theme.colors.text, textTransform: 'capitalize' }}>
                          {booking.priority}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {booking.rejectionReason ? (
                            <span
                              style={{
                                display: 'inline-block',
                                maxWidth: 180,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: '#ef4444',
                                fontSize: '0.8rem',
                                fontStyle: 'italic',
                              }}
                              title={booking.rejectionReason}
                            >
                              {booking.rejectionReason}
                            </span>
                          ) : (
                            <span style={{ color: theme.colors.textSecondary, fontSize: '0.8rem' }}>
                              —
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Button
                            variant="outline"
                            onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                            style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                          >
                            {isExpanded ? 'Hide' : 'View'}
                          </Button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${booking.id}-expanded`}>
                          <td
                            colSpan={8}
                            style={{
                              padding: '16px 24px',
                              background: theme.colors.surface,
                              borderBottom: `1px solid ${theme.colors.border}`,
                            }}
                          >
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: 12,
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 600, color: theme.colors.text, fontSize: '0.8rem' }}>
                                  Notes:
                                </span>
                                <p style={{ margin: '4px 0 0', color: theme.colors.textSecondary, fontSize: '0.8rem' }}>
                                  {booking.notes || '—'}
                                </p>
                              </div>
                              <div>
                                <span style={{ fontWeight: 600, color: theme.colors.text, fontSize: '0.8rem' }}>
                                  Dealer Notes:
                                </span>
                                <p style={{ margin: '4px 0 0', color: theme.colors.textSecondary, fontSize: '0.8rem' }}>
                                  {booking.dealerNotes || '—'}
                                </p>
                              </div>
                              {booking.rejectionReason && (
                                <div>
                                  <span style={{ fontWeight: 600, color: '#ef4444', fontSize: '0.8rem' }}>
                                    Rejection Reason:
                                  </span>
                                  <p style={{ margin: '4px 0 0', color: '#ef4444', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                    {booking.rejectionReason}
                                  </p>
                                </div>
                              )}
                              <div>
                                <span style={{ fontWeight: 600, color: theme.colors.text, fontSize: '0.8rem' }}>
                                  Assigned Mechanic:
                                </span>
                                <p style={{ margin: '4px 0 0', color: theme.colors.textSecondary, fontSize: '0.8rem' }}>
                                  {booking.assignedMechanic || '—'}
                                </p>
                              </div>
                              <div>
                                <span style={{ fontWeight: 600, color: theme.colors.text, fontSize: '0.8rem' }}>
                                  Created:
                                </span>
                                <p style={{ margin: '4px 0 0', color: theme.colors.textSecondary, fontSize: '0.8rem' }}>
                                  {formatDate(booking.createdAt)}
                                </p>
                              </div>
                              <div>
                                <span style={{ fontWeight: 600, color: theme.colors.text, fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                                  Invoice:
                                </span>
                                <Button
                                  variant="primary"
                                  onClick={() => handleDownloadInvoice(booking.id)}
                                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                >
                                  Download Invoice
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
    </div>
  );
};
