import React, {FC} from 'react';
import {View, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {RFValue} from 'react-native-responsive-fontsize';
import type {CategoryType} from '../../types/category/ICategoryItem';

const SECTION_COPY: Record<
  CategoryType,
  { title: string; message: string; icon: string }
> = {
  products: {
    title: 'No product categories yet',
    message: 'Categories appear here when dealers add products to inventory.',
    icon: 'cube-outline',
  },
  vehicles: {
    title: 'No vehicle listings yet',
    message: 'Dealer vehicles appear here once they are listed as available.',
    icon: 'car-outline',
  },
  services: {
    title: 'No service categories yet',
    message: 'Service category tiles show up once matching products are listed.',
    icon: 'construct-outline',
  },
};

interface StoreCategorySectionEmptyProps {
  section: CategoryType;
}

const StoreCategorySectionEmpty: FC<StoreCategorySectionEmptyProps> = ({section}) => {
  const {colors} = useTheme();
  const copy = SECTION_COPY[section];

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 28,
      paddingHorizontal: 16,
      marginVertical: 6,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
    },
    iconWrap: {
      marginBottom: 10,
      opacity: 0.45,
    },
    title: {
      marginBottom: 6,
      textAlign: 'center',
    },
    message: {
      textAlign: 'center',
      opacity: 0.65,
      lineHeight: RFValue(16),
    },
  });

  return (
    <View style={styles.container}>
      <Icon
        name={copy.icon}
        size={32}
        color={colors.textSecondary}
        style={styles.iconWrap}
      />
      <CustomText
        variant="h8"
        fontFamily={Fonts.SemiBold}
        style={[styles.title, {color: colors.text}]}>
        {copy.title}
      </CustomText>
      <CustomText
        variant="h9"
        fontFamily={Fonts.Regular}
        style={[styles.message, {color: colors.textSecondary}]}>
        {copy.message}
      </CustomText>
    </View>
  );
};

export default StoreCategorySectionEmpty;
