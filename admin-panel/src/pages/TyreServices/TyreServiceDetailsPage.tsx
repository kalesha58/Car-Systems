import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { Input } from '@components/Input/Input';
import { SkeletonCard } from '@components/Skeleton';
import {
  getAdminTyreServiceRequestById,
  updateAdminTyreServiceRequestStatus,
} from '@services/tyreServiceRequestService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Store, User, Wrench } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { IAdminTyreServiceRequest } from '../../types/tyreServiceRequest';

const STATUS_COLORS: Record<string, string> = {
  new: '#f59e0b',
  scheduled: '#10b981',
  cancelled: '#ef4444',
  completed: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Pending',
  scheduled: 'Approved',
  cancelled: 'Declined',
};

const formatDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getInitials = (name?: string) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

export const TyreServiceDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [request, setRequest] = useState<IAdminTyreServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    status: 'scheduled' | 'cancelled';
    dealerNotes: string;
    rejectionReason: string;
  } | null>(null);

  const fetchRequest = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getAdminTyreServiceRequestById(id);
      setRequest(data);
    } catch {
      showToast('Failed to load tyre service request', 'error');
      navigate('/tyre-services');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleStatusChange = async () => {
    if (!request || !statusModal) return;
    try {
      setSubmitting(true);
      const updated = await updateAdminTyreServiceRequestStatus(request.id, {
        status: statusModal.status,
        dealerNotes: statusModal.dealerNotes || undefined,
        rejectionReason:
          statusModal.status === 'cancelled'
            ? statusModal.rejectionReason || statusModal.dealerNotes || undefined
            : undefined,
      });
      setRequest(updated);
      setStatusModal(null);
      showToast(
        statusModal.status === 'scheduled' ? 'Request approved' : 'Request rejected',
        'success',
      );
    } catch {
      showToast('Failed to update status', 'error');
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
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div style={{ padding: theme.spacing.lg }}>
        <Breadcrumbs />
        <Card style={{ padding: theme.spacing.xl, textAlign: 'center' }}>
          <p>Request not found</p>
          <Button variant="outline" onClick={() => navigate('/tyre-services')} style={{ marginTop: 12 }}>
            Back to Tyre Service
          </Button>
        </Card>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[request.status] || '#6b7280';
  const statusLabel = STATUS_LABELS[request.status] || request.status;
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

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: theme.spacing.lg,
        }}
      >
        <div>
          <Button variant="outline" onClick={() => navigate('/tyre-services')} style={{ marginBottom: 12 }}>
            <ArrowLeft size={16} style={{ marginRight: 6 }} />
            Back
          </Button>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: theme.colors.text }}>
            Tyre Service — {request.serviceName || request.serviceRequest}
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
            }}
          >
            {statusLabel}
          </span>
        </div>
        {request.status === 'new' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              disabled={submitting}
              onClick={() => setStatusModal({ status: 'scheduled', dealerNotes: '', rejectionReason: '' })}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              disabled={submitting}
              onClick={() => setStatusModal({ status: 'cancelled', dealerNotes: '', rejectionReason: '' })}
              style={{ color: '#ef4444', borderColor: '#ef4444' }}
            >
              Reject
            </Button>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: theme.spacing.md,
          marginBottom: theme.spacing.md,
        }}
      >
        <div style={infoCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
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
              {getInitials(request.customerName)}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={16} /> Customer
              </h3>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Name</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{request.customerName || '—'}</p>
            </div>
            {request.customerPhone && (
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Phone</p>
                <a href={`tel:${request.customerPhone}`}>{request.customerPhone}</a>
              </div>
            )}
            {request.customerEmail && (
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Email</p>
                <a href={`mailto:${request.customerEmail}`}>{request.customerEmail}</a>
              </div>
            )}
            <Link to={`/users/${request.userId}`} style={{ fontSize: '0.85rem' }}>
              View customer profile →
            </Link>
          </div>
        </div>

        <div style={infoCardStyle}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wrench size={16} /> Service
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Name</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{request.serviceName || '—'}</p>
            </div>
            {request.serviceSubCategory && (
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Subcategory</p>
                <p style={{ margin: 0 }}>{request.serviceSubCategory}</p>
              </div>
            )}
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Mode</p>
              <p style={{ margin: 0 }}>{request.homeService ? 'Home Service' : 'Store Service'}</p>
            </div>
            <Link to={`/services/${request.serviceId}/edit`} style={{ fontSize: '0.85rem' }}>
              View service →
            </Link>
          </div>
        </div>

        <div style={infoCardStyle}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Store size={16} /> Dealer
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Business</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{request.dealerName || '—'}</p>
            </div>
            {request.dealerPhone && (
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Phone</p>
                <p style={{ margin: 0 }}>{request.dealerPhone}</p>
              </div>
            )}
            {request.dealerAddress && (
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Address</p>
                <p style={{ margin: 0 }}>{request.dealerAddress}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Card style={{ padding: theme.spacing.lg }}>
        <h3 style={{ margin: '0 0 16px' }}>Request Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Requested date/time</p>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {formatDate(request.bookingDate)}
              {request.bookingTime ? ` at ${request.bookingTime}` : ''}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Submitted</p>
            <p style={{ margin: 0 }}>{formatDate(request.createdAt)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Request ID</p>
            <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem' }}>{request.id}</p>
          </div>
        </div>
        {request.vehicleInfo && (
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Vehicle</p>
            <p style={{ margin: 0 }}>
              {[request.vehicleInfo.brand, request.vehicleInfo.model, request.vehicleInfo.registrationNumber]
                .filter(Boolean)
                .join(' · ') || '—'}
            </p>
          </div>
        )}
        {request.requestLocation?.address && (
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Location</p>
            <p style={{ margin: 0 }}>{request.requestLocation.address}</p>
          </div>
        )}
        {request.notes && (
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Customer notes</p>
            <p style={{ margin: 0 }}>{request.notes}</p>
          </div>
        )}
        {request.dealerNotes && (
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Admin/dealer notes</p>
            <p style={{ margin: 0 }}>{request.dealerNotes}</p>
          </div>
        )}
        {request.rejectionReason && (
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>Rejection reason</p>
            <p style={{ margin: 0, color: '#ef4444' }}>{request.rejectionReason}</p>
          </div>
        )}
      </Card>

      {statusModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => !submitting && setStatusModal(null)}
        >
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Card
              style={{ width: '100%', maxWidth: 440, padding: theme.spacing.lg }}
            >
            <h3 style={{ margin: '0 0 8px' }}>
              {statusModal.status === 'scheduled' ? 'Approve request' : 'Reject request'}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: theme.colors.textSecondary }}>
              The customer will receive a push notification.
            </p>
            <Input
              label="Notes for customer"
              value={statusModal.dealerNotes}
              onChange={v => setStatusModal(prev => (prev ? { ...prev, dealerNotes: v } : null))}
              placeholder="Optional message..."
            />
            {statusModal.status === 'cancelled' && (
              <div style={{ marginTop: 12 }}>
                <Input
                  label="Rejection reason"
                  value={statusModal.rejectionReason}
                  onChange={v => setStatusModal(prev => (prev ? { ...prev, rejectionReason: v } : null))}
                  placeholder="Reason for declining..."
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <Button variant="outline" disabled={submitting} onClick={() => setStatusModal(null)}>
                Cancel
              </Button>
              <Button disabled={submitting} onClick={handleStatusChange}>
                Confirm
              </Button>
            </div>
          </Card>
          </div>
        </div>
      )}
    </motion.div>
  );
};

