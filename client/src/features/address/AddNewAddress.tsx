import {View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useRoute} from '@react-navigation/native';
import {PermissionsAndroid} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Colors, Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {goBack, navigate} from '@utils/NavigationUtils';
import AddressMapView from './AddressMapView';
import {ILocationData} from '../../types/address/IAddress';
import {getSavedAddresses} from '@service/addressService';
import {requestLocationPermission} from '@utils/addressUtils';

interface RouteParams {
  selectMode?: boolean;
}

const AddNewAddress = () => {
  const route = useRoute();
  const {selectMode} = (route.params as RouteParams) || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<ILocationData | null>(null);
  const [defaultCoordinates, setDefaultCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [useMapView, setUseMapView] = useState(true);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    const fetchDefaultCoordinates = async () => {
      try {
        const addresses = await getSavedAddresses();
        if (addresses && addresses.length > 0 && addresses[0].coordinates) {
          setDefaultCoordinates({
            latitude: addresses[0].coordinates.latitude,
            longitude: addresses[0].coordinates.longitude,
          });
        }
      } catch (error) {
        // Silently fail - will use hardcoded defaults
      }
    };

    fetchDefaultCoordinates();
  }, []);

  useEffect(() => {
    const requestPermission = async () => {
      if (useMapView) {
        const hasPermission = await requestLocationPermission();
        setHasLocationPermission(hasPermission);
        if (!hasPermission) {
          Alert.alert(
            'Location Permission Required',
            'Please enable location permission to use map view. You can still add addresses manually.',
            [
              {
                text: 'Use Manual Entry',
                onPress: () => setUseMapView(false),
              },
              {
                text: 'OK',
                style: 'cancel',
              },
            ],
          );
        }
      }
    };

    requestPermission();
  }, [useMapView]);

  const handleLocationSelect = (location: ILocationData) => {
    setSelectedLocation(location);
  };

  const handleAddAddressDetails = () => {
    if (selectedLocation) {
      navigate('AddressForm', {
        location: selectedLocation,
        selectMode: selectMode,
      });
    }
  };

  const handleManualEntry = () => {
    navigate('AddressForm', {
      location: null,
      selectMode: selectMode,
      isManualEntry: true,
    });
  };

  const handleToggleEntryMode = () => {
    setUseMapView(!useMapView);
    setSelectedLocation(null);
  };

  const handleChange = () => {
    setSelectedLocation(null);
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Add new address" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity
            style={[styles.modeButton, useMapView && styles.modeButtonActive]}
            onPress={() => setUseMapView(true)}>
            <Icon
              name="map-outline"
              size={RFValue(18)}
              color={useMapView ? '#fff' : Colors.text}
            />
            <CustomText
              variant="h8"
              fontFamily={Fonts.Medium}
              style={
                useMapView
                  ? [styles.modeButtonText, styles.modeButtonTextActive]
                  : styles.modeButtonText
              }>
              Use Map
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, !useMapView && styles.modeButtonActive]}
            onPress={() => setUseMapView(false)}>
            <Icon
              name="create-outline"
              size={RFValue(18)}
              color={!useMapView ? '#fff' : Colors.text}
            />
            <CustomText
              variant="h8"
              fontFamily={Fonts.Medium}
              style={
                !useMapView
                  ? [styles.modeButtonText, styles.modeButtonTextActive]
                  : styles.modeButtonText
              }>
              Manual Entry
            </CustomText>
          </TouchableOpacity>
        </View>

        {useMapView ? (
          <>
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
                defaultCoordinates={defaultCoordinates || undefined}
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
                style={
                  !selectedLocation
                    ? styles.addButtonTextDisabled
                    : styles.addButtonText
                }>
                Add address details
              </CustomText>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.manualEntryContainer}>
            <CustomText variant="h7" fontFamily={Fonts.Medium} style={styles.manualEntryTitle}>
              Enter Address Manually
            </CustomText>
            <CustomText variant="h8" style={styles.manualEntryDescription}>
              You can add an address manually for booking products to different locations (e.g., for family members or friends).
            </CustomText>
            <TouchableOpacity style={styles.manualEntryButton} onPress={handleManualEntry}>
              <Icon name="create-outline" size={RFValue(20)} color="#fff" />
              <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={styles.manualEntryButtonText}>
                Continue with Manual Entry
              </CustomText>
            </TouchableOpacity>
          </View>
        )}
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
  modeToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: 10,
    gap: 10,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  modeButtonActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  modeButtonText: {
    color: Colors.text,
  },
  modeButtonTextActive: {
    color: '#fff',
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
  manualEntryContainer: {
    marginHorizontal: 15,
    marginTop: 20,
    padding: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    alignItems: 'center',
  },
  manualEntryTitle: {
    color: Colors.text,
    marginBottom: 10,
  },
  manualEntryDescription: {
    color: Colors.text,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 20,
  },
  manualEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.secondary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
  },
  manualEntryButtonText: {
    color: '#fff',
  },
});

export default AddNewAddress;

