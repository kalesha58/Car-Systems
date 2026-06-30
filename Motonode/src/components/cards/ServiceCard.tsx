import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import type { IService } from '@app-types/service';
import { getServiceDurationLabel } from '@utils/displayMappers';

interface ServiceCardProps {
  service: IService;
  onNavigate?: () => void;
  onBookPress?: () => void;
}

export function ServiceCard({ service, onNavigate, onBookPress }: ServiceCardProps) {
  const colors = useColors();
  const imageUri = service.images?.[0] || '';
  const isActive = service.isActive !== false;
  const dealerName = service.dealer?.businessName || '';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.95 : 1 },
      ]}
      onPress={onNavigate}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, { backgroundColor: colors.border }]} />
      )}
      <View style={styles.info}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
              {service.name}
            </Text>
            {dealerName ? (
              <Text style={[styles.dealer, { color: colors.textSecondary }]} numberOfLines={1}>
                {dealerName}
              </Text>
            ) : null}
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isActive ? colors.success + '20' : colors.destructive + '20',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? colors.success : colors.destructive },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isActive ? colors.success : colors.destructive },
              ]}
            >
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={12} color={colors.textTertiary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {' '}
              {getServiceDurationLabel(service)}
            </Text>
          </View>
          {service.homeService ? (
            <View style={styles.metaItem}>
              <Feather name="home" size={12} color={colors.textTertiary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}> Home</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.textPrimary }]}>
            ₹{service.price.toLocaleString('en-IN')}
          </Text>
          <Pressable
            style={[styles.bookBtn, { backgroundColor: colors.primary }]}
            onPress={() => onBookPress?.()}
          >
            <Text style={styles.bookBtnText}>Book Now</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, marginBottom: 12 },
  image: { width: '100%', height: 140 },
  info: { padding: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  dealer: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  meta: { flexDirection: 'row', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  bookBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  bookBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
