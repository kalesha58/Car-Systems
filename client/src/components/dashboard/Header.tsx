import {View, Text, StyleSheet, Platform, TouchableOpacity} from 'react-native';
import React, {FC, useEffect, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {useAuthStore} from '@state/authStore';
import Geolocation from '@react-native-community/geolocation';
import {reverseGeocode} from '@service/mapService';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {navigate} from '@utils/NavigationUtils';
import {getSavedAddresses} from '@service/addressService';
import type {IAddress} from '../../types/address/IAddress';
import {useTranslation} from 'react-i18next';

const Header: FC<{showNotice: () => void}> = ({showNotice}) => {
  const {setUser, user} = useAuthStore();
  const {t} = useTranslation();
  const [savedAddress, setSavedAddress] = useState<IAddress | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(false);

  const fetchSavedAddresses = async () => {
    try {
      setIsLoadingAddress(true);
      const addresses = await getSavedAddresses();
      if (addresses && addresses.length > 0) {
        setSavedAddress(addresses[0]);
      } else {
        setSavedAddress(null);
      }
    } catch (error) {
      // Silently fail - will fallback to user.address or hardcoded text
      setSavedAddress(null);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const updateUserLocation = async () => {
    Geolocation.requestAuthorization();
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        reverseGeocode(latitude, longitude, setUser);
      },
      () => {
        // Error handling - silently fail
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
      },
    );
  };

  useEffect(() => {
    updateUserLocation();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchSavedAddresses();
    }, []),
  );

  return (
    <View style={styles.subContainer}>
      <TouchableOpacity activeOpacity={0.8}>
        <CustomText fontFamily={Fonts.Bold} variant="h8" style={styles.text}>
          {t('dashboard.deliveryIn')}
        </CustomText>
        <View style={styles.flexRowGap}>
          <CustomText
            fontFamily={Fonts.SemiBold}
            variant="h2"
            style={styles.text}>
            15 {t('dashboard.minutes')}
          </CustomText>
          <TouchableOpacity style={styles.noticeBtn} onPress={showNotice}>
            <CustomText
              fontSize={RFValue(5)}
              fontFamily={Fonts.SemiBold}
              style={{color: '#3B4886'}}>
              ⛈️ Rain
            </CustomText>
          </TouchableOpacity>
        </View>

        <View style={styles.flexRow}>
          <CustomText
            variant="h8"
            numberOfLines={1}
            fontFamily={Fonts.Medium}
            style={styles.text2}>
            {savedAddress?.fullAddress || user?.address || 'Knowhere, Somewhere 😅'}
          </CustomText>
          <Icon
            name="menu-down"
            color="#fff"
            size={RFValue(20)}
            style={{bottom: -1}}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigate('Profile')}>
        <Icon name="account-circle-outline" size={RFValue(36)} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    color: '#fff',
  },
  text2: {
    color: '#fff',
    width: '90%',
    textAlign: 'center',
  },
  flexRow: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    width: '70%',
  },
  subContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'android' ? 10 : 5,
    justifyContent: 'space-between',
  },
  flexRowGap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  noticeBtn: {
    backgroundColor: '#E8EAF5',
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    bottom: -2,
  },
});

export default Header;
