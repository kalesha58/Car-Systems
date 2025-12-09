import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {getDealerOrders} from '@service/dealerService';
import {IOrderData} from '../../types/order/IOrder';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {formatISOToCustom} from '@utils/DateUtils';
import {navigate} from '@utils/NavigationUtils';
import {useTheme} from '@hooks/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {useTranslation} from 'react-i18next';
import {useAuthStore} from '@state/authStore';

type TabType = 'delivered' | 'available';

const DealerOrdersList: React.FC = () => {
  const [orders, setOrders] = useState<IOrderData[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('delivered');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const {setCurrentOrder} = useAuthStore();
  const {colors} = useTheme();
  const {t} = useTranslation('dealer');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getDealerOrders({limit: 1000});
      setOrders(data);
    } catch (error) {
      // Error handling - no fallback per rules
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status: string): string => {
    const normalizedStatus = status?.toLowerCase() || '';
    if (normalizedStatus === 'delivered' || normalizedStatus === 'order_delivered') {
      return '#10b981';
    }
    if (
      normalizedStatus === 'confirmed' ||
      normalizedStatus === 'order_confirmed' ||
      normalizedStatus === 'arriving' ||
      normalizedStatus === 'out_for_delivery'
    ) {
      return colors.secondary;
    }
    if (
      normalizedStatus === 'available' ||
      normalizedStatus === 'order_placed' ||
      normalizedStatus === 'payment_confirmed'
    ) {
      return '#f59e0b';
    }
    if (normalizedStatus.includes('cancel') || normalizedStatus.includes('return')) {
      return '#ef4444';
    }
    return colors.disabled;
  };

  const getStatusIcon = (status: string): string => {
    const normalizedStatus = status?.toLowerCase() || '';
    if (normalizedStatus === 'delivered') {
      return 'checkmark-circle';
    }
    if (normalizedStatus === 'confirmed' || normalizedStatus === 'order_confirmed') {
      return 'checkmark-circle-outline';
    }
    if (normalizedStatus === 'arriving' || normalizedStatus === 'out_for_delivery') {
      return 'bicycle';
    }
    if (
      normalizedStatus === 'available' ||
      normalizedStatus === 'order_placed' ||
      normalizedStatus === 'payment_confirmed'
    ) {
      return 'time-outline';
    }
    return 'ellipse-outline';
  };

  const formatStatusText = (status: string): string => {
    const normalizedStatus = status?.toLowerCase() || '';

    if (normalizedStatus === 'payment_confirmed') {
      return 'Payment Confirmed';
    }

    const statusMap: Record<string, string> = {
      'order_placed': 'Order Placed',
      'order_confirmed': 'Confirmed',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled_by_user': 'Cancelled',
      'cancelled_by_dealer': 'Cancelled',
      'return_requested': 'Return Requested',
      'packed': 'Packed',
      'shipped': 'Shipped',
    };

    if (statusMap[normalizedStatus]) {
      return statusMap[normalizedStatus];
    }

    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleOrderPress = (order: IOrderData) => {
    setCurrentOrder(order);
    navigate('DeliveryMap', order);
  };

  // Filter orders based on active tab
  const getFilteredOrders = (): IOrderData[] => {
    if (activeTab === 'available') {
      // Available tab: Show only ORDER_PLACED and PAYMENT_CONFIRMED
      return orders.filter(order => {
        const normalizedStatus = order.status?.toUpperCase() || '';
        return normalizedStatus === 'ORDER_PLACED' || normalizedStatus === 'PAYMENT_CONFIRMED';
      });
    } else {
      // Delivered tab: Show only DELIVERED orders
      return orders.filter(order => {
        const normalizedStatus = order.status?.toUpperCase() || '';
        return normalizedStatus === 'DELIVERED';
      });
    }
  };

  const filteredOrders = getFilteredOrders();

  // Get counts for tabs
  const availableCount = orders.filter(order => {
    const normalizedStatus = order.status?.toUpperCase() || '';
    return normalizedStatus === 'ORDER_PLACED' || normalizedStatus === 'PAYMENT_CONFIRMED';
  }).length;

  const deliveredCount = orders.filter(order => {
    const normalizedStatus = order.status?.toUpperCase() || '';
    return normalizedStatus === 'DELIVERED';
  }).length;

  const renderOrderItem = ({item}: {item: IOrderData}) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);
    const totalItems = item.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;
    const statusText = formatStatusText(item.status);

    return (
      <TouchableOpacity
        style={[
          styles.orderItem,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            shadowColor: colors.text,
          },
        ]}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.7}>
        <View style={styles.orderHeader}>
          <View style={styles.orderNumberSection}>
            <View style={[styles.orderIconContainer, {backgroundColor: colors.backgroundSecondary}]}>
              <Icon name="receipt-outline" size={RFValue(12)} color={colors.text} />
            </View>
            <View style={styles.orderNumberTextContainer}>
              <CustomText variant="h9" fontFamily={Fonts.Medium} style={styles.orderIdLabel}>
                {t('orderNumber')}
              </CustomText>
              <CustomText variant="h7" fontFamily={Fonts.SemiBold} numberOfLines={1}>
                #{item.orderNumber}
              </CustomText>
            </View>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: statusColor + '15'}]}>
            <Icon name={statusIcon} size={RFValue(9)} color={statusColor} />
            <CustomText
              variant="h9"
              fontFamily={Fonts.Medium}
              style={[styles.statusText, {color: statusColor}]}
              numberOfLines={1}>
              {statusText}
            </CustomText>
          </View>
        </View>

        {item.customer && (
          <View style={[styles.customerSection, {borderTopColor: colors.border}]}>
            <View style={styles.customerInfo}>
              <Icon name="person-outline" size={RFValue(10)} color={colors.disabled} />
              <CustomText variant="h8" fontFamily={Fonts.Medium} style={styles.customerName} numberOfLines={1}>
                {item.customer.name}
              </CustomText>
            </View>
            <View style={styles.customerInfo}>
              <Icon name="call-outline" size={RFValue(10)} color={colors.disabled} />
              <CustomText variant="h8" style={styles.customerPhone} numberOfLines={1}>
                {item.customer.phone}
              </CustomText>
            </View>
          </View>
        )}

        {item.dealer && (
          <View style={[styles.dealerSection, {borderTopColor: colors.border}]}>
            <View style={styles.dealerInfo}>
              <Icon name="storefront-outline" size={RFValue(10)} color={colors.disabled} />
              <CustomText variant="h8" fontFamily={Fonts.Medium} style={styles.dealerName} numberOfLines={1}>
                {item.dealer.businessName || item.dealer.name}
              </CustomText>
            </View>
            {item.dealer.phone && (
              <View style={styles.dealerInfo}>
                <Icon name="call-outline" size={RFValue(10)} color={colors.disabled} />
                <CustomText variant="h8" style={styles.dealerPhone} numberOfLines={1}>
                  {item.dealer.phone}
                </CustomText>
              </View>
            )}
          </View>
        )}

        <View style={[styles.orderContent, {borderTopColor: colors.border}]}>
          <View style={styles.orderItemsSection}>
            <View style={styles.itemsHeader}>
              <Icon name="cube-outline" size={RFValue(10)} color={colors.disabled} />
              <CustomText variant="h9" fontFamily={Fonts.Medium} style={styles.itemsCountText}>
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </CustomText>
            </View>
            {item.items?.slice(0, 2).map((orderItem, idx) => (
              <CustomText variant="h9" numberOfLines={1} key={idx} style={styles.itemText}>
                {orderItem.quantity}x {orderItem.name}
              </CustomText>
            ))}
            {item.items && item.items.length > 2 && (
              <CustomText variant="h9" style={styles.moreItemsText}>
                +{item.items.length - 2} more
              </CustomText>
            )}
          </View>
          <View style={styles.orderDetailsSection}>
            <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={styles.priceText}>
              ₹{item.totalAmount}
            </CustomText>
            <View style={styles.dateContainer}>
              <Icon name="calendar-outline" size={RFValue(8)} color={colors.disabled} />
              <CustomText variant="h9" style={styles.dateText} numberOfLines={1}>
                {formatISOToCustom(item.createdAt)}
              </CustomText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: 10,
      paddingBottom: 100,
    },
    orderItem: {
      borderRadius: 10,
      marginBottom: 8,
      padding: 10,
      borderWidth: 1,
      ...Platform.select({
        ios: {
          shadowOffset: {width: 0, height: 1},
          shadowOpacity: 0.08,
          shadowRadius: 3,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    orderNumberSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
    },
    orderIconContainer: {
      width: 24,
      height: 24,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    },
    orderNumberTextContainer: {
      flex: 1,
      minWidth: 0,
    },
    orderIdLabel: {
      opacity: 0.6,
      fontSize: RFValue(9),
      marginBottom: 1,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 6,
      gap: 2,
      maxWidth: 100,
      marginLeft: 6,
    },
    statusText: {
      fontSize: RFValue(9),
      lineHeight: RFValue(11),
    },
    customerSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 6,
      paddingBottom: 6,
      borderTopWidth: 0.5,
      marginBottom: 6,
      gap: 8,
    },
    customerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 4,
    },
    customerName: {
      opacity: 0.85,
      fontSize: RFValue(10),
    },
    customerPhone: {
      opacity: 0.7,
      fontSize: RFValue(10),
    },
    dealerSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 6,
      paddingBottom: 6,
      borderTopWidth: 0.5,
      marginBottom: 6,
      gap: 8,
    },
    dealerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 4,
    },
    dealerName: {
      opacity: 0.85,
      fontSize: RFValue(10),
    },
    dealerPhone: {
      opacity: 0.7,
      fontSize: RFValue(10),
    },
    orderContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 0.5,
    },
    orderItemsSection: {
      flex: 1,
      paddingRight: 8,
      minWidth: 0,
    },
    itemsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    itemsCountText: {
      opacity: 0.6,
      marginLeft: 3,
      fontSize: RFValue(9),
    },
    itemText: {
      marginBottom: 2,
      opacity: 0.85,
      fontSize: RFValue(9),
    },
    moreItemsText: {
      opacity: 0.5,
      marginTop: 1,
      fontSize: RFValue(9),
      fontStyle: 'italic',
    },
    orderDetailsSection: {
      alignItems: 'flex-end',
      minWidth: 90,
    },
    priceText: {
      marginBottom: 4,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    dateText: {
      opacity: 0.6,
      fontSize: RFValue(9),
      maxWidth: 85,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
      paddingHorizontal: 40,
    },
    emptyIcon: {
      marginBottom: 16,
      opacity: 0.3,
    },
    emptyText: {
      opacity: 0.6,
      marginTop: 8,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
      paddingHorizontal: 10,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
      gap: 6,
    },
    activeTab: {
      borderBottomWidth: 2,
    },
    tabText: {
      fontSize: RFValue(14),
    },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      color: '#fff',
      fontSize: RFValue(10),
      fontFamily: Fonts.SemiBold,
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <CustomHeader title={t('orders')} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <CustomHeader title={t('orders')} />
      
      {/* Tab Bar */}
      <View style={[styles.tabContainer, {backgroundColor: colors.cardBackground}]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'delivered' && styles.activeTab,
            activeTab === 'delivered' && {borderBottomColor: colors.secondary},
          ]}
          onPress={() => setActiveTab('delivered')}
          activeOpacity={0.7}>
          <CustomText
            variant="h7"
            fontFamily={Fonts.SemiBold}
            style={[
              styles.tabText,
              {color: activeTab === 'delivered' ? colors.secondary : colors.disabled},
            ]}>
            Delivered
          </CustomText>
          {deliveredCount > 0 && (
            <View style={[styles.badge, {backgroundColor: activeTab === 'delivered' ? colors.secondary : colors.disabled}]}>
              <CustomText variant="h9" style={styles.badgeText}>
                {deliveredCount}
              </CustomText>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'available' && styles.activeTab,
            activeTab === 'available' && {borderBottomColor: colors.secondary},
          ]}
          onPress={() => setActiveTab('available')}
          activeOpacity={0.7}>
          <CustomText
            variant="h7"
            fontFamily={Fonts.SemiBold}
            style={[
              styles.tabText,
              {color: activeTab === 'available' ? colors.secondary : colors.disabled},
            ]}>
            Available
          </CustomText>
          {availableCount > 0 && (
            <View style={[styles.badge, {backgroundColor: activeTab === 'available' ? colors.secondary : colors.disabled}]}>
              <CustomText variant="h9" style={styles.badgeText}>
                {availableCount}
              </CustomText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="bag-outline" size={RFValue(64)} color={colors.disabled} style={styles.emptyIcon} />
          <CustomText variant="h5" fontFamily={Fonts.SemiBold}>
            {activeTab === 'available' ? 'No Available Orders' : 'No Delivered Orders'}
          </CustomText>
          <CustomText variant="h8" style={styles.emptyText}>
            {activeTab === 'available' 
              ? 'No orders are waiting for acceptance' 
              : 'No orders have been delivered yet'}
          </CustomText>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id || item.orderNumber}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.secondary} colors={[colors.secondary]} />
          }
        />
      )}
    </View>
  );
};

export default DealerOrdersList;

