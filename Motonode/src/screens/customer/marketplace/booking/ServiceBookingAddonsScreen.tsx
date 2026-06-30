import React from 'react';
import { StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { BookingFlowLayout } from '@components/booking/BookingFlowLayout';
import { CustomerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ServiceBookingAddons
>;

export function ServiceBookingAddonsScreen({ navigation }: Props) {
  const colors = useColors();

  useFocusEffect(
    React.useCallback(() => {
      navigation.replace(CustomerStackRoutes.ServiceBookingSummary);
    }, [navigation]),
  );

  return (
    <BookingFlowLayout title="Add-ons" step={4} onBack={() => navigation.goBack()} onContinue={() => {}}>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Add-ons are not available for this service.
      </Text>
    </BookingFlowLayout>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 24 },
});
