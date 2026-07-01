import React, { FC, useState } from 'react';
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
  Text,
} from 'react-native';
import { WebView } from 'react-native-webview';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Feather from 'react-native-vector-icons/Feather';
import { useColors } from '@hooks/useColors';

interface InAppBrowserModalProps {
  visible: boolean;
  url: string;
  onClose: () => void;
  title?: string;
  orderId?: string;
}

const MIN_TOUCH_TARGET = 44;

export const InAppBrowserModal: FC<InAppBrowserModalProps> = ({
  visible,
  url,
  onClose,
  title = 'Order Invoice',
  orderId = 'invoice',
}) => {
  const colors = useColors();
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
      const { dirs } = ReactNativeBlobUtil.fs;
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
      backgroundColor: '#E60012',
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      height: 56,
      backgroundColor: '#E60012',
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
      gap: 12,
    },
    headerButton: {
      width: MIN_TOUCH_TARGET,
      height: MIN_TOUCH_TARGET,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      color: '#ffffff',
      fontSize: 16,
      fontFamily: 'Inter_700Bold',
      flex: 1,
      textAlign: 'center',
    },
    webview: {
      flex: 1,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFill,
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
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#E60012" />
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.leftActions}>
              <TouchableOpacity style={styles.headerButton} onPress={onClose} hitSlop={12}>
                <Feather name="x" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            
            <View style={styles.rightActions}>
              <TouchableOpacity style={styles.headerButton} onPress={handleShare} hitSlop={12}>
                <Feather name="share-2" size={20} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerButton} 
                onPress={handleDownload} 
                disabled={downloading}
                hitSlop={12}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Feather name="download" size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* WebView */}
          <WebView
            source={{ uri: url }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              Alert.alert('Load Failed', 'Failed to load the invoice page.');
            }}
          />

          {/* Loading state overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#E60012" />
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};
