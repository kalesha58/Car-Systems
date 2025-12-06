import {View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useRoute, useNavigation} from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Colors, Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import {navigate} from '@utils/NavigationUtils';
import {getSavedAddresses, deleteAddress} from '@service/addressService';
import AddressItem from './AddressItem';
import {IAddress} from '../../types/address/IAddress';
import Icon from 'react-native-vector-icons/Ionicons';
import {useToast} from '@hooks/useToast';

interface RouteParams {
  selectMode?: boolean;
  preselectedAddressId?: string;
}

const SavedAddresses = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {showSuccess, showError} = useToast();
  const {selectMode, preselectedAddressId} = (route.params as RouteParams) || {};
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(
    preselectedAddressId,
  );

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await getSavedAddresses();
      setAddresses(data);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to fetch addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getSavedAddresses();
      setAddresses(data);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to refresh addresses');
    } finally {
      setRefreshing(false);
    }
  };

  const handleEdit = (item: IAddress) => {
    navigate('AddressForm', {
      address: item,
      isEdit: true,
    });
  };

  const handleDelete = (item: IAddress) => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete "${item.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!item._id) {
              showError('Invalid address ID');
              return;
            }
            try {
              setDeletingId(item._id);
              await deleteAddress(item._id);
              await fetchAddresses();
              showSuccess('Address deleted successfully');
            } catch (error) {
              showError(error instanceof Error ? error.message : 'Failed to delete address');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const handleMenuPress = (item: IAddress, action: 'edit' | 'delete') => {
    if (action === 'edit') {
      handleEdit(item);
    } else {
      handleDelete(item);
    }
  };

  const handleAddressSelect = (item: IAddress) => {
    if (selectMode) {
      setSelectedAddressId(item._id);
      const nav = navigation as any;
      nav.navigate('MainTabs', {
        screen: 'Cart',
        params: {selectedAddress: item},
      });
    }
  };

  const renderAddressItem = ({item, index}: {item: IAddress; index: number}) => {
    const isSelected = selectMode && selectedAddressId === item._id;
    return (
      <AddressItem
        item={item}
        index={index}
        onMenuPress={selectMode ? undefined : handleMenuPress}
        isDeleting={deletingId === item._id}
        selectMode={selectMode}
        isSelected={isSelected}
        onSelect={handleAddressSelect}
      />
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="location-outline" size={RFValue(60)} color={Colors.disabled} />
        <CustomText variant="h6" fontFamily={Fonts.Medium} style={styles.emptyText}>
          No saved addresses
        </CustomText>
        <CustomText variant="h8" style={styles.emptySubText}>
          Add your first address to get started
        </CustomText>
      </View>
    );
  };

  const renderHeaderButton = () => {
    return (
      <TouchableOpacity
        onPress={() =>
          navigate('AddNewAddress', selectMode ? {selectMode: true} : undefined)
        }>
        <View style={styles.headerAddButton}>
          <Icon name="add" size={RFValue(16)} color={Colors.secondary} />
          <CustomText
            variant="h8"
            fontFamily={Fonts.Medium}
            style={styles.headerAddButtonText}>
            Add
          </CustomText>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && addresses.length === 0) {
    return (
      <View style={styles.container}>
        <CustomHeader
          title={selectMode ? 'Select Address' : 'Saved Addresses'}
          rightComponent={renderHeaderButton()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader
        title={selectMode ? 'Select Address' : 'Saved Addresses'}
        rightComponent={renderHeaderButton()}
      />
      <FlatList
        data={addresses}
        renderItem={renderAddressItem}
        keyExtractor={item => item._id || item.name}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          addresses.length === 0 ? styles.emptyListContainer : styles.listContainer
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  headerAddButtonText: {
    color: Colors.secondary,
    fontSize: RFValue(11),
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 20,
    color: Colors.text,
  },
  emptySubText: {
    marginTop: 8,
    color: Colors.disabled,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SavedAddresses;

