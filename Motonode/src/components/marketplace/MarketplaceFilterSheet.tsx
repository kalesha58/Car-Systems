import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { CATEGORIES } from '@data/mockData';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

export type MarketplaceFilterTab = 'products' | 'vehicles' | 'services';

export interface ProductFilters {
  categories: string[];
  brands: string[];
  priceRange: 'all' | 'under1k' | '1k-5k' | '5k+';
  inStockOnly: boolean;
}

export interface VehicleFilters {
  types: ('car' | 'bike')[];
  fuels: string[];
  transmissions: string[];
  brands: string[];
  priceRange: 'all' | 'under5l' | '5l-15l' | '15l+';
}

export interface ServiceFilters {
  categories: string[];
  openNow: boolean;
  priceRange: 'all' | 'under1k' | '1k-3k' | '3k+';
}

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  categories: [],
  brands: [],
  priceRange: 'all',
  inStockOnly: false,
};

export const DEFAULT_VEHICLE_FILTERS: VehicleFilters = {
  types: [],
  fuels: [],
  transmissions: [],
  brands: [],
  priceRange: 'all',
};

export const DEFAULT_SERVICE_FILTERS: ServiceFilters = {
  categories: [],
  openNow: false,
  priceRange: 'all',
};

const PRODUCT_BRANDS = ['Castrol', 'Michelin', 'Exide', 'Bosch', 'Motul'];
const VEHICLE_BRANDS = ['KTM', 'Royal Enfield', 'Tata', 'Hyundai'];
const SERVICE_CATEGORIES = [
  { id: 'detailing', label: 'Detailing' },
  { id: 'servicing', label: 'Servicing' },
  { id: 'wash', label: 'Car Wash' },
];

interface MarketplaceFilterSheetProps {
  visible: boolean;
  tab: MarketplaceFilterTab;
  productFilters: ProductFilters;
  vehicleFilters: VehicleFilters;
  serviceFilters: ServiceFilters;
  onClose: () => void;
  onApply: (
    tab: MarketplaceFilterTab,
    filters: ProductFilters | VehicleFilters | ServiceFilters,
  ) => void;
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      style={[
        styles.chip,
        {
          backgroundColor: selected ? '#EFF6FF' : colors.card,
          borderColor: selected ? '#2563EB' : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.chipText,
          { color: selected ? '#2563EB' : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable style={styles.toggleRow} onPress={onToggle}>
      <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>{label}</Text>
      <View
        style={[
          styles.toggleTrack,
          { backgroundColor: value ? '#2563EB' : colors.muted },
        ]}
      >
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </View>
    </Pressable>
  );
}

export function countActiveFilters(
  tab: MarketplaceFilterTab,
  productFilters: ProductFilters,
  vehicleFilters: VehicleFilters,
  serviceFilters: ServiceFilters,
) {
  if (tab === 'products') {
    let count = 0;
    if (productFilters.categories.length) count += 1;
    if (productFilters.brands.length) count += 1;
    if (productFilters.priceRange !== 'all') count += 1;
    if (productFilters.inStockOnly) count += 1;
    return count;
  }
  if (tab === 'vehicles') {
    let count = 0;
    if (vehicleFilters.types.length) count += 1;
    if (vehicleFilters.fuels.length) count += 1;
    if (vehicleFilters.transmissions.length) count += 1;
    if (vehicleFilters.brands.length) count += 1;
    if (vehicleFilters.priceRange !== 'all') count += 1;
    return count;
  }
  let count = 0;
  if (serviceFilters.categories.length) count += 1;
  if (serviceFilters.openNow) count += 1;
  if (serviceFilters.priceRange !== 'all') count += 1;
  return count;
}

export function MarketplaceFilterSheet({
  visible,
  tab,
  productFilters,
  vehicleFilters,
  serviceFilters,
  onClose,
  onApply,
}: MarketplaceFilterSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [draftProducts, setDraftProducts] = useState(productFilters);
  const [draftVehicles, setDraftVehicles] = useState(vehicleFilters);
  const [draftServices, setDraftServices] = useState(serviceFilters);

  useEffect(() => {
    if (visible) {
      setDraftProducts(productFilters);
      setDraftVehicles(vehicleFilters);
      setDraftServices(serviceFilters);
    }
  }, [visible, productFilters, vehicleFilters, serviceFilters]);

  const title =
    tab === 'products' ? 'Filter Products' : tab === 'vehicles' ? 'Filter Vehicles' : 'Filter Services';

  const toggleList = <T extends string>(list: T[], value: T) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const handleReset = () => {
    lightHaptic();
    if (tab === 'products') setDraftProducts(DEFAULT_PRODUCT_FILTERS);
    if (tab === 'vehicles') setDraftVehicles(DEFAULT_VEHICLE_FILTERS);
    if (tab === 'services') setDraftServices(DEFAULT_SERVICE_FILTERS);
  };

  const handleApply = () => {
    lightHaptic();
    if (tab === 'products') onApply('products', draftProducts);
    if (tab === 'vehicles') onApply('vehicles', draftVehicles);
    if (tab === 'services') onApply('services', draftServices);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {tab === 'products' && (
              <>
                <Section title="Category">
                  {CATEGORIES.slice(0, 6).map((cat) => (
                    <Chip
                      key={cat.id}
                      label={cat.label}
                      selected={draftProducts.categories.includes(cat.id)}
                      onPress={() =>
                        setDraftProducts((prev) => ({
                          ...prev,
                          categories: toggleList(prev.categories, cat.id),
                        }))
                      }
                    />
                  ))}
                </Section>

                <Section title="Brand">
                  {PRODUCT_BRANDS.map((brand) => (
                    <Chip
                      key={brand}
                      label={brand}
                      selected={draftProducts.brands.includes(brand)}
                      onPress={() =>
                        setDraftProducts((prev) => ({
                          ...prev,
                          brands: toggleList(prev.brands, brand),
                        }))
                      }
                    />
                  ))}
                </Section>

                <Section title="Price Range">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under1k', label: 'Under ₹1,000' },
                    { id: '1k-5k', label: '₹1,000 – ₹5,000' },
                    { id: '5k+', label: 'Above ₹5,000' },
                  ].map((range) => (
                    <Chip
                      key={range.id}
                      label={range.label}
                      selected={draftProducts.priceRange === range.id}
                      onPress={() =>
                        setDraftProducts((prev) => ({
                          ...prev,
                          priceRange: range.id as ProductFilters['priceRange'],
                        }))
                      }
                    />
                  ))}
                </Section>

                <ToggleRow
                  label="In stock only"
                  value={draftProducts.inStockOnly}
                  onToggle={() =>
                    setDraftProducts((prev) => ({ ...prev, inStockOnly: !prev.inStockOnly }))
                  }
                />
              </>
            )}

            {tab === 'vehicles' && (
              <>
                <Section title="Vehicle Type">
                  {[
                    { id: 'car', label: 'Car' },
                    { id: 'bike', label: 'Bike' },
                  ].map((type) => (
                    <Chip
                      key={type.id}
                      label={type.label}
                      selected={draftVehicles.types.includes(type.id as 'car' | 'bike')}
                      onPress={() =>
                        setDraftVehicles((prev) => ({
                          ...prev,
                          types: toggleList(prev.types, type.id as 'car' | 'bike'),
                        }))
                      }
                    />
                  ))}
                </Section>

                <Section title="Fuel Type">
                  {['Petrol', 'Electric', 'Diesel'].map((fuel) => (
                    <Chip
                      key={fuel}
                      label={fuel}
                      selected={draftVehicles.fuels.includes(fuel)}
                      onPress={() =>
                        setDraftVehicles((prev) => ({
                          ...prev,
                          fuels: toggleList(prev.fuels, fuel),
                        }))
                      }
                    />
                  ))}
                </Section>

                <Section title="Transmission">
                  {['Manual', 'Automatic'].map((trans) => (
                    <Chip
                      key={trans}
                      label={trans}
                      selected={draftVehicles.transmissions.includes(trans)}
                      onPress={() =>
                        setDraftVehicles((prev) => ({
                          ...prev,
                          transmissions: toggleList(prev.transmissions, trans),
                        }))
                      }
                    />
                  ))}
                </Section>

                <Section title="Brand">
                  {VEHICLE_BRANDS.map((brand) => (
                    <Chip
                      key={brand}
                      label={brand}
                      selected={draftVehicles.brands.includes(brand)}
                      onPress={() =>
                        setDraftVehicles((prev) => ({
                          ...prev,
                          brands: toggleList(prev.brands, brand),
                        }))
                      }
                    />
                  ))}
                </Section>

                <Section title="Price Range">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under5l', label: 'Under ₹5 Lakh' },
                    { id: '5l-15l', label: '₹5 – ₹15 Lakh' },
                    { id: '15l+', label: 'Above ₹15 Lakh' },
                  ].map((range) => (
                    <Chip
                      key={range.id}
                      label={range.label}
                      selected={draftVehicles.priceRange === range.id}
                      onPress={() =>
                        setDraftVehicles((prev) => ({
                          ...prev,
                          priceRange: range.id as VehicleFilters['priceRange'],
                        }))
                      }
                    />
                  ))}
                </Section>
              </>
            )}

            {tab === 'services' && (
              <>
                <Section title="Service Type">
                  {SERVICE_CATEGORIES.map((cat) => (
                    <Chip
                      key={cat.id}
                      label={cat.label}
                      selected={draftServices.categories.includes(cat.id)}
                      onPress={() =>
                        setDraftServices((prev) => ({
                          ...prev,
                          categories: toggleList(prev.categories, cat.id),
                        }))
                      }
                    />
                  ))}
                </Section>

                <Section title="Price Range">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under1k', label: 'Under ₹1,000' },
                    { id: '1k-3k', label: '₹1,000 – ₹3,000' },
                    { id: '3k+', label: 'Above ₹3,000' },
                  ].map((range) => (
                    <Chip
                      key={range.id}
                      label={range.label}
                      selected={draftServices.priceRange === range.id}
                      onPress={() =>
                        setDraftServices((prev) => ({
                          ...prev,
                          priceRange: range.id as ServiceFilters['priceRange'],
                        }))
                      }
                    />
                  ))}
                </Section>

                <ToggleRow
                  label="Open now only"
                  value={draftServices.openNow}
                  onToggle={() =>
                    setDraftServices((prev) => ({ ...prev, openNow: !prev.openNow }))
                  }
                />
              </>
            )}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable style={[styles.resetBtn, { borderColor: colors.border }]} onPress={handleReset}>
              <Text style={[styles.resetText, { color: colors.textPrimary }]}>Reset</Text>
            </Pressable>
            <Pressable style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Dimensions.get('window').height * 0.82,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  body: { paddingHorizontal: 20, paddingBottom: 12, gap: 18 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  resetBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  applyBtn: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
