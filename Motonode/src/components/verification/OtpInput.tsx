import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { OTP_LENGTH } from '@config/otpConfig';
import { useColors } from '@hooks/useColors';
import { typography } from '@theme/typography';

interface OtpInputProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  length?: number;
  hasError?: boolean;
}

export function OtpInput({
  value,
  onChange,
  disabled = false,
  autoFocus = true,
  length = OTP_LENGTH,
  hasError = false,
}: OtpInputProps) {
  const colors = useColors();
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputsRef.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const updateAtIndex = (index: number, char: string) => {
    const next = [...digits.map(d => (d === ' ' ? '' : d))];
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

  return (
    <View style={styles.wrapper}>
      <TextInput
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
        {Array.from({ length }).map((_, index) => {
          const isFocused = focusedIndex === index && !disabled;
          const isFilled = Boolean(digits[index]?.trim());
          const borderColor = hasError
            ? colors.destructive
            : isFocused
              ? colors.primary
              : isFilled
                ? colors.border
                : colors.border;

          return (
            <View
              key={index}
              style={[
                styles.cellWrapper,
                {
                  borderColor,
                  backgroundColor: colors.card,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              <TextInput
                ref={ref => {
                  inputsRef.current[index] = ref;
                }}
                style={[
                  styles.box,
                  {
                    color: colors.textPrimary,
                    backgroundColor: isFocused ? '#E6001214' : colors.muted,
                  },
                ]}
                value={digits[index] === ' ' ? '' : digits[index]}
                onChangeText={t => handleChange(index, t)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                onFocus={() => setFocusedIndex(index)}
                keyboardType="number-pad"
                maxLength={length}
                editable={!disabled}
                selectTextOnFocus
                textAlign="center"
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

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
    gap: 10,
  },
  cellWrapper: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  box: {
    height: 54,
    borderRadius: 12,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
});
