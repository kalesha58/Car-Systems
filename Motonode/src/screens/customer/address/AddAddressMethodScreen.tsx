import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { AddressOptionCard, PrivacyNoticeBanner } from '@components/address';
import { CustomerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import { requestLocationPermission, showLocationSettingsAlert } from '@utils/locationPermissions';
import { lightHaptic } from '@utils/haptics';

type Method = 'live' | 'manual';

type NavigationProp = NativeStackNavigationProp<{
  [CustomerStackRoutes.AddAddressMethod]: undefined;
  [CustomerStackRoutes.AddLiveLocation]: undefined;
  [CustomerStackRoutes.ManualAddress]: undefined;
}>;

export function AddAddressMethodScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [selected, setSelected] = useState<Method>('live');

  const goLive = async () => {
    const permission = await requestLocationPermission();
    if (permission === 'granted') {
      navigation.navigate(CustomerStackRoutes.AddLiveLocation);
      return;
    }

    if (permission === 'blocked') {
      showLocationSettingsAlert();
      return;
    }

    Alert.alert(
      'Location Permission Required',
      'Please enable location permission to use live location. You can still add addresses manually.',
      [
        { text: 'Enter Manually', onPress: () => navigation.navigate(CustomerStackRoutes.ManualAddress) },
        { text: 'OK', style: 'cancel' },
      ],
    );
  };

  const handleContinue = () => {
    lightHaptic();
    if (selected === 'live') {
      void goLive();
    } else {
      navigation.navigate(CustomerStackRoutes.ManualAddress);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Add Address</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: colors.textPrimary }]}>
          Choose how you want to add address
        </Text>
        <Text style={[styles.subheading, { color: colors.textSecondary }]}>
          You can share your live location or enter address manually
        </Text>

        <View style={styles.cards}>
          <AddressOptionCard
            icon="map-pin"
            iconColor="#2563EB"
            iconBg="#DBEAFE"
            title="Use Live Location"
            description="Share your current live location and save as address"
            selected={selected === 'live'}
            onPress={() => {
              setSelected('live');
              void goLive();
            }}
          />
          <AddressOptionCard
            icon="edit-2"
            iconColor="#059669"
            iconBg="#D1FAE5"
            title="Enter Manually"
            description="Type your address details manually"
            selected={selected === 'manual'}
            onPress={() => {
              setSelected('manual');
              navigation.navigate(CustomerStackRoutes.ManualAddress);
            }}
          />
        </View>

        <PrivacyNoticeBanner />

        <Pressable
          style={[styles.continueBtn, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
        >
          <Text style={[styles.continueText, { color: colors.primaryForeground }]}>Continue</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerSpacer: { width: 32 },
  content: { padding: 20, gap: 20 },
  heading: { fontSize: 22, fontFamily: 'Inter_700Bold', lineHeight: 28 },
  subheading: { fontSize: 14, lineHeight: 20, marginTop: -8 },
  cards: { gap: 14 },
  continueBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  continueText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
});
