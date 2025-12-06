import {View, StyleSheet, TextInput, TouchableOpacity, ScrollView} from 'react-native';
import React, {useState} from 'react';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Colors, Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {goBack, navigate} from '@utils/NavigationUtils';
import AddressMapView from './AddressMapView';
import {ILocationData} from '../../types/address/IAddress';

const AddNewAddress = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<ILocationData | null>(null);

  const handleLocationSelect = (location: ILocationData) => {
    setSelectedLocation(location);
  };

  const handleAddAddressDetails = () => {
    if (selectedLocation) {
      navigate('AddressForm', {location: selectedLocation});
    }
  };

  const handleChange = () => {
    setSelectedLocation(null);
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Add new address" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={RFValue(18)} color={Colors.disabled} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by area, street name..."
            placeholderTextColor={Colors.disabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.mapContainer}>
          <AddressMapView
            onLocationSelect={handleLocationSelect}
            initialLocation={selectedLocation || undefined}
          />
        </View>

        {selectedLocation && (
          <View style={styles.addressCard}>
            <CustomText variant="h8" fontFamily={Fonts.Medium} style={styles.deliverToText}>
              Deliver to
            </CustomText>
            <View style={styles.addressRow}>
              <Icon name="location" size={RFValue(16)} color={Colors.secondary} />
              <CustomText variant="h7" fontFamily={Fonts.SemiBold} style={styles.addressName}>
                {selectedLocation.address.split(',')[0]}
              </CustomText>
            </View>
            <CustomText variant="h8" style={styles.fullAddress} numberOfLines={2}>
              {selectedLocation.formattedAddress}
            </CustomText>
            <TouchableOpacity style={styles.changeButton} onPress={handleChange}>
              <CustomText variant="h8" fontFamily={Fonts.Medium} style={styles.changeButtonText}>
                Change
              </CustomText>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.addButton,
            !selectedLocation && styles.addButtonDisabled,
          ]}
          onPress={handleAddAddressDetails}
          disabled={!selectedLocation}>
          <CustomText
            variant="h6"
            fontFamily={Fonts.SemiBold}
            style={[
              styles.addButtonText,
              !selectedLocation && styles.addButtonTextDisabled,
            ]}>
            Add address details
          </CustomText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: RFValue(12),
    color: Colors.text,
    fontFamily: Fonts.Regular,
  },
  mapContainer: {
    height: 400,
    width: '100%',
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundSecondary,
  },
  addressCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deliverToText: {
    color: Colors.disabled,
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addressName: {
    color: Colors.text,
  },
  fullAddress: {
    color: Colors.text,
    opacity: 0.8,
    marginBottom: 12,
  },
  changeButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: Colors.backgroundSecondary,
  },
  changeButtonText: {
    color: Colors.secondary,
  },
  addButton: {
    backgroundColor: Colors.secondary,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 20,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  addButtonText: {
    color: '#fff',
  },
  addButtonTextDisabled: {
    color: '#fff',
    opacity: 0.6,
  },
});

export default AddNewAddress;

