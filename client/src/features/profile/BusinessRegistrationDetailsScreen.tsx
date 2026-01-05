import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';
import { screenHeight, screenWidth } from '@utils/Scaling';
import { Fonts, Colors } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import CustomHeader from '@components/ui/CustomHeader';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@state/authStore';
import { getBusinessRegistrationByUserId, IBusinessRegistration } from '@service/dealerService';
import { formatCurrency } from '@utils/analytics';
import { useTranslation } from 'react-i18next';
import SkeletonLoader from '@components/ui/SkeletonLoader';

const BusinessRegistrationDetailsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { user } = useAuthStore();

    const [registration, setRegistration] = useState<IBusinessRegistration | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRegistration();
    }, [user?.id]);

    const fetchRegistration = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await getBusinessRegistrationByUserId(user.id);
            setRegistration(data);
        } catch (error) {
            console.error('Error fetching registration details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditPress = () => {
        if (registration) {
            // Navigate to BusinessRegistrationScreen with registration data for editing
            (navigation as any).navigate('BusinessRegistration', {
                isEdit: true,
                registrationData: registration
            });
        }
    };

    const handleAddPress = () => {
        // Navigate to BusinessRegistrationScreen for new registration
        (navigation as any).navigate('BusinessRegistration', {
            isEdit: false,
            registrationData: null
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return '#10b981';
            case 'pending': return '#f59e0b';
            case 'rejected': return '#ef4444';
            default: return colors.textSecondary;
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        content: {
            padding: 16,
        },
        card: {
            backgroundColor: colors.cardBackground,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        title: {
            fontSize: RFValue(14),
            fontFamily: Fonts.Bold,
            color: colors.text,
            flex: 1,
        },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
        },
        statusText: {
            fontSize: RFValue(10),
            fontFamily: Fonts.SemiBold,
            color: '#fff',
            textTransform: 'capitalize',
        },
        detailRow: {
            marginBottom: 12,
        },
        label: {
            fontSize: RFValue(10),
            fontFamily: Fonts.Medium,
            color: colors.textSecondary,
            marginBottom: 4,
        },
        value: {
            fontSize: RFValue(12),
            fontFamily: Fonts.Regular,
            color: colors.text,
        },
        divider: {
            height: 1,
            backgroundColor: colors.border,
            marginVertical: 12,
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 40,
        },
        headerButtons: {
            flexDirection: 'row',
            gap: 12,
        },
        headerButton: {
            padding: 8,
        },
        sectionTitle: {
            fontSize: RFValue(12),
            fontFamily: Fonts.SemiBold,
            color: colors.text,
            marginBottom: 10,
        },
        imagesContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 8,
        },
        imageWrapper: {
            width: screenWidth * 0.25,
            height: screenWidth * 0.25,
            borderRadius: 8,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
        },
        image: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
        },
        docRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.cardBackground,
            marginTop: 10,
            gap: 10,
        },
        docLeft: {
            flex: 1,
        },
        docTitle: {
            fontSize: RFValue(10),
            fontFamily: Fonts.Medium,
            color: colors.text,
        },
        docSub: {
            fontSize: RFValue(8),
            fontFamily: Fonts.Regular,
            color: colors.textSecondary,
            marginTop: 2,
        },
    });

    const RightHeaderComponent = () => (
        <View style={styles.headerButtons}>
            {/* Edit Icon - Edit Current */}
            {registration && (
                <TouchableOpacity onPress={handleEditPress} style={styles.headerButton}>
                    <Icon name="create-outline" size={RFValue(20)} color={colors.text} />
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <CustomHeader
                    title={t('dealer.businessRegistration') || 'Business Registration'}
                />
                <View style={[styles.content]}>
                    <View style={styles.card}>
                        {/* Header Row Skeleton */}
                        <View style={styles.headerRow}>
                            <SkeletonLoader width={screenWidth * 0.4} height={20} />
                            <SkeletonLoader width={80} height={24} borderRadius={6} />
                        </View>

                        {/* Detail Rows Skeleton */}
                        <View style={{ gap: 16, marginBottom: 16 }}>
                            <View>
                                <SkeletonLoader width={80} height={12} style={{ marginBottom: 6 }} />
                                <SkeletonLoader width={screenWidth * 0.5} height={16} />
                            </View>
                            <View>
                                <SkeletonLoader width={60} height={12} style={{ marginBottom: 6 }} />
                                <SkeletonLoader width={screenWidth * 0.3} height={16} />
                            </View>
                            <View>
                                <SkeletonLoader width={70} height={12} style={{ marginBottom: 6 }} />
                                <SkeletonLoader width={screenWidth * 0.7} height={16} />
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Payout/Second Section Skeleton */}
                        <View style={{ marginBottom: 16 }}>
                            <SkeletonLoader width={100} height={16} style={{ marginBottom: 12 }} />
                            <View style={{ gap: 12 }}>
                                <View style={styles.detailRow}>
                                    <SkeletonLoader width={90} height={14} />
                                </View>
                                <View style={styles.detailRow}>
                                    <SkeletonLoader width={screenWidth * 0.4} height={14} />
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Photos/Docs Skeleton */}
                        <View style={{ marginTop: 8 }}>
                            <SkeletonLoader width={90} height={16} style={{ marginBottom: 12 }} />
                            <View style={styles.imagesContainer}>
                                <SkeletonLoader width={screenWidth * 0.25} height={screenWidth * 0.25} borderRadius={8} />
                                <SkeletonLoader width={screenWidth * 0.25} height={screenWidth * 0.25} borderRadius={8} />
                                <SkeletonLoader width={screenWidth * 0.25} height={screenWidth * 0.25} borderRadius={8} />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CustomHeader
                title={t('dealer.businessRegistration') || 'Business Registration'}
                rightComponent={<RightHeaderComponent />}
            />

            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {registration ? (
                    <View style={styles.card}>
                        <View style={styles.headerRow}>
                            <CustomText style={styles.title}>{registration.businessName}</CustomText>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(registration.status) }]}>
                                <CustomText style={styles.statusText}>{registration.status}</CustomText>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <CustomText style={styles.label}>{t('dealer.businessType') || 'Business Type'}</CustomText>
                            <CustomText style={styles.value}>{registration.type}</CustomText>
                        </View>

                        <View style={styles.detailRow}>
                            <CustomText style={styles.label}>{t('dealer.phone') || 'Phone'}</CustomText>
                            <CustomText style={styles.value}>{registration.phone}</CustomText>
                        </View>

                        <View style={styles.detailRow}>
                            <CustomText style={styles.label}>{t('dealer.address') || 'Address'}</CustomText>
                            <CustomText style={styles.value}>{registration.address}</CustomText>
                        </View>

                        {registration.gst && (
                            <View style={styles.detailRow}>
                                <CustomText style={styles.label}>{t('dealer.gst') || 'GST'}</CustomText>
                                <CustomText style={styles.value}>{registration.gst}</CustomText>
                            </View>
                        )}

                        {registration.payout && (
                            <>
                                <View style={styles.divider} />
                                <CustomText style={[styles.title, { marginBottom: 12 }]}>{t('dealer.payoutDetails') || 'Payout Details'}</CustomText>

                                <View style={styles.detailRow}>
                                    <CustomText style={styles.label}>{t('dealer.payoutType') || 'Type'}</CustomText>
                                    <CustomText style={styles.value}>{registration.payout.type}</CustomText>
                                </View>

                                {registration.payout.type === 'UPI' && registration.payout.upiId && (
                                    <View style={styles.detailRow}>
                                        <CustomText style={styles.label}>{t('dealer.upiId') || 'UPI ID'}</CustomText>
                                        <CustomText style={styles.value}>{registration.payout.upiId}</CustomText>
                                    </View>
                                )}

                                {registration.payout.type === 'BANK' && registration.payout.bank && (
                                    <>
                                        <View style={styles.detailRow}>
                                            <CustomText style={styles.label}>{t('dealer.accountName') || 'Account Name'}</CustomText>
                                            <CustomText style={styles.value}>{registration.payout.bank.accountName}</CustomText>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <CustomText style={styles.label}>{t('dealer.accountNumber') || 'Account Number'}</CustomText>
                                            <CustomText style={styles.value}>{registration.payout.bank.accountNumber}</CustomText>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <CustomText style={styles.label}>{t('dealer.ifsc') || 'IFSC'}</CustomText>
                                            <CustomText style={styles.value}>{registration.payout.bank.ifsc}</CustomText>
                                        </View>
                                    </>
                                )}
                            </>
                        )}

                        {/* Shop Photos */}
                        {registration.shopPhotos && Array.isArray(registration.shopPhotos) && registration.shopPhotos.length > 0 && (
                            <>
                                <View style={styles.divider} />
                                <CustomText style={styles.sectionTitle}>{t('dealer.shopPhotos') || 'Shop Photos'}</CustomText>
                                <View style={styles.imagesContainer}>
                                    {registration.shopPhotos.map((photo, idx: number) => (
                                        <View key={`${photo?.url}_${idx}`} style={styles.imageWrapper}>
                                            <Image source={{ uri: photo?.url }} style={styles.image} />
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Documents */}
                        {registration.documents && Array.isArray(registration.documents) && registration.documents.length > 0 && (
                            <>
                                <View style={styles.divider} />
                                <CustomText style={styles.sectionTitle}>{t('dealer.documents') || 'Documents'}</CustomText>
                                <View style={styles.imagesContainer}>
                                    {registration.documents.map((doc, idx: number) => (
                                        <TouchableOpacity
                                            key={`${doc?.kind}_${doc?.url}_${idx}`}
                                            style={styles.imageWrapper}
                                            onPress={() => doc?.url && Linking.openURL(doc.url)}
                                        >
                                            {doc?.mimeType === 'application/pdf' ? (
                                                <View style={[styles.image, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cardBackground }]}>
                                                    <Icon name="document-text-outline" size={RFValue(24)} color={colors.text} />
                                                    <CustomText style={{ fontSize: RFValue(8), marginTop: 4, color: colors.text }}>{doc.kind}</CustomText>
                                                </View>
                                            ) : (
                                                <Image source={{ uri: doc?.url }} style={styles.image} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        <View style={styles.divider} />
                        <View style={styles.detailRow}>
                            <CustomText style={styles.label}>{t('dealer.registeredOn') || 'Registered On'}</CustomText>
                            <CustomText style={styles.value}>{new Date(registration.createdAt).toLocaleDateString()}</CustomText>
                        </View>
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Icon name="business-outline" size={RFValue(40)} color={colors.disabled} />
                        <CustomText style={[styles.label, { marginTop: 12, textAlign: 'center' }]}>
                            {t('dealer.noRegistration') || 'No business registration found'}
                        </CustomText>
                        <TouchableOpacity
                            style={{ marginTop: 16, padding: 12, backgroundColor: colors.secondary, borderRadius: 8 }}
                            onPress={handleAddPress}
                        >
                            <CustomText style={[styles.statusText, { fontSize: RFValue(12) }]}>
                                {t('dealer.registerBusiness') || 'Register Business'}
                            </CustomText>
                        </TouchableOpacity>
                    </View>
                )
                }
            </ScrollView >
        </View >
    );
};

export default BusinessRegistrationDetailsScreen;
