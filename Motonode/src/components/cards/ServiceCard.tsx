import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import { cardShadow } from '@utils/shadows';
import type { IService } from '@app-types/service';
import { getServiceDurationLabel } from '@utils/displayMappers';

interface ServiceCardProps {
  service: IService;
  style?: object;
  variant?: 'compact' | 'list';
  onNavigate?: () => void;
  onBookPress?: () => void;
}

export function ServiceCard({
  service,
  style,
  variant = 'compact',
  onNavigate,
  onBookPress,
}: ServiceCardProps) {
  const colors = useColors();
  const imageUri = service.images?.[0] || '';
  const dealerName = service.dealer?.businessName || '';
  const isList = variant === 'list';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isList ? styles.cardList : styles.cardCompact,
        cardShadow,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.95 : 1 },
        style,
      ]}
      onPress={onNavigate}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[styles.image, isList ? styles.imageList : styles.imageCompact]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.image,
            isList ? styles.imageList : styles.imageCompact,
            styles.imagePlaceholder,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <Feather name="tool" size={28} color={colors.textTertiary} />
        </View>
      )}

      {service.homeService ? (
        <View style={[styles.homeBadge, { backgroundColor: colors.card }]}>
          <Feather name="home" size={10} color={colors.primary} />
          <Text style={[styles.homeBadgeText, { color: colors.primary }]}>Home</Text>
        </View>
      ) : null}

      <View style={[styles.info, isList && styles.infoList]}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {service.name}
        </Text>
        <Text style={[styles.dealer, { color: colors.textSecondary }]} numberOfLines={1}>
          {dealerName || 'Service partner'}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={11} color={colors.textTertiary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {getServiceDurationLabel(service)}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.textPrimary }]} numberOfLines={1}>
            ₹{service.price.toLocaleString('en-IN')}
          </Text>
          {onBookPress ? (
            <Pressable
              style={[styles.bookBtn, { backgroundColor: colors.primary }]}
              onPress={onBookPress}
            >
              <Text style={styles.bookBtnText}>Book</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardCompact: {
    width: 200,
    marginBottom: 0,
  },
  cardList: {
    width: '100%',
    marginBottom: 12,
  },
  image: {
    width: '100%',
  },
  imageCompact: {
    height: 120,
  },
  imageList: {
    height: 140,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  homeBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  info: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    height: 118,
    justifyContent: 'space-between',
  },
  infoList: {
    height: 122,
  },
  name: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  dealer: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    flexShrink: 1,
  },
  bookBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
