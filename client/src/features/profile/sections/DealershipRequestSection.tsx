import {View, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import React, {FC, useEffect, useState, useMemo} from 'react';
import {useNavigation} from '@react-navigation/native';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@hooks/useTheme';
import {useAuthStore} from '@state/authStore';
import {getBusinessRegistrationByUserId, IBusinessRegistration} from '@service/dealerService';

const DealershipRequestSection: FC = () => {
  const {t} = useTranslation();
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {user} = useAuthStore();
  const [businessRegistration, setBusinessRegistration] = useState<IBusinessRegistration | null>(null);
  const [loading, setLoading] = useState(true);

  const isDealer = useMemo(() => {
    if (!user?.role) return false;
    const roles = Array.isArray(user.role) ? user.role : [user.role];
    return roles.includes('dealer');
  }, [user?.role]);

  useEffect(() => {
    if (!isDealer || !user?.id) {
      setLoading(false);
      return;
    }

    const fetchBusinessRegistration = async () => {
      try {
        setLoading(true);
        const registration = await getBusinessRegistrationByUserId(user.id);
        setBusinessRegistration(registration);
      } catch (error) {
        console.error('Error fetching business registration:', error);
        setBusinessRegistration(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessRegistration();
  }, [isDealer, user?.id]);

  const handleRequestPress = () => {
    (navigation as any).navigate('BusinessRegistration');
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: 24,
        },
        sectionTitle: {
          marginBottom: 12,
          opacity: 0.7,
          paddingHorizontal: 4,
        },
        menuContainer: {
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        statusContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 4,
        },
        statusContent: {
          flex: 1,
          marginLeft: 12,
        },
        statusTitle: {
          fontSize: RFValue(14),
          fontFamily: Fonts.SemiBold,
          marginBottom: 4,
          color: colors.text,
        },
        statusSubtitle: {
          fontSize: RFValue(12),
          fontFamily: Fonts.Regular,
          color: colors.textSecondary,
        },
        button: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.secondary,
          borderRadius: 10,
          paddingVertical: 14,
          paddingHorizontal: 16,
          marginVertical: 8,
        },
        buttonText: {
          fontSize: RFValue(14),
          fontFamily: Fonts.SemiBold,
          color: colors.white,
          marginLeft: 8,
        },
        pendingBadge: {
          backgroundColor: '#f59e0b20',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 6,
          marginTop: 4,
          alignSelf: 'flex-start',
        },
        pendingText: {
          fontSize: RFValue(10),
          fontFamily: Fonts.Medium,
          color: '#f59e0b',
        },
        approvedBadge: {
          backgroundColor: '#10b98120',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 6,
          marginTop: 4,
          alignSelf: 'flex-start',
        },
        approvedText: {
          fontSize: RFValue(10),
          fontFamily: Fonts.Medium,
          color: '#10b981',
        },
        rejectedBadge: {
          backgroundColor: '#ef444420',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 6,
          marginTop: 4,
          alignSelf: 'flex-start',
        },
        rejectedText: {
          fontSize: RFValue(10),
          fontFamily: Fonts.Medium,
          color: '#ef4444',
        },
      }),
    [colors],
  );

  // Don't show section if user is not a dealer
  if (!isDealer) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.menuContainer}>
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={colors.secondary} />
            <CustomText style={styles.statusSubtitle} variant="h8">
              {t('dealer.loadingRegistration') || 'Loading...'}
            </CustomText>
          </View>
        </View>
      </View>
    );
  }

  // No registration - show request button
  if (!businessRegistration) {
    return (
      <View style={styles.container}>
        <CustomText variant="h8" fontFamily={Fonts.SemiBold} style={styles.sectionTitle}>
          {t('dealer.dealership') || 'Dealership'}
        </CustomText>
        <View style={styles.menuContainer}>
          <View style={styles.statusContainer}>
            <Icon name="business-outline" size={RFValue(24)} color={colors.secondary} />
            <View style={styles.statusContent}>
              <CustomText style={styles.statusTitle}>
                {t('dealer.requestDealership') || 'Request for Dealership'}
              </CustomText>
              <CustomText style={styles.statusSubtitle}>
                {t('dealer.completeRegistration') || 'Complete business registration to start selling'}
              </CustomText>
            </View>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleRequestPress} activeOpacity={0.8}>
            <Icon name="add-circle-outline" size={RFValue(18)} color={colors.white} />
            <CustomText style={styles.buttonText}>
              {t('dealer.requestDealership') || 'Request Dealership'}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Pending status
  if (businessRegistration.status === 'pending') {
    return (
      <View style={styles.container}>
        <CustomText variant="h8" fontFamily={Fonts.SemiBold} style={styles.sectionTitle}>
          {t('dealer.dealership') || 'Dealership'}
        </CustomText>
        <View style={styles.menuContainer}>
          <View style={styles.statusContainer}>
            <Icon name="time-outline" size={RFValue(24)} color="#f59e0b" />
            <View style={styles.statusContent}>
              <CustomText style={styles.statusTitle}>
                {t('dealer.waitingForDealership') || 'Waiting for Dealership'}
              </CustomText>
              <CustomText style={styles.statusSubtitle}>
                {t('dealer.pendingApproval') || 'Your request is pending admin approval'}
              </CustomText>
              <View style={styles.pendingBadge}>
                <CustomText style={styles.pendingText}>
                  {t('dealer.pending') || 'Pending'}
                </CustomText>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Approved status
  if (businessRegistration.status === 'approved') {
    return (
      <View style={styles.container}>
        <CustomText variant="h8" fontFamily={Fonts.SemiBold} style={styles.sectionTitle}>
          {t('dealer.dealership') || 'Dealership'}
        </CustomText>
        <View style={styles.menuContainer}>
          <View style={styles.statusContainer}>
            <Icon name="checkmark-circle-outline" size={RFValue(24)} color="#10b981" />
            <View style={styles.statusContent}>
              <CustomText style={styles.statusTitle}>
                {t('dealer.dealershipApproved') || 'Dealership Approved'}
              </CustomText>
              <CustomText style={styles.statusSubtitle}>
                {businessRegistration.businessName}
              </CustomText>
              <View style={styles.approvedBadge}>
                <CustomText style={styles.approvedText}>
                  {t('dealer.approved') || 'Approved'}
                </CustomText>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Rejected status
  if (businessRegistration.status === 'rejected') {
    return (
      <View style={styles.container}>
        <CustomText variant="h8" fontFamily={Fonts.SemiBold} style={styles.sectionTitle}>
          {t('dealer.dealership') || 'Dealership'}
        </CustomText>
        <View style={styles.menuContainer}>
          <View style={styles.statusContainer}>
            <Icon name="close-circle-outline" size={RFValue(24)} color="#ef4444" />
            <View style={styles.statusContent}>
              <CustomText style={styles.statusTitle}>
                {t('dealer.dealershipRejected') || 'Dealership Rejected'}
              </CustomText>
              <CustomText style={styles.statusSubtitle}>
                {t('dealer.updateRegistration') || 'Please update your registration to reapply'}
              </CustomText>
              <View style={styles.rejectedBadge}>
                <CustomText style={styles.rejectedText}>
                  {t('dealer.rejected') || 'Rejected'}
                </CustomText>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleRequestPress} activeOpacity={0.8}>
            <Icon name="refresh-outline" size={RFValue(18)} color={colors.white} />
            <CustomText style={styles.buttonText}>
              {t('dealer.updateRegistration') || 'Update Registration'}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
};

export default DealershipRequestSection;


