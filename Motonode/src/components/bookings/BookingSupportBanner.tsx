import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { lightHaptic } from '@utils/haptics';

export function BookingSupportBanner() {
  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Feather name="headphones" size={18} color="#2563EB" />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Need Help?</Text>
        <Text style={styles.sub}>Have any questions about your booking?</Text>
      </View>
      <Pressable
        style={styles.btn}
        onPress={() => {
          lightHaptic();
          Alert.alert('Support', 'Our team will contact you shortly.');
        }}
      >
        <Text style={styles.btnText}>Contact Support</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF1F2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#0F172A' },
  sub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#64748B', marginTop: 2 },
  btn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff' },
});
