import React, {FC, useState} from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  SafeAreaView,
  StatusBar,
  Share,
} from 'react-native';
import {WebView} from 'react-native-webview';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import {Fonts, MIN_TOUCH_TARGET} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';

interface InAppBrowserModalProps {
  visible: boolean;
  url: string;
  onClose: () => void;
  title?: string;
  orderId?: string;
}

const InAppBrowserModal: FC<InAppBrowserModalProps> = ({
  visible,
  url,
  onClose,
  title = 'Order Invoice',
  orderId = 'invoice',
}) => {
  const {colors} = useTheme();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleShare = async () => {
    if (!url) return;
    try {
      await Share.share({
        message: `Order Invoice link: ${url}`,
        title: `Invoice - ${orderId}`,
      });
    } catch (error) {
      console.log('Share error:', error);
      Alert.alert('Share Failed', 'Unable to share invoice link.');
    }
  };

  const handleDownload = async () => {
    if (!url) return;
    setDownloading(true);
    try {
      const {dirs} = ReactNativeBlobUtil.fs;
      const dirToSave = Platform.OS === 'ios' ? dirs.DocumentDir : dirs.DownloadDir;
      const fileName = `invoice_${orderId}.html`;
      const filePath = `${dirToSave}/${fileName}`;

      const configOptions = {
        fileCache: true,
        path: filePath,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: filePath,
          description: 'Downloading invoice to files',
          mime: 'text/html',
          title: fileName,
        },
      };

      const res = await ReactNativeBlobUtil.config(configOptions).fetch('GET', url);
      
      if (Platform.OS === 'ios') {
        ReactNativeBlobUtil.ios.previewDocument(res.path());
      } else {
        Alert.alert(
          'Success',
          `Invoice downloaded successfully as ${fileName}. You can find it in your device's Downloads folder.`
        );
      }
    } catch (error) {
      console.log('Download error:', error);
      Alert.alert('Download Failed', 'Unable to save invoice to the file system.');
    } finally {
      setDownloading(false);
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.secondary,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      height: 56,
      backgroundColor: colors.secondary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
    },
    leftActions: {
      width: 80,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    rightActions: {
      width: 80,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
    },
    headerButton: {
      width: MIN_TOUCH_TARGET,
      height: MIN_TOUCH_TARGET,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      color: colors.white,
      flex: 1,
      textAlign: 'center',
    },
    webview: {
      flex: 1,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={false}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.secondary} />
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.leftActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close browser">
                <Icon name="close" size={RFValue(20)} color={colors.white} />
              </TouchableOpacity>
            </View>

            <CustomText
              variant="h5"
              fontFamily={Fonts.SemiBold}
              style={styles.headerTitle}
              numberOfLines={1}>
              {title}
            </CustomText>

            <View style={styles.rightActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel="Share link">
                <Icon name="share-social-outline" size={RFValue(18)} color={colors.white} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleDownload}
                disabled={downloading}
                accessibilityRole="button"
                accessibilityLabel="Download file">
                {downloading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Icon name="download-outline" size={RFValue(18)} color={colors.white} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* WebView */}
          <WebView
            source={{uri: url}}
            style={styles.webview}
            onLoadStart={() => {
              console.log('WebView loading URI:', url);
              setLoading(true);
            }}
            onLoadEnd={() => setLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              Alert.alert('Load Failed', 'Failed to load the invoice page.');
              setLoading(false);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              const { statusCode } = nativeEvent;
              console.warn('WebView HTTP error: ', nativeEvent);
              Alert.alert('Load Failed', `HTTP error ${statusCode} occurred while loading invoice.`);
              setLoading(false);
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            originWhitelist={['*']}
            mixedContentMode="always"
            allowsInlineMediaPlayback={true}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.secondary} />
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default InAppBrowserModal;
