import React, {FC, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';
import {screenWidth, screenHeight} from '@utils/Scaling';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@hooks/useTheme';

interface ImagePreviewModalProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

const ImagePreviewModal: FC<ImagePreviewModalProps> = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
}) => {
  const {colors} = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollViewRef = useRef<ScrollView>(null);
  const width = Dimensions.get('window').width;
  const height = Dimensions.get('window').height;

  // Reset to initial index when modal opens
  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      // Scroll to initial index after a short delay to ensure ScrollView is mounted
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: initialIndex * width,
          animated: false,
        });
      }, 100);
    }
  }, [visible, initialIndex, width]);

  if (!images || images.length === 0) {
    return null;
  }

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const snapOffsets = images.map((_, index: number) => index * width);

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      flex: 1,
      width: width,
      height: height,
    },
    scrollView: {
      flex: 1,
    },
    imageContainer: {
      width: width,
      height: height,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: width,
      height: height * 0.8,
      resizeMode: 'contain',
    },
    closeButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    counterContainer: {
      position: 'absolute',
      top: 50,
      left: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      zIndex: 10,
    },
    counterText: {
      color: '#fff',
      fontSize: RFValue(12),
      fontFamily: Fonts.Medium,
    },
    paginationContainer: {
      position: 'absolute',
      bottom: 40,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
      marginHorizontal: 4,
    },
    activeDot: {
      backgroundColor: '#fff',
      width: 10,
      height: 10,
      borderRadius: 5,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToOffsets={snapOffsets}
            snapToAlignment="start"
            style={styles.scrollView}>
            {images.map((imageUri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image
                  source={{uri: imageUri}}
                  style={styles.image}
                />
              </View>
            ))}
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={RFValue(24)} color="#fff" />
          </TouchableOpacity>

          {/* Image Counter */}
          {images.length > 1 && (
            <View style={styles.counterContainer}>
              <CustomText style={styles.counterText}>
                {currentIndex + 1} / {images.length}
              </CustomText>
            </View>
          )}

          {/* Pagination Dots */}
          {images.length > 1 && (
            <View style={styles.paginationContainer}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentIndex && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ImagePreviewModal;

