import { StyleSheet, View, type ViewStyle } from 'react-native';

import { themeLight as colors } from '@theme/colors';

interface BottomSheetProps {
  children?: React.ReactNode;
}

export function BottomSheet({ children }: BottomSheetProps) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  } satisfies ViewStyle,
});
