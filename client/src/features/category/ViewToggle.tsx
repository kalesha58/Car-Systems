import React, {FC} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Colors} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';

export type ViewMode = 'grid' | 'list';

interface IViewToggleProps {
  viewMode: ViewMode;
  onToggle: (mode: ViewMode) => void;
}

const ViewToggle: FC<IViewToggleProps> = ({viewMode, onToggle}) => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      padding: 2,
    },
    button: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activeButton: {
      backgroundColor: Colors.secondary,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, viewMode === 'grid' && styles.activeButton]}
        onPress={() => onToggle('grid')}
        activeOpacity={0.7}>
        <Icon
          name="grid"
          color={viewMode === 'grid' ? '#fff' : colors.text}
          size={RFValue(18)}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, viewMode === 'list' && styles.activeButton]}
        onPress={() => onToggle('list')}
        activeOpacity={0.7}>
        <Icon
          name="list"
          color={viewMode === 'list' ? '#fff' : colors.text}
          size={RFValue(18)}
        />
      </TouchableOpacity>
    </View>
  );
};

export default ViewToggle;

