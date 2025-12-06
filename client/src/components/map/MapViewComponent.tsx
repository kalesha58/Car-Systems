import React, {memo} from 'react';
import {StyleSheet} from 'react-native';
import MapView, {Polyline, Camera} from 'react-native-maps';
import {customMapStyle} from '@utils/CustomMap';
import Markers from './Markers';
import {getPoints} from '@utils/getPoints';
import {Colors} from '@utils/Constants';
import MapViewDirections from 'react-native-maps-directions';
import {GOOGLE_MAP_API} from '@service/config';

interface ICoordinate {
  latitude: number;
  longitude: number;
}

interface IMapViewComponentProps {
  mapRef: React.RefObject<MapView>;
  hasAccepted: boolean;
  setMapRef: (ref: MapView | null) => void;
  camera?: Camera;
  deliveryLocation?: ICoordinate | null;
  pickupLocation?: ICoordinate | null;
  deliveryPersonLocation?: ICoordinate | null;
  hasPickedUp: boolean;
}

const MapViewComponent = ({
  mapRef,
  hasAccepted,
  setMapRef,
  camera,
  deliveryLocation,
  pickupLocation,
  deliveryPersonLocation,
  hasPickedUp,
}: IMapViewComponentProps) => {
  return (
    <MapView
      ref={setMapRef}
      style={styles.map}
      provider="google"
      camera={camera}
      customMapStyle={customMapStyle}
      showsUserLocation={true}
      showsMyLocationButton={false}
      userLocationCalloutEnabled={true}
      userLocationPriority="high"
      showsTraffic={false}
      pitchEnabled={false}
      followsUserLocation={true}
      showsCompass={true}
      showsBuildings={false}
      showsIndoors={false}
      showsScale={false}
      showsIndoorLevelPicker={false}>

      {deliveryPersonLocation &&
        (hasPickedUp || hasAccepted) &&
        (hasAccepted ? pickupLocation : deliveryLocation) && (
          <MapViewDirections
            origin={deliveryPersonLocation}
            destination={
              hasAccepted && pickupLocation
                ? pickupLocation
                : deliveryLocation!
            }
            precision="high"
            apikey={GOOGLE_MAP_API}
            strokeColor="#2871F2"
            strokeColors={["#2871F2"]}
            strokeWidth={5}
            onError={() => {
              // Error handling for map directions
            }}
          />
        )}

      <Markers
        deliveryPersonLocation={deliveryPersonLocation}
        deliveryLocation={deliveryLocation}
        pickupLocation={pickupLocation}
      />

      {!hasPickedUp && deliveryLocation && pickupLocation && (
        <Polyline
          coordinates={getPoints([pickupLocation, deliveryLocation])}
          strokeColor={Colors.text}
          strokeWidth={2}
          geodesic={true}
          lineDashPattern={[12, 10]}
        />
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default memo(MapViewComponent);
