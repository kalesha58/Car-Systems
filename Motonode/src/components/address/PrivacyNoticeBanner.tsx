import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';

export function PrivacyNoticeBanner() {
  const colors = useColors();

  return (
    <View style={[styles.banner, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
      <View style={[styles.iconWrap, { backgroundColor: '#DBEAFE' }]}>
        <Feather name="shield" size={18} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Your Privacy is Important</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          Your live location is used only to fill the address. It is not stored or shared.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, gap: 4 },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  text: { fontSize: 13, lineHeight: 18 },
});
