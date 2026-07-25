export type Camera = {
  center?: { latitude: number; longitude: number };
  zoom?: number;
  pitch?: number;
  heading?: number;
  altitude?: number;
};

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapType = 'standard' | 'satellite' | 'hybrid' | 'terrain' | 'mutedStandard' | string;
