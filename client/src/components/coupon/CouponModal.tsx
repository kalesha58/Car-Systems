import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@hooks/useTheme';
import {ICoupon} from '@types/coupon/ICoupon';
import {useCartStore} from '@state/cartStore';
import {getAllCoupons, getApplicableCoupons} from '@service/couponService';

interface CouponModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyCoupon: (coupon: ICoupon | null) => void;
}

const CouponModal: React.FC<CouponModalProps> = ({
  visible,
  onClose,
  onApplyCoupon,
}) => {
  const {colors} = useTheme();
  const {selectedCoupon, getTotalPrice} = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(
    selectedCoupon?.id || null,
  );
  const [allCoupons, setAllCoupons] = useState<ICoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1024;

  const getResponsiveValue = (mobile: number, tablet?: number, desktop?: number) => {
    if (isDesktop && desktop !== undefined) return desktop;
    if (isTablet && tablet !== undefined) return tablet;
    return mobile;
  };

  const subtotal = getTotalPrice();

  // Fetch coupons from API when modal opens
  useEffect(() => {
    if (visible) {
      fetchCoupons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching coupons for subtotal:', subtotal);
      
      // Try to get applicable coupons first (filtered by cart total)
      let couponsLoaded = false;
      
      try {
        const response = await getApplicableCoupons(subtotal);
        console.log('Applicable coupons response:', response);
        
        if (response?.success && response?.data) {
          if (response.data.length > 0) {
            setAllCoupons(response.data);
            couponsLoaded = true;
          } else {
            console.log('No applicable coupons found, trying all coupons...');
          }
        }
      } catch (applicableErr: any) {
        console.log('Error fetching applicable coupons, trying all coupons:', applicableErr?.response?.data || applicableErr?.message);
      }
      
      // Fallback to all coupons if applicable coupons endpoint fails or returns empty
      if (!couponsLoaded) {
        try {
          const allResponse = await getAllCoupons();
          console.log('All coupons response:', allResponse);
          
          if (allResponse?.success && allResponse?.data) {
            if (allResponse.data.length > 0) {
              setAllCoupons(allResponse.data);
            } else {
              setError('No coupons available');
              setAllCoupons([]);
            }
          } else {
            setError('No coupons available');
            setAllCoupons([]);
          }
        } catch (allErr: any) {
          console.error('Error fetching all coupons:', allErr?.response?.data || allErr?.message);
          setError('Failed to load coupons. Please try again.');
          setAllCoupons([]);
        }
      }
    } catch (err: any) {
      console.error('Unexpected error fetching coupons:', err);
      setError('Failed to load coupons');
      setAllCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter available coupons based on order amount and validity
  // Note: Backend already filters by validity and minOrderAmount for applicable coupons
  // So we only need to filter by search query if provided
  const availableCoupons = allCoupons.filter(coupon => {
    // If search query exists, filter by it
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        coupon.code.toLowerCase().includes(query) ||
        (coupon.title && coupon.title.toLowerCase().includes(query)) ||
        (coupon.description && coupon.description.toLowerCase().includes(query))
      );
    }

    // Otherwise, show all coupons returned from backend
    // Backend already filtered by isActive, validity, and minOrderAmount
    return true;
  });

  const handleApplyCoupon = (coupon: ICoupon) => {
    setAppliedCouponId(coupon.id);
    onApplyCoupon(coupon);
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponId(null);
    onApplyCoupon(null);
  };

  const calculateDiscount = (coupon: ICoupon): number => {
    if (coupon.discountType === 'percentage') {
      const discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        return coupon.maxDiscountAmount;
      }
      return discount;
    }
    return coupon.discountValue;
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: getResponsiveValue(20, 24, 28),
      borderTopRightRadius: getResponsiveValue(20, 24, 28),
      maxHeight: '90%',
      paddingBottom: getResponsiveValue(20, 24, 28),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: getResponsiveValue(20, 24, 28),
      paddingTop: getResponsiveValue(20, 24, 28),
      paddingBottom: getResponsiveValue(16, 20, 24),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: getResponsiveValue(12, 14, 16),
      paddingHorizontal: getResponsiveValue(12, 16, 20),
      marginHorizontal: getResponsiveValue(20, 24, 28),
      marginTop: getResponsiveValue(16, 20, 24),
      marginBottom: getResponsiveValue(12, 16, 20),
      height: getResponsiveValue(48, 52, 56),
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: RFValue(getResponsiveValue(14, 16, 18)),
      fontFamily: Fonts.Regular,
      marginLeft: getResponsiveValue(8, 10, 12),
    },
    couponList: {
      paddingHorizontal: getResponsiveValue(20, 24, 28),
      paddingTop: getResponsiveValue(12, 16, 20),
    },
    couponCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: getResponsiveValue(12, 14, 16),
      padding: getResponsiveValue(16, 20, 24),
      marginBottom: getResponsiveValue(12, 16, 20),
      borderWidth: 2,
      borderColor: 'transparent',
    },
    couponCardApplied: {
      borderColor: colors.secondary,
      backgroundColor: colors.backgroundTertiary || colors.backgroundSecondary,
    },
    couponHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: getResponsiveValue(8, 10, 12),
    },
    couponCodeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getResponsiveValue(8, 10, 12),
    },
    couponCode: {
      backgroundColor: colors.secondary + '20',
      paddingHorizontal: getResponsiveValue(10, 12, 14),
      paddingVertical: getResponsiveValue(6, 8, 10),
      borderRadius: getResponsiveValue(8, 10, 12),
      borderWidth: 1,
      borderColor: colors.secondary,
      borderStyle: 'dashed',
    },
    discountBadge: {
      backgroundColor: colors.secondary,
      paddingHorizontal: getResponsiveValue(10, 12, 14),
      paddingVertical: getResponsiveValue(6, 8, 10),
      borderRadius: getResponsiveValue(8, 10, 12),
    },
    couponTitle: {
      fontSize: RFValue(getResponsiveValue(16, 18, 20)),
      fontFamily: Fonts.SemiBold,
      color: colors.text,
      marginBottom: getResponsiveValue(4, 6, 8),
    },
    couponDescription: {
      fontSize: RFValue(getResponsiveValue(12, 14, 16)),
      fontFamily: Fonts.Regular,
      color: colors.disabled,
      marginBottom: getResponsiveValue(8, 10, 12),
    },
    couponTerms: {
      fontSize: RFValue(getResponsiveValue(10, 12, 14)),
      fontFamily: Fonts.Regular,
      color: colors.disabled,
      marginTop: getResponsiveValue(8, 10, 12),
    },
    applyButton: {
      backgroundColor: colors.secondary,
      paddingVertical: getResponsiveValue(10, 12, 14),
      paddingHorizontal: getResponsiveValue(20, 24, 28),
      borderRadius: getResponsiveValue(8, 10, 12),
      alignItems: 'center',
      marginTop: getResponsiveValue(8, 10, 12),
    },
    removeButton: {
      backgroundColor: colors.error || '#ff3040',
      paddingVertical: getResponsiveValue(10, 12, 14),
      paddingHorizontal: getResponsiveValue(20, 24, 28),
      borderRadius: getResponsiveValue(8, 10, 12),
      alignItems: 'center',
      marginTop: getResponsiveValue(8, 10, 12),
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: getResponsiveValue(40, 50, 60),
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <CustomText
              variant="h5"
              fontFamily={Fonts.SemiBold}
              style={{color: colors.text}}>
              Select Coupon
            </CustomText>
            <TouchableOpacity onPress={onClose}>
              <Icon
                name="close"
                size={RFValue(getResponsiveValue(24, 28, 32))}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Icon
              name="search"
              size={RFValue(getResponsiveValue(20, 24, 28))}
              color={colors.disabled}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search coupons..."
              placeholderTextColor={colors.disabled}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon
                  name="close-circle"
                  size={RFValue(getResponsiveValue(20, 24, 28))}
                  color={colors.disabled}
                />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.couponList}
            showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.emptyState}>
                <Icon
                  name="hourglass-outline"
                  size={RFValue(getResponsiveValue(60, 70, 80))}
                  color={colors.disabled}
                />
                <CustomText
                  variant="h6"
                  fontFamily={Fonts.Medium}
                  style={{color: colors.disabled, marginTop: 16}}>
                  Loading coupons...
                </CustomText>
              </View>
            ) : error ? (
              <View style={styles.emptyState}>
                <Icon
                  name="alert-circle-outline"
                  size={RFValue(getResponsiveValue(60, 70, 80))}
                  color={colors.error || '#ff4444'}
                />
                <CustomText
                  variant="h6"
                  fontFamily={Fonts.Medium}
                  style={{color: colors.error || '#ff4444', marginTop: 16}}>
                  {error}
                </CustomText>
                <TouchableOpacity
                  style={[styles.applyButton, {marginTop: 16}]}
                  onPress={fetchCoupons}>
                  <CustomText
                    style={{
                      color: colors.white,
                      fontSize: RFValue(getResponsiveValue(14, 16, 18)),
                      fontFamily: Fonts.SemiBold,
                    }}>
                    Retry
                  </CustomText>
                </TouchableOpacity>
              </View>
            ) : availableCoupons.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon
                  name="ticket-outline"
                  size={RFValue(getResponsiveValue(60, 70, 80))}
                  color={colors.disabled}
                />
                <CustomText
                  variant="h6"
                  fontFamily={Fonts.Medium}
                  style={{color: colors.disabled, marginTop: 16}}>
                  No coupons available
                </CustomText>
                <CustomText
                  variant="h8"
                  fontFamily={Fonts.Regular}
                  style={{color: colors.disabled, marginTop: 8}}>
                  {searchQuery
                    ? 'Try a different search'
                    : 'No coupons match your order'}
                </CustomText>
              </View>
            ) : (
              availableCoupons.map(coupon => {
                const isApplied = appliedCouponId === coupon.id;
                const discount = calculateDiscount(coupon);

                return (
                  <View
                    key={coupon.id}
                    style={[
                      styles.couponCard,
                      isApplied && styles.couponCardApplied,
                    ]}>
                    <View style={styles.couponHeader}>
                      <View style={{flex: 1}}>
                        <CustomText style={styles.couponTitle}>
                          {coupon.title}
                        </CustomText>
                        <CustomText style={styles.couponDescription}>
                          {coupon.description}
                        </CustomText>
                      </View>
                      <View style={styles.discountBadge}>
                        <CustomText
                          style={{
                            color: colors.white,
                            fontSize: RFValue(getResponsiveValue(12, 14, 16)),
                            fontFamily: Fonts.Bold,
                          }}>
                          {coupon.discountType === 'percentage'
                            ? `${coupon.discountValue}%`
                            : `₹${coupon.discountValue}`}
                        </CustomText>
                      </View>
                    </View>

                    <View style={styles.couponCodeContainer}>
                      <View style={styles.couponCode}>
                        <CustomText
                          style={{
                            color: colors.secondary,
                            fontSize: RFValue(getResponsiveValue(12, 14, 16)),
                            fontFamily: Fonts.SemiBold,
                          }}>
                          {coupon.code}
                        </CustomText>
                      </View>
                      {isApplied && (
                        <View
                          style={{
                            backgroundColor: colors.secondary + '20',
                            paddingHorizontal: getResponsiveValue(8, 10, 12),
                            paddingVertical: getResponsiveValue(4, 6, 8),
                            borderRadius: getResponsiveValue(6, 8, 10),
                          }}>
                          <CustomText
                            style={{
                              color: colors.secondary,
                              fontSize: RFValue(getResponsiveValue(10, 12, 14)),
                              fontFamily: Fonts.Medium,
                            }}>
                            Applied
                          </CustomText>
                        </View>
                      )}
                    </View>

                    <CustomText style={styles.couponTerms}>
                      {coupon.minOrderAmount &&
                        `Min. order: ₹${coupon.minOrderAmount} • `}
                      Save up to ₹{discount.toFixed(0)}
                      {coupon.maxDiscountAmount &&
                        ` (max ₹${coupon.maxDiscountAmount})`}
                    </CustomText>

                    {isApplied ? (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={handleRemoveCoupon}>
                        <CustomText
                          style={{
                            color: colors.white,
                            fontSize: RFValue(getResponsiveValue(14, 16, 18)),
                            fontFamily: Fonts.SemiBold,
                          }}>
                          Remove Coupon
                        </CustomText>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => handleApplyCoupon(coupon)}>
                        <CustomText
                          style={{
                            color: colors.white,
                            fontSize: RFValue(getResponsiveValue(14, 16, 18)),
                            fontFamily: Fonts.SemiBold,
                          }}>
                          Apply Coupon
                        </CustomText>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default CouponModal;

