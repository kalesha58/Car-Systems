import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts, Colors, fontStyle } from '@utils/Constants';
import { useTheme } from '@hooks/useTheme';
import { useToast } from '@hooks/useToast';
import { getServiceById, bookServiceSlot } from '@service/serviceService';
import { useTranslation } from 'react-i18next';
import type { IService } from '../../types/service/IService';
import { openDealerChat } from '@utils/openDealerChat';
import SkeletonLoader from '@components/ui/SkeletonLoader';
import ServiceSlotPicker, { IServiceSlot } from '@components/service/ServiceSlotPicker';
import { withAuth } from '@utils/AuthGuard';

type ServiceDetailRouteParams = {
  ServiceDetail: {
    serviceId: string;
  };
};

const ServiceDetail: React.FC = () => {
  const route = useRoute<RouteProp<ServiceDetailRouteParams, 'ServiceDetail'>>();
  const navigation = useNavigation();
  const { serviceId } = route.params;

  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const screenWidth = Dimensions.get('window').width;

  const [service, setService] = useState<IService | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<IServiceSlot | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  const isTyreService = service?.serviceType === 'tire_service';
  const showSlotBooking = !!(service?.slotBookingEnabled || isTyreService);

  const dateOptions = useMemo(() => {
    const options: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      options.push(d);
    }
    return options;
  }, []);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const formatDateChip = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (isSameDay(date, today)) {
      return t('dealer.today') || 'Today';
    }
    if (isSameDay(date, tomorrow)) {
      return t('dealer.tomorrow') || 'Tomorrow';
    }
    return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const handleBookSlot = async () => {
    if (!service?.id || !selectedSlot?.id) return;

    if (isTyreService && !registrationNumber.trim()) {
      showError('Please enter your vehicle registration number');
      return;
    }

    try {
      setBookingLoading(true);
      await bookServiceSlot(service.id, selectedSlot.id, {
        serviceRequest: service.name,
        notes: bookingNotes.trim() || undefined,
        vehicleInfo:
          isTyreService && (vehicleBrand.trim() || vehicleModel.trim() || registrationNumber.trim())
            ? {
                brand: vehicleBrand.trim() || undefined,
                model: vehicleModel.trim() || undefined,
                registrationNumber: registrationNumber.trim().toUpperCase() || undefined,
              }
            : undefined,
      });
      showSuccess(t('service.slotBooked') || 'Slot booked successfully');
      setSelectedSlot(null);
      setBookingNotes('');
    } catch (e: any) {
      const message =
        e?.response?.data?.error ||
        e?.response?.data?.Response?.ReturnMessage ||
        e?.response?.data?.message ||
        t('service.slotBookFailed') ||
        'Failed to book slot';
      showError(message);
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const response = await getServiceById(serviceId);
        if (response.success && response.Response) {
          let serviceData: IService | null = null;
          // Handle response structure - could be array of services or single service
          if (Array.isArray(response.Response.services)) {
            serviceData = response.Response.services[0] || null;
          } else if (response.Response && typeof response.Response === 'object') {
            // Check if Response itself is a service object
            const responseData = response.Response as any;
            if (responseData.id || responseData._id || responseData.name) {
              serviceData = responseData as IService;
            }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]); // Only depend on serviceId to prevent infinite loop

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
        container: { flex: 1, backgroundColor: colors.background },
        content: { paddingBottom: 120 },
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
          backgroundColor: colors.text, // Changed from secondary for less green
        },
        detailsContainer: { padding: 16 },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
        },
        title: { flex: 1, marginRight: 8 },
        categoryTag: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          backgroundColor: colors.backgroundSecondary, // Changed from secondary
        },
        categoryText: { color: colors.text, fontSize: RFValue(10), ...fontStyle(Fonts.Medium) }, // Changed text color
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
          backgroundColor: colors.backgroundSecondary, // Changed from secondary opacity
          justifyContent: 'center',
          alignItems: 'center',
        },
        metricText: { fontSize: RFValue(10), color: colors.text, ...fontStyle(Fonts.Medium) },
        metricLabel: { fontSize: RFValue(8), color: colors.disabled, ...fontStyle(Fonts.Regular) },
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
          backgroundColor: colors.backgroundSecondary,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        },
        dealerInfo: { flex: 1 },
        dealerName: { ...fontStyle(Fonts.Bold), fontSize: RFValue(14), color: colors.text },
        dealerRole: { fontSize: RFValue(11), color: colors.disabled, marginTop: 2 },
        dealerActions: {
          flexDirection: 'row',
          gap: 8,
        },
        dealerActionButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.backgroundSecondary,
          justifyContent: 'center',
          alignItems: 'center',
        },
        sectionTitle: { marginTop: 24, marginBottom: 8, ...fontStyle(Fonts.Bold), fontSize: RFValue(14) },
        description: {
          color: colors.text,
          opacity: 0.9,
          lineHeight: RFValue(18),
          fontSize: RFValue(11),
          ...fontStyle(Fonts.Medium),
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
        priceContainer: { flex: 1 },
        priceLabel: { fontSize: RFValue(11), color: colors.disabled, ...fontStyle(Fonts.Regular) },
        priceValue: {
          fontSize: RFValue(20),
          ...fontStyle(Fonts.Bold),
          color: colors.text, // Changed from secondary
        },
        chatButton: {
          height: 48,
          paddingHorizontal: 24,
          borderRadius: 24,
          backgroundColor: colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
        },
        dealerText: { marginTop: 4, color: colors.disabled, fontSize: RFValue(11), ...fontStyle(Fonts.Medium) },
        detailRow: {
          flexDirection: 'row', // Changed back to row for list layout
          alignItems: 'center',
          justifyContent: 'space-between', // Added for split
          backgroundColor: colors.cardBackground,
          borderRadius: 10,
          padding: 12,
          gap: 12,
          width: '100%', // Full width
        },
        detailLabel: { color: colors.disabled, fontSize: RFValue(10), ...fontStyle(Fonts.Regular) },
        detailValue: { fontSize: RFValue(10), ...fontStyle(Fonts.Medium) },
        skeletonImage: {
          width: screenWidth,
          height: screenWidth * 0.8,
          backgroundColor: colors.backgroundSecondary,
        },
        skeletonTitle: { marginTop: 12, marginBottom: 8 },
        skeletonTag: { width: 80, height: 24, borderRadius: 20 },
        skeletonMetric: { width: 60, height: 60, borderRadius: 30 },
        skeletonDealer: { width: 56, height: 56, borderRadius: 28 },
        skeletonDealerInfo: { flex: 1, marginLeft: 12 },
        skeletonText: { marginTop: 8 },
        skeletonDetailRow: { marginTop: 8 },
        dateChipsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 8,
        },
        dateChip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.cardBackground,
        },
        dateChipSelected: {
          borderColor: colors.secondary,
          backgroundColor: colors.secondary + '20',
        },
        dateChipText: {
          fontSize: RFValue(11),
          ...fontStyle(Fonts.Medium),
          color: colors.text,
        },
        dateChipTextSelected: {
          color: colors.secondary,
        },
        vehicleInput: {
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: RFValue(12),
          fontFamily: Fonts.Medium,
        },
        bookButton: {
          height: 48,
          paddingHorizontal: 24,
          borderRadius: 24,
          backgroundColor: colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 120,
        },
        bookButtonDisabled: {
          opacity: 0.6,
        },
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
      <CustomHeader
        title="Service Details"
        backgroundColor="#0d8320"
        titleColor="#fff"
        iconColor="#fff"
      />

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
                    source={{ uri: imageUri }}
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
                    <SkeletonLoader width={40} height={12} borderRadius={4} style={{ marginTop: 4 }} />
                    <SkeletonLoader width={30} height={10} borderRadius={4} style={{ marginTop: 2 }} />
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
                        <Icon name={getMetricIcon('duration')} size={RFValue(20)} color={colors.text} />
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
                        color={colors.text}
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
                        <Icon name={getMetricIcon('category')} size={RFValue(20)} color={colors.text} />
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
              {/* Service Details */}
              {(service?.location || service?.homeService !== undefined || service?.serviceType || service?.vehicleType || service?.vehicleBrand || service?.vehicleModel || service?.category) && (
                <>
                  <CustomText fontFamily={Fonts.Bold} style={styles.sectionTitle}>
                    Service Details
                  </CustomText>
                  <View style={{ gap: 12 }}>
                    <View style={styles.detailRow}>
                      <CustomText style={styles.detailLabel}>Service Type</CustomText>
                      <CustomText style={styles.detailValue}>
                        {service.homeService ? 'Home Service' : 'Shop Service'}
                      </CustomText>
                    </View>
                    {service.serviceType && (
                      <View style={styles.detailRow}>
                        <CustomText style={styles.detailLabel}>Type</CustomText>
                        <CustomText style={styles.detailValue} numberOfLines={1}>
                          {service.serviceType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </CustomText>
                      </View>
                    )}
                    {service.vehicleType && (
                      <View style={styles.detailRow}>
                        <CustomText style={styles.detailLabel}>Vehicle Type</CustomText>
                        <CustomText style={styles.detailValue}>{service.vehicleType}</CustomText>
                      </View>
                    )}
                    {service.vehicleBrand && (
                      <View style={styles.detailRow}>
                        <CustomText style={styles.detailLabel}>Brand</CustomText>
                        <CustomText style={styles.detailValue}>{service.vehicleBrand}</CustomText>
                      </View>
                    )}
                    {service.vehicleModel && (
                      <View style={styles.detailRow}>
                        <CustomText style={styles.detailLabel}>Model</CustomText>
                        <CustomText style={styles.detailValue}>{service.vehicleModel}</CustomText>
                      </View>
                    )}
                    {service.category && (
                      <View style={styles.detailRow}>
                        <CustomText style={styles.detailLabel}>Category</CustomText>
                        <CustomText style={styles.detailValue}>{service.category}</CustomText>
                      </View>
                    )}
                    {service.serviceSubCategory && (
                      <View style={styles.detailRow}>
                        <CustomText style={styles.detailLabel}>Sub Category</CustomText>
                        <CustomText style={styles.detailValue}>{service.serviceSubCategory}</CustomText>
                      </View>
                    )}
                    {service.location?.address && (
                      <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
                        <CustomText style={styles.detailLabel}>Location</CustomText>
                        <CustomText style={[styles.detailValue, { marginTop: 0 }]} numberOfLines={3}>
                          {service.location.address}
                        </CustomText>
                      </View>
                    )}
                  </View>
                </>
              )}

              {/* Service Slot Booking */}
              {showSlotBooking && (
                <>
                  <CustomText fontFamily={Fonts.Bold} style={styles.sectionTitle}>
                    {isTyreService
                      ? t('service.bookTyreSlot') || 'Book Tyre Service Slot'
                      : t('service.bookASlot') || 'Book a Slot'}
                  </CustomText>
                  {isTyreService && (
                    <View style={{ gap: 10, marginBottom: 12 }}>
                      <TextInput
                        style={[styles.vehicleInput, { borderColor: colors.border, color: colors.text }]}
                        placeholder="Registration number *"
                        placeholderTextColor={colors.textSecondary}
                        value={registrationNumber}
                        onChangeText={text => setRegistrationNumber(text.toUpperCase())}
                        autoCapitalize="characters"
                      />
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TextInput
                          style={[styles.vehicleInput, { flex: 1, borderColor: colors.border, color: colors.text }]}
                          placeholder="Brand"
                          placeholderTextColor={colors.textSecondary}
                          value={vehicleBrand}
                          onChangeText={setVehicleBrand}
                        />
                        <TextInput
                          style={[styles.vehicleInput, { flex: 1, borderColor: colors.border, color: colors.text }]}
                          placeholder="Model"
                          placeholderTextColor={colors.textSecondary}
                          value={vehicleModel}
                          onChangeText={setVehicleModel}
                        />
                      </View>
                      <TextInput
                        style={[styles.vehicleInput, { borderColor: colors.border, color: colors.text }]}
                        placeholder="Notes (optional)"
                        placeholderTextColor={colors.textSecondary}
                        value={bookingNotes}
                        onChangeText={setBookingNotes}
                      />
                    </View>
                  )}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    <View style={styles.dateChipsRow}>
                      {dateOptions.map((date) => {
                        const selected = isSameDay(date, selectedDate);
                        return (
                          <TouchableOpacity
                            key={date.toISOString()}
                            style={[styles.dateChip, selected && styles.dateChipSelected]}
                            onPress={() => {
                              setSelectedDate(date);
                              setSelectedSlot(null);
                            }}
                            activeOpacity={0.7}>
                            <CustomText style={[styles.dateChipText, selected && styles.dateChipTextSelected]}>
                              {formatDateChip(date)}
                            </CustomText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                  <ServiceSlotPicker
                    serviceId={service.id}
                    selectedDate={selectedDate}
                    serviceType={service.homeService ? 'home' : 'center'}
                    onSlotSelect={(slot) => {
                      setSelectedSlot(slot);
                    }}
                    selectedSlotId={selectedSlot?.id}
                  />
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
        {showSlotBooking && selectedSlot && (
          <TouchableOpacity
            style={[styles.bookButton, bookingLoading && styles.bookButtonDisabled]}
            onPress={() => {
              withAuth(() => {
                handleBookSlot();
              }, isTyreService ? 'Please login to book tyre service.' : 'Please login to book a slot.');
            }}
            disabled={bookingLoading}
            activeOpacity={0.8}>
            {bookingLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <CustomText style={{ color: '#fff', ...fontStyle(Fonts.SemiBold), fontSize: RFValue(12) }}>
                {isTyreService
                  ? t('service.bookTyreSlot') || 'Book Slot'
                  : t('service.bookSlot') || 'Book Slot'}
              </CustomText>
            )}
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
};

export default ServiceDetail;
