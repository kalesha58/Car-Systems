import React, {useEffect, useMemo, useState, useRef} from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
import type {IDealerVehicle} from '../../types/vehicle/IVehicle';
import {openDealerChat} from '@utils/openDealerChat';
import SkeletonLoader from '@components/ui/SkeletonLoader';
import { useNavigation } from '@react-navigation/native';
import PreBookingModal from '@components/vehicle/PreBookingModal';

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
  const screenWidth = Dimensions.get('window').width;

  const [vehicle, setVehicle] = useState<IDealerVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const navigation = useNavigation();
  const [chatLoading, setChatLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showPreBookingModal, setShowPreBookingModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const response = await getVehicleById(vehicleId);
        if (response.success && response.Response) {
          let vehicleData: IDealerVehicle | null = null;
          
          if (response.Response.vehicles && Array.isArray(response.Response.vehicles)) {
            vehicleData = response.Response.vehicles[0] || null;
          } else if ((response.Response as any).id || (response.Response as any)._id) {
            vehicleData = response.Response as unknown as IDealerVehicle;
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

  const images = vehicle?.images && vehicle.images.length > 0 
    ? vehicle.images 
    : [];

  const handleImageScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    setCurrentImageIndex(index);
  };

  const snapOffsets = images.map((_, index: number) => index * screenWidth);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {flex: 1, backgroundColor: colors.background},
        content: {paddingBottom: 120},
        imageCarousel: {
          width: '100%',
          height: screenWidth * 0.8,
          backgroundColor: colors.backgroundSecondary,
        },
        imageScroll: {
          width: screenWidth,
          height: screenWidth * 0.8,
        },
        image: {
          width: screenWidth,
          height: screenWidth * 0.8,
          resizeMode: 'contain',
        },
        pagination: {
          position: 'absolute',
          bottom: 16,
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
        },
        dot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
        },
        activeDot: {
          width: 20,
          backgroundColor: Colors.secondary,
        },
        detailsContainer: {padding: 16},
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
        },
        title: {flex: 1, marginRight: 8},
        headerActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        headerActionButton: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: Colors.secondary + '20',
          justifyContent: 'center',
          alignItems: 'center',
        },
        categoryTag: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          backgroundColor: Colors.secondary,
        },
        categoryText: {color: '#fff', fontSize: RFValue(10), fontFamily: Fonts.Medium},
        metricsRow: {
          flexDirection: 'row',
          marginTop: 16,
          gap: 16,
        },
        metricItem: {
          alignItems: 'center',
          gap: 4,
        },
        metricIcon: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: Colors.secondary + '20',
          justifyContent: 'center',
          alignItems: 'center',
        },
        metricText: {fontSize: RFValue(10), color: colors.text, fontFamily: Fonts.Medium},
        metricLabel: {fontSize: RFValue(8), color: colors.disabled, fontFamily: Fonts.Regular},
        dealerSection: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 24,
          padding: 16,
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
        },
        dealerAvatar: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: Colors.secondary + '20',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        },
        dealerInfo: {flex: 1},
        dealerName: {fontFamily: Fonts.Bold, fontSize: RFValue(14), color: colors.text},
        dealerRole: {fontSize: RFValue(11), color: colors.disabled, marginTop: 2},
        dealerActions: {
          flexDirection: 'row',
          gap: 8,
        },
        dealerActionButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: Colors.secondary + '20',
          justifyContent: 'center',
          alignItems: 'center',
        },
        sectionTitle: {marginTop: 24, marginBottom: 8, fontFamily: Fonts.Bold, fontSize: RFValue(14)},
        description: {
          color: colors.text,
          opacity: 0.9,
          lineHeight: RFValue(18),
          fontSize: RFValue(11),
          fontFamily: Fonts.Medium,
        },
        featuresGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          marginTop: 8,
        },
        featureItem: {
          width: (screenWidth - 48) / 4,
          alignItems: 'center',
          gap: 6,
        },
        featureIcon: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: Colors.secondary + '20',
          justifyContent: 'center',
          alignItems: 'center',
        },
        featureLabel: {
          fontSize: RFValue(9),
          color: colors.text,
          fontFamily: Fonts.Medium,
          textAlign: 'center',
        },
        bottomBar: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          backgroundColor: colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        priceContainer: {flex: 1},
        priceLabel: {fontSize: RFValue(11), color: colors.disabled, fontFamily: Fonts.Regular},
        priceValue: {
          fontSize: RFValue(20),
          fontFamily: Fonts.Bold,
          color: Colors.secondary,
        },
        actionButtonsContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        actionButton: {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
        },
        testDriveButton: {
          backgroundColor: Colors.secondary,
        },
        preBookingButton: {
          backgroundColor: '#FF9800',
        },
        chatButton: {
          height: 48,
          paddingHorizontal: 20,
          borderRadius: 24,
          backgroundColor: Colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 6,
        },
        dealerText: {marginTop: 4, color: colors.disabled, fontSize: RFValue(11), fontFamily: Fonts.Medium},
        detailRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 8,
        },
        detailLabel: {color: colors.disabled, fontSize: RFValue(10), fontFamily: Fonts.Regular},
        detailValue: {fontSize: RFValue(10), fontFamily: Fonts.Medium},
        skeletonImage: {
          width: screenWidth,
          height: screenWidth * 0.8,
          backgroundColor: colors.backgroundSecondary,
        },
        skeletonTitle: {marginTop: 12, marginBottom: 8},
        skeletonTag: {width: 80, height: 24, borderRadius: 20},
        skeletonMetric: {width: 60, height: 60, borderRadius: 30},
        skeletonDealer: {width: 56, height: 56, borderRadius: 28},
        skeletonDealerInfo: {flex: 1, marginLeft: 12},
        skeletonText: {marginTop: 8},
        skeletonDetailRow: {marginTop: 8},
      }),
    [colors, chatLoading, screenWidth],
  );

  const onChatPress = async () => {
    if (!vehicle) return;
    if (!vehicle.dealerId) {
      showError('Dealer information not available');
      return;
    }
    try {
      setChatLoading(true);
      console.log('VehicleDetail: Opening chat with dealerId:', vehicle.dealerId);
      await openDealerChat(vehicle.dealerId);
    } catch (e: any) {
      console.error('VehicleDetail: Error opening chat:', e);
      showError(e?.message || e?.response?.data?.message || 'Failed to open chat');
    } finally {
      setChatLoading(false);
    }
  };

  const isChatDisabled = chatLoading || loading || notFound || !vehicle?.dealerId;

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'year':
        return 'calendar-outline';
      case 'mileage':
        return 'speedometer-outline';
      case 'fuel':
        return 'car-outline';
      case 'transmission':
        return 'settings-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getFeatureIcon = (feature: string) => {
    const lowerFeature = feature.toLowerCase();
    if (lowerFeature.includes('ac') || lowerFeature.includes('air')) return 'snow-outline';
    if (lowerFeature.includes('gps') || lowerFeature.includes('navigation')) return 'navigate-outline';
    if (lowerFeature.includes('bluetooth')) return 'bluetooth-outline';
    if (lowerFeature.includes('sunroof') || lowerFeature.includes('roof')) return 'sunny-outline';
    if (lowerFeature.includes('camera') || lowerFeature.includes('reverse')) return 'camera-outline';
    return 'checkmark-circle-outline';
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Vehicle Details" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageCarousel}>
          {loading ? (
            <SkeletonLoader width={screenWidth} height={screenWidth * 0.8} borderRadius={0} />
          ) : images.length > 0 ? (
            <>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleImageScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
                snapToOffsets={snapOffsets}
                snapToAlignment="start">
                {images.map((imageUri, index) => (
                  <Image
                    key={index}
                    source={{uri: imageUri}}
                    style={styles.image}
                    resizeMode="contain"
                  />
                ))}
              </ScrollView>
              {images.length > 1 && (
                <View style={styles.pagination}>
                  {images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        index === currentImageIndex && styles.activeDot,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.image}>
              <Image
                source={require('@assets/images/All-Vehicles.jpeg')}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          )}
        </View>

        <View style={styles.detailsContainer}>
          {/* Title and Category */}
          {loading ? (
            <>
              <View style={styles.titleRow}>
                <SkeletonLoader width="70%" height={24} borderRadius={4} style={styles.skeletonTitle} />
                <SkeletonLoader width={80} height={24} borderRadius={20} style={styles.skeletonTag} />
              </View>
              <View style={styles.metricsRow}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={styles.metricItem}>
                    <SkeletonLoader width={48} height={48} borderRadius={24} style={styles.skeletonMetric} />
                    <SkeletonLoader width={40} height={12} borderRadius={4} style={{marginTop: 4}} />
                    <SkeletonLoader width={30} height={10} borderRadius={4} style={{marginTop: 2}} />
                  </View>
                ))}
              </View>
              <View style={styles.dealerSection}>
                <SkeletonLoader width={56} height={56} borderRadius={28} style={styles.skeletonDealer} />
                <View style={styles.skeletonDealerInfo}>
                  <SkeletonLoader width="60%" height={16} borderRadius={4} />
                  <SkeletonLoader width="40%" height={12} borderRadius={4} style={styles.skeletonText} />
                  <SkeletonLoader width="80%" height={12} borderRadius={4} style={styles.skeletonText} />
                </View>
              </View>
              <SkeletonLoader width="40%" height={18} borderRadius={4} style={styles.sectionTitle} />
              <SkeletonLoader width="100%" height={12} borderRadius={4} style={styles.skeletonText} />
              <SkeletonLoader width="95%" height={12} borderRadius={4} style={styles.skeletonText} />
              <SkeletonLoader width="90%" height={12} borderRadius={4} style={styles.skeletonText} />
            </>
          ) : (
            <>
              <View style={styles.titleRow}>
                <CustomText fontFamily={Fonts.Bold} variant="h4" style={styles.title}>
                  {vehicle
                    ? `${vehicle.brand} ${vehicle.vehicleModel}`
                    : notFound
                      ? 'Vehicle not found'
                      : 'Vehicle not available'}
                </CustomText>
                <View style={styles.headerActions}>
                  {vehicle?.availability === 'available' && (
                    <TouchableOpacity
                      style={styles.headerActionButton}
                      onPress={() => setShowPreBookingModal(true)}
                      activeOpacity={0.7}>
                      <Icon name="bookmark-outline" size={RFValue(18)} color={Colors.secondary} />
                    </TouchableOpacity>
                  )}
                  {vehicle?.vehicleType && (
                    <View style={styles.categoryTag}>
                      <CustomText style={styles.categoryText}>{vehicle.vehicleType}</CustomText>
                    </View>
                  )}
                </View>
              </View>

          {/* Key Metrics */}
          {vehicle && (
            <View style={styles.metricsRow}>
              {vehicle.year && (
                <View style={styles.metricItem}>
                  <View style={styles.metricIcon}>
                    <Icon name={getMetricIcon('year')} size={RFValue(20)} color={Colors.secondary} />
                  </View>
                  <CustomText style={styles.metricText}>{vehicle.year}</CustomText>
                  <CustomText style={styles.metricLabel}>Year</CustomText>
                </View>
              )}
              {vehicle.mileage && (
                <View style={styles.metricItem}>
                  <View style={styles.metricIcon}>
                    <Icon name={getMetricIcon('mileage')} size={RFValue(20)} color={Colors.secondary} />
                  </View>
                  <CustomText style={styles.metricText}>{vehicle.mileage}</CustomText>
                  <CustomText style={styles.metricLabel}>km</CustomText>
                </View>
              )}
              {vehicle.fuelType && (
                <View style={styles.metricItem}>
                  <View style={styles.metricIcon}>
                    <Icon name={getMetricIcon('fuel')} size={RFValue(20)} color={Colors.secondary} />
                  </View>
                  <CustomText style={styles.metricText} numberOfLines={1}>
                    {vehicle.fuelType}
                  </CustomText>
                  <CustomText style={styles.metricLabel}>Fuel</CustomText>
                </View>
              )}
              {vehicle.transmission && (
                <View style={styles.metricItem}>
                  <View style={styles.metricIcon}>
                    <Icon name={getMetricIcon('transmission')} size={RFValue(20)} color={Colors.secondary} />
                  </View>
                  <CustomText style={styles.metricText} numberOfLines={1}>
                    {vehicle.transmission}
                  </CustomText>
                  <CustomText style={styles.metricLabel}>Gear</CustomText>
                </View>
              )}
            </View>
          )}

          {/* Dealer Information */}
          {vehicle?.dealer && (
            <View style={styles.dealerSection}>
              <View style={styles.dealerAvatar}>
                <Icon name="business-outline" size={RFValue(24)} color={Colors.secondary} />
              </View>
              <View style={styles.dealerInfo}>
                <CustomText style={styles.dealerName}>
                  {vehicle.dealer.businessName || 'Unknown Dealer'}
                </CustomText>
                <CustomText style={styles.dealerRole}>
                  {vehicle.dealer.type || 'Dealer'}
                </CustomText>
                {vehicle.dealer.address && (
                  <CustomText style={styles.dealerText} numberOfLines={1}>
                    {vehicle.dealer.address}
                  </CustomText>
                )}
              </View>
              <View style={styles.dealerActions}>
                <TouchableOpacity
                  style={styles.dealerActionButton}
                  onPress={onChatPress}
                  disabled={isChatDisabled}>
                  <Icon
                    name="chatbubbles-outline"
                    size={RFValue(20)}
                    color={isChatDisabled ? colors.disabled : Colors.secondary}
                  />
                </TouchableOpacity>
                {vehicle.dealer.phone && (
                  <TouchableOpacity style={styles.dealerActionButton}>
                    <Icon name="call-outline" size={RFValue(20)} color={Colors.secondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

              {/* Overview/Description */}
              <CustomText fontFamily={Fonts.Bold} style={styles.sectionTitle}>
                Overview
              </CustomText>
              <CustomText style={styles.description} fontFamily={Fonts.Regular}>
                {vehicle?.description ||
                  (notFound
                    ? 'This vehicle no longer exists.'
                    : 'No description provided.')}
              </CustomText>

          {/* Features */}
          {vehicle?.features && vehicle.features.length > 0 && (
            <>
              <CustomText fontFamily={Fonts.Bold} style={styles.sectionTitle}>
                Features
              </CustomText>
              <View style={styles.featuresGrid}>
                {vehicle.features.slice(0, 8).map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Icon
                        name={getFeatureIcon(feature)}
                        size={RFValue(20)}
                        color={Colors.secondary}
                      />
                    </View>
                    <CustomText style={styles.featureLabel} numberOfLines={2}>
                      {feature}
                    </CustomText>
                  </View>
                ))}
              </View>
            </>
          )}

              {/* Additional Details */}
              {(vehicle?.color || vehicle?.condition || vehicle?.numberPlate) && (
                <>
                  <CustomText fontFamily={Fonts.Bold} style={styles.sectionTitle}>
                    Additional Details
                  </CustomText>
                  <View style={{gap: 8}}>
                    {vehicle.color && (
                      <View style={styles.detailRow}>
                        <CustomText style={styles.detailLabel}>Color</CustomText>
                        <CustomText style={styles.detailValue}>{vehicle.color}</CustomText>
                      </View>
                    )}
                    {vehicle.condition && (
                      <View style={styles.detailRow}>
                        <CustomText style={styles.detailLabel}>Condition</CustomText>
                        <CustomText style={styles.detailValue}>{vehicle.condition}</CustomText>
                      </View>
                    )}
                    {vehicle.numberPlate && (
                      <View style={styles.detailRow}>
                        <CustomText style={styles.detailLabel}>Number Plate</CustomText>
                        <CustomText style={styles.detailValue}>{vehicle.numberPlate}</CustomText>
                      </View>
                    )}
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <CustomText style={styles.priceLabel}>Price</CustomText>
          <CustomText style={styles.priceValue}>
            {vehicle ? `₹${vehicle.price?.toLocaleString()}` : '—'}
          </CustomText>
        </View>
        <View style={styles.actionButtonsContainer}>
          {vehicle?.allowTestDrive && (
            <TouchableOpacity
              onPress={() => {
                (navigation as any).navigate('TestDriveBooking', { vehicleId: vehicle.id || vehicle._id });
              }}
              activeOpacity={0.8}
              style={[styles.actionButton, styles.testDriveButton]}>
              <Icon name="car-sport-outline" size={RFValue(16)} color="#fff" />
            </TouchableOpacity>
          )}
          {vehicle?.availability === 'available' && (
            <TouchableOpacity
              onPress={() => {
                (navigation as any).navigate('PreBooking', { vehicleId: vehicle.id || vehicle._id });
              }}
              activeOpacity={0.8}
              style={[styles.actionButton, styles.preBookingButton]}>
              <Icon name="bookmark-outline" size={RFValue(16)} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            disabled={isChatDisabled}
            onPress={onChatPress}
            activeOpacity={0.8}
            style={[styles.chatButton, isChatDisabled ? {opacity: 0.6} : null]}>
            <Icon name="chatbubbles-outline" size={RFValue(18)} color="#fff" />
            <CustomText fontFamily={Fonts.SemiBold} style={{color: '#fff'}}>
              {chatLoading ? 'Opening…' : 'Chat'}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pre-Booking Modal */}
      {vehicle && (
        <PreBookingModal
          visible={showPreBookingModal}
          onClose={() => setShowPreBookingModal(false)}
          vehicleId={vehicle.id || vehicle._id || vehicleId}
          vehicleName={`${vehicle.brand} ${vehicle.vehicleModel}`}
          availability={vehicle.availability}
        />
      )}
    </View>
  );
};

export default VehicleDetail;
