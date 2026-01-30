import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import React, {FC, useMemo} from 'react';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {useTheme} from '@hooks/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import {IBusinessRegistration} from '@service/dealerService';
import {useTranslation} from 'react-i18next';
import SkeletonLoader from '@components/ui/SkeletonLoader';

interface BusinessRegistrationInfoProps {
  businessRegistration: IBusinessRegistration | null;
  loading?: boolean;
}

const BusinessRegistrationInfo: FC<BusinessRegistrationInfoProps> = ({
  businessRegistration,
  loading = false,
}) => {
  const {colors, isDark} = useTheme();
  const {t} = useTranslation();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return colors.success || '#10b981';
      case 'pending':
        return colors.warning || '#f59e0b';
      case 'rejected':
        return colors.error || '#ef4444';
      default:
        return colors.textSecondary;
    }
  };

  const handleDocumentPress = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
    }
  };

  const handleImagePress = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 20,
        },
        card: {
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: isDark ? colors.border : '#E5E5E5',
          ...(isDark
            ? {}
            : {
                shadowColor: '#000000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }),
        },
        cardTitle: {
          fontSize: RFValue(16),
          fontFamily: Fonts.Bold,
          color: colors.text,
          marginBottom: 12,
        },
        infoRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? colors.border : '#F0F0F0',
        },
        infoRowLast: {
          marginBottom: 0,
          paddingBottom: 0,
          borderBottomWidth: 0,
        },
        infoLabel: {
          fontSize: RFValue(12),
          fontFamily: Fonts.Medium,
          color: colors.textSecondary,
          flex: 1,
        },
        infoValue: {
          fontSize: RFValue(13),
          fontFamily: Fonts.Regular,
          color: colors.text,
          flex: 1.5,
          textAlign: 'right',
        },
        statusBadge: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
          alignSelf: 'flex-end',
        },
        statusText: {
          fontSize: RFValue(11),
          fontFamily: Fonts.SemiBold,
          textTransform: 'capitalize',
        },
        photosContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 8,
        },
        photoItem: {
          width: 100,
          height: 100,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: colors.backgroundSecondary,
        },
        photoImage: {
          width: '100%',
          height: '100%',
        },
        documentsContainer: {
          marginTop: 8,
        },
        documentItem: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 8,
          marginBottom: 8,
        },
        documentIcon: {
          marginRight: 12,
        },
        documentInfo: {
          flex: 1,
        },
        documentName: {
          fontSize: RFValue(12),
          fontFamily: Fonts.SemiBold,
          color: colors.text,
          marginBottom: 2,
        },
        documentType: {
          fontSize: RFValue(10),
          fontFamily: Fonts.Regular,
          color: colors.textSecondary,
        },
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 60,
          paddingHorizontal: 40,
        },
        emptyIcon: {
          marginBottom: 16,
        },
        emptyTitle: {
          fontSize: RFValue(16),
          fontFamily: Fonts.SemiBold,
          color: colors.text,
          marginBottom: 8,
          textAlign: 'center',
        },
        emptyText: {
          fontSize: RFValue(13),
          fontFamily: Fonts.Regular,
          color: colors.textSecondary,
          textAlign: 'center',
        },
        skeletonCard: {
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        },
      }),
    [colors, isDark],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {[1, 2, 3].map(i => (
          <View key={i} style={styles.skeletonCard}>
            <SkeletonLoader width="60%" height={20} borderRadius={4} style={{marginBottom: 12}} />
            <SkeletonLoader width="100%" height={16} borderRadius={4} style={{marginBottom: 8}} />
            <SkeletonLoader width="80%" height={16} borderRadius={4} style={{marginBottom: 8}} />
            <SkeletonLoader width="90%" height={16} borderRadius={4} />
          </View>
        ))}
      </View>
    );
  }

  if (!businessRegistration) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Icon name="business-outline" size={RFValue(48)} color={colors.textSecondary} />
          </View>
          <CustomText style={styles.emptyTitle}>
            {t('dealer.noRegistration') || 'No Business Registration'}
          </CustomText>
          <CustomText style={styles.emptyText}>
            {t('dealer.registrationRequired') ||
              'Please complete your business registration to view details here.'}
          </CustomText>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Basic Information */}
      <View style={styles.card}>
        <CustomText style={styles.cardTitle}>
          {t('dealer.businessInformation') || 'Business Information'}
        </CustomText>

        <View style={styles.infoRow}>
          <CustomText style={styles.infoLabel}>
            {t('dealer.businessName') || 'Business Name'}
          </CustomText>
          <CustomText style={styles.infoValue}>{businessRegistration.businessName}</CustomText>
        </View>

        <View style={styles.infoRow}>
          <CustomText style={styles.infoLabel}>
            {t('dealer.businessType') || 'Business Type'}
          </CustomText>
          <CustomText style={styles.infoValue}>{businessRegistration.type}</CustomText>
        </View>

        <View style={styles.infoRow}>
          <CustomText style={styles.infoLabel}>
            {t('dealer.address') || 'Address'}
          </CustomText>
          <CustomText style={styles.infoValue}>{businessRegistration.address}</CustomText>
        </View>

        <View style={styles.infoRow}>
          <CustomText style={styles.infoLabel}>
            {t('dealer.phone') || 'Phone'}
          </CustomText>
          <CustomText style={styles.infoValue}>{businessRegistration.phone}</CustomText>
        </View>

        {businessRegistration.gst && (
          <View style={styles.infoRow}>
            <CustomText style={styles.infoLabel}>
              {t('dealer.gst') || 'GST Number'}
            </CustomText>
            <CustomText style={styles.infoValue}>{businessRegistration.gst}</CustomText>
          </View>
        )}

        <View style={[styles.infoRow, styles.infoRowLast]}>
          <CustomText style={styles.infoLabel}>
            {t('dealer.status') || 'Status'}
          </CustomText>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor(businessRegistration.status) + '20'},
            ]}>
            <CustomText
              style={[styles.statusText, {color: getStatusColor(businessRegistration.status)}]}>
              {businessRegistration.status}
            </CustomText>
          </View>
        </View>
      </View>

      {/* Store Status */}
      <View style={styles.card}>
        <CustomText style={styles.cardTitle}>
          {t('dealer.storeStatus') || 'Store Status'}
        </CustomText>
        <View style={[styles.infoRow, styles.infoRowLast]}>
          <CustomText style={styles.infoLabel}>
            {t('dealer.storeOpen') || 'Store Status'}
          </CustomText>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: businessRegistration.storeOpen
                  ? (colors.success || '#10b981') + '20'
                  : (colors.error || '#ef4444') + '20',
              },
            ]}>
            <CustomText
              style={[
                styles.statusText,
                {
                  color: businessRegistration.storeOpen
                    ? colors.success || '#10b981'
                    : colors.error || '#ef4444',
                },
              ]}>
              {businessRegistration.storeOpen
                ? t('dealer.open') || 'Open'
                : t('dealer.closed') || 'Closed'}
            </CustomText>
          </View>
        </View>
      </View>

      {/* Payout Details */}
      {businessRegistration.payout && (
        <View style={styles.card}>
          <CustomText style={styles.cardTitle}>
            {t('dealer.payoutDetails') || 'Payout Details'}
          </CustomText>

          <View style={styles.infoRow}>
            <CustomText style={styles.infoLabel}>
              {t('dealer.payoutType') || 'Payout Type'}
            </CustomText>
            <CustomText style={styles.infoValue}>
              {businessRegistration.payout.type === 'UPI' ? t('dealer.upi') || 'UPI' : t('dealer.bank') || 'Bank Account'}
            </CustomText>
          </View>

          {businessRegistration.payout.type === 'UPI' && businessRegistration.payout.upiId && (
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <CustomText style={styles.infoLabel}>
                {t('dealer.upiId') || 'UPI ID'}
              </CustomText>
              <CustomText style={styles.infoValue}>{businessRegistration.payout.upiId}</CustomText>
            </View>
          )}

          {businessRegistration.payout.type === 'BANK' && businessRegistration.payout.bank && (
            <>
              <View style={styles.infoRow}>
                <CustomText style={styles.infoLabel}>
                  {t('dealer.accountNumber') || 'Account Number'}
                </CustomText>
                <CustomText style={styles.infoValue}>
                  {businessRegistration.payout.bank.accountNumber}
                </CustomText>
              </View>

              <View style={styles.infoRow}>
                <CustomText style={styles.infoLabel}>
                  {t('dealer.ifsc') || 'IFSC Code'}
                </CustomText>
                <CustomText style={styles.infoValue}>
                  {businessRegistration.payout.bank.ifsc}
                </CustomText>
              </View>

              <View style={[styles.infoRow, styles.infoRowLast]}>
                <CustomText style={styles.infoLabel}>
                  {t('dealer.accountName') || 'Account Holder Name'}
                </CustomText>
                <CustomText style={styles.infoValue}>
                  {businessRegistration.payout.bank.accountName}
                </CustomText>
              </View>
            </>
          )}
        </View>
      )}

      {/* Shop Photos */}
      {businessRegistration.shopPhotos && businessRegistration.shopPhotos.length > 0 && (
        <View style={styles.card}>
          <CustomText style={styles.cardTitle}>
            {t('dealer.shopPhotos') || 'Shop Photos'}
          </CustomText>
          <View style={styles.photosContainer}>
            {businessRegistration.shopPhotos.map((photo, index) => (
              <TouchableOpacity
                key={index}
                style={styles.photoItem}
                onPress={() => handleImagePress(photo.url)}
                activeOpacity={0.8}>
                <Image source={{uri: photo.url}} style={styles.photoImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Documents */}
      {businessRegistration.documents && businessRegistration.documents.length > 0 && (
        <View style={styles.card}>
          <CustomText style={styles.cardTitle}>
            {t('dealer.documents') || 'Documents'}
          </CustomText>
          <View style={styles.documentsContainer}>
            {businessRegistration.documents.map((doc, index) => (
              <TouchableOpacity
                key={index}
                style={styles.documentItem}
                onPress={() => handleDocumentPress(doc.url)}
                activeOpacity={0.7}>
                <Icon
                  name="document-text-outline"
                  size={RFValue(24)}
                  color={colors.secondary}
                  style={styles.documentIcon}
                />
                <View style={styles.documentInfo}>
                  <CustomText style={styles.documentName}>
                    {doc.originalName || doc.kind}
                  </CustomText>
                  <CustomText style={styles.documentType}>
                    {doc.kind === 'GST'
                      ? t('dealer.gst') || 'GST Document'
                      : doc.kind === 'LICENSE'
                      ? t('dealer.uploadLicense') || 'License Document'
                      : doc.kind === 'ID'
                      ? t('dealer.uploadIdProof') || 'ID Proof'
                      : t('dealer.panCard') || 'PAN Card'}
                  </CustomText>
                </View>
                <Icon name="open-outline" size={RFValue(20)} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Registration Dates */}
      <View style={styles.card}>
        <CustomText style={styles.cardTitle}>
          {t('dealer.registrationDetails') || 'Registration Details'}
        </CustomText>

        <View style={styles.infoRow}>
          <CustomText style={styles.infoLabel}>
            {t('dealer.registeredOn') || 'Registered On'}
          </CustomText>
          <CustomText style={styles.infoValue}>
            {formatDate(businessRegistration.createdAt)}
          </CustomText>
        </View>

        {businessRegistration.updatedAt && (
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <CustomText style={styles.infoLabel}>
              {t('dealer.lastUpdated') || 'Last Updated'}
            </CustomText>
            <CustomText style={styles.infoValue}>
              {formatDate(businessRegistration.updatedAt)}
            </CustomText>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default BusinessRegistrationInfo;
