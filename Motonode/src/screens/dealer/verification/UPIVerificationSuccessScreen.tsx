import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

import { PrimaryButton } from '@components/buttons';
import { DealerStackRoutes } from '@constants/routes';
import { useColors } from '@hooks/useColors';
import type { DealerStackParamList } from '@navigation/DealerNavigator';
import { successHaptic } from '@utils/haptics';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';

type Props = NativeStackScreenProps<
  DealerStackParamList,
  typeof DealerStackRoutes.UPIVerificationSuccess
>;

export function UPIVerificationSuccessScreen({ navigation, route }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(0)).current;
  const { upiId, accountHolderName } = route.params;

  useEffect(() => {
    successHaptic();
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const handleDone = () => {
    navigation.navigate({
      name: DealerStackRoutes.BusinessRegistration,
      params: {
        upiVerificationResult: {
          upiId,
          accountHolderName,
          verified: true,
        },
      },
      merge: true,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#FFFFFF', '#F8F8F8']} style={StyleSheet.absoluteFill} />
      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Feather name="check-circle" size={88} color="#28A745" />
        </Animated.View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>UPI ID Validated Successfully!</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.upiLogo}>
            <Text style={styles.upiLogoText}>UPI</Text>
          </View>
          <Text style={[styles.upiId, { color: colors.textPrimary }]}>{upiId}</Text>
          <Text style={[styles.holderName, { color: colors.textSecondary }]}>{accountHolderName}</Text>
          <View style={styles.verifiedBadge}>
            <Feather name="check" size={12} color="#28A745" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </View>

        <PrimaryButton label="Done" onPress={handleDone} style={styles.button} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  upiLogo: {
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upiLogoText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.sm,
  },
  upiId: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  holderName: {
    fontSize: typography.fontSize.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#28A74518',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: spacing.xs,
  },
  verifiedText: {
    color: '#28A745',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  button: {
    width: '100%',
  },
});
