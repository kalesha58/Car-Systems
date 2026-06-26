import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Share} from 'react-native';
import React, {useEffect, useRef, useState, useMemo} from 'react';
import {useAuthStore} from '@state/authStore';
import {getOrderById} from '@service/orderService';
import {getDealerById} from '@service/dealerService';
import {getProductById} from '@service/productService';
import {BASE_URL, SOCKET_URL} from '@service/config';
import {tokenStorage} from '@state/storage';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import LiveHeader from './LiveHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import OrderSummary from './OrderSummary';
import DeliveryDetails from './DeliveryDetails';
import LiveMap from './LiveMap';
import OrderWorkflow from './OrderWorkflow';
import {getOrderStatusDisplay, isOrderAccepted, isOrderPickedUp} from '@utils/orderStatusUtils';
import {io, Socket} from 'socket.io-client';
import {IDealer} from '../../types/dealer/IDealer';
import InAppBrowserModal from '@components/ui/InAppBrowserModal';
import {useRoute} from '@react-navigation/native';

const LiveTracking = () => {
  const {currentOrder, setCurrentOrder} = useAuthStore();
  const {colors} = useTheme();
  const route = useRoute();
  const routeParams = route?.params as { orderId?: string; id?: string } | undefined;
  const socketRef = useRef<Socket | null>(null);
  const [dealer, setDealer] = useState<IDealer | null>(null);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState('');

  const handleShareInvoice = async () => {
    const orderId = routeParams?.orderId || routeParams?.id || currentOrder?._id || currentOrder?.id;
    if (!orderId) {
      Alert.alert('Error', 'Order details are not loaded yet.');
      return;
    }
    const token = tokenStorage.getString('accessToken');
    if (!token) {
      Alert.alert('Error', 'Session token is missing. Please log in again.');
      return;
    }
    const url = `${BASE_URL}/invoices/order/${orderId}?token=${token}`;
    try {
      await Share.share({
        message: `Order Invoice link: ${url}`,
        title: `Invoice - ${orderId}`,
      });
    } catch (error) {
      Alert.alert('Share Failed', 'Unable to share invoice link.');
    }
  };

  const handleDownloadInvoice = () => {
    const orderId = routeParams?.orderId || routeParams?.id || currentOrder?._id || currentOrder?.id;
    if (!orderId) {
      Alert.alert('Error', 'Order details are not loaded yet.');
      return;
    }
    const token = tokenStorage.getString('accessToken');
    if (!token) {
      Alert.alert('Error', 'Session token is missing. Please log in again.');
      return;
    }
    const url = `${BASE_URL}/invoices/order/${orderId}?token=${token}`;
    setInvoiceUrl(url);
    setInvoiceModalVisible(true);
  };

  const fetchOrderDetails = async () => {
    const orderId = routeParams?.orderId || routeParams?.id || currentOrder?._id || currentOrder?.id;
    if (!orderId) {
      return;
    }

    try {
      const data = await getOrderById(orderId);
      if (data) {
        setCurrentOrder(data);
      }
    } catch (error) {
      // Error handling - no fallback per rules
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  useEffect(() => {
    const fetchDealerInfo = async () => {
      let dealerIdToFetch: string | null = null;

      if (currentOrder?.dealerId) {
        dealerIdToFetch = currentOrder.dealerId;
      } else if (currentOrder?.items && currentOrder.items.length > 0) {
        try {
          const firstItem = currentOrder.items[0];
          if (firstItem?.productId) {
            const productResponse = await getProductById(firstItem.productId);
            if (productResponse.success && productResponse.Response) {
              const productData = (productResponse.Response as any).products
                ? (productResponse.Response as any).products[0]
                : Array.isArray(productResponse.Response)
                ? productResponse.Response[0]
                : productResponse.Response;
              
              if (productData?.dealerId) {
                dealerIdToFetch = productData.dealerId;
              } else if (productData?.dealer?.id) {
                dealerIdToFetch = productData.dealer.id;
              }
            }
          }
        } catch (error) {
          setDealer(null);
          return;
        }
      }

      if (!dealerIdToFetch) {
        setDealer(null);
        return;
      }

      try {
        const response = await getDealerById(dealerIdToFetch);
        if (response.success && response.Response) {
          const dealerData = (response.Response as any).dealers
            ? (response.Response as any).dealers[0]
            : Array.isArray(response.Response)
            ? response.Response[0]
            : response.Response;
          
          if (dealerData && dealerData.id) {
            setDealer({
              id: dealerData.id,
              name: dealerData.name || '',
              businessName: dealerData.businessName || '',
              email: dealerData.email || '',
              phone: dealerData.phone || '',
              status: dealerData.status || '',
              location: dealerData.location,
              address: dealerData.address,
              documents: dealerData.documents,
              createdAt: dealerData.createdAt || new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        setDealer(null);
      }
    };

    fetchDealerInfo();
  }, [currentOrder?.dealerId, currentOrder?.items]);

  useEffect(() => {
    if (currentOrder) {
      const orderId = currentOrder._id || currentOrder.id;
      if (!orderId) {
        return;
      }

      const socketInstance = io(SOCKET_URL, {
        transports: ['websocket'],
        withCredentials: true,
      });

      socketRef.current = socketInstance;

      socketInstance.emit('joinRoom', orderId);

      const handleLiveTrackingUpdates = () => {
        fetchOrderDetails();
      };

      const handleOrderConfirmed = () => {
        fetchOrderDetails();
      };

      socketInstance.on('liveTrackingUpdates', handleLiveTrackingUpdates);
      socketInstance.on('orderConfirmed', handleOrderConfirmed);

      return () => {
        socketInstance.off('liveTrackingUpdates', handleLiveTrackingUpdates);
        socketInstance.off('orderConfirmed', handleOrderConfirmed);
        socketInstance.disconnect();
        socketRef.current = null;
      };
    }
  }, [currentOrder?._id || currentOrder?.id]);

  const statusDisplay = currentOrder?.status
    ? getOrderStatusDisplay(currentOrder.status)
    : {message: 'Packing your order', timeEstimate: 'Arriving in 10 minutes'};

  const msg = statusDisplay.message;
  const time = statusDisplay.timeEstimate;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 150,
      backgroundColor: colors.backgroundSecondary,
      padding: 15,
    },
    flexRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      borderRadius: 15,
      marginTop: 15,
      paddingVertical: 10,
      padding: 10,
      borderBottomWidth: 0.7,
    },
    iconContainer: {
      borderRadius: 100,
      padding: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <LiveHeader type="Customer" title={msg} secondTitle={time} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        <LiveMap
          deliveryLocation={currentOrder?.deliveryLocation}
          pickupLocation={currentOrder?.pickupLocation}
          deliveryPersonLocation={currentOrder?.deliveryPersonLocation}
          hasAccepted={isOrderAccepted(currentOrder?.status || '')}
          hasPickedUp={isOrderPickedUp(currentOrder?.status || '')}
        />

        <OrderWorkflow status={currentOrder?.status} timeline={currentOrder?.timeline} />

        <View style={[styles.flexRow, {backgroundColor: colors.cardBackground, borderColor: colors.border}]}>
          <View style={[styles.iconContainer, {backgroundColor: colors.backgroundSecondary}]}>
            <Icon
              name={currentOrder?.deliveryPartner ? 'phone' : 'shopping'}
              color={colors.disabled}
              size={RFValue(20)}
            />
          </View>
          <View style={{width: '82%'}}>
            <CustomText
              numberOfLines={1}
              variant="h7"
              fontFamily={Fonts.SemiBold}>
              {currentOrder?.deliveryPartner?.name ||
                currentOrder?.dealerId ||
                'We will soon assign delivery partner'}
            </CustomText>

            {currentOrder?.deliveryPartner?.phone && (
              <CustomText variant="h7" fontFamily={Fonts.Medium}>
                {currentOrder.deliveryPartner.phone}
              </CustomText>
            )}

            <CustomText variant="h9" fontFamily={Fonts.Medium}>
              {currentOrder?.deliveryPartner
                ? 'For Delivery instructions you can contact here'
                : msg}
            </CustomText>
          </View>
        </View>

        <DeliveryDetails
          details={currentOrder?.customer}
          shippingAddress={currentOrder?.shippingAddress}
          deliveryLocation={currentOrder?.deliveryLocation}
          dealer={dealer ? {
            id: dealer.id,
            name: dealer.name,
            businessName: dealer.businessName,
            phone: dealer.phone,
            address: dealer.address,
          } : undefined}
        />

        <OrderSummary order={currentOrder} />

        <View style={[styles.flexRow, {backgroundColor: colors.cardBackground, borderColor: colors.border}]}>
          <View style={[styles.iconContainer, {backgroundColor: colors.backgroundSecondary}]}>
            <Icon
              name="file-document-outline"
              color={colors.success || '#0d8320'}
              size={RFValue(20)}
            />
          </View>
          <View style={{width: '82%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <View style={{flex: 1, paddingRight: 10}}>
              <CustomText variant="h7" fontFamily={Fonts.SemiBold}>
                Order Invoice
              </CustomText>
              <CustomText variant="h9" fontFamily={Fonts.Medium}>
                Download or print order invoice
              </CustomText>
            </View>
            <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
              <TouchableOpacity
                onPress={handleShareInvoice}
                style={{
                  backgroundColor: colors.secondary || '#01875f',
                  paddingVertical: 8,
                  paddingHorizontal: 15,
                  borderRadius: 8,
                }}>
                <CustomText variant="h8" fontFamily={Fonts.SemiBold} style={{color: '#fff'}}>
                  Share
                </CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDownloadInvoice}
                style={{
                  backgroundColor: colors.success || '#0d8320',
                  paddingVertical: 8,
                  paddingHorizontal: 15,
                  borderRadius: 8,
                }}>
                <CustomText variant="h8" fontFamily={Fonts.SemiBold} style={{color: '#fff'}}>
                  Download
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.flexRow, {backgroundColor: colors.cardBackground, borderColor: colors.border}]}>
          <View style={[styles.iconContainer, {backgroundColor: colors.backgroundSecondary}]}>
            <Icon
              name="cards-heart-outline"
              color={colors.disabled}
              size={RFValue(20)}
            />
          </View>

          <View style={{width: '82%'}}>
            <CustomText variant="h7" fontFamily={Fonts.SemiBold}>
              Do you like our app?
            </CustomText>
            <CustomText variant="h9" fontFamily={Fonts.Medium}>
              Hit Like and subscribe button! If you are enjoying comment your
              excitement
            </CustomText>
          </View>
        </View>

        <View style={{marginTop: 20, paddingBottom: 20}}>
          <CustomText
            fontSize={RFValue(32)}
            fontFamily={Fonts.Bold}
            style={{opacity: 0.2}}>
            MotoNode 🚗
          </CustomText>
          <CustomText
            fontFamily={Fonts.Bold}
            style={{marginTop: 10, opacity: 0.2}}>
            Trust Us ❤️ 
          </CustomText>
        </View>
      </ScrollView>

      <InAppBrowserModal
        visible={invoiceModalVisible}
        url={invoiceUrl}
        onClose={() => setInvoiceModalVisible(false)}
        title="Order Invoice"
        orderId={String(currentOrder?._id || currentOrder?.id || 'invoice')}
      />
    </View>
  );
};

export default LiveTracking;
