import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import CustomButton from '@components/ui/CustomButton';
import { useTheme } from '@hooks/useTheme';
import { useToast } from '@hooks/useToast';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  getVehicleAlertReasons,
  lookupVehicleByPlate,
  createVehicleAlert,
  IVehicleAlertReason,
  VehicleAlertReasonCode,
} from '@service/vehicleAlertService';
import { push } from '@utils/NavigationUtils';

const VehicleAlertScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();

  const [reasons, setReasons] = useState<IVehicleAlertReason[]>([]);
  const [plate, setPlate] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [found, setFound] = useState(false);
  const [maskedPlate, setMaskedPlate] = useState('');
  const [selectedReason, setSelectedReason] = useState<VehicleAlertReasonCode | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getVehicleAlertReasons()
      .then(setReasons)
      .catch(() => setReasons([
        { code: 'blocking', label: 'Your vehicle is blocking' },
        { code: 'wrong_parking', label: 'You parked in our parking lot' },
        { code: 'emergency', label: "There's an emergency with your vehicle" },
        { code: 'other', label: 'Other' },
      ]));
  }, []);

  const handleLookup = async () => {
    if (!plate.trim()) {
      showError('Enter a vehicle number');
      return;
    }
    try {
      setLookupLoading(true);
      setFound(false);
      setSelectedReason(null);
      const result = await lookupVehicleByPlate(plate.trim());
      if (!result.found) {
        showError('Vehicle not found in our system');
        return;
      }
      setFound(true);
      setMaskedPlate(result.maskedPlate || plate.trim().toUpperCase());
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Lookup failed');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedReason) {
      showError('Please select a reason');
      return;
    }
    if (selectedReason === 'other' && !customMessage.trim()) {
      showError('Please enter your message');
      return;
    }

    try {
      setSubmitting(true);
      const alert = await createVehicleAlert({
        numberPlate: plate.trim(),
        reasonCode: selectedReason,
        customMessage: selectedReason === 'other' ? customMessage.trim() : undefined,
      });
      showSuccess('Alert sent to vehicle owner');
      if (alert.chatId) {
        push('ChatMessage', { chatId: alert.chatId });
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to send alert');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16 },
    alertBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: (colors.error || '#ef4444') + '15',
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.error || '#ef4444',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: colors.text,
      fontSize: RFValue(13),
      marginBottom: 12,
    },
    reasonChip: {
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
      backgroundColor: colors.card,
    },
    reasonChipSelected: {
      borderColor: colors.secondary,
      backgroundColor: colors.secondary + '15',
    },
    warningBox: {
      backgroundColor: '#fef3c7',
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#f59e0b',
    },
  });

  return (
    <View style={styles.container}>
      <CustomHeader title="Vehicle Alert" showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.alertBanner}>
          <Icon name="warning" size={RFValue(20)} color={colors.error || '#ef4444'} />
          <CustomText style={{ flex: 1, fontSize: RFValue(11), color: colors.text }}>
            Report a vehicle blocking access or parked incorrectly.
          </CustomText>
        </View>

        <CustomText fontFamily={Fonts.Bold} style={{ marginBottom: 8 }}>
          Vehicle number
        </CustomText>
        <TextInput
          style={styles.input}
          value={plate}
          onChangeText={text => {
            setPlate(text.toUpperCase());
            setFound(false);
            setSelectedReason(null);
          }}
          placeholder="e.g. KA01AB1234"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="characters"
        />
        <CustomButton
          title={lookupLoading ? 'Searching...' : 'Search Vehicle'}
          onPress={handleLookup}
          loading={lookupLoading}
        />

        {found && (
          <View style={{ marginTop: 20 }}>
            <CustomText style={{ color: colors.textSecondary, marginBottom: 12 }}>
              Vehicle found: {maskedPlate}
            </CustomText>
            <CustomText fontFamily={Fonts.Bold} style={{ marginBottom: 8 }}>
              Select reason
            </CustomText>
            {reasons.map(reason => (
              <TouchableOpacity
                key={reason.code}
                style={[
                  styles.reasonChip,
                  selectedReason === reason.code && styles.reasonChipSelected,
                ]}
                onPress={() => setSelectedReason(reason.code)}>
                <CustomText fontFamily={Fonts.Medium}>{reason.label}</CustomText>
              </TouchableOpacity>
            ))}

            {selectedReason === 'other' && (
              <>
                <View style={styles.warningBox}>
                  <CustomText style={{ fontSize: RFValue(11), color: '#92400e' }}>
                    Please send messages responsibly. Misuse may be reported and your account may be restricted.
                  </CustomText>
                </View>
                <TextInput
                  style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                  value={customMessage}
                  onChangeText={setCustomMessage}
                  placeholder="Describe the issue..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
              </>
            )}

            {selectedReason && selectedReason !== 'other' && (
              <CustomButton
                title="Send Alert"
                onPress={handleSend}
                loading={submitting}
                style={{ marginTop: 12 }}
              />
            )}
            {selectedReason === 'other' && customMessage.trim().length > 0 && (
              <CustomButton
                title="Send Alert"
                onPress={handleSend}
                loading={submitting}
                style={{ marginTop: 12 }}
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default VehicleAlertScreen;
