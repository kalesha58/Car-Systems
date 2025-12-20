import React, {FC} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {ICategoryItem} from '../../types/category/ICategoryItem';

interface IBreadcrumbsProps {
  category: ICategoryItem | null;
  onCategoryPress?: () => void;
}

const Breadcrumbs: FC<IBreadcrumbsProps> = ({category, onCategoryPress}) => {
  const {colors} = useTheme();

  if (!category) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    breadcrumb: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    breadcrumbText: {
      fontSize: RFValue(11),
      marginHorizontal: 4,
    },
    separator: {
      marginHorizontal: 4,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.breadcrumb}
        onPress={onCategoryPress}
        activeOpacity={0.7}>
        <Icon name="home-outline" color={colors.text} size={RFValue(14)} />
        <CustomText
          variant="h7"
          fontFamily={Fonts.Medium}
          style={[styles.breadcrumbText, {color: colors.text}]}>
          Store
        </CustomText>
      </TouchableOpacity>
      <Icon
        name="chevron-forward"
        color={colors.disabled}
        size={RFValue(12)}
        style={styles.separator}
      />
      <CustomText
        variant="h7"
        fontFamily={Fonts.SemiBold}
        style={[styles.breadcrumbText, {color: colors.text}]}>
        {category.name}
      </CustomText>
    </View>
  );
};

export default Breadcrumbs;

