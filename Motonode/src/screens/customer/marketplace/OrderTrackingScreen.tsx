import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  Clipboard,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Share,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { ChromeHeader } from '@components/common';
import { OrderTrackingSkeleton } from '@components/loaders';

import { CustomerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import type { IOrderData } from '@app-types/order';
import { getOrderById } from '@services/order.service';
import { getProductById } from '@services/product.service';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { formatCurrency, formatOrderDate, normalizeOrderDisplayStatus } from '@utils/displayMappers';
import { lightHaptic, successHaptic } from '@utils/haptics';
import { InAppBrowserModal } from '@components/common/InAppBrowserModal';
import { getString, StorageKeys } from '@storage/index';
import { API_BASE_URL } from '@config/env';
import MapView, { Marker, Polyline } from 'react-native-maps';

type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: undefined;
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
  [CustomerStackRoutes.DealerStore]: { id: string };
  [CustomerStackRoutes.ServiceDetail]: { id: string };
  [CustomerStackRoutes.DriveDetail]: { id: string };
  [CustomerStackRoutes.MyOrders]: undefined;
  [CustomerStackRoutes.OrderTracking]: { id: string };
};

type OrderTrackingScreenProps = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.OrderTracking
>;

const TIMELINE_STEPS = ['Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'] as const;

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=100&auto=format&fit=crop&q=80';

function getTimelineProgress(status: string) {
  const displayStatus = normalizeOrderDisplayStatus(status);
  switch (displayStatus) {
    case 'Delivered':
      return 4;
    case 'Out for Delivery':
      return 3;
    case 'Shipped':
      return 2;
    case 'Processing':
    default:
      return 1;
  }
}

export function OrderTrackingScreen({ route, navigation }: OrderTrackingScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { id } = route.params;

  const [order, setOrder] = useState<IOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsExpanded, setItemsExpanded] = useState(true);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  
  const mapRef = useRef<MapView | null>(null);

  // Default coordinate structures
  const destCoords = {
    latitude: order?.deliveryLocation?.latitude ?? 12.9348,
    longitude: order?.deliveryLocation?.longitude ?? 77.6189,
  };

  const startCoords = {
    latitude: order?.pickupLocation?.latitude ?? 12.9312,
    longitude: order?.pickupLocation?.longitude ?? 77.6212,
  };

  const [driverCoords, setDriverCoords] = useState({
    latitude: startCoords.latitude,
    longitude: startCoords.longitude,
  });

  // Animate/Simulate live movement of driver if status is OUT_FOR_DELIVERY
  useEffect(() => {
    if (!order) return;
    
    if (order.status !== 'OUT_FOR_DELIVERY') {
      // Driver at store if placed/packed/shipped
      setDriverCoords({
        latitude: order.deliveryPersonLocation?.latitude ?? startCoords.latitude,
        longitude: order.deliveryPersonLocation?.longitude ?? startCoords.longitude,
      });
      return;
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.02;
      if (progress > 1) {
        progress = 0; // Loop tracking
      }

      setDriverCoords({
        latitude: startCoords.latitude + (destCoords.latitude - startCoords.latitude) * progress,
        longitude: startCoords.longitude + (destCoords.longitude - startCoords.longitude) * progress,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [order?.status, order?.deliveryPersonLocation, startCoords.latitude, startCoords.longitude, destCoords.latitude, destCoords.longitude]);

  // Load product images dynamically
  useEffect(() => {
    if (!order) return;
    const fetchImages = async () => {
      const imagesMap: Record<string, string> = {};
      await Promise.all(
        order.items.map(async (item) => {
          try {
            const res = await getProductById(item.productId);
            if (res.success && res.Response?.products?.[0]?.images?.[0]) {
              imagesMap[item.productId] = res.Response.products[0].images[0];
            }
          } catch (err) {
            console.log('Failed to fetch product image in tracker:', err);
          }
        })
      );
      setProductImages((prev) => ({ ...prev, ...imagesMap }));
    };
    void fetchImages();
  }, [order]);

  const handleShareInvoice = async () => {
    if (!order) return;
    lightHaptic();
    try {
      const token = await getString(StorageKeys.ACCESS_TOKEN);
      const url = `${API_BASE_URL}/invoices/order/${order.id}?token=${token}`;
      
      await Share.share({
        message: `Order Invoice link: ${url}`,
        title: `Invoice - ${order.orderNumber}`,
      });
    } catch (error) {
      console.log('Share error:', error);
      Alert.alert('Share Failed', 'Unable to share invoice link.');
    }
  };

  const handleViewInvoice = async () => {
    if (!order) return;
    lightHaptic();
    try {
      const token = await getString(StorageKeys.ACCESS_TOKEN);
      const url = `${API_BASE_URL}/invoices/order/${order.id}?token=${token}`;
      setInvoiceUrl(url);
      setInvoiceModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Unable to retrieve access token.');
    }
  };

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderById(id);
      if (data) {
        setOrder(data);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load order'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadOrder();
    }, [loadOrder]),
  );

  const displayStatus = order ? normalizeOrderDisplayStatus(order.status) : 'Processing';
  const progressIndex = order ? getTimelineProgress(order.status) : 0;

  const steps = TIMELINE_STEPS.map((label, idx) => ({
    label,
    date:
      idx <= progressIndex && order
        ? formatOrderDate(order.createdAt).split(',')[0].replace(/\d{4}/, '').trim()
        : '',
    completed: idx <= progressIndex,
    active: idx === progressIndex,
  }));

  const handleCopyOrderId = () => {
    if (!order) return;
    Clipboard.setString(order.orderNumber);
    successHaptic();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChromeHeader style={styles.header} contentPad={8}>
          <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={24} color="#ffffff" />
          </Pressable>
          <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Order Tracking</Text>
          <View style={styles.iconBtn} />
        </ChromeHeader>
        <OrderTrackingSkeleton />
      </View>
    );
  }

  if (!order || error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChromeHeader style={styles.header} contentPad={8}>
          <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={24} color="#ffffff" />
          </Pressable>
          <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Order Tracking</Text>
          <View style={styles.iconBtn} />
        </ChromeHeader>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={48} color={colors.textTertiary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error ?? 'Order not found'}</Text>
        </View>
      </View>
    );
  }

  const address = order.shippingAddress;
  const addressLine = [address.street, address.city, address.state, address.zipCode]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader style={styles.header} contentPad={8}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color="#ffffff" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Order Tracking</Text>
        <Pressable style={styles.iconBtn}>
          <Feather name="headphones" size={20} color="#ffffff" />
        </Pressable>
      </ChromeHeader>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 20 }]}
      >
        <View style={styles.orderIdRow}>
          <View>
            <Text style={[styles.orderLabel, { color: colors.textSecondary }]}>Order ID</Text>
            <Text style={[styles.orderIdValue, { color: colors.textPrimary }]}>{order.orderNumber}</Text>
            <Text style={[styles.orderPlacedOn, { color: colors.textTertiary }]}>
              Placed on {formatOrderDate(order.createdAt)}
            </Text>
          </View>
          <Pressable style={styles.copyBtn} onPress={handleCopyOrderId}>
            <Text style={styles.copyBtnText}>Copy</Text>
          </Pressable>
        </View>

        <View style={[styles.statusCard, { backgroundColor: 'rgba(230,0,18,0.04)', borderColor: 'rgba(230,0,18,0.1)' }]}>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>{displayStatus}</Text>
            <Text style={styles.statusSubtitle}>
              {order.expectedDeliveryDate
                ? `Expected by ${new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN')}`
                : `Payment: ${order.paymentStatus}`}
            </Text>
          </View>
          <View style={[styles.scooterIconContainer, { backgroundColor: 'rgba(230,0,18,0.08)' }]}>
            <Feather name="truck" size={28} color="#E60012" />
          </View>
        </View>

        {order.paymentStatus === 'paid' && (
          <View style={[styles.invoiceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.invoiceHeader}>
              <Feather name="file-text" size={20} color={colors.primary} />
              <View style={styles.invoiceInfo}>
                <Text style={[styles.invoiceTitle, { color: colors.textPrimary }]}>Order Invoice</Text>
                <Text style={[styles.invoiceSubtitle, { color: colors.textSecondary }]}>Download or share order invoice</Text>
              </View>
            </View>
            <View style={styles.invoiceActions}>
              <Pressable
                style={[styles.invoiceBtn, { backgroundColor: colors.muted }]}
                onPress={handleShareInvoice}
              >
                <Feather name="share-2" size={16} color={colors.textPrimary} />
                <Text style={[styles.invoiceBtnText, { color: colors.textPrimary }]}>Share</Text>
              </Pressable>
              <Pressable
                style={[styles.invoiceBtn, { backgroundColor: colors.primary }]}
                onPress={handleViewInvoice}
              >
                <Feather name="download" size={16} color="#ffffff" />
                <Text style={[styles.invoiceBtnText, { color: '#ffffff' }]}>Download</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Live Map Tracking Panel */}
        <View style={[styles.mapContainer, { borderColor: colors.border }]}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={Platform.OS === 'android' ? 'google' : undefined}
            initialRegion={{
              latitude: (destCoords.latitude + startCoords.latitude) / 2,
              longitude: (destCoords.longitude + startCoords.longitude) / 2,
              latitudeDelta: Math.abs(destCoords.latitude - startCoords.latitude) * 2.2 || 0.02,
              longitudeDelta: Math.abs(destCoords.longitude - startCoords.longitude) * 2.2 || 0.02,
            }}
            scrollEnabled={true}
            zoomEnabled={true}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            {/* Start Marker (Store) */}
            <Marker coordinate={startCoords} title="Store" description="Motonode Auto Hub">
              <View style={[styles.markerIconBg, { backgroundColor: '#F3E8FF' }]}>
                <Feather name="home" size={16} color="#7E22CE" />
              </View>
            </Marker>

            {/* Destination Marker (User) */}
            <Marker coordinate={destCoords} title="Delivery Address" description={order.shippingAddress.street}>
              <View style={[styles.markerIconBg, { backgroundColor: '#DCFCE7' }]}>
                <Feather name="map-pin" size={16} color="#15803D" />
              </View>
            </Marker>

            {/* Live Driver Marker (Scooter) */}
            <Marker coordinate={driverCoords} title="Delivery Partner" description="On the way to your location">
              <View style={[styles.markerIconBg, { backgroundColor: '#EFF6FF', borderColor: '#E60012', borderWidth: 1 }]}>
                <Feather name="truck" size={16} color="#E60012" />
              </View>
            </Marker>

            {/* Path Connection */}
            <Polyline
              coordinates={[startCoords, driverCoords, destCoords]}
              strokeColor="#E60012"
              strokeWidth={3}
              lineDashPattern={[6, 4]}
            />
          </MapView>
        </View>

        <View style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.timelineStepperRow}>
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;
              return (
                <React.Fragment key={step.label}>
                  <View style={styles.stepNode}>
                    <View
                      style={[
                        styles.circleNode,
                        step.completed ? { backgroundColor: '#7E22CE' } : { backgroundColor: '#E2E8F0' },
                        step.active && { borderWidth: 2, borderColor: '#C084FC' },
                      ]}
                    >
                      {step.completed ? (
                        <Feather name="check" size={10} color="#fff" />
                      ) : (
                        <View style={styles.circleInner} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        step.completed ? { color: colors.textPrimary } : { color: colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {step.label}
                    </Text>
                    {step.date ? <Text style={styles.stepDate}>{step.date}</Text> : null}
                  </View>
                  {idx < steps.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        {
                          backgroundColor:
                            steps[idx + 1].completed
                              ? '#E60012'
                              : '#E2E8F0',
                        },
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {order.dealer ? (
          <View style={[styles.partnerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Dealer</Text>
            <View style={styles.partnerRow}>
              <View style={[styles.partnerAvatar, { backgroundColor: colors.primarySubtle, alignItems: 'center', justifyContent: 'center' }]}>
                <Feather name="shopping-bag" size={20} color={colors.primary} />
              </View>
              <View style={styles.partnerInfo}>
                <Text style={[styles.partnerName, { color: colors.textPrimary }]}>
                  {order.dealer.businessName || order.dealer.name}
                </Text>
                {order.dealer.phone ? (
                  <Text style={styles.partnerRatingVal}>{order.dealer.phone}</Text>
                ) : null}
              </View>
              <View style={styles.partnerActions}>
                <Pressable style={styles.actionIconBtn} onPress={() => lightHaptic()}>
                  <Feather name="phone" size={16} color="#E60012" />
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        <View style={[styles.accordionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable style={styles.accordionHeader} onPress={() => setItemsExpanded(!itemsExpanded)}>
            <Text style={[styles.accordionTitle, { color: colors.textPrimary }]}>
              Order Items ({order.items.length})
            </Text>
            <Feather
              name={itemsExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>

          {itemsExpanded && (
            <View style={styles.accordionBody}>
              {order.items.map((item, index) => (
                <View key={`${item.productId}-${index}`} style={styles.itemRow}>
                  <Image
                    source={{ uri: productImages[item.productId] || DEFAULT_PRODUCT_IMAGE }}
                    style={styles.itemThumb}
                  />
                  <View style={styles.itemMeta}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
                      Qty: {item.quantity}
                    </Text>
                  </View>
                  <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              ))}

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total</Text>
                <Text style={[styles.totalVal, { color: colors.textPrimary }]}>
                  {formatCurrency(order.totalAmount)}
                </Text>
              </View>

              {addressLine ? (
                <Text style={[styles.itemQty, { color: colors.textSecondary, marginTop: 8 }]}>
                  Deliver to: {addressLine}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      <InAppBrowserModal
        visible={invoiceModalVisible}
        url={invoiceUrl}
        onClose={() => setInvoiceModalVisible(false)}
        title="Order Invoice"
        orderId={order ? String(order.id) : 'invoice'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#E60012',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  scrollContent: { padding: 16, gap: 16, paddingTop: 70 },
  orderIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  orderLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  orderIdValue: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 2 },
  orderPlacedOn: { fontSize: 10, marginTop: 2 },
  copyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  copyBtnText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#475569' },
  statusCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#E60012' },
  statusSubtitle: { fontSize: 12, color: '#E60012', opacity: 0.8, marginTop: 4 },
  scooterIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  timelineStepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepNode: {
    alignItems: 'center',
    width: 60,
  },
  circleNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  circleActive: {
    borderColor: '#E60012',
    backgroundColor: '#E60012',
  },
  circleDone: {
    borderColor: '#E60012',
    backgroundColor: '#E60012',
  },
  stepLabel: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginTop: 6,
    color: '#94A3B8',
  },
  stepLabelActive: {
    color: '#E60012',
    fontFamily: 'Inter_700Bold',
  },
  stepDate: {
    fontSize: 7,
    color: '#94A3B8',
    marginTop: 2,
    fontFamily: 'Inter_500Medium',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginTop: 10,
  },
  partnerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  partnerRatingVal: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#64748B', marginTop: 2 },
  partnerActions: { flexDirection: 'row', gap: 6 },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  accordionBody: {
    marginTop: 16,
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  itemMeta: { flex: 1 },
  itemName: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  itemQty: { fontSize: 10, marginTop: 1 },
  itemPrice: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  divider: { height: 1, marginVertical: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  totalVal: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  invoiceCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  invoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  invoiceSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  invoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  invoiceBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  mapContainer: {
    height: 220,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  markerIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
