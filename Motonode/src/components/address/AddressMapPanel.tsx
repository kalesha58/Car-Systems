import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Camera } from 'react-native-maps';
import Feather from 'react-native-vector-icons/Feather';

import { DEFAULT_COORDINATES } from '@constants/indianStates';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';
import { reverseGeocodeForAddress } from '@utils/geocoding';
import { getCurrentLocationWithAddress } from '@utils/getCurrentLocation';
import type { ILocationData } from '../../types/address';

interface AddressMapPanelProps {
  location: ILocationData | null;
  onLocationChange: (location: ILocationData) => void;
  height?: number;
}

export function AddressMapPanel({ location, onLocationChange, height = 240 }: AddressMapPanelProps) {
  const colors = useColors();
  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(false);
  const mapWidth = Dimensions.get('window').width - 32;

  const latitude = location?.latitude ?? DEFAULT_COORDINATES.latitude;
  const longitude = location?.longitude ?? DEFAULT_COORDINATES.longitude;

  const animateTo = (lat: number, lng: number) => {
    const camera: Camera = {
      center: { latitude: lat, longitude: lng },
      zoom: 15,
      pitch: 0,
      heading: 0,
      altitude: 0,
    };
    mapRef.current?.animateCamera(camera, { duration: 500 });
  };

  const updateLocation = async (lat: number, lng: number) => {
    setLoading(true);
    const data = await reverseGeocodeForAddress(lat, lng);
    if (data) {
      onLocationChange(data);
      animateTo(lat, lng);
    }
    setLoading(false);
  };

  const handleRecenter = async () => {
    lightHaptic();
    setLoading(true);
    const data = await getCurrentLocationWithAddress();
    if (data) {
      onLocationChange(data);
      animateTo(data.latitude, data.longitude);
    }
    setLoading(false);
  };

  const handleNavigate = () => {
    lightHaptic();
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });
    if (url) {
      Linking.openURL(url).catch(() => undefined);
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={[styles.map, { width: mapWidth, height }]}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        loadingEnabled
        loadingIndicatorColor={colors.primary}
        onPress={event => updateLocation(event.nativeEvent.coordinate.latitude, event.nativeEvent.coordinate.longitude)}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          draggable
          onDragEnd={event =>
            updateLocation(event.nativeEvent.coordinate.latitude, event.nativeEvent.coordinate.longitude)
          }
          pinColor={colors.primary}
        />
      </MapView>

      <View style={styles.fabs}>
        <Pressable style={[styles.fab, { backgroundColor: colors.card }]} onPress={handleRecenter}>
          <Feather name="crosshair" size={18} color={colors.textPrimary} />
        </Pressable>
        <Pressable style={[styles.fab, { backgroundColor: colors.card }]} onPress={handleNavigate}>
          <Feather name="navigation" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden', width: '100%' },
  map: { flex: 1 },
  fabs: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    gap: 8,
  },
  fab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
