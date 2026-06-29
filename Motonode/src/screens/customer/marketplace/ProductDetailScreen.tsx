import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { CustomerStackRoutes } from '@constants/routes';
import { useCart, useWishlist } from '@context/index';
import { PRODUCTS } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import { lightHaptic, successHaptic } from '@utils/haptics';

type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: undefined;
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
};

type ProductDetailScreenProps = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ProductDetail
>;

export function ProductDetailScreen({ route, navigation }: ProductDetailScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const product = PRODUCTS.find((p) => p.id === id);
  const { addItem, isInCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[styles.notFound, { color: colors.textPrimary }]}>Product not found</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const inCart = isInCart(product.id);
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = () => {
    successHaptic();
    addItem(product);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable style={[styles.iconBtn, { backgroundColor: colors.card }]} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.card }]}
          onPress={() => {
            lightHaptic();
            toggleWishlist(product.id);
          }}
        >
          <Feather name="heart" size={22} color={wishlisted ? colors.destructive : colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {product.discount > 0 && (
            <View style={[styles.discountBadge, { backgroundColor: colors.destructive }]}>
              <Text style={styles.discountText}>{product.discount}% OFF</Text>
            </View>
          )}
          <Text style={[styles.brand, { color: colors.primary }]}>{product.brand}</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{product.name}</Text>

          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Feather key={star} name="star" size={16} color={star <= Math.floor(product.rating) ? colors.starActive : colors.textTertiary} />
            ))}
            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{product.rating} ({product.reviews.toLocaleString()} reviews)</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.textPrimary }]}>₹{product.price.toLocaleString('en-IN')}</Text>
            {product.discount > 0 && (
              <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>₹{product.originalPrice.toLocaleString('en-IN')}</Text>
            )}
            <View style={[styles.stockBadge, { backgroundColor: product.inStock ? colors.success + '20' : colors.destructive + '20' }]}>
              <Text style={[styles.stockText, { color: product.inStock ? colors.success : colors.destructive }]}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Description</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{product.description}</Text>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tags</Text>
          <View style={styles.tagsRow}>
            {product.tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>#{tag}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.deliveryCard, { backgroundColor: colors.card }]}>
            <Feather name="truck" size={20} color={colors.primary} />
            <View>
              <Text style={[styles.deliveryTitle, { color: colors.textPrimary }]}>Free Delivery</Text>
              <Text style={[styles.deliverySubtitle, { color: colors.textSecondary }]}>Estimated 3-5 business days</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
        {inCart ? (
          <Pressable
            style={[styles.cartBtn, { backgroundColor: colors.success }]}
            onPress={() => navigation.navigate(CustomerStackRoutes.Cart)}
          >
            <Feather name="shopping-cart" size={20} color="#fff" />
            <Text style={styles.cartBtnText}>View Cart</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.cartBtn, { backgroundColor: product.inStock ? colors.primary : colors.disabled, opacity: pressed ? 0.9 : 1 }]}
            onPress={handleAddToCart}
            disabled={!product.inStock}
          >
            <Feather name="shopping-cart" size={20} color="#fff" />
            <Text style={styles.cartBtnText}>{product.inStock ? 'Add to Cart' : 'Out of Stock'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  scrollContent: { paddingBottom: 100 },
  productImage: { width: '100%', height: 300 },
  content: { padding: 20, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  discountBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
  discountText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  brand: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  name: { fontSize: 22, fontFamily: 'Inter_700Bold', lineHeight: 30, marginBottom: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  ratingText: { fontSize: 13, fontFamily: 'Inter_400Regular', marginLeft: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  price: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  originalPrice: { fontSize: 16, fontFamily: 'Inter_400Regular', textDecorationLine: 'line-through' },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stockText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1, marginVertical: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  description: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  deliveryCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, marginTop: 16 },
  deliveryTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  deliverySubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  bottomBar: { borderTopWidth: 1, padding: 16 },
  cartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  cartBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  notFound: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  backLink: { fontSize: 15, fontFamily: 'Inter_500Medium' },
});
