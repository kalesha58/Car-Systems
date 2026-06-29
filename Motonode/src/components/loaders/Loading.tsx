import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useColors } from '@hooks/useColors';

interface LoadingProps {
  size?: 'small' | 'large';
}

export function Loading({ size = 'large' }: LoadingProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
