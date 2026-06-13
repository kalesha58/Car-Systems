import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@hooks/useTheme';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomHeader from '@components/ui/CustomHeader';
import { getUserServiceBookings, cancelUserServiceBooking } from '@service/serviceBookingService';
import { IServiceBooking, ServiceBookingStatus } from '../../types/service/IServiceBooking';
import { useToast } from '@hooks/useToast';
import { useTranslation } from 'react-i18next';

const STATUS_FILTERS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'Pending' },
  { key: 'scheduled', label: 'Approved' },
  { key: 'cancelled', label: 'Declined' },
  { key: 'completed', label: 'Completed' },
];

const formatDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getDisplayStatus = (status: ServiceBookingStatus, rejectionReason?: string) => {
  if (status === 'new') return 'Pending';
  if (status === 'scheduled') return 'Approved';
  if (status === 'cancelled' && rejectionReason) return 'Declined';
  if (status === 'cancelled') return 'Cancelled';
  return status.replace('_', ' ');
};

const MyServiceBookingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { showError, showSuccess } = useToast();
  const { t } = useTranslation();
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;

  const [bookings, setBookings] = useState<IServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const response = await getUserServiceBookings({
        serviceType: 'tire_service',
        status: statusFilter !== 'all' ? (statusFilter as ServiceBookingStatus) : undefined,
        limit: 100,
      });
      const list = response?.Response?.bookings ?? [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (error: any) {
      setBookings([]);
      showErrorRef.current(error?.response?.data?.message || 'Failed to load service bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchBookings(false);
  }, [statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return colors.success || '#4CAF50';
      case 'cancelled':
        return colors.error || '#f44336';
      case 'completed':
        return colors.secondary || '#2196F3';
      default:
        return colors.warning || '#FF9800';
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setCancellingId(id);
      await cancelUserServiceBooking(id);
      showSuccess('Request cancelled');
      fetchBookings(true);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancellingId(null);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: { backgroundColor: colors.secondary + '20', borderColor: colors.secondary },
    filterText: { fontSize: RFValue(11), fontFamily: Fonts.Medium, color: colors.textSecondary },
    filterTextActive: { color: colors.secondary },
    card: {
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    cancelBtn: {
      marginTop: 12,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.error,
    },
  });

  return (
    <View style={styles.container}>
      <CustomHeader title={t('service.myBookings') || 'My Service Bookings'} showBackButton />
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, statusFilter === f.key && styles.filterChipActive]}
            onPress={() => setStatusFilter(f.key)}>
            <CustomText
              style={[styles.filterText, statusFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.secondary} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(true); }} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="construct-outline" size={RFValue(40)} color={colors.disabled} />
              <CustomText style={{ marginTop: 12, color: colors.textSecondary }}>
                No service bookings yet
              </CustomText>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <CustomText fontFamily={Fonts.Bold} style={{ fontSize: RFValue(13), color: colors.text }}>
                {item.serviceName || item.serviceRequest}
              </CustomText>
              {item.dealerName && (
                <CustomText style={{ color: colors.textSecondary, fontSize: RFValue(11), marginTop: 4 }}>
                  {item.dealerName}
                </CustomText>
              )}
              <CustomText style={{ color: colors.textSecondary, fontSize: RFValue(11), marginTop: 4 }}>
                {formatDate(item.bookingDate)}
                {item.bookingTime ? ` at ${item.bookingTime}` : ''}
              </CustomText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: getStatusColor(item.status),
                  }}
                />
                <CustomText style={{ color: getStatusColor(item.status), fontSize: RFValue(11), fontFamily: Fonts.SemiBold }}>
                  {getDisplayStatus(item.status, item.rejectionReason)}
                </CustomText>
              </View>
              {item.rejectionReason && (
                <CustomText style={{ color: colors.textSecondary, fontSize: RFValue(10), marginTop: 6 }}>
                  Reason: {item.rejectionReason}
                </CustomText>
              )}
              {item.status === 'new' && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => handleCancel(item.id)}
                  disabled={cancellingId === item.id}>
                  <CustomText style={{ color: colors.error, fontSize: RFValue(11) }}>
                    {cancellingId === item.id ? 'Cancelling...' : 'Cancel Request'}
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

export default MyServiceBookingsScreen;
