import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Feather from 'react-native-vector-icons/Feather';

import { BookingFlowLayout } from '@components/booking/BookingFlowLayout';
import { CustomerStackRoutes } from '@constants/routes';
import { DEFAULT_COORDINATES } from '@constants/indianStates';
import { useServiceBooking } from '@context/ServiceBookingContext';
import type { LocationType } from '@context/ServiceBookingContext';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ServiceBookingLocation
>;

export function ServiceBookingLocationScreen({ navigation }: Props) {
  const colors = useColors();
  const { draft, updateBooking, getService, getLocation } = useServiceBooking();
  const service = getService();
  const location = getLocation();
  const homeServiceEnabled = service?.homeService ?? false;
  const latitude = location?.latitude ?? DEFAULT_COORDINATES.latitude;
  const longitude = location?.longitude ?? DEFAULT_COORDINATES.longitude;

  const setLocationType = (locationType: LocationType) => {
    updateBooking({ locationType });
  };

  return (
    <BookingFlowLayout
      title="Choose Location"
      step={3}
      onBack={() => navigation.goBack()}
      onContinue={() => navigation.navigate(CustomerStackRoutes.ServiceBookingSummary)}
      continueDisabled={!location}
    >
      {homeServiceEnabled && (
        <View style={[styles.toggle, { backgroundColor: colors.muted }]}>
          {(['workshop', 'pickup'] as LocationType[]).map((type) => {
            const selected = draft.locationType === type;
            return (
              <Pressable
                key={type}
                style={[
                  styles.toggleBtn,
                  selected && { backgroundColor: colors.primary },
                ]}
                onPress={() => setLocationType(type)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: selected ? colors.primaryForeground : colors.textSecondary },
                  ]}
                >
                  {type === 'workshop' ? 'Workshop' : 'Home Service'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={[styles.mapWrap, { borderColor: colors.border }]}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          <Marker
            coordinate={{ latitude, longitude }}
            title={location?.name ?? 'Service location'}
            description={location?.address}
          />
        </MapView>
      </View>

      <Text style={[styles.mapHint, { color: colors.textSecondary }]}>
        {draft.locationType === 'pickup'
          ? 'Service will be performed at your location'
          : 'Service center location'}
      </Text>

      {location && (
        <View style={[styles.workshopCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <View style={styles.workshopInfo}>
            <Text style={[styles.workshopName, { color: colors.textPrimary }]}>{location.name}</Text>
            <Text style={[styles.workshopAddr, { color: colors.textSecondary }]}>{location.address}</Text>
          </View>
          <Feather name="check-circle" size={20} color={colors.icon} />
        </View>
      )}
    </BookingFlowLayout>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  mapWrap: {
    height: 180,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  map: { flex: 1 },
  mapHint: { fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  workshopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  workshopInfo: { flex: 1, gap: 4 },
  workshopName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  workshopAddr: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
});
