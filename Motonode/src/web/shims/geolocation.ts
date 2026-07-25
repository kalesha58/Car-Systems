export type GeoError = {
  code: number;
  message: string;
};

export type GeoCoordinates = {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
};

export type GeoPosition = {
  coords: GeoCoordinates;
  timestamp: number;
};

type GeoOptions = {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
};

function toGeoPosition(pos: GeolocationPosition): GeoPosition {
  return {
    coords: {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      altitudeAccuracy: pos.coords.altitudeAccuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
    },
    timestamp: pos.timestamp,
  };
}

function toGeoError(error: GeolocationPositionError): GeoError {
  return { code: error.code, message: error.message };
}

const Geolocation = {
  requestAuthorization: async (_mode?: 'whenInUse' | 'always') => {
    if (!navigator.geolocation) return 'denied';
    return 'granted';
  },
  getCurrentPosition: (
    success: (pos: GeoPosition) => void,
    error?: (err: GeoError) => void,
    options?: GeoOptions,
  ) => {
    if (!navigator.geolocation) {
      error?.({ code: 2, message: 'Geolocation unavailable' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => success(toGeoPosition(pos)),
      err => error?.(toGeoError(err)),
      options,
    );
  },
  watchPosition: (
    success: (pos: GeoPosition) => void,
    error?: (err: GeoError) => void,
    options?: GeoOptions,
  ) => {
    if (!navigator.geolocation) {
      error?.({ code: 2, message: 'Geolocation unavailable' });
      return 0;
    }
    return navigator.geolocation.watchPosition(
      pos => success(toGeoPosition(pos)),
      err => error?.(toGeoError(err)),
      options,
    );
  },
  clearWatch: (id: number) => {
    navigator.geolocation?.clearWatch(id);
  },
};

export default Geolocation;
