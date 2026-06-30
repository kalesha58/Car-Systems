import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { ProductCard } from '@components/cards/ProductCard';
import { CustomerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import { getProducts } from '@services/product.service';
import type { IProduct } from '@app-types/product';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { getProductId } from '@utils/displayMappers';

const RECENT = ['Castrol Engine Oil', 'KTM Duke 390', 'Michelin Tyre', 'Helmet', 'Service'];
const TRENDING = ['Engine Oil', 'Helmets', 'Tyres', 'Brake Pads', 'Chain Lube'];

type CustomerStackParamList = {
  [CustomerStackRoutes.CustomerTabs]: undefined;
  [CustomerStackRoutes.Cart]: undefined;
  [CustomerStackRoutes.Search]: undefined;
  [CustomerStackRoutes.Notifications]: undefined;
  [CustomerStackRoutes.ProductDetail]: { id: string };
  [CustomerStackRoutes.VehicleDetail]: { id: string };
  [CustomerStackRoutes.AiAssistant]: undefined;
};

type SearchNavigationProp = NativeStackNavigationProp<
  CustomerStackParamList,
  typeof CustomerStackRoutes.Search
>;

export function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SearchNavigationProp>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getProducts({ search: query.trim(), limit: 30 });
        if (cancelled) return;
        if (response.success && response.Response?.products) {
          setResults(response.Response.products);
        } else {
          setResults([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Search failed'));
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const showResults = query.trim().length >= 2;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 8 }]}>
        <View style={styles.searchRow}>
          <Pressable onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </Pressable>
          <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Feather name="search" size={18} color="rgba(255,255,255,0.7)" />
            <TextInput
              style={[styles.input, { color: '#fff' }]}
              placeholder="Search products, vehicles, services..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <Feather name="x" size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {!showResults ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Recent Searches
              </Text>
              <View style={styles.tagsRow}>
                {RECENT.map((item) => (
                  <Pressable
                    key={item}
                    style={[styles.tag, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setQuery(item)}
                  >
                    <Feather name="clock" size={13} color={colors.textTertiary} />
                    <Text style={[styles.tagText, { color: colors.textSecondary }]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Trending</Text>
              <View style={styles.tagsRow}>
                {TRENDING.map((item) => (
                  <Pressable
                    key={item}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: colors.primary + '15',
                        borderColor: colors.primary + '30',
                      },
                    ]}
                    onPress={() => setQuery(item)}
                  >
                    <Feather name="trending-up" size={13} color={colors.primary} />
                    <Text style={[styles.tagText, { color: colors.primary }]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          }
          showsVerticalScrollIndicator={false}
        />
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.noResults}>
          <Feather name="search" size={48} color={colors.textTertiary} />
          <Text style={[styles.noResultsTitle, { color: colors.textPrimary }]}>
            No results for "{query}"
          </Text>
          <Text style={[styles.noResultsSubtitle, { color: colors.textSecondary }]}>
            {error ?? 'Try different keywords or browse categories'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(i) => getProductId(i)}
          numColumns={2}
          contentContainerStyle={styles.resultsContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              {results.length} results found
            </Text>
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              style={styles.resultItem}
              onPress={() =>
                navigation.navigate(CustomerStackRoutes.ProductDetail, { id: getProductId(item) })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noResults: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  noResultsTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  noResultsSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  resultsContent: { padding: 16 },
  resultsCount: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 12 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  resultItem: { flex: 1 },
});
