import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import type { Service } from '@data/mockData';

interface ServiceCardProps {
  service: Service;
  onNavigate?: () => void;
  onBookPress?: () => void;
}

export function ServiceCard({ service, onNavigate, onBookPress }: ServiceCardProps) {
  const colors = useColors();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.95 : 1 },
      ]}
      onPress={onNavigate}
    >
      <Image source={{ uri: service.image }} style={styles.image} resizeMode="cover" />
      <View style={styles.info}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
              {service.name}
            </Text>
            <Text style={[styles.dealer, { color: colors.textSecondary }]} numberOfLines={1}>
              {service.dealerName}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: service.isOpen
                  ? colors.success + '20'
                  : colors.destructive + '20',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: service.isOpen ? colors.success : colors.destructive },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: service.isOpen ? colors.success : colors.destructive },
              ]}
            >
              {service.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Feather name="star" size={12} color={colors.starActive} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {' '}
              {service.rating} ({service.reviews})
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={12} color={colors.textTertiary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {' '}
              {service.distance}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={12} color={colors.textTertiary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {' '}
              {service.duration}
            </Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.textPrimary }]}>
            ₹{service.price.toLocaleString('en-IN')}
          </Text>
          <Pressable
            style={[styles.bookBtn, { backgroundColor: colors.primary }]}
            onPress={onBookPress}
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
