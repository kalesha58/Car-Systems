import React, { FC } from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '@components/ui/SkeletonLoader';
import { useTheme } from '@hooks/useTheme';
import { RFValue } from 'react-native-responsive-fontsize';

const PreBookingSkeleton: FC = () => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
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
      width: 80,
      height: RFValue(20),
      borderRadius: 12,
    },
    title: {
      width: 150,
      height: RFValue(16),
      borderRadius: 4,
    },
    vehicleInfo: {
      width: 120,
      height: RFValue(12),
      borderRadius: 4,
      marginBottom: 6,
    },
    dateTime: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    dateIcon: {
      width: RFValue(14),
      height: RFValue(14),
      borderRadius: 2,
      marginRight: 6,
    },
    dateText: {
      width: 100,
      height: RFValue(12),
      borderRadius: 4,
    },
    notes: {
      width: '80%',
      height: RFValue(12),
      borderRadius: 4,
      marginTop: 6,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 10,
    },
    actionButton: {
      flex: 1,
      height: RFValue(36),
      borderRadius: 6,
    },
  });

  return (
    <View style={styles.preBookingCard}>
      <View style={styles.cardHeader}>
        <SkeletonLoader style={styles.title} />
        <SkeletonLoader style={styles.statusBadge} />
      </View>

      <SkeletonLoader style={styles.vehicleInfo} />

      <View style={styles.dateTime}>
        <SkeletonLoader style={styles.dateIcon} />
        <SkeletonLoader style={styles.dateText} />
      </View>

      <SkeletonLoader style={styles.notes} />

      <View style={styles.actionsContainer}>
        <SkeletonLoader style={styles.actionButton} />
        <SkeletonLoader style={styles.actionButton} />
      </View>
    </View>
  );
};

export default PreBookingSkeleton;
