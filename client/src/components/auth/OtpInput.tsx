import React, { useRef, useEffect, FC, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';
import { useTheme } from '@hooks/useTheme';
import { OTP_LENGTH as DEFAULT_OTP_LENGTH } from '@config/otpAuthConfig';

type OtpInputProps = {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  length?: number;
};

const OtpInput: FC<OtpInputProps> = ({
  value,
  onChange,
  disabled = false,
  autoFocus = true,
  length = DEFAULT_OTP_LENGTH,
}) => {
  const { colors } = useTheme();
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const hiddenInputRef = useRef<TextInput | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

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

  const applyCode = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, '').slice(0, length);
    onChange(cleaned);
    const focusIndex = Math.min(cleaned.length, length - 1);
    setFocusedIndex(focusIndex);
    inputsRef.current[focusIndex]?.focus();
  };

  const handleChange = (index: number, text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      applyCode(cleaned);
      return;
    }
    if (cleaned.length === 1) {
      updateAtIndex(index, cleaned);
      if (index < length - 1) {
        inputsRef.current[index + 1]?.focus();
        setFocusedIndex(index + 1);
      }
    } else if (text === '') {
      updateAtIndex(index, '');
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index]?.trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
      updateAtIndex(index - 1, '');
    }
  };

  const getCellStyle = (index: number) => {
    const isFocused = focusedIndex === index && !disabled;
    const isFilled = Boolean(digits[index]?.trim());

    return {
      borderColor: isFocused ? colors.primary : isFilled ? colors.secondary : colors.border,
      backgroundColor: isFocused
        ? `${colors.primary}18`
        : isFilled
          ? colors.backgroundSecondary
          : colors.cardBackground,
      opacity: disabled ? 0.5 : 1,
      ...Platform.select({
        ios: {
          shadowColor: isFocused ? colors.primary : '#000',
          shadowOffset: { width: 0, height: isFocused ? 2 : 1 },
          shadowOpacity: isFocused ? 0.2 : 0.06,
          shadowRadius: isFocused ? 4 : 2,
        },
        android: {
          elevation: isFocused ? 3 : 1,
        },
      }),
    };
  };

  return (
    <View style={styles.wrapper}>
      <TextInput
        ref={hiddenInputRef}
        value={value}
        onChangeText={applyCode}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        maxLength={length}
        editable={!disabled}
        style={styles.hiddenInput}
        caretHidden
      />

      <View style={styles.row}>
        {Array.from({ length }).map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputsRef.current[index] = ref;
            }}
            style={[
              styles.box,
              getCellStyle(index),
              {
                color: colors.text,
              },
            ]}
            value={digits[index] === ' ' ? '' : digits[index]}
            onChangeText={(t) => handleChange(index, t)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
            onFocus={() => setFocusedIndex(index)}
            keyboardType="number-pad"
            maxLength={length}
            editable={!disabled}
            selectTextOnFocus
            textAlign="center"
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    height: RFValue(52),
    borderWidth: 1.5,
    borderRadius: 12,
    fontFamily: Fonts.SemiBold,
    fontSize: RFValue(20),
  },
});

export default OtpInput;
