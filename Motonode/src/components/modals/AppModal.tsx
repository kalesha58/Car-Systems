import { Modal, StyleSheet, View, type ViewStyle } from 'react-native';

interface AppModalProps {
  visible: boolean;
  children?: React.ReactNode;
  onRequestClose?: () => void;
}

export function AppModal({ visible, children, onRequestClose }: AppModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.backdrop}>
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  } satisfies ViewStyle,
});
