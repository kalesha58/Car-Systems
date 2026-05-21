/**
 * PromoOfferCards
 *
 * Placed after the Service Categories card on the Store home.
 * Contains:
 *  1. Two side-by-side compact offer cards  (New Member Offer + Refer & Earn)
 *  2. A "How It Works" 3-step strip
 *
 * No gradients — solid flat colours only.
 */
import React, {FC} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {RFValue} from 'react-native-responsive-fontsize';
import {navigate} from '@utils/NavigationUtils';

// ─── Offer card data ─────────────────────────────────────────────────────────
interface OfferCard {
  id: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  cardBg: string;
  title: string;
  body: string;
  cta: string;
  onPress: () => void;
}

const OFFERS: OfferCard[] = [
  {
    id: 'new-member',
    icon: 'gift-outline',
    iconColor: '#FFFFFF',
    iconBg: '#1565C0',
    cardBg: '#EFF6FF',
    title: 'New Member Offer',
    body: '₹150 off your first service booking',
    cta: 'Claim →',
    onPress: () =>
      navigate('Category', {
        screen: 'ProductCategories',
        params: {initialCategoryId: 'car-service', initialCategoryType: 'services'},
      }),
  },
  {
    id: 'refer',
    icon: 'people-outline',
    iconColor: '#FFFFFF',
    iconBg: '#1B5E20',
    cardBg: '#F0FDF4',
    title: 'Refer & Earn',
    body: 'Get ₹200 credit per friend who joins',
    cta: 'Invite →',
    onPress: () => {},
  },
];

// ─── How It Works steps ───────────────────────────────────────────────────────
interface Step {
  icon: string;
  color: string;
  label: string;
}

const STEPS: Step[] = [
  {icon: 'search-outline',    color: '#1565C0', label: 'Browse\nServices'},
  {icon: 'calendar-outline',  color: '#6A1B9A', label: 'Book in\n1 Tap'},
  {icon: 'checkmark-circle-outline', color: '#1B5E20', label: 'Job\nDone!'},
];

// ─── Component ────────────────────────────────────────────────────────────────
const PromoOfferCards: FC = () => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    // outer wrapper on canvas
    wrapper: {
      marginHorizontal: 12,
      marginBottom: 10,
    },

    // ── Offer cards row ──────────────────────────────────────────────────
    offerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    offerCard: {
      width: '48.5%',
      borderRadius: 16,
      padding: 14,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    offerIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    offerTitle: {
      color: colors.text,
      marginBottom: 4,
    },
    offerBody: {
      color: colors.textSecondary,
      lineHeight: RFValue(13),
      marginBottom: 12,
    },
    offerCta: {
      color: colors.primary === '#f7ca49' ? '#1565C0' : colors.primary,
      letterSpacing: 0.2,
    },

    // ── How It Works card ────────────────────────────────────────────────
    howCard: {
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 14,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    howHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    accentBar: {
      width: 3,
      height: 18,
      borderRadius: 2,
      backgroundColor: colors.primary,
      marginRight: 8,
    },
    howStepsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
    },
    stepItem: {
      alignItems: 'center',
      flex: 1,
    },
    stepIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    stepLabel: {
      textAlign: 'center',
      color: colors.text,
      lineHeight: RFValue(13),
    },
    stepConnector: {
      width: 24,
      height: 2,
      borderRadius: 1,
      backgroundColor: colors.border,
      marginTop: 22,
      opacity: 0.6,
    },
  });

  return (
    <View style={styles.wrapper}>

      {/* ── Two offer cards side by side ── */}
      <View style={styles.offerRow}>
        {OFFERS.map(offer => (
          <TouchableOpacity
            key={offer.id}
            style={[styles.offerCard, {backgroundColor: offer.cardBg}]}
            activeOpacity={0.82}
            onPress={offer.onPress}>
            <View style={[styles.offerIconCircle, {backgroundColor: offer.iconBg}]}>
              <Icon name={offer.icon} size={RFValue(17)} color={offer.iconColor} />
            </View>
            <CustomText variant="h7" fontFamily={Fonts.Bold} style={styles.offerTitle}>
              {offer.title}
            </CustomText>
            <CustomText variant="h9" fontFamily={Fonts.Regular} style={styles.offerBody} numberOfLines={2}>
              {offer.body}
            </CustomText>
            <CustomText variant="h9" fontFamily={Fonts.SemiBold} style={styles.offerCta}>
              {offer.cta}
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── How It Works card ── */}
      <View style={styles.howCard}>
        <View style={styles.howHeader}>
          <View style={styles.accentBar} />
          <CustomText variant="h5" fontFamily={Fonts.SemiBold}>
            How It Works
          </CustomText>
        </View>

        <View style={styles.howStepsRow}>
          {STEPS.map((step, index) => (
            <React.Fragment key={step.icon}>
              <View style={styles.stepItem}>
                <View style={[styles.stepIconCircle, {backgroundColor: step.color + '18'}]}>
                  <Icon name={step.icon} size={RFValue(22)} color={step.color} />
                </View>
                <CustomText
                  variant="h9"
                  fontFamily={Fonts.SemiBold}
                  style={styles.stepLabel}
                  numberOfLines={2}>
                  {step.label}
                </CustomText>
              </View>
              {index < STEPS.length - 1 && <View style={styles.stepConnector} />}
            </React.Fragment>
          ))}
        </View>
      </View>

    </View>
  );
};

export default PromoOfferCards;
