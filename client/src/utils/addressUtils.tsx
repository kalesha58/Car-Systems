import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import {GOOGLE_MAP_API} from '@service/config';
import {ILocationData} from '../types/address/IAddress';
import {Platform, PermissionsAndroid} from 'react-native';

export const reverseGeocodeForAddress = async (
  latitude: number,
  longitude: number,
): Promise<ILocationData | null> => {
  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAP_API}`;
    console.log('📍 Reverse Geocoding Request:', {
      latitude,
      longitude,
      url: geocodeUrl.replace(GOOGLE_MAP_API, 'API_KEY_HIDDEN'),
    });

    const response = await axios.get(geocodeUrl);

    console.log('📍 Reverse Geocoding Response Status:', response.data.status);
    console.log('📍 Reverse Geocoding Full Response:', JSON.stringify(response.data, null, 2));

    if (response.data.status === 'OK') {
      const address = response.data.results[0].formatted_address;
      console.log('📍 Parsed Address:', address);
      console.log('📍 All Results Count:', response.data.results.length);
      console.log('📍 First Result Details:', {
        formatted_address: response.data.results[0].formatted_address,
        types: response.data.results[0].types,
        address_components: response.data.results[0].address_components,
      });

      const locationData = {
        latitude,
        longitude,
        address,
        formattedAddress: address,
      };
      console.log('📍 Returning Location Data:', locationData);
      return locationData;
    } else {
      console.log('📍 Geocoding Failed - Status:', response.data.status);
      console.log('📍 Error Message:', response.data.error_message || 'No error message');
      return null;
    }
  } catch (error) {
    console.log('📍 Reverse Geocoding Error:', error);
    if (axios.isAxiosError(error)) {
      console.log('📍 Axios Error Details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    }
    return null;
  }
};

export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const checkResult = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      console.log('📍 Android Permission Check:', checkResult);
      
      if (checkResult) {
        return true;
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      console.log('📍 Android Permission Request Result:', granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.log('📍 Android Permission Error:', err);
      return false;
    }
  } else {
    try {
      await Geolocation.requestAuthorization();
      console.log('📍 iOS Permission requested');
      return true;
    } catch (err) {
      console.log('📍 iOS Permission Error:', err);
      return false;
    }
  }
};

export const getCurrentLocationWithAddress = async (): Promise<ILocationData | null> => {
  try {
    console.log('📍 Starting getCurrentLocationWithAddress...');
    const hasPermission = await requestLocationPermission();
    console.log('📍 Location Permission Granted:', hasPermission);
    
    if (!hasPermission) {
      console.log('📍 Location permission denied');
      return null;
    }

    return new Promise((resolve) => {
      console.log('📍 Requesting current position...');
      Geolocation.getCurrentPosition(
        async position => {
          const {latitude, longitude} = position.coords;
          console.log('📍 Current Position Received:', {
            latitude,
            longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
          });
          
          const locationData = await reverseGeocodeForAddress(latitude, longitude);
          console.log('📍 Final Location Data:', locationData);
          resolve(locationData);
        },
        error => {
          console.log('📍 getCurrentPosition Error Object:', error);
          console.log('📍 getCurrentPosition Error Code:', error.code);
          console.log('📍 getCurrentPosition Error Message:', error.message);
          console.log('📍 Error Constants:', {
            PERMISSION_DENIED: error.PERMISSION_DENIED,
            POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
            TIMEOUT: error.TIMEOUT,
          });
          console.log('📍 Full Error JSON:', JSON.stringify(error, null, 2));
          
          if (error.code === error.PERMISSION_DENIED) {
            console.log('📍 Error: Permission denied');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            console.log('📍 Error: Position unavailable');
          } else if (error.code === error.TIMEOUT) {
            console.log('📍 Error: Timeout');
          }
          
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  } catch (error) {
    console.log('📍 getCurrentLocationWithAddress Catch Error:', error);
    return null;
  }
};

