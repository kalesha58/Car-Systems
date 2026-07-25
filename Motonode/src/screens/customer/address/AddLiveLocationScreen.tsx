import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MapView, { PROVIDER_GOOGLE, type MapType } from 'react-native-maps';

import { PrimaryButton } from '@components/buttons';
import { CustomerStackRoutes } from '@constants/routes';
import { DEFAULT_COORDINATES } from '@constants/indianStates';
import { useAuth } from '@context/index';
import { useColors } from '@hooks/useColors';
import { saveAddress, updateAddress } from '@services/address.service';
import type { IAddress, ILocationData } from '@app-types/address';
import { buildAddressFormData, isValidIndianPhone } from '@utils/addressHelpers';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { setSelectedDeliveryAddressId } from '@utils/deliveryAddress';
import { getCurrentPosition, handleGeoError } from '@utils/getCurrentPosition';
import type { GeoError } from 'react-native-geolocation-service';
import { requestLocationPermission, showLocationSettingsAlert } from '@utils/locationPermissions';
import { reverseGeocodeForAddress, getPlaceSuggestions, getPlaceDetails, type PlaceSuggestion } from '@utils/geocoding';
import { successHaptic, lightHaptic } from '@utils/haptics';

const { width, height } = Dimensions.get('window');

function runLayoutAnimation() {
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

type RouteParams = {
  address?: IAddress;
  isEdit?: boolean;
};

type NavigationProp = NativeStackNavigationProp<{
  [CustomerStackRoutes.SavedAddresses]: undefined;
}>;

const MAP_TYPES = [
  { id: 'standard', label: 'Default', icon: 'map' },
  { id: 'satellite', label: 'Satellite', icon: 'globe' },
  { id: 'terrain', label: 'Terrain', icon: 'triangle' },
  { id: 'hybrid', label: 'Hybrid', icon: 'layers' },
] as const;

export function AddLiveLocationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { user } = useAuth();

  const { address, isEdit } = route.params ?? {};

  // Core Map States
  const mapRef = useRef<MapView>(null);
  const [mapType, setMapType] = useState<MapType>('standard');
  const [showsTraffic, setShowsTraffic] = useState(false);
  const [mapTypeSheetVisible, setMapTypeSheetVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canShowUserLocation, setCanShowUserLocation] = useState(false);

  const mapReadyRef = useRef(false);
  const shouldLocateOnReadyRef = useRef(false);
  const handleLocateMeRef = useRef<() => Promise<void>>(async () => {});

  // Address picker states
  const [location, setLocation] = useState<ILocationData | null>(
    address?.coordinates
      ? {
          latitude: address.coordinates.latitude,
          longitude: address.coordinates.longitude,
          address: address.fullAddress,
          formattedAddress: address.fullAddress,
          city: address.townOrCity,
          state: address.state,
          pincode: address.pincode,
          country: 'India',
        }
      : null,
  );

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const autocompleteTimerRef = useRef<any>(null);

  // Center Marker Pin Ref coordinates (to avoid map re-renders while dragging)
  const currentCoordsRef = useRef({
    latitude: address?.coordinates?.latitude ?? DEFAULT_COORDINATES.latitude,
    longitude: address?.coordinates?.longitude ?? DEFAULT_COORDINATES.longitude,
  });

  // Debouncing geocoder
  const debounceTimerRef = useRef<any>(null);

  // Animation values for custom marker
  const pinTranslateY = useRef(new Animated.Value(0)).current;
  const shadowScale = useRef(new Animated.Value(1)).current;
  const shadowOpacity = useRef(new Animated.Value(0.6)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);

  // Step 2 Details Sheet states
  const [step, setStep] = useState<'pick' | 'details'>('pick');
  const [houseNo, setHouseNo] = useState('');
  const [landmark, setLandmark] = useState('');
  const [addressLabel, setAddressLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [customLabel, setCustomLabel] = useState('');
  const [saving, setSaving] = useState(false);

  // Pulse animation loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseValue]);

  const scheduleLocateWhenReady = () => {
    if (mapReadyRef.current) {
      shouldLocateOnReadyRef.current = false;
      void handleLocateMeRef.current();
      return;
    }
    shouldLocateOnReadyRef.current = true;
  };

  const handleMapReady = () => {
    mapReadyRef.current = true;
    if (shouldLocateOnReadyRef.current) {
      shouldLocateOnReadyRef.current = false;
      void handleLocateMeRef.current();
    }
  };

  const liftMarker = () => {
    Animated.parallel([
      Animated.timing(pinTranslateY, {
        toValue: -24,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(shadowScale, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(shadowOpacity, {
        toValue: 0.2,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const dropMarker = () => {
    Animated.parallel([
      Animated.spring(pinTranslateY, {
        toValue: 0,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(shadowScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(shadowOpacity, {
        toValue: 0.6,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Reverse Geocoding Call
  const updateAddressFromCoords = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const data = await reverseGeocodeForAddress(lat, lng);
      if (data) {
        runLayoutAnimation();
        setLocation(data);
      }
    } catch (err) {
      console.log('Reverse geocoding error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegionChange = () => {
    if (!isDragging.current) {
      isDragging.current = true;
      liftMarker();
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };

  const handleRegionChangeComplete = (region: any) => {
    isDragging.current = false;
    dropMarker();

    currentCoordsRef.current = {
      latitude: region.latitude,
      longitude: region.longitude,
    };

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      updateAddressFromCoords(region.latitude, region.longitude);
    }, 500);
  };

  const handleLocateMe = async () => {
    lightHaptic();
    setLoading(true);
    try {
      const permission = await requestLocationPermission();
      if (permission === 'granted') {
        setCanShowUserLocation(true);
      } else if (permission === 'blocked') {
        showLocationSettingsAlert();
        return;
      } else {
        return;
      }

      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      mapRef.current?.animateCamera(
        {
          center: { latitude, longitude },
          zoom: 17,
          pitch: 0,
          heading: 0,
          altitude: 0,
        },
        { duration: 800 },
      );
      await updateAddressFromCoords(latitude, longitude);
    } catch (error) {
      handleGeoError(error as GeoError, 'AddLiveLocation');
    } finally {
      setLoading(false);
    }
  };

  handleLocateMeRef.current = handleLocateMe;

  useEffect(() => {
    let cancelled = false;

    async function bootstrapLocation() {
      if (isEdit && address) {
        const label = address.name;
        if (label === 'Home' || label === 'Work') {
          setAddressLabel(label as 'Home' | 'Work');
        } else {
          setAddressLabel('Other');
          setCustomLabel(label);
        }

        const { latitude, longitude } = address.coordinates;
        setTimeout(() => {
          mapRef.current?.animateCamera(
            {
              center: { latitude, longitude },
              zoom: 17,
            },
            { duration: 300 },
          );
        }, 500);
        return;
      }

      const permission = await requestLocationPermission();
      if (cancelled) {
        return;
      }

      if (permission === 'granted') {
        setCanShowUserLocation(true);
        scheduleLocateWhenReady();
        return;
      }

      if (permission === 'blocked') {
        showLocationSettingsAlert();
      }

      await updateAddressFromCoords(
        DEFAULT_COORDINATES.latitude,
        DEFAULT_COORDINATES.longitude,
      );
    }

    void bootstrapLocation();

    return () => {
      cancelled = true;
    };
  }, [isEdit, address]);

  const handleResetCompass = () => {
    lightHaptic();
    mapRef.current?.animateCamera({ heading: 0, pitch: 0 }, { duration: 400 });
  };

  // Search Autocomplete Suggestion Logic
  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);
    if (autocompleteTimerRef.current) {
      clearTimeout(autocompleteTimerRef.current);
    }
    if (!text.trim() || text.length < 3) {
      setSuggestions([]);
      return;
    }
    autocompleteTimerRef.current = setTimeout(async () => {
      const results = await getPlaceSuggestions(text);
      setSuggestions(results);
    }, 300);
  };

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    Keyboard.dismiss();
    setSearchQuery(suggestion.description);
    setSuggestions([]);
    setLoading(true);
    try {
      const data = await getPlaceDetails(suggestion.placeId);
      if (data) {
        runLayoutAnimation();
        setLocation(data);
        mapRef.current?.animateCamera(
          {
            center: { latitude: data.latitude, longitude: data.longitude },
            zoom: 17,
          },
          { duration: 800 }
        );
      }
    } catch {
      Alert.alert('Search Error', 'Unable to retrieve location details.');
    } finally {
      setLoading(false);
    }
  };

  // Save / Submit flow
  const handleConfirmLocation = () => {
    if (!location) {
      Alert.alert('Error', 'Please select a valid location on the map first.');
      return;
    }
    lightHaptic();
    runLayoutAnimation();
    setStep('details');
  };

  const handleSaveAddress = async () => {
    if (!location) return;

    const phone = user?.phone ?? '';
    if (!isValidIndianPhone(phone)) {
      Alert.alert('Phone required', 'A valid 10-digit phone number is required on your profile.');
      return;
    }

    const finalLabel = addressLabel === 'Other' ? customLabel.trim() || 'Other' : addressLabel;
    
    // Combine house number and landmark into fullAddress if they are entered
    const addressComponents = [];
    if (houseNo.trim()) addressComponents.push(houseNo.trim());
    if (landmark.trim()) addressComponents.push(`Near ${landmark.trim()}`);
    addressComponents.push(location.formattedAddress);
    const finalFullAddress = addressComponents.join(', ');

    setSaving(true);
    try {
      const payload = buildAddressFormData({
        label: finalLabel,
        phone,
        fullAddress: finalFullAddress,
        city: location.city ?? '',
        pincode: location.pincode ?? '',
        state: location.state ?? '',
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        isDefault: address?.isDefault,
      });

      if (isEdit && address?._id) {
        await updateAddress(address._id, payload);
        await setSelectedDeliveryAddressId(address._id);
      } else {
        const saved = await saveAddress(payload);
        if (saved._id) {
          await setSelectedDeliveryAddressId(saved._id);
        }
      }
      successHaptic();
      navigation.navigate(CustomerStackRoutes.SavedAddresses);
    } catch (err) {
      Alert.alert('Save Error', getApiErrorMessage(err, 'Failed to save address.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Full screen Map */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={[styles.map, { width, height }]}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={canShowUserLocation}
          followsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsTraffic={showsTraffic}
          mapType={mapType}
          loadingEnabled
          loadingIndicatorColor={colors.primary}
          onMapReady={handleMapReady}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={handleRegionChangeComplete}
          initialRegion={
            location
              ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.003,
                  longitudeDelta: 0.003,
                }
              : {
                  latitude: DEFAULT_COORDINATES.latitude,
                  longitude: DEFAULT_COORDINATES.longitude,
                  latitudeDelta: 0.003,
                  longitudeDelta: 0.003,
                }
          }
        />
      </View>

      {/* Floating Header & Search Bar Overlay */}
      {step === 'pick' && (
        <View style={[styles.topControls, { paddingTop: insets.top + 10 }]}>
          <View style={styles.searchRow}>
            <Pressable
              style={[styles.floatingBackBtn, { backgroundColor: colors.card }]}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={20} color={colors.textPrimary} />
            </Pressable>

            {/* Glassmorphic Search Bar */}
            <View style={[styles.glassSearchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                value={searchQuery}
                onChangeText={handleSearchTextChange}
                placeholder="Search landmarks, buildings, streets..."
                placeholderTextColor={colors.placeholder}
                style={[styles.searchInput, { color: colors.textPrimary }]}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                  style={styles.clearBtn}
                >
                  <Feather name="x" size={16} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Autocomplete Suggestions Box */}
          {suggestions.length > 0 && (
            <View style={[styles.suggestionsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <FlatList
                data={suggestions}
                keyExtractor={item => item.placeId}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <View style={[styles.suggestionPinCircle, { backgroundColor: colors.muted }]}>
                      <Feather name="map-pin" size={14} color={colors.primary} />
                    </View>
                    <View style={styles.suggestionTexts}>
                      <Text style={[styles.suggestionMain, { color: colors.textPrimary }]} numberOfLines={1}>
                        {item.mainText}
                      </Text>
                      <Text style={[styles.suggestionSecondary, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.secondaryText}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            </View>
          )}
        </View>
      )}

      {/* Floating Center Marker Pin Overlay (pointerEvents: none ensures gestures go through to the map) */}
      {step === 'pick' && (
        <View style={styles.centerMarkerWrapper} pointerEvents="none">
          <View style={styles.markerContainer}>
            {/* Pulsing ring animation under pin */}
            <Animated.View
              style={[
                styles.markerPulse,
                {
                  transform: [
                    {
                      scale: pulseValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 2.3],
                      }),
                    },
                  ],
                  opacity: pulseValue.interpolate({
                    inputRange: [0, 0.8, 1],
                    outputRange: [0.6, 0.15, 0],
                  }),
                },
              ]}
            />
            {/* Small static/animated shadow circle */}
            <Animated.View
              style={[
                styles.markerShadow,
                {
                  transform: [{ scale: shadowScale }],
                  opacity: shadowOpacity,
                },
              ]}
            />
            {/* Marker Pin Head and Stem */}
            <Animated.View
              style={[
                styles.markerPin,
                {
                  transform: [{ translateY: pinTranslateY }],
                },
              ]}
            >
              <View style={[styles.markerPinHead, { backgroundColor: colors.primary }]}>
                <View style={styles.markerPinDot} />
              </View>
              <View style={[styles.markerPinStem, { backgroundColor: colors.primary }]} />
            </Animated.View>
          </View>
        </View>
      )}

      {/* Floating Map Controls on right side */}
      {step === 'pick' && (
        <View style={[styles.rightControls, { bottom: insets.bottom + 195 }]}>
          <Pressable style={[styles.controlBtn, { backgroundColor: colors.card }]} onPress={handleLocateMe}>
            <Feather name="crosshair" size={20} color={colors.primary} />
          </Pressable>

          <Pressable style={[styles.controlBtn, { backgroundColor: colors.card }]} onPress={() => setMapTypeSheetVisible(true)}>
            <Feather name="layers" size={20} color={colors.textPrimary} />
          </Pressable>

          <Pressable
            style={[styles.controlBtn, { backgroundColor: colors.card }, showsTraffic && { backgroundColor: '#E0F2FE' }]}
            onPress={() => setShowsTraffic(prev => !prev)}
          >
            <Feather name="activity" size={20} color={showsTraffic ? '#0284C7' : colors.textPrimary} />
          </Pressable>

          <Pressable style={[styles.controlBtn, { backgroundColor: colors.card }]} onPress={handleResetCompass}>
            <Feather name="compass" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      )}

      {/* Loading overlay inside map */}
      {loading && (
        <View style={[styles.loadingOverlay, { top: insets.top + 70 }]}>
          <View style={[styles.loadingBadge, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Updating location...</Text>
          </View>
        </View>
      )}

      {/* Floating Bottom Address Card (Step 1) */}
      {step === 'pick' && (
        <View style={[styles.addressCardWrapper, { paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.addressCard, { backgroundColor: colors.card }]}>
            {/* Accuracy label */}
            <View style={styles.accuracyRow}>
              <View style={styles.accuracyIndicator} />
              <Text style={[styles.accuracyText, { color: colors.textSecondary }]}>
                GPS Accuracy: High
              </Text>
            </View>

            <View style={styles.addressInfoRow}>
              <View style={[styles.locationIconBox, { backgroundColor: colors.muted }]}>
                <Feather name="map-pin" size={22} color={colors.primary} />
              </View>
              <View style={styles.addressTexts}>
                <Text style={[styles.addressMain, { color: colors.textPrimary }]} numberOfLines={1}>
                  {location?.city || 'Fetching location...'}
                </Text>
                <Text style={[styles.addressSub, { color: colors.textSecondary }]} numberOfLines={2}>
                  {location?.formattedAddress || 'Pivoting map pin to find address...'}
                </Text>
              </View>
            </View>

            {location?.pincode ? (
              <View style={styles.pincodeRow}>
                <Feather name="hash" size={14} color={colors.textSecondary} />
                <Text style={[styles.pincodeText, { color: colors.textSecondary }]}>
                  Pincode: {location.pincode}
                </Text>
              </View>
            ) : null}

            <View style={styles.buttonRow}>
              <PrimaryButton
                label="Confirm Selected Location"
                onPress={handleConfirmLocation}
                disabled={!location}
                style={styles.confirmBtn}
              />
            </View>
          </View>
        </View>
      )}

      {/* Expandable Details Sheet Overlay (Step 2) */}
      {step === 'details' && (
        <KeyboardAvoidingView
          style={styles.detailsAvoidContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.detailsBackdrop} />
          <View style={[styles.detailsSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.detailsHeader}>
              <Pressable
                onPress={() => {
                  runLayoutAnimation();
                  setStep('pick');
                }}
                style={styles.detailsBackBtn}
              >
                <Feather name="arrow-left" size={22} color={colors.textPrimary} />
              </Pressable>
              <Text style={[styles.detailsTitle, { color: colors.textPrimary }]}>Save Address Details</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.detailsScrollContent} keyboardShouldPersistTaps="handled">
              {/* Target / Selected Address Summary */}
              <View style={[styles.detailsSummaryBox, { backgroundColor: colors.muted }]}>
                <Feather name="map-pin" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Selected Location</Text>
                  <Text style={[styles.summaryText, { color: colors.textSecondary }]}>{location?.formattedAddress}</Text>
                </View>
              </View>

              {/* Form Input fields */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>House / Flat / Floor / Building No.</Text>
                <TextInput
                  value={houseNo}
                  onChangeText={setHouseNo}
                  placeholder="e.g. Flat 3B, Apex Apartment"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background }]}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Nearby Landmark / Area (Optional)</Text>
                <TextInput
                  value={landmark}
                  onChangeText={setLandmark}
                  placeholder="e.g. Near Siddiq Nagar Mosque"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background }]}
                />
              </View>

              {/* Save As Tag Selection */}
              <View style={styles.tagGroup}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Save Address As</Text>
                <View style={styles.tagRow}>
                  {(['Home', 'Work', 'Other'] as const).map(label => {
                    const isSelected = addressLabel === label;
                    let iconName: 'home' | 'briefcase' | 'map-pin' = 'home';
                    if (label === 'Work') iconName = 'briefcase';
                    if (label === 'Other') iconName = 'map-pin';

                    return (
                      <Pressable
                        key={label}
                        style={[
                          styles.tagBtn,
                          { borderColor: colors.border, backgroundColor: colors.card },
                          isSelected && { borderColor: colors.primary, backgroundColor: '#EFF6FF' },
                        ]}
                        onPress={() => {
                          lightHaptic();
                          setAddressLabel(label);
                        }}
                      >
                        <Feather name={iconName} size={16} color={isSelected ? colors.primary : colors.textSecondary} />
                        <Text style={[styles.tagLabel, { color: isSelected ? colors.primary : colors.textPrimary }]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {addressLabel === 'Other' && (
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Custom Label Name</Text>
                  <TextInput
                    value={customLabel}
                    onChangeText={setCustomLabel}
                    placeholder="e.g. Mom's House, Workshop"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background }]}
                  />
                </View>
              )}

              {/* Confirm details and save */}
              <PrimaryButton
                label={saving ? 'Saving Address...' : 'Save & Save Location'}
                onPress={handleSaveAddress}
                disabled={saving}
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Map Type Bottom Sheet Toggler */}
      {mapTypeSheetVisible && (
        <View style={styles.sheetOverlayContainer}>
          <Pressable style={styles.backdropPressable} onPress={() => setMapTypeSheetVisible(false)} />
          <View style={[styles.mapTypeSheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Select Map View Type</Text>
              <Pressable onPress={() => setMapTypeSheetVisible(false)} style={styles.sheetCloseBtn}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.mapTypeOptions}>
              {MAP_TYPES.map(type => {
                const isSelected = mapType === type.id;
                return (
                  <Pressable
                    key={type.id}
                    style={[
                      styles.mapTypeOption,
                      { borderColor: colors.border },
                      isSelected && { borderColor: colors.primary, backgroundColor: '#EFF6FF' },
                    ]}
                    onPress={() => {
                      lightHaptic();
                      setMapType(type.id);
                      setMapTypeSheetVisible(false);
                    }}
                  >
                    <View style={[styles.mapTypeIconCircle, isSelected && { backgroundColor: '#DBEAFE' }]}>
                      <Feather name={type.icon} size={22} color={isSelected ? colors.primary : colors.textSecondary} />
                    </View>
                    <Text style={[styles.mapTypeLabel, { color: isSelected ? colors.primary : colors.textPrimary }]}>
                      {type.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapWrapper: {
    ...StyleSheet.absoluteFill,
  },
  map: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 999,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  glassSearchBar: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    padding: 0,
    fontFamily: 'Inter_500Medium',
  },
  clearBtn: {
    padding: 6,
  },
  suggestionsBox: {
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionPinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionTexts: {
    flex: 1,
  },
  suggestionMain: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  suggestionSecondary: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  // Custom Center Marker style
  centerMarkerWrapper: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 90,
  },
  markerContainer: {
    width: 80,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  markerShadow: {
    position: 'absolute',
    bottom: 26,
    width: 14,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  markerPulse: {
    position: 'absolute',
    bottom: 24,
    width: 18,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  markerPin: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 30, // lifts stem tip to the exact center of map
  },
  markerPinHead: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  markerPinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  markerPinStem: {
    width: 3,
    height: 10,
    marginTop: -1,
  },
  // Right side Map Controls style
  rightControls: {
    position: 'absolute',
    right: 16,
    gap: 12,
    zIndex: 100,
  },
  controlBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 5,
  },
  // Loading overlay style
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99,
  },
  loadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  // Bottom Address card style
  addressCardWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  addressCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  accuracyIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  accuracyText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  addressInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  locationIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTexts: {
    flex: 1,
    gap: 2,
  },
  addressMain: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  addressSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  pincodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  pincodeText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  buttonRow: {
    marginTop: 16,
  },
  confirmBtn: {
    width: '100%',
  },
  // Step 2 Details Sheet style
  detailsAvoidContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 2000,
  },
  detailsBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  detailsSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.7,
    paddingHorizontal: 20,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 24,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  detailsBackBtn: {
    padding: 6,
  },
  detailsTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  detailsScrollContent: {
    paddingVertical: 18,
    gap: 16,
  },
  detailsSummaryBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 14,
  },
  summaryTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  summaryText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  tagGroup: {
    gap: 10,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tagBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tagLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  // Map Type bottom sheet style
  sheetOverlayContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 3000,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  mapTypeSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  sheetCloseBtn: {
    padding: 6,
  },
  mapTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  mapTypeOption: {
    width: (width - 52) / 2,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  mapTypeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTypeLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
