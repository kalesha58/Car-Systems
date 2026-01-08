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
import { getDealerTestDrives, updateTestDriveStatus } from '@service/testDriveService';
import { ITestDrive } from '../../types/testDrive/ITestDrive';
import { useToast } from '@hooks/useToast';

const TestDriveManagementScreen: React.FC = () => {
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();
  const navigation = useNavigation();
  const [testDrives, setTestDrives] = useState<ITestDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchTestDrives = async () => {
    try {
      setLoading(true);
      const response = await getDealerTestDrives({
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
        limit: 100,
      });
      if (response.success && response.Response) {
        setTestDrives(response.Response.testDrives || []);
      }
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to load test drives');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTestDrives();
  }, [statusFilter]);

  const handleStatusUpdate = async (testDriveId: string, status: string) => {
    try {
      await updateTestDriveStatus(testDriveId, { status: status as any });
      showSuccess(`Test drive ${status} successfully`);
      fetchTestDrives();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredTestDrives = useMemo(() => {
    if (statusFilter === 'all') return testDrives;
    return testDrives.filter((td) => td.status === statusFilter);
  }, [testDrives, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return colors.success || '#4CAF50';
      case 'rejected':
        return colors.error || '#f44336';
      case 'completed':
        return colors.secondary || '#2196F3';
      case 'cancelled':
        return colors.textSecondary || '#757575';
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
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
      padding: 16,
    },
    testDriveCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statusText: {
      fontSize: RFValue(12),
      fontFamily: Fonts.SemiBold,
      color: '#fff',
    },
    vehicleInfo: {
      marginBottom: 8,
    },
    dateTime: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    actionButtonApprove: {
      backgroundColor: colors.success + '20',
    },
    actionButtonReject: {
      backgroundColor: colors.error + '20',
    },
  });

  const renderTestDriveItem = ({ item }: { item: ITestDrive }) => (
    <View style={styles.testDriveCard}>
      <View style={styles.cardHeader}>
        <CustomText variant="h6" fontFamily={Fonts.SemiBold}>
          Test Drive Request
        </CustomText>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <CustomText style={styles.statusText}>{item.status.toUpperCase()}</CustomText>
        </View>
      </View>

      <View style={styles.vehicleInfo}>
        <CustomText variant="h8" style={{ color: colors.textSecondary }}>
          Vehicle ID: {item.vehicleId.slice(0, 8)}...
        </CustomText>
      </View>

      <View style={styles.dateTime}>
        <Icon name="calendar-outline" size={RFValue(16)} color={colors.textSecondary} />
        <CustomText variant="h8" style={{ color: colors.textSecondary, marginLeft: 8 }}>
          {new Date(item.preferredDate).toLocaleDateString()} at {item.preferredTime}
        </CustomText>
      </View>

      {item.notes && (
        <CustomText variant="h8" style={{ color: colors.textSecondary, marginTop: 8 }}>
          Notes: {item.notes}
        </CustomText>
      )}

      {item.status === 'pending' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonApprove]}
            onPress={() => handleStatusUpdate(item.id, 'approved')}>
            <CustomText style={{ color: colors.success }} fontFamily={Fonts.SemiBold}>
              Approve
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonReject]}
            onPress={() => handleStatusUpdate(item.id, 'rejected')}>
            <CustomText style={{ color: colors.error }} fontFamily={Fonts.SemiBold}>
              Reject
            </CustomText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Test Drive Management" />
        <Loader />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Test Drive Management" />
      <View style={styles.filterContainer}>
        {['all', 'pending', 'approved', 'rejected', 'completed'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              statusFilter === status ? styles.filterButtonActive : styles.filterButtonInactive,
            ]}
            onPress={() => setStatusFilter(status)}>
            <CustomText
              style={{
                color: statusFilter === status ? '#fff' : colors.text,
                fontSize: RFValue(12),
                fontFamily: Fonts.Medium,
              }}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTestDrives}
        renderItem={renderTestDriveItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchTestDrives();
          }} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="car-outline"
            title="No Test Drives"
            message="No test drive requests found"
          />
        }
      />
    </View>
  );
};

export default TestDriveManagementScreen;

