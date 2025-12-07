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
import {useAuthStore} from '@state/authStore';
import {getUserOrders} from '@service/orderService';
import {IOrderData} from '../../types/order/IOrder';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Fonts, Colors} from '@utils/Constants';
import {formatISOToCustom} from '@utils/DateUtils';
import {navigate} from '@utils/NavigationUtils';
import {useTheme} from '@hooks/useTheme';
import {getOrderStatusDisplay} from '@utils/orderStatusUtils';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';

const OrdersList = () => {
  const [orders, setOrders] = useState<IOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const {setCurrentOrder} = useAuthStore();
  const {colors} = useTheme();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getUserOrders();
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
    if (
      normalizedStatus === 'delivered' ||
      normalizedStatus === 'order_delivered'
    ) {
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
    if (
      normalizedStatus.includes('cancel') ||
      normalizedStatus.includes('return')
    ) {
      return '#ef4444';
    }
    return colors.disabled;
  };

  const getStatusIcon = (status: string): string => {
    const normalizedStatus = status?.toLowerCase() || '';
    if (normalizedStatus === 'delivered') {
      return 'checkmark-circle';
    }
    if (
      normalizedStatus === 'confirmed' ||
      normalizedStatus === 'order_confirmed'
    ) {
      return 'checkmark-circle-outline';
    }
    if (
      normalizedStatus === 'arriving' ||
      normalizedStatus === 'out_for_delivery'
    ) {
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
    
    // Handle payment confirmed
    if (normalizedStatus === 'payment_confirmed') {
      return 'Payment Confirmed';
    }
    
    // Handle other statuses
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

    // Fallback: capitalize first letter of each word
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleOrderPress = (order: IOrderData) => {
    setCurrentOrder(order);
    navigate('LiveTracking');
  };

  const renderOrderItem = ({item, index}: {item: IOrderData; index: number}) => {
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
              <Icon name="receipt-outline" size={RFValue(14)} color={colors.text} />
            </View>
            <View style={styles.orderNumberTextContainer}>
              <CustomText variant="h9" fontFamily={Fonts.Medium} style={styles.orderIdLabel}>
                Order ID
              </CustomText>
              <CustomText variant="h7" fontFamily={Fonts.SemiBold} numberOfLines={1}>
                #{item.orderNumber}
              </CustomText>
            </View>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: statusColor + '15'}]}>
            <Icon name={statusIcon} size={RFValue(10)} color={statusColor} />
            <CustomText
              variant="h9"
              fontFamily={Fonts.Medium}
              style={[styles.statusText, {color: statusColor}]}
              numberOfLines={1}>
              {statusText}
            </CustomText>
          </View>
        </View>

        <View style={styles.orderContent}>
          <View style={styles.orderItemsSection}>
            <View style={styles.itemsHeader}>
              <Icon name="cube-outline" size={RFValue(12)} color={colors.disabled} />
              <CustomText variant="h9" fontFamily={Fonts.Medium} style={styles.itemsCountText}>
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </CustomText>
            </View>
            {item.items?.slice(0, 2).map((orderItem, idx) => (
              <CustomText
                variant="h9"
                numberOfLines={1}
                key={idx}
                style={styles.itemText}>
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
            <CustomText variant="h5" fontFamily={Fonts.SemiBold} style={styles.priceText}>
              ₹{item.totalAmount}
            </CustomText>
            <View style={styles.dateContainer}>
              <Icon name="calendar-outline" size={RFValue(9)} color={colors.disabled} />
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
      backgroundColor: colors.background,
    },
    content: {
      padding: 12,
      paddingBottom: 100,
    },
    orderItem: {
      borderRadius: 12,
      marginBottom: 10,
      padding: 12,
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
      marginBottom: 10,
    },
    orderNumberSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
    },
    orderIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 7,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    orderNumberTextContainer: {
      flex: 1,
      minWidth: 0,
    },
    orderIdLabel: {
      opacity: 0.6,
      fontSize: RFValue(9),
      marginBottom: 2,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 8,
      gap: 3,
      maxWidth: 110,
      marginLeft: 8,
    },
    statusText: {
      fontSize: RFValue(9),
      lineHeight: RFValue(11),
    },
    orderContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 10,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
    },
    orderItemsSection: {
      flex: 1,
      paddingRight: 10,
      minWidth: 0,
    },
    itemsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    itemsCountText: {
      opacity: 0.6,
      marginLeft: 4,
      fontSize: RFValue(10),
    },
    itemText: {
      marginBottom: 3,
      opacity: 0.85,
      fontSize: RFValue(10),
    },
    moreItemsText: {
      opacity: 0.5,
      marginTop: 2,
      fontSize: RFValue(9),
      fontStyle: 'italic',
    },
    orderDetailsSection: {
      alignItems: 'flex-end',
      minWidth: 95,
    },
    priceText: {
      marginBottom: 5,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    dateText: {
      opacity: 0.6,
      fontSize: RFValue(9),
      maxWidth: 90,
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
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title="My Orders" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="My Orders" />
      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon
            name="bag-outline"
            size={RFValue(64)}
            color={colors.disabled}
            style={styles.emptyIcon}
          />
          <CustomText variant="h5" fontFamily={Fonts.SemiBold}>
            No Orders Yet
          </CustomText>
          <CustomText variant="h8" style={styles.emptyText}>
            Your orders will appear here once you place an order
          </CustomText>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id || item.orderNumber}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.secondary}
              colors={[colors.secondary]}
            />
          }
        />
      )}
    </View>
  );
};

export default OrdersList;

