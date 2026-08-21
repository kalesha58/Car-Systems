import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';

import { ChromeHeader } from '@components/common';
import { GarageVehicleDetailSkeleton } from '@components/loaders';
import { CustomerStackRoutes } from '@constants/routes';
import { useServiceBooking } from '@context/ServiceBookingContext';
import { useColors } from '@hooks/useColors';
import { useAuth } from '@context/index';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { getServices } from '@services/service.service';
import { getUserVehicleById, deleteUserVehicle } from '@services/userVehicle.service';
import type { IService } from '@app-types/service';
import type { UserVehicle } from '../../../types/userVehicle';
import { getServiceId } from '@utils/displayMappers';
import { extractAuthErrorMessage } from '@utils/authErrors';
import { lightHaptic, successHaptic } from '@utils/haptics';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.GarageVehicleDetail
>;

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80';

export function GarageVehicleDetailScreen({ route, navigation }: Props) {
  const colors = useColors();
  const { user } = useAuth();
  const { vehicleId, focusSection } = route.params;
  const screenWidth = Dimensions.get('window').width;
  const scrollRef = useRef<ScrollView>(null);
  const documentsY = useRef(0);

  const { startBookingFromGarage } = useServiceBooking();

  const [vehicle, setVehicle] = useState<UserVehicle | null>(null);
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingDocUrl, setViewingDocUrl] = useState<string | null>(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);

  const loadServices = useCallback(async (currentVehicle?: UserVehicle | null) => {
    try {
      const query: Parameters<typeof getServices>[0] = { limit: 10 };
      const v = currentVehicle ?? vehicle;
      if (v?.brand) query.vehicleBrand = v.brand;
      if (v?.model) query.vehicleModel = v.model;
      const response = await getServices(query);
      if (response.success && response.Response?.services) {
        setServices(response.Response.services);
      } else {
        setServices([]);
      }
    } catch {
      setServices([]);
    }
  }, [vehicle]);

  const loadVehicle = useCallback(
    async (opts?: { refreshing?: boolean }) => {
      if (opts?.refreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await getUserVehicleById(vehicleId);
        if (response.Response) {
          setVehicle(response.Response);
          void loadServices(response.Response);
        } else {
          setError('Vehicle not found');
        }
      } catch (err) {
        setError(extractAuthErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [vehicleId, loadServices],
  );

  const startSectionFocus = useCallback(() => {
    if (focusSection === 'documents') {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: documentsY.current, animated: true });
      }, 500);
    }
  }, [focusSection]);

  useFocusEffect(
    useCallback(() => {
      void loadVehicle();
    }, [loadVehicle]),
  );

  useEffect(() => {
    if (vehicle) {
      startSectionFocus();
    }
  }, [vehicle, startSectionFocus]);

  const handleBookService = () => {
    lightHaptic();
    const serviceId = getServiceId(services[0]) || '';
    if (!serviceId) {
      Alert.alert('No Services', 'No recommended services are available for this vehicle.');
      return;
    }
    startBookingFromGarage(vehicleId, serviceId);
    navigation.navigate(CustomerStackRoutes.ServiceBookingDateTime, { serviceId });
  };

  const handleDeleteVehicle = () => {
    lightHaptic();
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle from your garage?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              setLoading(true);
              await deleteUserVehicle(vehicleId);
              successHaptic();
              Alert.alert('Success', 'Vehicle has been successfully deleted.');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete vehicle. Please try again.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleMoreOptions = () => {
    lightHaptic();
    setOptionsModalVisible(true);
  };

  const handleEditDetails = () => {
    lightHaptic();
    Alert.alert('Edit Details', 'Vehicle details editing flow is coming soon.');
  };

  const handleAddReminder = () => {
    lightHaptic();
    Alert.alert('Add Reminder', 'Set customized reminders for insurance, service, and PUC renewals.');
  };

  const handleViewHistory = () => {
    lightHaptic();
    Alert.alert('Service History', 'No past service bookings found for this vehicle.');
  };

  const handleTogglePrimary = () => {
    successHaptic();
    setIsPrimary(!isPrimary);
    Alert.alert(
      isPrimary ? 'Primary Removed' : 'Set as Primary',
      isPrimary 
        ? 'This vehicle has been removed from primary driver access.' 
        : 'This vehicle is now set as your primary garage vehicle.'
    );
  };

  const handleShareVehicle = async () => {
    if (!vehicle) return;
    lightHaptic();
    const fuelLabel = vehicle.fuelType || 'N/A';
    const yearLabel = vehicle.year ? String(vehicle.year) : 'N/A';
    const colorLabel = vehicle.color || 'N/A';
    const docsVerified = [
      vehicle.documents?.rc ? '✅ RC' : '❌ RC',
      vehicle.documents?.insurance ? '✅ Insurance' : '❌ Insurance',
      vehicle.documents?.pollution ? '✅ PUC' : '❌ PUC',
    ].join('  ');
    const message = [
      `🚗 Vehicle Details — ${vehicle.brand} ${vehicle.model}`,
      `📋 Number Plate: ${vehicle.numberPlate}`,
      `📅 Year: ${yearLabel}`,
      `⛽ Fuel Type: ${fuelLabel}`,
      `🎨 Color: ${colorLabel}`,
      `📄 Documents: ${docsVerified}`,
      `\nShared via Motonode`,
    ].join('\n');
    try {
      await Share.share({ message });
    } catch {
      // user dismissed share sheet
    }
  };

  const handleViewDoc = (key: 'rc' | 'insurance' | 'pollution' | 'dl') => {
    lightHaptic();
    if (!vehicle) return;
    const urls: Record<string, string> = {
      rc: vehicle.documents?.rc || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800&auto=format&fit=crop&q=80',
      insurance: vehicle.documents?.insurance || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
      pollution: vehicle.documents?.pollution || 'https://images.unsplash.com/photo-1542435503-956c469947f6?w=800&auto=format&fit=crop&q=80',
      dl: vehicle.documents?.dl || 'https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=800&auto=format&fit=crop&q=80',
    };
    setViewingDocUrl(urls[key]);
  };

  if (loading && !vehicle) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChromeHeader contentPad={8}>
          <View style={styles.headerRow}>
            <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()} hitSlop={8}>
              <Feather name="arrow-left" size={22} color={colors.headerForeground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>
              Vehicle Details
            </Text>
            <View style={styles.headerBtn} />
          </View>
        </ChromeHeader>
        <GarageVehicleDetailSkeleton />
      </View>
    );
  }

  if (error || !vehicle) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ChromeHeader contentPad={8}>
          <View style={styles.headerRow}>
            <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()} hitSlop={8}>
              <Feather name="arrow-left" size={22} color={colors.headerForeground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>
              Vehicle Details
            </Text>
            <View style={styles.headerBtn} />
          </View>
        </ChromeHeader>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={40} color={colors.textTertiary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error ?? 'Vehicle not found'}
          </Text>
        </View>
      </View>
    );
  }

  // --- Dynamic Value Generators & Helper Functions ---
  const currentOwnerName = vehicle.ownerName || user?.name || 'Rohit Sharma';
  const vehicleColorName = vehicle.color || 'Red';
  const vehicleYear = vehicle.year || 2022;

  const colorMap: Record<string, string> = {
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#F59E0B',
    black: '#1E293B',
    white: '#FFFFFF',
    silver: '#CBD5E1',
    grey: '#64748B',
    orange: '#F97316',
  };
  const colorHex = colorMap[vehicleColorName.toLowerCase()] ?? '#EF4444';

  const getFuelType = (modelStr: string) => {
    const upper = modelStr.toUpperCase();
    if (upper.includes('EV') || upper.includes('ELECTRIC')) return 'Electric';
    if (upper.includes('CNG')) return 'CNG';
    if (upper.includes('DIESEL')) return 'Diesel';
    if (upper.includes('HYBRID')) return 'Hybrid';
    return 'Petrol';
  };
  const fuelType = getFuelType(vehicle.model);

  const getVariant = (modelStr: string) => {
    const lower = modelStr.toLowerCase();
    if (lower.includes('nexon')) return 'XZ+ (S)';
    if (lower.includes('creta')) return 'SX (O)';
    if (lower.includes('harrier')) return 'XZ+';
    if (lower.includes('punch')) return 'Creative';
    if (lower.includes('i20')) return 'Asta (O)';
    return 'Standard';
  };
  const variantStr = getVariant(vehicle.model);

  const calculateVehicleAge = (yearVal: number) => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - yearVal;
    if (age <= 0) return '6 Months';
    return `${age} Years 1 Month`;
  };
  const vehicleAge = calculateVehicleAge(vehicleYear);

  const getInsuranceProvider = (brandStr: string) => {
    const lower = brandStr.toLowerCase();
    if (lower.includes('tata')) return 'Tata AIG General Insurance';
    if (lower.includes('hyundai')) return 'ICICI Lombard General Insurance';
    if (lower.includes('maruti') || lower.includes('suzuki')) return 'Maruti Insurance Broking';
    return 'Bajaj Allianz General Insurance';
  };
  const insuranceProvider = getInsuranceProvider(vehicle.brand);

  const getInsurancePolicyNo = (plateStr: string) => {
    const clean = plateStr.replace(/[^A-Z0-9]/ig, '').toUpperCase();
    return `OG-29-${vehicleYear}-${clean}`;
  };
  const insurancePolicyNo = getInsurancePolicyNo(vehicle.numberPlate);

  const generateChassisNumber = (brandStr: string, modelStr: string, plateStr: string) => {
    const clean = plateStr.replace(/[^A-Z0-9]/ig, '').toUpperCase();
    const brandCode = (brandStr.substring(0, 3) + 'XX').substring(0, 3).toUpperCase();
    const modelCode = (modelStr.substring(0, 2) + 'XX').substring(0, 2).toUpperCase();
    return `MA${brandCode}${modelCode}81${clean}12345`;
  };
  const chassisNumber = generateChassisNumber(vehicle.brand, vehicle.model, vehicle.numberPlate);

  const generateEngineNumber = (modelStr: string, plateStr: string) => {
    const clean = plateStr.replace(/[^A-Z0-9]/ig, '').toUpperCase();
    const modelCode = (modelStr.substring(0, 2) + 'XX').substring(0, 2).toUpperCase();
    return `${modelCode}4FGM${clean}`;
  };
  const engineNumber = generateEngineNumber(vehicle.model, vehicle.numberPlate);

  const getInsuranceExpiryDate = () => {
    const nextYear = new Date().getFullYear();
    return `20 Nov ${nextYear}`;
  };
  const insuranceExpiryDate = getInsuranceExpiryDate();

  const getInsuranceExpiryCountdown = () => {
    const currentYear = new Date().getFullYear();
    const targetDate = new Date(currentYear, 10, 20); // 20 Nov
    const today = new Date();
    let diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      const nextTarget = new Date(currentYear + 1, 10, 20);
      diffDays = Math.ceil((nextTarget.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
    return diffDays;
  };
  const expiryCountdown = getInsuranceExpiryCountdown();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Modal visible={Boolean(viewingDocUrl)} transparent animationType="fade">
        <View style={styles.docModalBackdrop}>
          <Pressable style={styles.docModalClose} onPress={() => setViewingDocUrl(null)}>
            <Feather name="x" size={24} color={colors.white} />
          </Pressable>
          {viewingDocUrl ? (
            <Image source={{ uri: viewingDocUrl }} style={styles.docModalImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>

      {/* Custom Bottom Options Modal */}
      <Modal
        visible={optionsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <Pressable 
          style={styles.optionsBackdrop} 
          onPress={() => setOptionsModalVisible(false)}
        >
          <View style={[styles.optionsContent, { backgroundColor: colors.card }]}>
            <View style={styles.optionsHeader}>
              <Text style={[styles.optionsTitle, { color: colors.textPrimary }]}>Vehicle Options</Text>
              <Text style={[styles.optionsSubtitle, { color: colors.textSecondary }]}>
                Manage documents and options for this vehicle
              </Text>
            </View>

            <View style={styles.optionsList}>
              <Pressable
                style={({ pressed }) => [
                  styles.optionRow,
                  { borderColor: colors.border },
                  pressed && { backgroundColor: colors.primarySubtle }
                ]}
                onPress={() => {
                  setOptionsModalVisible(false);
                  scrollRef.current?.scrollTo({ y: documentsY.current, animated: true });
                }}
              >
                <View style={[styles.optionIconBox, { backgroundColor: colors.primarySubtle }]}>
                  <Feather name="file-text" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.optionText, { color: colors.textPrimary }]}>View Documents</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.optionRow,
                  { borderColor: colors.border },
                  pressed && { backgroundColor: colors.destructive + '22' }
                ]}
                onPress={() => {
                  setOptionsModalVisible(false);
                  setTimeout(() => {
                    handleDeleteVehicle();
                  }, 300);
                }}
              >
                <View style={[styles.optionIconBox, { backgroundColor: colors.destructive + '22' }]}>
                  <Feather name="trash-2" size={18} color={colors.destructive} />
                </View>
                <Text style={[styles.optionText, { color: colors.destructive }]}>Delete Vehicle</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.optionsCancelBtn, { borderColor: colors.border }]}
              onPress={() => setOptionsModalVisible(false)}
            >
              <Text style={[styles.optionsCancelText, { color: colors.textPrimary }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <ChromeHeader contentPad={8}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerBtn} onPress={() => { lightHaptic(); navigation.goBack(); }} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.headerForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>
            Vehicle Details
          </Text>
          <Pressable style={styles.headerBtn} onPress={handleMoreOptions} hitSlop={8}>
            <Feather name="more-vertical" size={22} color={colors.headerForeground} />
          </Pressable>
        </View>
      </ChromeHeader>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadVehicle({ refreshing: true })}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Vehicle Header Card */}
        <View style={styles.overviewContainer}>
          <View style={[styles.overviewImgContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Image
              source={{ uri: vehicle.images?.[0] || DEFAULT_IMAGE }}
              style={styles.vehicleImg}
              resizeMode="cover"
            />
          </View>
          <View style={styles.overviewTextContainer}>
            <Text style={[styles.vehicleNameText, { color: colors.textPrimary }]}>
              {vehicle.brand} {vehicle.model}
            </Text>
            
            {/* Indian Flag number plate badge */}
            <View style={[styles.plateBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.plateFlag}>🇮🇳</Text>
              <Text style={[styles.plateNum, { color: colors.textPrimary }]}>{vehicle.numberPlate}</Text>
            </View>

            <Text style={[styles.vehicleSpecsText, { color: colors.textSecondary }]}>
              {vehicleYear}  •  {fuelType}  •  {vehicleColorName}
            </Text>
          </View>
        </View>

        {/* Action buttons row inside outline card wrapper */}
        <View style={[styles.actionsOutlineRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable style={styles.actionBtnItem} onPress={handleEditDetails}>
            <Feather name="edit-3" size={18} color={colors.icon} />
            <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Edit Details</Text>
          </Pressable>
          <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.actionBtnItem} onPress={handleAddReminder}>
            <Feather name="bell" size={18} color={colors.icon} />
            <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>Add Reminder</Text>
          </Pressable>
          <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.actionBtnItem} onPress={handleViewHistory}>
            <Feather name="clock" size={18} color={colors.icon} />
            <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>View History</Text>
          </Pressable>
          <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.actionBtnItem} onPress={handleTogglePrimary}>
            <Feather name="star" size={18} color={isPrimary ? colors.starActive : colors.icon} />
            <Text style={[styles.actionBtnLabel, { color: colors.textPrimary }]}>{isPrimary ? 'Primary' : 'Set as Primary'}</Text>
          </Pressable>
          <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.actionBtnItem} onPress={handleShareVehicle}>
            <Feather name="share-2" size={18} color={colors.primary} />
            <Text style={[styles.actionBtnLabel, { color: colors.primary }]}>Share</Text>
          </Pressable>
        </View>

        {/* Documents Section */}
        <View
          onLayout={(e) => {
            documentsY.current = e.nativeEvent.layout.y;
          }}
          style={styles.sectionMargin}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>Documents</Text>
            <Pressable onPress={() => lightHaptic()}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.documentsContainer}
          >
            {/* Document Card 1: RC */}
            <Pressable style={[styles.documentCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleViewDoc('rc')}>
              <View style={styles.docHeaderRow}>
                <View style={[styles.docIconWrapper, { backgroundColor: colors.muted }]}>
                  <Feather name="file-text" size={16} color={colors.success} />
                </View>
                <View style={[styles.verifiedBadge, { backgroundColor: colors.muted }]}>
                  <Feather name="check" size={8} color={colors.success} style={{ marginRight: 2 }} />
                  <Text style={[styles.verifiedText, { color: colors.success }]}>Verified</Text>
                </View>
              </View>
              <Text style={[styles.docCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                RC (Registration Certificate)
              </Text>
              <Text style={[styles.docCardDetail, { color: colors.textSecondary }]}>{vehicle.numberPlate}</Text>
              <Text style={[styles.docCardExpiry, { color: colors.textTertiary }]}>Exp: 15 Mar 2037</Text>
            </Pressable>

            {/* Document Card 2: Insurance */}
            <Pressable style={[styles.documentCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleViewDoc('insurance')}>
              <View style={styles.docHeaderRow}>
                <View style={[styles.docIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                  <Feather name="shield" size={16} color={colors.primary} />
                </View>
                <View style={[styles.verifiedBadge, { backgroundColor: colors.muted }]}>
                  <Feather name="check" size={8} color={colors.success} style={{ marginRight: 2 }} />
                  <Text style={[styles.verifiedText, { color: colors.success }]}>Verified</Text>
                </View>
              </View>
              <Text style={[styles.docCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                Insurance Certificate
              </Text>
              <Text style={[styles.docCardDetail, { color: colors.textSecondary }]}>{vehicle.brand}</Text>
              <Text style={[styles.docCardExpiry, { color: colors.textTertiary }]}>Exp: 20 Nov 2025</Text>
              <Text style={[styles.docLinkText, { color: colors.primary }]}>View Policy</Text>
            </Pressable>

            {/* Document Card 3: PUC */}
            <Pressable style={[styles.documentCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleViewDoc('pollution')}>
              <View style={styles.docHeaderRow}>
                <View style={[styles.docIconWrapper, { backgroundColor: colors.muted }]}>
                  <Feather name="wind" size={16} color={colors.info} />
                </View>
                <View style={[styles.verifiedBadge, { backgroundColor: colors.muted }]}>
                  <Feather name="check" size={8} color={colors.success} style={{ marginRight: 2 }} />
                  <Text style={[styles.verifiedText, { color: colors.success }]}>Verified</Text>
                </View>
              </View>
              <Text style={[styles.docCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                PUC Certificate
              </Text>
              <Text style={[styles.docCardDetail, { color: colors.textSecondary }]}>{vehicle.numberPlate}</Text>
              <Text style={[styles.docCardExpiry, { color: colors.textTertiary }]}>Exp: 10 May 2025</Text>
            </Pressable>

            {/* Document Card 4: Driving License */}
            <Pressable style={[styles.documentCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleViewDoc('dl')}>
              <View style={styles.docHeaderRow}>
                <View style={[styles.docIconWrapper, { backgroundColor: colors.muted }]}>
                  <Feather name="credit-card" size={16} color={colors.destructive} />
                </View>
                <View style={[styles.verifiedBadge, { backgroundColor: colors.muted }]}>
                  <Feather name="check" size={8} color={colors.success} style={{ marginRight: 2 }} />
                  <Text style={[styles.verifiedText, { color: colors.success }]}>Verified</Text>
                </View>
              </View>
              <Text style={[styles.docCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                Driving License
              </Text>
              <Text style={[styles.docCardDetail, { color: colors.textSecondary }]}>{currentOwnerName}</Text>
              <Text style={[styles.docCardExpiry, { color: colors.textTertiary }]}>Exp: 14 Aug 2032</Text>
            </Pressable>
          </ScrollView>

          {/* Verification Status Banner */}
          <View style={[styles.verificationBanner, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <View style={[styles.verifiedBannerIconBox, { backgroundColor: colors.card }]}>
              <Feather name="shield" size={16} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.verifiedBannerTitle, { color: colors.textPrimary }]}>
                All documents are verified and up to date
              </Text>
              <Text style={[styles.verifiedBannerSub, { color: colors.textSecondary }]}>
                You're good to go! Keep your documents updated for hassle-free services.
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textTertiary} />
          </View>
        </View>

        {/* Vehicle Information Grid Section */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>Vehicle Information</Text>
          
          <View style={styles.infoGrid}>
            {/* Item 1: Owner Name */}
            <View style={[styles.gridItem, { backgroundColor: colors.card }]}>
              <View style={[styles.gridIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                <Feather name="user" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridLabel, { color: colors.textTertiary }]}>Owner Name</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{currentOwnerName}</Text>
              </View>
            </View>

            {/* Owner Relation (if not own vehicle) */}
            {!vehicle.isOwnVehicle && vehicle.relation && vehicle.relation !== 'Self' ? (
              <View style={[styles.gridItem, { backgroundColor: colors.card }]}>
                <View style={[styles.gridIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                  <Feather name="users" size={15} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gridLabel, { color: colors.textTertiary }]}>Owner Relation</Text>
                  <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{vehicle.relation}</Text>
                </View>
              </View>
            ) : null}

            {/* Item 2: Registration Number */}
            <View style={[styles.gridItem, { backgroundColor: colors.card }]}>
              <View style={[styles.gridIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                <Feather name="credit-card" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridLabel, { color: colors.textTertiary }]}>Registration Number</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{vehicle.numberPlate}</Text>
              </View>
            </View>

            {/* Item 3: Registration Date */}
            <View style={[styles.gridItem, { backgroundColor: colors.card }]}>
              <View style={[styles.gridIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                <Feather name="calendar" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridLabel, { color: colors.textTertiary }]}>Registration Date</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>15 Mar {vehicleYear}</Text>
              </View>
            </View>

            {/* Item 4: Manufacturing Year */}
            <View style={[styles.gridItem, { backgroundColor: colors.card }]}>
              <View style={[styles.gridIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                <Feather name="calendar" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridLabel, { color: colors.textTertiary }]}>Manufacturing Year</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{vehicleYear}</Text>
              </View>
            </View>

            {/* Item 5: Chassis Number */}
            <View style={[styles.gridItem, { backgroundColor: colors.card }]}>
              <View style={[styles.gridIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                <Feather name="hash" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridLabel, { color: colors.textTertiary }]}>Chassis Number</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{chassisNumber}</Text>
              </View>
            </View>

            {/* Item 6: Vehicle Make */}
            <View style={[styles.gridItem, { backgroundColor: colors.card }]}>
              <View style={[styles.gridIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                <Feather name="award" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridLabel, { color: colors.textTertiary }]}>Vehicle Make</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{vehicle.brand}</Text>
              </View>
            </View>

            {/* Item 7: Engine Number */}
            <View style={[styles.gridItem, { backgroundColor: colors.card }]}>
              <View style={[styles.gridIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                <Feather name="cpu" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridLabel, { color: colors.textTertiary }]}>Engine Number</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{engineNumber}</Text>
              </View>
            </View>

            {/* Item 8: Model */}
            <View style={[styles.gridItem, { backgroundColor: colors.card }]}>
              <View style={[styles.gridIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                <Feather name="settings" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridLabel, { color: colors.textTertiary }]}>Model</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{vehicle.model}</Text>
              </View>
            </View>

            {/* Item 9: Insurance Provider */}
            <View style={[styles.gridItem, { backgroundColor: colors.card }]}>
              <View style={[styles.gridIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                <Feather name="umbrella" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridLabel, { color: colors.textTertiary }]}>Insurance Provider</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{insuranceProvider}</Text>
              </View>
            </View>

            {/* Item 10: Insurance Policy No. */}
            <View style={[styles.gridItem, { backgroundColor: colors.card }]}>
              <View style={[styles.gridIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                <Feather name="file-text" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridLabel, { color: colors.textTertiary }]}>Insurance Policy No.</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{insurancePolicyNo}</Text>
              </View>
            </View>

            {/* Item 11: Vehicle Age */}
            <View style={[styles.gridItem, { backgroundColor: colors.card }]}>
              <View style={[styles.gridIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                <Feather name="clock" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridLabel, { color: colors.textTertiary }]}>Vehicle Age</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{vehicleAge}</Text>
              </View>
            </View>

            {/* Item 12: Variant */}
            <View style={[styles.gridItem, { backgroundColor: colors.card }]}>
              <View style={[styles.gridIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                <Feather name="layers" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridLabel, { color: colors.textTertiary }]}>Variant</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{variantStr}</Text>
              </View>
            </View>

            {/* Item 13: Fuel Type */}
            <View style={[styles.gridItem, { backgroundColor: colors.card }]}>
              <View style={[styles.gridIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                <Feather name="droplet" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridLabel, { color: colors.textTertiary }]}>Fuel Type</Text>
                <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{fuelType}</Text>
              </View>
            </View>

            {/* Item 14: Color */}
            <View style={[styles.gridItem, { backgroundColor: colors.card }]}>
              <View style={[styles.gridIconWrapper, { backgroundColor: colors.primarySubtle }]}>
                <Feather name="aperture" size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridLabel, { color: colors.textTertiary }]}>Color</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.colorIndicatorDot, { backgroundColor: colorHex }]} />
                  <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{vehicleColorName}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Upcoming Reminders Section */}
        <View style={[styles.sectionMargin, { marginBottom: 40 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>Upcoming Reminders</Text>
            <Pressable onPress={() => lightHaptic()}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.reminderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleBookService}
          >
            <View style={[styles.reminderBellWrapper, { backgroundColor: colors.primarySubtle }]}>
              <Feather name="bell" size={18} color={colors.primary} />
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={[styles.reminderTitle, { color: colors.textPrimary }]}>Insurance Renewal</Text>
              <Text style={[styles.reminderDate, { color: colors.primary }]}>{insuranceExpiryDate}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.reminderCountdown, { color: colors.primary }]}>In {expiryCountdown} days</Text>
              <Feather name="chevron-right" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  errorText: { fontSize: 14, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  scrollContent: { paddingBottom: 24 },
  
  // Overview top section
  overviewContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
    gap: 16,
  },
  overviewImgContainer: {
    width: 120,
    height: 100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  vehicleImg: {
    width: '100%',
    height: '100%',
  },
  overviewTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  vehicleNameText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  plateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  plateFlag: {
    fontSize: 12,
    marginRight: 4,
  },
  plateNum: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  vehicleSpecsText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
  },

  // Action icons outline row
  actionsOutlineRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    color: '#334155',
    textAlign: 'center',
  },
  actionDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },

  // Section styling
  sectionMargin: {
    marginTop: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#1E293B',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  viewAllText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#EF4444', // Red View All matching screenshot
  },

  // Documents carousel
  documentsContainer: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  documentCard: {
    width: 140,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  docHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    color: '#10B981',
  },
  docCardTitle: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#1E293B',
    lineHeight: 14,
    marginTop: 4,
  },
  docCardDetail: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
  },
  docCardExpiry: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    color: '#94A3B8',
  },
  docLinkText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#E60012',
    marginTop: 2,
  },

  // Verification status banner
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 14,
    gap: 10,
  },
  verifiedBannerIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBannerTitle: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#065F46',
  },
  verifiedBannerSub: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    color: '#047857',
    marginTop: 1,
    lineHeight: 12,
  },

  // Vehicle Information Grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  gridItem: {
    width: '48.5%', // 2 columns with spacing
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 8,
  },
  gridIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: {
    fontSize: 8,
    fontFamily: 'Inter_500Medium',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#1E293B',
    marginTop: 1,
  },
  colorIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 6,
  },

  // Upcoming reminders
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 14,
    gap: 12,
  },
  reminderBellWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#1E293B',
  },
  reminderDate: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#EF4444',
    marginTop: 2,
  },
  reminderCountdown: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#EF4444',
  },

  // Bottom action button
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 20,
  },
  bookBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },

  docModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
  },
  docModalClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 24,
    right: 20,
    zIndex: 2,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docModalImage: {
    width: '100%',
    height: '80%',
  },
  optionsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  optionsContent: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  optionsHeader: {
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  optionsSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  optionsList: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  optionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  optionsCancelBtn: {
    marginTop: 16,
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsCancelText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
});
