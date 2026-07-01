import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { AddressListItem } from '@components/address';
import { PrimaryButton } from '@components/buttons';
import { CustomerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import { deleteAddress, getSavedAddresses, updateAddress } from '@services/address.service';
import type { IAddress } from '@app-types/address';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { setSelectedDeliveryAddressId } from '@utils/deliveryAddress';
import { lightHaptic, successHaptic } from '@utils/haptics';
import { AddressListSkeleton } from '@components/loaders';

type AddressStackParamList = {
  [CustomerStackRoutes.SavedAddresses]: { selectMode?: boolean } | undefined;
  [CustomerStackRoutes.AddAddressMethod]: undefined;
  [CustomerStackRoutes.AddLiveLocation]: { address?: IAddress; isEdit?: boolean };
  [CustomerStackRoutes.ManualAddress]: { address?: IAddress; isEdit?: boolean };
};

type NavigationProp = NativeStackNavigationProp<
  AddressStackParamList,
  typeof CustomerStackRoutes.SavedAddresses
>;

export function SavedAddressesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<AddressStackParamList, typeof CustomerStackRoutes.SavedAddresses>>();
  const selectMode = route.params?.selectMode ?? false;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const loadAddresses = useCallback(async (opts?: { refreshing?: boolean }) => {
    if (opts?.refreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getSavedAddresses();
      setAddresses(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load addresses'));
      setAddresses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAddresses();
    }, [loadAddresses]),
  );

  const handleSetDefault = async (item: IAddress) => {
    if (!item._id) return;
    setSettingDefaultId(item._id);
    try {
      await updateAddress(item._id, { isDefault: true });
      successHaptic();
      await loadAddresses();
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err, 'Failed to set default address'));
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDelete = (item: IAddress) => {
    Alert.alert('Delete Address', `Delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!item._id) return;
          try {
            setDeletingId(item._id);
            await deleteAddress(item._id);
            await loadAddresses();
          } catch (err) {
            Alert.alert('Error', getApiErrorMessage(err, 'Failed to delete address'));
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const handleEdit = (item: IAddress) => {
    lightHaptic();
    if (item.coordinates?.latitude && item.coordinates?.longitude) {
      navigation.navigate(CustomerStackRoutes.AddLiveLocation, { address: item, isEdit: true });
    } else {
      navigation.navigate(CustomerStackRoutes.ManualAddress, { address: item, isEdit: true });
    }
  };

  const handleSelect = async (item: IAddress) => {
    if (!item._id) return;
    await setSelectedDeliveryAddressId(item._id);
    successHaptic();
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>{selectMode ? 'Choose Address' : 'My Addresses'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={{ padding: 16 }}>
          <AddressListSkeleton />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={item => item._id ?? item.fullAddress}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 100 },
            addresses.length === 0 && styles.emptyList,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadAddresses({ refreshing: true })} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="map-pin" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No saved addresses</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Add an address to use for deliveries and services.
              </Text>
              {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
            </View>
          }
          renderItem={({ item }) => (
            <AddressListItem
              address={item}
              selectMode={selectMode}
              onSelect={() => void handleSelect(item)}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
              deleting={deletingId === item._id}
              onSetDefault={() => void handleSetDefault(item)}
              settingDefault={settingDefaultId === item._id}
            />
          )}
        />
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background }]}>
        <PrimaryButton
          label="Add Address"
          onPress={() => {
            lightHaptic();
            navigation.navigate(CustomerStackRoutes.AddAddressMethod);
          }}
        />
      </View>
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
  list: { padding: 16, gap: 12 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 10, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  errorText: { fontSize: 13, textAlign: 'center', marginTop: 8 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
});
