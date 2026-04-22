import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { ConfirmModal } from '@components/ConfirmModal/ConfirmModal';
import { Modal } from '@components/Modal/Modal';
import { Select } from '@components/Select';
import { SkeletonCard } from '@components/Skeleton';
import { Table } from '@components/Table/Table';
import { approveDealer, getDealerById, getDealerOrders, suspendDealer } from '@services/dealerService';
import { cancelOrder, updateOrderStatus } from '@services/orderService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { IDealerDetails } from '../../types/dealer';
import { OrderUpdateStatus } from '../../types/order';

export const DealerDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [dealer, setDealer] = useState<IDealerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showOrderStatusModal, setShowOrderStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{ id: string; status: string } | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState<string>('');
  const [orderStatusNotes, setOrderStatusNotes] = useState<string>('');
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [cancelOrderReason, setCancelOrderReason] = useState<string>('');
  const [cancellingOrder, setCancellingOrder] = useState(false);


  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    // Prevent duplicate calls for same ID
    if (isFetchingRef.current && lastFetchedIdRef.current === id) return;
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    isFetchingRef.current = true;
    lastFetchedIdRef.current = id;



    const fetchDealerDetails = async () => {
      try {
        setLoading(true);
        const [dealerData, ordersData] = await Promise.all([
          getDealerById(id),
          getDealerOrders(id),
        ]);

        setDealer({
          ...dealerData,
          createdDate: (dealerData as { createdAt?: string; createdDate?: string }).createdAt || dealerData.createdDate,
          totalRevenue: (dealerData as { totalRevenue?: number }).totalRevenue || 0,
          orders: ordersData.orders.map((order: { id: string; date: string; amount: number; status: string }) => ({
            id: order.id,
            date: order.date,
            amount: order.amount,
            status: order.status,
          })),
          documents: (dealerData as { documents?: unknown[] }).documents || [],
          reviews: (dealerData as { reviews?: unknown[] }).reviews || [],
        } as IDealerDetails);
        

      } catch (error) {
        if ((error as { name?: string })?.name !== 'AbortError') {
          console.error('Error fetching dealer details:', error);
          showToast('Failed to load dealer details', 'error');
        }
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
      }
    };

    fetchDealerDetails();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, showToast]);

  const handleApprove = async () => {
    if (!dealer || !id) return;

    try {
      setUpdating(true);
      const updatedDealer = await approveDealer(id);
      setDealer({ ...dealer, status: updatedDealer.status });
      showToast('Dealer approved successfully', 'success');
      setShowApproveModal(false);
    } catch (error) {
      console.error('Error approving dealer:', error);
      showToast('Failed to approve dealer', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleSuspend = async () => {
    if (!dealer || !id) return;

    try {
      setUpdating(true);
      const updatedDealer = await suspendDealer(id, { reason: 'Admin suspension' });
      setDealer({ ...dealer, status: updatedDealer.status });
      showToast('Dealer suspended successfully', 'success');
      setShowSuspendModal(false);
    } catch (error) {
      console.error('Error suspending dealer:', error);
      showToast('Failed to suspend dealer', 'error');
    } finally {
      setUpdating(false);
    }
  };




  if (loading) {
    return (
      <div>
        <Breadcrumbs />
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!dealer) {
    return (
      <div>
        <Breadcrumbs />
        <Card>
          <p style={{ color: theme.colors.error }}>Dealer not found</p>
          <Button onClick={() => navigate('/dealers')}>Back to Dealers</Button>
        </Card>
      </div>
    );
  }

  const handleUpdateOrderStatus = (order: { id: string; status: string }) => {
    setSelectedOrder(order);
    setNewOrderStatus(order.status);
    setOrderStatusNotes('');
    setShowOrderStatusModal(true);
  };

  const handleOrderStatusUpdate = async () => {
    if (!selectedOrder || !newOrderStatus || !id) return;

    try {
      setUpdatingOrderStatus(true);
      await updateOrderStatus(selectedOrder.id, {
        status: newOrderStatus,
        notes: orderStatusNotes || `Status updated to ${newOrderStatus}`,
      });
      showToast('Order status updated successfully', 'success');
      setShowOrderStatusModal(false);
      setSelectedOrder(null);
      setNewOrderStatus('');
      setOrderStatusNotes('');
      
      // Refresh dealer details to get updated orders
      const [dealerData, ordersData] = await Promise.all([
        getDealerById(id),
        getDealerOrders(id),
      ]);
      setDealer({
        ...dealerData,
        createdDate: (dealerData as { createdAt?: string; createdDate?: string }).createdAt || dealerData.createdDate,
        totalRevenue: (dealerData as { totalRevenue?: number }).totalRevenue || 0,
        orders: ordersData.orders.map((order: { id: string; date: string; amount: number; status: string }) => ({
          id: order.id,
          date: order.date,
          amount: order.amount,
          status: order.status,
        })),
        documents: (dealerData as { documents?: unknown[] }).documents || [],
        reviews: (dealerData as { reviews?: unknown[] }).reviews || [],
      } as IDealerDetails);
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Failed to update order status', 'error');
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  const handleCancelOrder = (order: { id: string; status: string }) => {
    setSelectedOrder(order);
    setCancelOrderReason('');
    setShowCancelOrderModal(true);
  };

  const handleCancelOrderConfirm = async () => {
    if (!selectedOrder || !cancelOrderReason.trim() || !id) {
      showToast('Please provide a cancellation reason', 'error');
      return;
    }

    try {
      setCancellingOrder(true);
      await cancelOrder(selectedOrder.id, { reason: cancelOrderReason });
      showToast('Order cancelled successfully', 'success');
      setShowCancelOrderModal(false);
      setSelectedOrder(null);
      setCancelOrderReason('');
      
      // Refresh dealer details to get updated orders
      const [dealerData, ordersData] = await Promise.all([
        getDealerById(id),
        getDealerOrders(id),
      ]);
      setDealer({
        ...dealerData,
        createdDate: (dealerData as { createdAt?: string; createdDate?: string }).createdAt || dealerData.createdDate,
        totalRevenue: (dealerData as { totalRevenue?: number }).totalRevenue || 0,
        orders: ordersData.orders.map((order: { id: string; date: string; amount: number; status: string }) => ({
          id: order.id,
          date: order.date,
          amount: order.amount,
          status: order.status,
        })),
        documents: (dealerData as { documents?: unknown[] }).documents || [],
        reviews: (dealerData as { reviews?: unknown[] }).reviews || [],
      } as IDealerDetails);
    } catch (error) {
      console.error('Error cancelling order:', error);
      showToast('Failed to cancel order', 'error');
    } finally {
      setCancellingOrder(false);
    }
  };

  const getOrderStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'delivered':
      case 'refund_completed':
        return theme.colors.success;
      case 'payment_confirmed':
      case 'order_confirmed':
      case 'packed':
      case 'shipped':
      case 'out_for_delivery':
        return theme.colors.info;
      case 'pending':
      case 'order_placed':
      case 'return_requested':
      case 'return_picked':
      case 'refund_initiated':
        return theme.colors.warning;
      case 'cancelled':
      case 'cancelled_by_user':
      case 'cancelled_by_dealer':
        return theme.colors.error;
      default:
        return theme.colors.secondary;
    }
  };

  const formatOrderStatus = (status: string) => {
    return status
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const orderStatusOptions = [
    { value: OrderUpdateStatus.ORDER_PLACED, label: 'Order Placed' },
    { value: OrderUpdateStatus.PAYMENT_CONFIRMED, label: 'Payment Confirmed' },
    { value: OrderUpdateStatus.ORDER_CONFIRMED, label: 'Order Confirmed' },
    { value: OrderUpdateStatus.PACKED, label: 'Packed' },
    { value: OrderUpdateStatus.SHIPPED, label: 'Shipped' },
    { value: OrderUpdateStatus.OUT_FOR_DELIVERY, label: 'Out for Delivery' },
    { value: OrderUpdateStatus.DELIVERED, label: 'Delivered' },
    { value: OrderUpdateStatus.CANCELLED_BY_USER, label: 'Cancelled by User' },
    { value: OrderUpdateStatus.CANCELLED_BY_DEALER, label: 'Cancelled by Dealer' },
    { value: OrderUpdateStatus.RETURN_REQUESTED, label: 'Return Requested' },
    { value: OrderUpdateStatus.RETURN_PICKED, label: 'Return Picked' },
    { value: OrderUpdateStatus.REFUND_INITIATED, label: 'Refund Initiated' },
    { value: OrderUpdateStatus.REFUND_COMPLETED, label: 'Refund Completed' },
  ];

  const orderColumns = [
    { key: 'id', header: 'Order ID' },
    {
      key: 'date',
      header: 'Date',
      render: (order: { date: string }) =>
        order.date ? new Date(order.date).toLocaleDateString() : 'N/A',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (order: { amount: number }) =>
        `₹${order.amount.toFixed(2)}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (order: { status: string }) => (
        <span
          style={{
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            borderRadius: '9999px',
            backgroundColor: getOrderStatusColor(order.status),
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {formatOrderStatus(order.status)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (order: { id: string; status: string }) => {
        const normalizedStatus = order.status.toUpperCase();
        const isFinal = 
          normalizedStatus === OrderUpdateStatus.DELIVERED ||
          normalizedStatus === OrderUpdateStatus.CANCELLED_BY_USER ||
          normalizedStatus === OrderUpdateStatus.CANCELLED_BY_DEALER ||
          normalizedStatus === OrderUpdateStatus.REFUND_COMPLETED;
        
        return (
          <div style={{ display: 'flex', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
            {!isFinal && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateOrderStatus(order)}
                  style={{ fontSize: '0.875rem', padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                >
                  Update Status
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleCancelOrder(order)}
                  style={{ fontSize: '0.875rem', padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                >
                  Cancel Order
                </Button>
              </>
            )}
            {isFinal && (
              <span style={{ fontSize: '0.875rem', color: theme.colors.textSecondary, fontStyle: 'italic' }}>
                No actions available
              </span>
            )}
          </div>
        );
      },
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'suspended':
        return theme.colors.error;
      default:
        return theme.colors.secondary;
    }
  };




  return (
    <div>
      <Breadcrumbs />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.xl,
          flexWrap: 'wrap',
          gap: theme.spacing.md,
        }}
        className="flex-col sm:flex-row"
      >
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: theme.colors.text,
            margin: 0,
          }}
          className="text-xl sm:text-2xl"
        >
          Dealer Details
        </h1>
        <div style={{ display: 'flex', gap: theme.spacing.md }}>
          {dealer.status === 'pending' && (
            <Button onClick={() => setShowApproveModal(true)}>
              Approve Dealer
            </Button>
          )}
          {dealer.status !== 'suspended' && (
            <Button variant="danger" onClick={() => setShowSuspendModal(true)}>
              Suspend Dealer
            </Button>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: theme.spacing.lg,
          marginBottom: theme.spacing.xl,
        }}
      >
        <Card title="Profile Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Dealer Name
              </strong>
              <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                {dealer.name}
              </p>
            </div>
            <div>
              <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Business Name
              </strong>
              <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                {dealer.businessName}
              </p>
            </div>
            <div>
              <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Email
              </strong>
              <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                {dealer.email}
              </p>
            </div>
            <div>
              <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Phone
              </strong>
              <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                {dealer.phone}
              </p>
            </div>
            <div>
              <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Location
              </strong>
              <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                {dealer.location}
              </p>
            </div>
            <div>
              <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Status
              </strong>
              <p className="m-0">
                <span
                  style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: theme.borderRadius.sm,
                    backgroundColor: getStatusColor(dealer.status),
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    display: 'inline-block',
                  }}
                >
                  {dealer.status}
                </span>
              </p>
            </div>
            <div>
              <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Rating
              </strong>
              <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                ⭐ {dealer.rating} ({dealer.totalOrders} orders)
              </p>
            </div>
          </div>
        </Card>

        <Card title="Business Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Address
              </strong>
              <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                {dealer.address}
              </p>
            </div>
            <div>
              <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Total Revenue
              </strong>
              <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                ₹{(dealer.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Created Date
              </strong>
              <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                {dealer.createdDate ? new Date(dealer.createdDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {dealer.documents && dealer.documents.length > 0 && (
        <Card title="Documents" style={{ marginBottom: theme.spacing.xl }}>
          {dealer.documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius.md,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>{doc.type}</p>
                <p
                  style={{
                    margin: 0,
                    color: theme.colors.textSecondary,
                    fontSize: '0.875rem',
                  }}
                >
                  {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'N/A'} -{' '}
                  {doc.status}
                </p>
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: theme.colors.primary,
                  textDecoration: 'none',
                }}
              >
                View Document
              </a>
            </div>
          ))}
        </Card>
      )}

      <Card title="Orders" style={{ marginBottom: theme.spacing.xl }}>
        <Table columns={orderColumns} data={dealer.orders} />
      </Card>



      {dealer.reviews && dealer.reviews.length > 0 && (
        <Card title="Reviews" style={{ marginTop: theme.spacing.xl }}>
          {dealer.reviews.map((review) => (
            <div
              key={review.id}
              style={{
                padding: theme.spacing.md,
                marginBottom: theme.spacing.md,
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius.md,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: theme.spacing.xs,
                }}
              >
                <strong>{review.userName}</strong>
                <span>⭐ {review.rating}</span>
              </div>
              <p style={{ margin: 0, color: theme.colors.textSecondary }}>
                {review.comment}
              </p>
              <p
                style={{
                  margin: 0,
                  marginTop: theme.spacing.xs,
                  fontSize: '0.875rem',
                  color: theme.colors.textSecondary,
                }}
              >
                {review.date ? new Date(review.date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          ))}
        </Card>
      )}

      <ConfirmModal
        isOpen={showApproveModal}
        onClose={() => !updating && setShowApproveModal(false)}
        onConfirm={handleApprove}
        title="Approve Dealer"
        message="Are you sure you want to approve this dealer?"
        confirmText={updating ? 'Approving...' : 'Approve'}
        disabled={updating}
      />

      <ConfirmModal
        isOpen={showSuspendModal}
        onClose={() => !updating && setShowSuspendModal(false)}
        onConfirm={handleSuspend}
        title="Suspend Dealer"
        message="Are you sure you want to suspend this dealer?"
        confirmText={updating ? 'Suspending...' : 'Suspend'}
        type="danger"
        disabled={updating}
      />



      {/* Update Order Status Modal */}
      <Modal
        isOpen={showOrderStatusModal}
        onClose={() => !updatingOrderStatus && setShowOrderStatusModal(false)}
        title="Update Order Status"
      >
        <div>
          <div style={{ marginBottom: theme.spacing.md }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              Order ID
            </label>
            <p style={{ margin: 0, fontSize: '0.875rem', color: theme.colors.textSecondary }}>
              {selectedOrder?.id || 'N/A'}
            </p>
          </div>

          <div style={{ marginBottom: theme.spacing.md }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              Current Status
            </label>
            <span
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: '9999px',
                backgroundColor: selectedOrder ? getOrderStatusColor(selectedOrder.status) : theme.colors.secondary,
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'inline-block',
              }}
            >
              {selectedOrder ? formatOrderStatus(selectedOrder.status) : 'N/A'}
            </span>
          </div>

          <div style={{ marginBottom: theme.spacing.md }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              New Status <span style={{ color: theme.colors.error }}>*</span>
            </label>
            <Select
              value={newOrderStatus}
              onChange={setNewOrderStatus}
              placeholder="Select new status"
              disabled={updatingOrderStatus}
              options={orderStatusOptions}
            />
          </div>

          <div style={{ marginBottom: theme.spacing.lg }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              Notes (Optional)
            </label>
            <textarea
              value={orderStatusNotes}
              onChange={(e) => setOrderStatusNotes(e.target.value)}
              placeholder="Add any notes about this status update"
              rows={4}
              disabled={updatingOrderStatus}
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                opacity: updatingOrderStatus ? 0.6 : 1,
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: theme.spacing.md,
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="outline"
              onClick={() => {
                setShowOrderStatusModal(false);
                setSelectedOrder(null);
                setNewOrderStatus('');
                setOrderStatusNotes('');
              }}
              disabled={updatingOrderStatus}
            >
              Cancel
            </Button>
            <Button
              onClick={handleOrderStatusUpdate}
              loading={updatingOrderStatus}
              disabled={!newOrderStatus || updatingOrderStatus}
            >
              Update Status
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={showCancelOrderModal}
        onClose={() => !cancellingOrder && setShowCancelOrderModal(false)}
        title="Cancel Order"
      >
        <div>
          <div style={{ marginBottom: theme.spacing.md }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              Order ID
            </label>
            <p style={{ margin: 0, fontSize: '0.875rem', color: theme.colors.textSecondary }}>
              {selectedOrder?.id || 'N/A'}
            </p>
          </div>

          <div style={{ marginBottom: theme.spacing.md }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              Current Status
            </label>
            <span
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: '9999px',
                backgroundColor: selectedOrder ? getOrderStatusColor(selectedOrder.status) : theme.colors.secondary,
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'inline-block',
              }}
            >
              {selectedOrder ? formatOrderStatus(selectedOrder.status) : 'N/A'}
            </span>
          </div>

          <div style={{ marginBottom: theme.spacing.lg }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              Cancellation Reason <span style={{ color: theme.colors.error }}>*</span>
            </label>
            <textarea
              value={cancelOrderReason}
              onChange={(e) => setCancelOrderReason(e.target.value)}
              placeholder="Please provide a reason for cancelling this order"
              rows={4}
              disabled={cancellingOrder}
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                opacity: cancellingOrder ? 0.6 : 1,
              }}
            />
            <p style={{ margin: 0, marginTop: theme.spacing.xs, fontSize: '0.75rem', color: theme.colors.textSecondary }}>
              This reason will be recorded and visible to the customer.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: theme.spacing.md,
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelOrderModal(false);
                setSelectedOrder(null);
                setCancelOrderReason('');
              }}
              disabled={cancellingOrder}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelOrderConfirm}
              loading={cancellingOrder}
              disabled={!cancelOrderReason.trim() || cancellingOrder}
            >
              Cancel Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

