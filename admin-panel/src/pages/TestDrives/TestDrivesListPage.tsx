import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { Input } from '@components/Input/Input';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { useCallback, useEffect, useState } from 'react';
import {
  deleteAdminTestDrive,
  getAdminTestDrives,
  updateAdminTestDrive,
  updateAdminTestDriveStatus,
} from '@services/testDriveService';
import type { IAdminTestDrive, TestDriveStatus } from '../../types/testDrive';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  completed: '#6b7280',
  cancelled: '#9ca3af',
};

const STATUS_ACTIONS: Record<TestDriveStatus, TestDriveStatus[]> = {
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['completed', 'cancelled'],
  rejected: [],
  completed: [],
  cancelled: [],
};

export const TestDrivesListPage = () => {
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [testDrives, setTestDrives] = useState<IAdminTestDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{
    id: string;
    preferredDate: string;
    preferredTime: string;
    notes: string;
  } | null>(null);

  const fetchTestDrives = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAdminTestDrives({
        page,
        limit: 20,
        search: search || undefined,
        status: (status as TestDriveStatus) || undefined,
      });
      setTestDrives(result.testDrives);
      setTotalPages(result.pagination?.totalPages ?? 1);
    } catch {
      showToast('Failed to load test drives', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, showToast]);

  useEffect(() => {
    fetchTestDrives();
  }, [fetchTestDrives]);

  const s = theme.spacing;

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleStatusChange = async (id: string, newStatus: TestDriveStatus) => {
    try {
      setSubmittingId(id);
      await updateAdminTestDriveStatus(id, { status: newStatus });
      showToast(`Test drive ${newStatus}`, 'success');
      fetchTestDrives();
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this test drive permanently?')) return;
    try {
      setSubmittingId(id);
      await deleteAdminTestDrive(id);
      showToast('Test drive deleted', 'success');
      fetchTestDrives();
    } catch {
      showToast('Failed to delete test drive', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    try {
      setSubmittingId(editModal.id);
      await updateAdminTestDrive(editModal.id, {
        preferredDate: editModal.preferredDate,
        preferredTime: editModal.preferredTime,
        notes: editModal.notes,
      });
      showToast('Test drive updated', 'success');
      setEditModal(null);
      fetchTestDrives();
    } catch {
      showToast('Failed to update test drive', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div style={{ padding: s.lg }}>
      <Breadcrumbs />

      <div style={{ marginBottom: s.lg }}>
        <h1 style={{ margin: 0, color: theme.colors.text, fontSize: '1.5rem', fontWeight: 700 }}>
          Test Drives
        </h1>
        <p style={{ margin: 0, color: theme.colors.textSecondary, marginTop: 4 }}>
          Manage test drive requests across all dealers
        </p>
      </div>

      <Card style={{ marginBottom: s.md, padding: s.md }}>
        <div style={{ display: 'flex', gap: s.md, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input
              label="Search"
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Customer, dealer, vehicle..."
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
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
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
        ) : testDrives.length === 0 ? (
          <div style={{ padding: s.xl, textAlign: 'center', color: theme.colors.textSecondary }}>
            No test drives found.
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
                  {['Customer', 'Vehicle', 'Dealer', 'Date / Time', 'Status', 'Actions'].map((h) => (
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
                {testDrives.map((td) => {
                  const statusColor = STATUS_COLORS[td.status] || '#6b7280';
                  const isExpanded = expandedId === td.id;
                  const actions = STATUS_ACTIONS[td.status] || [];
                  const busy = submittingId === td.id;

                  return (
                    <>
                      <tr key={td.id} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                        <td style={{ padding: '12px 16px', color: theme.colors.text }}>
                          <div style={{ fontWeight: 600 }}>{td.customerName || '—'}</div>
                          <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>
                            {td.customerPhone || td.customerEmail}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: theme.colors.text }}>
                          {td.vehicleLabel || td.vehicleId}
                        </td>
                        <td style={{ padding: '12px 16px', color: theme.colors.text }}>
                          {td.dealerName || td.dealerId}
                        </td>
                        <td style={{ padding: '12px 16px', color: theme.colors.text, whiteSpace: 'nowrap' }}>
                          {formatDate(td.preferredDate)}
                          <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>
                            {td.preferredTime}
                          </div>
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
                            }}
                          >
                            {td.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {actions.map((action) => (
                              <Button
                                key={action}
                                variant="outline"
                                disabled={busy}
                                onClick={() => handleStatusChange(td.id, action)}
                                style={{ padding: '4px 10px', fontSize: '0.72rem', textTransform: 'capitalize' }}
                              >
                                {action}
                              </Button>
                            ))}
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                setEditModal({
                                  id: td.id,
                                  preferredDate: td.preferredDate.split('T')[0],
                                  preferredTime: td.preferredTime,
                                  notes: td.notes || '',
                                })
                              }
                              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() => setExpandedId(isExpanded ? null : td.id)}
                              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                            >
                              {isExpanded ? 'Hide' : 'View'}
                            </Button>
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() => handleDelete(td.id)}
                              style={{ padding: '4px 10px', fontSize: '0.72rem', color: '#ef4444' }}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${td.id}-expanded`}>
                          <td
                            colSpan={6}
                            style={{
                              padding: '16px 24px',
                              background: theme.colors.surface,
                              borderBottom: `1px solid ${theme.colors.border}`,
                            }}
                          >
                            <div style={{ display: 'grid', gap: 8, fontSize: '0.85rem', color: theme.colors.text }}>
                              <div><strong>Notes:</strong> {td.notes || '—'}</div>
                              <div><strong>Dealer notes:</strong> {td.dealerNotes || '—'}</div>
                              <div><strong>User ID:</strong> {td.userId}</div>
                              <div><strong>Vehicle ID:</strong> {td.vehicleId}</div>
                              <div><strong>Dealer ID:</strong> {td.dealerId}</div>
                              <div><strong>Created:</strong> {formatDate(td.createdAt)}</div>
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
      </Card>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: s.sm, marginTop: s.md }}>
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span style={{ alignSelf: 'center', color: theme.colors.textSecondary }}>
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {editModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setEditModal(null)}
        >
          <Card
            style={{ padding: s.lg, width: '100%', maxWidth: 420 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', color: theme.colors.text }}>Edit Test Drive</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <Input
                label="Preferred date"
                type="date"
                value={editModal.preferredDate}
                onChange={(v) => setEditModal({ ...editModal, preferredDate: v })}
              />
              <Input
                label="Preferred time (HH:mm)"
                value={editModal.preferredTime}
                onChange={(v) => setEditModal({ ...editModal, preferredTime: v })}
              />
              <Input
                label="Customer notes"
                value={editModal.notes}
                onChange={(v) => setEditModal({ ...editModal, notes: v })}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setEditModal(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={submittingId === editModal.id}>
                Save
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
