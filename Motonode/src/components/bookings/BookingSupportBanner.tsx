import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

export function BookingSupportBanner() {
  const colors = useColors();

  return (
    <View style={[styles.banner, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.card }]}>
        <Feather name="headphones" size={18} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Need Help?</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Have any questions about your booking?
        </Text>
      </View>
      <Pressable
        style={[styles.btn, { backgroundColor: colors.primary }]}
        onPress={() => {
          lightHaptic();
          Alert.alert('Support', 'Our team will contact you shortly.');
        }}
      >
        <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Contact Support</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
});
