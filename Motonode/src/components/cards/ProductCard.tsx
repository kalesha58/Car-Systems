import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useWishlist } from '@context/WishlistContext';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';
import type { Product } from '@data/mockData';

interface ProductCardProps {
  product: Product;
  style?: object;
  onPress?: () => void;
  onWishlistPress?: () => void;
}

export function ProductCard({ product, style, onPress, onWishlistPress }: ProductCardProps) {
  const colors = useColors();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const liked = isWishlisted(product.id);

  const handleWishlist = () => {
    lightHaptic();
    if (onWishlistPress) {
      onWishlistPress();
    } else {
      toggleWishlist(product.id);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, opacity: pressed ? 0.95 : 1 },
        style,
      ]}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        {product.discount > 0 && (
          <View style={[styles.discountBadge, { backgroundColor: colors.destructive }]}>
            <Text style={styles.discountText}>{product.discount}% OFF</Text>
          </View>
        )}
        <Pressable
          style={[styles.wishlistBtn, { backgroundColor: colors.card }]}
          onPress={handleWishlist}
          hitSlop={8}
        >
          <Feather
            name="heart"
            size={16}
            color={liked ? colors.destructive : colors.textSecondary}
          />
        </Pressable>
        {!product.inStock && (
          <View style={[styles.outOfStock, { backgroundColor: colors.overlay }]}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.brand, { color: colors.primary }]} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.ratingRow}>
          <Feather name="star" size={12} color={colors.starActive} />
          <Text style={[styles.rating, { color: colors.textSecondary }]}>
            {' '}
            {product.rating} ({product.reviews})
          </Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.textPrimary }]}>
            ₹{product.price.toLocaleString('en-IN')}
          </Text>
          {product.discount > 0 && (
            <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 160,
  },
  imageContainer: { position: 'relative', height: 140 },
  image: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  outOfStock: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  info: { padding: 10 },
  brand: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  name: { fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  rating: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  originalPrice: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'line-through',
  },
});
