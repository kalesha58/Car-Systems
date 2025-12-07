import React, {FC} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {useTheme} from '@hooks/useTheme';

const Loader: FC = () => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

export default Loader;

