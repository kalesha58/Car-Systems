import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {useToast} from '@hooks/useToast';
import {getVehicleById} from '@service/vehicleService';
import type {IDealerVehicle} from '@types/vehicle/IVehicle';
import {openDealerChat} from '@utils/openDealerChat';

type VehicleDetailRouteParams = {
  VehicleDetail: {
    vehicleId: string;
  };
};

const VehicleDetail: React.FC = () => {
  const route = useRoute<RouteProp<VehicleDetailRouteParams, 'VehicleDetail'>>();
  const {vehicleId} = route.params;

  const {colors} = useTheme();
  const {showError} = useToast();

  const [vehicle, setVehicle] = useState<IDealerVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        setError(null);
        const response = await getVehicleById(vehicleId);
        if (response.success && response.Response) {
          let vehicleData: IDealerVehicle | null = null;
          if (Array.isArray(response.Response.vehicles)) {
            vehicleData = response.Response.vehicles[0] || null;
          } else if ((response.Response as any).id || (response.Response as any)._id) {
            vehicleData = response.Response as IDealerVehicle;
          }
          if (vehicleData) {
            setVehicle(vehicleData);
          } else {
            setNotFound(true);
            setVehicle(null);
          }
        } else {
          setNotFound(true);
          setVehicle(null);
        }
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 404) {
          setNotFound(true);
          setVehicle(null);
        } else {
          showError(e?.response?.data?.message || 'Failed to load vehicle');
          setVehicle(null);
        }
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      load();
    }
  }, [vehicleId]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {flex: 1, backgroundColor: colors.background},
        content: {padding: 16, paddingBottom: 120},
        image: {
          width: '100%',
          height: 220,
          borderRadius: 12,
          backgroundColor: colors.backgroundSecondary,
        },
        title: {marginTop: 12},
        metaRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8},
        metaChip: {
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: colors.backgroundSecondary,
        },
        metaText: {fontSize: RFValue(10), color: colors.text},
        sectionTitle: {marginTop: 16, marginBottom: 6},
        description: {color: colors.text, opacity: 0.9, lineHeight: RFValue(18)},
        bottomBar: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          backgroundColor: colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        chatButton: {
          height: 48,
          borderRadius: 12,
          backgroundColor: Colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          opacity: chatLoading ? 0.7 : 1,
        },
        dealerText: {marginTop: 6, color: colors.disabled, fontSize: RFValue(11)},
      }),
    [colors, chatLoading],
  );

  const onChatPress = async () => {
    if (!vehicle) return;
    try {
      setChatLoading(true);
      await openDealerChat(vehicle.dealerId);
    } catch (e: any) {
      showError(e?.message || e?.response?.data?.message || 'Failed to open chat');
    } finally {
      setChatLoading(false);
    }
  };

  const isChatDisabled = chatLoading || loading || notFound || !vehicle?.dealerId;

  return (
    <View style={styles.container}>
      <CustomHeader title="Vehicle Details" />

      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={
            vehicle?.images && vehicle.images.length > 0
              ? {uri: vehicle.images[0]}
              : require('@assets/images/All-Vehicles.jpeg')
          }
          style={styles.image}
          resizeMode="cover"
        />

        <CustomText fontFamily={Fonts.Bold} variant="h5" style={styles.title}>
          {vehicle
            ? `${vehicle.brand} ${vehicle.vehicleModel}`
            : loading
              ? 'Loading…'
              : notFound
                ? 'Vehicle not found'
                : 'Vehicle not available'}
        </CustomText>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <CustomText style={styles.metaText} fontFamily={Fonts.Medium}>
              {vehicle?.year ?? (loading ? '—' : '—')}
            </CustomText>
          </View>
          <View style={styles.metaChip}>
            <CustomText style={styles.metaText} fontFamily={Fonts.Medium}>
              {vehicle?.vehicleType ?? (loading ? '—' : '—')}
            </CustomText>
          </View>
          {vehicle?.fuelType ? (
            <View style={styles.metaChip}>
              <CustomText style={styles.metaText} fontFamily={Fonts.Medium}>
                {vehicle.fuelType}
              </CustomText>
            </View>
          ) : null}
          {vehicle?.transmission ? (
            <View style={styles.metaChip}>
              <CustomText style={styles.metaText} fontFamily={Fonts.Medium}>
                {vehicle.transmission}
              </CustomText>
            </View>
          ) : null}
          {vehicle?.mileage ? (
            <View style={styles.metaChip}>
              <CustomText style={styles.metaText} fontFamily={Fonts.Medium}>
                {vehicle.mileage} km
              </CustomText>
            </View>
          ) : null}
        </View>

        <CustomText fontFamily={Fonts.Bold} variant="h6" style={styles.sectionTitle}>
          Price
        </CustomText>
        <CustomText fontFamily={Fonts.SemiBold} variant="h5">
          {vehicle ? `₹${vehicle.price?.toLocaleString()}` : loading ? '—' : '—'}
        </CustomText>

        <CustomText fontFamily={Fonts.Bold} variant="h6" style={styles.sectionTitle}>
          Description
        </CustomText>
        <CustomText style={styles.description} fontFamily={Fonts.Regular}>
          {vehicle?.description ||
            (loading ? 'Loading…' : notFound ? 'This vehicle no longer exists.' : 'No description provided.')}
        </CustomText>

        {vehicle?.dealer?.businessName ? (
          <CustomText style={styles.dealerText} fontFamily={Fonts.Regular}>
            Dealer: {vehicle.dealer.businessName}
          </CustomText>
        ) : null}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          disabled={isChatDisabled}
          onPress={onChatPress}
          activeOpacity={0.8}
          style={[styles.chatButton, isChatDisabled ? {opacity: 0.6} : null]}>
          <Icon name="chatbubbles-outline" size={RFValue(18)} color="#fff" />
          <CustomText fontFamily={Fonts.SemiBold} style={{color: '#fff'}}>
            {chatLoading ? 'Opening chat…' : 'Chat dealer'}
          </CustomText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent',
          }}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      ) : null}
    </View>
  );
};

export default VehicleDetail;
