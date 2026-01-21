import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@hooks/useTheme';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '@components/common/Header/Header';
import Loader from '@components/common/Loader/Loader';
import EmptyState from '@components/common/EmptyState/EmptyState';
import { getDealerPreBookings, updatePreBookingStatus } from '@service/preBookingService';
import { IPreBooking } from '@types/preBooking/IPreBooking';
import { useToast } from '@hooks/useToast';

const PreBookingManagementScreen: React.FC = () => {
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();
  const navigation = useNavigation();
  const [preBookings, setPreBookings] = useState<IPreBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchPreBookings = async () => {
    try {
      setLoading(true);
      const response = await getDealerPreBookings({
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
        limit: 100,
      });
      if (response.success && response.Response) {
        setPreBookings(response.Response.preBookings || []);
      }
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to load pre-bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPreBookings();
  }, [statusFilter]);

  const handleStatusUpdate = async (preBookingId: string, status: string) => {
    try {
      await updatePreBookingStatus(preBookingId, { status: status as any });
      showSuccess(`Pre-booking ${status} successfully`);
      fetchPreBookings();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredPreBookings = useMemo(() => {
    if (statusFilter === 'all') return preBookings;
    return preBookings.filter((pb) => pb.status === statusFilter);
  }, [preBookings, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return colors.success || '#4CAF50';
      case 'cancelled':
        return colors.error || '#f44336';
      default:
        return colors.warning || '#FF9800';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
    },
    filterButtonActive: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    filterButtonInactive: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
    },
    listContent: {
      padding: 12,
    },
    preBookingCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: RFValue(10),
      fontFamily: Fonts.SemiBold,
      color: colors.white,
    },
    vehicleInfo: {
      marginBottom: 6,
    },
    dateTime: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 10,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 6,
      alignItems: 'center',
    },
    actionButtonConfirm: {
      backgroundColor: colors.success + '20',
    },
    actionButtonCancel: {
      backgroundColor: colors.error + '20',
    },
  });

  const renderPreBookingItem = ({ item }: { item: IPreBooking }) => (
    <View style={styles.preBookingCard}>
      <View style={styles.cardHeader}>
        <CustomText variant="h5" fontFamily={Fonts.SemiBold}>
          Pre-Booking Request
        </CustomText>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <CustomText variant="h7" style={styles.statusText}>{item.status.toUpperCase()}</CustomText>
        </View>
      </View>

      <View style={styles.vehicleInfo}>
        <CustomText variant="h8" style={{ color: colors.textSecondary }}>
          Vehicle ID: {item.vehicleId.slice(0, 8)}...
        </CustomText>
      </View>

      <View style={styles.dateTime}>
        <Icon name="calendar-outline" size={RFValue(14)} color={colors.textSecondary} />
        <CustomText variant="h8" style={{ color: colors.textSecondary, marginLeft: 6 }}>
          {new Date(item.bookingDate).toLocaleDateString()}
        </CustomText>
      </View>

      {item.notes && (
        <CustomText variant="h8" style={{ color: colors.textSecondary, marginTop: 6 }}>
          Notes: {item.notes}
        </CustomText>
      )}

      {item.status === 'pending' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonConfirm]}
            onPress={() => handleStatusUpdate(item.id, 'confirmed')}>
            <CustomText variant="h6" style={{ color: colors.success }} fontFamily={Fonts.SemiBold}>
              Confirm
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonCancel]}
            onPress={() => handleStatusUpdate(item.id, 'cancelled')}>
            <CustomText variant="h6" style={{ color: colors.error }} fontFamily={Fonts.SemiBold}>
              Cancel
            </CustomText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Pre-Booking Management" />
        <Loader />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Pre-Booking Management" />
      <View style={styles.filterContainer}>
        {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              statusFilter === status ? styles.filterButtonActive : styles.filterButtonInactive,
            ]}
            onPress={() => setStatusFilter(status)}>
            <CustomText
              variant="h6"
              style={{
                color: statusFilter === status ? '#fff' : colors.text,
                fontFamily: Fonts.Medium,
              }}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredPreBookings}
        renderItem={renderPreBookingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchPreBookings();
          }} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-outline"
            title="No Pre-Bookings"
            message="No pre-booking requests found"
          />
        }
      />
    </View>
  );
};

export default PreBookingManagementScreen;

