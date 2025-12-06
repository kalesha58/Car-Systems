import React, {useState, useRef, useEffect, FC} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import MapView, {Marker, Camera} from 'react-native-maps';
import {customMapStyle} from '@utils/CustomMap';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {getCurrentLocationWithAddress, reverseGeocodeForAddress} from '@utils/addressUtils';
import {ILocationData} from '../../types/address/IAddress';

interface IAddressMapViewProps {
  onLocationSelect: (location: ILocationData) => void;
  initialLocation?: ILocationData;
}

const AddressMapView: FC<IAddressMapViewProps> = ({
  onLocationSelect,
  initialLocation,
}) => {
  const mapRef = useRef<MapView>(null);
  const [selectedLocation, setSelectedLocation] = useState<ILocationData | null>(
    initialLocation || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    console.log('📍 AddressMapView initialized with location:', initialLocation);
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      animateToLocation(initialLocation.latitude, initialLocation.longitude);
    } else {
      console.log('📍 No initial location, using default coordinates');
    }

    // Set timeout to detect if map doesn't load
    const mapLoadTimeout = setTimeout(() => {
      if (!isMapReady) {
        console.log('📍 Map load timeout - map may not be loading');
        setMapError('Map is taking longer than expected to load. Please check your internet connection and API key configuration.');
      }
    }, 10000); // 10 second timeout

    return () => {
      clearTimeout(mapLoadTimeout);
    };
  }, [initialLocation, isMapReady]);

  const animateToLocation = (latitude: number, longitude: number) => {
    if (mapRef.current) {
      const camera: Camera = {
        center: {
          latitude,
          longitude,
        },
        zoom: 15,
        pitch: 0,
        heading: 0,
        altitude: 0,
      };
      mapRef.current.animateCamera(camera, {duration: 500});
    }
  };

  const handleMapPress = async (event: any) => {
    const {latitude, longitude} = event.nativeEvent.coordinate;
    await updateLocation(latitude, longitude);
  };

  const handleMarkerDragEnd = async (event: any) => {
    const {latitude, longitude} = event.nativeEvent.coordinate;
    await updateLocation(latitude, longitude);
  };

  const updateLocation = async (latitude: number, longitude: number) => {
    setIsLoading(true);
    const locationData = await reverseGeocodeForAddress(latitude, longitude);
    if (locationData) {
      setSelectedLocation(locationData);
      onLocationSelect(locationData);
    }
    setIsLoading(false);
  };

  const handleUseCurrentLocation = async () => {
    setIsLoading(true);
    const locationData = await getCurrentLocationWithAddress();
    if (locationData) {
      setSelectedLocation(locationData);
      animateToLocation(locationData.latitude, locationData.longitude);
      onLocationSelect(locationData);
    }
    setIsLoading(false);
  };

  const defaultLatitude = selectedLocation?.latitude || 17.385044;
  const defaultLongitude = selectedLocation?.longitude || 78.486671;

  useEffect(() => {
    console.log('📍 Map region set to:', {
      latitude: defaultLatitude,
      longitude: defaultLongitude,
      hasSelectedLocation: !!selectedLocation,
    });
  }, [defaultLatitude, defaultLongitude, selectedLocation]);

  useEffect(() => {
    console.log('📍 Map region set to:', {
      latitude: defaultLatitude,
      longitude: defaultLongitude,
      hasSelectedLocation: !!selectedLocation,
    });
  }, [defaultLatitude, defaultLongitude, selectedLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider="google"
        customMapStyle={customMapStyle}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onPress={handleMapPress}
        onMapReady={() => {
          console.log('📍 Map is ready and loaded successfully');
          setIsMapReady(true);
          setMapError(null);
        }}
        initialRegion={{
          latitude: defaultLatitude,
          longitude: defaultLongitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}>
        {selectedLocation && (
          <Marker
            coordinate={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            }}
            draggable
            onDragEnd={handleMarkerDragEnd}
            image={require('@assets/icons/my_pin.png')}
            anchor={{x: 0.5, y: 1}}
          />
        )}
      </MapView>

      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={handleUseCurrentLocation}
        disabled={isLoading}>
        <Icon name="locate" size={RFValue(18)} color={Colors.text} />
        <CustomText variant="h8" fontFamily={Fonts.Medium} style={styles.buttonText}>
          Use my current location
        </CustomText>
      </TouchableOpacity>

      {!isMapReady && !mapError && (
        <View style={styles.loadingOverlay}>
          <CustomText variant="h8" fontFamily={Fonts.Medium}>
            Loading map...
          </CustomText>
        </View>
      )}

      {mapError && (
        <View style={styles.errorOverlay}>
          <Icon name="alert-circle" size={RFValue(24)} color={Colors.text} />
          <CustomText variant="h7" fontFamily={Fonts.Medium} style={styles.errorText}>
            {mapError}
          </CustomText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setMapError(null);
              setIsMapReady(false);
              if (mapRef.current) {
                mapRef.current.animateToRegion({
                  latitude: defaultLatitude,
                  longitude: defaultLongitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                });
              }
            }}>
            <CustomText variant="h8" fontFamily={Fonts.Medium} style={styles.retryButtonText}>
              Retry
            </CustomText>
          </TouchableOpacity>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <CustomText variant="h8" fontFamily={Fonts.Medium}>
            Loading location...
          </CustomText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: Colors.text,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  errorText: {
    color: Colors.text,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
  },
});

export default AddressMapView;

