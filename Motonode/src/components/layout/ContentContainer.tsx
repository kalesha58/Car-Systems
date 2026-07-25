import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useBreakpoint } from '@hooks/useBreakpoint';
import { CONTENT_MAX_WIDTH } from '@theme/breakpoints';

type ContentContainerProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** When false, skip horizontal padding (parent already padded). Default true. */
  padded?: boolean;
};

/**
 * Centers page content with a ~1200px max width and responsive horizontal padding.
 */
export function ContentContainer({
  children,
  style,
  padded = true,
}: ContentContainerProps) {
  const { contentPadding } = useBreakpoint();

  return (
    <View
      style={[
        styles.root,
        padded && { paddingHorizontal: contentPadding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
});
