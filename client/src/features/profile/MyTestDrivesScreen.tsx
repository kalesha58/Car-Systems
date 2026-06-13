import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@hooks/useTheme';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomHeader from '@components/ui/CustomHeader';
import { getUserTestDrives } from '@service/testDriveService';
import { ITestDrive, TestDriveStatus } from '../../types/testDrive/ITestDrive';
import { useToast } from '@hooks/useToast';
import { useTranslation } from 'react-i18next';
import { navigate } from '@utils/NavigationUtils';

const STATUS_FILTERS: Array<{ key: string; labelKey: string }> = [
  { key: 'all', labelKey: 'testDrive.filterAll' },
  { key: 'pending', labelKey: 'testDrive.statusPending' },
  { key: 'approved', labelKey: 'testDrive.statusApproved' },
  { key: 'rejected', labelKey: 'testDrive.statusRejected' },
  { key: 'completed', labelKey: 'testDrive.statusCompleted' },
  { key: 'cancelled', labelKey: 'testDrive.statusCancelled' },
];

const formatDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const MyTestDrivesScreen: React.FC = () => {
  const { colors } = useTheme();
  const { showError } = useToast();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;

  const [testDrives, setTestDrives] = useState<ITestDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchTestDrives = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      const response = await getUserTestDrives({
        status: statusFilter !== 'all' ? (statusFilter as TestDriveStatus) : undefined,
        limit: 100,
      });
      const list =
        response?.Response?.testDrives ??
        (response as any)?.testDrives ??
        [];
      setTestDrives(Array.isArray(list) ? list : []);
    } catch (error: any) {
      setTestDrives([]);
      showErrorRef.current(error?.response?.data?.message || 'Failed to load test drives');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTestDrives(false);
  }, [statusFilter]);

  const selectedDrive = useMemo(
    () => testDrives.find((td) => td.id === selectedId) || null,
    [testDrives, selectedId],
  );

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
    container: { flex: 1, backgroundColor: colors.background },
    filterWrap: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.cardBackground,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
    },
    filterActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
    filterInactive: { backgroundColor: colors.background, borderColor: colors.border },
    listContent: { padding: 12, paddingBottom: 32, flexGrow: 1 },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 2,
    },
    cardSelected: {
      borderColor: colors.secondary,
      borderWidth: 1.5,
    },
    thumb: {
      width: 80,
      height: 80,
      borderRadius: 10,
      backgroundColor: colors.backgroundSecondary,
    },
    cardBody: { flex: 1, justifyContent: 'center' },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    detailPanel: {
      marginTop: 4,
      marginBottom: 16,
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    viewVehicleBtn: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.secondary + '15',
    },
  });

  const renderCard = ({ item }: { item: ITestDrive }) => {
    const statusColor = getStatusColor(item.status);
    const isSelected = selectedId === item.id;

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        activeOpacity={0.85}
        onPress={() => setSelectedId(isSelected ? null : item.id)}>
        {item.vehicleImage ? (
          <Image source={{ uri: item.vehicleImage }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, { justifyContent: 'center', alignItems: 'center' }]}>
            <Icon name="car-sport-outline" size={RFValue(28)} color={colors.textSecondary} />
          </View>
        )}
        <View style={styles.cardBody}>
          <CustomText fontFamily={Fonts.SemiBold} variant="h5" numberOfLines={2}>
            {item.vehicleLabel || t('testDrive.vehicleFallback')}
          </CustomText>
          {item.vehicleType ? (
            <CustomText variant="h8" style={{ color: colors.textSecondary, marginTop: 2 }}>
              {item.vehicleType}
            </CustomText>
          ) : null}
          {item.dealerName ? (
            <CustomText variant="h8" style={{ color: colors.textSecondary, marginTop: 4 }} numberOfLines={1}>
              {item.dealerName}
            </CustomText>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
            <Icon name="calendar-outline" size={RFValue(12)} color={colors.textSecondary} />
            <CustomText variant="h8" style={{ color: colors.textSecondary }}>
              {formatDate(item.preferredDate)} · {item.preferredTime}
            </CustomText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <CustomText
              variant="h8"
              fontFamily={Fonts.SemiBold}
              style={{ color: statusColor, textTransform: 'capitalize' }}>
              {item.status}
            </CustomText>
          </View>
        </View>
        <Icon name="chevron-forward" size={RFValue(16)} color={colors.textSecondary} style={{ alignSelf: 'center' }} />
      </TouchableOpacity>
    );
  };

  const renderListHeader = () => (
    <View style={styles.filterWrap}>
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterButton, active ? styles.filterActive : styles.filterInactive]}
              onPress={() => {
                if (f.key !== statusFilter) {
                  setSelectedId(null);
                  setStatusFilter(f.key);
                }
              }}
              activeOpacity={0.8}>
              <CustomText
                variant="h8"
                fontFamily={Fonts.Medium}
                style={{ color: active ? colors.white : colors.text }}>
                {t(f.labelKey)}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderDetailPanel = () => {
    if (!selectedDrive) return null;
    return (
      <View style={styles.detailPanel}>
        <CustomText fontFamily={Fonts.Bold} variant="h5" style={{ marginBottom: 12 }}>
          {t('testDrive.requestDetails')}
        </CustomText>
        <CustomText variant="h7" style={{ marginBottom: 6 }}>
          {t('testDrive.scheduledFor')}: {formatDate(selectedDrive.preferredDate)} · {selectedDrive.preferredTime}
        </CustomText>
        {selectedDrive.notes ? (
          <CustomText variant="h7" style={{ marginBottom: 6, color: colors.textSecondary }}>
            {t('testDrive.yourNotes')}: {selectedDrive.notes}
          </CustomText>
        ) : null}
        {(selectedDrive.status === 'rejected' || selectedDrive.status === 'cancelled') && selectedDrive.dealerNotes ? (
          <CustomText variant="h7" style={{ marginBottom: 6, color: colors.error }}>
            {t('testDrive.dealerNotes')}: {selectedDrive.dealerNotes}
          </CustomText>
        ) : null}
        <TouchableOpacity
          style={styles.viewVehicleBtn}
          onPress={() => navigate('VehicleDetail', { vehicleId: selectedDrive.vehicleId })}>
          <Icon name="car-outline" size={RFValue(16)} color={colors.secondary} />
          <CustomText variant="h7" fontFamily={Fonts.SemiBold} style={{ color: colors.secondary }}>
            {t('testDrive.viewVehicle')}
          </CustomText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title={t('profile.myTestDrives')}
        backgroundColor={colors.secondary}
        titleColor={colors.white}
        iconColor={colors.white}
        showNotificationIcon={false}
        onBackPress={() => navigation.goBack()}
      />

      {renderListHeader()}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      ) : (
        <FlatList
          data={testDrives}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={testDrives.length === 0 ? styles.emptyWrap : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchTestDrives(true);
              }}
              colors={[colors.secondary]}
              tintColor={colors.secondary}
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Icon name="car-sport-outline" size={RFValue(48)} color={colors.textSecondary} />
              <CustomText fontFamily={Fonts.SemiBold} variant="h5" style={{ marginTop: 16, textAlign: 'center' }}>
                {t('testDrive.emptyTitle')}
              </CustomText>
              <CustomText
                variant="h7"
                style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 24 }}>
                {t('testDrive.emptyMessage')}
              </CustomText>
            </View>
          }
          ListFooterComponent={renderDetailPanel}
        />
      )}
    </View>
  );
};

export default MyTestDrivesScreen;
