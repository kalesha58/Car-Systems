import {View, StyleSheet, TextInput, TouchableOpacity} from 'react-native';
import React, {FC, useState} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import {useTheme} from '@hooks/useTheme';

interface DeliveryInstructionsProps {
  onInstructionsChange?: (instructions: string) => void;
  onPreferenceChange?: (preference: DeliveryPreference) => void;
  initialInstructions?: string;
  initialPreference?: DeliveryPreference;
}

export interface DeliveryPreference {
  leaveAtDoor: boolean;
  preferredTime?: 'morning' | 'afternoon' | 'evening';
  contactBeforeDelivery: boolean;
}

const DeliveryInstructions: FC<DeliveryInstructionsProps> = ({
  onInstructionsChange,
  onPreferenceChange,
  initialInstructions = '',
  initialPreference,
}) => {
  const {colors} = useTheme();
  const [instructions, setInstructions] = useState(initialInstructions);
  const [preference, setPreference] = useState<DeliveryPreference>(
    initialPreference || {
      leaveAtDoor: false,
      contactBeforeDelivery: true,
    },
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInstructionsChange = (text: string) => {
    setInstructions(text);
    onInstructionsChange?.(text);
  };

  const updatePreference = (updates: Partial<DeliveryPreference>) => {
    const newPreference = {...preference, ...updates};
    setPreference(newPreference);
    onPreferenceChange?.(newPreference);
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.cardBackground}]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}>
        <View style={styles.headerContent}>
          <Icon name="note-text-outline" size={RFValue(20)} color={colors.text} />
          <CustomText variant="h7" fontFamily={Fonts.SemiBold} style={{marginLeft: 8}}>
            Delivery Instructions
          </CustomText>
        </View>
        <Icon
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={RFValue(20)}
          color={colors.text}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Add special instructions (e.g., Leave at door, Call before delivery)"
            placeholderTextColor={colors.disabled}
            value={instructions}
            onChangeText={handleInstructionsChange}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.preferencesContainer}>
            <TouchableOpacity
              style={[
                styles.preferenceOption,
                {
                  backgroundColor: preference.leaveAtDoor
                    ? colors.secondary + '20'
                    : colors.backgroundSecondary,
                  borderColor: preference.leaveAtDoor
                    ? colors.secondary
                    : colors.border,
                },
              ]}
              onPress={() => updatePreference({leaveAtDoor: !preference.leaveAtDoor})}
              activeOpacity={0.7}>
              <Icon
                name={preference.leaveAtDoor ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={RFValue(20)}
                color={preference.leaveAtDoor ? colors.secondary : colors.text}
              />
              <CustomText variant="h9" style={{marginLeft: 8}}>
                Leave at door
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.preferenceOption,
                {
                  backgroundColor: preference.contactBeforeDelivery
                    ? colors.secondary + '20'
                    : colors.backgroundSecondary,
                  borderColor: preference.contactBeforeDelivery
                    ? colors.secondary
                    : colors.border,
                },
              ]}
              onPress={() =>
                updatePreference({contactBeforeDelivery: !preference.contactBeforeDelivery})
              }
              activeOpacity={0.7}>
              <Icon
                name={
                  preference.contactBeforeDelivery
                    ? 'checkbox-marked'
                    : 'checkbox-blank-outline'
                }
                size={RFValue(20)}
                color={preference.contactBeforeDelivery ? colors.secondary : colors.text}
              />
              <CustomText variant="h9" style={{marginLeft: 8}}>
                Contact before delivery
              </CustomText>
            </TouchableOpacity>

            <View style={styles.timePreference}>
              <CustomText variant="h9" style={{marginBottom: 8}}>
                Preferred delivery time:
              </CustomText>
              <View style={styles.timeOptions}>
                {(['morning', 'afternoon', 'evening'] as const).map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      {
                        backgroundColor:
                          preference.preferredTime === time
                            ? colors.secondary + '20'
                            : colors.backgroundSecondary,
                        borderColor:
                          preference.preferredTime === time ? colors.secondary : colors.border,
                      },
                    ]}
                    onPress={() => updatePreference({preferredTime: time})}
                    activeOpacity={0.7}>
                    <CustomText
                      variant="h9"
                      style={{
                        color:
                          preference.preferredTime === time ? colors.secondary : colors.text,
                      }}>
                      {time.charAt(0).toUpperCase() + time.slice(1)}
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    marginVertical: 15,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    padding: 15,
    paddingTop: 0,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: RFValue(12),
    fontFamily: Fonts.Regular,
    minHeight: 80,
    marginBottom: 15,
  },
  preferencesContainer: {
    gap: 10,
  },
  preferenceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  timePreference: {
    marginTop: 8,
  },
  timeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  timeOption: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
});

export default DeliveryInstructions;

