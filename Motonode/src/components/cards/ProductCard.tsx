import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useCart } from '@context/CartContext';
import { useWishlist } from '@context/WishlistContext';
import { useToast } from '@context/ToastContext';
import { useColors } from '@hooks/useColors';
import { cardShadow } from '@utils/shadows';
import { lightHaptic } from '@utils/haptics';
import type { IProduct } from '@app-types/product';
import { getProductId } from '@utils/displayMappers';
import { OrderItemThumbnail } from '@components/orders/OrderItemThumbnail';

interface ProductCardProps {
  product: IProduct;
  style?: object;
  variant?: 'compact' | 'grid';
  showAddToCart?: boolean;
  onPress?: () => void;
  onWishlistPress?: () => void;
}

const isWeb = Platform.OS === 'web';

export function ProductCard({
  product,
  style,
  variant = 'compact',
  showAddToCart = false,
  onPress,
  onWishlistPress,
}: ProductCardProps) {
  const colors = useColors();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const productId = getProductId(product);
  const liked = isWishlisted(productId);
  const imageUri = product.images?.find((uri) => uri && !uri.includes('placehold.co')) || '';
  const discount = Math.round(product.discountPercentage ?? 0);
  const inStock = product.stock > 0 && product.status === 'active';
  const dealerName = product.dealer?.businessName;
  const isGrid = variant === 'grid';
  const compactFluid = !isGrid && isWeb;

  const handleWishlist = () => {
    lightHaptic();
    if (onWishlistPress) {
      onWishlistPress();
    } else {
      toggleWishlist(productId);
    }
  };

  const handleAddToCart = () => {
    lightHaptic();
    addItem(product);
    showToast(`${product.name} added to cart!`, 'success');
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isGrid ? styles.cardGrid : compactFluid ? styles.cardCompactFluid : styles.cardCompact,
        cardShadow,
        { backgroundColor: colors.card, opacity: pressed ? 0.95 : 1 },
        style,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.imageContainer,
          isGrid && styles.imageContainerGrid,
          isGrid && isWeb && styles.imageContainerGridWeb,
          { backgroundColor: colors.muted },
        ]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <OrderItemThumbnail iconSize={28} style={styles.image} />
        )}
        {discount > 0 && (
          <View
            style={[
              styles.discountBadge,
              isWeb && styles.discountBadgeWeb,
              { backgroundColor: colors.destructive },
            ]}
          >
            <Text style={[styles.discountText, isWeb && styles.discountTextWeb]}>
              {discount}% OFF
            </Text>
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
            color={liked ? colors.destructive : colors.icon}
          />
        </Pressable>
        {!inStock && (
          <View style={[styles.outOfStock, { backgroundColor: colors.overlay }]}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.brand, { color: colors.textSecondary }]} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
          {product.name}
        </Text>
        {dealerName && (
          <View style={styles.dealerRow}>
            <Feather name="map-pin" size={9} color={colors.textSecondary} style={{ marginTop: 1 }} />
            <Text style={[styles.dealerText, { color: colors.textSecondary }]} numberOfLines={1}>
              {dealerName}
            </Text>
          </View>
        )}
        {(product.reviewCount ?? 0) > 0 && (
          <View style={styles.ratingRow}>
            <Feather name="star" size={10} color={colors.starActive} />
            <Text style={[styles.rating, { color: colors.textSecondary }]}>
              {' '}
              {(product.averageRating ?? 0).toFixed(1)} ({product.reviewCount})
            </Text>
          </View>
        )}
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.textPrimary }]}>
            ₹{product.price.toLocaleString('en-IN')}
          </Text>
          {discount > 0 && product.originalPrice != null && (
            <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </Text>
          )}
        </View>
        {showAddToCart && inStock && (
          <Pressable
            style={[
              styles.addToCartBtn,
              isWeb && styles.addToCartBtnWeb,
              { borderColor: colors.primary },
            ]}
            onPress={handleAddToCart}
          >
            <Feather name="shopping-cart" size={14} color={colors.primary} />
            <Text style={[styles.addToCartText, { color: colors.primary }]}>Add to Cart</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardCompact: { width: 150 },
  cardCompactFluid: { flex: 1, minWidth: 160, maxWidth: 220 },
  cardGrid: { width: '100%' },
  imageContainer: { position: 'relative', height: 105 },
  imageContainerGrid: { height: 155 },
  imageContainerGridWeb: { height: 170 },
  image: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  discountBadgeWeb: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  discountTextWeb: { fontSize: 11 },
  wishlistBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  outOfStock: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  info: { padding: 8 },
  brand: { fontSize: 10, fontFamily: 'Inter_600SemiBold', marginBottom: 1 },
  name: { fontSize: 12, fontFamily: 'Inter_500Medium', lineHeight: 16, marginBottom: 2 },
  dealerRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 },
  dealerText: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  rating: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  price: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  originalPrice: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'line-through',
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  addToCartBtnWeb: {
    height: 40,
    paddingVertical: 0,
    width: '100%',
  },
  addToCartText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
