import React, {useEffect, useMemo, useState, useRef} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  RefreshControl,
  Alert,
} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import {launchImageLibrary, ImagePickerResponse} from 'react-native-image-picker';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {useToast} from '@hooks/useToast';
import {getUserVehicleById, updateUserVehicle} from '@service/vehicleService';
import {uploadImage} from '@service/postService';
import type {IUserVehicle, IVehicleDocuments} from '../../types/vehicle/IVehicle';
import SkeletonLoader from '@components/ui/SkeletonLoader';
import ImagePreviewModal from '@components/common/ImagePreviewModal/ImagePreviewModal';

type UserVehicleDetailRouteParams = {
  UserVehicleDetail: {
    vehicleId: string;
  };
};

type DocumentType = 'rc' | 'insurance' | 'pollution' | 'dl';

interface DocumentCardProps {
  type: DocumentType;
  label: string;
  icon: string;
  documentUrl?: string;
  onUpload: () => void;
  onView: () => void;
  isUploading: boolean;
  colors: any;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  type,
  label,
  icon,
  documentUrl,
  onUpload,
  onView,
  isUploading,
  colors,
}) => {
  const hasDocument = !!documentUrl;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: hasDocument ? Colors.secondary + '20' : colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    textSection: {
      flex: 1,
    },
    documentLabel: {
      fontSize: RFValue(14),
      fontFamily: Fonts.SemiBold,
      color: colors.text,
      marginBottom: 4,
    },
    documentStatus: {
      fontSize: RFValue(11),
      fontFamily: Fonts.Regular,
      color: hasDocument ? Colors.secondary : colors.disabled,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      minWidth: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewButton: {
      backgroundColor: Colors.secondary + '20',
    },
    uploadButton: {
      backgroundColor: Colors.secondary,
    },
    buttonText: {
      fontSize: RFValue(11),
      fontFamily: Fonts.Medium,
      color: Colors.secondary,
    },
    uploadButtonText: {
      color: '#fff',
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <Icon
              name={icon}
              size={RFValue(24)}
              color={hasDocument ? Colors.secondary : colors.disabled}
            />
          </View>
          <View style={styles.textSection}>
            <CustomText style={styles.documentLabel}>{label}</CustomText>
            <CustomText style={styles.documentStatus}>
              {hasDocument ? 'Uploaded' : 'Not uploaded'}
            </CustomText>
          </View>
        </View>
        <View style={styles.actionButtons}>
          {hasDocument && (
            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
              onPress={onView}
              activeOpacity={0.7}>
              <CustomText style={styles.buttonText}>View</CustomText>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.uploadButton]}
            onPress={onUpload}
            disabled={isUploading}
            activeOpacity={0.7}>
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <CustomText style={[styles.buttonText, styles.uploadButtonText]}>
                {hasDocument ? 'Update' : 'Add'}
              </CustomText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const UserVehicleDetail: React.FC = () => {
  const route = useRoute<RouteProp<UserVehicleDetailRouteParams, 'UserVehicleDetail'>>();
  const {vehicleId} = route.params;

  const {colors} = useTheme();
  const {showError, showSuccess} = useToast();
  const screenWidth = Dimensions.get('window').width;

  const [vehicle, setVehicle] = useState<IUserVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<DocumentType | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadVehicle = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getUserVehicleById(vehicleId);
      if (response.success && response.Response) {
        setVehicle(response.Response);
      } else {
        showError('Failed to load vehicle details');
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404) {
        showError('Vehicle not found');
      } else {
        showError(e?.response?.data?.message || 'Failed to load vehicle');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
    }
  }, [vehicleId]);

  const handleImageScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    setCurrentImageIndex(index);
  };

  const handleDocumentUpload = (type: DocumentType) => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
        selectionLimit: 1,
      },
      async (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorCode) {
          return;
        }

        const uri = response.assets?.[0]?.uri;
        if (!uri) {
          return;
        }

        setUploadingDoc(type);
        try {
          // Upload image
          const imageUrl = await uploadImage(uri);

          // Update vehicle documents
          const currentDocuments: IVehicleDocuments = vehicle?.documents || {};
          const updatedDocuments: IVehicleDocuments = {
            ...currentDocuments,
            [type]: imageUrl,
          };

          const updateResponse = await updateUserVehicle(vehicleId, {
            documents: updatedDocuments,
          });

          if (updateResponse.success && updateResponse.Response) {
            setVehicle(updateResponse.Response);
            showSuccess(`${getDocumentLabel(type)} uploaded successfully`);
          } else {
            showError('Failed to update document');
          }
        } catch (error: any) {
          console.error('Error uploading document:', error);
          showError(
            error?.response?.data?.message ||
              error?.message ||
              'Failed to upload document. Please try again.',
          );
        } finally {
          setUploadingDoc(null);
        }
      },
    );
  };

  const handleDocumentView = (type: DocumentType) => {
    const documentUrl = vehicle?.documents?.[type];
    if (documentUrl) {
      setViewingDocument(documentUrl);
    }
  };

  const getDocumentLabel = (type: DocumentType): string => {
    switch (type) {
      case 'rc':
        return 'RC';
      case 'insurance':
        return 'Insurance';
      case 'pollution':
        return 'Pollution Certificate';
      case 'dl':
        return 'Driving License';
      default:
        return 'Document';
    }
  };

  const getDocumentIcon = (type: DocumentType): string => {
    switch (type) {
      case 'rc':
        return 'document-text-outline';
      case 'insurance':
        return 'shield-checkmark-outline';
      case 'pollution':
        return 'leaf-outline';
      case 'dl':
        return 'card-outline';
      default:
        return 'document-outline';
    }
  };

  const images = vehicle?.images && vehicle.images.length > 0 ? vehicle.images : [];
  const snapOffsets = images.map((_, index: number) => index * screenWidth);

  const documentTypes: DocumentType[] = ['rc', 'insurance', 'pollution', 'dl'];

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
          resizeMode: 'cover',
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
        sectionTitle: {
          marginTop: 24,
          marginBottom: 12,
          fontFamily: Fonts.Bold,
          fontSize: RFValue(16),
          color: colors.text,
        },
        detailRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        detailLabel: {color: colors.disabled, fontSize: RFValue(12), fontFamily: Fonts.Regular},
        detailValue: {
          fontSize: RFValue(12),
          fontFamily: Fonts.Medium,
          color: colors.text,
        },
        documentsSection: {
          marginTop: 8,
        },
        emptyState: {
          padding: 40,
          alignItems: 'center',
          justifyContent: 'center',
        },
        emptyText: {
          fontSize: RFValue(12),
          color: colors.disabled,
          textAlign: 'center',
          marginTop: 8,
        },
        skeletonImage: {
          width: screenWidth,
          height: screenWidth * 0.8,
          backgroundColor: colors.backgroundSecondary,
        },
        skeletonTitle: {marginTop: 12, marginBottom: 8},
        skeletonDetail: {marginTop: 12},
      }),
    [colors, screenWidth],
  );

  return (
    <View style={styles.container}>
      <CustomHeader title="Vehicle Details" />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadVehicle(true)}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
          />
        }>
        {/* Image Carousel */}
        <View style={styles.imageCarousel}>
          {loading ? (
            <SkeletonLoader width={screenWidth} height={screenWidth * 0.8} borderRadius={0} />
          ) : images.length > 0 ? (
            <>
              <ScrollView
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
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {images.length > 1 && (
                <View style={styles.pagination}>
                  {images.map((_, index) => (
                    <View
                      key={index}
                      style={[styles.dot, index === currentImageIndex && styles.activeDot]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={[styles.image, {justifyContent: 'center', alignItems: 'center'}]}>
              <Icon name="car-outline" size={RFValue(48)} color={colors.disabled} />
            </View>
          )}
        </View>

        <View style={styles.detailsContainer}>
          {loading ? (
            <>
              <SkeletonLoader width="70%" height={24} borderRadius={4} style={styles.skeletonTitle} />
              <SkeletonLoader width="100%" height={16} borderRadius={4} style={styles.skeletonDetail} />
              <SkeletonLoader width="80%" height={16} borderRadius={4} style={styles.skeletonDetail} />
            </>
          ) : vehicle ? (
            <>
              {/* Vehicle Title */}
              <View style={styles.titleRow}>
                <CustomText fontFamily={Fonts.Bold} variant="h4" style={styles.title}>
                  {vehicle.brand} {vehicle.model}
                </CustomText>
              </View>

              {/* Vehicle Details */}
              <CustomText fontFamily={Fonts.Bold} style={styles.sectionTitle}>
                Vehicle Information
              </CustomText>

              {vehicle.numberPlate && (
                <View style={styles.detailRow}>
                  <CustomText style={styles.detailLabel}>Number Plate</CustomText>
                  <CustomText style={styles.detailValue}>{vehicle.numberPlate}</CustomText>
                </View>
              )}

              {vehicle.year && (
                <View style={styles.detailRow}>
                  <CustomText style={styles.detailLabel}>Year</CustomText>
                  <CustomText style={styles.detailValue}>{vehicle.year}</CustomText>
                </View>
              )}

              {vehicle.color && (
                <View style={styles.detailRow}>
                  <CustomText style={styles.detailLabel}>Color</CustomText>
                  <CustomText style={styles.detailValue}>{vehicle.color}</CustomText>
                </View>
              )}

              {/* Documents Section */}
              <CustomText fontFamily={Fonts.Bold} style={styles.sectionTitle}>
                Documents
              </CustomText>

              <View style={styles.documentsSection}>
                {documentTypes.map((type) => (
                  <DocumentCard
                    key={type}
                    type={type}
                    label={getDocumentLabel(type)}
                    icon={getDocumentIcon(type)}
                    documentUrl={vehicle.documents?.[type]}
                    onUpload={() => handleDocumentUpload(type)}
                    onView={() => handleDocumentView(type)}
                    isUploading={uploadingDoc === type}
                    colors={colors}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="alert-circle-outline" size={RFValue(48)} color={colors.disabled} />
              <CustomText style={styles.emptyText}>Vehicle not found</CustomText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <ImagePreviewModal
          visible={!!viewingDocument}
          images={[viewingDocument]}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </View>
  );
};

export default UserVehicleDetail;
