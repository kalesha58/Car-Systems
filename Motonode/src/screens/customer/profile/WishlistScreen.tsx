import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { ProductCard } from '@components/cards/ProductCard';
import { CustomerStackRoutes } from '@constants/routes';
import { useWishlist } from '@context/WishlistContext';
import { useColors } from '@hooks/useColors';
import { getProductById } from '@services/product.service';
import type { IProduct } from '@app-types/product';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { getProductId } from '@utils/displayMappers';
import { lightHaptic } from '@utils/haptics';

type ProfileStackParamList = {
  [CustomerStackRoutes.Wishlist]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
};

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  typeof CustomerStackRoutes.Wishlist
>;

export function WishlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { wishlist, toggleWishlist } = useWishlist();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWishlist = useCallback(
    async (opts?: { refreshing?: boolean }) => {
      if (opts?.refreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      if (wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        const results = await Promise.all(
          wishlist.map(async (id) => {
            try {
              const response = await getProductById(id);
              const payload = response.Response as IProduct | { products?: IProduct[] } | undefined;
              if (!payload) return null;
              if ('products' in payload && Array.isArray(payload.products)) {
                return payload.products[0] ?? null;
              }
              return payload as IProduct;
            } catch {
              return null;
            }
          }),
        );
        setProducts(results.filter((item): item is IProduct => Boolean(item)));
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load wishlist'));
        setProducts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [wishlist],
  );

  useEffect(() => {
    void loadWishlist();
  }, [loadWishlist]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => getProductId(item)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 24 },
            products.length === 0 && styles.emptyList,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadWishlist({ refreshing: true })}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="heart" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No saved items</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Tap the heart on products to save them here.
              </Text>
              {error ? (
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              variant="grid"
              style={styles.gridItem}
              onPress={() => {
                lightHaptic();
                navigation.navigate(CustomerStackRoutes.ProductDetail, { id: getProductId(item) });
              }}
              onWishlistPress={() => {
                lightHaptic();
                toggleWishlist(getProductId(item));
              }}
            />
          )}
        />
      )}
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  gridItem: { flex: 1, maxWidth: '48%' },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 10, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  errorText: { fontSize: 13, textAlign: 'center', marginTop: 8 },
});
