import React, {
  Children,
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { GOOGLE_MAPS_API_KEY } from '@config/env';

export const PROVIDER_GOOGLE = 'google';

type LatLng = { latitude: number; longitude: number };
type Region = LatLng & { latitudeDelta: number; longitudeDelta: number };
type Camera = {
  center?: LatLng;
  zoom?: number;
  pitch?: number;
  heading?: number;
  altitude?: number;
};

type MapViewProps = {
  style?: StyleProp<ViewStyle>;
  provider?: string;
  initialRegion?: Region;
  region?: Region;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  loadingEnabled?: boolean;
  loadingIndicatorColor?: string;
  mapType?: string;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  onPress?: (event: { nativeEvent: { coordinate: LatLng } }) => void;
  onRegionChangeComplete?: (region: Region) => void;
  children?: ReactNode;
};

type MapsApi = typeof google.maps;

declare global {
  interface Window {
    google?: typeof google;
    __motonodeMapsPromise?: Promise<MapsApi>;
  }
}

function loadGoogleMaps(): Promise<MapsApi> {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (window.__motonodeMapsPromise) {
    return window.__motonodeMapsPromise;
  }

  window.__motonodeMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.onload = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error('Google Maps failed to load'));
    };
    script.onerror = () => reject(new Error('Google Maps script error'));
    document.head.appendChild(script);
  });

  return window.__motonodeMapsPromise;
}

type MapContextValue = {
  map: google.maps.Map | null;
  maps: MapsApi | null;
};

const MapContext = createContext<MapContextValue>({ map: null, maps: null });

export type MapViewHandle = {
  animateCamera: (camera: Camera, options?: { duration?: number }) => void;
  animateToRegion: (region: Region, duration?: number) => void;
};

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { style, initialRegion, region, onPress, onRegionChangeComplete, children },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [maps, setMaps] = useState<MapsApi | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const start = region ?? initialRegion;

  useEffect(() => {
    let cancelled = false;
    void loadGoogleMaps()
      .then(api => {
        if (cancelled || !containerRef.current) return;
        setMaps(api);
        const instance = new api.Map(containerRef.current, {
          center: {
            lat: start?.latitude ?? 20.5937,
            lng: start?.longitude ?? 78.9629,
          },
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = instance;
        setMap(instance);

        instance.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng || !onPress) return;
          onPress({
            nativeEvent: {
              coordinate: { latitude: e.latLng.lat(), longitude: e.latLng.lng() },
            },
          });
        });

        instance.addListener('idle', () => {
          if (!onRegionChangeComplete) return;
          const center = instance.getCenter();
          const bounds = instance.getBounds();
          if (!center || !bounds) return;
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          onRegionChangeComplete({
            latitude: center.lat(),
            longitude: center.lng(),
            latitudeDelta: Math.abs(ne.lat() - sw.lat()),
            longitudeDelta: Math.abs(ne.lng() - sw.lng()),
          });
        });
      })
      .catch(err => console.error('[Web Maps]', err));

    return () => {
      cancelled = true;
    };
    // Intentional: init once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map || !region) return;
    map.panTo({ lat: region.latitude, lng: region.longitude });
  }, [map, region?.latitude, region?.longitude]);

  useImperativeHandle(ref, () => ({
    animateCamera: camera => {
      const instance = mapRef.current;
      if (!instance || !camera.center) return;
      instance.panTo({ lat: camera.center.latitude, lng: camera.center.longitude });
      if (camera.zoom != null) instance.setZoom(camera.zoom);
      if (camera.heading != null) instance.setHeading(camera.heading);
    },
    animateToRegion: next => {
      const instance = mapRef.current;
      if (!instance) return;
      instance.panTo({ lat: next.latitude, lng: next.longitude });
    },
  }));

  const ctx = useMemo(() => ({ map, maps }), [map, maps]);
  const flatStyle = StyleSheet.flatten(style) || {};

  return (
    <MapContext.Provider value={ctx}>
      <View style={[{ overflow: 'hidden' }, style]}>
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '100%',
            minHeight: (flatStyle as { height?: number }).height || 240,
          }}
        />
        {children}
      </View>
    </MapContext.Provider>
  );
});

type MarkerProps = {
  coordinate: LatLng;
  title?: string;
  description?: string;
  draggable?: boolean;
  onDragEnd?: (event: { nativeEvent: { coordinate: LatLng } }) => void;
  children?: ReactNode;
};

export function Marker({ coordinate, title, description, draggable, onDragEnd, children }: MarkerProps) {
  const { map, maps } = useContext(MapContext);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!map || !maps) return;

    const marker = new maps.Marker({
      map,
      position: { lat: coordinate.latitude, lng: coordinate.longitude },
      title,
      draggable: !!draggable,
    });
    markerRef.current = marker;

    if (onDragEnd) {
      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (!pos) return;
        onDragEnd({
          nativeEvent: { coordinate: { latitude: pos.lat(), longitude: pos.lng() } },
        });
      });
    }

    return () => {
      marker.setMap(null);
    };
  }, [map, maps]);

  useEffect(() => {
    markerRef.current?.setPosition({
      lat: coordinate.latitude,
      lng: coordinate.longitude,
    });
  }, [coordinate.latitude, coordinate.longitude]);

  // Custom marker children are ignored on web (pin is Google default).
  void children;
  void description;
  return null;
}

type PolylineProps = {
  coordinates: LatLng[];
  strokeColor?: string;
  strokeWidth?: number;
};

export function Polyline({ coordinates, strokeColor = '#E60012', strokeWidth = 3 }: PolylineProps) {
  const { map, maps } = useContext(MapContext);

  useEffect(() => {
    if (!map || !maps || coordinates.length < 2) return;
    const line = new maps.Polyline({
      map,
      path: coordinates.map(c => ({ lat: c.latitude, lng: c.longitude })),
      strokeColor,
      strokeWeight: strokeWidth,
    });
    return () => line.setMap(null);
  }, [map, maps, coordinates, strokeColor, strokeWidth]);

  return null;
}

export type { Camera, Region, MapType } from './maps-types';
export default MapView;
