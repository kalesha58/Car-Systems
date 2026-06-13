import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@hooks/useTheme';
import CustomText from '@components/ui/CustomText';
import { Fonts, fontStyle } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomHeader from '@components/ui/CustomHeader';
import Loader from '@components/common/Loader/Loader';
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
  const [testDrives, setTestDrives] = useState<ITestDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchTestDrives = useCallback(async () => {
    try {
      const response = await getUserTestDrives({
        status: statusFilter !== 'all' ? (statusFilter as TestDriveStatus) : undefined,
        limit: 100,
      });
      if (response.success && response.Response) {
        setTestDrives(response.Response.testDrives || []);
      }
    } catch (error: any) {
      showError(error?.response?.data?.message || t('testDrive.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, showError, t]);

  useEffect(() => {
    setLoading(true);
    fetchTestDrives();
  }, [fetchTestDrives]);

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
    filterContainer: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    filterScroll: { paddingHorizontal: 12, paddingVertical: 10 },
    filterButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginRight: 8 },
    filterActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
    filterInactive: { backgroundColor: 'transparent', borderColor: colors.border },
    listContent: { padding: 12, paddingBottom: 24 },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      gap: 12,
    },
    thumb: {
      width: 72,
      height: 72,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
    },
    cardBody: { flex: 1 },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      alignSelf: 'flex-start',
    },
    detailPanel: {
      margin: 12,
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  });

  const renderCard = ({ item }: { item: ITestDrive }) => {
    const statusColor = getStatusColor(item.status);
    const isSelected = selectedId === item.id;

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && { borderColor: colors.secondary }]}
        activeOpacity={0.85}
        onPress={() => setSelectedId(isSelected ? null : item.id)}>
        {item.vehicleImage ? (
          <Image source={{ uri: item.vehicleImage }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, { justifyContent: 'center', alignItems: 'center' }]}>
            <Icon name="car-sport-outline" size={RFValue(22)} color={colors.textSecondary} />
          </View>
        )}
        <View style={styles.cardBody}>
          <CustomText fontFamily={Fonts.SemiBold} variant="h6" numberOfLines={2}>
            {item.vehicleLabel || t('testDrive.vehicleFallback')}
          </CustomText>
          {item.dealerName ? (
            <CustomText variant="h8" style={{ color: colors.textSecondary, marginTop: 2 }}>
              {item.dealerName}
            </CustomText>
          ) : null}
          <CustomText variant="h8" style={{ color: colors.textSecondary, marginTop: 4 }}>
            {formatDate(item.preferredDate)} · {item.preferredTime}
          </CustomText>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', marginTop: 8 }]}>
            <CustomText variant="h9" fontFamily={Fonts.SemiBold} style={{ color: statusColor, textTransform: 'capitalize' }}>
              {item.status}
            </CustomText>
          </View>
        </View>
      </TouchableOpacity>
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterButton, active ? styles.filterActive : styles.filterInactive]}
              onPress={() => setStatusFilter(f.key)}>
              <CustomText
                variant="h8"
                fontFamily={Fonts.Medium}
                style={{ color: active ? colors.white : colors.text }}>
                {t(f.labelKey)}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <Loader />
      ) : testDrives.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Icon name="car-sport-outline" size={RFValue(40)} color={colors.textSecondary} />
          <CustomText fontFamily={Fonts.SemiBold} variant="h5" style={{ marginTop: 16, textAlign: 'center' }}>
            {t('testDrive.emptyTitle')}
          </CustomText>
          <CustomText variant="h7" style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            {t('testDrive.emptyMessage')}
          </CustomText>
        </View>
      ) : (
        <FlatList
          data={testDrives}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTestDrives(); }} />
          }
          ListFooterComponent={
            selectedDrive ? (
              <View style={styles.detailPanel}>
                <CustomText fontFamily={Fonts.Bold} variant="h5" style={{ marginBottom: 12 }}>
                  {t('testDrive.requestDetails')}
                </CustomText>
                <CustomText variant="h7" style={{ marginBottom: 6 }}>
                  {t('testDrive.scheduledFor')}: {formatDate(selectedDrive.preferredDate)} · {selectedDrive.preferredTime}
                </CustomText>
                {selectedDrive.notes ? (
                  <CustomText variant="h7" style={{ marginBottom: 6 }}>
                    {t('testDrive.yourNotes')}: {selectedDrive.notes}
                  </CustomText>
                ) : null}
                {(selectedDrive.status === 'rejected' || selectedDrive.status === 'cancelled') && selectedDrive.dealerNotes ? (
                  <CustomText variant="h7" style={{ marginBottom: 6, color: colors.error }}>
                    {t('testDrive.dealerNotes')}: {selectedDrive.dealerNotes}
                  </CustomText>
                ) : null}
                <TouchableOpacity
                  style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  onPress={() => navigate('VehicleDetail', { vehicleId: selectedDrive.vehicleId })}>
                  <Icon name="car-outline" size={RFValue(16)} color={colors.secondary} />
                  <CustomText variant="h7" fontFamily={Fonts.SemiBold} style={{ color: colors.secondary }}>
                    {t('testDrive.viewVehicle')}
                  </CustomText>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

export default MyTestDrivesScreen;
