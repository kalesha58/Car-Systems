import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { Input } from '@components/Input/Input';
import { Modal } from '@components/Modal/Modal';
import { SkeletonCard } from '@components/Skeleton';
import { Table } from '@components/Table/Table';
import { addTrackingInfo, cancelOrder, getOrderById, updateOrderStatus } from '@services/orderService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import {
  CheckCircle,
  Clock,
  CreditCard,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
  User,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { IOrderDetails, OrderUpdateStatus } from '../../types/order';

export const OrderDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [order, setOrder] = useState<IOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingData, setTrackingData] = useState({
    trackingNumber: '',
    carrier: '',
    status: '',
    estimatedDelivery: '',
  });

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

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const orderData = await getOrderById(id);
        
        // Map API response to IOrderDetails format
        const apiOrder = orderData as unknown as {
          id: string;
          orderNumber?: string;
          user?: { id: string; name: string; email?: string; phone?: string };
          dealer?: { id: string; name?: string; businessName?: string; email?: string; phone?: string } | null;
          totalAmount?: number;
          amount?: number;
          status: string;
          createdAt?: string;
          date?: string;
          items?: Array<{
            productId: string;
            name?: string;
            productName?: string;
            quantity: number;
            price: number;
            total?: number;
          }>;
          paymentMethod?: string;
          paymentStatus?: string;
          subtotal?: number;
          tax?: number;
          shipping?: number;
          paymentDate?: string;
          shippingAddress?: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country?: string;
          };
          billingAddress?: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country?: string;
          };
          timeline?: Array<{
            status: string;
            timestamp: string;
            notes?: string;
            actor?: string;
            actorId?: string;
            previousStatus?: string;
          }>;
          tracking?: Array<{
            status: string;
            date: string;
            description: string;
            trackingNumber?: string;
            carrier?: string;
            estimatedDelivery?: string;
          }>;
        };
        
        // Map timeline to tracking format for display
        const trackingFromTimeline = (apiOrder.timeline || []).map((timelineItem) => ({
          status: timelineItem.status,
          date: timelineItem.timestamp,
          description: timelineItem.notes || timelineItem.status.replace(/_/g, ' '),
          actor: timelineItem.actor,
          actorId: timelineItem.actorId,
          previousStatus: timelineItem.previousStatus,
        }));
        
        const mappedOrder: IOrderDetails = {
          id: apiOrder.id,
          orderNumber: apiOrder.orderNumber,
          userId: apiOrder.user?.id || '',
          userName: apiOrder.user?.name || '',
          userEmail: apiOrder.user?.email || '',
          userPhone: apiOrder.user?.phone || '',
          dealerId: apiOrder.dealer?.id || '',
          dealerName: apiOrder.dealer?.name || apiOrder.dealer?.businessName || '',
          dealerEmail: apiOrder.dealer?.email || '',
          dealerPhone: apiOrder.dealer?.phone || '',
          amount: apiOrder.totalAmount || apiOrder.amount || 0,
          status: apiOrder.status || OrderUpdateStatus.ORDER_PLACED,
          date: apiOrder.createdAt || apiOrder.date || new Date().toISOString(),
          items: (apiOrder.items || []).map((item, index) => ({
            id: item.productId || `item-${index}`,
            productId: item.productId,
            productName: item.name || item.productName || '',
            quantity: item.quantity,
            price: item.price,
            subtotal: item.total || item.price * item.quantity,
          })),
          paymentMethod: apiOrder.paymentMethod || '',
          paymentStatus: apiOrder.paymentStatus || '',
          subtotal: apiOrder.subtotal || 0,
          tax: apiOrder.tax || 0,
          shipping: apiOrder.shipping || 0,
          total: apiOrder.totalAmount || apiOrder.amount || 0,
          paymentDate: apiOrder.paymentDate,
          shippingAddress: apiOrder.shippingAddress || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
          },
          billingAddress: apiOrder.billingAddress || undefined,
          tracking: trackingFromTimeline.length > 0 ? trackingFromTimeline : (apiOrder.tracking || []).map((track) => ({
            status: track.status,
            date: track.date,
            description: track.description,
          })),
        };
        
        setOrder(mappedOrder);
      } catch (error) {
        if ((error as { name?: string })?.name !== 'AbortError') {
          console.error('Error fetching order details:', error);
          showToast('Failed to load order details', 'error');
        }
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
      }
    };

    fetchOrderDetails();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, showToast]);

  const handleStatusUpdate = async () => {
    if (!order || !newStatus || !id) return;

    try {
      setUpdating(true);
      await updateOrderStatus(id, {
        status: newStatus,
        notes: statusNotes.trim() || `Status updated to ${newStatus}`,
      });
      
      // Refresh order details to get updated information
      const orderData = await getOrderById(id);
      const apiOrder = orderData as unknown as {
        id: string;
        orderNumber?: string;
        user?: { id: string; name: string; email?: string; phone?: string };
        dealer?: { id: string; name?: string; businessName?: string; email?: string; phone?: string } | null;
        totalAmount?: number;
        amount?: number;
        status: string;
        createdAt?: string;
        date?: string;
        items?: Array<{
          productId: string;
          name?: string;
          productName?: string;
          quantity: number;
          price: number;
          total?: number;
        }>;
        paymentMethod?: string;
        paymentStatus?: string;
        subtotal?: number;
        tax?: number;
        shipping?: number;
        paymentDate?: string;
        shippingAddress?: {
          street: string;
          city: string;
          state: string;
          zipCode: string;
          country?: string;
        };
        billingAddress?: {
          street: string;
          city: string;
          state: string;
          zipCode: string;
          country?: string;
        };
        timeline?: Array<{
          status: string;
          timestamp: string;
          notes?: string;
          actor?: string;
          actorId?: string;
          previousStatus?: string;
        }>;
        tracking?: Array<{
          status: string;
          date: string;
          description: string;
        }>;
      };
      
      const trackingFromTimeline = (apiOrder.timeline || []).map((timelineItem) => ({
        status: timelineItem.status,
        date: timelineItem.timestamp,
        description: timelineItem.notes || timelineItem.status.replace(/_/g, ' '),
        actor: timelineItem.actor,
        actorId: timelineItem.actorId,
        previousStatus: timelineItem.previousStatus,
      }));
      
      const mappedOrder: IOrderDetails = {
        id: apiOrder.id,
        orderNumber: apiOrder.orderNumber,
        userId: apiOrder.user?.id || '',
        userName: apiOrder.user?.name || '',
        userEmail: apiOrder.user?.email || '',
        userPhone: apiOrder.user?.phone || '',
        dealerId: apiOrder.dealer?.id || '',
        dealerName: apiOrder.dealer?.name || apiOrder.dealer?.businessName || '',
        dealerEmail: apiOrder.dealer?.email || '',
        dealerPhone: apiOrder.dealer?.phone || '',
        amount: apiOrder.totalAmount || apiOrder.amount || 0,
        status: apiOrder.status || OrderUpdateStatus.ORDER_PLACED,
        date: apiOrder.createdAt || apiOrder.date || new Date().toISOString(),
        items: (apiOrder.items || []).map((item, index) => ({
          id: item.productId || `item-${index}`,
          productId: item.productId,
          productName: item.name || item.productName || '',
          quantity: item.quantity,
          price: item.price,
          subtotal: item.total || item.price * item.quantity,
        })),
        paymentMethod: apiOrder.paymentMethod || '',
        paymentStatus: apiOrder.paymentStatus || '',
        subtotal: apiOrder.subtotal || 0,
        tax: apiOrder.tax || 0,
        shipping: apiOrder.shipping || 0,
        total: apiOrder.totalAmount || apiOrder.amount || 0,
        paymentDate: apiOrder.paymentDate,
        shippingAddress: apiOrder.shippingAddress || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        billingAddress: apiOrder.billingAddress || undefined,
        tracking: trackingFromTimeline.length > 0 ? trackingFromTimeline : (apiOrder.tracking || []).map((track) => ({
          status: track.status,
          date: track.date,
          description: track.description,
        })),
      };
      setOrder(mappedOrder);
      
      showToast('Order status updated successfully', 'success');
      setShowStatusModal(false);
      setNewStatus('');
      setStatusNotes('');
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Failed to update order status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !id || !cancelReason.trim()) {
      showToast('Please provide a cancellation reason', 'error');
      return;
    }

    try {
      setUpdating(true);
      const updatedOrder = await cancelOrder(id, { reason: cancelReason });
      setOrder({ ...order, status: updatedOrder.status });
      showToast('Order cancelled successfully', 'success');
      setShowCancelModal(false);
      setCancelReason('');
    } catch (error) {
      console.error('Error cancelling order:', error);
      showToast('Failed to cancel order', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddTracking = async () => {
    if (!order || !id || !trackingData.trackingNumber.trim() || !trackingData.carrier.trim()) {
      showToast('Please fill in all required tracking fields', 'error');
      return;
    }

    try {
      setUpdating(true);
      await addTrackingInfo(id, {
        trackingNumber: trackingData.trackingNumber,
        carrier: trackingData.carrier,
        status: trackingData.status || 'In Transit',
        estimatedDelivery: trackingData.estimatedDelivery || new Date().toISOString(),
      });
      showToast('Tracking information added successfully', 'success');
      setShowTrackingModal(false);
      setTrackingData({
        trackingNumber: '',
        carrier: '',
        status: '',
        estimatedDelivery: '',
      });
      // Refresh order details - reuse the same fetch logic
      const orderData = await getOrderById(id);
      const apiOrder = orderData as unknown as {
        id: string;
        orderNumber?: string;
        user?: { id: string; name: string; email?: string; phone?: string };
        dealer?: { id: string; name?: string; businessName?: string; email?: string; phone?: string } | null;
        totalAmount?: number;
        amount?: number;
        status: string;
        createdAt?: string;
        date?: string;
        items?: Array<{
          productId: string;
          name?: string;
          productName?: string;
          quantity: number;
          price: number;
          total?: number;
        }>;
        paymentMethod?: string;
        paymentStatus?: string;
        subtotal?: number;
        tax?: number;
        shipping?: number;
        paymentDate?: string;
        shippingAddress?: {
          street: string;
          city: string;
          state: string;
          zipCode: string;
          country?: string;
        };
        billingAddress?: {
          street: string;
          city: string;
          state: string;
          zipCode: string;
          country?: string;
        };
        timeline?: Array<{
          status: string;
          timestamp: string;
          notes?: string;
          actor?: string;
          actorId?: string;
          previousStatus?: string;
        }>;
        tracking?: Array<{
          status: string;
          date: string;
          description: string;
        }>;
      };
      
      const trackingFromTimeline = (apiOrder.timeline || []).map((timelineItem) => ({
        status: timelineItem.status,
        date: timelineItem.timestamp,
        description: timelineItem.notes || timelineItem.status.replace(/_/g, ' '),
        actor: timelineItem.actor,
        actorId: timelineItem.actorId,
        previousStatus: timelineItem.previousStatus,
      }));
      
      const mappedOrder: IOrderDetails = {
        id: apiOrder.id,
        orderNumber: apiOrder.orderNumber,
        userId: apiOrder.user?.id || '',
        userName: apiOrder.user?.name || '',
        userEmail: apiOrder.user?.email || '',
        userPhone: apiOrder.user?.phone || '',
        dealerId: apiOrder.dealer?.id || '',
        dealerName: apiOrder.dealer?.name || apiOrder.dealer?.businessName || '',
        dealerEmail: apiOrder.dealer?.email || '',
        dealerPhone: apiOrder.dealer?.phone || '',
        amount: apiOrder.totalAmount || apiOrder.amount || 0,
        status: apiOrder.status || OrderUpdateStatus.ORDER_PLACED,
        date: apiOrder.createdAt || apiOrder.date || new Date().toISOString(),
        items: (apiOrder.items || []).map((item, index) => ({
          id: item.productId || `item-${index}`,
          productId: item.productId,
          productName: item.name || item.productName || '',
          quantity: item.quantity,
          price: item.price,
          subtotal: item.total || item.price * item.quantity,
        })),
        paymentMethod: apiOrder.paymentMethod || '',
        paymentStatus: apiOrder.paymentStatus || '',
        subtotal: apiOrder.subtotal || 0,
        tax: apiOrder.tax || 0,
        shipping: apiOrder.shipping || 0,
        total: apiOrder.totalAmount || apiOrder.amount || 0,
        paymentDate: apiOrder.paymentDate,
        shippingAddress: apiOrder.shippingAddress || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        billingAddress: apiOrder.billingAddress || undefined,
        tracking: trackingFromTimeline.length > 0 ? trackingFromTimeline : (apiOrder.tracking || []).map((track) => ({
          status: track.status,
          date: track.date,
          description: track.description,
        })),
      };
      setOrder(mappedOrder);
    } catch (error) {
      console.error('Error adding tracking:', error);
      showToast('Failed to add tracking information', 'error');
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

  if (!order) {
    return (
      <div>
        <Breadcrumbs />
        <Card>
          <p style={{ color: theme.colors.error }}>Order not found</p>
          <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    switch (normalizedStatus) {
      // Success states (green)
      case OrderUpdateStatus.DELIVERED:
      case OrderUpdateStatus.REFUND_COMPLETED:
        return theme.colors.success;
      
      // Info states (blue)
      case OrderUpdateStatus.PAYMENT_CONFIRMED:
      case OrderUpdateStatus.ORDER_CONFIRMED:
      case OrderUpdateStatus.PACKED:
      case OrderUpdateStatus.SHIPPED:
      case OrderUpdateStatus.OUT_FOR_DELIVERY:
        return theme.colors.info;
      
      // Warning states (yellow/orange)
      case OrderUpdateStatus.ORDER_PLACED:
      case OrderUpdateStatus.RETURN_REQUESTED:
      case OrderUpdateStatus.RETURN_PICKED:
      case OrderUpdateStatus.REFUND_INITIATED:
        return theme.colors.warning;
      
      // Error states (red)
      case OrderUpdateStatus.CANCELLED_BY_USER:
      case OrderUpdateStatus.CANCELLED_BY_DEALER:
        return theme.colors.error;
      
      default:
        return theme.colors.secondary;
    }
  };

  const formatStatus = (status: string) => {
    return status
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const isOrderFinal = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    return (
      normalizedStatus === OrderUpdateStatus.DELIVERED ||
      normalizedStatus === OrderUpdateStatus.CANCELLED_BY_USER ||
      normalizedStatus === OrderUpdateStatus.CANCELLED_BY_DEALER ||
      normalizedStatus === OrderUpdateStatus.REFUND_COMPLETED
    );
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    switch (normalizedStatus) {
      case OrderUpdateStatus.DELIVERED:
      case OrderUpdateStatus.REFUND_COMPLETED:
        return CheckCircle;
      
      case OrderUpdateStatus.CANCELLED_BY_USER:
      case OrderUpdateStatus.CANCELLED_BY_DEALER:
        return XCircle;
      
      case OrderUpdateStatus.PAYMENT_CONFIRMED:
      case OrderUpdateStatus.ORDER_CONFIRMED:
      case OrderUpdateStatus.PACKED:
      case OrderUpdateStatus.SHIPPED:
      case OrderUpdateStatus.OUT_FOR_DELIVERY:
        return Package;
      
      case OrderUpdateStatus.RETURN_REQUESTED:
      case OrderUpdateStatus.RETURN_PICKED:
      case OrderUpdateStatus.REFUND_INITIATED:
        return Truck;
      
      default:
        return Clock;
    }
  };

  const itemColumns = [
    { key: 'productName', header: 'Product' },
    {
      key: 'quantity',
      header: 'Quantity',
    },
    {
      key: 'price',
      header: 'Price',
      render: (item: { id: string; productId: string; productName: string; quantity: number; price: number; subtotal?: number }) => `₹${item.price.toFixed(2)}`,
    },
    {
      key: 'subtotal',
      header: 'Subtotal',
      render: (item: { id: string; productId: string; productName: string; quantity: number; price: number; subtotal?: number }) => `₹${(item.subtotal || item.price * item.quantity).toFixed(2)}`,
    },
  ];

  const statusOptions = [
    OrderUpdateStatus.ORDER_PLACED,
    OrderUpdateStatus.PAYMENT_CONFIRMED,
    OrderUpdateStatus.ORDER_CONFIRMED,
    OrderUpdateStatus.PACKED,
    OrderUpdateStatus.SHIPPED,
    OrderUpdateStatus.OUT_FOR_DELIVERY,
    OrderUpdateStatus.DELIVERED,
    OrderUpdateStatus.CANCELLED_BY_USER,
    OrderUpdateStatus.CANCELLED_BY_DEALER,
    OrderUpdateStatus.RETURN_REQUESTED,
    OrderUpdateStatus.RETURN_PICKED,
    OrderUpdateStatus.REFUND_INITIATED,
    OrderUpdateStatus.REFUND_COMPLETED,
  ];

  return (
    <div style={{ paddingBottom: theme.spacing.md }}>
      <style>{`
        @media (max-width: 1024px) {
          .order-details-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <Breadcrumbs />
      
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: theme.spacing.md,
          flexWrap: 'wrap',
          gap: theme.spacing.md,
          padding: theme.spacing.md,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadows.sm,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div style={{ flex: 1, minWidth: '250px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.sm,
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: theme.borderRadius.md,
                backgroundColor: `${theme.colors.primary}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.colors.primary,
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: theme.colors.text,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Order {order.orderNumber || `#${order.id.slice(-8)}`}
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  color: theme.colors.textSecondary,
                  marginTop: '4px',
                }}
              >
                Placed on {new Date(order.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div style={{ marginTop: theme.spacing.md }}>
            <span
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                borderRadius: '9999px',
                backgroundColor: `${getStatusColor(order.status)}20`,
                color: getStatusColor(order.status),
                fontSize: '0.8125rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(order.status),
                }}
              />
                  {formatStatus(order.status)}
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: theme.spacing.sm,
            flexWrap: 'wrap',
          }}
        >
          {!isOrderFinal(order.status) && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowStatusModal(true)}>
                Update Status
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowTrackingModal(true)}>
                Add Tracking
              </Button>
              <Button variant="danger" size="sm" onClick={() => setShowCancelModal(true)}>
                Cancel Order
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content - Reorganized Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
        {/* Customer, Payment, Dealer Info - Single Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: theme.spacing.md,
          }}
          className="order-details-main-grid"
        >

          {/* Customer Information Card */}
          <div
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              boxShadow: theme.shadows.md,
              border: `1px solid ${theme.colors.border}`,
              background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 100%)`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: `${theme.colors.primary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.colors.primary,
                }}
              >
                <User size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: theme.colors.text }}>
                  Customer
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>
                  Customer Information
                </p>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.md,
                padding: theme.spacing.md,
                backgroundColor: `${theme.colors.textSecondary}08`,
                borderRadius: theme.borderRadius.md,
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                  Name
                </p>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: theme.colors.text, fontWeight: 600 }}>
                  {order.userName || 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                  Email
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: theme.colors.text, wordBreak: 'break-word' }}>
                  {order.userEmail || 'N/A'}
                </p>
              </div>
              {order.userPhone && (
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                    Phone
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: theme.colors.text }}>
                    {order.userPhone}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information Card */}
          <div
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              boxShadow: theme.shadows.md,
              border: `1px solid ${theme.colors.border}`,
              background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 100%)`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: `${theme.colors.success}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.colors.success,
                }}
              >
                <CreditCard size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: theme.colors.text }}>
                  Payment
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>
                  Payment Details
                </p>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.md,
                padding: theme.spacing.md,
                backgroundColor: `${theme.colors.textSecondary}08`,
                borderRadius: theme.borderRadius.md,
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                  Payment Method
                </p>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: theme.colors.text, fontWeight: 600, textTransform: 'uppercase' }}>
                  {order.paymentMethod || 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                  Payment Status
                </p>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                    borderRadius: '9999px',
                    backgroundColor:
                      order.paymentStatus === 'paid'
                        ? `${theme.colors.success}20`
                        : `${theme.colors.warning}20`,
                    color:
                      order.paymentStatus === 'paid'
                        ? theme.colors.success
                        : theme.colors.warning,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor:
                        order.paymentStatus === 'paid'
                          ? theme.colors.success
                          : theme.colors.warning,
                    }}
                  />
                  {order.paymentStatus || 'N/A'}
                </span>
              </div>
              {order.paymentDate && (
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                    Payment Date
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: theme.colors.text }}>
                    {new Date(order.paymentDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Dealer Information Card */}
          <div
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              boxShadow: theme.shadows.md,
              border: `1px solid ${theme.colors.border}`,
              background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 100%)`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: `${theme.colors.secondary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.colors.secondary,
                }}
              >
                <UserCheck size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: theme.colors.text }}>
                  Dealer
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>
                  Dealer Information
                </p>
              </div>
            </div>
            {order.dealerName ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme.spacing.md,
                  padding: theme.spacing.md,
                  backgroundColor: `${theme.colors.textSecondary}08`,
                  borderRadius: theme.borderRadius.md,
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                    Name
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9375rem', color: theme.colors.text, fontWeight: 600 }}>
                    {order.dealerName}
                  </p>
                </div>
                {order.dealerEmail && (
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                      Email
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: theme.colors.text, wordBreak: 'break-word' }}>
                      {order.dealerEmail}
                    </p>
                  </div>
                )}
                {order.dealerPhone && (
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                      Phone
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: theme.colors.text }}>
                      {order.dealerPhone}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: theme.spacing.lg,
                  textAlign: 'center',
                  backgroundColor: `${theme.colors.textSecondary}08`,
                  borderRadius: theme.borderRadius.md,
                }}
              >
                <XCircle size={32} style={{ margin: '0 auto', marginBottom: theme.spacing.sm, opacity: 0.5, color: theme.colors.textSecondary }} />
                <p style={{ margin: 0, fontSize: '0.875rem', color: theme.colors.textSecondary, fontWeight: 500 }}>
                  No dealer assigned
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Items - Full Width Row */}
        <Card
            style={{
              boxShadow: theme.shadows.lg,
              border: `1px solid ${theme.colors.border}`,
              background: theme.colors.surface,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.md,
                paddingBottom: theme.spacing.md,
                borderBottom: `2px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: `${theme.colors.primary}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.colors.primary,
                  }}
                >
                  <Package size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: theme.colors.text }}>
                    Order Items
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: theme.colors.textSecondary, marginTop: '2px' }}>
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'} in this order
                  </p>
                </div>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <Table
                columns={itemColumns}
                data={order.items.map((item, index) => ({ ...item, id: item.productId || `item-${index}` }))}
              />
            </div>
            {/* Order Summary Footer */}
            <div
              style={{
                marginTop: theme.spacing.lg,
                paddingTop: theme.spacing.md,
                borderTop: `2px solid ${theme.colors.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.sm,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: theme.colors.textSecondary }}>Subtotal</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: theme.colors.text }}>
                  ₹{order.subtotal.toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: theme.colors.textSecondary }}>Shipping</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: theme.colors.text }}>
                  ₹{order.shipping.toFixed(2)}
                </span>
              </div>
              {order.tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: theme.colors.textSecondary }}>Tax</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: theme.colors.text }}>
                    ₹{order.tax.toFixed(2)}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: theme.spacing.sm,
                  marginTop: theme.spacing.xs,
                  borderTop: `1px solid ${theme.colors.border}`,
                }}
              >
                <span style={{ fontSize: '1rem', fontWeight: 700, color: theme.colors.text }}>Total</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: theme.colors.primary }}>
                  ₹{order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
      </div>

      {/* Shipping & Billing Address Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: order.billingAddress ? 'repeat(2, 1fr)' : '1fr',
          gap: theme.spacing.md,
          marginBottom: theme.spacing.md,
        }}
      >
        {/* Shipping Address Card */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            boxShadow: theme.shadows.md,
            border: `1px solid ${theme.colors.border}`,
            background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 100%)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: theme.borderRadius.md,
                backgroundColor: `${theme.colors.primary}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.colors.primary,
              }}
            >
              <MapPin size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: theme.colors.text }}>
                Shipping Address
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>
                Delivery Location
              </p>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.sm,
              padding: theme.spacing.md,
              backgroundColor: `${theme.colors.textSecondary}08`,
              borderRadius: theme.borderRadius.md,
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                Street Address
              </p>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: theme.colors.text, fontWeight: 600 }}>
                {order.shippingAddress.street || 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                City, State, ZIP
              </p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: theme.colors.text }}>
                {order.shippingAddress.city && order.shippingAddress.state
                  ? `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode || ''}`
                  : 'N/A'}
              </p>
            </div>
            {order.shippingAddress.country && (
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                  Country
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: theme.colors.text }}>
                  {order.shippingAddress.country}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Billing Address Card */}
        {order.billingAddress && (
          <div
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              boxShadow: theme.shadows.md,
              border: `1px solid ${theme.colors.border}`,
              background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.surface} 100%)`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: `${theme.colors.info}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.colors.info,
                }}
              >
                <CreditCard size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: theme.colors.text }}>
                  Billing Address
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary }}>
                  Invoice Location
                </p>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.sm,
                padding: theme.spacing.md,
                backgroundColor: `${theme.colors.textSecondary}08`,
                borderRadius: theme.borderRadius.md,
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                  Street Address
                </p>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: theme.colors.text, fontWeight: 600 }}>
                  {order.billingAddress.street || 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                  City, State, ZIP
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: theme.colors.text }}>
                  {order.billingAddress.city && order.billingAddress.state
                    ? `${order.billingAddress.city}, ${order.billingAddress.state} ${order.billingAddress.zipCode || ''}`
                    : 'N/A'}
                </p>
              </div>
              {order.billingAddress.country && (
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                    Country
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: theme.colors.text }}>
                    {order.billingAddress.country}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Tracking Section - Full Width */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <Truck size={18} style={{ color: theme.colors.primary }} />
            <span style={{ fontSize: '0.9375rem' }}>Order Timeline</span>
          </div>
        }
        style={{
          marginBottom: theme.spacing.md,
          boxShadow: theme.shadows.md,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div>
          {/* Modern Timeline - Show All Statuses */}
          <div style={{ position: 'relative', paddingLeft: theme.spacing.lg }}>
            {(() => {
              // Always show all normal order flow statuses
              const allStatuses = [
                OrderUpdateStatus.ORDER_PLACED,
                OrderUpdateStatus.PAYMENT_CONFIRMED,
                OrderUpdateStatus.ORDER_CONFIRMED,
                OrderUpdateStatus.PACKED,
                OrderUpdateStatus.SHIPPED,
                OrderUpdateStatus.OUT_FOR_DELIVERY,
                OrderUpdateStatus.DELIVERED,
              ];

              // Define return flow statuses (shown after DELIVERED if applicable)
              const returnFlowStatuses = [
                OrderUpdateStatus.RETURN_REQUESTED,
                OrderUpdateStatus.RETURN_PICKED,
                OrderUpdateStatus.REFUND_INITIATED,
                OrderUpdateStatus.REFUND_COMPLETED,
              ];

              // Get current status from API
              const currentStatus = order.status.toUpperCase();

              // Determine which statuses to show
              let statusesToShow: string[] = [...allStatuses];

              // Add cancellation statuses if order is cancelled
              if (
                currentStatus === OrderUpdateStatus.CANCELLED_BY_USER ||
                currentStatus === OrderUpdateStatus.CANCELLED_BY_DEALER
              ) {
                statusesToShow.push(currentStatus);
              }

              // Add return flow statuses if order is in return/refund flow
              if (returnFlowStatuses.includes(currentStatus as OrderUpdateStatus)) {
                statusesToShow = [...statusesToShow, ...returnFlowStatuses];
              }

              // Create a map of status to tracking data from API
              const trackingMap = new Map<string, { date: string; description: string; actor?: string }>();
              if (order.tracking && order.tracking.length > 0) {
                order.tracking.forEach((track) => {
                  trackingMap.set(track.status.toUpperCase(), {
                    date: track.date,
                    description: track.description,
                    actor: track.actor,
                  });
                });
              }

              // Find the index of current status in the statuses array
              const currentStatusIndex = statusesToShow.findIndex((s) => s.toUpperCase() === currentStatus);

              return statusesToShow.map((status, index) => {
                const isLast = index === statusesToShow.length - 1;
                // Mark as completed if this status is at or before the current status index
                const isCompleted = currentStatusIndex >= 0 && index <= currentStatusIndex;
                const statusColor = getStatusColor(status);
                const trackingInfo = trackingMap.get(status.toUpperCase());
                const statusDate = trackingInfo ? new Date(trackingInfo.date) : null;

                return (
                  <div
                    key={status}
                    style={{
                      position: 'relative',
                      paddingBottom: isLast ? 0 : theme.spacing.md,
                    }}
                  >
                    {/* Timeline Line */}
                    {!isLast && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '-20px',
                          top: '28px',
                          bottom: '-12px',
                          width: '2px',
                          background: isCompleted
                            ? `linear-gradient(to bottom, ${statusColor}, ${theme.colors.border}40)`
                            : theme.colors.border,
                          opacity: isCompleted ? 1 : 0.4,
                        }}
                      />
                    )}

                    {/* Timeline Dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-28px',
                        top: '4px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: isCompleted ? statusColor : theme.colors.surface,
                        border: `3px solid ${isCompleted ? statusColor : theme.colors.border}`,
                        boxShadow: isCompleted
                          ? `0 0 0 4px ${statusColor}20, 0 2px 4px ${statusColor}40`
                          : 'none',
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isCompleted && (
                        <CheckCircle
                          size={12}
                          style={{
                            color: theme.colors.surface,
                            strokeWidth: 3,
                          }}
                        />
                      )}
                    </div>

                    {/* Timeline Content */}
                    <div
                      style={{
                        padding: theme.spacing.sm,
                        backgroundColor: isCompleted ? `${statusColor}08` : 'transparent',
                        borderRadius: theme.borderRadius.md,
                        border: isCompleted
                          ? `1px solid ${statusColor}30`
                          : `1px solid ${theme.colors.border}40`,
                        transition: 'all 0.2s ease',
                        marginLeft: theme.spacing.xs,
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          gap: theme.spacing.sm,
                          alignItems: 'flex-start',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: theme.spacing.sm,
                              marginBottom: theme.spacing.xs,
                            }}
                          >
                            <span
                              style={{
                                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                                borderRadius: '9999px',
                                backgroundColor: isCompleted ? `${statusColor}20` : `${theme.colors.textSecondary}15`,
                                color: isCompleted ? statusColor : theme.colors.textSecondary,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              {formatStatus(status)}
                            </span>
                          </div>

                          {trackingInfo?.description && (
                            <p
                              style={{
                                margin: 0,
                                color: theme.colors.text,
                                fontSize: '0.875rem',
                                lineHeight: 1.6,
                                fontWeight: 500,
                                marginBottom: trackingInfo.actor ? theme.spacing.xs : 0,
                              }}
                            >
                              {trackingInfo.description}
                            </p>
                          )}

                          {!trackingInfo && isCompleted && (
                            <p
                              style={{
                                margin: 0,
                                color: theme.colors.textSecondary,
                                fontSize: '0.8125rem',
                                fontStyle: 'italic',
                              }}
                            >
                              Status reached
                            </p>
                          )}

                          {!trackingInfo && !isCompleted && (
                            <p
                              style={{
                                margin: 0,
                                color: theme.colors.textSecondary,
                                fontSize: '0.8125rem',
                                fontStyle: 'italic',
                              }}
                            >
                              Pending
                            </p>
                          )}

                          {trackingInfo?.actor && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: theme.spacing.xs,
                                marginTop: theme.spacing.xs,
                              }}
                            >
                              <div
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor:
                                    trackingInfo.actor === 'system'
                                      ? theme.colors.info
                                      : trackingInfo.actor === 'user'
                                      ? theme.colors.primary
                                      : trackingInfo.actor === 'dealer'
                                      ? theme.colors.secondary
                                      : theme.colors.textSecondary,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: theme.colors.textSecondary,
                                  fontStyle: 'normal',
                                }}
                              >
                                {trackingInfo.actor === 'system'
                                  ? 'System'
                                  : trackingInfo.actor === 'user'
                                  ? 'Customer'
                                  : trackingInfo.actor === 'dealer'
                                  ? 'Dealer'
                                  : trackingInfo.actor}
                              </span>
                            </div>
                          )}
                        </div>

                        {statusDate && (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              gap: theme.spacing.xs,
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.8125rem',
                                color: theme.colors.text,
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {statusDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: theme.colors.textSecondary,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {statusDate.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </Card>

      {/* Update Order Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          if (!updating) {
            setShowStatusModal(false);
            setNewStatus('');
            setStatusNotes('');
          }
        }}
        title="Update Order Status"
      >
        <div style={{ padding: theme.spacing.md }}>
          {/* Order Info */}
          {order && (
            <div
              style={{
                padding: theme.spacing.md,
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius.md,
                marginBottom: theme.spacing.md,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                <Package size={16} style={{ color: theme.colors.textSecondary }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Order Information
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: theme.colors.text }}>
                {order.orderNumber || `Order #${order.id.slice(-8)}`}
              </p>
            </div>
          )}

          {/* Current Status */}
          {order && (
            <div
              style={{
                padding: theme.spacing.md,
                backgroundColor: `${getStatusColor(order.status)}10`,
                borderRadius: theme.borderRadius.md,
                marginBottom: theme.spacing.md,
                border: `1px solid ${getStatusColor(order.status)}30`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                <Clock size={16} style={{ color: getStatusColor(order.status) }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Current Status
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <span
                  style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: '9999px',
                    backgroundColor: `${getStatusColor(order.status)}20`,
                    color: getStatusColor(order.status),
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {formatStatus(order.status)}
                </span>
              </div>
            </div>
          )}

          {/* Status Selection */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <p style={{ marginBottom: theme.spacing.md, color: theme.colors.text, fontSize: '0.9375rem', fontWeight: 500 }}>
              Select new status for this order:
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: theme.spacing.sm,
              }}
            >
              {statusOptions.map((status) => {
                const StatusIcon = getStatusIcon(status);
                const statusColor = getStatusColor(status);
                const isSelected = newStatus === status;
                const isCurrentStatus = order?.status === status;

                return (
                  <div
                    key={status}
                    onClick={() => !updating && !isCurrentStatus && setNewStatus(status)}
                    style={{
                      padding: theme.spacing.md,
                      borderRadius: theme.borderRadius.md,
                      border: `2px solid ${isSelected ? statusColor : isCurrentStatus ? `${statusColor}40` : theme.colors.border}`,
                      backgroundColor: isSelected ? `${statusColor}10` : isCurrentStatus ? `${statusColor}05` : theme.colors.surface,
                      cursor: isCurrentStatus ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isCurrentStatus ? 0.6 : 1,
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentStatus && !updating) {
                        e.currentTarget.style.borderColor = statusColor;
                        e.currentTarget.style.backgroundColor = `${statusColor}08`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentStatus && !updating) {
                        e.currentTarget.style.borderColor = isSelected ? statusColor : theme.colors.border;
                        e.currentTarget.style.backgroundColor = isSelected ? `${statusColor}10` : theme.colors.surface;
                      }
                    }}
                  >
                    {isCurrentStatus && (
                      <div
                        style={{
                          position: 'absolute',
                          top: theme.spacing.xs,
                          right: theme.spacing.xs,
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          backgroundColor: statusColor,
                          color: '#ffffff',
                          fontSize: '0.625rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        Current
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: theme.spacing.xs,
                      }}
                    >
                      <StatusIcon
                        size={24}
                        style={{
                          color: isSelected ? statusColor : isCurrentStatus ? `${statusColor}80` : theme.colors.textSecondary,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? statusColor : theme.colors.text,
                          textAlign: 'center',
                          textTransform: 'capitalize',
                        }}
                      >
                        {formatStatus(status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes Field */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                fontSize: '0.875rem',
                fontWeight: 500,
                color: theme.colors.text,
              }}
            >
              Notes (Optional)
            </label>
            <textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Add any notes about this status update..."
              rows={3}
              disabled={updating}
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                fontSize: '0.9375rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                opacity: updating ? 0.6 : 1,
                cursor: updating ? 'not-allowed' : 'text',
              }}
            />
          </div>

          {/* Action Buttons */}
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
                setShowStatusModal(false);
                setNewStatus('');
                setStatusNotes('');
              }}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} loading={updating} disabled={!newStatus || newStatus === order?.status}>
              Update Status
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => !updating && setShowCancelModal(false)}
        title="Cancel Order"
      >
        <div>
          <p style={{ marginBottom: theme.spacing.md, color: theme.colors.text }}>
            Please provide a reason for cancelling this order:
          </p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Enter cancellation reason"
            rows={4}
            disabled={updating}
            style={{
              width: '100%',
              padding: theme.spacing.sm,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              opacity: updating ? 0.6 : 1,
            }}
          />
          <div
            style={{
              display: 'flex',
              gap: theme.spacing.md,
              justifyContent: 'flex-end',
              marginTop: theme.spacing.md,
            }}
          >
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelModal(false);
                setCancelReason('');
              }}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleCancelOrder} loading={updating}>
              Cancel Order
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Tracking Modal */}
      <Modal
        isOpen={showTrackingModal}
        onClose={() => !updating && setShowTrackingModal(false)}
        title="Add Tracking Information"
      >
        <div>
          <Input
            label="Tracking Number"
            value={trackingData.trackingNumber}
            onChange={(value) => setTrackingData({ ...trackingData, trackingNumber: value })}
            placeholder="Enter tracking number"
            required
            disabled={updating}
          />

          <Input
            label="Carrier"
            value={trackingData.carrier}
            onChange={(value) => setTrackingData({ ...trackingData, carrier: value })}
            placeholder="e.g., FedEx, UPS, DHL"
            required
            disabled={updating}
          />

          <Input
            label="Status"
            value={trackingData.status}
            onChange={(value) => setTrackingData({ ...trackingData, status: value })}
            placeholder="e.g., In Transit, Out for Delivery"
            disabled={updating}
          />

          <Input
            label="Estimated Delivery"
            type="datetime-local"
            value={trackingData.estimatedDelivery}
            onChange={(value) => setTrackingData({ ...trackingData, estimatedDelivery: value })}
            disabled={updating}
          />

          <div
            style={{
              display: 'flex',
              gap: theme.spacing.md,
              justifyContent: 'flex-end',
              marginTop: theme.spacing.md,
            }}
          >
            <Button
              variant="outline"
              onClick={() => {
                setShowTrackingModal(false);
                setTrackingData({
                  trackingNumber: '',
                  carrier: '',
                  status: '',
                  estimatedDelivery: '',
                });
              }}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTracking}
              loading={updating}
              disabled={!trackingData.trackingNumber.trim() || !trackingData.carrier.trim()}
            >
              Add Tracking
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


