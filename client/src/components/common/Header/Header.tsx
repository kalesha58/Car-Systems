import React, {FC} from 'react';
import {View, StyleSheet} from 'react-native';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {RFValue} from 'react-native-responsive-fontsize';

interface IHeaderProps {
  title: string;
}

const Header: FC<IHeaderProps> = ({title}) => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: RFValue(20),
      fontWeight: '700',
    },
  });

  return (
    <View style={styles.container}>
      <CustomText variant="h2" fontFamily={Fonts.Bold} style={styles.title}>
        {title}
      </CustomText>
    </View>
  );
};

export default Header;

