import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { ImagePreviewModal } from '@components/ImagePreviewModal/ImagePreviewModal';
import { Input } from '@components/Input/Input';
import { SkeletonCard } from '@components/Skeleton';
import {
  deleteAdminTestDrive,
  getAdminTestDriveById,
  updateAdminTestDrive,
  updateAdminTestDriveStatus,
} from '@services/testDriveService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Car, Store, User } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { IAdminTestDriveDetail, TestDriveStatus } from '../../types/testDrive';

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

const formatDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getImageSrc = (img: string) => {
  if (!img) return '';
  if (img.startsWith('http') || img.startsWith('data:')) return img;
  return `data:image/jpeg;base64,${img}`;
};

const getInitials = (name?: string) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

export const TestDriveDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [testDrive, setTestDrive] = useState<IAdminTestDriveDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<{
    preferredDate: string;
    preferredTime: string;
    notes: string;
  } | null>(null);
  const [statusModal, setStatusModal] = useState<{
    status: TestDriveStatus;
    dealerNotes: string;
  } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchTestDrive = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getAdminTestDriveById(id);
      setTestDrive(data);
    } catch {
      showToast('Failed to load test drive', 'error');
      navigate('/test-drives');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    fetchTestDrive();
  }, [fetchTestDrive]);

  const handleStatusChange = async () => {
    if (!testDrive || !statusModal) return;
    try {
      setSubmitting(true);
      const updated = await updateAdminTestDriveStatus(testDrive.id, {
        status: statusModal.status,
        dealerNotes: statusModal.dealerNotes || undefined,
      });
      setTestDrive(updated);
      setStatusModal(null);
      showToast(`Test drive ${statusModal.status}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!testDrive || !editModal) return;
    try {
      setSubmitting(true);
      const updated = await updateAdminTestDrive(testDrive.id, {
        preferredDate: editModal.preferredDate,
        preferredTime: editModal.preferredTime,
        notes: editModal.notes,
      });
      setTestDrive(updated);
      setEditModal(null);
      showToast('Test drive updated', 'success');
    } catch {
      showToast('Failed to update test drive', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!testDrive || !window.confirm('Delete this test drive permanently?')) return;
    try {
      setSubmitting(true);
      await deleteAdminTestDrive(testDrive.id);
      showToast('Test drive deleted', 'success');
      navigate('/test-drives');
    } catch {
      showToast('Failed to delete test drive', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: theme.spacing.lg }}>
        <Breadcrumbs />
        <div style={{ display: 'grid', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!testDrive) {
    return (
      <div style={{ padding: theme.spacing.lg }}>
        <Breadcrumbs />
        <Card style={{ padding: theme.spacing.xl, textAlign: 'center' }}>
          <p>Test drive not found</p>
          <Button variant="outline" onClick={() => navigate('/test-drives')} style={{ marginTop: 12 }}>
            Back to Test Drives
          </Button>
        </Card>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[testDrive.status] || '#6b7280';
  const actions = STATUS_ACTIONS[testDrive.status] || [];
  const vehicleImages = testDrive.vehicle?.images || (testDrive.vehicleImage ? [testDrive.vehicleImage] : []);

  const infoCardStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    boxShadow: theme.shadows.md,
    border: `1px solid ${theme.colors.border}`,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: theme.spacing.lg }}>
      <Breadcrumbs />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: theme.spacing.lg }}>
        <div>
          <Button variant="outline" onClick={() => navigate('/test-drives')} style={{ marginBottom: 12 }}>
            <ArrowLeft size={16} style={{ marginRight: 6 }} />
            Back
          </Button>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: theme.colors.text }}>
            Test Drive — {testDrive.vehicleLabel || 'Vehicle'}
          </h1>
          <span
            style={{
              display: 'inline-flex',
              marginTop: 8,
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: '0.8rem',
              fontWeight: 600,
              background: `${statusColor}20`,
              color: statusColor,
              textTransform: 'capitalize',
            }}
          >
            {testDrive.status}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {actions.map((action) => (
            <Button
              key={action}
              variant="outline"
              disabled={submitting}
              onClick={() => setStatusModal({ status: action, dealerNotes: testDrive.dealerNotes || '' })}
              style={{ textTransform: 'capitalize' }}
            >
              {action}
            </Button>
          ))}
          <Button
            variant="outline"
            disabled={submitting}
            onClick={() =>
              setEditModal({
                preferredDate: testDrive.preferredDate.split('T')[0],
                preferredTime: testDrive.preferredTime,
                notes: testDrive.notes || '',
              })
            }
          >
            Edit
          </Button>
          <Button variant="outline" disabled={submitting} onClick={handleDelete} style={{ color: '#ef4444' }}>
            Delete
          </Button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: theme.spacing.md,
          marginBottom: theme.spacing.md,
        }}
      >
        {/* Customer */}
        <div style={infoCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            {testDrive.customerProfileImage ? (
              <img
                src={getImageSrc(testDrive.customerProfileImage)}
                alt={testDrive.customerName || 'Customer'}
                style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: `${theme.colors.primary}20`,
                  color: theme.colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {getInitials(testDrive.customerName)}
              </div>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Customer</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Who booked</p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Name</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{testDrive.customerName || '—'}</p>
            </div>
            {testDrive.customerEmail && (
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Email</p>
                <a href={`mailto:${testDrive.customerEmail}`} style={{ color: theme.colors.primary }}>
                  {testDrive.customerEmail}
                </a>
              </div>
            )}
            {testDrive.customerPhone && (
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Phone</p>
                <a href={`tel:${testDrive.customerPhone}`} style={{ color: theme.colors.primary }}>
                  {testDrive.customerPhone}
                </a>
              </div>
            )}
            <Link to={`/users/${testDrive.userId}`} style={{ color: theme.colors.primary, fontSize: '0.875rem' }}>
              View user profile →
            </Link>
          </div>
        </div>

        {/* Vehicle */}
        <div style={infoCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: `${theme.colors.secondary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.secondary }}>
              <Car size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Vehicle</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Test drive vehicle</p>
            </div>
          </div>
          {vehicleImages[0] && (
            <img
              src={getImageSrc(vehicleImages[0])}
              alt={testDrive.vehicleLabel}
              onClick={() => setIsImageModalOpen(true)}
              style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 12, cursor: 'pointer' }}
            />
          )}
          <div style={{ display: 'grid', gap: 8, fontSize: '0.875rem' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>{testDrive.vehicleLabel || '—'}</p>
            {testDrive.vehicle?.vehicleType && <p style={{ margin: 0 }}>Type: {testDrive.vehicle.vehicleType}</p>}
            {testDrive.vehicle?.fuelType && <p style={{ margin: 0 }}>Fuel: {testDrive.vehicle.fuelType}</p>}
            {testDrive.vehicle?.transmission && <p style={{ margin: 0 }}>Transmission: {testDrive.vehicle.transmission}</p>}
            {testDrive.vehicle?.mileage != null && <p style={{ margin: 0 }}>Mileage: {testDrive.vehicle.mileage} km</p>}
            {testDrive.vehicle?.price != null && <p style={{ margin: 0 }}>Price: ₹{testDrive.vehicle.price.toLocaleString()}</p>}
            <Link to={`/vehicles/${testDrive.vehicleId}`} style={{ color: theme.colors.primary }}>
              View vehicle →
            </Link>
          </div>
        </div>

        {/* Dealer */}
        <div style={infoCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: `${theme.colors.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.primary }}>
              <Store size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Dealer</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Vehicle seller</p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 8, fontSize: '0.875rem' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>{testDrive.dealerName || '—'}</p>
            {testDrive.dealer?.type && <p style={{ margin: 0 }}>Type: {testDrive.dealer.type}</p>}
            {testDrive.dealer?.phone && (
              <p style={{ margin: 0 }}>
                Phone: <a href={`tel:${testDrive.dealer.phone}`}>{testDrive.dealer.phone}</a>
              </p>
            )}
            {testDrive.dealer?.address && <p style={{ margin: 0 }}>Address: {testDrive.dealer.address}</p>}
          </div>
        </div>
      </div>

      <Card title="Booking Details" icon={User}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Preferred date</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{formatDate(testDrive.preferredDate)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Preferred time</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{testDrive.preferredTime}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Created</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{formatDate(testDrive.createdAt)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Updated</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{formatDate(testDrive.updatedAt)}</p>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Customer notes</p>
            <p style={{ margin: 0 }}>{testDrive.notes || '—'}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Dealer / admin notes</p>
            <p style={{ margin: 0 }}>{testDrive.dealerNotes || '—'}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Request ID</p>
            <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.8rem' }}>{testDrive.id}</p>
          </div>
        </div>
      </Card>

      {vehicleImages.length > 0 && (
        <ImagePreviewModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          images={vehicleImages}
          initialIndex={0}
        />
      )}

      {editModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditModal(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <Card style={{ padding: theme.spacing.lg, width: '100%', maxWidth: 420 }}>
              <h3 style={{ margin: '0 0 16px' }}>Edit Test Drive</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <Input label="Preferred date" type="date" value={editModal.preferredDate} onChange={(v) => setEditModal({ ...editModal, preferredDate: v })} />
                <Input label="Preferred time (HH:mm)" value={editModal.preferredTime} onChange={(v) => setEditModal({ ...editModal, preferredTime: v })} />
                <Input label="Customer notes" value={editModal.notes} onChange={(v) => setEditModal({ ...editModal, notes: v })} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={() => setEditModal(null)}>Cancel</Button>
                <Button onClick={handleSaveEdit} disabled={submitting}>Save</Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {statusModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setStatusModal(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <Card style={{ padding: theme.spacing.lg, width: '100%', maxWidth: 420 }}>
              <h3 style={{ margin: '0 0 8px', textTransform: 'capitalize' }}>Mark as {statusModal.status}</h3>
              <p style={{ margin: '0 0 16px', color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
                Customer will receive a push notification with the result.
              </p>
              <Input
                label="Notes for customer (optional)"
                value={statusModal.dealerNotes}
                onChange={(v) => setStatusModal({ ...statusModal, dealerNotes: v })}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={() => setStatusModal(null)}>Cancel</Button>
                <Button onClick={handleStatusChange} disabled={submitting}>Confirm</Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </motion.div>
  );
};
