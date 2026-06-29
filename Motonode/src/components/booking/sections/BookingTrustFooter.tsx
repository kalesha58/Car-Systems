import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { themeLight } from '@theme/colors';

export function BookingTrustFooter() {
  return (
    <View style={styles.wrap}>
      <View style={styles.secureBanner}>
        <Feather name="shield" size={16} color="#E60012" />
        <Text style={styles.secureText}>
          <Text style={styles.secureBold}>Secure Booking: </Text>
          Your data is protected & secure.
        </Text>
      </View>
      <Pressable style={styles.policyRow}>
        <Feather name="file-text" size={14} color="#64748B" />
        <Text style={styles.policyText}>View Cancellation Policy</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  secureBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 12,
  },
  secureText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', color: '#334155', lineHeight: 16 },
  secureBold: { fontFamily: 'Inter_700Bold', color: themeLight.textPrimary },
  policyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  policyText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#64748B' },
});
