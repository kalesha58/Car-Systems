import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBreakpoint } from '@hooks/useBreakpoint';
import { useColors } from '@hooks/useColors';

export type SheetPresentation = 'sheet' | 'modal' | 'panel' | 'auto';

type AdaptiveSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /**
   * `auto` → sheet on phone/tablet, modal on desktop.
   * `panel` → right drawer on desktop, sheet on phone.
   */
  presentation?: SheetPresentation;
  /** Max height fraction for bottom sheet (0–1). */
  maxHeightRatio?: number;
  contentStyle?: StyleProp<ViewStyle>;
  animationType?: 'slide' | 'fade' | 'none';
};

function resolvePresentation(
  requested: SheetPresentation,
  isDesktop: boolean,
): 'sheet' | 'modal' | 'panel' {
  if (requested === 'auto') return isDesktop ? 'modal' : 'sheet';
  if (!isDesktop && (requested === 'modal' || requested === 'panel')) return 'sheet';
  return requested;
}

/**
 * Adaptive overlay: bottom sheet on mobile, centered dialog or right panel on desktop.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  presentation = 'auto',
  maxHeightRatio = 0.9,
  contentStyle,
  animationType,
}: AdaptiveSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useBreakpoint();
  const mode = resolvePresentation(presentation, isDesktop);
  const anim =
    animationType ?? (mode === 'sheet' ? 'slide' : mode === 'panel' ? 'slide' : 'fade');

  return (
    <Modal visible={visible} transparent animationType={anim} onRequestClose={onClose}>
      <View
        style={[
          styles.backdrop,
          mode === 'sheet' && styles.backdropEnd,
          mode === 'modal' && styles.backdropCenter,
          mode === 'panel' && styles.backdropPanel,
        ]}
      >
        <Pressable style={styles.backdropTouchable} onPress={onClose} />
        <View
          style={[
            styles.surface,
            { backgroundColor: colors.card },
            mode === 'sheet' && [
              styles.sheet,
              {
                maxHeight: `${Math.round(maxHeightRatio * 100)}%` as unknown as number,
                paddingBottom: insets.bottom + 16,
              },
            ],
            mode === 'modal' && [styles.modal, { paddingBottom: 16 }],
            mode === 'panel' && [
              styles.panel,
              { paddingBottom: insets.bottom + 16, paddingTop: insets.top + 12 },
            ],
            contentStyle,
          ]}
        >
          {mode === 'sheet' ? <View style={[styles.handle, { backgroundColor: colors.border }]} /> : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdropEnd: { justifyContent: 'flex-end' },
  backdropCenter: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  backdropPanel: { flexDirection: 'row', justifyContent: 'flex-end' },
  backdropTouchable: { ...StyleSheet.absoluteFill },
  surface: {
    zIndex: 1,
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modal: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  panel: {
    width: '100%',
    maxWidth: 400,
    height: '100%',
    paddingHorizontal: 20,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
});

/** Legacy alias used by older call sites that only wrapped children. */
export function SheetSurface({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  return (
    <View style={[{ backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }, style]}>
      {children}
    </View>
  );
}
