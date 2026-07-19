import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';

export function PaymentMethodsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
            <Feather name="credit-card" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Pay at checkout</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Cards, UPI, and wallets are selected when you place an order. Saved payment options will
            appear here once available for your account.
          </Text>
        </View>
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
  content: { padding: 16 },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  body: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
});
