import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { Service } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import { themeLight } from '@theme/colors';

interface ServiceSummaryCardProps {
  service: Service;
}

export function ServiceSummaryCard({ service }: ServiceSummaryCardProps) {
  const colors = useColors();
  const originalPrice = Math.round(service.price / 0.67);
  const discountPct = Math.round((1 - service.price / originalPrice) * 100);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Image source={{ uri: service.image }} style={styles.image} />
      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
          {service.name}
        </Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
          {service.description}
        </Text>
        <View style={styles.metaRow}>
          <Feather name="clock" size={12} color={colors.textTertiary} />
          <Text style={[styles.meta, { color: colors.textSecondary }]}>{service.duration}</Text>
          <Feather name="star" size={12} color="#F59E0B" style={{ marginLeft: 8 }} />
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {service.rating} ({service.reviews} reviews)
          </Text>
        </View>
      </View>
      <View style={styles.priceCol}>
        <Text style={styles.price}>₹{service.price.toLocaleString('en-IN')}</Text>
        <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>
          ₹{originalPrice.toLocaleString('en-IN')}
        </Text>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discountPct}% OFF</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  image: { width: 72, height: 72, borderRadius: 12 },
  body: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontFamily: 'Inter_700Bold', lineHeight: 18 },
  desc: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  meta: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  priceCol: { alignItems: 'flex-end', gap: 2 },
  price: { fontSize: 16, fontFamily: 'Inter_700Bold', color: themeLight.textSecondary },
  originalPrice: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  discountText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#DC2626' },
});
