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
import {getServiceById} from '@service/serviceService';
import type {IService} from '../../types/service/IService';
import {openDealerChat} from '@utils/openDealerChat';
import SkeletonLoader from '@components/ui/SkeletonLoader';

type ServiceDetailRouteParams = {
  ServiceDetail: {
    serviceId: string;
  };
};

const ServiceDetail: React.FC = () => {
  const route = useRoute<RouteProp<ServiceDetailRouteParams, 'ServiceDetail'>>();
  const {serviceId} = route.params;

  const {colors} = useTheme();
  const {showError} = useToast();
  const screenWidth = Dimensions.get('window').width;

  const [service, setService] = useState<IService | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const response = await getServiceById(serviceId);
        if (response.success && response.Response) {
          let serviceData: IService | null = null;
          if (Array.isArray(response.Response.services)) {
            serviceData = response.Response.services[0] || null;
          } else if ((response.Response as any).id || (response.Response as any)._id) {
            serviceData = response.Response as IService;
          }
          if (serviceData) {
            setService(serviceData);
          } else {
            setNotFound(true);
            setService(null);
          }
        } else {
          setNotFound(true);
          setService(null);
        }
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 404) {
          setNotFound(true);
          setService(null);
        } else {
          showError(e?.response?.data?.message || 'Failed to load service');
          setService(null);
        }
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      load();
    }
  }, [serviceId]);

  const images = service?.images && service.images.length > 0 
    ? service.images 
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
          gap: 16,
        },
        priceContainer: {flex: 1},
        priceLabel: {fontSize: RFValue(11), color: colors.disabled, fontFamily: Fonts.Regular},
        priceValue: {
          fontSize: RFValue(20),
          fontFamily: Fonts.Bold,
          color: Colors.secondary,
        },
        chatButton: {
          height: 48,
          paddingHorizontal: 24,
          borderRadius: 24,
          backgroundColor: Colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
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
    if (!service) return;
    if (!service.dealerId) {
      showError('Dealer information not available');
      return;
    }
    try {
      setChatLoading(true);
      console.log('ServiceDetail: Opening chat with dealerId:', service.dealerId);
      await openDealerChat(service.dealerId);
    } catch (e: any) {
      console.error('ServiceDetail: Error opening chat:', e);
      showError(e?.message || e?.response?.data?.message || 'Failed to open chat');
    } finally {
      setChatLoading(false);
    }
  };

  const isChatDisabled = chatLoading || loading || notFound || !service?.dealerId;

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'duration':
        return 'time-outline';
      case 'service':
        return 'home-outline';
      case 'category':
        return 'grid-outline';
      default:
        return 'information-circle-outline';
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Service Details" />

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
                source={require('@assets/images/AutoMobile-Services.jpeg')}
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
                {[1, 2, 3].map((i) => (
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
                  {service
                    ? service.name
                    : notFound
                      ? 'Service not found'
                      : 'Service not available'}
                </CustomText>
                {service?.category && (
                  <View style={styles.categoryTag}>
                    <CustomText style={styles.categoryText}>{service.category}</CustomText>
                  </View>
                )}
              </View>

          {/* Key Metrics */}
          {service && (
            <View style={styles.metricsRow}>
              {service.durationMinutes && (
                <View style={styles.metricItem}>
                  <View style={styles.metricIcon}>
                    <Icon name={getMetricIcon('duration')} size={RFValue(20)} color={Colors.secondary} />
                  </View>
                  <CustomText style={styles.metricText}>{service.durationMinutes}</CustomText>
                  <CustomText style={styles.metricLabel}>mins</CustomText>
                </View>
              )}
              <View style={styles.metricItem}>
                <View style={styles.metricIcon}>
                  <Icon
                    name={getMetricIcon('service')}
                    size={RFValue(20)}
                    color={Colors.secondary}
                  />
                </View>
                <CustomText style={styles.metricText} numberOfLines={1}>
                  {service.homeService ? 'Home' : 'Shop'}
                </CustomText>
                <CustomText style={styles.metricLabel}>Service</CustomText>
              </View>
              {service.category && (
                <View style={styles.metricItem}>
                  <View style={styles.metricIcon}>
                    <Icon name={getMetricIcon('category')} size={RFValue(20)} color={Colors.secondary} />
                  </View>
                  <CustomText style={styles.metricText} numberOfLines={1}>
                    {service.category}
                  </CustomText>
                  <CustomText style={styles.metricLabel}>Type</CustomText>
                </View>
              )}
            </View>
          )}

          {/* Dealer Information */}
          {service?.dealer && (
            <View style={styles.dealerSection}>
              <View style={styles.dealerAvatar}>
                <Icon name="business-outline" size={RFValue(24)} color={Colors.secondary} />
              </View>
              <View style={styles.dealerInfo}>
                <CustomText style={styles.dealerName}>
                  {service.dealer.businessName || 'Unknown Dealer'}
                </CustomText>
                <CustomText style={styles.dealerRole}>
                  {service.dealer.type || 'Dealer'}
                </CustomText>
                {service.dealer.address && (
                  <CustomText style={styles.dealerText} numberOfLines={1}>
                    {service.dealer.address}
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
                {service.dealer.phone && (
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
              <CustomText style={styles.description} fontFamily={Fonts.Medium}>
                {service?.description ||
                  (notFound
                    ? 'This service no longer exists.'
                    : 'No description provided.')}
              </CustomText>

              {/* Service Details */}
              {(service?.location || service?.homeService !== undefined) && (
                <>
                  <CustomText fontFamily={Fonts.Bold} style={styles.sectionTitle}>
                    Service Details
                  </CustomText>
                  <View style={{gap: 8}}>
                    <View style={styles.detailRow}>
                      <CustomText style={styles.detailLabel}>Service Type</CustomText>
                      <CustomText style={styles.detailValue}>
                        {service.homeService ? 'Home Service' : 'Shop Service'}
                      </CustomText>
                    </View>
                    {service.location?.address && (
                      <View style={styles.detailRow}>
                        <CustomText style={styles.detailLabel}>Location</CustomText>
                        <CustomText style={styles.detailValue} numberOfLines={2}>
                          {service.location.address}
                        </CustomText>
                      </View>
                    )}
                    {service.category && (
                      <View style={styles.detailRow}>
                        <CustomText style={styles.detailLabel}>Category</CustomText>
                        <CustomText style={styles.detailValue}>{service.category}</CustomText>
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
            {service ? `₹${service.price?.toLocaleString()}` : '—'}
          </CustomText>
        </View>
        <TouchableOpacity
          disabled={isChatDisabled}
          onPress={onChatPress}
          activeOpacity={0.8}
          style={[styles.chatButton, isChatDisabled ? {opacity: 0.6} : null]}>
          <Icon name="chatbubbles-outline" size={RFValue(18)} color="#fff" />
          <CustomText fontFamily={Fonts.SemiBold} style={{color: '#fff'}}>
            {chatLoading ? 'Opening…' : 'Chat Dealer'}
          </CustomText>
        </TouchableOpacity>
      </View>

    </View>
  );
};

export default ServiceDetail;
