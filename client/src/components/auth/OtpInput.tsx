import React, { useRef, useEffect, FC } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';
import { useTheme } from '@hooks/useTheme';

const OTP_LENGTH = 6;

type OtpInputProps = {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

const OtpInput: FC<OtpInputProps> = ({ value, onChange, disabled = false, autoFocus = true }) => {
  const { colors } = useTheme();
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('');

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputsRef.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const updateAtIndex = (index: number, char: string) => {
    const next = [...digits.map((d) => (d === ' ' ? '' : d))];
    next[index] = char;
    onChange(next.join('').replace(/\s/g, ''));
  };

  const handleChange = (index: number, text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, OTP_LENGTH);
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      inputsRef.current[focusIndex]?.focus();
      return;
    }
    if (cleaned.length === 1) {
      updateAtIndex(index, cleaned);
      if (index < OTP_LENGTH - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    } else if (text === '') {
      updateAtIndex(index, '');
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index]?.trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
      updateAtIndex(index - 1, '');
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length: OTP_LENGTH }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputsRef.current[index] = ref;
          }}
          style={[
            styles.box,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
              color: colors.text,
            },
          ]}
          value={digits[index] === ' ' ? '' : digits[index]}
          onChangeText={(t) => handleChange(index, t)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          editable={!disabled}
          selectTextOnFocus
          textAlign="center"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    height: RFValue(48),
    borderWidth: 1,
    borderRadius: 8,
    fontFamily: Fonts.SemiBold,
    fontSize: RFValue(18),
  },
});

export default OtpInput;
