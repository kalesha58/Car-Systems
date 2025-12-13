import React, { FC, useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Platform,
    PermissionsAndroid,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';
import { useTheme } from '@hooks/useTheme';
import Geolocation from '@react-native-community/geolocation';
import { useToast } from '@hooks/useToast';
import MapView, { Marker } from 'react-native-maps';
import { customMapStyle } from '@utils/CustomMap';
import { useMapRefStore } from '@state/mapStore';

interface ILocation {
    latitude: number;
    longitude: number;
}

interface INearbyPlace {
    id: string;
    name: string;
    address: string;
}

const LocationPickerScreen: FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { colors, isDark } = useTheme();
    const { showError } = useToast();
    const { onLocationSelect } = route.params as { onLocationSelect: (location: ILocation) => void };
    const { setMapRef } = useMapRefStore();
    const mapRef = useRef<MapView>(null);

    const [currentLocation, setCurrentLocation] = useState<ILocation | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<ILocation | null>(null);
    const [loading, setLoading] = useState(false);
    const [locationError, setLocationError] = useState(false);
    // Default location (Hyderabad, India as fallback)
    const defaultLocation: ILocation = {
        latitude: 17.385044,
        longitude: 78.486671,
    };
    const [nearbyPlaces] = useState<INearbyPlace[]>([
        { id: '1', name: 'Send your current location', address: 'Accurate to 14 meters' },
    ]);

    useEffect(() => {
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        if (Platform.OS === 'ios') {
            getCurrentLocation();
            return;
        }
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission',
                    message: 'This app needs access to your location.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                getCurrentLocation();
            } else {
                setLocationError(true);
            }
        } catch (err) {
            console.warn(err);
            setLocationError(true);
        }
    };

    const getCurrentLocation = () => {
        Geolocation.getCurrentPosition(
            position => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };
                setCurrentLocation(location);
                setSelectedLocation(location);
                setLocationError(false);

                // Animate to user's location
                if (mapRef.current) {
                    mapRef.current.animateToRegion({
                        ...location,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    }, 1000);
                }
            },
            error => {
                console.warn('Location error:', error);
                setLocationError(true);
                // Use default location as fallback
                setSelectedLocation(defaultLocation);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
        );
    };

    const handleSelectCurrentLocation = () => {
        if (selectedLocation || currentLocation) {
            onLocationSelect(selectedLocation || currentLocation!);
            navigation.goBack();
        }
    };

    const handleMapPress = (event: any) => {
        const { coordinate } = event.nativeEvent;
        setSelectedLocation(coordinate);
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        mapContainer: {
            height: 400,
            backgroundColor: isDark ? '#1a2a3a' : '#e0e0e0',
        },
        map: {
            flex: 1,
        },
        liveLocationButton: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: colors.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        liveLocationIcon: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.secondary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        liveLocationText: {
            fontSize: RFValue(14),
            fontFamily: Fonts.SemiBold,
            color: colors.text,
        },
        sectionHeader: {
            padding: 16,
            paddingBottom: 8,
            backgroundColor: colors.background,
        },
        sectionTitle: {
            fontSize: RFValue(12),
            fontFamily: Fonts.Medium,
            color: colors.disabled,
            textTransform: 'uppercase',
        },
        placeItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: colors.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        placeIcon: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? '#0d8320' : '#dcf8c6',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        placeContent: {
            flex: 1,
        },
        placeName: {
            fontSize: RFValue(14),
            fontFamily: Fonts.SemiBold,
            color: colors.text,
            marginBottom: 4,
        },
        placeAddress: {
            fontSize: RFValue(12),
            fontFamily: Fonts.Regular,
            color: colors.disabled,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        recenterButton: {
            position: 'absolute',
            right: 16,
            top: 16,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.cardBackground,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
        },
        sendButton: {
            margin: 16,
            backgroundColor: colors.secondary,
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: 'center',
        },
        sendButtonText: {
            color: colors.white,
            fontSize: RFValue(14),
            fontFamily: Fonts.SemiBold,
        },
        locationErrorBanner: {
            backgroundColor: colors.warning,
            padding: 8,
            alignItems: 'center',
        },
        locationErrorText: {
            color: colors.white,
            fontSize: RFValue(12),
            fontFamily: Fonts.Medium,
        },
    });

    const renderPlace = ({ item }: { item: INearbyPlace }) => (
        <TouchableOpacity
            style={styles.placeItem}
            onPress={handleSelectCurrentLocation}
            activeOpacity={0.7}>
            <View style={styles.placeIcon}>
                <Icon name="location" size={RFValue(20)} color={colors.secondary} />
            </View>
            <View style={styles.placeContent}>
                <CustomText style={styles.placeName}>{item.name}</CustomText>
                <CustomText style={styles.placeAddress}>{item.address}</CustomText>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <CustomHeader title="Send location" />

            {locationError && (
                <View style={styles.locationErrorBanner}>
                    <CustomText style={styles.locationErrorText}>
                        Unable to get current location. You can select manually on map.
                    </CustomText>
                </View>
            )}

            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider="google"
                    customMapStyle={customMapStyle}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                    onPress={handleMapPress}
                    initialRegion={{
                        ...(currentLocation || defaultLocation),
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                    }}>
                    {selectedLocation && (
                        <Marker
                            coordinate={selectedLocation}
                            title="Selected Location"
                            pinColor={colors.secondary}
                        />
                    )}
                </MapView>
            </View>

            <View style={styles.sectionHeader}>
                <CustomText style={styles.sectionTitle}>Nearby places</CustomText>
            </View>

            <FlatList
                data={nearbyPlaces}
                renderItem={renderPlace}
                keyExtractor={item => item.id}
            />
        </View>
    );
};

export default LocationPickerScreen;
