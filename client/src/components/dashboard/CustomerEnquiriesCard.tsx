import React, { FC, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '@hooks/useTheme';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import { getDealerEnquiries, ICustomerEnquiry } from '@service/customerEnquiryService';
import { useTranslation } from 'react-i18next';

interface CustomerEnquiriesCardProps {
  limit?: number;
}

const CustomerEnquiriesCard: FC<CustomerEnquiriesCardProps> = ({ limit = 2 }) => {
  const { colors: theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [enquiries, setEnquiries] = useState<ICustomerEnquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnquiries = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getDealerEnquiries({ status: 'new', limit });
      setEnquiries(result.enquiries || []);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border || 'transparent',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: RFValue(16),
      fontFamily: Fonts.SemiBold,
      color: theme.text,
    },
    count: {
      fontSize: RFValue(14),
      fontFamily: Fonts.SemiBold,
      color: theme.primary,
    },
    viewAllButton: {
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    viewAllText: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Medium,
      color: theme.secondary,
    },
    enquiryItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border || theme.backgroundSecondary,
    },
    lastEnquiryItem: {
      borderBottomWidth: 0,
    },
    enquiryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    enquiryName: {
      fontSize: RFValue(14),
      fontFamily: Fonts.SemiBold,
      color: theme.text,
      flex: 1,
    },
    enquiryTime: {
      fontSize: RFValue(11),
      fontFamily: Fonts.Regular,
      color: theme.textSecondary,
    },
    enquiryMessage: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      color: theme.textSecondary,
      marginTop: 4,
    },
    emptyState: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      color: theme.textSecondary,
    },
    loadingContainer: {
      paddingVertical: 20,
      alignItems: 'center',
    },
  });

  const handleViewAll = () => {
    // Navigate to full enquiries screen if available
    // (navigation as any).navigate('CustomerEnquiries');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <IconIonicons name="notifications-outline" size={RFValue(20)} color={theme.text} />
            <CustomText style={styles.title}>
              {t('dealer.newCustomerEnquiries') || 'New Customer Enquiries'}
            </CustomText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      </View>
    );
  }

  if (enquiries.length === 0) {
    return null; // Don't show card if no enquiries
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <IconIonicons name="notifications-outline" size={RFValue(20)} color={theme.text} />
          <CustomText style={styles.title}>
            {t('dealer.newCustomerEnquiries') || 'New Customer Enquiries'}
          </CustomText>
          <CustomText style={styles.count}>({enquiries.length})</CustomText>
        </View>
        <TouchableOpacity onPress={handleViewAll} style={styles.viewAllButton}>
          <CustomText style={styles.viewAllText}>
            {t('dealer.viewAll') || 'View All'}
          </CustomText>
        </TouchableOpacity>
      </View>

      {enquiries.map((enquiry, index) => (
        <TouchableOpacity
          key={enquiry.id}
          style={[
            styles.enquiryItem,
            index === enquiries.length - 1 && styles.lastEnquiryItem,
          ]}
          activeOpacity={0.7}>
          <View style={styles.enquiryHeader}>
            <CustomText style={styles.enquiryName} numberOfLines={1}>
              {enquiry.customerName || 'Customer'}
            </CustomText>
            <CustomText style={styles.enquiryTime}>
              {formatTimeAgo(enquiry.createdAt)}
            </CustomText>
          </View>
          <CustomText style={styles.enquiryMessage} numberOfLines={2}>
            {enquiry.message}
          </CustomText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default CustomerEnquiriesCard;
