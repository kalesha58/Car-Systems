import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import type { IService } from '../../../types/service';
import { useColors } from '@hooks/useColors';
import { getServiceDurationLabel } from '@utils/displayMappers';

interface ServiceSummaryCardProps {
  service: IService;
}

export function ServiceSummaryCard({ service }: ServiceSummaryCardProps) {
  const colors = useColors();
  const imageUri = service.images?.[0];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
          <Feather name="tool" size={24} color={colors.icon} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
          {service.name}
        </Text>
        {service.description ? (
          <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>
            {service.description}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Feather name="clock" size={12} color={colors.textTertiary} />
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {getServiceDurationLabel(service)}
          </Text>
        </View>
      </View>
      <View style={styles.priceCol}>
        <Text style={[styles.price, { color: colors.textPrimary }]}>₹{service.price.toLocaleString('en-IN')}</Text>
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
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontFamily: 'Inter_700Bold', lineHeight: 18 },
  desc: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  meta: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  priceCol: { alignItems: 'flex-end', gap: 2 },
  price: { fontSize: 16, fontFamily: 'Inter_700Bold' },
});
